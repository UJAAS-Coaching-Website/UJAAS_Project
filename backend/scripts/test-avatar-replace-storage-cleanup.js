import dotenv from "dotenv";
import { S3Client, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const API_BASE_URL = process.env.CACHE_TEST_API_BASE_URL || "http://127.0.0.1:4000";
const ADMIN_LOGIN_ID = process.env.CACHE_TEST_ADMIN_LOGIN_ID;
const ADMIN_PASSWORD = process.env.CACHE_TEST_ADMIN_PASSWORD;

const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME;
const STORAGE_S3_REGION = process.env.STORAGE_S3_REGION;
const STORAGE_S3_ENDPOINT = process.env.STORAGE_S3_ENDPOINT;
const STORAGE_S3_ACCESS_KEY_ID = process.env.STORAGE_S3_ACCESS_KEY_ID;
const STORAGE_S3_SECRET_ACCESS_KEY = process.env.STORAGE_S3_SECRET_ACCESS_KEY;

if (!ADMIN_LOGIN_ID || !ADMIN_PASSWORD) {
  console.error("Missing CACHE_TEST_ADMIN_LOGIN_ID or CACHE_TEST_ADMIN_PASSWORD");
  process.exit(1);
}

if (!BUCKET_NAME || !STORAGE_S3_ENDPOINT || !STORAGE_S3_ACCESS_KEY_ID || !STORAGE_S3_SECRET_ACCESS_KEY) {
  console.error("Missing storage env vars (bucket/endpoint/keys)");
  process.exit(1);
}

const tinyPngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR42mP4DwABAQEAG7buVwAAAABJRU5ErkJggg==",
  "base64"
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function apiJson(path, { method = "GET", token, body } = {}) {
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

async function apiMultipart(path, { token, fileFieldName, fileName, mimeType, fileBuffer }) {
  const form = new FormData();
  form.append(fileFieldName, new Blob([fileBuffer], { type: mimeType }), fileName);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function objectKeyFromUrl(avatarUrl) {
  const marker = `/${BUCKET_NAME}/`;
  const idx = avatarUrl.indexOf(marker);
  if (idx === -1) return null;
  return avatarUrl.slice(idx + marker.length);
}

const s3 = new S3Client({
  forcePathStyle: true,
  region: STORAGE_S3_REGION,
  endpoint: STORAGE_S3_ENDPOINT,
  credentials: {
    accessKeyId: STORAGE_S3_ACCESS_KEY_ID,
    secretAccessKey: STORAGE_S3_SECRET_ACCESS_KEY,
  },
});

async function existsKey(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch (error) {
    const notFound =
      error?.name === "NotFound" ||
      error?.Code === "NotFound" ||
      error?.Code === "NoSuchKey" ||
      error?.$metadata?.httpStatusCode === 404;

    if (notFound) return false;
    throw error;
  }
}

async function deleteKeyIfExists(key) {
  if (!key) return;
  const present = await existsKey(key);
  if (!present) return;

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
}

async function run() {
  console.log("[INFO] Testing avatar replacement cleanup via API route");

  const loginRes = await apiJson("/api/auth/login", {
    method: "POST",
    body: { loginId: ADMIN_LOGIN_ID, password: ADMIN_PASSWORD },
  });
  assert(loginRes.ok, `Login failed (${loginRes.status}): ${loginRes.data?.message || "unknown error"}`);
  const token = loginRes.data?.token;
  assert(token, "Token missing in login response");

  let key1 = null;
  let key2 = null;

  try {
    const upload1 = await apiMultipart("/api/profile/avatar", {
      token,
      fileFieldName: "avatar",
      fileName: "avatar1.png",
      mimeType: "image/png",
      fileBuffer: tinyPngBuffer,
    });
    assert(upload1.ok, `First upload failed (${upload1.status}): ${upload1.data?.message || "unknown error"}`);

    const url1 = upload1.data?.avatarUrl;
    key1 = objectKeyFromUrl(url1);
    assert(key1, `Could not parse first key from URL: ${url1}`);
    assert(await existsKey(key1), "First avatar key missing after upload");

    const upload2 = await apiMultipart("/api/profile/avatar", {
      token,
      fileFieldName: "avatar",
      fileName: "avatar2.png",
      mimeType: "image/png",
      fileBuffer: tinyPngBuffer,
    });
    assert(upload2.ok, `Second upload failed (${upload2.status}): ${upload2.data?.message || "unknown error"}`);

    const url2 = upload2.data?.avatarUrl;
    key2 = objectKeyFromUrl(url2);
    assert(key2, `Could not parse second key from URL: ${url2}`);
    assert(await existsKey(key2), "Second avatar key missing after upload");

    const firstStillExistsAfterReplace = await existsKey(key1);
    console.log(`[INFO] First avatar exists after replacement: ${firstStillExistsAfterReplace ? "YES" : "NO"}`);
    assert(!firstStillExistsAfterReplace, "Old avatar object still exists after replacement");

    const deleteRes = await apiJson("/api/profile/avatar", { method: "DELETE", token });
    assert(deleteRes.ok, `Avatar delete failed (${deleteRes.status}): ${deleteRes.data?.message || "unknown error"}`);

    const secondStillExistsAfterDelete = await existsKey(key2);
    console.log(`[INFO] Second avatar exists after delete: ${secondStillExistsAfterDelete ? "YES" : "NO"}`);
    assert(!secondStillExistsAfterDelete, "Current avatar object still exists after delete endpoint");

    console.log("✅ Avatar replacement cleanup test passed");
  } finally {
    // Safety cleanup for unexpected failures.
    await deleteKeyIfExists(key1);
    await deleteKeyIfExists(key2);
  }
}

run().catch((error) => {
  console.error(`❌ Avatar replacement cleanup test failed: ${error.message}`);
  process.exit(1);
});
