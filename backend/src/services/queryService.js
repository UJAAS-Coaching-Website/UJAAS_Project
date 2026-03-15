import { pool } from "../db/index.js";

export async function getAllQueries() {
    const result = await pool.query(
        `SELECT pq.id, pq.name, pq.email, pq.phone, pq.course_id, 
                lc.name AS course_name, pq.message, pq.status, pq.created_at
         FROM prospect_queries pq
         LEFT JOIN landing_courses lc ON pq.course_id = lc.id
         ORDER BY pq.created_at DESC`
    );
    return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        course: row.course_name ?? "Unknown",
        courseId: row.course_id,
        message: row.message ?? "",
        status: row.status,
        date: row.created_at,
    }));
}

export async function createQuery({ name, email, phone, courseId, message }) {
    const result = await pool.query(
        `INSERT INTO prospect_queries (id, name, email, phone, course_id, message, status, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'new', now())
         RETURNING id, name, email, phone, course_id, message, status, created_at`,
        [name, email, phone, courseId || null, message ?? ""]
    );
    const row = result.rows[0];

    // Fetch the course name for the response
    let courseName = "Unknown";
    if (row.course_id) {
        const courseRes = await pool.query("SELECT name FROM landing_courses WHERE id = $1", [row.course_id]);
        if (courseRes.rows.length > 0) courseName = courseRes.rows[0].name;
    }

    return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        course: courseName,
        courseId: row.course_id,
        message: row.message,
        status: row.status,
        date: row.created_at,
    };
}

export async function updateQueryStatus(id, status) {
    const validStatuses = ["new", "seen", "contacted"];
    if (!validStatuses.includes(status)) {
        throw new Error("Invalid status");
    }
    const result = await pool.query(
        "UPDATE prospect_queries SET status = $1 WHERE id = $2 RETURNING id",
        [status, id]
    );
    if (result.rowCount === 0) {
        return null;
    }
    return { id, status };
}

export async function deleteQuery(id) {
    const result = await pool.query(
        "DELETE FROM prospect_queries WHERE id = $1 RETURNING id",
        [id]
    );
    if (result.rowCount === 0) {
        return null;
    }
    return { id };
}
