import { pool } from "../db/index.js";

/**
 * Get all tests with batch assignments and question counts.
 */
export async function getAllTests() {
    const result = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.format,
            t.duration_minutes,
            t.total_marks,
            TO_CHAR(t.scheduled_at, 'YYYY-MM-DD') AS schedule_date,
            t.schedule_time,
            t.instructions,
            t.status,
            t.created_by,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
            COALESCE(
                json_agg(
                    json_build_object('id', b.id, 'name', b.name)
                ) FILTER (WHERE b.id IS NOT NULL),
                '[]'
            ) AS batches
        FROM tests t
        LEFT JOIN test_target_batches tb ON tb.test_id = t.id
        LEFT JOIN batches b ON b.id = tb.batch_id
        GROUP BY t.id
        ORDER BY t.scheduled_at DESC NULLS LAST, t.title
    `);
    return result.rows;
}

/**
 * Get a single test with its questions and batch assignments.
 */
export async function getTestById(id) {
    const testResult = await pool.query(`
        SELECT
            t.id,
            t.title,
            t.format,
            t.duration_minutes,
            t.total_marks,
            TO_CHAR(t.scheduled_at, 'YYYY-MM-DD') AS schedule_date,
            t.schedule_time,
            t.instructions,
            t.status,
            t.created_by,
            COALESCE(
                json_agg(
                    json_build_object('id', b.id, 'name', b.name)
                ) FILTER (WHERE b.id IS NOT NULL),
                '[]'
            ) AS batches
        FROM tests t
        LEFT JOIN test_target_batches tb ON tb.test_id = t.id
        LEFT JOIN batches b ON b.id = tb.batch_id
        WHERE t.id = $1
        GROUP BY t.id
    `, [id]);

    if (testResult.rows.length === 0) return null;

    const questionsResult = await pool.query(`
        SELECT
            id, subject, section, type, question_text, question_img,
            options, option_imgs, COALESCE(correct_ans, correct_answer) AS correct_answer, marks, neg_marks,
            explanation, explanation_img, order_index, difficulty
        FROM questions
        WHERE test_id = $1
        ORDER BY order_index, subject
    `, [id]);

    return {
        ...testResult.rows[0],
        questions: questionsResult.rows,
    };
}

/**
 * Create a test with questions and batch assignments in a single transaction.
 */
export async function createTest({
    title, format, durationMinutes, totalMarks,
    scheduleDate, scheduleTime, instructions, status,
    batchIds, questions, createdBy
}) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Insert test
        const testResult = await client.query(
            `INSERT INTO tests (title, format, duration_minutes, duration_mins, total_marks, scheduled_at, schedule_time, instructions, status, created_by)
             VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::date, $7, $8, $9, $10)
             RETURNING id`,
            [title, format, durationMinutes, durationMinutes, totalMarks, scheduleDate || "", scheduleTime || null, instructions || null, status || 'upcoming', createdBy || null]
        );
        const testId = testResult.rows[0].id;

        // Insert batch assignments
        if (batchIds && batchIds.length > 0) {
            const batchValues = batchIds.map((_, i) => `($1, $${i + 2})`).join(", ");
            const batchParams = [testId, ...batchIds];
            await client.query(
                `INSERT INTO test_target_batches (test_id, batch_id) VALUES ${batchValues} ON CONFLICT DO NOTHING`,
                batchParams
            );
        }

        // Insert questions
        if (questions && questions.length > 0) {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                await client.query(
                    `INSERT INTO questions (test_id, subject, section, type, question_text, question_img, options, option_imgs, correct_ans, correct_answer, marks, neg_marks, explanation, explanation_img, order_index, difficulty)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                    [
                        testId,
                        q.subject || "General",
                        q.section || q.metadata?.section || null,
                        q.type || 'MCQ',
                        q.question || q.question_text || '',
                        q.questionImage || q.question_img || null,
                        q.options ? JSON.stringify(q.options) : null,
                        q.optionImages ? JSON.stringify(q.optionImages) : null,
                        String(q.correctAnswer ?? q.correct_answer ?? ''),
                        String(q.correctAnswer ?? q.correct_answer ?? ''),
                        q.marks ?? 4,
                        q.negativeMarks ?? q.neg_marks ?? 0,
                        q.explanation || null,
                        q.explanationImage || q.explanation_img || null,
                        i,
                        q.difficulty || null,
                    ]
                );
            }
        }

        await client.query("COMMIT");
        return getTestById(testId);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Update test status.
 */
export async function updateTestStatus(id, status) {
    const result = await pool.query(
        `UPDATE tests SET status = $1 WHERE id = $2 RETURNING id`,
        [status, id]
    );
    if (result.rowCount === 0) return null;
    return getTestById(id);
}

/**
 * Update test details, batches, and questions.
 */
export async function updateTest(id, {
    title, format, durationMinutes, totalMarks,
    scheduleDate, scheduleTime, instructions,
    batchIds, questions
}) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Update test details
        await client.query(
            `UPDATE tests 
             SET title = $1, format = $2, duration_minutes = $3, duration_mins = $4, total_marks = $5, 
                 scheduled_at = NULLIF($6, '')::date, schedule_time = $7, instructions = $8
             WHERE id = $9`,
            [title, format, durationMinutes, durationMinutes, totalMarks, scheduleDate || "", scheduleTime || null, instructions || null, id]
        );

        // Update batch assignments (delete and recreate)
        await client.query(`DELETE FROM test_target_batches WHERE test_id = $1`, [id]);
        if (batchIds && batchIds.length > 0) {
            const batchValues = batchIds.map((_, i) => `($1, $${i + 2})`).join(", ");
            const batchParams = [id, ...batchIds];
            await client.query(
                `INSERT INTO test_target_batches (test_id, batch_id) VALUES ${batchValues}`,
                batchParams
            );
        }

        // Update questions (simplest way is to clear and recreate to handle deletions/additions easily)
        await client.query(`DELETE FROM questions WHERE test_id = $1`, [id]);
        if (questions && questions.length > 0) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const qId = (q.id && uuidRegex.test(q.id)) ? q.id : null;
                
                await client.query(
                    `INSERT INTO questions (
                        id, test_id, subject, section, type, question_text, question_img, 
                        options, option_imgs, correct_ans, correct_answer, marks, neg_marks, 
                        explanation, explanation_img, order_index, difficulty
                     ) VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                    [
                        qId,
                        id,
                        q.subject || "General",
                        q.section || q.metadata?.section || null,
                        q.type || 'MCQ',
                        q.question || q.question_text || '',
                        q.questionImage || q.question_img || null,
                        q.options ? JSON.stringify(q.options) : null,
                        q.optionImages ? JSON.stringify(q.optionImages) : null,
                        String(q.correctAnswer ?? q.correct_answer ?? ''),
                        String(q.correctAnswer ?? q.correct_answer ?? ''),
                        q.marks ?? 4,
                        q.negativeMarks ?? q.neg_marks ?? 0,
                        q.explanation || null,
                        q.explanationImage || q.explanation_img || null,
                        i,
                        q.difficulty || null,
                    ]
                );
            }
        }

        await client.query("COMMIT");
        return getTestById(id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Delete a test (cascades to questions and test_target_batches).
 */
export async function deleteTest(id) {
    const result = await pool.query(
        "DELETE FROM tests WHERE id = $1 RETURNING id",
        [id]
    );
    return result.rowCount > 0;
}
