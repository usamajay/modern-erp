import { NextResponse } from "next/server";
import { Pool } from "pg";
import { z } from "zod";

// WORKAROUND: Fix for Supabase self-signed cert error in dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const VoucherSchema = z.object({
    date: z.string(),
    voucher_type: z.enum(["CP", "CR", "BP", "BR", "JV"]), // Cash Payment, Cash Receipt, Bank Payment, Bank Receipt, Journal Voucher
    voucher_no: z.coerce.number().optional(), // Can be auto-generated or manual
    account_id: z.coerce.number(),
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
    description: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = VoucherSchema.parse(body);

        const connectionString = process.env.DATABASE_URL || "";

        const pool = new Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false
            }
        });

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Determine Debit/Credit based on Voucher Type
            let debit = 0;
            let credit = 0;

            // Logic for the PARTY/ACCOUNT side of the transaction:
            switch (data.voucher_type) {
                case "CP": // Cash Payment to Party -> Party receives money -> Party DEBIT
                case "BP": // Bank Payment to Party -> Party DEBIT
                    debit = data.amount;
                    break;
                case "CR": // Cash Receipt from Party -> Party gives money -> Party CREDIT
                case "BR": // Bank Receipt from Party -> Party CREDIT
                    credit = data.amount;
                    break;
                case "JV": // Journal Voucher - Requires explicit direction, for simple UI we might default or need dual entry
                    // For a simple generic "Adjustment", let's assume specific logic or validation
                    // For now, let's error if JV is used without explicit instructions, or treat as Debit adjustment
                    // (Real JV needs 2 accounts selected. This API is 'Single Account Mode' mainly for Cash/Bank)
                    debit = data.amount; // Defaulting to Debit adjustment
                    break;
            }

            // check if description provided, else auto-gen
            const desc = data.description || `${data.voucher_type} - Manual Entry`;

            const query = `
                INSERT INTO financial_ledger (
                    date, voucher_type, voucher_no, account_id,
                    description, debit, credit
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7
                ) RETURNING id
            `;

            // Auto-generate voucher number if not provided (simple max + 1)
            let vNo = data.voucher_no;
            if (!vNo) {
                const maxRes = await client.query("SELECT COALESCE(MAX(voucher_no), 0) + 1 as next_no FROM financial_ledger WHERE voucher_type = $1", [data.voucher_type]);
                vNo = maxRes.rows[0].next_no;
            }

            const result = await client.query(query, [
                data.date,
                data.voucher_type,
                vNo,
                data.account_id,
                desc,
                debit,
                credit
            ]);

            await client.query("COMMIT");

            return NextResponse.json({
                success: true,
                id: result.rows[0].id,
                message: "Voucher Posted Successfully"
            });

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
            await pool.end();
        }
    } catch (error) {
        console.error("Create Voucher Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to create voucher",
                details: error instanceof z.ZodError ? error.issues : undefined
            },
            { status: 400 }
        );
    }
}
