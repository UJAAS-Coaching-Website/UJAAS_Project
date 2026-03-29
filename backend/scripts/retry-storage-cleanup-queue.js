import "./load-env.js";
import { deleteAllImagesForContext, deleteImageFromStorage } from "../src/services/storageService.js";
import {
  getStorageCleanupQueuePath,
  loadStorageCleanupQueue,
  persistStorageCleanupQueue,
} from "../src/services/storageCleanupQueueService.js";

function parseLimitArg(argv) {
  const raw = argv.find((arg) => arg.startsWith("--limit="));
  if (!raw) return Number(process.env.STORAGE_CLEANUP_RETRY_LIMIT || 200);
  const value = Number(raw.slice("--limit=".length));
  return Number.isFinite(value) && value > 0 ? value : 200;
}

async function processTask(task) {
  if (task.type === "delete_url") {
    if (!task.url) {
      throw new Error("Task is missing url");
    }
    await deleteImageFromStorage(task.url);
    return;
  }

  if (task.type === "delete_context") {
    if (!task.context || !task.contextId) {
      throw new Error("Task is missing context/contextId");
    }
    await deleteAllImagesForContext(task.context, task.contextId);
    return;
  }

  throw new Error(`Unsupported task type: ${task.type}`);
}

async function run() {
  const limit = parseLimitArg(process.argv.slice(2));
  const queue = await loadStorageCleanupQueue();

  console.log(`[cleanup-retry] queue path: ${getStorageCleanupQueuePath()}`);
  console.log(`[cleanup-retry] queued tasks: ${queue.length}`);

  if (queue.length === 0) {
    return;
  }

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const remaining = [];

  for (const task of queue) {
    if (processed >= limit) {
      remaining.push(task);
      continue;
    }

    processed += 1;

    try {
      await processTask(task);
      succeeded += 1;
    } catch (error) {
      failed += 1;
      remaining.push({
        ...task,
        attempts: Number(task.attempts || 0) + 1,
        errorMessage: error?.message || String(error),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  await persistStorageCleanupQueue(remaining);

  console.log(`[cleanup-retry] processed: ${processed}`);
  console.log(`[cleanup-retry] succeeded: ${succeeded}`);
  console.log(`[cleanup-retry] failed: ${failed}`);
  console.log(`[cleanup-retry] remaining: ${remaining.length}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("[cleanup-retry] failed:", error?.message || error);
  process.exit(1);
});
