import { pool } from "../db/index.js";

/**
 * Creates a notification and links it to multiple batches.
 * 
 * @param {string[]} batchIds - Array of batch UUIDs.
 * @param {object} params - { senderId, type, title, message, metadata, isSticky }
 */
export async function createMultiBatchNotification(batchIds, { senderId, type, title, message, metadata = {}, isSticky = false }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Insert the main notification
        const result = await client.query(
            `INSERT INTO notifications (sender_id, type, title, message, metadata, is_sticky)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [senderId || null, type, title, message, JSON.stringify(metadata), isSticky]
        );
        const notificationId = result.rows[0].id;

        // 2. Link to each batch
        for (const batchId of batchIds) {
            await client.query(
                `INSERT INTO notification_batches (notification_id, batch_id)
                 VALUES ($1, $2)`,
                [notificationId, batchId]
            );
        }

        await client.query("COMMIT");
        return notificationId;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get all notifications for a student's batch(es) that aren't deleted.
 */
export async function getStudentNotifications(studentId) {
    const result = await pool.query(
        `SELECT 
            n.id, 
            n.type, 
            n.title, 
            n.message, 
            n.metadata, 
            n.is_sticky, 
            n.created_at,
            u.name as sender_name,
            COALESCE(nd.is_read, false) as is_read
         FROM notifications n
         JOIN notification_batches nb ON nb.notification_id = n.id
         JOIN students st ON st.assigned_batch_id = nb.batch_id
         JOIN users su ON su.id = st.user_id
         LEFT JOIN users u ON u.id = n.sender_id
         LEFT JOIN notification_deliveries nd ON (nd.notification_id = n.id AND nd.student_id = $1)
         WHERE st.user_id = $1
         AND n.created_at >= su.created_at
         AND (nd.is_deleted IS NULL OR nd.is_deleted = false)
         ORDER BY n.is_sticky DESC, n.created_at DESC`,
        [studentId]
    );

    return result.rows;
}

/**
 * Delete notifications of a specific type.
 */
export async function deleteNotificationsByType(type) {
    await pool.query("DELETE FROM notifications WHERE type = $1", [type]);
}

/**
 * Mark a notification as read for a specific student.
 */
export async function markNotificationRead(studentId, notificationId) {
    await pool.query(
        `INSERT INTO notification_deliveries (notification_id, student_id, is_read)
         VALUES ($1, $2, true)
         ON CONFLICT (notification_id, student_id) DO UPDATE SET is_read = true`,
        [notificationId, studentId]
    );
}

/**
 * Mark a notification as deleted for a specific student (won't appear again).
 */
export async function deleteNotificationForStudent(studentId, notificationId) {
    await pool.query(
        `INSERT INTO notification_deliveries (notification_id, student_id, is_deleted)
         VALUES ($1, $2, true)
         ON CONFLICT (notification_id, student_id) DO UPDATE SET is_deleted = true`,
        [notificationId, studentId]
    );
}

/**
 * Automatically clean up expired faculty review notifications
 */
export async function cleanupExpiredReviewNotifications() {
    await pool.query(`
        DELETE FROM notifications 
        WHERE type = 'review' 
        AND NOT EXISTS (
            SELECT 1 FROM faculty_review_sessions 
            WHERE is_active = true AND expiry_time > NOW()
        )
    `);
}
