import dotenv from "dotenv";
import { pool } from "../src/db/index.js";

dotenv.config({ path: "d:/UJAAS_Project/backend/.env" });

const API_BASE_URL = process.env.CACHE_TEST_API_BASE_URL || "http://127.0.0.1:4000";
const ADMIN_LOGIN_ID = process.env.CACHE_TEST_ADMIN_LOGIN_ID;
const ADMIN_PASSWORD = process.env.CACHE_TEST_ADMIN_PASSWORD;

if (!ADMIN_LOGIN_ID || !ADMIN_PASSWORD) {
  console.error("Missing CACHE_TEST_ADMIN_LOGIN_ID or CACHE_TEST_ADMIN_PASSWORD");
  process.exit(1);
}

const tinyPngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR42mP4DwABAQEAG7buVwAAAABJRU5ErkJggg==",
  "base64"
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function jsonRequest(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

async function uploadAvatar(token) {
  const form = new FormData();
  form.append("avatar", new Blob([tinyPngBuffer], { type: "image/png" }), "avatar.png");

  const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

async function run() {
  console.log("[INFO] Running avatar DB persistence verification");

  const loginRes = await jsonRequest("/api/auth/login", {
    method: "POST",
    body: { loginId: ADMIN_LOGIN_ID, password: ADMIN_PASSWORD },
  });
  assert(loginRes.ok, `Admin login failed (${loginRes.status}): ${loginRes.data?.message || "unknown error"}`);

  const token = loginRes.data?.token;
  const userId = loginRes.data?.user?.id;
  assert(token, "Token missing in login response");
  assert(userId, "User id missing in login response");

  const uploadRes = await uploadAvatar(token);
  assert(uploadRes.ok, `Avatar upload failed (${uploadRes.status}): ${uploadRes.data?.message || "unknown error"}`);

  const avatarUrl = uploadRes.data?.avatarUrl;
  assert(typeof avatarUrl === "string" && avatarUrl.length > 10, "avatarUrl missing from upload response");

  const meRes = await jsonRequest("/api/auth/me", { token });
  assert(meRes.ok, `GET /api/auth/me failed (${meRes.status}): ${meRes.data?.message || "unknown error"}`);

  const meAvatar = meRes.data?.user?.avatarUrl || null;
  assert(meAvatar === avatarUrl, `API mismatch: me.avatarUrl != upload.avatarUrl (${meAvatar} vs ${avatarUrl})`);

  const dbRes = await pool.query("SELECT avatar_url FROM users WHERE id = $1", [userId]);
  assert(dbRes.rowCount === 1, "User row not found in DB");
  const dbAvatar = dbRes.rows[0]?.avatar_url || null;
  assert(dbAvatar === avatarUrl, `DB mismatch: users.avatar_url != upload.avatarUrl (${dbAvatar} vs ${avatarUrl})`);

  console.log(`[PASS] Avatar persisted in DB for user ${userId}`);
  console.log(`[PASS] users.avatar_url: ${dbAvatar}`);

  await jsonRequest("/api/profile/avatar", { method: "DELETE", token });
}

run()
  .then(async () => {
    await pool.end();
    console.log("✅ Avatar DB persistence verification passed");
  })
  .catch(async (error) => {
    await pool.end();
    console.error(`❌ Avatar DB persistence verification failed: ${error.message}`);
    process.exit(1);
  });
