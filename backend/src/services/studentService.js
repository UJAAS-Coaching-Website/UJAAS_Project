import { pool } from "../db/index.js";
import { hashPassword } from "../utils/password.js";
import { getStudentBatchModel } from "./studentBatchModel.js";
import { ensureActiveBatchExists } from "./batchAccessService.js";
import { deleteAvatarFromStorage } from "./storageService.js";

let studentEmailColumnExistsCache = null;

async function hasStudentEmailColumn(client = pool) {
    if (studentEmailColumnExistsCache !== null) {
        return studentEmailColumnExistsCache;
    }

    const result = await client.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'students'
              AND column_name = 'email'
        ) AS exists`
    );

    studentEmailColumnExistsCache = result.rows[0]?.exists === true;
    return studentEmailColumnExistsCache;
}

/**
 * Generate initial password from student name: firstname@123
 * (Keep local helper if used elsewhere in this file)
 */
function generateInitialPassword(name) {
    const firstName = name.trim().split(/\s+/)[0]?.toLowerCase() || 'user';
    return `${firstName}@123`;
}

/**
 * Get all students with user info, batch assignment, and aggregated ratings.
 * @param {string} search - Optional search term
 * @param {string} sortBy - Sort field: 'name', 'rollNumber', or 'rating' (default: 'name')
 * @param {string} sortOrder - Sort order: 'asc' or 'desc' (default: 'asc')
 */
export async function getAllStudents(search, sortBy = 'name', sortOrder = 'asc') {
    const batchModel = await getStudentBatchModel();
    const includeEmail = await hasStudentEmailColumn();
    
    const batchJoinSubquery = batchModel === 'single'
        ? `s.assigned_batch_id`
        : `(SELECT batch_id FROM student_batches WHERE student_id = u.id LIMIT 1)`;

    const ratingsSubquery = `COALESCE(
        (
            SELECT json_object_agg(
                sub.name, 
                json_build_object(
                    'attendance', COALESCE(r.attendance, 0)::float,
                    'total_classes', COALESCE(bs.total_classes, 0),
                    'attendance_rating', CASE WHEN COALESCE(bs.total_classes, 0) > 0 THEN LEAST(5, (COALESCE(r.attendance, 0)::float / bs.total_classes::float) * 5) ELSE 0 END,
                    'tests', COALESCE(r.test_performance, 0)::float,
                    'dppPerformance', COALESCE(r.dpp_performance, 0)::float,
                    'behavior', COALESCE(r.behavior, 0)::float,
                    'remarks', COALESCE(r.remarks, '')
                )
            )
            FROM batch_subjects bs
            JOIN subjects sub ON sub.id = bs.subject_id
            LEFT JOIN student_ratings r ON r.batch_subject_id = bs.id AND r.student_id = u.id
            WHERE bs.batch_id = ${batchJoinSubquery}
        ),
        '{}'
    )`;

    // Validate and sanitize sort parameters
    const validSortFields = ['name', 'roll_number', 'rating'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const order = ['asc', 'desc'].includes(String(sortOrder).toLowerCase()) ? String(sortOrder).toUpperCase() : 'ASC';

    // Build order clause based on sort field
    let orderClause = "ORDER BY u.name ASC";
    if (sortField === 'roll_number') {
        // Sort by numeric value when digits exist, with text fallback for stable ordering.
        orderClause = `
            ORDER BY
                NULLIF(regexp_replace(COALESCE(s.roll_number, ''), '[^0-9]', '', 'g'), '')::BIGINT ${order} NULLS LAST,
                s.roll_number ${order}
        `;
    } else if (sortField === 'rating') {
        orderClause = `ORDER BY (
            COALESCE((SELECT AVG(
                COALESCE(r.test_performance, 0) + 
                COALESCE(r.dpp_performance, 0) + 
                COALESCE(r.behavior, 0)
            ) FROM batch_subjects bs 
            LEFT JOIN student_ratings r ON r.batch_subject_id = bs.id AND r.student_id = u.id
            WHERE bs.batch_id = ${batchJoinSubquery}), 0)
        ) ${order}`;
    } else {
        orderClause = `ORDER BY u.name ${order}`;
    }

    const params = [];
    let searchClause = "";
    if (search && String(search).trim()) {
        params.push(`%${String(search).trim()}%`);
        searchClause = ` AND (
            u.name ILIKE $${params.length}
            OR u.login_id ILIKE $${params.length}
            OR s.roll_number ILIKE $${params.length}
            ${includeEmail ? `OR s.email ILIKE $${params.length}` : ""}
        )`;
    }

    const result = await pool.query(`
        SELECT
            u.id,
            u.name,
            u.login_id,
            u.avatar_url,
            s.roll_number,
            ${includeEmail ? "s.email," : "NULL::text AS email,"}
            s.phone,
            s.address,
            TO_CHAR(s.dob, 'YYYY-MM-DD') AS date_of_birth,
            s.parent_contact,
            TO_CHAR(s.join_date, 'YYYY-MM-DD') AS join_date,
            s.admin_remark,
            CASE
                WHEN b.id IS NULL THEN NULL
                ELSE json_build_object('id', b.id, 'name', b.name)
            END AS assigned_batch,
            ${ratingsSubquery} AS ratings
        FROM users u
        JOIN students s ON s.user_id = u.id
        LEFT JOIN batches b ON b.id = ${batchJoinSubquery}
        WHERE u.role = 'student'
        ${searchClause}
        ${orderClause}
    `, params);
    
    return result.rows.map(row => {
        const ratings = row.ratings || {};
        const ratingEntries = Object.values(ratings);
        const subjectRemarks = {};
        Object.entries(ratings).forEach(([subName, data]) => {
            subjectRemarks[subName] = data.remarks;
        });

        return {
            ...row,
            rating_attendance: ratingEntries[0]?.attendance_rating || 0,
            rating_total_classes: ratingEntries[0]?.total_classes || 0,
            rating_assignments: ratingEntries[0]?.tests || 0,
            rating_participation: ratingEntries[0]?.dppPerformance || 0,
            rating_behavior: ratingEntries[0]?.behavior || 0,
            subject_ratings: ratings,
            subject_remarks: subjectRemarks
        };
    });
}

/**
 * Get a single student by user ID.
 */
export async function getStudentById(id) {
    const batchModel = await getStudentBatchModel();
    const includeEmail = await hasStudentEmailColumn();

    const batchJoinSubquery = batchModel === 'single'
        ? `s.assigned_batch_id`
        : `(SELECT batch_id FROM student_batches WHERE student_id = u.id LIMIT 1)`;

    const ratingsSubquery = `COALESCE(
        (
            SELECT json_object_agg(
                sub.name, 
                json_build_object(
                    'attendance', COALESCE(r.attendance, 0)::float,
                    'total_classes', COALESCE(bs.total_classes, 0),
                    'attendance_rating', CASE WHEN COALESCE(bs.total_classes, 0) > 0 THEN LEAST(5, (COALESCE(r.attendance, 0)::float / bs.total_classes::float) * 5) ELSE 0 END,
                    'tests', COALESCE(r.test_performance, 0)::float,
                    'dppPerformance', COALESCE(r.dpp_performance, 0)::float,
                    'behavior', COALESCE(r.behavior, 0)::float,
                    'remarks', COALESCE(r.remarks, '')
                )
            )
            FROM batch_subjects bs
            JOIN subjects sub ON sub.id = bs.subject_id
            LEFT JOIN student_ratings r ON r.batch_subject_id = bs.id AND r.student_id = u.id
            WHERE bs.batch_id = ${batchJoinSubquery}
        ),
        '{}'
    )`;

    const result = await pool.query(`
        SELECT
            u.id,
            u.name,
            u.login_id,
            u.avatar_url,
            s.roll_number,
            ${includeEmail ? "s.email," : "NULL::text AS email,"}
            s.phone,
            s.address,
            TO_CHAR(s.dob, 'YYYY-MM-DD') AS date_of_birth,
            s.parent_contact,
            TO_CHAR(s.join_date, 'YYYY-MM-DD') AS join_date,
            s.admin_remark,
            CASE
                WHEN b.id IS NULL THEN NULL
                ELSE json_build_object('id', b.id, 'name', b.name)
            END AS assigned_batch,
            ${ratingsSubquery} AS ratings
        FROM users u
        JOIN students s ON s.user_id = u.id
        LEFT JOIN batches b ON b.id = ${batchJoinSubquery}
        WHERE u.id = $1 AND u.role = 'student'
    `, [id]);
    
    if (result.rowCount === 0) return null;
    const row = result.rows[0];
    const ratings = row.ratings || {};
    const ratingEntries = Object.values(ratings);
    const subjectRemarks = {};
    Object.entries(ratings).forEach(([subName, data]) => {
        subjectRemarks[subName] = data.remarks;
    });
    
    return {
        ...row,
        rating_attendance: ratingEntries[0]?.attendance_rating || 0,
        rating_total_classes: ratingEntries[0]?.total_classes || 0,
        rating_assignments: ratingEntries[0]?.tests || 0,
        rating_participation: ratingEntries[0]?.dppPerformance || 0,
        rating_behavior: ratingEntries[0]?.behavior || 0,
        subject_ratings: ratings,
        subject_remarks: subjectRemarks
    };
}

/**
 * Create a new student.
 */
export async function createStudent({ name, rollNumber, email, phone, address, dateOfBirth, parentContact, batchId }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const batchModel = await getStudentBatchModel();
        const includeEmail = await hasStudentEmailColumn(client);
        if (batchId) {
            await ensureActiveBatchExists(batchId, client);
        }

        const password = hashPassword(generateInitialPassword(name));

        const normalizedEmail = typeof email === "string" && email.trim()
            ? email.trim().toLowerCase()
            : null;

        const loginId = rollNumber;

        const userResult = await client.query(
            `INSERT INTO users (name, login_id, role, password_hash, created_at)
             VALUES ($1, $2, 'student', $3, NOW())
             RETURNING id`,
            [name, loginId, password]
        );
        const userId = userResult.rows[0].id;

        if (batchModel === "single") {
            if (includeEmail) {
                await client.query(
                    `INSERT INTO students (user_id, roll_number, email, phone, address, dob, parent_contact, join_date, assigned_batch_id)
                     VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::date, $7, CURRENT_DATE, $8)`,
                    [userId, rollNumber, normalizedEmail, phone || null, address || null, dateOfBirth || "", parentContact || null, batchId || null]
                );
            } else {
                await client.query(
                    `INSERT INTO students (user_id, roll_number, phone, address, dob, parent_contact, join_date, assigned_batch_id)
                     VALUES ($1, $2, $3, $4, NULLIF($5, '')::date, $6, CURRENT_DATE, $7)`,
                    [userId, rollNumber, phone || null, address || null, dateOfBirth || "", parentContact || null, batchId || null]
                );
            }
        } else {
            if (includeEmail) {
                await client.query(
                    `INSERT INTO students (user_id, roll_number, email, phone, address, dob, parent_contact, join_date)
                     VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::date, $7, CURRENT_DATE)`,
                    [userId, rollNumber, normalizedEmail, phone || null, address || null, dateOfBirth || "", parentContact || null]
                );
            } else {
                await client.query(
                    `INSERT INTO students (user_id, roll_number, phone, address, dob, parent_contact, join_date)
                     VALUES ($1, $2, $3, $4, NULLIF($5, '')::date, $6, CURRENT_DATE)`,
                    [userId, rollNumber, phone || null, address || null, dateOfBirth || "", parentContact || null]
                );
            }
            if (batchId) {
                await client.query(
                    `INSERT INTO student_batches (student_id, batch_id)
                     VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [userId, batchId]
                );
            }
        }

        await client.query("COMMIT");
        return getStudentById(userId);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Update student details.
 */
