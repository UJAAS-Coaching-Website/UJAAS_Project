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
    
    const batchJoinSubquery = batchModel === 'single'
        ? `s.assigned_batch_id`
        : `(SELECT batch_id FROM student_batches WHERE student_id = u.id LIMIT 1)`;

    const ratingsSubquery = hasBatchSubjects
        ? `COALESCE(
                (
                    SELECT json_object_agg(
                        sub.name, 
                        json_build_object(
                            'attendance', r.attendance,
                            'total_classes', bs.total_classes,
                            'tests', r.assignments,
                            'dppPerformance', r.participation,
                            'behavior', r.behavior
                        )
                    )
                    FROM student_ratings r
                    JOIN batch_subjects bs ON bs.id = r.batch_subject_id
                    JOIN subjects sub ON sub.id = bs.subject_id
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
        const ratingEntries = Object.values(row.ratings || {});
        return {
            ...row,
            rating_attendance: ratingEntries[0]?.attendance || 0,
            rating_total_classes: ratingEntries[0]?.total_classes || 0,
            rating_assignments: ratingEntries[0]?.tests || 0,
            rating_participation: ratingEntries[0]?.dppPerformance || 0,
            rating_behavior: ratingEntries[0]?.behavior || 0,
            subject_ratings: row.ratings
        };
    });
}

/**
 * Get a single student by user ID.
 */
export async function getStudentById(id) {
    const batchModel = await getStudentBatchModel();
    const hasBatchSubjects = await tableExists("batch_subjects");

    const batchJoinSubquery = batchModel === 'single'
        ? `s.assigned_batch_id`
        : `(SELECT batch_id FROM student_batches WHERE student_id = u.id LIMIT 1)`;

    const ratingsSubquery = hasBatchSubjects
        ? `COALESCE(
                (
                    SELECT json_object_agg(
                        sub.name, 
                        json_build_object(
                            'attendance', r.attendance,
                            'total_classes', bs.total_classes,
                            'tests', r.assignments,
                            'dppPerformance', r.participation,
                            'behavior', r.behavior
                        )
                    )
                    FROM student_ratings r
                    JOIN batch_subjects bs ON bs.id = r.batch_subject_id
                    JOIN subjects sub ON sub.id = bs.subject_id
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
    const ratingEntries = Object.values(row.ratings || {});
    
    return {
        ...row,
        rating_attendance: ratingEntries[0]?.attendance || 0,
        rating_total_classes: ratingEntries[0]?.total_classes || 0,
        rating_assignments: ratingEntries[0]?.tests || 0,
        rating_participation: ratingEntries[0]?.dppPerformance || 0,
        rating_behavior: ratingEntries[0]?.behavior || 0,
        subject_ratings: row.ratings
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
export async function updateStudent(id, { name, rollNumber, phone, address, dateOfBirth, parentContact }) {
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
                 parent_contact = COALESCE($6, parent_contact)
             WHERE user_id = $1`,
            [id, rollNumber || null, phone || null, address || null, dateOfBirth || "", parentContact || null]
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
    const { attendance, total_classes, tests, dppPerformance, behavior } = ratings;
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");
        
        const batchModel = await getStudentBatchModel();
        const hasBatchSubjects = await tableExists("batch_subjects", client);

        if (!hasBatchSubjects) {
            // Legacy schema update
            const result = await client.query(
                `INSERT INTO student_ratings (student_id, subject, attendance, total_classes, assignments, participation, behavior, updated_at)
                 VALUES ($1, $2, COALESCE($3, 0), COALESCE($4, 0), COALESCE($5, 0), COALESCE($6, 0), COALESCE($7, 0), NOW())
                 ON CONFLICT (student_id, subject) DO UPDATE SET
                    attendance = COALESCE($3, student_ratings.attendance),
                    total_classes = COALESCE($4, student_ratings.total_classes),
                    assignments = COALESCE($5, student_ratings.assignments),
                    participation = COALESCE($6, student_ratings.participation),
                    behavior = COALESCE($7, student_ratings.behavior),
                    updated_at = NOW()
                 RETURNING *`,
                [studentId, subjectName, attendance, total_classes, tests, dppPerformance, behavior]
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
        `, [batchId, subjectName]);
        
        let batchSubjectId = bsRes.rows[0]?.id;
        if (!batchSubjectId) {
            // Create subject if missing globally
            let sRes = await client.query("SELECT id FROM subjects WHERE name = $1", [subjectName]);
            let sId = sRes.rows[0]?.id;
            if (!sId) {
                sRes = await client.query("INSERT INTO subjects (name) VALUES ($1) RETURNING id", [subjectName]);
                sId = sRes.rows[0].id;
            }
            // Link to batch
            const bsNew = await client.query(
                "INSERT INTO batch_subjects (batch_id, subject_id) VALUES ($1, $2) RETURNING id",
                [batchId, sId]
            );
            batchSubjectId = bsNew.rows[0].id;
        }
        
        // 3. Update total_classes in batch_subjects if provided
        if (total_classes !== undefined) {
            await client.query(
                "UPDATE batch_subjects SET total_classes = $1 WHERE id = $2",
                [total_classes, batchSubjectId]
            );
        }
        
        // 4. UPSERT student_ratings for this batch_subject_id
        // Map tests -> assignments, dppPerformance -> participation
        const result = await client.query(
            `INSERT INTO student_ratings (student_id, batch_subject_id, attendance, assignments, participation, behavior, updated_at)
             VALUES ($1, $2, COALESCE($3, 0), COALESCE($4, 0), COALESCE($5, 0), COALESCE($6, 0), NOW())
             ON CONFLICT (student_id, batch_subject_id) DO UPDATE SET
                attendance = COALESCE($3, student_ratings.attendance),
                assignments = COALESCE($4, student_ratings.assignments),
                participation = COALESCE($5, student_ratings.participation),
                behavior = COALESCE($6, student_ratings.behavior),
                updated_at = NOW()
             RETURNING *`,
            [studentId, batchSubjectId, attendance, tests, dppPerformance, behavior]
        );
        
        await client.query("COMMIT");
        
        // Fetch back latest joined data for response
        const final = await client.query(`
            SELECT 
                r.*, 
                bs.total_classes,
                sub.name as subject,
                r.assignments as tests,
                r.participation as "dppPerformance"
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
