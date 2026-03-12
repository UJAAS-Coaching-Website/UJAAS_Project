import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'd:/UJAAS_Project/backend/.env' });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        console.log("\nChecking columns for 'batches' table in public schema:");
        const batchesCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'batches' AND table_schema = 'public'
        `);
        console.log(JSON.stringify(batchesCols.rows, null, 2));

        console.log("\nChecking columns for 'faculties' table:");
        const facultiesCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'faculties'
        `);
        console.log(JSON.stringify(facultiesCols.rows, null, 2));

    } catch (err) {
        console.error("Error checking schema:", err);
    } finally {
        await pool.end();
    }
}

checkSchema();
