import { pool } from "../db/index.js";

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
        rating: 4.5 // Provide a default mockup rating to match frontend UI
    }));
}
