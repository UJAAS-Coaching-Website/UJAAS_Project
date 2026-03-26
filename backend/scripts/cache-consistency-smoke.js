import dotenv from "dotenv";

dotenv.config({ path: "d:/UJAAS_Project/backend/.env" });

const API_BASE_URL = process.env.CACHE_TEST_API_BASE_URL || "http://localhost:4000";
const ADMIN_LOGIN_ID = process.env.CACHE_TEST_ADMIN_LOGIN_ID || "admin@ujaas.com";
const ADMIN_PASSWORD = process.env.CACHE_TEST_ADMIN_PASSWORD || "admin123";

if (typeof fetch !== "function") {
  throw new Error("Global fetch is not available. Use Node.js 18+ to run this script.");
}

const nowTag = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const created = {
  batchIds: [],
  studentIds: [],
  facultyIds: [],
  subjectNames: new Set(),
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function logStep(message) {
  console.log(`\n[STEP] ${message}`);
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

  const json = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data: json,
  };
}

async function loginAsAdmin() {
  logStep("Login as admin user");
  const res = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { loginId: ADMIN_LOGIN_ID, password: ADMIN_PASSWORD },
  });

  assert(res.ok, `Admin login failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(typeof res.data?.token === "string" && res.data.token.length > 10, "Admin token missing from login response");
  return res.data.token;
}

async function createBatch(token, { name, subjects }) {
  (subjects || []).forEach((subject) => {
    if (typeof subject === "string" && subject.trim()) {
      created.subjectNames.add(subject.trim());
    }
  });

  const res = await apiRequest("/api/batches", {
    method: "POST",
    token,
    body: { name, subjects },
  });

  assert(res.ok, `Create batch failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.id, "Create batch response missing id");
  created.batchIds.push(res.data.id);
  return res.data;
}

async function createStudent(token, { name, rollNumber, email, batchId }) {
  const res = await apiRequest("/api/students", {
    method: "POST",
    token,
    body: {
      name,
      rollNumber,
      email,
      phone: "9999999999",
      address: "cache smoke",
      parentContact: "8888888888",
      batchId,
    },
  });

  assert(res.ok, `Create student failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.id, "Create student response missing id");
  created.studentIds.push(res.data.id);
  return res.data;
}

async function createFaculty(token, { name, email, subject }) {
  const res = await apiRequest("/api/faculties", {
    method: "POST",
    token,
    body: {
      name,
      email,
      subject,
      phone: "7777777777",
      designation: "Teacher",
      joinDate: "2025-01-01",
      password: "cacheTest@123",
    },
  });

  assert(res.ok, `Create faculty failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.id, "Create faculty response missing id");
  created.facultyIds.push(res.data.id);
  return res.data;
}

async function cleanup(token) {
  for (const studentId of created.studentIds) {
    await apiRequest(`/api/students/${studentId}`, { method: "DELETE", token });
  }

  for (const facultyId of created.facultyIds) {
    await apiRequest(`/api/faculties/${facultyId}`, { method: "DELETE", token });
  }

  for (const batchId of created.batchIds) {
    await apiRequest(`/api/batches/${batchId}`, { method: "DELETE", token });
    await apiRequest(`/api/batches/${batchId}/permanent`, { method: "DELETE", token });
  }

  if (created.subjectNames.size > 0) {
    const subjectsRes = await apiRequest("/api/subjects", { token });
    if (subjectsRes.ok && Array.isArray(subjectsRes.data)) {
      for (const subjectName of created.subjectNames) {
        const subject = subjectsRes.data.find((entry) => entry?.name === subjectName);
        if (!subject?.id) {
          continue;
        }

        await apiRequest(`/api/subjects/${subject.id}`, {
          method: "DELETE",
          token,
        });
      }
    }
  }
}

