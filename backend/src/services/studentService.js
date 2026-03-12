import { pool } from "../db/index.js";
import { hashPassword } from "../utils/password.js";

/**
 * Generate initial password from student name: firstname@123
 */
function generateInitialPassword(name) {
    const firstName = name.split(" ")[0].toLowerCase();
    return `${firstName}@123`;
}

/**
 * Get all students with user info, batch assignments, and ratings.
 */
export async function getAllStudents() {
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
            COALESCE(r.attendance, 0) AS rating_attendance,
            COALESCE(r.assignments, 0) AS rating_assignments,
            COALESCE(r.participation, 0) AS rating_participation,
            COALESCE(r.behavior, 0) AS rating_behavior,
            COALESCE(
                json_agg(
                    json_build_object('id', b.id, 'name', b.name)
                ) FILTER (WHERE b.id IS NOT NULL),
                '[]'
            ) AS batches
        FROM users u
        JOIN students s ON s.user_id = u.id
        LEFT JOIN student_ratings r ON r.student_id = s.user_id
        LEFT JOIN student_batches sb ON sb.student_id = s.user_id
        LEFT JOIN batches b ON b.id = sb.batch_id AND b.is_active = true
        WHERE u.role = 'student'
        GROUP BY
            u.id, u.name, u.login_id,
            s.roll_number, s.phone, s.address, s.dob, s.parent_contact, s.join_date,
            r.attendance, r.assignments, r.participation, r.behavior
        ORDER BY u.name
    `);
    return result.rows;
}

/**
 * Get a single student by user ID.
 */
export async function getStudentById(id) {
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
            COALESCE(r.attendance, 0) AS rating_attendance,
            COALESCE(r.assignments, 0) AS rating_assignments,
            COALESCE(r.participation, 0) AS rating_participation,
            COALESCE(r.behavior, 0) AS rating_behavior,
            COALESCE(
                json_agg(
                    json_build_object('id', b.id, 'name', b.name)
                ) FILTER (WHERE b.id IS NOT NULL),
                '[]'
            ) AS batches
        FROM users u
        JOIN students s ON s.user_id = u.id
        LEFT JOIN student_ratings r ON r.student_id = s.user_id
        LEFT JOIN student_batches sb ON sb.student_id = s.user_id
        LEFT JOIN batches b ON b.id = sb.batch_id AND b.is_active = true
        WHERE u.id = $1 AND u.role = 'student'
        GROUP BY
            u.id, u.name, u.login_id,
            s.roll_number, s.phone, s.address, s.dob, s.parent_contact, s.join_date,
            r.attendance, r.assignments, r.participation, r.behavior
    `, [id]);
    return result.rows[0] || null;
}

/**
 * Create a new student: inserts into users + students, optionally assigns to a batch.
 * Returns the created student with full details.
 */
export async function createStudent({ name, rollNumber, phone, address, dateOfBirth, parentContact, batchId }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

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
        await client.query(
            `INSERT INTO students (user_id, roll_number, phone, address, dob, parent_contact, join_date)
             VALUES ($1, $2, $3, $4, NULLIF($5, '')::date, $6, CURRENT_DATE)`,
            [userId, rollNumber, phone || null, address || null, dateOfBirth || "", parentContact || null]
        );

        // Assign to batch if provided
        if (batchId) {
            await client.query(
                `INSERT INTO student_batches (student_id, batch_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [userId, batchId]
            );
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
 * Update student details (name, phone, address, dob, parentContact).
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

        // If rollNumber changed, update login_id too
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
 * Delete a student (cascades from users to students, student_batches).
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
    await pool.query(
        `INSERT INTO student_batches (student_id, batch_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [studentId, batchId]
    );
    return getStudentById(studentId);
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
