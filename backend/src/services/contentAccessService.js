import { pool } from "../db/index.js";

export async function getFacultyManagedChapter(chapterId, facultyUserId) {
    const result = await pool.query(`
        SELECT c.*
        FROM chapters c
        JOIN faculty_batches fb
          ON fb.batch_id = c.batch_id
        JOIN faculties f
          ON f.user_id = fb.faculty_id
        WHERE c.id = $1
          AND fb.faculty_id = $2
          AND LOWER(TRIM(COALESCE(f.subject, ''))) = LOWER(TRIM(COALESCE(c.subject_name, '')))
        LIMIT 1
    `, [chapterId, facultyUserId]);

    return result.rows[0] || null;
}

export async function getFacultyManagedNote(noteId, facultyUserId) {
    const result = await pool.query(`
        SELECT n.*, c.subject_name, c.batch_id
        FROM notes n
        JOIN chapters c ON c.id = n.chapter_id
        JOIN faculty_batches fb ON fb.batch_id = c.batch_id
        JOIN faculties f ON f.user_id = fb.faculty_id
        WHERE n.id = $1
          AND fb.faculty_id = $2
          AND LOWER(TRIM(COALESCE(f.subject, ''))) = LOWER(TRIM(COALESCE(c.subject_name, '')))
        LIMIT 1
    `, [noteId, facultyUserId]);

    return result.rows[0] || null;
}

export async function getFacultyManagedDpp(dppId, facultyUserId) {
    const result = await pool.query(`
        SELECT d.*, c.subject_name, c.batch_id, c.name AS chapter_name
        FROM dpps d
        JOIN chapters c ON c.id = d.chapter_id
        JOIN faculty_batches fb ON fb.batch_id = c.batch_id
        JOIN faculties f ON f.user_id = fb.faculty_id
        WHERE d.id = $1
          AND fb.faculty_id = $2
          AND LOWER(TRIM(COALESCE(f.subject, ''))) = LOWER(TRIM(COALESCE(c.subject_name, '')))
        LIMIT 1
    `, [dppId, facultyUserId]);

    return result.rows[0] || null;
}