async function testBatchAndSubjectVisibility(token) {
  logStep("Test 1: New batch and subject are visible immediately after creation");

  // Prime cache
  const warmBatches = await apiRequest("/api/batches", { token });
  assert(warmBatches.ok, `Warm /api/batches failed (${warmBatches.status})`);

  const warmSubjects = await apiRequest("/api/subjects", { token });
  assert(warmSubjects.ok, `Warm /api/subjects failed (${warmSubjects.status})`);

  const batchName = `cache-batch-${nowTag}`;
  const subjectName = `cache-subject-${nowTag}`;

  await createBatch(token, { name: batchName, subjects: [subjectName] });

  const batchesAfter = await apiRequest("/api/batches", { token });
  assert(batchesAfter.ok, `Read /api/batches after create failed (${batchesAfter.status})`);

  const hasBatch = Array.isArray(batchesAfter.data)
    && batchesAfter.data.some((batch) => batch?.name === batchName);
  assert(hasBatch, "New batch was not visible immediately after creation");

  const subjectsAfter = await apiRequest("/api/subjects", { token });
  assert(subjectsAfter.ok, `Read /api/subjects after create failed (${subjectsAfter.status})`);

  const hasSubject = Array.isArray(subjectsAfter.data)
    && subjectsAfter.data.some((subject) => subject?.name === subjectName);
  assert(hasSubject, "New subject was not visible immediately after batch creation");

  console.log("[PASS] Test 1 passed");
}

async function testBatchStudentVisibility(token) {
  logStep("Test 2: Newly created student is visible in batch assignment immediately");

  const batchName = `cache-student-batch-${nowTag}`;
  const subjectName = `cache-student-subject-${nowTag}`;
  const batch = await createBatch(token, { name: batchName, subjects: [subjectName] });

  // Prime caches
  const warmStudents = await apiRequest("/api/students", { token });
  assert(warmStudents.ok, `Warm /api/students failed (${warmStudents.status})`);

  const warmBatchStudents = await apiRequest(`/api/batches/${batch.id}/students`, { token });
  assert(warmBatchStudents.ok, `Warm /api/batches/${batch.id}/students failed (${warmBatchStudents.status})`);

  const rollNumber = `CACHE-${nowTag}`;
  const student = await createStudent(token, {
    name: `Cache Student ${nowTag}`,
    rollNumber,
    email: `cache.student.${nowTag}@example.com`,
    batchId: batch.id,
  });

  const studentsAfter = await apiRequest(`/api/students?search=${encodeURIComponent(rollNumber)}`, { token });
  assert(studentsAfter.ok, `Read /api/students after create failed (${studentsAfter.status})`);

  const hasStudentInSearch = Array.isArray(studentsAfter.data)
    && studentsAfter.data.some((entry) => entry?.id === student.id);
  assert(hasStudentInSearch, "Newly created student not visible immediately in student list search");

  const batchStudentsAfter = await apiRequest(`/api/batches/${batch.id}/students`, { token });
  assert(batchStudentsAfter.ok, `Read batch students after create failed (${batchStudentsAfter.status})`);

  const hasStudentInBatch = Array.isArray(batchStudentsAfter.data)
    && batchStudentsAfter.data.some((entry) => entry?.id === student.id || entry?.user_id === student.id);
  assert(hasStudentInBatch, "Newly created student not visible immediately in batch student list");

  console.log("[PASS] Test 2 passed");
}

