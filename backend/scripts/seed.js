import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./load-env.js";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.join(__dirname, "..", "migrations", "002_seed.sql");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function run() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    const seedFiles = (await readdir(path.join(__dirname, "..", "migrations")))
      .filter((file) => file.endsWith(".sql") && file.toLowerCase().includes("seed"))
      .sort();

    await client.query("BEGIN");
    for (const file of seedFiles) {
      const sql = await readFile(path.join(__dirname, "..", "migrations", file), "utf8");
      await client.query(sql);
      console.log(`Seed applied: ${file}`);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
