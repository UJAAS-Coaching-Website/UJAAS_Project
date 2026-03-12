import { pool } from "../db/index.js";

export function toApiUser(row) {
    return {
        id: row.user_id,
        name: row.name,
        loginId: row.login_id,
        role: row.role,
        enrolledCourses: row.enrolled_courses ?? [],
        studentDetails:
            row.role === "student"
                ? {
                    rollNumber: row.roll_number ?? "",
                    batch: row.batch_name ?? "",
                    joinDate: row.join_date ?? null,
                    phone: row.phone ?? "",
                    address: row.address ?? "",
                    dateOfBirth: row.dob ?? null,
                    parentContact: row.parent_contact ?? "",
                    ratings: {
                        attendance: row.attendance ?? 0,
                        dppPerformance: row.assignments ?? 0,
                        tests: 0,
                        participation: row.participation ?? 0,
                        behavior: row.behavior ?? 0,
                        engagement: 0,
                    },
                }
                : null,
        facultyDetails:
            row.role === "faculty"
                ? {
                    phone: row.faculty_phone ?? "",
                    subjectSpecialty: row.faculty_subject ?? "",
                    designation: row.faculty_designation ?? "",
                    joinDate: row.faculty_join_date ?? null,
                }
                : null,
    };
}

export async function fetchUserProfileById(userId) {
    const query = `
    SELECT
      u.id AS user_id,
      u.name,
      u.login_id,
      u.role,
      s.roll_number,
      s.phone,
      s.address,
      TO_CHAR(s.dob, 'YYYY-MM-DD') AS dob,
      s.parent_contact,
      TO_CHAR(s.join_date, 'YYYY-MM-DD') AS join_date,
      f.phone AS faculty_phone,
      f.subject AS faculty_subject,
      f.designation AS faculty_designation,
      TO_CHAR(f."joining-date", 'YYYY-MM-DD') AS faculty_join_date,
      COALESCE(r.attendance, 0) AS attendance,
      COALESCE(r.assignments, 0) AS assignments,
      COALESCE(r.participation, 0) AS participation,
      COALESCE(r.behavior, 0) AS behavior,
      COALESCE(
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT b.name), NULL),
        ARRAY[]::text[]
      ) AS enrolled_courses,
      MIN(b.name) AS batch_name
    FROM users u
    LEFT JOIN students s ON s.user_id = u.id
    LEFT JOIN faculties f ON f.user_id = u.id
    LEFT JOIN student_ratings r ON r.student_id = s.user_id
    LEFT JOIN student_batches sb ON sb.student_id = s.user_id
    LEFT JOIN batches b ON b.id = sb.batch_id
    WHERE u.id = $1
    GROUP BY
      u.id, u.name, u.login_id, u.role,
      s.roll_number, s.phone, s.address, s.dob, s.parent_contact, s.join_date,
      f.phone, f.subject, f.designation, f."joining-date",
      r.attendance, r.assignments, r.participation, r.behavior
  `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] ? toApiUser(result.rows[0]) : null;
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
