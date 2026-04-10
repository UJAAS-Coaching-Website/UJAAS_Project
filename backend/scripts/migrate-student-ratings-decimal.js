import dotenv from "dotenv";
import { pool } from "../src/db/index.js";

dotenv.config({ path: "d:/UJAAS_Project/backend/.env" });

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      ALTER TABLE student_ratings
      ALTER COLUMN attendance TYPE numeric(5,2) USING attendance::numeric,
      ALTER COLUMN test_performance TYPE numeric(5,2) USING test_performance::numeric,
      ALTER COLUMN dpp_performance TYPE numeric(5,2) USING dpp_performance::numeric,
      ALTER COLUMN behavior TYPE numeric(5,2) USING behavior::numeric,
      ALTER COLUMN attendance SET DEFAULT 0,
      ALTER COLUMN test_performance SET DEFAULT 0,
      ALTER COLUMN dpp_performance SET DEFAULT 0,
      ALTER COLUMN behavior SET DEFAULT 0
    `);

    await client.query("COMMIT");
    console.log("✅ student_ratings columns migrated to numeric(5,2)");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
