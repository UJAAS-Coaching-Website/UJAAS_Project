import { pool } from "../config/index.js";

// Fetch chapters for a specific batch and subject
export const getChapters = async (batchId, subjectName) => {
    let query = `
        SELECT * FROM chapters 
        WHERE 1=1
    `;
    const params = [];
    
    if (batchId) {
        params.push(batchId);
        query += ` AND batch_id = $${params.length}`;
    }
    
    if (subjectName) {
        params.push(subjectName);
        query += ` AND subject_name = $${params.length}`;
    }
    
    query += ` ORDER BY order_index ASC, created_at ASC`;
    
    const result = await pool.query(query, params);
    return result.rows;
};

// Get a single chapter by ID
export const getChapterById = async (id) => {
    const result = await pool.query(`SELECT * FROM chapters WHERE id = $1`, [id]);
    return result.rows[0];
};

// Create a new chapter
export const createChapter = async (data) => {
    const { batch_id, subject_name, name, order_index } = data;
    const result = await pool.query(
        `INSERT INTO chapters (batch_id, subject_name, name, order_index)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [batch_id, subject_name, name, order_index || 0]
    );
    return result.rows[0];
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
    const result = await pool.query(
        `DELETE FROM chapters WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};
