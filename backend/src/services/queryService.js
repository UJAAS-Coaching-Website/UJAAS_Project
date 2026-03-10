import { pool } from "../db/index.js";

export async function getAllQueries() {
    const result = await pool.query(
        "SELECT id, name, email, phone, course, message, status, created_at FROM prospect_queries ORDER BY created_at DESC"
    );
    return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        course: row.course,
        message: row.message ?? "",
        status: row.status,
        date: row.created_at,
    }));
}

export async function createQuery({ name, email, phone, course, message }) {
    const result = await pool.query(
        `INSERT INTO prospect_queries (id, name, email, phone, course, message, status, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'new', now())
         RETURNING id, name, email, phone, course, message, status, created_at`,
        [name, email, phone, course, message ?? ""]
    );
    const row = result.rows[0];
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        course: row.course,
        message: row.message,
        status: row.status,
        date: row.created_at,
    };
}

export async function updateQueryStatus(id, status) {
    const validStatuses = ["new", "contacted", "completed"];
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