export async function updateStudent(id, { name, rollNumber, phone, address, dateOfBirth, parentContact, adminRemark }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const includeEmail = await hasStudentEmailColumn(client);

        const hasEmailInput = Object.prototype.hasOwnProperty.call(arguments[1] || {}, "email");
        const normalizedEmail = hasEmailInput
            ? (typeof arguments[1].email === "string" && arguments[1].email.trim()
                ? arguments[1].email.trim().toLowerCase()
                : null)
            : undefined;

        if (name) {
            await client.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, id]);
        }

        if (includeEmail) {
            await client.query(
                `UPDATE students
                 SET roll_number = COALESCE($2, roll_number),
                     email = CASE WHEN $3::text IS NULL THEN email ELSE $3 END,
                     phone = COALESCE($4, phone),
                     address = COALESCE($5, address),
                     dob = COALESCE(NULLIF($6, '')::date, dob),
                     parent_contact = COALESCE($7, parent_contact),
                     admin_remark = COALESCE($8, admin_remark)
                 WHERE user_id = $1`,
                [
                    id,
                    rollNumber || null,
                    hasEmailInput ? (normalizedEmail ?? "") : null,
                    phone || null,
                    address || null,
                    dateOfBirth || "",
                    parentContact || null,
                    adminRemark || null,
                ]
            );
        } else {
            await client.query(
                `UPDATE students
                 SET roll_number = COALESCE($2, roll_number),
                     phone = COALESCE($3, phone),
                     address = COALESCE($4, address),
                     dob = COALESCE(NULLIF($5, '')::date, dob),
                     parent_contact = COALESCE($6, parent_contact),
                     admin_remark = COALESCE($7, admin_remark)
                 WHERE user_id = $1`,
                [id, rollNumber || null, phone || null, address || null, dateOfBirth || "", parentContact || null, adminRemark || null]
            );
        }

        if (rollNumber) {
            await client.query(`UPDATE users SET login_id = $1 WHERE id = $2`, [rollNumber, id]);
        }

        await client.query("COMMIT");
        return getStudentById(id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Delete a student.
 */
export async function deleteStudent(id) {
    const preDeleteResult = await pool.query(
        "SELECT avatar_url FROM users WHERE id = $1 AND role = 'student'",
        [id]
    );

    const avatarUrl = preDeleteResult.rows[0]?.avatar_url || null;

    const result = await pool.query(
        "DELETE FROM users WHERE id = $1 AND role = 'student' RETURNING id",
        [id]
    );

    if (result.rowCount > 0 && avatarUrl) {
        try {
            await deleteAvatarFromStorage(avatarUrl);
        } catch (error) {
            console.error("student avatar cleanup failed:", id, error?.message || error);
        }
    }

    return result.rowCount > 0;
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
        await pool.query(
            `DELETE FROM student_batches WHERE student_id = $1`,
            [studentId]
        );
        await pool.query(
            `INSERT INTO student_batches (student_id, batch_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [studentId, batchId]
        );
    }
    return getStudentById(studentId);
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
 * Update student rating for a specific subject.
 */
export async function updateStudentRating(studentId, subjectName, ratings) {
    const { attendance, total_classes, tests, dppPerformance, behavior, remarks } = ratings;
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");
        
        const batchModel = await getStudentBatchModel();
        const normalizedSubjectName = String(subjectName).trim();

        const attendanceValue = attendance !== undefined ? attendance : null;
        
        const batchIdSubquery = batchModel === 'single'
            ? `(SELECT assigned_batch_id FROM students WHERE user_id = $1)`
            : `(SELECT batch_id FROM student_batches WHERE student_id = $1 LIMIT 1)`;

        const bRes = await client.query(`
            SELECT id FROM batches WHERE id = ${batchIdSubquery}
        `, [studentId]);
        const batchId = bRes.rows[0]?.id;
        
        if (!batchId) throw new Error("Student is not assigned to any batch");
        
        const bsRes = await client.query(`
            SELECT bs.id 
            FROM batch_subjects bs
            JOIN subjects sub ON sub.id = bs.subject_id
            WHERE bs.batch_id = $1 AND sub.name = $2
        `, [batchId, normalizedSubjectName]);
        
        let batchSubjectId = bsRes.rows[0]?.id;
        if (!batchSubjectId) {
            let sRes = await client.query("SELECT id FROM subjects WHERE name = $1", [normalizedSubjectName]);
            let sId = sRes.rows[0]?.id;
            if (!sId) {
                sRes = await client.query("INSERT INTO subjects (name) VALUES ($1) RETURNING id", [normalizedSubjectName]);
                sId = sRes.rows[0].id;
            }
            const bsNew = await client.query(
                `INSERT INTO batch_subjects (batch_id, subject_id)
                 VALUES ($1, $2)
                 ON CONFLICT (batch_id, subject_id) DO UPDATE SET batch_id = EXCLUDED.batch_id
                 RETURNING id`,
                [batchId, sId]
            );
            batchSubjectId = bsNew.rows[0].id;
        }
        
        if (total_classes !== undefined && total_classes !== null) {
            await client.query(
                "UPDATE batch_subjects SET total_classes = $1 WHERE id = $2",
                [total_classes, batchSubjectId]
            );
        }
        
          const result = await client.query(
                `INSERT INTO student_ratings (student_id, batch_subject_id, attendance, test_performance, dpp_performance, behavior, remarks, updated_at)
                 VALUES ($1, $2, COALESCE($3::numeric, 0), COALESCE($4::numeric, 0), COALESCE($5::numeric, 0), COALESCE($6::numeric, 0), $7, NOW())
             ON CONFLICT (student_id, batch_subject_id) DO UPDATE SET
                     attendance = CASE WHEN $3 IS NOT NULL THEN $3::numeric ELSE student_ratings.attendance END,
                     test_performance = CASE WHEN $4 IS NOT NULL THEN $4::numeric ELSE student_ratings.test_performance END,
                     dpp_performance = CASE WHEN $5 IS NOT NULL THEN $5::numeric ELSE student_ratings.dpp_performance END,
                     behavior = CASE WHEN $6 IS NOT NULL THEN $6::numeric ELSE student_ratings.behavior END,
                remarks = CASE WHEN $7 IS NOT NULL THEN $7 ELSE student_ratings.remarks END,
                updated_at = NOW()
             RETURNING id`,
            [
                studentId, 
                batchSubjectId, 
                attendanceValue, 
                tests !== undefined ? tests : null, 
                dppPerformance !== undefined ? dppPerformance : null, 
                behavior !== undefined ? behavior : null, 
                remarks !== undefined ? remarks : null
            ]
        );
        
        await client.query("COMMIT");
        
        const final = await client.query(`
            SELECT 
                r.*, 
                bs.total_classes,
                CASE WHEN bs.total_classes > 0 THEN LEAST(5, (r.attendance::float / bs.total_classes::float) * 5) ELSE 0 END as attendance_rating,
                sub.name as subject,
                r.test_performance::float as tests,
                r.dpp_performance::float as "dppPerformance",
                r.attendance::float as attendance,
                r.behavior::float as behavior
            FROM student_ratings r
            JOIN batch_subjects bs ON bs.id = r.batch_subject_id
            JOIN subjects sub ON sub.id = bs.subject_id
            WHERE r.id = $1
        `, [result.rows[0].id]);
        
        return final.rows[0];
        
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
