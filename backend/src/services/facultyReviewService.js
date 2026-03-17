import { pool } from "../db/index.js";
import { createMultiBatchNotification, deleteNotificationsByType, deleteNotificationForStudent } from "./notificationService.js";

/**
 * Admin triggers a new review session.
 * Clears old reviews and resets faculty averages to 0.
 */
export async function startReviewSession(adminId) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Deactivate any existing sessions
        await client.query("UPDATE faculty_review_sessions SET is_active = false");

        // 2. Clear old individual reviews
        await client.query("DELETE FROM faculty_reviews");

        // 3. Reset faculty average ratings and counts
        await client.query("UPDATE faculties SET rating = 0, review_count = 0");

        // 4. Create new session with 3-day window
        const expiryTime = new Date();
        expiryTime.setDate(expiryTime.getDate() + 3);

        const result = await client.query(
            `INSERT INTO faculty_review_sessions (created_by, start_time, expiry_time, is_active)
             VALUES ($1, NOW(), $2, true)
             RETURNING *`,
            [adminId, expiryTime]
        );

        // 5. Fetch all batches to broadcast the sticky notification
        const batchResult = await client.query("SELECT id FROM batches");
        const allBatchIds = batchResult.rows.map(r => r.id);

        if (allBatchIds.length > 0) {
            // 5a. DELETE previous faculty review notifications to keep only the latest one
            await deleteNotificationsByType('review');

            await createMultiBatchNotification(allBatchIds, {
                senderId: adminId,
                type: 'review',
                title: '🌟 Faculty Review Live',
                message: 'Your feedback matters! Please rate your teachers to help us improve your learning experience.',
                isSticky: true,
                metadata: { openReview: true } // Add metadata flag
            });
        }

        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get active session if it exists and hasn't expired.
 */
export async function getActiveSession() {
    const result = await pool.query(
        `SELECT * FROM faculty_review_sessions 
         WHERE is_active = true 
         AND expiry_time > NOW() 
         LIMIT 1`
    );
    return result.rows[0] || null;
}

/**
 * Submit ratings from a student for multiple faculties.
 */
export async function submitFacultyRatings(studentId, ratings) {
    const session = await getActiveSession();
    if (!session) {
        throw new Error("No active review session found or session expired.");
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const { facultyId, rating } of ratings) {
            // 1. Insert review (Unique constraint prevents duplicates)
            await client.query(
                `INSERT INTO faculty_reviews (session_id, student_id, faculty_id, rating)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (student_id, faculty_id) DO NOTHING`,
                [session.id, studentId, facultyId, rating]
            );

            // 2. Recalculate average immediately for this faculty
            // Continuous update formula: (sum of all ratings) / (count of ratings)
            await client.query(
                `UPDATE faculties 
                 SET rating = (
                     SELECT AVG(rating) FROM faculty_reviews WHERE faculty_id = $1
                 ),
                 review_count = (
                     SELECT COUNT(*) FROM faculty_reviews WHERE faculty_id = $1
                 )
                 WHERE user_id = $1`,
                [facultyId]
            );
        }

        // 3. Delete the "review" notifications for this specific student
        const reviewNotifs = await client.query("SELECT id FROM notifications WHERE type = 'review'");
        for (const row of reviewNotifs.rows) {
            await deleteNotificationForStudent(studentId, row.id);
        }

        await client.query("COMMIT");
        return { success: true };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get list of faculties assigned to a student's batch that haven't been rated yet.
 */
export async function getFacultiesToRate(studentId) {
    const session = await getActiveSession();
    if (!session) return [];

    // Find student's assigned batch and get the faculty assigned to the subjects in that batch
    const result = await pool.query(
        `SELECT DISTINCT u.id, u.name, s.name as subject
         FROM users u
         JOIN faculties f ON f.user_id = u.id
         JOIN subjects s ON s.id = f.subject_id
         JOIN faculty_assignments fa ON fa.faculty_id = f.user_id
         JOIN batch_subjects bs ON bs.id = fa.batch_subject_id
         JOIN students st ON st.assigned_batch_id = bs.batch_id
         WHERE st.user_id = $1
         AND NOT EXISTS (
             SELECT 1 FROM faculty_reviews fr 
             WHERE fr.faculty_id = u.id 
             AND fr.student_id = $1
             AND fr.session_id = $2
         )`,
        [studentId, session.id]
    );

    return result.rows;
}
