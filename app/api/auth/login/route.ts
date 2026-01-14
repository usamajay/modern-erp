import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { z } from "zod";

// WORKAROUND: Fix for Supabase self-signed cert error in dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const LoginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = LoginSchema.parse(body);

        // FIXME: Revert to process.env.DATABASE_URL or constructed string once process.env loading is stable
        const connectionString = `postgres://postgres.fgoeivchvgrgcxtjvsjt:*Usamajay1122%23@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`;

        const pool = new Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false
            }
        });

        const client = await pool.connect();
        try {
            const result = await client.query(
                "SELECT id, username, password_hash, role FROM users WHERE username = $1",
                [username]
            );

            const user = result.rows[0];

            if (!user) {
                return NextResponse.json(
                    { error: "Invalid username or password" },
                    { status: 401 }
                );
            }

            const isValid = await bcrypt.compare(password, user.password_hash);

            if (!isValid) {
                return NextResponse.json(
                    { error: "Invalid username or password" },
                    { status: 401 }
                );
            }

            return NextResponse.json({
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                },
            });
        } finally {
            client.release();
            await pool.end();
        }
    } catch (error) {
        console.error("Login Check Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Unknown Error",
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
