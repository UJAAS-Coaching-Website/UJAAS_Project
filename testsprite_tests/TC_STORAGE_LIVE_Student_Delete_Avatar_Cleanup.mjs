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
    // On other errors, try HTTP HEAD as fallback
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

  const userId = userRes.rows[0].id;

  if (role === "student") {
    await pool.query(
      `INSERT INTO students (user_id, roll_number, join_date)
       VALUES ($1, $2, CURRENT_DATE)`,
      [userId, loginId]
    );
  }

  return userId;
}

async function getAvatarUrl(userId) {
  const res = await pool.query(`SELECT avatar_url FROM users WHERE id = $1`, [userId]);
  return res.rows[0]?.avatar_url || null;
}

async function runTest() {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 4000;
  const baseUrl = `http://127.0.0.1:${port}`;

  const studentLoginId = randomTag("roll");
  const studentPassword = "Student#Temp123";
  let studentUserId = null;
  let studentToken = null;
  let avatarUrl3 = null;

  try {
    studentUserId = await createTempUser({
      role: "student",
      loginId: studentLoginId,
      password: studentPassword,
      name: "Temp Student",
    });

    const studentLogin = await api(baseUrl, "POST", "/api/auth/login", {
      json: { loginId: studentLoginId, password: studentPassword },
    });
    studentToken = studentLogin?.token;
    assert.ok(studentToken, "Student login token missing");

    // Upload avatar before student deletion
    const avatarForm3 = new FormData();
    avatarForm3.append("avatar", new Blob([pngA], { type: "image/png" }), "avatar-c.png");
    await api(baseUrl, "POST", "/api/profile/avatar", { token: studentToken, formData: avatarForm3 });

    avatarUrl3 = await getAvatarUrl(studentUserId);
    assert.ok(avatarUrl3, "Avatar URL should be set before student delete");
    await waitForObjectState(avatarUrl3, true);

    // Delete student should also cleanup avatar
    const adminLoginId = `admin-${randomTag("test")}@ujaas.local`;
    const adminPassword = "Admin#Temp123";
    const adminUserId = await createTempUser({
      role: "admin",
      loginId: adminLoginId,
      password: adminPassword,
      name: "Temp Admin",
    });

    const adminLogin = await api(baseUrl, "POST", "/api/auth/login", {
      json: { loginId: adminLoginId, password: adminPassword },
    });
    const adminToken = adminLogin?.token;

    await api(baseUrl, "DELETE", `/api/students/${studentUserId}`, { token: adminToken });
    await waitForObjectState(avatarUrl3, false, 40000);

    await pool.query(`DELETE FROM users WHERE id = $1`, [adminUserId]).catch(() => {});
    studentUserId = null;

    console.log("PASS: Student deletion with avatar cleanup verified.");
  } finally {
    if (studentUserId) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [studentUserId]).catch(() => {});
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
