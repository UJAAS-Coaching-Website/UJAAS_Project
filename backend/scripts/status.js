import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const requiredTables = [
  "users",
  "students",
  "faculties",
  "batches",
  "faculty_batches",
  "notes",
  "tests",
  "test_attempts",
  "notifications",
  "student_ratings"
];

async function run() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );
    const existing = new Set(res.rows.map(r => r.tablename));
    const missing = requiredTables.filter(t => !existing.has(t));

    if (missing.length === 0) {
      console.log("DB status: OK (all required tables exist)");
      process.exit(0);
    }

    console.log("DB status: MISSING TABLES");
    console.log(missing.join(", "));
    process.exit(1);
  } catch (err) {
    console.error("DB status check failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
