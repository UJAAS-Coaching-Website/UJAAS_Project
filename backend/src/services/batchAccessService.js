import { pool } from "../db/index.js";

export async function getBatchAccessState(batchId, client = pool) {
    const result = await client.query(
        `SELECT id, is_active
         FROM batches
         WHERE id = $1
         LIMIT 1`,
        [batchId]
    );

    return result.rows[0] || null;
}

export async function ensureActiveBatchExists(batchId, client = pool) {
    const batch = await getBatchAccessState(batchId, client);

    if (!batch) {
        const error = new Error("batch not found");
        error.code = "BATCH_NOT_FOUND";
        throw error;
    }

    if (!batch.is_active) {
        const error = new Error("inactive batches cannot be used for this action");
        error.code = "BATCH_INACTIVE";
        throw error;
    }

    return batch;
}

export async function ensureActiveBatchIds(batchIds, client = pool) {
    const normalizedBatchIds = Array.from(new Set((batchIds || []).filter(Boolean)));
    if (normalizedBatchIds.length === 0) {
        return [];
    }

    const result = await client.query(
        `SELECT id
         FROM batches
         WHERE id = ANY($1::uuid[])
           AND is_active = true`,
        [normalizedBatchIds]
    );

    if (result.rowCount !== normalizedBatchIds.length) {
        const activeIds = new Set(result.rows.map((row) => row.id));
        const invalidIds = normalizedBatchIds.filter((batchId) => !activeIds.has(batchId));
        const error = new Error(`inactive or missing batches cannot be assigned: ${invalidIds.join(", ")}`);
        error.code = "INVALID_BATCH_ASSIGNMENT";
        error.invalidBatchIds = invalidIds;
        throw error;
    }

    return normalizedBatchIds;
}
