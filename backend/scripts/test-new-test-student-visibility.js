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

const tag = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const state = {
  adminToken: null,
  studentToken: null,
  batchId: null,
  studentId: null,
  studentLoginId: `test.student.${tag}@example.com`,
  studentPassword: "visible@123",
  testId: null,
  subjectId: null,
  subjectName: `test-visibility-subject-${tag}`,
  testTitle: `Visibility Test ${tag}`,
  rollNumber: `TV-${tag}`,
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

async function loginAsAdmin() {
  const res = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { loginId: ADMIN_LOGIN_ID, password: ADMIN_PASSWORD },
  });
  assert(res.ok, `Admin login failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.token, "Admin token missing");
  state.adminToken = res.data.token;
}

async function createBatch() {
  const res = await apiRequest("/api/batches", {
    method: "POST",
    token: state.adminToken,
    body: { name: `test-visibility-batch-${tag}`, subjects: [state.subjectName] },
  });
  assert(res.ok, `Batch creation failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.id, "Batch id missing in create response");
  state.batchId = res.data.id;
}

async function createStudent() {
  const res = await apiRequest("/api/students", {
    method: "POST",
    token: state.adminToken,
    body: {
      name: `Visible Student ${tag}`,
      rollNumber: state.rollNumber,
      email: state.studentLoginId,
      phone: "9999999999",
      address: "test",
      parentContact: "8888888888",
      batchId: state.batchId,
    },
  });

  assert(res.ok, `Student creation failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.id, "Student id missing in create response");
  state.studentId = res.data.id;
}

async function loginAsStudent() {
  const res = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { loginId: state.studentLoginId, password: state.studentPassword },
  });
  assert(res.ok, `Student login failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.token, "Student token missing");
  state.studentToken = res.data.token;
}

async function createTestForBatch() {
  const res = await apiRequest("/api/tests", {
    method: "POST",
    token: state.adminToken,
    body: {
      title: state.testTitle,
      format: "Custom",
      durationMinutes: 60,
      totalMarks: 100,
      scheduleDate: "",
      scheduleTime: null,
      instructions: "Visibility regression test",
      status: "live",
      batchIds: [state.batchId],
      questions: [],
    },
  });

  assert(res.ok, `Test creation failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.id, "Test id missing in create response");
  state.testId = res.data.id;
}

async function listStudentTests() {
  const res = await apiRequest("/api/tests", { token: state.studentToken });
  assert(res.ok, `Student test list failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(Array.isArray(res.data), "Student test list is not an array");
  return res.data;
}

async function resolveSubjectId() {
  const res = await apiRequest("/api/subjects", { token: state.adminToken });
  if (!res.ok || !Array.isArray(res.data)) return;
  const found = res.data.find((subject) => subject?.name === state.subjectName);
  if (found?.id) {
    state.subjectId = found.id;
  }
}

async function cleanup() {
  if (state.adminToken && state.testId) {
    await apiRequest(`/api/tests/${state.testId}`, { method: "DELETE", token: state.adminToken });
  }

  if (state.adminToken && state.studentId) {
    await apiRequest(`/api/students/${state.studentId}`, { method: "DELETE", token: state.adminToken });
  }

  if (state.adminToken && state.batchId) {
    await apiRequest(`/api/batches/${state.batchId}`, { method: "DELETE", token: state.adminToken });
    await apiRequest(`/api/batches/${state.batchId}/permanent`, { method: "DELETE", token: state.adminToken });
  }

  if (state.adminToken) {
    if (!state.subjectId) {
      await resolveSubjectId();
    }
    if (state.subjectId) {
      await apiRequest(`/api/subjects/${state.subjectId}`, { method: "DELETE", token: state.adminToken });
    }
  }
}

async function run() {
  console.log("[INFO] Running student test visibility verification");

  await loginAsAdmin();
  await createBatch();
  await createStudent();
  await loginAsStudent();

  // Prime student's test list cache before test creation.
  const testsBefore = await listStudentTests();
  const alreadyPresent = testsBefore.some((test) => test?.title === state.testTitle);
  assert(!alreadyPresent, "Precondition failed: target test title already present before creation");

  await createTestForBatch();

  const testsAfter = await listStudentTests();
  const found = testsAfter.find((test) => test?.id === state.testId || test?.title === state.testTitle);

  assert(found, "Newly created test is not visible to the respective student");

  console.log(`[PASS] Student can see new test immediately: ${found?.title || state.testTitle}`);
}

run()
  .then(async () => {
    await cleanup();
    console.log("✅ Test visibility verification passed");
  })
  .catch(async (error) => {
    console.error(`❌ Test visibility verification failed: ${error.message}`);
    try {
      await cleanup();
    } catch {
      // ignore cleanup errors
    }
    process.exit(1);
  });
