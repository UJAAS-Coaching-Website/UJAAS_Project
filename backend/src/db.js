import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database checks will fail.");
}

export const pool = new Pool({
  connectionString,
});

export async function checkDb() {
  const start = Date.now();
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT 1 AS ok");
    return {
      ok: result?.rows?.[0]?.ok === 1,
      latencyMs: Date.now() - start,
    };
  } finally {
    client.release();
  }
}
