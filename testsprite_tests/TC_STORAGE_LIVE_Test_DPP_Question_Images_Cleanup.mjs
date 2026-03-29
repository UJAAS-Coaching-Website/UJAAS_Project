import "../backend/scripts/load-env.js";
import assert from "node:assert";
import crypto from "node:crypto";
import { createRequire } from "node:module";

import app from "../backend/src/app.js";
import { pool } from "../backend/src/db/index.js";
import { hashPassword } from "../backend/src/utils/password.js";

const requireFromBackend = createRequire(new URL("../backend/src/services/storageService.js", import.meta.url));
const { S3Client, HeadObjectCommand } = requireFromBackend("@aws-sdk/client-s3");

const STORAGE_PUBLIC_BASE_URL = process.env.STORAGE_PUBLIC_BASE_URL;
const STORAGE_BUCKET_NAME = process.env.STORAGE_BUCKET_NAME;

const s3 = new S3Client({
  forcePathStyle: true,
  region: process.env.STORAGE_S3_REGION,
  endpoint: process.env.STORAGE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
  },
});

const pngA = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+7iEAAAAASUVORK5CYII=",
  "base64"
);
const pngB = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
  "base64"
);

function randomTag(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

function storageKeyFromUrl(url) {
  if (!url || !STORAGE_PUBLIC_BASE_URL || !STORAGE_BUCKET_NAME) return null;
  const prefix = `${STORAGE_PUBLIC_BASE_URL}/${STORAGE_BUCKET_NAME}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

async function objectExistsByUrl(url) {
  const key = storageKeyFromUrl(url);
  if (!key) return false;

  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: STORAGE_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    const code = String(error?.name || error?.Code || "").toLowerCase();
    const status = Number(error?.$metadata?.httpStatusCode || 0);
    if (code.includes("notfound") || code.includes("nosuchkey") || status === 404) {
      return false;
    }
  }

  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForObjectState(url, shouldExist, timeoutMs = 20000) {
  const waitLoop = async () => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const exists = await objectExistsByUrl(url);
      if (exists === shouldExist) {
        return true;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  };

  if (await waitLoop()) {
    return;
  }

  if (!shouldExist) {
    try {
      const { execFileSync } = await import("node:child_process");
      execFileSync(process.execPath, ["backend/scripts/retry-storage-cleanup-queue.js"], {
        cwd: process.cwd(),
        stdio: "pipe",
      });
    } catch {
      // Continue to second wait loop
    }

    await new Promise((r) => setTimeout(r, 1000));

    if (await waitLoop()) {
      return;
    }
  }

  const finalExists = await objectExistsByUrl(url);
  throw new Error(
    `Timed out waiting for object state ${shouldExist ? "exists" : "missing"}: ${url}. Final exists=${finalExists}`
  );
}

async function api(baseUrl, method, path, { token, json, formData } = {}) {
  const headers = {};
  let body;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  if (formData) {
    body = formData;
  }

  const response = await fetch(`${baseUrl}${path}`, { method, headers, body });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${method} ${path} failed ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function createTempUser({ role, loginId, password, name }) {
  const passwordHash = hashPassword(password);
  const userRes = await pool.query(
    `INSERT INTO users (name, login_id, role, password_hash, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id`,
    [name, loginId, role, passwordHash]
  );
  return userRes.rows[0].id;
}

async function runTest() {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 4000;
  const baseUrl = `http://127.0.0.1:${port}`;

  const adminLoginId = `admin-${randomTag("test")}@ujaas.local`;
  const adminPassword = "Admin#Temp123";
  const facultyLoginId = `faculty-${randomTag("test")}@ujaas.local`;
  const facultyPassword = "Faculty#Temp123";

  let adminUserId = null;
  let facultyUserId = null;
  let adminToken = null;
  let facultyToken = null;
  let batchId = null;
  let testId = null;
  let dppId = null;
  let testQuestionImage1 = null;
  let testQuestionImage2 = null;
  let dppQuestionImage1 = null;
  const subjectName = "Integration Subject";

  try {
    adminUserId = await createTempUser({
      role: "admin",
      loginId: adminLoginId,
      password: adminPassword,
      name: "Temp Admin",
    });

    facultyUserId = await createTempUser({
      role: "faculty",
      loginId: facultyLoginId,
      password: facultyPassword,
      name: "Temp Faculty",
    });

    const adminLogin = await api(baseUrl, "POST", "/api/auth/login", {
      json: { loginId: adminLoginId, password: adminPassword },
    });
    adminToken = adminLogin?.token;
    assert.ok(adminToken, "Admin login token missing");

    const facultyLogin = await api(baseUrl, "POST", "/api/auth/login", {
      json: { loginId: facultyLoginId, password: facultyPassword },
    });
    facultyToken = facultyLogin?.token;
    assert.ok(facultyToken, "Faculty login token missing");

    const batch = await api(baseUrl, "POST", "/api/batches", {
      token: adminToken,
      json: {
        name: randomTag("integration-batch"),
        subjects: [subjectName],
        facultyIds: [],
      },
    });
    batchId = batch?.id;
    assert.ok(batchId, "Batch ID missing");

    const batchSubjectsResult = await pool.query(
      `SELECT id, subject_id FROM batch_subjects WHERE batch_id = $1 LIMIT 1`,
      [batchId]
    );
    const batchSubjectId = batchSubjectsResult.rows[0]?.id;
    const subjectId = batchSubjectsResult.rows[0]?.subject_id;
    assert.ok(batchSubjectId, "Batch subject ID missing");

    await pool.query(
      `INSERT INTO faculties (user_id, subject_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [facultyUserId, subjectId]
    );

    await pool.query(
      `INSERT INTO faculty_assignments (faculty_id, batch_subject_id, created_at)
       VALUES ($1, $2, NOW())`,
      [facultyUserId, batchSubjectId]
    );

    const chapter = await api(baseUrl, "POST", "/api/chapters", {
      token: adminToken,
      json: { batch_id: batchId, subject_name: subjectName, name: randomTag("integration-chapter") },
    });
    const chapterId = chapter?.id;
    assert.ok(chapterId, "Chapter ID missing");

    const testPayload = {
      title: randomTag("test"),
      format: "Custom",
      durationMinutes: 30,
      totalMarks: 4,
      instructions: "Integration test",
      status: "draft",
      batchIds: [batchId],
      questions: [
        {
          subject: subjectName,
          section: "Section 1",
          type: "MCQ",
          question: "Test question with image",
          questionImage: null,
          options: ["Option A", "Option B"],
          correctAnswer: "0",
          marks: 4,
          negativeMarks: 0,
        },
      ],
    };

    const testRes = await api(baseUrl, "POST", "/api/tests", {
      token: adminToken,
      json: testPayload,
    });
    testId = testRes?.id;
    assert.ok(testId, "Test ID missing");

    const uploadForm1 = new FormData();
    uploadForm1.append("image", new Blob([pngA], { type: "image/png" }), "q1.png");
    uploadForm1.append("context", "tests");
    uploadForm1.append("contextId", testId);
    uploadForm1.append("itemRole", "question");
    const uploadRes1 = await api(baseUrl, "POST", "/api/upload", {
      token: adminToken,
      formData: uploadForm1,
    });
    testQuestionImage1 = uploadRes1?.imageUrl;
    assert.ok(testQuestionImage1, "First test question image URL missing");
    await waitForObjectState(testQuestionImage1, true);

    const testFetch = await api(baseUrl, "GET", `/api/tests/${testId}`, { token: adminToken });
    const updatedTest = {
      title: testFetch.title,
      format: testFetch.format,
      durationMinutes: Number(testFetch.durationMinutes ?? testFetch.duration_minutes ?? 30),
      totalMarks: Number(testFetch.totalMarks ?? testFetch.total_marks ?? 4),
      scheduleDate: testFetch.scheduleDate ?? testFetch.schedule_date ?? "",
      scheduleTime: testFetch.scheduleTime ?? testFetch.schedule_time ?? null,
      instructions: testFetch.instructions ?? null,
      batchIds: (testFetch.batches || []).map((b) => b.id),
      questions: [
        {
          ...testFetch.questions[0],
          questionImage: testQuestionImage1,
        },
      ],
    };
    await api(baseUrl, "PUT", `/api/tests/${testId}`, { token: adminToken, json: updatedTest });

    const uploadForm2 = new FormData();
    uploadForm2.append("image", new Blob([pngB], { type: "image/png" }), "q2.png");
    uploadForm2.append("context", "tests");
    uploadForm2.append("contextId", testId);
    uploadForm2.append("itemRole", "question");
    const uploadRes2 = await api(baseUrl, "POST", "/api/upload", {
      token: adminToken,
      formData: uploadForm2,
    });
    testQuestionImage2 = uploadRes2?.imageUrl;
    assert.ok(testQuestionImage2, "Second test question image URL missing");
    await waitForObjectState(testQuestionImage2, true);

    const testFetch2 = await api(baseUrl, "GET", `/api/tests/${testId}`, { token: adminToken });
    const updatedTest2 = {
      title: testFetch2.title,
      format: testFetch2.format,
      durationMinutes: Number(testFetch2.durationMinutes ?? testFetch2.duration_minutes ?? 30),
      totalMarks: Number(testFetch2.totalMarks ?? testFetch2.total_marks ?? 4),
      scheduleDate: testFetch2.scheduleDate ?? testFetch2.schedule_date ?? "",
      scheduleTime: testFetch2.scheduleTime ?? testFetch2.schedule_time ?? null,
      instructions: testFetch2.instructions ?? null,
      batchIds: (testFetch2.batches || []).map((b) => b.id),
      questions: [
        {
          ...testFetch2.questions[0],
          questionImage: testQuestionImage2,
        },
      ],
    };
    await api(baseUrl, "PUT", `/api/tests/${testId}`, { token: adminToken, json: updatedTest2 });

    await waitForObjectState(testQuestionImage2, true);
    await waitForObjectState(testQuestionImage1, false, 40000);

    const dppPayload = {
      title: randomTag("dpp"),
      instructions: "DPP instructions",
      chapter_id: chapterId,
      questions: [
        {
          subject: subjectName,
          section: "Section 1",
          type: "MCQ",
          question: "DPP question with image",
          questionImage: null,
          options: ["Option A", "Option B"],
          correctAnswer: "0",
          marks: 4,
          negativeMarks: 0,
        },
      ],
    };

    const dppRes = await api(baseUrl, "POST", "/api/dpps", {
      token: facultyToken,
      json: dppPayload,
    });
    dppId = dppRes?.id;
    assert.ok(dppId, "DPP ID missing");

    const uploadFormDpp = new FormData();
    uploadFormDpp.append("image", new Blob([pngA], { type: "image/png" }), "dpp-q.png");
    uploadFormDpp.append("context", "dpps");
    uploadFormDpp.append("contextId", dppId);
    uploadFormDpp.append("itemRole", "question");
    const uploadResDpp = await api(baseUrl, "POST", "/api/upload", {
      token: facultyToken,
      formData: uploadFormDpp,
    });
    dppQuestionImage1 = uploadResDpp?.imageUrl;
    assert.ok(dppQuestionImage1, "DPP question image URL missing");
    await waitForObjectState(dppQuestionImage1, true);

    const dppFetch = await api(baseUrl, "GET", `/api/dpps/${dppId}`, { token: facultyToken });
    const updatedDpp = {
      ...dppFetch,
      questions: [
        {
          ...dppFetch.questions[0],
          questionImage: dppQuestionImage1,
        },
      ],
    };
    await api(baseUrl, "PUT", `/api/dpps/${dppId}`, { token: facultyToken, json: updatedDpp });

    await api(baseUrl, "DELETE", `/api/dpps/${dppId}`, { token: facultyToken });

    await waitForObjectState(dppQuestionImage1, false, 40000);

    console.log("PASS: Test/DPP question image cleanup on update/deletion verified.");
  } finally {
    if (batchId) {
      await pool.query(`DELETE FROM batches WHERE id = $1`, [batchId]).catch(() => {});
    }
    if (facultyUserId) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [facultyUserId]).catch(() => {});
    }
    if (adminUserId) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [adminUserId]).catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
  }
}

runTest()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error("FAIL:", error.message);
    await pool.end();
    process.exit(1);
  });
