import { pool } from "../db/index.js";
import { hashPassword } from "../utils/password.js";

/**
 * Helper to get or create subject ID by name
 */
async function getOrCreateSubjectId(name, client = pool) {
    if (!name) return null;
    const existing = await client.query("SELECT id FROM subjects WHERE name = $1", [name]);
    if (existing.rows[0]) return existing.rows[0].id;

    const created = await client.query(
        "INSERT INTO subjects (name) VALUES ($1) RETURNING id",
        [name]
    );
    return created.rows[0].id;
}



/**
 * Fetch all faculties by joining users, faculties and subjects.
 */
export async function getAllFaculties() {
    const result = await pool.query(`
        SELECT 
            u.id, 
            u.name, 
            u.login_id as email, 
            s.name as subject, 
            f.subject_id,
            f.designation, 
            f.phone,
            f.rating,
            f.review_count,
            TO_CHAR(f."joining-date", 'YYYY-MM-DD') AS joining_date
        FROM users u
        INNER JOIN faculties f ON u.id = f.user_id
        LEFT JOIN subjects s ON s.id = f.subject_id
        WHERE u.role = 'faculty'
        ORDER BY u.name ASC
    `);

    return result.rows.map(row => ({
        ...row,
        rating: Number(row.rating || 0),
        reviewCount: Number(row.review_count || 0)
    }));
}

/**
 * Create a new faculty: inserts into users + faculties.
 */
export async function createFaculty({ name, email, subject, phone, designation, joinDate, password }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const subjectId = await getOrCreateSubjectId(subject, client);
        const passwordHash = hashPassword(password);

        const userResult = await client.query(
            `INSERT INTO users (name, login_id, role, password_hash, created_at)
             VALUES ($1, $2, 'faculty', $3, NOW())
             RETURNING id`,
            [name, email, passwordHash]
        );
        const userId = userResult.rows[0].id;

        await client.query(
            `INSERT INTO faculties (user_id, phone, subject_id, designation, "joining-date")
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, phone || null, subjectId, designation || null, joinDate || null]
        );

        await client.query("COMMIT");

        return {
            id: userId,
            name,
            email,
            subject: subject || null,
            subject_id: subjectId,
            designation: designation || null,
            phone: phone || null,
            joining_date: joinDate || null,
            rating: 0,
            reviewCount: 0
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
export async function updateFaculty(id, { name, email, subject, phone, designation, joinDate }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        if (name) {
            await client.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, id]);
        }
        if (email) {
            await client.query(`UPDATE users SET login_id = $1 WHERE id = $2`, [email, id]);
        }

        let subjectId = undefined;
        if (subject !== undefined) {
            subjectId = await getOrCreateSubjectId(subject, client);
        }

        await client.query(
            `UPDATE faculties
             SET phone = COALESCE($2, phone),
                 subject_id = COALESCE($3, subject_id),
                 designation = COALESCE($4, designation),
                 "joining-date" = COALESCE($5, "joining-date")
             WHERE user_id = $1`,
            [id, phone || null, subjectId, designation || null, joinDate || undefined]
        );

        await client.query("COMMIT");

        // Fetch and return the updated faculty
        const result = await pool.query(`
            SELECT u.id, u.name, u.login_id as email, s.name as subject, f.subject_id, f.designation, f.phone,
                   f.rating, f.review_count,
                   TO_CHAR(f."joining-date", 'YYYY-MM-DD') AS joining_date
            FROM users u 
            INNER JOIN faculties f ON u.id = f.user_id
            LEFT JOIN subjects s ON s.id = f.subject_id
            WHERE u.id = $1
        `, [id]);
        return result.rows[0] ? { 
            ...result.rows[0], 
            rating: Number(result.rows[0].rating || 0),
            reviewCount: Number(result.rows[0].review_count || 0)
        } : null;
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
