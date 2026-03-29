import "./load-env.js";
import { Pool } from "pg";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const connectionString = process.env.DATABASE_URL;
const bucketName = process.env.STORAGE_BUCKET_NAME;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const hasStorageConfig = Boolean(
  process.env.STORAGE_S3_REGION &&
  process.env.STORAGE_S3_ENDPOINT &&
  process.env.STORAGE_S3_ACCESS_KEY_ID &&
  process.env.STORAGE_S3_SECRET_ACCESS_KEY &&
  bucketName
);

function extractObjectKey(url) {
  if (!url || typeof url !== "string") return null;
  const marker = `/${bucketName}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

async function collectDbStorageRefs(client) {
  const refs = [];

  const users = await client.query(`SELECT id::text AS owner_id, avatar_url AS url FROM users WHERE avatar_url IS NOT NULL`);
  users.rows.forEach((row) => refs.push({ type: "avatar", owner: row.owner_id, url: row.url }));

  const notes = await client.query(`SELECT id::text AS owner_id, file_url AS url FROM notes WHERE file_url IS NOT NULL`);
  notes.rows.forEach((row) => refs.push({ type: "note", owner: row.owner_id, url: row.url }));

  const qbf = await client.query(`SELECT id::text AS owner_id, file_url AS url FROM question_bank_files WHERE file_url IS NOT NULL`);
  qbf.rows.forEach((row) => refs.push({ type: "question_bank", owner: row.owner_id, url: row.url }));

  const timetables = await client.query(`SELECT id::text AS owner_id, timetable_url AS url FROM batches WHERE timetable_url IS NOT NULL`);
  timetables.rows.forEach((row) => refs.push({ type: "timetable", owner: row.owner_id, url: row.url }));

  const landingFaculty = await client.query(`SELECT id::text AS owner_id, image_url AS url FROM landing_faculty WHERE image_url IS NOT NULL`);
  landingFaculty.rows.forEach((row) => refs.push({ type: "landing_faculty", owner: row.owner_id, url: row.url }));

  const landingAchievers = await client.query(`SELECT id::text AS owner_id, image_url AS url FROM landing_achievers WHERE image_url IS NOT NULL`);
  landingAchievers.rows.forEach((row) => refs.push({ type: "landing_achiever", owner: row.owner_id, url: row.url }));

  const landingVisions = await client.query(`SELECT id::text AS owner_id, image_url AS url FROM landing_visions WHERE image_url IS NOT NULL`);
  landingVisions.rows.forEach((row) => refs.push({ type: "landing_vision", owner: row.owner_id, url: row.url }));

  return refs;
}

async function collectBucketKeys() {
  const s3 = new S3Client({
    forcePathStyle: true,
    region: process.env.STORAGE_S3_REGION,
    endpoint: process.env.STORAGE_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
    },
  });

  const keys = new Set();

  while (true) {
    let list;
    try {
      list = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 1000,
        })
      );
    } catch (error) {
      const msg = String(error?.message || "").toLowerCase();
      if (msg.includes("does not exist") || msg.includes("nosuchkey")) {
        console.warn("[audit] Bucket listing returned NoSuchKey; treating bucket as empty.");
        return keys;
      }
      throw error;
    }

    (list.Contents || []).forEach((obj) => {
      if (obj.Key) keys.add(obj.Key);
    });

    if (!list.IsTruncated) break;
  }

  return keys;
}

async function run() {
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    const refs = await collectDbStorageRefs(client);

    console.log(`[audit] DB storage references found: ${refs.length}`);

    if (!hasStorageConfig) {
      console.log("[audit] Storage env not fully configured; skipping bucket-side verification.");
      return;
    }

    const bucketKeys = await collectBucketKeys();
    console.log(`[audit] Bucket objects found: ${bucketKeys.size}`);

    const brokenRefs = [];

    for (const ref of refs) {
      const key = extractObjectKey(ref.url);
      if (!key) {
        brokenRefs.push({ ...ref, reason: "unparseable_url" });
        continue;
      }

      if (!bucketKeys.has(key)) {
        brokenRefs.push({ ...ref, reason: "missing_object", key });
      }
    }

    if (brokenRefs.length === 0) {
      console.log("[audit] No broken DB -> storage references found.");
      return;
    }

    console.log(`[audit] Broken references: ${brokenRefs.length}`);
    brokenRefs.slice(0, 50).forEach((row, index) => {
      console.log(`${index + 1}. [${row.type}] owner=${row.owner} reason=${row.reason} url=${row.url}`);
    });

    if (brokenRefs.length > 50) {
      console.log(`[audit] ... ${brokenRefs.length - 50} more`);
    }
  } catch (error) {
    console.error("[audit] failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
