import { pool } from "../db/index.js";
import { getStudentBatchModel } from "./studentBatchModel.js";

async function tableExists(tableName, client = pool) {
    const result = await client.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = $1
        ) AS exists`,
        [tableName]
    );
    return result.rows[0]?.exists === true;
}

async function columnExists(tableName, columnName, client = pool) {
    const result = await client.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = $1
              AND column_name = $2
        ) AS exists`,
        [tableName, columnName]
    );
    return result.rows[0]?.exists === true;
}

/**
 * Get all batches with assigned faculty names and subjects.
 */
export async function getAllBatches() {
    const batchModel = await getStudentBatchModel();
    
    const subjectsSubquery = `COALESCE(
        (
            SELECT array_agg(s.name)
            FROM batch_subjects bs
            JOIN subjects s ON s.id = bs.subject_id
            WHERE bs.batch_id = b.id
        ),
        '{}'
    )`;

    const facultySubquery = `COALESCE(
        (
            SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'subject', s.name))
            FROM faculty_assignments fa
            JOIN batch_subjects bs ON bs.id = fa.batch_subject_id
            JOIN subjects s ON s.id = bs.subject_id
            JOIN users u ON u.id = fa.faculty_id
            WHERE bs.batch_id = b.id
        ),
        '[]'
    )`;

    const studentCountSubquery = batchModel === 'single' 
        ? `(SELECT COUNT(*) FROM students s WHERE s.assigned_batch_id = b.id)`
        : `(SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id)`;

    const result = await pool.query(`
        SELECT
            b.id,
            b.name,
            b.slug,
            b.is_active,
            b.timetable_url,
            ${subjectsSubquery} as subjects,
            ${facultySubquery} AS faculty,
            ${studentCountSubquery}::int AS student_count
        FROM batches b
        ORDER BY b.name
    `);
    return result.rows;
}

/**
 * Get a single batch by ID.
 */
export async function getBatchById(id) {
    const batchModel = await getStudentBatchModel();
    
    const subjectsSubquery = `COALESCE(
        (
            SELECT array_agg(s.name)
            FROM batch_subjects bs
            JOIN subjects s ON s.id = bs.subject_id
            WHERE bs.batch_id = b.id
        ),
        '{}'
    )`;

    const facultySubquery = `COALESCE(
        (
            SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'subject', s.name))
            FROM faculty_assignments fa
            JOIN batch_subjects bs ON bs.id = fa.batch_subject_id
            JOIN subjects s ON s.id = bs.subject_id
            JOIN users u ON u.id = fa.faculty_id
            WHERE bs.batch_id = b.id
        ),
        '[]'
    )`;

    const studentCountSubquery = batchModel === 'single' 
        ? `(SELECT COUNT(*) FROM students s WHERE s.assigned_batch_id = b.id)`
        : `(SELECT COUNT(*) FROM student_batches sb WHERE sb.batch_id = b.id)`;

    const result = await pool.query(`
        SELECT
            b.id,
            b.name,
            b.slug,
            b.is_active,
            b.timetable_url,
            ${subjectsSubquery} as subjects,
            ${facultySubquery} AS faculty,
            ${studentCountSubquery}::int AS student_count
        FROM batches b
        WHERE b.id = $1
    `, [id]);
    return result.rows[0] || null;
}

/**
 * Create a new batch.
 */
