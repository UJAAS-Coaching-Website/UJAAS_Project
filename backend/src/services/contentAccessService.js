import { pool } from "../db/index.js";

export async function getFacultyManagedChapter(chapterId, facultyUserId) {
    const result = await pool.query(`
        SELECT c.*, bs.batch_id, s.name as subject_name
        FROM chapters c
        JOIN batch_subjects bs ON bs.id = c.batch_subject_id
        JOIN subjects s ON s.id = bs.subject_id
        JOIN faculty_assignments fa ON fa.batch_subject_id = bs.id
        WHERE c.id = $1
          AND fa.faculty_id = $2
        LIMIT 1
    `, [chapterId, facultyUserId]);

    return result.rows[0] || null;
}

export async function getFacultyManagedNote(noteId, facultyUserId) {
    const result = await pool.query(`
        SELECT n.*, s.name as subject_name, bs.batch_id
        FROM notes n
        JOIN chapters c ON c.id = n.chapter_id
        JOIN batch_subjects bs ON bs.id = c.batch_subject_id
        JOIN subjects s ON s.id = bs.subject_id
        JOIN faculty_assignments fa ON fa.batch_subject_id = bs.id
        WHERE n.id = $1
          AND fa.faculty_id = $2
        LIMIT 1
    `, [noteId, facultyUserId]);

    return result.rows[0] || null;
}

export async function getFacultyManagedDpp(dppId, facultyUserId) {
    const result = await pool.query(`
        SELECT d.*, s.name as subject_name, bs.batch_id, c.name AS chapter_name
        FROM dpps d
        JOIN chapters c ON c.id = d.chapter_id
        JOIN batch_subjects bs ON bs.id = c.batch_subject_id
        JOIN subjects s ON s.id = bs.subject_id
        JOIN faculty_assignments fa ON fa.batch_subject_id = bs.id
        WHERE d.id = $1
          AND fa.faculty_id = $2
        LIMIT 1
    `, [dppId, facultyUserId]);

    return result.rows[0] || null;
}
