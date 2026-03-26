import dotenv from "dotenv";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

dotenv.config({ path: "d:/UJAAS_Project/backend/.env" });

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
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

async function run() {
  console.log("[INFO] Verifying avatar object existence in configured storage bucket");
  console.log(`[INFO] Storage endpoint: ${STORAGE_S3_ENDPOINT}`);
  console.log(`[INFO] Bucket: ${BUCKET_NAME}`);

  const loginRes = await apiJson("/api/auth/login", {
    method: "POST",
    body: { loginId: ADMIN_LOGIN_ID, password: ADMIN_PASSWORD },
  });
  assert(loginRes.ok, `Login failed (${loginRes.status}): ${loginRes.data?.message || "unknown error"}`);
  const token = loginRes.data?.token;
  assert(token, "Token missing in login response");

  const uploadRes = await apiMultipart("/api/profile/avatar", {
    token,
    fileFieldName: "avatar",
    fileName: "avatar.png",
    mimeType: "image/png",
    fileBuffer: tinyPngBuffer,
  });
  assert(uploadRes.ok, `Avatar upload failed (${uploadRes.status}): ${uploadRes.data?.message || "unknown error"}`);

  const avatarUrl = uploadRes.data?.avatarUrl;
  assert(typeof avatarUrl === "string" && avatarUrl.length > 10, "avatarUrl missing in upload response");
  const objectKey = objectKeyFromUrl(avatarUrl);
  assert(objectKey, `Unable to parse object key from avatarUrl: ${avatarUrl}`);

  const s3 = new S3Client({
    forcePathStyle: true,
    region: STORAGE_S3_REGION,
    endpoint: STORAGE_S3_ENDPOINT,
    credentials: {
      accessKeyId: STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: STORAGE_S3_SECRET_ACCESS_KEY,
    },
  });

  const listRes = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: objectKey,
      MaxKeys: 10,
    })
  );

  const found = Array.isArray(listRes.Contents)
    && listRes.Contents.some((obj) => obj?.Key === objectKey);

  console.log(`[INFO] Uploaded avatar URL: ${avatarUrl}`);
  console.log(`[INFO] Parsed object key: ${objectKey}`);
  console.log(`[INFO] Matching key exists in bucket: ${found ? "YES" : "NO"}`);

  assert(found, "Object not found in configured storage bucket after upload");

  await apiJson("/api/profile/avatar", { method: "DELETE", token });
  console.log("✅ Avatar object exists in configured bucket");
}

run().catch((error) => {
  console.error(`❌ Avatar storage object test failed: ${error.message}`);
  process.exit(1);
});
