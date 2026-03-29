import { pool } from "../db/index.js";
import { ensureActiveBatchExists } from "./batchAccessService.js";
import { deleteAllImagesForContext, deleteNoteFromStorage } from "./storageService.js";

async function getBatchSubjectId(batchId, subjectName, client = pool) {
    const res = await client.query(`
        SELECT bs.id 
        FROM batch_subjects bs
        JOIN subjects sub ON sub.id = bs.subject_id
        WHERE bs.batch_id = $1 AND sub.name = $2
    `, [batchId, subjectName]);
    
    if (res.rowCount > 0) return res.rows[0].id;
    
    // Create if missing
    let sRes = await client.query("SELECT id FROM subjects WHERE name = $1", [subjectName]);
    let sId = sRes.rows[0]?.id;
    if (!sId) {
        sRes = await client.query("INSERT INTO subjects (name) VALUES ($1) RETURNING id", [subjectName]);
        sId = sRes.rows[0].id;
    }
    const bsNew = await client.query(
        "INSERT INTO batch_subjects (batch_id, subject_id) VALUES ($1, $2) RETURNING id",
        [batchId, sId]
    );
    return bsNew.rows[0].id;
}

// Fetch chapters for a specific batch and subject
export const getChapters = async (batchId, subjectName) => {
    let query = `
        SELECT c.*, sub.name as subject_name, bs.batch_id
        FROM chapters c
        JOIN batch_subjects bs ON bs.id = c.batch_subject_id
        JOIN subjects sub ON sub.id = bs.subject_id
        JOIN batches b ON b.id = bs.batch_id
        WHERE b.is_active = true
    `;
    const params = [];
    
    if (batchId) {
        params.push(batchId);
        query += ` AND bs.batch_id = $${params.length}`;
    }
    
    if (subjectName) {
        params.push(subjectName);
        query += ` AND sub.name = $${params.length}`;
    }
    
    query += ` ORDER BY c.order_index ASC, c.created_at ASC`;
    
    const result = await pool.query(query, params);
    return result.rows;
};

// Get a single chapter by ID
export const getChapterById = async (id) => {
    const result = await pool.query(`
        SELECT c.*, sub.name as subject_name, bs.batch_id
        FROM chapters c
        JOIN batch_subjects bs ON bs.id = c.batch_subject_id
        JOIN subjects sub ON sub.id = bs.subject_id
        JOIN batches b ON b.id = bs.batch_id
        WHERE c.id = $1
          AND b.is_active = true
    `, [id]);
    return result.rows[0];
};

// Create a new chapter
export const createChapter = async (data) => {
    const { batch_id, subject_name, name, order_index } = data;
    await ensureActiveBatchExists(batch_id);
    const batchSubjectId = await getBatchSubjectId(batch_id, subject_name);
    
    const result = await pool.query(
        `INSERT INTO chapters (batch_subject_id, name, order_index)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [batchSubjectId, name, order_index || 0]
    );
    return { ...result.rows[0], batch_id, subject_name };
};

// Update a chapter
export const updateChapter = async (id, data) => {
    const { name, order_index } = data;
    const result = await pool.query(
        `UPDATE chapters
         SET name = COALESCE($1, name),
             order_index = COALESCE($2, order_index)
         WHERE id = $3
         RETURNING *`,
        [name, order_index, id]
    );
    return result.rows[0];
};

// Delete a chapter
export const deleteChapter = async (id) => {
    const client = await pool.connect();
    let dppIds = [];
    let noteUrls = [];

    try {
        await client.query("BEGIN");

        const dppResult = await client.query(
            `SELECT id FROM dpps WHERE chapter_id = $1`,
            [id]
        );
        dppIds = dppResult.rows.map((row) => row.id).filter(Boolean);

        const noteResult = await client.query(
            `SELECT file_url
             FROM notes
             WHERE chapter_id = $1
               AND file_url IS NOT NULL`,
            [id]
        );
        noteUrls = Array.from(new Set(noteResult.rows.map((row) => row.file_url).filter(Boolean)));

        const result = await client.query(
            `DELETE FROM chapters WHERE id = $1 RETURNING *`,
            [id]
        );

        await client.query("COMMIT");

        if (result.rowCount === 0) {
            return null;
        }

        for (const noteUrl of noteUrls) {
            try {
                await deleteNoteFromStorage(noteUrl);
            } catch (error) {
                console.error("chapter note storage cleanup failed:", noteUrl, error?.message || error);
            }
        }

        for (const dppId of dppIds) {
            try {
                await deleteAllImagesForContext("dpps", dppId);
            } catch (error) {
                console.error("chapter dpp image cleanup failed:", dppId, error?.message || error);
            }
        }

        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
