import dns from "node:dns";
import { Pool } from "pg";
import { databaseUrl } from "../config/index.js";

// Prefer IPv4 when a host resolves to both families. This avoids local IPv6
// connectivity issues that can surface as database login 500s on Windows.
dns.setDefaultResultOrder("ipv4first");

export const pool = new Pool({
    connectionString: databaseUrl,
    family: 4,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5,
});

// Prevent idle client errors from crashing the server
pool.on("error", (err) => {
    console.error("Unexpected database pool error:", err.message);
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
