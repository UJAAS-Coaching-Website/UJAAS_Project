import pg from 'pg';
import dotenv from 'dotenv';
import { verifyPassword } from '../src/utils/password.js';

dotenv.config({ path: 'd:/UJAAS_Project/backend/.env' });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testLogin() {
    const loginId = 'admin@ujaas.com';
    const password = 'password123';

    try {
        console.log(`Attempting login for ${loginId}...`);
        const userLookup = await pool.query(
            "SELECT id, role, password_hash FROM users WHERE LOWER(login_id) = $1",
            [loginId.toLowerCase()]
        );

        if (userLookup.rowCount === 0) {
            console.log("User not found!");
            return;
        }

        const dbUser = userLookup.rows[0];
        console.log("User found:", { id: dbUser.id, role: dbUser.role, hash: dbUser.password_hash });
        
        const validPassword = verifyPassword(password, dbUser.password_hash);
        console.log("Password valid:", validPassword);

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
      CASE
        WHEN b.name IS NULL THEN ARRAY[]::text[]
        ELSE ARRAY[b.name]
      END AS enrolled_courses,
      b.name AS batch_name
    FROM users u
    LEFT JOIN students s ON s.user_id = u.id
    LEFT JOIN faculties f ON f.user_id = u.id
    LEFT JOIN student_ratings r ON r.student_id = s.user_id
    LEFT JOIN batches b ON b.id = s.assigned_batch_id
    WHERE u.id = $1
    GROUP BY
      u.id, u.name, u.login_id, u.role,
      s.roll_number, s.phone, s.address, s.dob, s.parent_contact, s.join_date,
      f.phone, f.subject, f.designation, f."joining-date",
      r.attendance, r.assignments, r.participation, r.behavior,
      b.id, b.name
  `;

        console.log("Fetching profile...");
        const profile = await pool.query(query, [dbUser.id]);
        console.log("Profile fetched successfully:", profile.rows[0]);

    } catch (err) {
        console.error("Login test failed with error:", err);
    } finally {
        await pool.end();
    }
}

testLogin();
