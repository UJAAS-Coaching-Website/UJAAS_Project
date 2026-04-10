import dotenv from "dotenv";

dotenv.config({ path: "d:/UJAAS_Project/backend/.env" });

const API_BASE_URL = process.env.CACHE_TEST_API_BASE_URL || "http://localhost:4000";
const ADMIN_LOGIN_ID = process.env.CACHE_TEST_ADMIN_LOGIN_ID;
const ADMIN_PASSWORD = process.env.CACHE_TEST_ADMIN_PASSWORD;

if (!ADMIN_LOGIN_ID || !ADMIN_PASSWORD) {
  console.error("Missing CACHE_TEST_ADMIN_LOGIN_ID or CACHE_TEST_ADMIN_PASSWORD");
  process.exit(1);
}

if (typeof fetch !== "function") {
  console.error("Global fetch is not available. Use Node.js 18+.");
  process.exit(1);
}

async function apiRequest(path, { method = "GET", token, body } = {}) {
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

async function login() {
  const res = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { loginId: ADMIN_LOGIN_ID, password: ADMIN_PASSWORD },
  });

  if (!res.ok || !res.data?.token) {
    throw new Error(`Admin login failed (${res.status}): ${res.data?.message || "unknown error"}`);
  }

  return res.data.token;
}

async function run() {
  const token = await login();

  const subjectsRes = await apiRequest("/api/subjects", { token });
  if (!subjectsRes.ok || !Array.isArray(subjectsRes.data)) {
    throw new Error(`Failed to list subjects (${subjectsRes.status})`);
  }

  const generated = subjectsRes.data.filter((subject) => {
    const name = String(subject?.name || "").toLowerCase();
    return name.startsWith("cache-");
  });

  if (generated.length === 0) {
    console.log("No cache-* subjects found. Nothing to clean.");
    return;
  }

  console.log(`Found ${generated.length} cache-* subject(s). Deleting...`);

  let deleted = 0;
  let skipped = 0;

  for (const subject of generated) {
    const del = await apiRequest(`/api/subjects/${subject.id}`, {
      method: "DELETE",
      token,
    });

    if (del.ok) {
      deleted += 1;
      console.log(`Deleted: ${subject.name}`);
    } else {
      skipped += 1;
      console.log(`Skipped: ${subject.name} (${del.status}) ${del.data?.message || ""}`.trim());
    }
  }

  console.log(`Cleanup complete. Deleted=${deleted}, Skipped=${skipped}`);
}

run().catch((error) => {
  console.error(`Cleanup failed: ${error.message}`);
  process.exit(1);
});
