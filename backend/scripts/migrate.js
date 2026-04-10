import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./load-env.js";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, "..", "migrations", "database_schema.sql");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in environment variables");
  process.exit(1);
}

async function run() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    const sql = await readFile(schemaPath, "utf8");
    console.log("Applying database schema from database_schema.sql...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✓ Schema applied successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Schema apply failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
