import { pool } from '../src/db/index.js';

async function checkNotificationsSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    console.log('Actual notifications table columns:');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkNotificationsSchema();
