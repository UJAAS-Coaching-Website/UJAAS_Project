import dotenv from "dotenv";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const {
  uploadAvatarToStorage,
  deleteAvatarFromStorage,
  uploadNoteToStorage,
  deleteNoteFromStorage,
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
  console.error("Missing storage env vars. Required: STORAGE_BUCKET_NAME, STORAGE_S3_ENDPOINT, STORAGE_S3_ACCESS_KEY_ID, STORAGE_S3_SECRET_ACCESS_KEY, STORAGE_PUBLIC_BASE_URL");
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
    await s3.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
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

async function runAvatarDeleteAndReplaceTest() {
  console.log("[TEST] Avatar storage delete/replace behavior");

  const testUserId = `storage-test-user-${Date.now()}`;

  const avatarUrl1 = await uploadAvatarToStorage(tinyPngBuffer, testUserId);
  const avatarKey1 = keyFromUrl(avatarUrl1);
  assert(avatarKey1, `Cannot parse key from first avatar URL: ${avatarUrl1}`);

  const avatar1ExistsAfterUpload = await objectExists(avatarKey1);
  assert(avatar1ExistsAfterUpload, "First avatar object missing right after upload");

  const avatarUrl2 = await uploadAvatarToStorage(tinyPngBuffer, testUserId);
  const avatarKey2 = keyFromUrl(avatarUrl2);
  assert(avatarKey2, `Cannot parse key from second avatar URL: ${avatarUrl2}`);

  const avatar2ExistsAfterUpload = await objectExists(avatarKey2);
  assert(avatar2ExistsAfterUpload, "Second avatar object missing right after upload");

  // Simulate the current controller flow on replacement: new upload + DB pointer update only.
  const avatar1ExistsAfterReplace = await objectExists(avatarKey1);

  await deleteAvatarFromStorage(avatarUrl2);
  const avatar2ExistsAfterDelete = await objectExists(avatarKey2);

  // Cleanup possible leftover from replacement flow.
  if (avatar1ExistsAfterReplace) {
    await deleteAvatarFromStorage(avatarUrl1);
  }

  const avatar1ExistsAfterCleanup = await objectExists(avatarKey1);

  console.log(`[INFO] First avatar exists immediately after replacement: ${avatar1ExistsAfterReplace ? "YES" : "NO"}`);
  console.log(`[INFO] Second avatar exists after delete: ${avatar2ExistsAfterDelete ? "YES" : "NO"}`);
  console.log(`[INFO] First avatar exists after explicit cleanup delete: ${avatar1ExistsAfterCleanup ? "YES" : "NO"}`);

  return {
    replaceLeavesOldObject: avatar1ExistsAfterReplace,
    deleteRemovesCurrentObject: !avatar2ExistsAfterDelete,
    explicitDeleteRemovesOldObject: !avatar1ExistsAfterCleanup,
  };
}

async function runNotePdfDeleteTest() {
  console.log("[TEST] Note PDF storage delete behavior");

  const chapterContext = {
    id: `chapter-${Date.now()}`,
    batch_id: `batch-${Date.now()}`,
  };
  const noteId = `note-${Date.now()}`;

  const noteUrl = await uploadNoteToStorage(
    fakePdfBuffer,
    "storage-check.pdf",
    "application/pdf",
    chapterContext,
    noteId
  );

  const noteKey = keyFromUrl(noteUrl);
  assert(noteKey, `Cannot parse key from note URL: ${noteUrl}`);

  const noteExistsAfterUpload = await objectExists(noteKey);
  assert(noteExistsAfterUpload, "Note PDF missing right after upload");

  await deleteNoteFromStorage(noteUrl);
  const noteExistsAfterDelete = await objectExists(noteKey);

  console.log(`[INFO] Note PDF exists after delete: ${noteExistsAfterDelete ? "YES" : "NO"}`);

  return {
    noteDeleteRemovesObject: !noteExistsAfterDelete,
  };
}

async function run() {
  console.log("[INFO] Running storage delete/replace validation");
  console.log(`[INFO] Endpoint: ${STORAGE_S3_ENDPOINT}`);
  console.log(`[INFO] Bucket: ${BUCKET_NAME}`);

  const avatar = await runAvatarDeleteAndReplaceTest();
  const note = await runNotePdfDeleteTest();

  const summary = {
    avatar,
    note,
  };

  console.log("\n[RESULT]", JSON.stringify(summary, null, 2));

  if (!avatar.deleteRemovesCurrentObject || !avatar.explicitDeleteRemovesOldObject || !note.noteDeleteRemovesObject) {
    throw new Error("One or more delete checks failed");
  }

  console.log("\n✅ Storage delete checks passed (replace behavior reported above)");
}

run().catch((error) => {
  console.error(error);
  console.error(`\n❌ Storage delete/replace test failed: ${error.message}`);
  process.exit(1);
});
