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

function average(entries, selector) {
    if (entries.length === 0) return 0;
    return Number(
        (
            entries.reduce((sum, entry) => sum + Number(selector(entry) || 0), 0) /
            entries.length
        ).toFixed(1)
    );
}

function buildStudentPayload(baseUser, studentRow, enrolledCourses, batchName, batchId, subjectRatings) {
    const ratingEntries = Object.values(subjectRatings);
    const subjectRemarks = Object.fromEntries(
        Object.entries(subjectRatings).map(([subjectName, entry]) => [subjectName, entry?.remarks || ""])
    );

    return {
        id: baseUser.id,
        name: baseUser.name,
        loginId: baseUser.login_id,
        role: baseUser.role,
        avatarUrl: baseUser.avatar_url,
        enrolledCourses,
        studentDetails: {
            rollNumber: studentRow?.roll_number ?? "",
            batch: batchName ?? "",
            batchId: batchId ?? null,
            joinDate: studentRow?.join_date ?? null,
            phone: studentRow?.phone ?? "",
            address: studentRow?.address ?? "",
            dateOfBirth: studentRow?.dob ?? null,
            parentContact: studentRow?.parent_contact ?? "",
            ratings: {
                attendance: average(ratingEntries, (entry) => entry.attendanceRating),
                assignments: average(ratingEntries, (entry) => entry.tests),
                tests: average(ratingEntries, (entry) => entry.tests),
                testPerformance: average(ratingEntries, (entry) => entry.tests),
                participation: average(ratingEntries, (entry) => entry.dppPerformance),
                dppPerformance: average(ratingEntries, (entry) => entry.dppPerformance),
                behavior: average(ratingEntries, (entry) => entry.behavior),
                engagement: 0,
            },
        },
        subjectRatings,
        subjectRemarks,
        facultyDetails: null,
    };
}

async function getStudentEnrollment(userId, client = pool) {
    const batchModel = await getStudentBatchModel();

    if (batchModel === "single") {
        const result = await client.query(
            `SELECT b.id, b.name
             FROM students s
             LEFT JOIN batches b ON b.id = s.assigned_batch_id
             WHERE s.user_id = $1
             LIMIT 1`,
            [userId]
        );
        const batchName = result.rows[0]?.name || "";
        const batchId = result.rows[0]?.id || null;
        
        return {
            enrolledCourses: batchName ? [batchName] : [],
            batchName,
            batchId,
        };
    }

    const result = await client.query(
        `SELECT b.id, b.name
         FROM student_batches sb
         JOIN batches b ON b.id = sb.batch_id
         WHERE sb.student_id = $1
         ORDER BY b.name`,
        [userId]
    );

    const enrolledCourses = result.rows.map((row) => row.name).filter(Boolean);
    const batchId = result.rows[0]?.id || null;
    return {
        enrolledCourses,
        batchName: enrolledCourses[0] || "",
        batchId,
    };
}

async function getStudentSubjectRatings(userId, client = pool) {
    const batchModel = await getStudentBatchModel();
    let batchId = null;

    if (batchModel === "single") {
        const batchResult = await client.query(
            `SELECT assigned_batch_id FROM students WHERE user_id = $1 LIMIT 1`,
            [userId]
        );
        batchId = batchResult.rows[0]?.assigned_batch_id || null;
    } else {
        const batchResult = await client.query(
            `SELECT batch_id FROM student_batches WHERE student_id = $1 LIMIT 1`,
            [userId]
        );
        batchId = batchResult.rows[0]?.batch_id || null;
    }

    if (!batchId) {
        return {};
    }

    const result = await client.query(
        `SELECT
            sub.name AS subject_name,
            COALESCE(r.attendance, 0)::float AS attendance,
            COALESCE(bs.total_classes, 0) AS total_classes,
            CASE
                WHEN COALESCE(bs.total_classes, 0) > 0
                    THEN LEAST(5, (COALESCE(r.attendance, 0)::float / bs.total_classes::float) * 5)
                ELSE 0
            END AS attendance_rating,
            COALESCE(r.test_performance, 0)::float AS tests,
            COALESCE(r.dpp_performance, 0)::float AS dpp_performance,
            COALESCE(r.behavior, 0)::float AS behavior,
            COALESCE(r.remarks, '') AS remarks
         FROM batch_subjects bs
         JOIN subjects sub ON sub.id = bs.subject_id
         LEFT JOIN student_ratings r ON r.batch_subject_id = bs.id AND r.student_id = $1
         WHERE bs.batch_id = $2`,
        [userId, batchId]
    );

    return Object.fromEntries(
        result.rows.map((row) => [
            row.subject_name,
            {
                attendance: Number(row.attendance || 0),
                total_classes: Number(row.total_classes || 0),
                attendanceRating: Number(row.attendance_rating || 0),
                tests: Number(row.tests || 0),
                dppPerformance: Number(row.dpp_performance || 0),
                behavior: Number(row.behavior || 0),
                remarks: row.remarks || "",
            },
        ])
    );
}

