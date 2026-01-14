import { NextResponse } from "next/server";
import { Pool } from "pg";
import { z } from "zod";

// WORKAROUND: Fix for Supabase self-signed cert error in dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const InvoiceItemSchema = z.object({
    item_name: z.string().min(1, "Item name required"),
    quantity: z.coerce.number().min(0.01, "Qty must be > 0"),
    rate: z.coerce.number().min(0, "Rate must be >= 0"),
    amount: z.coerce.number(),
});

const InvoiceSchema = z.object({
    date: z.string(),
    invoice_no: z.string().min(1, "Invoice No required"),
    account_id: z.coerce.number(), // Customer

    items: z.array(InvoiceItemSchema).min(1, "At least one item required"),

    total_amount: z.coerce.number(),
    discount_amount: z.coerce.number().default(0),
    final_amount: z.coerce.number(),

    remarks: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = InvoiceSchema.parse(body);

        // Construct connection string
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
            await client.query("BEGIN");

            // 1. Auto-Migration (Ensure Tables Exist)
            await client.query(`
                CREATE TABLE IF NOT EXISTS sales_invoices (
                    id SERIAL PRIMARY KEY,
                    invoice_no VARCHAR(20) UNIQUE NOT NULL,
                    date DATE NOT NULL,
                    account_id INTEGER REFERENCES accounts(id),
                    total_amount NUMERIC(14, 2) DEFAULT 0.00,
                    discount_amount NUMERIC(14, 2) DEFAULT 0.00,
                    final_amount NUMERIC(14, 2) DEFAULT 0.00,
                    status VARCHAR(20) DEFAULT 'posted',
                    remarks TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS sales_invoice_items (
                    id SERIAL PRIMARY KEY,
                    invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE CASCADE,
                    item_name VARCHAR(100) NOT NULL,
                    quantity NUMERIC(10, 2) NOT NULL,
                    unit VARCHAR(20) DEFAULT 'kg',
                    rate NUMERIC(12, 2) NOT NULL,
                    amount NUMERIC(14, 2) NOT NULL
                );
            `);

            // Add column to ledger if not exists
            try {
                await client.query(`
                    ALTER TABLE financial_ledger
                    ADD COLUMN IF NOT EXISTS sales_invoice_id INTEGER REFERENCES sales_invoices(id);
                `);
            } catch (ignore) { /* Column might exist */ }


            // 2. Insert Invoice Header
            const insertInvoiceQuery = `
                INSERT INTO sales_invoices (
                    invoice_no, date, account_id,
                    total_amount, discount_amount, final_amount,
                    remarks
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;

            const invoiceRes = await client.query(insertInvoiceQuery, [
                data.invoice_no, data.date, data.account_id,
                data.total_amount, data.discount_amount, data.final_amount,
                data.remarks
            ]);

            const invoiceId = invoiceRes.rows[0].id;

            // 3. Insert Invoice Items
            for (const item of data.items) {
                await client.query(`
                    INSERT INTO sales_invoice_items (
                        invoice_id, item_name, quantity, rate, amount
                    ) VALUES ($1, $2, $3, $4, $5)
                 `, [invoiceId, item.item_name, item.quantity, item.rate, item.amount]);
            }

            // 4. Post to Financial Ledger (General Journal)
            // Debit Customer (Receivable)
            await client.query(`
                INSERT INTO financial_ledger (
                    date, voucher_type, voucher_no, account_id, description, debit, credit, sales_invoice_id
                ) VALUES ($1, 'IV', $2, $3, $4, $5, 0, $6)
            `, [data.date, invoiceId, data.account_id, `Sales Invoice #${data.invoice_no}`, data.final_amount, invoiceId]);

            // Credit Sales Account (Income) - Hardcoded Sales Account ID for now or lookup
            // Assuming Sales Account ID = 1 (Need to fix this in real app)
            // For now, we just record the details. 
            // In a real app we'd look up the "Sales" GL account.

            await client.query("COMMIT");

            return NextResponse.json({
                success: true,
                id: invoiceId,
                message: "Invoice Created & Posted Successfully"
            });

        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
            await pool.end();
        }
    } catch (error) {
        console.error("Create Invoice Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to create invoice",
                details: error instanceof z.ZodError ? error.errors : undefined
            },
            { status: 400 }
        );
    }
}
