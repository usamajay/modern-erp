import { NextResponse } from "next/server";
import { Pool } from "pg";
import { z } from "zod";

// WORKAROUND: Fix for Supabase self-signed cert error in dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const PurchaseSchema = z.object({
    date: z.string(), // ISO Date string
    gate_pass_no: z.coerce.number(),
    vehicle_no: z.string().min(1, "Vehicle No is required"),
    driver_name: z.string().optional(),
    account_id: z.coerce.number(), // Vendor ID
    item_name: z.string().default("Basmati Paddy"),
    lot_no: z.coerce.number().optional(),
    bags: z.coerce.number().min(1, "Bags must be > 0"),
    bag_type: z.string().optional(),
    gross_weight: z.coerce.number(),
    tare_weight: z.coerce.number(),
    net_weight: z.coerce.number(),
    rate: z.coerce.number(),
    amount: z.coerce.number(),
    // Deductions
    deduction_bardana: z.coerce.number().default(0),
    deduction_labor: z.coerce.number().default(0),
    deduction_stiching: z.coerce.number().default(0),
    deduction_munshyana: z.coerce.number().default(0),
    deduction_sottri: z.coerce.number().default(0),
    deduction_moisture: z.coerce.number().default(0),
    final_amount: z.coerce.number(),
    remarks: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = PurchaseSchema.parse(body);

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

            const query = `
                INSERT INTO paddy_procurement (
                    date, gate_pass_no, vehicle_no, driver_name, account_id,
                    item_name, lot_no, bags, bag_type,
                    gross_weight, tare_weight, net_weight,
                    rate, amount,
                    deduction_bardana, deduction_labor, deduction_stiching,
                    deduction_munshyana, deduction_sottri, deduction_moisture,
                    final_amount, remarks
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9,
                    $10, $11, $12,
                    $13, $14,
                    $15, $16, $17,
                    $18, $19, $20,
                    $21, $22
                ) RETURNING id
            `;

            const values = [
                data.date, data.gate_pass_no, data.vehicle_no, data.driver_name, data.account_id,
                data.item_name, data.lot_no || 0, data.bags, data.bag_type,
                data.gross_weight, data.tare_weight, data.net_weight,
                data.rate, data.amount,
                data.deduction_bardana, data.deduction_labor, data.deduction_stiching,
                data.deduction_munshyana, data.deduction_sottri, data.deduction_moisture,
                data.final_amount, data.remarks
            ];

            const result = await client.query(query, values);
            const purchaseId = result.rows[0].id;

            // Post to Financial Ledger: Credit Vendor (Payable)
            // Note: In VFP/Accounting, purchasing goods means we OWE money, so Credit the Party.
            const ledgerQuery = `
                INSERT INTO financial_ledger (
                    date, voucher_type, voucher_no, account_id, 
                    description, debit, credit
                ) VALUES (
                    $1, 'PU', $2, $3, 
                    $4, 0, $5
                )
            `;

            await client.query(ledgerQuery, [
                data.date,
                purchaseId,
                data.account_id,
                `Paddy Purchase GP#${data.gate_pass_no} / ${data.vehicle_no}`,
                data.final_amount
            ]);

            await client.query("COMMIT");

            return NextResponse.json({
                success: true,
                id: result.rows[0].id,
                message: "Purchase Record Saved Successfully"
            });

        } finally {
            client.release();
            await pool.end();
        }
    } catch (error) {
        console.error("Create Purchase Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to create purchase record",
                details: error instanceof z.ZodError ? error.issues : undefined
            },
            { status: 400 }
        );
    }
}