async function getFacultyDetails(userId, client = pool) {
    const result = await client.query(
        `SELECT
            f.phone AS faculty_phone,
            sub.name AS faculty_subject,
            f.designation AS faculty_designation,
            TO_CHAR(f."joining-date", 'YYYY-MM-DD') AS faculty_join_date
         FROM faculties f
         LEFT JOIN subjects sub ON sub.id = f.subject_id
         WHERE f.user_id = $1
         LIMIT 1`,
        [userId]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
        phone: row.faculty_phone ?? "",
        subjectSpecialty: row.faculty_subject ?? "",
        designation: row.faculty_designation ?? "",
        joinDate: row.faculty_join_date ?? null,
    };
}

export async function fetchUserProfileById(userId) {
    const client = await pool.connect();
    try {
        const userResult = await client.query(
            `SELECT id, name, login_id, role, avatar_url
             FROM users
             WHERE id = $1
             LIMIT 1`,
            [userId]
        );

        const baseUser = userResult.rows[0];
        if (!baseUser) return null;

        if (baseUser.role === "student") {
            const studentResult = await client.query(
                `SELECT
                    roll_number,
                    phone,
                    address,
                    TO_CHAR(dob, 'YYYY-MM-DD') AS dob,
                    parent_contact,
                    TO_CHAR(join_date, 'YYYY-MM-DD') AS join_date
                 FROM students
                 WHERE user_id = $1
                 LIMIT 1`,
                [userId]
            );

            const studentRow = studentResult.rows[0] || {};
            const { enrolledCourses, batchName, batchId } = await getStudentEnrollment(userId, client);
            const subjectRatings = await getStudentSubjectRatings(userId, client);

            return buildStudentPayload(baseUser, studentRow, enrolledCourses, batchName, batchId, subjectRatings);
        }

        if (baseUser.role === "faculty") {
            return {
                id: baseUser.id,
                name: baseUser.name,
                loginId: baseUser.login_id,
                role: baseUser.role,
                avatarUrl: baseUser.avatar_url,
                enrolledCourses: [],
                studentDetails: null,
                facultyDetails: await getFacultyDetails(userId, client),
            };
        }

        return {
            id: baseUser.id,
            name: baseUser.name,
            loginId: baseUser.login_id,
            role: baseUser.role,
            avatarUrl: baseUser.avatar_url,
            enrolledCourses: [],
            studentDetails: null,
            facultyDetails: null,
        };
    } finally {
        client.release();
    }
}

export async function updateStudentProfile(userId, { name, phone, address, dateOfBirth, parentContact }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        await client.query(
            `UPDATE users SET name = $1 WHERE id = $2`,
            [name, userId]
        );

        const updateResult = await client.query(
            `
      UPDATE students
      SET
        phone = $1,
        address = $2,
        dob = NULLIF($3, '')::date,
        parent_contact = $4
          WHERE user_id = $5
          RETURNING user_id
          `,
            [phone ?? "", address ?? "", dateOfBirth ?? "", parentContact ?? "", userId]
        );

        if (updateResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return null;
        }

        await client.query("COMMIT");
        return fetchUserProfileById(userId);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function resetUserPassword(userId, newPassword, { revokeRefreshTokens = true } = {}) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const updateResult = await client.query(
            `UPDATE users
             SET password_hash = $1
             WHERE id = $2
             RETURNING id, name, login_id, role`,
            [hashPassword(newPassword), userId]
        );

        if (updateResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return null;
        }

        if (revokeRefreshTokens && (await tableExists("refresh_tokens", client))) {
            await client.query(
                `UPDATE refresh_tokens
                 SET revoked_at = now(), last_used_at = now()
                 WHERE user_id = $1 AND revoked_at IS NULL`,
                [userId]
            );
        }

        await client.query("COMMIT");
        return updateResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function updateUserAvatar(userId, avatarUrl) {
    const result = await pool.query(
        `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING avatar_url`,
        [avatarUrl, userId]
    );
    return result.rows[0]?.avatar_url;
}
