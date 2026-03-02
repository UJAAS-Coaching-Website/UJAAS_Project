import { Pool } from "pg";
import { databaseUrl } from "../config/index.js";

export const pool = new Pool({
    connectionString: databaseUrl,
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
