import dotenv from "dotenv";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const {
  uploadLandingPageImageToStorage,
  deleteLandingPageImageFromStorage,
  uploadQuestionBankFileToStorage,
  deleteQuestionBankFileFromStorage,
} = await import("../src/services/storageService.js");

const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME;
const STORAGE_S3_REGION = process.env.STORAGE_S3_REGION;
const STORAGE_S3_ENDPOINT = process.env.STORAGE_S3_ENDPOINT;
const STORAGE_S3_ACCESS_KEY_ID = process.env.STORAGE_S3_ACCESS_KEY_ID;
const STORAGE_S3_SECRET_ACCESS_KEY = process.env.STORAGE_S3_SECRET_ACCESS_KEY;
const STORAGE_PUBLIC_BASE_URL = process.env.STORAGE_PUBLIC_BASE_URL;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

if (!BUCKET_NAME || !STORAGE_S3_ENDPOINT || !STORAGE_S3_ACCESS_KEY_ID || !STORAGE_S3_SECRET_ACCESS_KEY || !STORAGE_PUBLIC_BASE_URL) {
  console.error("Missing storage env vars");
  process.exit(1);
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

function keyFromUrl(fileUrl) {
  const marker = `${STORAGE_PUBLIC_BASE_URL}/${BUCKET_NAME}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) {
    return null;
  }
  return fileUrl.slice(idx + marker.length);
}

async function objectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch (error) {
    const notFound =
      error?.name === "NotFound" ||
      error?.Code === "NotFound" ||
      error?.Code === "NoSuchKey" ||
      error?.$metadata?.httpStatusCode === 404;

    if (notFound) {
      return false;
    }

    throw error;
  }
}

const tinyPngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR42mP4DwABAQEAG7buVwAAAABJRU5ErkJggg==",
  "base64"
);

const fakePdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF", "utf8");

async function testLandingImageDelete() {
  const imageUrl = await uploadLandingPageImageToStorage(
    tinyPngBuffer,
    "landing-test.png",
    "image/png",
    "faculty"
  );

  const key = keyFromUrl(imageUrl);
  assert(key, `Could not parse landing key from URL: ${imageUrl}`);
  assert(await objectExists(key), "Landing object missing right after upload");

  await deleteLandingPageImageFromStorage(imageUrl);
  const existsAfterDelete = await objectExists(key);

  console.log(`[INFO] Landing image exists after delete: ${existsAfterDelete ? "YES" : "NO"}`);
  assert(!existsAfterDelete, "Landing image still exists after delete");
}

async function testQuestionBankPdfDelete() {
  const fileId = `qbank-${Date.now()}`;
  const fileUrl = await uploadQuestionBankFileToStorage(
    fakePdfBuffer,
    "sample.pdf",
    "application/pdf",
    "physics",
    fileId,
    "storage-check-title"
  );

  const key = keyFromUrl(fileUrl);
  assert(key, `Could not parse question bank key from URL: ${fileUrl}`);
  assert(await objectExists(key), "Question-bank file missing right after upload");

  await deleteQuestionBankFileFromStorage(fileUrl);
  const existsAfterDelete = await objectExists(key);

  console.log(`[INFO] Question-bank PDF exists after delete: ${existsAfterDelete ? "YES" : "NO"}`);
  assert(!existsAfterDelete, "Question-bank PDF still exists after delete");
}

async function run() {
  console.log("[INFO] Running landing + question-bank storage delete checks");
  await testLandingImageDelete();
  await testQuestionBankPdfDelete();
  console.log("✅ Landing + question-bank storage delete checks passed");
}

run().catch((error) => {
  console.error(`❌ Landing/question-bank delete check failed: ${error.message}`);
  process.exit(1);
});
