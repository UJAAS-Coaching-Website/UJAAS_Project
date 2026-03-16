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

function average(entries, selector) {
    if (entries.length === 0) return 0;
    return Number(
        (
            entries.reduce((sum, entry) => sum + Number(selector(entry) || 0), 0) /
            entries.length
        ).toFixed(1)
    );
}

function buildStudentPayload(baseUser, studentRow, enrolledCourses, batchName, subjectRatings) {
    const ratingEntries = Object.values(subjectRatings);
    const subjectRemarks = Object.fromEntries(
        Object.entries(subjectRatings).map(([subjectName, entry]) => [subjectName, entry?.remarks || ""])
    );

    return {
        id: baseUser.id,
        name: baseUser.name,
        loginId: baseUser.login_id,
        role: baseUser.role,
        enrolledCourses,
        studentDetails: {
            rollNumber: studentRow?.roll_number ?? "",
            batch: batchName ?? "",
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
    const hasBatches = await tableExists("batches", client);

    if (!hasBatches) {
        return { enrolledCourses: [], batchName: "" };
    }

    if (batchModel === "single") {
        const result = await client.query(
            `SELECT b.name
             FROM students s
             LEFT JOIN batches b ON b.id = s.assigned_batch_id
             WHERE s.user_id = $1
             LIMIT 1`,
            [userId]
        );
        const batchName = result.rows[0]?.name || "";
        return {
            enrolledCourses: batchName ? [batchName] : [],
            batchName,
        };
    }

    const hasStudentBatches = await tableExists("student_batches", client);
    if (!hasStudentBatches) {
        return { enrolledCourses: [], batchName: "" };
    }

    const result = await client.query(
        `SELECT b.name
         FROM student_batches sb
         JOIN batches b ON b.id = sb.batch_id
         WHERE sb.student_id = $1
         ORDER BY b.name`,
        [userId]
    );

    const enrolledCourses = result.rows.map((row) => row.name).filter(Boolean);
    return {
        enrolledCourses,
        batchName: enrolledCourses[0] || "",
    };
}

async function getStudentSubjectRatings(userId, client = pool) {
    const hasRatingsTable = await tableExists("student_ratings", client);
    if (!hasRatingsTable) {
        return {};
    }

    const hasBatchSubjects = await tableExists("batch_subjects", client);
    const hasSubjectsTable = await tableExists("subjects", client);
    const hasBatchSubjectId = await columnExists("student_ratings", "batch_subject_id", client);
    const hasLegacySubject = await columnExists("student_ratings", "subject", client);
    const hasTestPerformance = await columnExists("student_ratings", "test_performance", client);
    const hasAssignments = await columnExists("student_ratings", "assignments", client);
    const hasDppPerformance = await columnExists("student_ratings", "dpp_performance", client);
    const hasParticipation = await columnExists("student_ratings", "participation", client);
    const hasRemarks = await columnExists("student_ratings", "remarks", client);
    const hasTotalClasses = await columnExists("student_ratings", "total_classes", client);

    const testColumn = hasTestPerformance ? "r.test_performance" : hasAssignments ? "r.assignments" : "0";
    const dppColumn = hasDppPerformance ? "r.dpp_performance" : hasParticipation ? "r.participation" : "0";
    const remarksColumn = hasRemarks ? "COALESCE(r.remarks, '')" : "''";

    if (hasBatchSubjects && hasSubjectsTable && hasBatchSubjectId) {
        const result = await client.query(
            `SELECT
                sub.name AS subject_name,
                COALESCE(r.attendance, 0) AS attendance,
                COALESCE(bs.total_classes, 0) AS total_classes,
                CASE
                    WHEN COALESCE(bs.total_classes, 0) > 0
                        THEN LEAST(5, (COALESCE(r.attendance, 0)::float / bs.total_classes::float) * 5)
                    ELSE 0
                END AS attendance_rating,
                COALESCE(${testColumn}, 0) AS tests,
                COALESCE(${dppColumn}, 0) AS dpp_performance,
                COALESCE(r.behavior, 0) AS behavior,
                ${remarksColumn} AS remarks
             FROM student_ratings r
             JOIN batch_subjects bs ON bs.id = r.batch_subject_id
             JOIN subjects sub ON sub.id = bs.subject_id
             WHERE r.student_id = $1`,
            [userId]
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

    if (hasLegacySubject) {
        const result = await client.query(
            `SELECT
                COALESCE(r.subject, 'General') AS subject_name,
                COALESCE(r.attendance, 0) AS attendance,
                COALESCE(${hasTotalClasses ? "r.total_classes" : "0"}, 0) AS total_classes,
                CASE
                    WHEN COALESCE(${hasTotalClasses ? "r.total_classes" : "0"}, 0) > 0
                        THEN LEAST(5, (COALESCE(r.attendance, 0)::float / NULLIF(r.total_classes, 0)::float) * 5)
                    ELSE 0
                END AS attendance_rating,
                COALESCE(${testColumn}, 0) AS tests,
                COALESCE(${dppColumn}, 0) AS dpp_performance,
                COALESCE(r.behavior, 0) AS behavior,
                ${remarksColumn} AS remarks
             FROM student_ratings r
             WHERE r.student_id = $1`,
            [userId]
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

    return {};
}

async function getFacultySubjectName(client = pool) {
    const hasSubjectsTable = await tableExists("subjects", client);
    const hasSubjectId = await columnExists("faculties", "subject_id", client);
    const hasLegacySubject = await columnExists("faculties", "subject", client);

    if (hasSubjectsTable && hasSubjectId) {
        return {
            joinClause: `LEFT JOIN subjects sub ON sub.id = f.subject_id`,
            selectClause: `sub.name AS faculty_subject`,
        };
    }

    if (hasLegacySubject) {
        return {
            joinClause: ``,
            selectClause: `f.subject AS faculty_subject`,
        };
    }

    return {
        joinClause: ``,
        selectClause: `NULL::text AS faculty_subject`,
    };
}

async function getFacultyDetails(userId, client = pool) {
    const hasFaculties = await tableExists("faculties", client);
    if (!hasFaculties) {
        return null;
    }

    const hasDesignation = await columnExists("faculties", "designation", client);
    const hasJoiningDateColumn = await columnExists("faculties", "joining-date", client);
    const hasJoinDateColumn = await columnExists("faculties", "join_date", client);
    const subjectSql = await getFacultySubjectName(client);

    const result = await client.query(
        `SELECT
            f.phone AS faculty_phone,
            ${subjectSql.selectClause},
            ${hasDesignation ? "f.designation" : "NULL::text"} AS faculty_designation,
            ${
                hasJoiningDateColumn
                    ? `TO_CHAR(f."joining-date", 'YYYY-MM-DD')`
                    : hasJoinDateColumn
                        ? `TO_CHAR(f.join_date, 'YYYY-MM-DD')`
                        : `NULL::text`
            } AS faculty_join_date
         FROM faculties f
         ${subjectSql.joinClause}
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
            `SELECT id, name, login_id, role
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
            const { enrolledCourses, batchName } = await getStudentEnrollment(userId, client);
            const subjectRatings = await getStudentSubjectRatings(userId, client);

            return buildStudentPayload(baseUser, studentRow, enrolledCourses, batchName, subjectRatings);
        }

        if (baseUser.role === "faculty") {
            return {
                id: baseUser.id,
                name: baseUser.name,
                loginId: baseUser.login_id,
                role: baseUser.role,
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
