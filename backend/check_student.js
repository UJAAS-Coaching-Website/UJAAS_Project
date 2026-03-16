import { pool } from './src/db/index.js';

async function check() {
  const res = await pool.query("SELECT user_id, assigned_batch_id FROM students WHERE user_id = '7a7f3880-3521-472d-bb6e-e2b78df9ef54'");
  console.log(res.rows);
  process.exit(0);
}
check();
