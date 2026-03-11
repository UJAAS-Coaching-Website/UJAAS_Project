import { pool } from './src/db/index.js';

async function checkCols() {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='questions'
    `);
    console.log('Columns in questions table:', res.rows.map(r => r.column_name).join(', '));
    process.exit(0);
  } catch(e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}
checkCols();
