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

const pdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj", "utf8");

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
  let noteFileUrl = null;
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

    const noteForm = new FormData();
    noteForm.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "note.pdf");
    noteForm.append("chapter_id", chapterId);
    noteForm.append("title", "Integration Note PDF");

    const noteRes = await api(baseUrl, "POST", "/api/notes/upload", {
      token: facultyToken,
      formData: noteForm,
    });
    const noteId = noteRes?.id;
    noteFileUrl = noteRes?.file_url;
    assert.ok(noteId, "Note ID missing");
    assert.ok(noteFileUrl, "Note file URL missing");

    await waitForObjectState(noteFileUrl, true);

    // Soft-delete first (marks inactive), then permanent delete (runs storage cleanup)
    await api(baseUrl, "DELETE", `/api/batches/${batchId}`, { token: adminToken });
    await api(baseUrl, "DELETE", `/api/batches/${batchId}/permanent`, { token: adminToken });

    await waitForObjectState(noteFileUrl, false, 40000);

    console.log("PASS: Note PDF cleanup on batch deletion verified.");
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
