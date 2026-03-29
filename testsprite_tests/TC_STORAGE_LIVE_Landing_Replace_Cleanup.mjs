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
  return userRes.rows[0].id;
}

async function runTest() {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 4000;
  const baseUrl = `http://127.0.0.1:${port}`;

  const adminLoginId = `admin-${randomTag("test")}@ujaas.local`;
  const adminPassword = "Admin#Temp123";
  let adminUserId = null;
  let adminToken = null;
  let originalLanding = null;
  let landingImage1 = null;
  let landingImage2 = null;
  const tempFacultyName = randomTag("integration-faculty");

  try {
    adminUserId = await createTempUser({
      role: "admin",
      loginId: adminLoginId,
      password: adminPassword,
      name: "Temp Admin",
    });

    const adminLogin = await api(baseUrl, "POST", "/api/auth/login", {
      json: { loginId: adminLoginId, password: adminPassword },
    });
    adminToken = adminLogin?.token;
    assert.ok(adminToken, "Admin login token missing");

    // Fetch original landing for restoration
    originalLanding = await api(baseUrl, "GET", "/api/landing");
    assert.ok(originalLanding, "Original landing data should be fetched");

    // Upload first landing image
    const uploadLanding1 = new FormData();
    uploadLanding1.append("image", new Blob([pngA], { type: "image/png" }), "landing-a.png");
    uploadLanding1.append("context", "landing");
    uploadLanding1.append("itemRole", "faculty");
    const landingUp1 = await api(baseUrl, "POST", "/api/upload", {
      token: adminToken,
      formData: uploadLanding1,
    });
    landingImage1 = landingUp1?.imageUrl;
    assert.ok(landingImage1, "First landing image URL missing");
    await waitForObjectState(landingImage1, true);

    // Add to landing
    const landingWithImage1 = {
      ...originalLanding,
      faculty: [
        ...(originalLanding.faculty || []),
        {
          name: tempFacultyName,
          subject: "Integration",
          designation: "Tester",
          experience: "1",
          image: landingImage1,
        },
      ],
    };

    await api(baseUrl, "PUT", "/api/landing", {
      token: adminToken,
      json: landingWithImage1,
    });

    // Verify first image is stored
    const firstTempEntryResult = await pool.query(
      `SELECT image_url FROM landing_faculty WHERE name = $1 LIMIT 1`,
      [tempFacultyName]
    );
    assert.strictEqual(firstTempEntryResult.rowCount, 1, "Temp faculty entry should exist after first update");
    assert.strictEqual(
      firstTempEntryResult.rows[0].image_url,
      landingImage1,
      "Temp faculty should point to first landing image"
    );

    // Upload second landing image
    const uploadLanding2 = new FormData();
    uploadLanding2.append("image", new Blob([pngB], { type: "image/png" }), "landing-b.png");
    uploadLanding2.append("context", "landing");
    uploadLanding2.append("itemRole", "faculty");
    const landingUp2 = await api(baseUrl, "POST", "/api/upload", {
      token: adminToken,
      formData: uploadLanding2,
    });
    landingImage2 = landingUp2?.imageUrl;
    assert.ok(landingImage2, "Second landing image URL missing");
    await waitForObjectState(landingImage2, true);

    // Replace with second image
    const landingWithImage2 = {
      ...landingWithImage1,
      faculty: (landingWithImage1.faculty || []).map((f) =>
        f.name === tempFacultyName ? { ...f, image: landingImage2 } : f
      ),
    };

    await api(baseUrl, "PUT", "/api/landing", {
      token: adminToken,
      json: landingWithImage2,
    });

    // Verify second image is stored
    const secondTempEntryResult = await pool.query(
      `SELECT image_url FROM landing_faculty WHERE name = $1 LIMIT 1`,
      [tempFacultyName]
    );
    assert.strictEqual(secondTempEntryResult.rowCount, 1, "Temp faculty entry should exist after second update");
    assert.strictEqual(
      secondTempEntryResult.rows[0].image_url,
      landingImage2,
      "Temp faculty should point to second landing image after replacement"
    );

    // Verify cleanup of first image
    await waitForObjectState(landingImage2, true);
    await waitForObjectState(landingImage1, false, 40000);

    // Restore landing to original baseline
    await api(baseUrl, "PUT", "/api/landing", {
      token: adminToken,
      json: originalLanding,
    });

    // Verify cleanup of second image
    await waitForObjectState(landingImage2, false, 40000);

    console.log("PASS: Landing image replacement cleanup verified.");
  } finally {
    // Final restoration attempt
    if (originalLanding && adminToken) {
      try {
        await api(baseUrl, "PUT", "/api/landing", {
          token: adminToken,
          json: originalLanding,
        });
      } catch {
        // Ignore restoration errors in cleanup
      }
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
