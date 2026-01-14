import { NextResponse } from "next/server";
import { Pool } from "pg";

// WORKAROUND: Fix for Supabase self-signed cert error in dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET(request: Request) {
    try {
        // Construct connection string similar to login route
        // Note: Reusing the same connection logic pattern
        // FIXME: Using hardcoded connection to bypass environment loading issues
        const connectionString = `postgres://postgres.fgoeivchvgrgcxtjvsjt:*Usamajay1122%23@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`;

        const pool = new Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false
            }
        });

        const client = await pool.connect();
        try {
            // Fetch all accounts to populate dropdowns
            // In a real scenario we might filter by account type if that column existed
            const result = await client.query(
                "SELECT id, name, legacy_pcode, address FROM accounts ORDER BY name ASC"
            );

            return NextResponse.json(result.rows);
        } finally {
            client.release();
            await pool.end();
        }
    } catch (error) {
        console.error("Fetch Accounts Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch accounts" },
            { status: 500 }
        );
    }
}
