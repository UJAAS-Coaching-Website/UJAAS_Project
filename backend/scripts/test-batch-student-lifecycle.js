import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: "d:/UJAAS_Project/backend/.env" });

const { Pool } = pg;

const API_BASE_URL = process.env.CACHE_TEST_API_BASE_URL || "http://localhost:4000";
const ADMIN_LOGIN_ID = process.env.CACHE_TEST_ADMIN_LOGIN_ID;
const ADMIN_PASSWORD = process.env.CACHE_TEST_ADMIN_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL;

if (!ADMIN_LOGIN_ID || !ADMIN_PASSWORD) {
  console.error("Missing CACHE_TEST_ADMIN_LOGIN_ID or CACHE_TEST_ADMIN_PASSWORD");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const tag = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const subjectName = `lifecycle-subject-${tag}`;
const batchName = `lifecycle-batch-${tag}`;
const rollNumber = `LIFE-${tag}`;
const studentEmail = `lifecycle.student.${tag}@example.com`;

const state = {
  token: null,
  batchId: null,
  studentId: null,
  subjectId: null,
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
  assert(res.ok, `Login failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.token, "Login response missing token");
  state.token = res.data.token;
}

async function createBatch() {
  const res = await apiRequest("/api/batches", {
    method: "POST",
    token: state.token,
    body: { name: batchName, subjects: [subjectName] },
  });
  assert(res.ok, `Create batch failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.id, "Create batch response missing id");
  state.batchId = res.data.id;
}

async function createStudent() {
  const res = await apiRequest("/api/students", {
    method: "POST",
    token: state.token,
    body: {
      name: `Lifecycle Student ${tag}`,
      rollNumber,
      email: studentEmail,
      phone: "9999999999",
      address: "test",
      parentContact: "8888888888",
      batchId: state.batchId,
    },
  });
  assert(res.ok, `Create student failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.id, "Create student response missing id");
  state.studentId = res.data.id;
}

async function getStudentFromApi() {
  const res = await apiRequest(`/api/students?search=${encodeURIComponent(rollNumber)}`, {
    token: state.token,
  });
  assert(res.ok, `Student search failed (${res.status})`);
  const row = Array.isArray(res.data) ? res.data.find((entry) => entry?.id === state.studentId) : null;
  return row || null;
}

async function markBatchInactive() {
  const res = await apiRequest(`/api/batches/${state.batchId}`, {
    method: "PUT",
    token: state.token,
    body: { is_active: false },
  });
  assert(res.ok, `Batch inactivation failed (${res.status}): ${res.data?.message || "unknown error"}`);
}

async function permanentlyDeleteBatch() {
  const res = await apiRequest(`/api/batches/${state.batchId}/permanent`, {
    method: "DELETE",
    token: state.token,
  });
  assert(res.ok, `Permanent batch delete failed (${res.status}): ${res.data?.message || "unknown error"}`);
}

async function findSubjectId() {
  const res = await apiRequest("/api/subjects", { token: state.token });
  if (!res.ok || !Array.isArray(res.data)) return;
  const found = res.data.find((entry) => entry?.name === subjectName);
  if (found?.id) state.subjectId = found.id;
}

async function verifyStudentInDatabase() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const studentRow = await pool.query(
      `SELECT user_id, assigned_batch_id FROM students WHERE user_id = $1`,
      [state.studentId]
    );
    const userRow = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [state.studentId]
    );
    return {
      studentExists: studentRow.rowCount > 0,
      userExists: userRow.rowCount > 0,
      assignedBatchId: studentRow.rows[0]?.assigned_batch_id ?? null,
    };
  } finally {
    await pool.end();
  }
}

async function forceAssignStudentToBatchInDatabase(studentId, batchId) {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(
      `UPDATE students SET assigned_batch_id = $2 WHERE user_id = $1`,
      [studentId, batchId]
    );
  } finally {
    await pool.end();
  }
}

async function cleanup() {
  if (!state.token) return;

  if (state.studentId) {
    await apiRequest(`/api/students/${state.studentId}`, { method: "DELETE", token: state.token });
  }

  if (state.batchId) {
    await apiRequest(`/api/batches/${state.batchId}`, { method: "DELETE", token: state.token });
    await apiRequest(`/api/batches/${state.batchId}/permanent`, { method: "DELETE", token: state.token });
  }

  if (!state.subjectId) {
    await findSubjectId();
  }

  if (state.subjectId) {
    await apiRequest(`/api/subjects/${state.subjectId}`, { method: "DELETE", token: state.token });
  }
}

async function run() {
  console.log("[INFO] Running batch/student lifecycle verification");
  await login();
  await createBatch();
  await createStudent();

  const initialStudent = await getStudentFromApi();
  assert(initialStudent, "Precondition failed: created student not found in API list");
  console.log(`[CHECK] Student created with assigned batch: ${initialStudent?.assigned_batch?.id || "none"}`);

  await markBatchInactive();
  const afterInactive = await getStudentFromApi();
  const unassignedAfterInactive = !afterInactive?.assigned_batch;
  console.log(`[CHECK] After batch inactive, student assigned_batch is ${afterInactive?.assigned_batch ? "present" : "null"}`);

  // Re-link in DB to verify permanent delete behavior independently.
  // This simulates stale historical links that may still exist in real data.
  await forceAssignStudentToBatchInDatabase(state.studentId, state.batchId);

  await permanentlyDeleteBatch();
  const afterDeleteApi = await getStudentFromApi();
  const dbState = await verifyStudentInDatabase();

  console.log(`[CHECK] After permanent batch delete, student present in /api/students: ${Boolean(afterDeleteApi)}`);
  console.log(`[CHECK] After permanent batch delete, student row exists in DB: ${dbState.studentExists}`);
  console.log(`[CHECK] After permanent batch delete, user row exists in DB: ${dbState.userExists}`);
  console.log(`[CHECK] After permanent batch delete, assigned_batch_id in DB: ${dbState.assignedBatchId || "null"}`);

  console.log("\n[RESULT]");
  console.log(`- Inactive batch unassigns students: ${unassignedAfterInactive ? "YES" : "NO"}`);
  console.log(`- Permanent batch delete removes students from DB: ${dbState.studentExists || dbState.userExists ? "NO" : "YES"}`);

  await cleanup();
}

run().catch(async (error) => {
  console.error(`\n[ERROR] ${error.message}`);
  try {
    await cleanup();
  } catch {
    // ignore cleanup errors
  }
  process.exit(1);
});
