import { NextResponse } from "next/server";
import { Pool } from "pg";

// WORKAROUND: Fix for Supabase self-signed cert error in dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET(request: Request) {
    try {
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
            // 1. Calculate Paddy Stock (Raw Material)
            // In: Procurement, Out: Production Input
            const paddyQuery = `
                SELECT 
                    (SELECT COALESCE(SUM(net_weight), 0) FROM paddy_procurement) as total_purchased,
                    (SELECT COALESCE(SUM(input_qty), 0) FROM production_batch WHERE input_item ILIKE '%Paddy%') as total_consumed
            `;
            const paddyRes = await client.query(paddyQuery);
            const paddyStock = Number(paddyRes.rows[0].total_purchased) - Number(paddyRes.rows[0].total_consumed);

            // 2. Calculate Rice Stock (Finished Goods)
            // In: Production Output, Out: Sales

            // Production Totals
            const productionQuery = `
                SELECT 
                    COALESCE(SUM(output_head_rice), 0) as total_head,
                    COALESCE(SUM(output_broken_rice), 0) as total_broken,
                    COALESCE(SUM(output_bran), 0) as total_bran,
                    COALESCE(SUM(output_husk), 0) as total_husk
                FROM production_batch
            `;
            const productionRes = await client.query(productionQuery);

            // Sales Totals (GROUP BY item name loosely matches)
            // In a strict system, we'd use Item IDs. Here we use string matching for simplicity/speed.
            const salesQuery = `
                SELECT 
                    SUM(CASE WHEN item_name ILIKE '%Head%' OR item_name ILIKE '%Super%' THEN quantity ELSE 0 END) as sold_head,
                    SUM(CASE WHEN item_name ILIKE '%Broken%' OR item_name ILIKE '%Tota%' THEN quantity ELSE 0 END) as sold_broken,
                    SUM(CASE WHEN item_name ILIKE '%Bran%' THEN quantity ELSE 0 END) as sold_bran,
                    SUM(CASE WHEN item_name ILIKE '%Husk%' THEN quantity ELSE 0 END) as sold_husk
                FROM sales_invoice_items
            `;
            const salesRes = await client.query(salesQuery);

            const production = productionRes.rows[0];
            const sales = salesRes.rows[0];

            return NextResponse.json({
                raw_material: {
                    paddy: paddyStock,
                },
                finished_goods: {
                    head_rice: Number(production.total_head) - Number(sales.sold_head),
                    broken_rice: Number(production.total_broken) - Number(sales.sold_broken),
                    bran: Number(production.total_bran) - Number(sales.sold_bran),
                    husk: Number(production.total_husk) - Number(sales.sold_husk),
                }
            });

        } finally {
            client.release();
            await pool.end();
        }
    } catch (error) {
        console.error("Fetch Inventory Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch inventory" },
            { status: 500 }
        );
    }
}
