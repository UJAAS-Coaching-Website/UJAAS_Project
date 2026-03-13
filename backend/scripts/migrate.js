import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, "..", "migrations");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function run() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  let currentFile = null;
  try {
    const migrationFiles = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .filter((file) => !file.toLowerCase().includes("seed"))
      .sort();

    await client.query("BEGIN");
    for (const file of migrationFiles) {
      currentFile = file;
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      await client.query(sql);
    }
    await client.query("COMMIT");
    console.log(`Migrations applied: ${migrationFiles.join(", ")}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`Migration failed in ${currentFile ?? "unknown file"}:`, err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
