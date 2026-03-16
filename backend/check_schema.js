import { pool } from './src/db/index.js';

async function check() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_ratings'");
  console.log(res.rows);
  process.exit(0);
}
check();
