import { pool } from "../db/index.js";

// Fetch notes for a specific chapter
export const getNotesByChapter = async (chapterId) => {
    const result = await pool.query(
        `SELECT * FROM notes WHERE chapter_id = $1 ORDER BY created_at ASC`,
        [chapterId]
    );
    return result.rows;
};

// Get a single note by ID
export const getNoteById = async (id) => {
    const result = await pool.query(`SELECT * FROM notes WHERE id = $1`, [id]);
    return result.rows[0];
};

// Create a new note
export const createNote = async (data) => {
    const { id, chapter_id, title, file_url } = data;
    const result = await pool.query(
        `INSERT INTO notes (id, chapter_id, title, file_url)
         VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4)
         RETURNING *`,
        [id || null, chapter_id, title, file_url]
    );
    return result.rows[0];
};

// Update a note
export const updateNote = async (id, data) => {
    const { title, file_url } = data;
    const result = await pool.query(
        `UPDATE notes
         SET title = COALESCE($1, title),
             file_url = COALESCE($2, file_url)
         WHERE id = $3
         RETURNING *`,
        [title, file_url, id]
    );
    return result.rows[0];
};

// Delete a note
export const deleteNote = async (id) => {
    const result = await pool.query(
        `DELETE FROM notes WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};
