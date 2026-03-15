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

async function ensureActiveBatchExists(batchId, client = pool) {
    const result = await client.query(
        `SELECT id, is_active
         FROM batches
         WHERE id = $1
         LIMIT 1`,
        [batchId]
    );

    if (result.rowCount === 0) {
        const error = new Error("batch not found");
        error.code = "BATCH_NOT_FOUND";
        throw error;
    }

    if (!result.rows[0].is_active) {
        const error = new Error("inactive batches cannot be used for this action");
        error.code = "BATCH_INACTIVE";
        throw error;
    }
}

/**
 * Get all batches with assigned faculty names.
 * Actual DB columns: id, name, slug, subjects, is_active
 */
export async function getAllBatches() {
    const batchModel = await getStudentBatchModel();
    const result = await pool.query(batchModel === "single" ? `
        SELECT
            b.id,
            b.name,
            b.slug,
            b.subjects,
            b.is_active,
            b.timetable_url,
            COALESCE(
                json_agg(
                    json_build_object('id', u.id, 'name', u.name)
                ) FILTER (WHERE u.id IS NOT NULL),
                '[]'
            ) AS faculty,
            (SELECT COUNT(*) FROM students s WHERE s.assigned_batch_id = b.id)::int AS student_count
        FROM batches b
        LEFT JOIN faculty_batches fb ON fb.batch_id = b.id
        LEFT JOIN faculties f ON f.user_id = fb.faculty_id
        LEFT JOIN users u ON u.id = f.user_id
        GROUP BY b.id
        ORDER BY b.name
    ` : `
        SELECT
            b.id,
            b.name,
            b.slug,
            b.subjects,
            b.is_active,
            b.timetable_url,
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
    const batchModel = await getStudentBatchModel();
    const result = await pool.query(batchModel === "single" ? `
        SELECT
            b.id,
            b.name,
            b.slug,
            b.subjects,
            b.is_active,
            b.timetable_url,
            COALESCE(
                json_agg(
                    json_build_object('id', u.id, 'name', u.name)
                ) FILTER (WHERE u.id IS NOT NULL),
                '[]'
            ) AS faculty,
            (SELECT COUNT(*) FROM students s WHERE s.assigned_batch_id = b.id)::int AS student_count
        FROM batches b
        LEFT JOIN faculty_batches fb ON fb.batch_id = b.id
        LEFT JOIN faculties f ON f.user_id = fb.faculty_id
        LEFT JOIN users u ON u.id = f.user_id
        WHERE b.id = $1
        GROUP BY b.id
    ` : `
        SELECT
            b.id,
            b.name,
            b.slug,
            b.subjects,
            b.is_active,
            b.timetable_url,
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
            `INSERT INTO batches (id, name, slug, subjects, is_active, timetable_url)
             VALUES (gen_random_uuid(), $1, $2, $3, true, $4)
             RETURNING *`,
            [name, slug, subjects && subjects.length ? subjects : null, timetable_url || null]
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
                 subjects = COALESCE($5, subjects),
                 timetable_url = COALESCE($6, timetable_url)
             WHERE id = $1`,
            [
                id,
                name || null,
                newSlug,
                is_active !== undefined ? is_active : null,
                subjects !== undefined ? (subjects && subjects.length ? subjects : null) : null,
                timetable_url !== undefined ? (timetable_url || null) : null
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
        const hasLegacyStudentBatches = await tableExists("student_batches", client);
        const hasDppAttempts = await tableExists("dpp_attempts", client);
        const hasDppTargetBatches = await tableExists("dpp_target_batches", client);
        const hasNotificationsBatchColumn = await columnExists("notifications", "batch_id", client);

        const [
            chapterCountResult,
            notesCountResult,
            dppCountResult,
            studentLinkCountResult,
            facultyLinkCountResult,
            notificationCountResult,
            testLinkRowsResult,
        ] = await Promise.all([
            client.query(
                `SELECT COUNT(*)::int AS count
                 FROM chapters
                 WHERE batch_id = $1`,
                [id]
            ),
            client.query(
                `SELECT COUNT(*)::int AS count
                 FROM notes n
                 JOIN chapters c ON c.id = n.chapter_id
                 WHERE c.batch_id = $1`,
                [id]
            ),
            client.query(
                `SELECT COUNT(*)::int AS count
                 FROM dpps d
                 JOIN chapters c ON c.id = d.chapter_id
                 WHERE c.batch_id = $1`,
                [id]
            ),
            batchModel === "single"
                ? client.query(
                    `SELECT COUNT(*)::int AS count
                     FROM students
                     WHERE assigned_batch_id = $1`,
                    [id]
                )
                : hasLegacyStudentBatches
                    ? client.query(
                        `SELECT COUNT(*)::int AS count
                         FROM student_batches
                         WHERE batch_id = $1`,
                        [id]
                    )
                    : Promise.resolve({ rows: [{ count: 0 }] }),
            client.query(
                `SELECT COUNT(*)::int AS count
                 FROM faculty_batches
                 WHERE batch_id = $1`,
                [id]
            ),
            hasNotificationsBatchColumn
                ? client.query(
                    `SELECT COUNT(*)::int AS count
                     FROM notifications
                     WHERE batch_id = $1`,
                    [id]
                )
                : Promise.resolve({ rows: [{ count: 0 }] }),
            client.query(
                `SELECT ttb.test_id,
                        COUNT(all_links.batch_id)::int AS linked_batch_count
                 FROM test_target_batches ttb
                 JOIN test_target_batches all_links ON all_links.test_id = ttb.test_id
                 WHERE ttb.batch_id = $1
                 GROUP BY ttb.test_id`,
                [id]
            ),
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

        let dppAttemptCount = 0;
        if (hasDppAttempts) {
            const dppAttemptCountResult = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM dpp_attempts da
                 WHERE EXISTS (
                     SELECT 1
                     FROM dpps d
                     JOIN chapters c ON c.id = d.chapter_id
                     WHERE d.id = da.dpp_id
                       AND c.batch_id = $1
                 )`,
                [id]
            );
            dppAttemptCount = Number(dppAttemptCountResult.rows[0]?.count ?? 0);

            await client.query(
                `DELETE FROM dpp_attempts da
                 WHERE EXISTS (
                     SELECT 1
                     FROM dpps d
                     JOIN chapters c ON c.id = d.chapter_id
                     WHERE d.id = da.dpp_id
                       AND c.batch_id = $1
                 )`,
                [id]
            );
        }

        if (hasDppTargetBatches) {
            await client.query(
                `DELETE FROM dpp_target_batches dtb
                 WHERE EXISTS (
                     SELECT 1
                     FROM dpps d
                     JOIN chapters c ON c.id = d.chapter_id
                     WHERE d.id = dtb.dpp_id
                       AND c.batch_id = $1
                 )`,
                [id]
            );
        }

        if (sharedTestIds.length > 0) {
            await client.query(
                `DELETE FROM test_target_batches
                 WHERE batch_id = $1
                   AND test_id = ANY($2::uuid[])`,
                [id, sharedTestIds]
            );
        }

        if (exclusiveTestIds.length > 0) {
            await client.query(
                `DELETE FROM tests
                 WHERE id = ANY($1::uuid[])`,
                [exclusiveTestIds]
            );
        }

        if (batchModel === "single") {
            await client.query(
                `UPDATE students
                 SET assigned_batch_id = NULL
                 WHERE assigned_batch_id = $1`,
                [id]
            );
        } else if (hasLegacyStudentBatches) {
            await client.query(
                `DELETE FROM student_batches
                 WHERE batch_id = $1`,
                [id]
            );
        }

        await client.query(
            `DELETE FROM faculty_batches
             WHERE batch_id = $1`,
            [id]
        );

        if (hasNotificationsBatchColumn) {
            await client.query(
                `DELETE FROM notifications
                 WHERE batch_id = $1`,
                [id]
            );
        }

        await client.query(
            `DELETE FROM batches
             WHERE id = $1`,
            [id]
        );

        await client.query("COMMIT");

        return {
            deletedBatchId: id,
            removedStudentLinks: Number(studentLinkCountResult.rows[0]?.count ?? 0),
            removedFacultyLinks: Number(facultyLinkCountResult.rows[0]?.count ?? 0),
            deletedChapters: Number(chapterCountResult.rows[0]?.count ?? 0),
            deletedNotes: Number(notesCountResult.rows[0]?.count ?? 0),
            deletedDpps: Number(dppCountResult.rows[0]?.count ?? 0),
            deletedDppAttempts: dppAttemptCount,
            deletedExclusiveTests: exclusiveTestIds.length,
            unlinkedSharedTests: sharedTestIds.length,
            deletedNotifications: Number(notificationCountResult.rows[0]?.count ?? 0),
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
        await pool.query(
            `UPDATE students
             SET assigned_batch_id = $2
             WHERE user_id = $1`,
            [studentId, batchId]
        );
    } else {
        await pool.query(`DELETE FROM student_batches WHERE student_id = $1`, [studentId]);
        await pool.query(
            `INSERT INTO student_batches (student_id, batch_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [studentId, batchId]
        );
    }
}

/**
 * Remove a student from a batch.
 */
export async function removeStudentFromBatch(studentId, batchId) {
    const batchModel = await getStudentBatchModel();
    const result = await pool.query(
        batchModel === "single"
            ? `UPDATE students
               SET assigned_batch_id = NULL
               WHERE user_id = $1
                 AND assigned_batch_id = $2`
            : `DELETE FROM student_batches
               WHERE student_id = $1
                 AND batch_id = $2`,
        [studentId, batchId]
    );
    return result.rowCount > 0;
}

/**
 * Assign a faculty to a batch.
 */
export async function assignFacultyToBatch(facultyId, batchId) {
    await ensureActiveBatchExists(batchId);
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

/**
 * Create a notification for all users in a batch.
 */
export async function createBatchNotification(batchId, { title, message, type = 'announcement' }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const batchModel = await getStudentBatchModel();

        // Insert notifications for all students and faculty in the batch
        // We use an INSERT INTO ... SELECT to do this efficiently in one go
        await client.query(batchModel === "single" ? `
            INSERT INTO notifications (user_id, title, message, type)
            SELECT p.user_id, $2, $3, $4
            FROM (
                SELECT user_id FROM students WHERE assigned_batch_id = $1
                UNION
                SELECT faculty_id AS user_id FROM faculty_batches WHERE batch_id = $1
            ) p
        ` : `
            INSERT INTO notifications (user_id, title, message, type)
            SELECT p.user_id, $2, $3, $4
            FROM (
                SELECT student_id AS user_id FROM student_batches WHERE batch_id = $1
                UNION
                SELECT faculty_id AS user_id FROM faculty_batches WHERE batch_id = $1
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
