import { pool } from "../db/index.js";
import { hashPassword } from "../utils/password.js";
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
 * Generate initial password from student name: firstname@123
 */
function generateInitialPassword(name) {
    const firstName = name.split(" ")[0].toLowerCase();
    return `${firstName}@123`;
}

/**
 * Get all students with user info, batch assignment, and aggregated ratings.
 */
export async function getAllStudents() {
    const batchModel = await getStudentBatchModel();
    const hasBatchSubjects = await tableExists("batch_subjects");
    const hasSubjectsTable = await tableExists("subjects");
    const hasBatchSubjectId = await columnExists("student_ratings", "batch_subject_id");
    const hasLegacySubject = await columnExists("student_ratings", "subject");
    const hasTotalClasses = await columnExists("student_ratings", "total_classes");
    const hasTestPerformance = await columnExists("student_ratings", "test_performance");
    const hasAssignments = await columnExists("student_ratings", "assignments");
    const hasDppPerformance = await columnExists("student_ratings", "dpp_performance");
    const hasParticipation = await columnExists("student_ratings", "participation");
    const hasRemarks = await columnExists("student_ratings", "remarks");
    
    const batchJoinSubquery = batchModel === 'single'
        ? `s.assigned_batch_id`
        : `(SELECT batch_id FROM student_batches WHERE student_id = u.id LIMIT 1)`;

    const testColumn = hasTestPerformance ? "r.test_performance" : hasAssignments ? "r.assignments" : "0";
    const dppColumn = hasDppPerformance ? "r.dpp_performance" : hasParticipation ? "r.participation" : "0";
    const remarksColumn = hasRemarks ? "COALESCE(r.remarks, '')" : "''";
    const totalClassesColumn = hasTotalClasses ? "r.total_classes" : "0";

    const ratingsSubquery = hasBatchSubjects && hasSubjectsTable && hasBatchSubjectId
        ? `COALESCE(
                (
                    SELECT json_object_agg(
                        sub.name, 
                        json_build_object(
                            'attendance', r.attendance,
                            'total_classes', bs.total_classes,
                            'attendance_rating', CASE WHEN bs.total_classes > 0 THEN LEAST(5, (r.attendance::float / bs.total_classes::float) * 5) ELSE 0 END,
                            'tests', COALESCE(${testColumn}, 0),
                            'dppPerformance', COALESCE(${dppColumn}, 0),
                            'behavior', r.behavior,
                            'remarks', ${remarksColumn}
                        )
                    )
                    FROM student_ratings r
                    JOIN batch_subjects bs ON bs.id = r.batch_subject_id
                    JOIN subjects sub ON sub.id = bs.subject_id
                    WHERE r.student_id = u.id
                ),
                '{}'
            )`
        : hasLegacySubject
            ? `COALESCE(
                (
                    SELECT json_object_agg(
                        COALESCE(r.subject, 'General'),
                        json_build_object(
                            'attendance', r.attendance,
                            'total_classes', COALESCE(${totalClassesColumn}, 0),
                            'attendance_rating', CASE WHEN COALESCE(${totalClassesColumn}, 0) > 0 THEN LEAST(5, (r.attendance::float / ${totalClassesColumn}::float) * 5) ELSE 0 END,
                            'tests', COALESCE(${testColumn}, 0),
                            'dppPerformance', COALESCE(${dppColumn}, 0),
                            'behavior', r.behavior,
                            'remarks', ${remarksColumn}
                        )
                    )
                    FROM student_ratings r
                    WHERE r.student_id = u.id
                ),
                '{}'
            )`
            : `'{}'`;

    const result = await pool.query(`
        SELECT
            u.id,
            u.name,
            u.login_id,
            s.roll_number,
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
        ORDER BY u.name
    `);
    
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
    const hasBatchSubjects = await tableExists("batch_subjects");
    const hasSubjectsTable = await tableExists("subjects");
    const hasBatchSubjectId = await columnExists("student_ratings", "batch_subject_id");
    const hasLegacySubject = await columnExists("student_ratings", "subject");
    const hasTotalClasses = await columnExists("student_ratings", "total_classes");
    const hasTestPerformance = await columnExists("student_ratings", "test_performance");
    const hasAssignments = await columnExists("student_ratings", "assignments");
    const hasDppPerformance = await columnExists("student_ratings", "dpp_performance");
    const hasParticipation = await columnExists("student_ratings", "participation");
    const hasRemarks = await columnExists("student_ratings", "remarks");

    const batchJoinSubquery = batchModel === 'single'
        ? `s.assigned_batch_id`
        : `(SELECT batch_id FROM student_batches WHERE student_id = u.id LIMIT 1)`;

    const testColumn = hasTestPerformance ? "r.test_performance" : hasAssignments ? "r.assignments" : "0";
    const dppColumn = hasDppPerformance ? "r.dpp_performance" : hasParticipation ? "r.participation" : "0";
    const remarksColumn = hasRemarks ? "COALESCE(r.remarks, '')" : "''";
    const totalClassesColumn = hasTotalClasses ? "r.total_classes" : "0";

    const ratingsSubquery = hasBatchSubjects && hasSubjectsTable && hasBatchSubjectId
        ? `COALESCE(
                (
                    SELECT json_object_agg(
                        sub.name, 
                        json_build_object(
                            'attendance', r.attendance,
                            'total_classes', bs.total_classes,
                            'attendance_rating', CASE WHEN bs.total_classes > 0 THEN LEAST(5, (r.attendance::float / bs.total_classes::float) * 5) ELSE 0 END,
                            'tests', COALESCE(${testColumn}, 0),
                            'dppPerformance', COALESCE(${dppColumn}, 0),
                            'behavior', r.behavior,
                            'remarks', ${remarksColumn}
                        )
                    )
                    FROM student_ratings r
                    JOIN batch_subjects bs ON bs.id = r.batch_subject_id
                    JOIN subjects sub ON sub.id = bs.subject_id
                    WHERE r.student_id = u.id
                ),
                '{}'
            )`
        : hasLegacySubject
            ? `COALESCE(
                (
                    SELECT json_object_agg(
                        COALESCE(r.subject, 'General'),
                        json_build_object(
                            'attendance', r.attendance,
                            'total_classes', COALESCE(${totalClassesColumn}, 0),
                            'attendance_rating', CASE WHEN COALESCE(${totalClassesColumn}, 0) > 0 THEN LEAST(5, (r.attendance::float / ${totalClassesColumn}::float) * 5) ELSE 0 END,
                            'tests', COALESCE(${testColumn}, 0),
                            'dppPerformance', COALESCE(${dppColumn}, 0),
                            'behavior', r.behavior,
                            'remarks', ${remarksColumn}
                        )
                    )
                    FROM student_ratings r
                    WHERE r.student_id = u.id
                ),
                '{}'
            )`
            : `'{}'`;

    const result = await pool.query(`
        SELECT
            u.id,
            u.name,
            u.login_id,
            s.roll_number,
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
export async function createStudent({ name, rollNumber, phone, address, dateOfBirth, parentContact, batchId }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const batchModel = await getStudentBatchModel();

        const password = hashPassword(generateInitialPassword(name));

        // Insert user row
        const userResult = await client.query(
            `INSERT INTO users (name, login_id, role, password_hash, created_at)
             VALUES ($1, $2, 'student', $3, NOW())
             RETURNING id`,
            [name, rollNumber, password]
        );
        const userId = userResult.rows[0].id;

        // Insert student row
        if (batchModel === "single") {
            await client.query(
                `INSERT INTO students (user_id, roll_number, phone, address, dob, parent_contact, join_date, assigned_batch_id)
                 VALUES ($1, $2, $3, $4, NULLIF($5, '')::date, $6, CURRENT_DATE, $7)`,
                [userId, rollNumber, phone || null, address || null, dateOfBirth || "", parentContact || null, batchId || null]
            );
        } else {
            await client.query(
                `INSERT INTO students (user_id, roll_number, phone, address, dob, parent_contact, join_date)
                 VALUES ($1, $2, $3, $4, NULLIF($5, '')::date, $6, CURRENT_DATE)`,
                [userId, rollNumber, phone || null, address || null, dateOfBirth || "", parentContact || null]
            );
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

        if (name) {
            await client.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, id]);
        }

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
    const result = await pool.query(
        "DELETE FROM users WHERE id = $1 AND role = 'student' RETURNING id",
        [id]
    );
    return result.rowCount > 0;
}

/**
 * Assign a student to a batch.
 */
export async function assignStudentToBatch(studentId, batchId) {
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
        const hasBatchSubjects = await tableExists("batch_subjects", client);
        const hasBatchSubjectId = await columnExists("student_ratings", "batch_subject_id", client);
        const hasLegacySubjectColumn = await columnExists("student_ratings", "subject", client);
        const hasLegacyTotalClassesColumn = await columnExists("student_ratings", "total_classes", client);

        if (!subjectName || !String(subjectName).trim()) {
            throw new Error("Subject is required to update student rating");
        }

        const normalizedSubjectName = String(subjectName).trim();

        const attendanceValue = null;
        const behaviorValue = behavior;
        const testsValue = tests;
        const dppValue = dppPerformance;
        const totalClassesValue = total_classes;

        if (!hasBatchSubjects || !hasBatchSubjectId) {
            if (!hasLegacySubjectColumn) {
                throw new Error("student_ratings schema is missing both batch_subject_id and subject columns");
            }

            // Legacy schema update
            const result = await client.query(
                `INSERT INTO student_ratings (
                    student_id,
                    subject,
                    attendance,
                    ${hasLegacyTotalClassesColumn ? "total_classes," : ""}
                    test_performance,
                    dpp_performance,
                    behavior,
                    remarks,
                    updated_at
                )
                 VALUES (
                    $1,
                    $2,
                    COALESCE($3, 0),
                    ${hasLegacyTotalClassesColumn ? "COALESCE($4, 0)," : ""}
                    COALESCE($5, 0),
                    COALESCE($6, 0),
                    COALESCE($7, 0),
                    $8,
                    NOW()
                 )
                 ON CONFLICT (student_id, subject) DO UPDATE SET
                    attendance = COALESCE($3, student_ratings.attendance),
                    ${hasLegacyTotalClassesColumn ? "total_classes = COALESCE($4, student_ratings.total_classes)," : ""}
                    test_performance = COALESCE($5, student_ratings.test_performance),
                    dpp_performance = COALESCE($6, student_ratings.dpp_performance),
                    behavior = COALESCE($7, student_ratings.behavior),
                    remarks = COALESCE($8, student_ratings.remarks),
                    updated_at = NOW()
                 RETURNING *`,
                [studentId, normalizedSubjectName, attendanceValue, totalClassesValue, testsValue, dppValue, behaviorValue, remarks]
            );
            await client.query("COMMIT");
            return result.rows[0];
        }
        
        const batchIdSubquery = batchModel === 'single'
            ? `(SELECT assigned_batch_id FROM students WHERE user_id = $1)`
            : `(SELECT batch_id FROM student_batches WHERE student_id = $1 LIMIT 1)`;

        // 1. Identify Batch ID for this student
        const bRes = await client.query(`
            SELECT id FROM batches WHERE id = ${batchIdSubquery}
        `, [studentId]);
        const batchId = bRes.rows[0]?.id;
        
        if (!batchId) throw new Error("Student is not assigned to any batch");
        
        // 2. Identify/Create Batch Subject ID
        const bsRes = await client.query(`
            SELECT bs.id 
            FROM batch_subjects bs
            JOIN subjects sub ON sub.id = bs.subject_id
            WHERE bs.batch_id = $1 AND sub.name = $2
        `, [batchId, normalizedSubjectName]);
        
        let batchSubjectId = bsRes.rows[0]?.id;
        if (!batchSubjectId) {
            // Create subject if missing globally
            let sRes = await client.query("SELECT id FROM subjects WHERE name = $1", [normalizedSubjectName]);
            let sId = sRes.rows[0]?.id;
            if (!sId) {
                sRes = await client.query("INSERT INTO subjects (name) VALUES ($1) RETURNING id", [normalizedSubjectName]);
                sId = sRes.rows[0].id;
            }
            // Link the subject to the student's batch and reuse it if it already exists.
            const bsNew = await client.query(
                `INSERT INTO batch_subjects (batch_id, subject_id)
                 VALUES ($1, $2)
                 ON CONFLICT (batch_id, subject_id) DO UPDATE SET batch_id = EXCLUDED.batch_id
                 RETURNING id`,
                [batchId, sId]
            );
            batchSubjectId = bsNew.rows[0].id;
        }
        
        // 3. Update total_classes in batch_subjects if provided
        if (total_classes !== undefined && total_classes !== null) {
            await client.query(
                "UPDATE batch_subjects SET total_classes = $1 WHERE id = $2",
                [totalClassesValue ?? 0, batchSubjectId]
            );
        }
        
        // 4. UPSERT student_ratings for this batch_subject_id
        // Parameters: $1: studentId, $2: batchSubjectId, $3: attendance, $4: tests, $5: dppPerformance, $6: behavior, $7: remarks
        const result = await client.query(
            `INSERT INTO student_ratings (student_id, batch_subject_id, attendance, test_performance, dpp_performance, behavior, remarks, updated_at)
             VALUES ($1, $2, COALESCE($3, 0), COALESCE($4, 0), COALESCE($5, 0), COALESCE($6, 0), $7, NOW())
             ON CONFLICT (student_id, batch_subject_id) DO UPDATE SET
                attendance = CASE WHEN $3 IS NOT NULL THEN $3 ELSE student_ratings.attendance END,
                test_performance = CASE WHEN $4 IS NOT NULL THEN $4 ELSE student_ratings.test_performance END,
                dpp_performance = CASE WHEN $5 IS NOT NULL THEN $5 ELSE student_ratings.dpp_performance END,
                behavior = CASE WHEN $6 IS NOT NULL THEN $6 ELSE student_ratings.behavior END,
                remarks = CASE WHEN $7 IS NOT NULL THEN $7 ELSE student_ratings.remarks END,
                updated_at = NOW()
             RETURNING id`,
            [
                studentId, 
                batchSubjectId, 
                attendance !== undefined ? attendanceValue : null, 
                tests !== undefined ? testsValue : null, 
                dppPerformance !== undefined ? dppValue : null, 
                behavior !== undefined ? behaviorValue : null, 
                remarks !== undefined ? remarks : null
            ]
        );
        
        await client.query("COMMIT");
        
        // Fetch back latest joined data for response
        const final = await client.query(`
            SELECT 
                r.*, 
                bs.total_classes,
                CASE WHEN bs.total_classes > 0 THEN LEAST(5, (r.attendance::float / bs.total_classes::float) * 5) ELSE 0 END as attendance_rating,
                sub.name as subject,
                r.test_performance as tests,
                r.dpp_performance as "dppPerformance"
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
