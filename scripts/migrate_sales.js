const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

// WORKAROUND: Fix for Supabase self-signed cert error in dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function migrate() {
    // Construct connection string
    const dbUser = encodeURIComponent(process.env.DB_USER || '');
    const dbPass = encodeURIComponent(process.env.DB_PASSWORD || '').replace(/%2A/g, '*');
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbName = process.env.DB_NAME;

    const connectionString = `postgres://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;

    const pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    const client = await pool.connect();
    try {
        console.log("Creating Sales tables...");

        // 1. Sales Invoice Header
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_invoices (
                id SERIAL PRIMARY KEY,
                invoice_no VARCHAR(20) UNIQUE NOT NULL, -- E.g., INV-2023-001
                date DATE NOT NULL,
                account_id INTEGER REFERENCES accounts(id), -- Customer
                
                total_amount NUMERIC(14, 2) DEFAULT 0.00,
                discount_amount NUMERIC(14, 2) DEFAULT 0.00,
                final_amount NUMERIC(14, 2) DEFAULT 0.00,
                
                status VARCHAR(20) DEFAULT 'draft', -- draft, posted, paid
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Sales Invoice Items (Line Items)
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_invoice_items (
                id SERIAL PRIMARY KEY,
                invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE CASCADE,
                
                item_name VARCHAR(100) NOT NULL, -- e.g. "Super Basmati Rice 25kg"
                quantity NUMERIC(10, 2) NOT NULL,
                unit VARCHAR(20) DEFAULT 'kg', -- kg, bag, maund
                rate NUMERIC(12, 2) NOT NULL,
                amount NUMERIC(14, 2) NOT NULL
            );
        `);

        // 3. Link Financial Ledger to Invoices
        await client.query(`
            ALTER TABLE financial_ledger
            ADD COLUMN IF NOT EXISTS sales_invoice_id INTEGER REFERENCES sales_invoices(id);
        `);

        console.log("Migration successful: Sales tables created.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