export async function createBatch({ name, subjects, facultyIds, timetable_url }) {
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
            `INSERT INTO batches (id, name, slug, is_active, timetable_url)
             VALUES (gen_random_uuid(), $1, $2, true, $3)
             RETURNING *`,
            [name, slug, timetable_url || null]
        );
        const batch = batchResult.rows[0];

        // 1. Handle Subjects
        if (subjects && subjects.length > 0) {
            for (const sName of subjects) {
                let sRes = await client.query("SELECT id FROM subjects WHERE name = $1", [sName]);
                let sId;
                if (sRes.rowCount === 0) {
                    sRes = await client.query("INSERT INTO subjects (name) VALUES ($1) RETURNING id", [sName]);
                }
                sId = sRes.rows[0].id;
                await client.query(
                    "INSERT INTO batch_subjects (batch_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    [batch.id, sId]
                );
            }
        }

        // 2. Assign Faculty
        if (facultyIds && facultyIds.length > 0) {
            for (const facultyId of facultyIds) {
                const fRes = await client.query("SELECT subject_id FROM faculties WHERE user_id = $1", [facultyId]);
                const fSubId = fRes.rows[0]?.subject_id;
                if (fSubId) {
                    const bsRes = await client.query(
                        "SELECT id FROM batch_subjects WHERE batch_id = $1 AND subject_id = $2",
                        [batch.id, fSubId]
                    );
                    if (bsRes.rowCount > 0) {
                        await client.query(
                            "INSERT INTO faculty_assignments (faculty_id, batch_subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                            [facultyId, bsRes.rows[0].id]
                        );
                    }
                }
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
 * Update batch details.
 */
export async function updateBatch(id, { name, is_active, subjects, facultyIds, timetable_url }) {
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
                 timetable_url = COALESCE($5, timetable_url)
             WHERE id = $1`,
            [id, name || null, newSlug, is_active !== undefined ? is_active : null, timetable_url !== undefined ? (timetable_url || null) : null]
        );

        if (subjects !== undefined) {
            // Optional: delete old links if needed, or just add new ones. 
            // Usually we might want to sync.
            for (const sName of subjects) {
                let sRes = await client.query("SELECT id FROM subjects WHERE name = $1", [sName]);
                let sId;
                if (sRes.rowCount === 0) {
                    sRes = await client.query("INSERT INTO subjects (name) VALUES ($1) RETURNING id", [sName]);
                }
                sId = sRes.rows[0].id;
                await client.query(
                    "INSERT INTO batch_subjects (batch_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    [id, sId]
                );
            }
        }

        if (facultyIds !== undefined) {
            await client.query(
                `DELETE FROM faculty_assignments 
                 WHERE batch_subject_id IN (SELECT id FROM batch_subjects WHERE batch_id = $1)`,
                [id]
            );
            
            if (facultyIds && facultyIds.length > 0) {
                for (const facultyId of facultyIds) {
                    const fRes = await client.query("SELECT subject_id FROM faculties WHERE user_id = $1", [facultyId]);
                    const fSubId = fRes.rows[0]?.subject_id;
                    if (fSubId) {
                        const bsRes = await client.query(
                            "SELECT id FROM batch_subjects WHERE batch_id = $1 AND subject_id = $2",
                            [id, fSubId]
                        );
                        if (bsRes.rowCount > 0) {
                            await client.query(
                                "INSERT INTO faculty_assignments (faculty_id, batch_subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                                [facultyId, bsRes.rows[0].id]
                            );
                        }
                    }
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

export async function permanentlyDeleteBatch(id) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const batchResult = await client.query(
            `SELECT id, is_active, timetable_url
             FROM batches
             WHERE id = $1
             LIMIT 1`,
            [id]
        );

        if (batchResult.rowCount === 0) {
            const error = new Error("batch not found");
            error.code = "BATCH_NOT_FOUND";
            throw error;
        }

        const batch = batchResult.rows[0];
        if (batch.is_active) {
            const error = new Error("only inactive batches can be deleted permanently");
            error.code = "BATCH_NOT_INACTIVE";
            throw error;
        }

        const batchModel = await getStudentBatchModel();
        
        const chapterFilter = `batch_subject_id IN (SELECT id FROM batch_subjects WHERE batch_id = $1)`;

        const [
            chapterCountResult,
            notesCountResult,
            dppCountResult,
            studentLinkCountResult,
            facultyLinkCountResult,
            testLinkRowsResult,
        ] = await Promise.all([
            client.query(`SELECT COUNT(*)::int AS count FROM chapters WHERE ${chapterFilter}`, [id]),
            client.query(`SELECT COUNT(*)::int AS count FROM notes n JOIN chapters c ON c.id = n.chapter_id WHERE c.${chapterFilter}`, [id]),
            client.query(`SELECT COUNT(*)::int AS count FROM dpps d JOIN chapters c ON c.id = d.chapter_id WHERE c.${chapterFilter}`, [id]),
            batchModel === "single"
                ? client.query(`SELECT COUNT(*)::int AS count FROM students WHERE assigned_batch_id = $1`, [id])
                : client.query(`SELECT COUNT(*)::int AS count FROM student_batches WHERE batch_id = $1`, [id]),
            client.query(`SELECT COUNT(*)::int AS count FROM faculty_assignments fa JOIN batch_subjects bs ON bs.id = fa.batch_subject_id WHERE bs.batch_id = $1`, [id]),
            client.query(`SELECT ttb.test_id, COUNT(all_links.batch_id)::int AS linked_batch_count FROM test_target_batches ttb JOIN test_target_batches all_links ON all_links.test_id = ttb.test_id WHERE ttb.batch_id = $1 GROUP BY ttb.test_id`, [id]),
        ]);

        const exclusiveTestIds = [];
        const sharedTestIds = [];
        for (const row of testLinkRowsResult.rows) {
            if (Number(row.linked_batch_count) > 1) {
                sharedTestIds.push(row.test_id);
            } else {
                exclusiveTestIds.push(row.test_id);
            }
        }

        await client.query(`DELETE FROM dpp_attempts da WHERE EXISTS (SELECT 1 FROM dpps d JOIN chapters c ON c.id = d.chapter_id WHERE d.id = da.dpp_id AND c.${chapterFilter})`, [id]);
        await client.query(`DELETE FROM dpp_target_batches dtb WHERE EXISTS (SELECT 1 FROM dpps d JOIN chapters c ON c.id = d.chapter_id WHERE d.id = dtb.dpp_id AND c.${chapterFilter})`, [id]);

        if (sharedTestIds.length > 0) {
            await client.query(`DELETE FROM test_target_batches WHERE batch_id = $1 AND test_id = ANY($2::uuid[])`, [id, sharedTestIds]);
        }

        if (exclusiveTestIds.length > 0) {
            await client.query(`DELETE FROM tests WHERE id = ANY($1::uuid[])`, [exclusiveTestIds]);
        }

        if (batchModel === "single") {
            await client.query(`UPDATE students SET assigned_batch_id = NULL WHERE assigned_batch_id = $1`, [id]);
        } else {
            await client.query(`DELETE FROM student_batches WHERE batch_id = $1`, [id]);
        }

        await client.query(`DELETE FROM batches WHERE id = $1`, [id]);

        await client.query("COMMIT");

        return {
            deletedBatchId: id,
            removedStudentLinks: Number(studentLinkCountResult.rows[0]?.count ?? 0),
            removedFacultyLinks: Number(facultyLinkCountResult.rows[0]?.count ?? 0),
            deletedChapters: Number(chapterCountResult.rows[0]?.count ?? 0),
            deletedNotes: Number(notesCountResult.rows[0]?.count ?? 0),
            deletedDpps: Number(dppCountResult.rows[0]?.count ?? 0),
            removedTimetableReference: batch.timetable_url ? 1 : 0,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Assign a student to a batch.
 */
export async function assignStudentToBatch(studentId, batchId) {
    await ensureActiveBatchExists(batchId);
    const batchModel = await getStudentBatchModel();
    if (batchModel === "single") {
        await pool.query(`UPDATE students SET assigned_batch_id = $2 WHERE user_id = $1`, [studentId, batchId]);
    } else {
        await pool.query(`DELETE FROM student_batches WHERE student_id = $1`, [studentId]);
        await pool.query(`INSERT INTO student_batches (student_id, batch_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [studentId, batchId]);
    }
}

/**
 * Remove a student from a batch.
 */
export async function removeStudentFromBatch(studentId, batchId) {
    const batchModel = await getStudentBatchModel();
    const result = await pool.query(
        batchModel === "single"
            ? `UPDATE students SET assigned_batch_id = NULL WHERE user_id = $1 AND assigned_batch_id = $2`
            : `DELETE FROM student_batches WHERE student_id = $1 AND batch_id = $2`,
        [studentId, batchId]
    );
    return result.rowCount > 0;
}

/**
 * Assign a faculty to a batch.
 */
export async function assignFacultyToBatch(facultyId, batchId) {
    await ensureActiveBatchExists(batchId);
    const fRes = await pool.query("SELECT subject_id FROM faculties WHERE user_id = $1", [facultyId]);
    const fSubId = fRes.rows[0]?.subject_id;
    if (fSubId) {
        const bsRes = await pool.query("SELECT id FROM batch_subjects WHERE batch_id = $1 AND subject_id = $2", [batchId, fSubId]);
        if (bsRes.rowCount > 0) {
            await pool.query(`INSERT INTO faculty_assignments (faculty_id, batch_subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [facultyId, bsRes.rows[0].id]);
        }
    }
}

/**
 * Remove a faculty from a batch.
 */
export async function removeFacultyFromBatch(facultyId, batchId) {
    const result = await pool.query(`DELETE FROM faculty_assignments WHERE faculty_id = $1 AND batch_subject_id IN (SELECT id FROM batch_subjects WHERE batch_id = $2)`, [facultyId, batchId]);
    return result.rowCount > 0;
}

/**
 * Get all students in a batch.
 */
export async function getBatchStudents(batchId) {
    const batchModel = await getStudentBatchModel();
    const result = await pool.query(batchModel === "single" ? `
        SELECT u.id, u.name, s.roll_number, s.phone
        FROM students s
        JOIN users u ON u.id = s.user_id
        WHERE s.assigned_batch_id = $1
        ORDER BY u.name
    ` : `
        SELECT u.id, u.name, s.roll_number, s.phone
        FROM student_batches sb
        JOIN students s ON s.user_id = sb.student_id
        JOIN users u ON u.id = sb.student_id
        WHERE sb.batch_id = $1
        ORDER BY u.name
    `, [batchId]);
    return result.rows;
}

/**
 * Get all faculty in a batch.
 */
export async function getBatchFaculty(batchId) {
    const result = await pool.query(`SELECT u.id, u.name, s.name as subject, f.phone FROM faculty_assignments fa JOIN batch_subjects bs ON bs.id = fa.batch_subject_id JOIN subjects s ON s.id = bs.subject_id JOIN faculties f ON f.user_id = fa.faculty_id JOIN users u ON u.id = f.user_id WHERE bs.batch_id = $1 ORDER BY u.name`, [batchId]);
    return result.rows;
}

/**
 * Check if a faculty is assigned to a specific batch.
 */
export async function isFacultyAssignedToBatch(facultyId, batchId) {
    const result = await pool.query(
        `SELECT 1 FROM faculty_assignments fa 
         JOIN batch_subjects bs ON bs.id = fa.batch_subject_id 
         WHERE fa.faculty_id = $1 AND bs.batch_id = $2`,
        [facultyId, batchId]
    );
    return result.rowCount > 0;
}

/**
 * Create a notification for all users in a batch.
 */
export async function createBatchNotification(batchId, { title, message, type = 'announcement' }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const batchModel = await getStudentBatchModel();

        const batchSubquery = batchModel === 'single'
            ? `SELECT user_id FROM students WHERE assigned_batch_id = $1`
            : `SELECT student_id AS user_id FROM student_batches WHERE batch_id = $1`;

        const facultySubquery = `SELECT faculty_id AS user_id FROM faculty_assignments fa JOIN batch_subjects bs ON bs.id = fa.batch_subject_id WHERE bs.batch_id = $1`;

        await client.query(`
            INSERT INTO notifications (user_id, title, message, type)
            SELECT p.user_id, $2, $3, $4
            FROM (
                ${batchSubquery}
                UNION
                ${facultySubquery}
            ) p
        `, [batchId, title, message, type]);

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
