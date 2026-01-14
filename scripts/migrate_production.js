const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

// WORKAROUND: Fix for Supabase self-signed cert error in dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function migrate() {
    // Construct connection string manually as per our pattern
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
        console.log("Adding columns to production_batch...");

        await client.query(`
            ALTER TABLE production_batch
            ADD COLUMN IF NOT EXISTS output_head_rice NUMERIC(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS output_broken_rice NUMERIC(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS output_bran NUMERIC(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS output_husk NUMERIC(10, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS output_dirt NUMERIC(10, 2) DEFAULT 0;
        `);

        console.log("Migration successful: Added output columns.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
