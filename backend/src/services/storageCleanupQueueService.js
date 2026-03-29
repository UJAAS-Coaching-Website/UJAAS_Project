import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_QUEUE_PATH = path.join(process.cwd(), "runtime", "storage-cleanup-queue.json");
const QUEUE_PATH = process.env.STORAGE_CLEANUP_QUEUE_FILE || DEFAULT_QUEUE_PATH;

function buildTaskSignature(task) {
    if (task.type === "delete_url") {
        return `delete_url:${task.url || ""}`;
    }

    if (task.type === "delete_context") {
        return `delete_context:${task.context || ""}:${task.contextId || ""}`;
    }

    return `unknown:${task.type || ""}`;
}

function normalizeTask(task) {
    const now = new Date().toISOString();

    return {
        id: task.id || crypto.randomUUID(),
        type: task.type,
        url: task.url || null,
        context: task.context || null,
        contextId: task.contextId || null,
        source: task.source || null,
        errorMessage: task.errorMessage || null,
        attempts: Number(task.attempts || 0),
        createdAt: task.createdAt || now,
        updatedAt: now,
    };
}

export function getStorageCleanupQueuePath() {
    return QUEUE_PATH;
}

export async function loadStorageCleanupQueue() {
    try {
        const content = await fs.readFile(QUEUE_PATH, "utf8");
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter((item) => item && typeof item === "object");
    } catch (error) {
        if (error?.code === "ENOENT") {
            return [];
        }

        console.error("Failed to read storage cleanup queue:", error?.message || error);
        return [];
    }
}

export async function persistStorageCleanupQueue(queue) {
    try {
        await fs.mkdir(path.dirname(QUEUE_PATH), { recursive: true });
        await fs.writeFile(QUEUE_PATH, JSON.stringify(queue, null, 2), "utf8");
    } catch (error) {
        console.error("Failed to persist storage cleanup queue:", error?.message || error);
    }
}

export async function enqueueStorageCleanupTask(task) {
    if (!task || typeof task !== "object" || !task.type) {
        return null;
    }

    const queue = await loadStorageCleanupQueue();
    const normalized = normalizeTask(task);
    const signature = buildTaskSignature(normalized);

    const existingIndex = queue.findIndex((item) => buildTaskSignature(item) === signature);
    if (existingIndex >= 0) {
        queue[existingIndex] = {
            ...queue[existingIndex],
            errorMessage: normalized.errorMessage,
            source: normalized.source,
            updatedAt: normalized.updatedAt,
        };
        await persistStorageCleanupQueue(queue);
        return queue[existingIndex];
    }

    queue.push(normalized);
    await persistStorageCleanupQueue(queue);
    return normalized;
}
