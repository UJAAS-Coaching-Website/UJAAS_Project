import { pool } from "../db/index.js";
import { hashPassword } from "../utils/password.js";

/**
 * Generate initial password from faculty name: firstname@123
 */
function generateInitialPassword(name) {
    const firstName = name.split(" ")[0].toLowerCase();
    return `${firstName}@123`;
}

/**
 * Fetch all faculties by joining users and faculties tables.
 */
export async function getAllFaculties() {
    const result = await pool.query(`
        SELECT 
            u.id, 
            u.name, 
            u.login_id as email, 
            f.subject, 
            f.designation, 
            f.experience, 
            f.bio,
            f.phone
        FROM users u
        INNER JOIN faculties f ON u.id = f.user_id
        WHERE u.role = 'faculty' AND u.is_active = true
        ORDER BY u.name ASC
    `);

    return result.rows.map(row => ({
        ...row,
        rating: 4.5
    }));
}

/**
 * Create a new faculty: inserts into users + faculties.
 */
export async function createFaculty({ name, email, subject, phone, designation, experience }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const password = hashPassword(generateInitialPassword(name));

        const userResult = await client.query(
            `INSERT INTO users (name, login_id, role, password_hash, created_at)
             VALUES ($1, $2, 'faculty', $3, NOW())
             RETURNING id`,
            [name, email, password]
        );
        const userId = userResult.rows[0].id;

        await client.query(
            `INSERT INTO faculties (user_id, phone, subject, designation, experience)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, phone || null, subject || null, designation || null, experience || null]
        );

        await client.query("COMMIT");

        return {
            id: userId,
            name,
            email,
            subject: subject || null,
            designation: designation || null,
            experience: experience || null,
            phone: phone || null,
            rating: 4.5,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Update faculty details.
 */
export async function updateFaculty(id, { name, email, subject, phone, designation, experience }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        if (name) {
            await client.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, id]);
        }
        if (email) {
            await client.query(`UPDATE users SET login_id = $1 WHERE id = $2`, [email, id]);
        }

        await client.query(
            `UPDATE faculties
             SET phone = COALESCE($2, phone),
                 subject = COALESCE($3, subject),
                 designation = COALESCE($4, designation),
                 experience = COALESCE($5, experience)
             WHERE user_id = $1`,
            [id, phone || null, subject || null, designation || null, experience || null]
        );

        await client.query("COMMIT");

        // Fetch and return the updated faculty
        const result = await pool.query(`
            SELECT u.id, u.name, u.login_id as email, f.subject, f.designation, f.experience, f.bio, f.phone
            FROM users u INNER JOIN faculties f ON u.id = f.user_id
            WHERE u.id = $1
        `, [id]);
        return result.rows[0] ? { ...result.rows[0], rating: 4.5 } : null;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Delete a faculty.
 */
export async function deleteFaculty(id) {
    const result = await pool.query(
        "DELETE FROM users WHERE id = $1 AND role = 'faculty' RETURNING id",
        [id]
    );
    return result.rowCount > 0;
}