async function testFacultyDeleteInvalidation(token) {
  logStep("Test 3: Deleted faculty disappears immediately from batch faculty list");

  const subjectName = `cache-faculty-subject-${nowTag}`;
  const faculty = await createFaculty(token, {
    name: `Cache Faculty ${nowTag}`,
    email: `cache.faculty.${nowTag}@example.com`,
    subject: subjectName,
  });

  const batchRes = await apiRequest("/api/batches", {
    method: "POST",
    token,
    body: {
      name: `cache-faculty-batch-${nowTag}`,
      subjects: [subjectName],
      facultyIds: [faculty.id],
    },
  });
  assert(batchRes.ok, `Create batch with faculty assignment failed (${batchRes.status}): ${batchRes.data?.message || "unknown error"}`);
  assert(batchRes.data?.id, "Create batch response missing id for faculty-delete test");
  const batch = batchRes.data;
  created.batchIds.push(batch.id);

  // Prime cache with assigned faculty present
  const warmBatchFaculty = await apiRequest(`/api/batches/${batch.id}/faculty`, { token });
  assert(warmBatchFaculty.ok, `Warm /api/batches/${batch.id}/faculty failed (${warmBatchFaculty.status})`);
  const foundBeforeDelete = Array.isArray(warmBatchFaculty.data)
    && warmBatchFaculty.data.some((entry) => entry?.id === faculty.id || entry?.user_id === faculty.id);
  assert(foundBeforeDelete, "Precondition failed: assigned faculty not found before delete");

  const deleteFacultyRes = await apiRequest(`/api/faculties/${faculty.id}`, {
    method: "DELETE",
    token,
  });
  assert(deleteFacultyRes.ok, `Delete faculty failed (${deleteFacultyRes.status}): ${deleteFacultyRes.data?.message || "unknown error"}`);

  const batchFacultyAfterDelete = await apiRequest(`/api/batches/${batch.id}/faculty`, { token });
  assert(batchFacultyAfterDelete.ok, `Read batch faculty after delete failed (${batchFacultyAfterDelete.status})`);

  const stillPresent = Array.isArray(batchFacultyAfterDelete.data)
    && batchFacultyAfterDelete.data.some((entry) => entry?.id === faculty.id || entry?.user_id === faculty.id);
  assert(!stillPresent, "Deleted faculty is still visible in batch faculty list (cache invalidation failure)");

  console.log("[PASS] Test 3 passed");
}

async function testStudentDeleteInvalidation(token) {
  logStep("Test 4: Deleted student disappears immediately from student list");

  const batch = await createBatch(token, {
    name: `cache-delete-student-batch-${nowTag}`,
    subjects: [`cache-delete-student-subject-${nowTag}`],
  });

  const rollNumber = `DEL-CACHE-${nowTag}`;
  const student = await createStudent(token, {
    name: `Delete Student ${nowTag}`,
    rollNumber,
    email: `delete.student.${nowTag}@example.com`,
    batchId: batch.id,
  });

  // Prime caches with the student present
  const warmStudents = await apiRequest(`/api/students?search=${encodeURIComponent(rollNumber)}`, { token });
  assert(warmStudents.ok, `Warm /api/students for delete test failed (${warmStudents.status})`);
  const warmBatchStudents = await apiRequest(`/api/batches/${batch.id}/students`, { token });
  assert(warmBatchStudents.ok, `Warm batch students for delete test failed (${warmBatchStudents.status})`);

  const deleteRes = await apiRequest(`/api/students/${student.id}`, {
    method: "DELETE",
    token,
  });
  assert(deleteRes.ok, `Delete student failed (${deleteRes.status}): ${deleteRes.data?.message || "unknown error"}`);

  const studentsAfterDelete = await apiRequest(`/api/students?search=${encodeURIComponent(rollNumber)}`, { token });
  assert(studentsAfterDelete.ok, `Read /api/students after delete failed (${studentsAfterDelete.status})`);
  const stillInStudentList = Array.isArray(studentsAfterDelete.data)
    && studentsAfterDelete.data.some((entry) => entry?.id === student.id);
  assert(!stillInStudentList, "Deleted student still appears in /api/students list");

  const batchStudentsAfterDelete = await apiRequest(`/api/batches/${batch.id}/students`, { token });
  assert(batchStudentsAfterDelete.ok, `Read batch students after delete failed (${batchStudentsAfterDelete.status})`);
  const stillInBatchStudents = Array.isArray(batchStudentsAfterDelete.data)
    && batchStudentsAfterDelete.data.some((entry) => entry?.id === student.id || entry?.user_id === student.id);
  assert(!stillInBatchStudents, "Deleted student still appears in /api/batches/:id/students list");

  console.log("[PASS] Test 4 passed");
}

async function main() {
  console.log(`[INFO] Cache consistency smoke tests against ${API_BASE_URL}`);
  const token = await loginAsAdmin();

  try {
    await testBatchAndSubjectVisibility(token);
    await testBatchStudentVisibility(token);
    await testFacultyDeleteInvalidation(token);
    await testStudentDeleteInvalidation(token);

    console.log("\n✅ All cache consistency smoke tests passed");
  } catch (error) {
    console.error(`\n❌ Cache consistency smoke tests failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await cleanup(token);
  }
}

main().catch((error) => {
  console.error(`\n❌ Unhandled error: ${error.message}`);
  process.exit(1);
});
