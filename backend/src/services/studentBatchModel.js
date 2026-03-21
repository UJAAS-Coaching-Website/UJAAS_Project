import { pool } from "../db/index.js";

let cachedMode = null;

async function detectStudentBatchModel() {
    const result = await pool.query(`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'students'
              AND column_name = 'assigned_batch_id'
        ) AS has_assigned_batch_id,
        EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'student_batches'
        ) AS has_student_batches
    `);

    const row = result.rows[0] || {};
    if (row.has_assigned_batch_id) {
        return "single";
    }
    if (row.has_student_batches) {
        return "legacy";
    }
    return "single";
}

export async function getStudentBatchModel() {
    if (!cachedMode) {
        cachedMode = detectStudentBatchModel().catch((error) => {
            cachedMode = null;
            throw error;
        });
    }
    return cachedMode;
}

export async function pickStudentBatchModel(variants) {
    const mode = await getStudentBatchModel();
    return mode === "single" ? variants.single : variants.legacy;
}
