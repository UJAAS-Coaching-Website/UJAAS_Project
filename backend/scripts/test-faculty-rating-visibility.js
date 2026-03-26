import dotenv from "dotenv";

dotenv.config({ path: "d:/UJAAS_Project/backend/.env" });

const API_BASE_URL = process.env.CACHE_TEST_API_BASE_URL || "http://localhost:4000";
const ADMIN_LOGIN_ID = process.env.CACHE_TEST_ADMIN_LOGIN_ID;
const ADMIN_PASSWORD = process.env.CACHE_TEST_ADMIN_PASSWORD;
const FACULTY_LOGIN_ID = process.env.CACHE_TEST_FACULTY_LOGIN_ID;
const FACULTY_PASSWORD = process.env.CACHE_TEST_FACULTY_PASSWORD;

if (!ADMIN_LOGIN_ID || !ADMIN_PASSWORD) {
  console.error("Missing CACHE_TEST_ADMIN_LOGIN_ID or CACHE_TEST_ADMIN_PASSWORD");
  process.exit(1);
}

if (!FACULTY_LOGIN_ID || !FACULTY_PASSWORD) {
  console.error("Missing CACHE_TEST_FACULTY_LOGIN_ID or CACHE_TEST_FACULTY_PASSWORD");
  process.exit(1);
}

const tag = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const state = {
  adminToken: null,
  facultyToken: null,
  studentToken: null,
  facultyUserId: null,
  facultySubjectName: null,
  batchId: null,
  studentId: null,
  studentLoginId: `rating.visibility.student.${tag}@example.com`,
  studentPassword: "FacultyRate@123",
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

async function resolveFacultyDetailsFromAdmin() {
  const res = await apiRequest("/api/faculties", { token: state.adminToken });
  assert(res.ok, `Admin faculty list failed (${res.status}): ${res.data?.message || "unknown error"}`);

  const faculty = Array.isArray(res.data)
    ? res.data.find((entry) => String(entry?.email || "").toLowerCase() === String(FACULTY_LOGIN_ID).toLowerCase())
    : null;

  assert(faculty?.id, `Faculty '${FACULTY_LOGIN_ID}' not found in admin faculty list`);
  assert(faculty?.subject, `Faculty '${FACULTY_LOGIN_ID}' subject missing`);

  state.facultyUserId = faculty.id;
  state.facultySubjectName = faculty.subject;
}

async function loginAsFaculty() {
  const res = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { loginId: FACULTY_LOGIN_ID, password: FACULTY_PASSWORD },
  });
  assert(res.ok, `Faculty login failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.token, "Faculty token missing");
  state.facultyToken = res.data.token;
}

async function createBatchAssignedToFaculty() {
  const res = await apiRequest("/api/batches", {
    method: "POST",
    token: state.adminToken,
    body: {
      name: `rating-visibility-batch-${tag}`,
      subjects: [state.facultySubjectName],
      facultyIds: [state.facultyUserId],
    },
  });

  assert(res.ok, `Batch create failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.id, "Batch id missing");
  state.batchId = res.data.id;
}

async function createStudentInBatch() {
  const rollNumber = `RVS-${tag}`;
  const res = await apiRequest("/api/students", {
    method: "POST",
    token: state.adminToken,
    body: {
      name: `Rating Visibility Student ${tag}`,
      rollNumber,
      email: state.studentLoginId,
      phone: "9999999999",
      address: "rating visibility",
      parentContact: "8888888888",
      batchId: state.batchId,
    },
  });

  assert(res.ok, `Student create failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.id, "Student id missing");
  state.studentId = res.data.id;

  const resetRes = await apiRequest("/api/auth/admin/reset-password", {
    method: "POST",
    token: state.adminToken,
    body: {
      userId: state.studentId,
      newPassword: state.studentPassword,
    },
  });

  assert(resetRes.ok, `Student password reset failed (${resetRes.status}): ${resetRes.data?.message || "unknown error"}`);
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

function readSubjectRatings(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.subject_ratings && typeof payload.subject_ratings === "object") {
    return payload.subject_ratings;
  }
  if (payload.user?.subjectRatings && typeof payload.user.subjectRatings === "object") {
    return payload.user.subjectRatings;
  }
  return null;
}

function assertRatingVisible(subjectRatings, label) {
  assert(subjectRatings && typeof subjectRatings === "object", `${label}: subject ratings object missing`);
  const row = subjectRatings[state.facultySubjectName];
  assert(row, `${label}: subject '${state.facultySubjectName}' not found in subject ratings`);

  assert(Number(row.tests) === 4, `${label}: expected tests=4, got ${row.tests}`);
  assert(Number(row.dppPerformance) === 3, `${label}: expected dppPerformance=3, got ${row.dppPerformance}`);
  assert(Number(row.behavior) === 5, `${label}: expected behavior=5, got ${row.behavior}`);

  // Attendance may be normalized as count with separate attendanceRating.
  const attendanceRating = Number(row.attendanceRating ?? row.attendance_rating ?? 0);
  assert(attendanceRating > 0, `${label}: expected positive attendanceRating, got ${attendanceRating}`);
}

async function facultyUpdatesRating() {
  const res = await apiRequest(`/api/students/${state.studentId}/rating`, {
    method: "PUT",
    token: state.facultyToken,
    body: {
      subject: state.facultySubjectName,
      attendance: 18,
      total_classes: 20,
      tests: 4,
      dppPerformance: 3,
      behavior: 5,
      remarks: "Good consistency",
    },
  });

  assert(res.ok, `Faculty rating update failed (${res.status}): ${res.data?.message || "unknown error"}`);
}

async function verifyVisibleForFaculty() {
  const res = await apiRequest(`/api/students/${state.studentId}`, { token: state.facultyToken });
  assert(res.ok, `Faculty get student failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assertRatingVisible(readSubjectRatings(res.data), "Faculty visibility");
}

async function verifyVisibleForAdmin() {
  const res = await apiRequest(`/api/students/${state.studentId}`, { token: state.adminToken });
  assert(res.ok, `Admin get student failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assertRatingVisible(readSubjectRatings(res.data), "Admin visibility");
}

async function verifyVisibleForStudent() {
  const res = await apiRequest("/api/auth/me", { token: state.studentToken });
  assert(res.ok, `Student /api/auth/me failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assertRatingVisible(readSubjectRatings(res.data), "Student visibility");
}

async function cleanup() {
  if (state.adminToken && state.studentId) {
    await apiRequest(`/api/students/${state.studentId}`, { method: "DELETE", token: state.adminToken });
  }

  if (state.adminToken && state.batchId) {
    await apiRequest(`/api/batches/${state.batchId}`, { method: "DELETE", token: state.adminToken });
    await apiRequest(`/api/batches/${state.batchId}/permanent`, { method: "DELETE", token: state.adminToken });
  }
}

async function run() {
  console.log("[INFO] Running faculty rating visibility test");
  await loginAsAdmin();
  await resolveFacultyDetailsFromAdmin();
  await loginAsFaculty();
  await createBatchAssignedToFaculty();
  await createStudentInBatch();
  await loginAsStudent();
  await facultyUpdatesRating();
  await verifyVisibleForFaculty();
  await verifyVisibleForAdmin();
  await verifyVisibleForStudent();
  console.log("✅ Faculty rating is visible for faculty, admin, and student");
}

run()
  .then(async () => {
    await cleanup();
  })
  .catch(async (error) => {
    console.error(`❌ Faculty rating visibility test failed: ${error.message}`);
    try {
      await cleanup();
    } catch {
      // ignore cleanup failures
    }
    process.exit(1);
  });
