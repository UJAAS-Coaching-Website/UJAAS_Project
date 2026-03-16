import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, "..", "migrations");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in environment variables");
  process.exit(1);
}

async function run() {
  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for some hosted providers like Supabase if not using proxy
  });
  
  const client = await pool.connect();
  
  try {
    // 1. Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Get list of already applied migrations
    const { rows: appliedRows } = await client.query("SELECT name FROM _migrations");
    const appliedMigrations = new Set(appliedRows.map(r => r.name));

    // 3. Get all migration files
    const migrationFiles = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .filter((file) => !file.toLowerCase().includes("seed"))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files.`);

    let appliedCount = 0;
    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) {
        continue;
      }

      console.log(`Applying migration: ${file}...`);
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`✓ Successfully applied ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`✗ Failed to apply ${file}:`, err.message);
        throw err; // Stop execution on failure
      }
    }

    if (appliedCount === 0) {
      console.log("Database is already up to date. No new migrations to apply.");
    } else {
      console.log(`Finished! Applied ${appliedCount} new migration(s).`);
    }

  } catch (err) {
    console.error("Migration process failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
