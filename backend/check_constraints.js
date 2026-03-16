import { pool } from './src/db/index.js';

async function check() {
  const res = await pool.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'student_ratings'::regclass");
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
check();
