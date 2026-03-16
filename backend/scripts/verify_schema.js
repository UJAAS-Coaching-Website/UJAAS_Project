import pg from 'pg';
import "dotenv/config";
const { Pool } = pg;

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log('--- Checking student_ratings Table ---');
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_ratings'");
        console.log('Current Columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`));
        
        console.log('\n--- Checking Migration History ---');
        const migs = await pool.query("SELECT name, applied_at FROM _migrations ORDER BY id ASC");
        console.table(migs.rows);
        
    } catch (e) {
        console.error('Check failed:', e.message);
    } finally {
        await pool.end();
    }
}
check();
