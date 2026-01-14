import { NextResponse } from "next/server";
import { Pool } from "pg";

// WORKAROUND: Fix for Supabase self-signed cert error in dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get("account_id");
        const startDate = searchParams.get("start_date");
        const endDate = searchParams.get("end_date");

        // Construct connection string
        const connectionString = process.env.DATABASE_URL || "";

        const pool = new Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false
            }
        });

        const client = await pool.connect();
        try {
            let queryText = `
                SELECT 
                    fl.id,
                    fl.date,
                    fl.voucher_type,
                    fl.voucher_no,
                    fl.description,
                    fl.debit,
                    fl.credit,
                    a.name as account_name,
                    fl.sales_invoice_id
                FROM financial_ledger fl
                LEFT JOIN accounts a ON fl.account_id = a.id
                WHERE 1=1
            `;
            const queryParams: any[] = [];

            if (accountId) {
                queryParams.push(accountId);
                queryText += ` AND fl.account_id = $${queryParams.length}`;
            }

            if (startDate) {
                queryParams.push(startDate);
                queryText += ` AND fl.date >= $${queryParams.length}`;
            }

            if (endDate) {
                queryParams.push(endDate);
                queryText += ` AND fl.date <= $${queryParams.length}`;
            }

            queryText += ` ORDER BY fl.date DESC, fl.id DESC`;

            const result = await client.query(queryText, queryParams);

            // Calculate running balance (simple version, client-side preferred for complex date ranges)
            // For a true running balance, we'd need cumulative sum window functions or separate balance query

            return NextResponse.json(result.rows);
        } finally {
            client.release();
            await pool.end();
        }
    } catch (error) {
        console.error("Fetch Ledger Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch ledger" },
            { status: 500 }
        );
    }
}
