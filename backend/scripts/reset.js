import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const dropSql = `
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS faculty_batches CASCADE;
DROP TABLE IF EXISTS student_batches CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
`;

async function run() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(dropSql);
    await client.query("COMMIT");
    console.log("DB reset complete (all tables dropped)");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DB reset failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
