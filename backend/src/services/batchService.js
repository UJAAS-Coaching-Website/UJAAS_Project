import { pool } from "../db/index.js";

/**
 * Get all batches with assigned faculty names.
 * Actual DB columns: id, name, slug, subjects, is_active
 */
export async function getAllBatches() {
    const result = await pool.query(`
        SELECT
            b.id,
            b.name,
            b.slug,
            b.subjects,
            b.is_active,
            COALESCE(
                json_agg(
                    json_build_object('id', u.id, 'name', u.name)
                ) FILTER (WHERE u.id IS NOT NULL),
                '[]'
            ) AS faculty,
            (SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id)::int AS student_count
        FROM batches b
        LEFT JOIN faculty_batches fb ON fb.batch_id = b.id
        LEFT JOIN faculties f ON f.user_id = fb.faculty_id
        LEFT JOIN users u ON u.id = f.user_id
        GROUP BY b.id
        ORDER BY b.name
    `);
    return result.rows;
}

/**
 * Get a single batch by ID with faculty and student counts.
 */
export async function getBatchById(id) {
    const result = await pool.query(`
        SELECT
            b.id,
            b.name,
            b.slug,
            b.subjects,
            b.is_active,
            COALESCE(
                json_agg(
                    json_build_object('id', u.id, 'name', u.name)
                ) FILTER (WHERE u.id IS NOT NULL),
                '[]'
            ) AS faculty,
            (SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id)::int AS student_count
        FROM batches b
        LEFT JOIN faculty_batches fb ON fb.batch_id = b.id
        LEFT JOIN faculties f ON f.user_id = fb.faculty_id
        LEFT JOIN users u ON u.id = f.user_id
        WHERE b.id = $1
        GROUP BY b.id
    `, [id]);
    return result.rows[0] || null;
}

/**
 * Create a new batch with optional faculty assignments.
 */
export async function createBatch({ name, subjects, facultyIds }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'batch';
        let slug = baseSlug;
        let counter = 2;
        while (true) {
            const exists = await client.query("SELECT id FROM batches WHERE slug = $1", [slug]);
            if (exists.rowCount === 0) break;
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const batchResult = await client.query(
            `INSERT INTO batches (id, name, slug, subjects, is_active)
             VALUES (gen_random_uuid(), $1, $2, $3, true)
             RETURNING *`,
            [name, slug, subjects && subjects.length ? subjects : null]
        );
        const batch = batchResult.rows[0];

        // Assign faculty if provided
        if (facultyIds && facultyIds.length > 0) {
            for (const facultyId of facultyIds) {
                await client.query(
                    `INSERT INTO faculty_batches (faculty_id, batch_id)
                     VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [facultyId, batch.id]
                );
            }
        }

        await client.query("COMMIT");
        return getBatchById(batch.id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Update batch details and faculty assignments.
 */
export async function updateBatch(id, { name, is_active, subjects, facultyIds }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        let newSlug = null;
        if (name) {
            const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'batch';
            newSlug = baseSlug;
            let counter = 2;
            while (true) {
                const exists = await client.query("SELECT id FROM batches WHERE slug = $1 AND id != $2", [newSlug, id]);
                if (exists.rowCount === 0) break;
                newSlug = `${baseSlug}-${counter}`;
                counter++;
            }
        }

        await client.query(
            `UPDATE batches
             SET name = COALESCE($2, name),
                 slug = COALESCE($3, slug),
                 is_active = COALESCE($4, is_active),
                 subjects = COALESCE($5, subjects)
             WHERE id = $1`,
            [
                id,
                name || null,
                newSlug,
                is_active !== undefined ? is_active : null,
                subjects !== undefined ? (subjects && subjects.length ? subjects : null) : null,
            ]
        );

        // Replace faculty assignments if provided
        if (facultyIds !== undefined) {
            await client.query(
                "DELETE FROM faculty_batches WHERE batch_id = $1",
                [id]
            );
            if (facultyIds && facultyIds.length > 0) {
                for (const facultyId of facultyIds) {
                    await client.query(
                        `INSERT INTO faculty_batches (faculty_id, batch_id)
                         VALUES ($1, $2)
                         ON CONFLICT DO NOTHING`,
                        [facultyId, id]
                    );
                }
            }
        }

        await client.query("COMMIT");
        return getBatchById(id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function deleteBatch(id) {
    const deletedSuffix = `-deleted-${Date.now()}`;
    const result = await pool.query(
        "UPDATE batches SET is_active = false, slug = slug || $2 WHERE id = $1 RETURNING id",
        [id, deletedSuffix]
    );
    return result.rowCount > 0;
}

/**
 * Assign a student to a batch.
 */
export async function assignStudentToBatch(studentId, batchId) {
    await pool.query(
        `INSERT INTO student_batches (student_id, batch_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [studentId, batchId]
    );
}

/**
 * Remove a student from a batch.
 */
export async function removeStudentFromBatch(studentId, batchId) {
    const result = await pool.query(
        "DELETE FROM student_batches WHERE student_id = $1 AND batch_id = $2",
        [studentId, batchId]
    );
    return result.rowCount > 0;
}

/**
 * Assign a faculty to a batch.
 */
export async function assignFacultyToBatch(facultyId, batchId) {
    await pool.query(
        `INSERT INTO faculty_batches (faculty_id, batch_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [facultyId, batchId]
    );
}

/**
 * Remove a faculty from a batch.
 */
export async function removeFacultyFromBatch(facultyId, batchId) {
    const result = await pool.query(
        "DELETE FROM faculty_batches WHERE faculty_id = $1 AND batch_id = $2",
        [facultyId, batchId]
    );
    return result.rowCount > 0;
}

/**
 * Get all students in a batch.
 */
export async function getBatchStudents(batchId) {
    const result = await pool.query(`
        SELECT u.id, u.name, s.roll_number, s.phone
        FROM student_batches sb
        JOIN students s ON s.user_id = sb.student_id
        JOIN users u ON u.id = s.user_id
        WHERE sb.batch_id = $1
        ORDER BY u.name
    `, [batchId]);
    return result.rows;
}

/**
 * Get all faculty in a batch.
 */
export async function getBatchFaculty(batchId) {
    const result = await pool.query(`
        SELECT u.id, u.name, f.subject, f.phone
        FROM faculty_batches fb
        JOIN faculties f ON f.user_id = fb.faculty_id
        JOIN users u ON u.id = f.user_id
        WHERE fb.batch_id = $1
        ORDER BY u.name
    `, [batchId]);
    return result.rows;
}
