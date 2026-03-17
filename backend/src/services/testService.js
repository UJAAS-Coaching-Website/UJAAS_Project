import { pool } from "../db/index.js";
import { getStudentBatchModel } from "./studentBatchModel.js";

const MAX_TEST_ATTEMPTS = 3;
const TEST_DURATION_EXPR = "COALESCE(t.duration_mins, t.duration_minutes, 0)";
const TEST_SCHEDULE_TIMEZONE = "Asia/Kolkata";
const TEST_SCHEDULE_TS_EXPR = `
    CASE
        WHEN t.scheduled_at IS NULL THEN NULL
        WHEN NULLIF(TRIM(COALESCE(t.schedule_time, '')), '') IS NULL
            THEN (t.scheduled_at::date::timestamp AT TIME ZONE '${TEST_SCHEDULE_TIMEZONE}')
        ELSE (((t.scheduled_at::date)::text || ' ' || TRIM(t.schedule_time))::timestamp AT TIME ZONE '${TEST_SCHEDULE_TIMEZONE}')
    END
`;

async function ensureActiveBatchIds(batchIds, client = pool) {
    const normalizedBatchIds = Array.from(new Set((batchIds || []).filter(Boolean)));
    if (normalizedBatchIds.length === 0) {
        return;
    }

    const result = await client.query(
        `SELECT id
         FROM batches
         WHERE id = ANY($1::uuid[])
           AND is_active = true`,
        [normalizedBatchIds]
    );

    if (result.rowCount !== normalizedBatchIds.length) {
        const activeIds = new Set(result.rows.map((row) => row.id));
        const invalidIds = normalizedBatchIds.filter((batchId) => !activeIds.has(batchId));
        const error = new Error(`inactive or missing batches cannot be assigned: ${invalidIds.join(", ")}`);
        error.code = "INVALID_BATCH_ASSIGNMENT";
        throw error;
    }
}

function normalizeNumericValue(value) {
    const parsed = Number(String(value).trim());
    return Number.isFinite(parsed) ? parsed : null;
}

function isNumericalAnswerCorrect(submittedAnswer, correctAnswerRaw) {
    const submittedNumeric = normalizeNumericValue(submittedAnswer);
    const correctNumeric = normalizeNumericValue(correctAnswerRaw);

    if (submittedNumeric !== null && correctNumeric !== null) {
        return submittedNumeric === correctNumeric;
    }

    return String(submittedAnswer).trim() === String(correctAnswerRaw).trim();
}

function parseStoredAnswer(value, questionType) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (questionType === "Numerical") {
        return String(value).trim();
    }

    if (Array.isArray(value)) {
        return value.map((item) => Number(item)).filter(Number.isFinite).sort((a, b) => a - b);
    }

    if (typeof value === "number") {
        return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : String(value).trim();
}

function scoreAttempt(questions, answers) {
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unattempted = 0;

    const normalizedAnswers = answers && typeof answers === "object" ? answers : {};

    for (const question of questions) {
        const submittedAnswer = parseStoredAnswer(normalizedAnswers[question.id], question.type);
        const correctAnswerRaw = question.correct_answer ?? question.correct_ans ?? "";

        if (submittedAnswer === null) {
            unattempted += 1;
            continue;
        }

        let isCorrect = false;
        if (question.type === "Numerical") {
            isCorrect = isNumericalAnswerCorrect(submittedAnswer, correctAnswerRaw);
        } else if (question.type === "MSQ") {
            let normalizedCorrect;
            try {
                normalizedCorrect = Array.isArray(correctAnswerRaw)
                    ? correctAnswerRaw
                    : JSON.parse(correctAnswerRaw);
            } catch {
                normalizedCorrect = [];
            }
            const sortedCorrect = (normalizedCorrect || []).map((item) => Number(item)).filter(Number.isFinite).sort((a, b) => a - b);
            const sortedSubmitted = Array.isArray(submittedAnswer) ? submittedAnswer : [];
            isCorrect = JSON.stringify(sortedCorrect) === JSON.stringify(sortedSubmitted);
        } else {
            const parsedCorrect = Number(correctAnswerRaw);
            isCorrect = Number.isFinite(parsedCorrect) && Number(submittedAnswer) === parsedCorrect;
        }

        if (isCorrect) {
            correctAnswers += 1;
            score += Number(question.marks || 0);
        } else {
            wrongAnswers += 1;
            score -= Number(question.neg_marks || 0);
        }
    }

    return {
        score,
        correctAnswers,
        wrongAnswers,
        unattempted,
    };
}

function mapAttemptRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        test_id: row.test_id,
        student_id: row.student_id,
        attempt_no: Number(row.attempt_no),
        started_at: row.started_at,
        deadline_at: row.deadline_at,
        submitted_at: row.submitted_at,
        auto_submitted: row.auto_submitted,
        time_spent: Number(row.time_spent || 0),
        score: row.score === null || row.score === undefined ? null : Number(row.score),
        correct_answers: Number(row.correct_answers || 0),
        wrong_answers: Number(row.wrong_answers || 0),
        unattempted: Number(row.unattempted || 0),
        answers: row.answers || {},
    };
}

function stripExplanationFields(question) {
    return {
        ...question,
        explanation: null,
        explanation_img: null,
    };
}

/**
 * Get all tests with batch assignments and question counts.
 */
export async function getAllTests() {
    const batchModel = await getStudentBatchModel();
    const result = await pool.query(batchModel === "single" ? `
        SELECT
            t.id,
            t.title,
            t.format,
            ${TEST_DURATION_EXPR} AS duration_minutes,
            t.total_marks,
            TO_CHAR(t.scheduled_at, 'YYYY-MM-DD') AS schedule_date,
            t.schedule_time,
            t.instructions,
            t.status,
            t.created_by,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
            (
                SELECT COUNT(DISTINCT s2.user_id)
                FROM test_target_batches ttb2
                JOIN students s2 ON s2.assigned_batch_id = ttb2.batch_id
                WHERE ttb2.test_id = t.id
            ) AS enrolled_count,
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
    ` : `
        SELECT
            t.id,
            t.title,
            t.format,
            ${TEST_DURATION_EXPR} AS duration_minutes,
            t.total_marks,
            TO_CHAR(t.scheduled_at, 'YYYY-MM-DD') AS schedule_date,
            t.schedule_time,
            t.instructions,
            t.status,
            t.created_by,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
            (
                SELECT COUNT(DISTINCT sb2.student_id)
                FROM test_target_batches ttb2
                JOIN student_batches sb2 ON sb2.batch_id = ttb2.batch_id
                WHERE ttb2.test_id = t.id
            ) AS enrolled_count,
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
 * Get all tests visible to a student based on the student's assigned batch.
 */
export async function getTestsForStudent(studentId) {
    const batchModel = await getStudentBatchModel();
    const result = await pool.query(batchModel === "single" ? `
        SELECT
            t.id,
            t.title,
            t.format,
            ${TEST_DURATION_EXPR} AS duration_minutes,
            t.total_marks,
            TO_CHAR(t.scheduled_at, 'YYYY-MM-DD') AS schedule_date,
            t.schedule_time,
            t.instructions,
            t.status,
            t.created_by,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
            (
                SELECT COUNT(DISTINCT s2.user_id)
                FROM test_target_batches ttb2
                JOIN students s2 ON s2.assigned_batch_id = ttb2.batch_id
                WHERE ttb2.test_id = t.id
            ) AS enrolled_count,
            (
                SELECT COUNT(*)
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NOT NULL
            ) AS submitted_attempt_count,
            EXISTS(
                SELECT 1
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NULL
            ) AS has_active_attempt,
            (
                SELECT ta.id
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NULL
                ORDER BY ta.started_at DESC
                LIMIT 1
            ) AS active_attempt_id,
            (
                SELECT ta.id
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NOT NULL
                ORDER BY ta.submitted_at DESC, ta.attempt_no DESC
                LIMIT 1
            ) AS latest_attempt_id,
            (
                SELECT ta.submitted_at
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NOT NULL
                ORDER BY ta.submitted_at DESC, ta.attempt_no DESC
                LIMIT 1
            ) AS latest_attempt_submitted_at,
            (
                SELECT ta.time_spent
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NOT NULL
                ORDER BY ta.submitted_at DESC, ta.attempt_no DESC
                LIMIT 1
            ) AS latest_attempt_time_spent,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', b.id, 'name', b.name)
                ) FILTER (WHERE b.id IS NOT NULL),
                '[]'
            ) AS batches
        FROM students s
        JOIN test_target_batches tb_match ON tb_match.batch_id = s.assigned_batch_id
        JOIN tests t ON t.id = tb_match.test_id
        LEFT JOIN test_target_batches tb ON tb.test_id = t.id
        LEFT JOIN batches b ON b.id = tb.batch_id
        WHERE s.user_id = $1
        GROUP BY t.id
        ORDER BY t.scheduled_at DESC NULLS LAST, t.title
    ` : `
        SELECT
            t.id,
            t.title,
            t.format,
            ${TEST_DURATION_EXPR} AS duration_minutes,
            t.total_marks,
            TO_CHAR(t.scheduled_at, 'YYYY-MM-DD') AS schedule_date,
            t.schedule_time,
            t.instructions,
            t.status,
            t.created_by,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
            (
                SELECT COUNT(DISTINCT sb2.student_id)
                FROM test_target_batches ttb2
                JOIN student_batches sb2 ON sb2.batch_id = ttb2.batch_id
                WHERE ttb2.test_id = t.id
            ) AS enrolled_count,
            (
                SELECT COUNT(*)
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NOT NULL
            ) AS submitted_attempt_count,
            EXISTS(
                SELECT 1
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NULL
            ) AS has_active_attempt,
            (
                SELECT ta.id
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NULL
                ORDER BY ta.started_at DESC
                LIMIT 1
            ) AS active_attempt_id,
            (
                SELECT ta.id
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NOT NULL
                ORDER BY ta.submitted_at DESC, ta.attempt_no DESC
                LIMIT 1
            ) AS latest_attempt_id,
            (
                SELECT ta.submitted_at
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NOT NULL
                ORDER BY ta.submitted_at DESC, ta.attempt_no DESC
                LIMIT 1
            ) AS latest_attempt_submitted_at,
            (
                SELECT ta.time_spent
                FROM test_attempts ta
                WHERE ta.test_id = t.id
                  AND ta.student_id = $1
                  AND ta.submitted_at IS NOT NULL
                ORDER BY ta.submitted_at DESC, ta.attempt_no DESC
                LIMIT 1
            ) AS latest_attempt_time_spent,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', b.id, 'name', b.name)
                ) FILTER (WHERE b.id IS NOT NULL),
                '[]'
            ) AS batches
        FROM student_batches sb
        JOIN test_target_batches tb_match ON tb_match.batch_id = sb.batch_id
        JOIN tests t ON t.id = tb_match.test_id
        LEFT JOIN test_target_batches tb ON tb.test_id = t.id
        LEFT JOIN batches b ON b.id = tb.batch_id
        WHERE sb.student_id = $1
        GROUP BY t.id
        ORDER BY t.scheduled_at DESC NULLS LAST, t.title
    `, [studentId]);

    return result.rows;
}

/**
 * Get a single test with its questions and batch assignments.
 */
export async function getTestById(id) {
    const batchModel = await getStudentBatchModel();
    const testResult = await pool.query(batchModel === "single" ? `
        SELECT
            t.id,
            t.title,
            t.format,
            ${TEST_DURATION_EXPR} AS duration_minutes,
            t.total_marks,
            TO_CHAR(t.scheduled_at, 'YYYY-MM-DD') AS schedule_date,
            t.schedule_time,
            t.instructions,
            t.status,
            t.created_by,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
            (
                SELECT COUNT(DISTINCT s.user_id)
                FROM test_target_batches ttb
                JOIN students s ON s.assigned_batch_id = ttb.batch_id
                WHERE ttb.test_id = t.id
            ) AS enrolled_count,
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
    ` : `
        SELECT
            t.id,
            t.title,
            t.format,
            ${TEST_DURATION_EXPR} AS duration_minutes,
            t.total_marks,
            TO_CHAR(t.scheduled_at, 'YYYY-MM-DD') AS schedule_date,
            t.schedule_time,
            t.instructions,
            t.status,
            t.created_by,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
            (
                SELECT COUNT(DISTINCT sb.student_id)
                FROM test_target_batches ttb
                JOIN student_batches sb ON sb.batch_id = ttb.batch_id
                WHERE ttb.test_id = t.id
            ) AS enrolled_count,
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
 * Get a single test only if it is assigned to the student's batch.
 */
export async function getTestByIdForStudent(id, studentId) {
    const batchModel = await getStudentBatchModel();
    const hasAccess = await pool.query(batchModel === "single" ? `
        SELECT 1
        FROM students s
        JOIN test_target_batches tb ON tb.batch_id = s.assigned_batch_id
        WHERE s.user_id = $1 AND tb.test_id = $2
        LIMIT 1
    ` : `
        SELECT 1
        FROM student_batches sb
        JOIN test_target_batches tb ON tb.batch_id = sb.batch_id
        WHERE sb.student_id = $1 AND tb.test_id = $2
        LIMIT 1
    `, [studentId, id]);

    if (hasAccess.rowCount === 0) {
        return null;
    }

    return getTestById(id);
}

async function getSubmittedAttemptCount(client, testId, studentId) {
    const result = await client.query(`
        SELECT COUNT(*)::int AS count
        FROM test_attempts
        WHERE test_id = $1
          AND student_id = $2
          AND submitted_at IS NOT NULL
    `, [testId, studentId]);

    return Number(result.rows[0]?.count || 0);
}

async function getActiveAttempt(client, testId, studentId, forUpdate = false) {
    const result = await client.query(`
        SELECT *
        FROM test_attempts
        WHERE test_id = $1
          AND student_id = $2
          AND submitted_at IS NULL
        ORDER BY started_at DESC
        LIMIT 1
        ${forUpdate ? "FOR UPDATE" : ""}
    `, [testId, studentId]);

    return mapAttemptRow(result.rows[0]);
}

const TEST_FIRST_ATTEMPT_RANKING_CTE = `
    first_submitted_attempts AS (
        SELECT *
        FROM (
            SELECT
                ta.*,
                ROW_NUMBER() OVER (
                    PARTITION BY ta.test_id, ta.student_id
                    ORDER BY ta.submitted_at ASC, ta.attempt_no ASC
                ) AS first_attempt_row_num
            FROM test_attempts ta
            WHERE ta.submitted_at IS NOT NULL
        ) ranked_first
        WHERE ranked_first.first_attempt_row_num = 1
    ),
    ranked_first_attempts AS (
        SELECT
            fsa.test_id,
            fsa.student_id,
            fsa.id AS ranked_attempt_id,
            RANK() OVER (
                PARTITION BY fsa.test_id
                ORDER BY fsa.score DESC NULLS LAST, fsa.submitted_at ASC, fsa.attempt_no ASC
            ) AS rank,
            COUNT(*) OVER (PARTITION BY fsa.test_id) AS total_students
        FROM first_submitted_attempts fsa
    )
`;

async function buildAttemptResult(attemptId) {
    const attemptResult = await pool.query(`
        WITH ${TEST_FIRST_ATTEMPT_RANKING_CTE}
        SELECT
            ta.id,
            ta.test_id,
            ta.student_id,
            ta.attempt_no,
            ta.started_at,
            ta.deadline_at,
            ta.submitted_at,
            ta.auto_submitted,
            ta.time_spent,
            ta.answers,
            ta.score,
            ta.correct_answers,
            ta.wrong_answers,
            ta.unattempted,
            rfa.rank,
            rfa.total_students,
            t.title AS test_title,
            t.total_marks,
            COALESCE(t.duration_mins, t.duration_minutes, 0) AS duration_minutes,
            t.instructions
        FROM test_attempts ta
        JOIN tests t ON t.id = ta.test_id
        LEFT JOIN ranked_first_attempts rfa
            ON rfa.test_id = ta.test_id
           AND rfa.student_id = ta.student_id
        WHERE ta.id = $1
          AND ta.submitted_at IS NOT NULL
    `, [attemptId]);

    if (attemptResult.rowCount === 0) {
        return null;
    }

    const attempt = attemptResult.rows[0];
    const questionsResult = await pool.query(`
        SELECT
            id,
            subject,
            section,
            type,
            question_text,
            question_img,
            options,
            option_imgs,
            COALESCE(correct_ans, correct_answer) AS correct_answer,
            marks,
            neg_marks,
            explanation,
            explanation_img,
            order_index,
            difficulty
        FROM questions
        WHERE test_id = $1
        ORDER BY order_index, subject
    `, [attempt.test_id]);

    const answers = attempt.answers && typeof attempt.answers === "object" ? attempt.answers : {};
    const questions = questionsResult.rows.map((question) => ({
        ...stripExplanationFields(question),
        user_answer: Object.prototype.hasOwnProperty.call(answers, question.id)
            ? answers[question.id]
            : null,
    }));

    return {
        attempt_id: attempt.id,
        attempt_no: Number(attempt.attempt_no),
        auto_submitted: attempt.auto_submitted,
        testId: attempt.test_id,
        testTitle: attempt.test_title,
        totalMarks: Number(attempt.total_marks),
        obtainedMarks: Number(attempt.score || 0),
        totalQuestions: questions.length,
        correctAnswers: Number(attempt.correct_answers || 0),
        wrongAnswers: Number(attempt.wrong_answers || 0),
        unattempted: Number(attempt.unattempted || 0),
        timeSpent: Number(attempt.time_spent || 0),
        duration: Number(attempt.duration_minutes || 0),
        rank: Number(attempt.rank || 0),
        totalStudents: Number(attempt.total_students || 0),
        submittedAt: attempt.submitted_at,
        instructions: attempt.instructions || undefined,
        questions,
    };
}

async function getAttemptAccessForUser(attemptId, user) {
    const lookup = await pool.query(`
        SELECT
            ta.id,
            ta.student_id,
            ta.test_id
        FROM test_attempts ta
        WHERE ta.id = $1
    `, [attemptId]);

    if (lookup.rowCount === 0) {
        return null;
    }

    const attempt = lookup.rows[0];
    if (user?.role === "student" && attempt.student_id !== user.sub) {
        return null;
    }

    if (user?.role === "student") {
        const allowedTest = await getTestByIdForStudent(attempt.test_id, user.sub);
        if (!allowedTest) {
            return null;
        }
    }

    return attempt;
}

export async function getStudentAttemptSummary(testId, studentId) {
    const access = await getTestByIdForStudent(testId, studentId);
    if (!access) return null;

    const [historyResult, activeResult] = await Promise.all([
        pool.query(`
            WITH ${TEST_FIRST_ATTEMPT_RANKING_CTE}
            SELECT
                ta.id,
                ta.attempt_no,
                ta.submitted_at,
                ta.auto_submitted,
                ta.time_spent,
                ta.score,
                ta.correct_answers,
                ta.wrong_answers,
                ta.unattempted,
                rfa.rank,
                rfa.total_students
            FROM test_attempts ta
            LEFT JOIN ranked_first_attempts rfa
                ON rfa.test_id = ta.test_id
               AND rfa.student_id = ta.student_id
            WHERE ta.test_id = $1
              AND ta.student_id = $2
              AND ta.submitted_at IS NOT NULL
            ORDER BY ta.attempt_no DESC
        `, [testId, studentId]),
        pool.query(`
            SELECT *
            FROM test_attempts
            WHERE test_id = $1
              AND student_id = $2
              AND submitted_at IS NULL
            ORDER BY started_at DESC
            LIMIT 1
        `, [testId, studentId]),
    ]);

    return {
        testId,
        maxAttempts: MAX_TEST_ATTEMPTS,
        submittedAttemptCount: historyResult.rowCount,
        remainingAttempts: Math.max(0, MAX_TEST_ATTEMPTS - historyResult.rowCount),
        hasActiveAttempt: activeResult.rowCount > 0,
        activeAttempt: activeResult.rowCount > 0 ? mapAttemptRow(activeResult.rows[0]) : null,
        history: historyResult.rows.map((row) => ({
            id: row.id,
            attempt_no: Number(row.attempt_no),
            submitted_at: row.submitted_at,
            auto_submitted: row.auto_submitted,
            time_spent: Number(row.time_spent || 0),
            score: Number(row.score || 0),
            correct_answers: Number(row.correct_answers || 0),
            wrong_answers: Number(row.wrong_answers || 0),
            unattempted: Number(row.unattempted || 0),
            rank: Number(row.rank || 0),
            total_students: Number(row.total_students || 0),
        })),
    };
}

export async function startOrResumeStudentAttempt(testId, studentId) {
    const test = await getTestByIdForStudent(testId, studentId);
    if (!test) {
        return null;
    }

    if (test.status !== "live") {
        const error = new Error("test is not live");
        error.code = "TEST_NOT_LIVE";
        throw error;
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const existingActiveAttempt = await getActiveAttempt(client, testId, studentId, true);
        if (existingActiveAttempt) {
            await client.query("COMMIT");
            return {
                test,
                attempt: existingActiveAttempt,
                maxAttempts: MAX_TEST_ATTEMPTS,
                submittedAttemptCount: await getSubmittedAttemptCount(pool, testId, studentId),
                serverNow: new Date().toISOString(),
                resumed: true,
            };
        }

        const submittedAttemptCount = await getSubmittedAttemptCount(client, testId, studentId);
        if (submittedAttemptCount >= MAX_TEST_ATTEMPTS) {
            await client.query("ROLLBACK");
            const error = new Error("maximum attempts reached");
            error.code = "ATTEMPT_LIMIT_REACHED";
            throw error;
        }

        const nextAttemptResult = await client.query(`
            SELECT COALESCE(MAX(attempt_no), 0) + 1 AS next_attempt_no
            FROM test_attempts
            WHERE test_id = $1
              AND student_id = $2
        `, [testId, studentId]);

        const insertResult = await client.query(`
            INSERT INTO test_attempts (
                test_id,
                student_id,
                attempt_no,
                started_at,
                deadline_at,
                answers
            )
            VALUES (
                $1,
                $2,
                $3,
                NOW(),
                NOW() + make_interval(mins => $4::int),
                '{}'::jsonb
            )
            RETURNING *
        `, [testId, studentId, Number(nextAttemptResult.rows[0].next_attempt_no), Number(test.duration_minutes || 0)]);

        await client.query("COMMIT");

        return {
            test,
            attempt: mapAttemptRow(insertResult.rows[0]),
            maxAttempts: MAX_TEST_ATTEMPTS,
            submittedAttemptCount,
            serverNow: new Date().toISOString(),
            resumed: false,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function saveStudentAttemptProgress(attemptId, studentId, answers) {
    const result = await pool.query(`
        UPDATE test_attempts
        SET answers = COALESCE($3::jsonb, '{}'::jsonb)
        WHERE id = $1
          AND student_id = $2
          AND submitted_at IS NULL
        RETURNING id, test_id, student_id, attempt_no, started_at, deadline_at, submitted_at, auto_submitted, time_spent, score, correct_answers, wrong_answers, unattempted, answers
    `, [attemptId, studentId, JSON.stringify(answers || {})]);

    return mapAttemptRow(result.rows[0]);
}

export async function submitStudentAttempt(attemptId, studentId, { answers, autoSubmitted = false } = {}) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const attemptResult = await client.query(`
            SELECT
                ta.*,
                COALESCE(t.duration_mins, t.duration_minutes, 0) AS duration_minutes
            FROM test_attempts ta
            JOIN tests t ON t.id = ta.test_id
            WHERE ta.id = $1
              AND ta.student_id = $2
              AND ta.submitted_at IS NULL
            FOR UPDATE
        `, [attemptId, studentId]);

        if (attemptResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return null;
        }

        const attempt = attemptResult.rows[0];
        const mergedAnswers = answers && typeof answers === "object" && Object.keys(answers).length > 0
            ? answers
            : (attempt.answers || {});

        const questionsResult = await client.query(`
            SELECT
                id,
                type,
                COALESCE(correct_ans, correct_answer) AS correct_answer,
                marks,
                neg_marks
            FROM questions
            WHERE test_id = $1
            ORDER BY order_index, subject
        `, [attempt.test_id]);

        const metrics = scoreAttempt(questionsResult.rows, mergedAnswers);
        const durationSeconds = Number(attempt.duration_minutes || 0) * 60;
        const timingResult = await client.query(`
            SELECT GREATEST(
                0,
                LEAST(
                    $2::int,
                    FLOOR(EXTRACT(EPOCH FROM (LEAST(NOW(), $1::timestamptz) - $3::timestamptz)))::int
                )
            ) AS time_spent
        `, [attempt.deadline_at, durationSeconds, attempt.started_at]);
        const timeSpent = Number(timingResult.rows[0]?.time_spent || 0);

        await client.query(`
            UPDATE test_attempts
            SET
                answers = $2::jsonb,
                submitted_at = NOW(),
                auto_submitted = $3,
                time_spent = $4,
                score = $5,
                correct_answers = $6,
                wrong_answers = $7,
                unattempted = $8
            WHERE id = $1
        `, [
            attemptId,
            JSON.stringify(mergedAnswers || {}),
            autoSubmitted,
            timeSpent,
            metrics.score,
            metrics.correctAnswers,
            metrics.wrongAnswers,
            metrics.unattempted,
        ]);

        await client.query("COMMIT");
        return buildAttemptResult(attemptId);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function getAttemptResultForUser(attemptId, user) {
    const attempt = await getAttemptAccessForUser(attemptId, user);
    if (!attempt) {
        return null;
    }

    return buildAttemptResult(attemptId);
}

export async function getAttemptQuestionExplanationForUser(attemptId, questionId, user) {
    const attempt = await getAttemptAccessForUser(attemptId, user);
    if (!attempt) {
        return null;
    }

    const explanationResult = await pool.query(`
        SELECT explanation, explanation_img
        FROM questions
        WHERE id = $1
          AND test_id = $2
        LIMIT 1
    `, [questionId, attempt.test_id]);

    if (explanationResult.rowCount === 0) {
        return null;
    }

    return {
        explanation: explanationResult.rows[0].explanation || null,
        explanation_img: explanationResult.rows[0].explanation_img || null,
    };
}

export async function getStudentAttemptResults(studentId) {
    const result = await pool.query(`
        WITH ${TEST_FIRST_ATTEMPT_RANKING_CTE}
        SELECT
            ta.id,
            ta.test_id,
            ta.attempt_no,
            ta.submitted_at,
            ta.auto_submitted,
            ta.time_spent,
            ta.score,
            ta.correct_answers,
            ta.wrong_answers,
            ta.unattempted,
            rfa.rank,
            rfa.total_students,
            t.title AS test_title,
            t.total_marks,
            COALESCE(t.duration_mins, t.duration_minutes, 0) AS duration_minutes,
            (
                SELECT COUNT(*)
                FROM questions q
                WHERE q.test_id = t.id
            ) AS total_questions
        FROM test_attempts ta
        JOIN tests t ON t.id = ta.test_id
        LEFT JOIN ranked_first_attempts rfa
            ON rfa.test_id = ta.test_id
           AND rfa.student_id = ta.student_id
        WHERE ta.student_id = $1
          AND ta.submitted_at IS NOT NULL
        ORDER BY ta.submitted_at DESC, ta.attempt_no DESC
    `, [studentId]);

    return result.rows.map((row) => ({
        id: row.id,
        testId: row.test_id,
        attemptNo: Number(row.attempt_no),
        testTitle: row.test_title,
        submittedAt: row.submitted_at,
        autoSubmitted: row.auto_submitted,
        timeSpent: Number(row.time_spent || 0),
        score: Number(row.score || 0),
        totalMarks: Number(row.total_marks || 0),
        totalQuestions: Number(row.total_questions || 0),
        correctAnswers: Number(row.correct_answers || 0),
        wrongAnswers: Number(row.wrong_answers || 0),
        unattempted: Number(row.unattempted || 0),
        rank: Number(row.rank || 0),
        totalStudents: Number(row.total_students || 0),
        duration: Number(row.duration_minutes || 0),
        percentage: Number(row.total_marks || 0) > 0
            ? (Number(row.score || 0) / Number(row.total_marks || 1)) * 100
            : 0,
    }));
}

export async function getTestAttemptAnalysis(testId) {
    const result = await pool.query(`
        WITH ${TEST_FIRST_ATTEMPT_RANKING_CTE},
        submitted_attempts AS (
            SELECT
                ta.*,
                u.name AS student_name
            FROM test_attempts ta
            JOIN users u ON u.id = ta.student_id
            WHERE ta.test_id = $1
              AND ta.submitted_at IS NOT NULL
        ),
        question_counts AS (
            SELECT COUNT(*)::int AS total_questions
            FROM questions
            WHERE test_id = $1
        )
        SELECT
            sa.id,
            sa.student_id,
            sa.student_name,
            sa.attempt_no,
            sa.submitted_at,
            sa.auto_submitted,
            sa.time_spent,
            sa.score,
            sa.correct_answers,
            sa.wrong_answers,
            sa.unattempted,
            rfa.rank,
            rfa.total_students,
            qc.total_questions,
            t.total_marks,
            COALESCE(t.duration_mins, t.duration_minutes, 0) AS duration_minutes,
            t.instructions,
            t.title AS test_title
        FROM submitted_attempts sa
        LEFT JOIN ranked_first_attempts rfa
            ON rfa.test_id = sa.test_id
           AND rfa.student_id = sa.student_id
        CROSS JOIN question_counts qc
        JOIN tests t ON t.id = sa.test_id
        ORDER BY sa.submitted_at DESC, sa.attempt_no DESC
    `, [testId]);

    const mappedAttempts = await Promise.all(result.rows.map(async (row) => ({
        attemptId: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        attemptNo: Number(row.attempt_no),
        submittedAt: row.submitted_at,
        autoSubmitted: row.auto_submitted,
        score: Number(row.score || 0),
        totalMarks: Number(row.total_marks || 0),
        accuracy: Number(row.total_questions || 0) > 0
            ? Number((((Number(row.correct_answers || 0) / Number(row.total_questions || 1)) * 100).toFixed(1)))
            : 0,
        rank: Number(row.rank || 0),
        timeSpent: Number(row.time_spent || 0),
        result: await buildAttemptResult(row.id),
    })));

    const grouped = new Map();
    for (const attempt of mappedAttempts) {
        const existing = grouped.get(attempt.studentId);
        if (!existing) {
            grouped.set(attempt.studentId, {
                studentId: attempt.studentId,
                studentName: attempt.studentName,
                attemptCount: 1,
                latestSubmittedAt: attempt.submittedAt,
                score: attempt.score,
                totalMarks: attempt.totalMarks,
                accuracy: attempt.accuracy,
                rank: attempt.rank,
                timeSpent: attempt.timeSpent,
                attempts: [attempt.result],
            });
            continue;
        }

        existing.attemptCount += 1;
        existing.attempts.push(attempt.result);
    }

    return Array.from(grouped.values());
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
        await ensureActiveBatchIds(batchIds, client);

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeQuestionPayload(question, orderIndex) {
    return {
        id: (question.id && UUID_REGEX.test(question.id)) ? question.id : null,
        subject: question.subject || "General",
        section: question.section || question.metadata?.section || null,
        type: question.type || "MCQ",
        questionText: question.question || question.question_text || "",
        questionImage: question.questionImage || question.question_img || null,
        options: Array.isArray(question.options) ? question.options : null,
        optionImages: Array.isArray(question.optionImages)
            ? question.optionImages
            : Array.isArray(question.option_imgs)
                ? question.option_imgs
                : null,
        correctAnswer: String(question.correctAnswer ?? question.correct_answer ?? ""),
        marks: question.marks ?? 4,
        negativeMarks: question.negativeMarks ?? question.neg_marks ?? 0,
        explanation: question.explanation || null,
        explanationImage: question.explanationImage || question.explanation_img || null,
        orderIndex,
        difficulty: question.difficulty || null,
    };
}

function normalizeStoredQuestion(question) {
    return {
        id: question.id,
        subject: question.subject || "General",
        section: question.section || null,
        type: question.type || "MCQ",
        questionText: question.question_text || "",
        questionImage: question.question_img || null,
        options: Array.isArray(question.options) ? question.options : null,
        optionImages: Array.isArray(question.option_imgs) ? question.option_imgs : null,
        correctAnswer: String(question.correct_answer ?? question.correct_ans ?? ""),
        marks: Number(question.marks ?? 4),
        negativeMarks: Number(question.neg_marks ?? 0),
        explanation: question.explanation || null,
        explanationImage: question.explanation_img || null,
        orderIndex: Number(question.order_index ?? 0),
        difficulty: question.difficulty || null,
    };
}

function questionsDiffer(existingQuestion, nextQuestion) {
    return (
        existingQuestion.subject !== nextQuestion.subject ||
        existingQuestion.section !== nextQuestion.section ||
        existingQuestion.type !== nextQuestion.type ||
        existingQuestion.questionText !== nextQuestion.questionText ||
        existingQuestion.questionImage !== nextQuestion.questionImage ||
        JSON.stringify(existingQuestion.options) !== JSON.stringify(nextQuestion.options) ||
        JSON.stringify(existingQuestion.optionImages) !== JSON.stringify(nextQuestion.optionImages) ||
        existingQuestion.correctAnswer !== nextQuestion.correctAnswer ||
        existingQuestion.marks !== Number(nextQuestion.marks) ||
        existingQuestion.negativeMarks !== Number(nextQuestion.negativeMarks) ||
        existingQuestion.explanation !== nextQuestion.explanation ||
        existingQuestion.explanationImage !== nextQuestion.explanationImage ||
        existingQuestion.orderIndex !== Number(nextQuestion.orderIndex) ||
        existingQuestion.difficulty !== nextQuestion.difficulty
    );
}

async function insertQuestion(client, testId, question) {
    await client.query(
        `INSERT INTO questions (
            id, test_id, subject, section, type, question_text, question_img,
            options, option_imgs, correct_ans, correct_answer, marks, neg_marks,
            explanation, explanation_img, order_index, difficulty
         ) VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
            question.id,
            testId,
            question.subject,
            question.section,
            question.type,
            question.questionText,
            question.questionImage,
            question.options ? JSON.stringify(question.options) : null,
            question.optionImages ? JSON.stringify(question.optionImages) : null,
            question.correctAnswer,
            question.correctAnswer,
            question.marks,
            question.negativeMarks,
            question.explanation,
            question.explanationImage,
            question.orderIndex,
            question.difficulty,
        ]
    );
}

async function updateQuestion(client, question) {
    await client.query(
        `UPDATE questions
         SET
            subject = $1,
            section = $2,
            type = $3,
            question_text = $4,
            question_img = $5,
            options = $6,
            option_imgs = $7,
            correct_ans = $8,
            correct_answer = $9,
            marks = $10,
            neg_marks = $11,
            explanation = $12,
            explanation_img = $13,
            order_index = $14,
            difficulty = $15
         WHERE id = $16`,
        [
            question.subject,
            question.section,
            question.type,
            question.questionText,
            question.questionImage,
            question.options ? JSON.stringify(question.options) : null,
            question.optionImages ? JSON.stringify(question.optionImages) : null,
            question.correctAnswer,
            question.correctAnswer,
            question.marks,
            question.negativeMarks,
            question.explanation,
            question.explanationImage,
            question.orderIndex,
            question.difficulty,
            question.id,
        ]
    );
}

/**
 * Update test status.
 */
export async function updateTestStatus(id, status, options = {}) {
    const { forceLiveNow = false } = options;
    const existingTest = await getTestById(id);
    if (!existingTest) return null;

    if (forceLiveNow) {
        if (status !== "live") {
            const error = new Error("force live is only supported for live status");
            error.code = "INVALID_FORCE_LIVE_STATUS";
            throw error;
        }

        if (existingTest.status === "draft") {
            const error = new Error("draft tests cannot be forced live");
            error.code = "FORCE_LIVE_DRAFT_NOT_ALLOWED";
            throw error;
        }

        if (existingTest.status === "live") {
            const error = new Error("test is already live");
            error.code = "TEST_ALREADY_LIVE";
            throw error;
        }

        const result = await pool.query(
            `UPDATE tests
             SET
                status = 'live',
                scheduled_at = (NOW() AT TIME ZONE '${TEST_SCHEDULE_TIMEZONE}')::date,
                schedule_time = TO_CHAR((NOW() AT TIME ZONE '${TEST_SCHEDULE_TIMEZONE}'), 'HH24:MI')
             WHERE id = $1
               AND status = 'upcoming'
             RETURNING id`,
            [id]
        );

        if (result.rowCount === 0) {
            const error = new Error("only upcoming tests can be forced live");
            error.code = "FORCE_LIVE_NOT_ALLOWED";
            throw error;
        }

        return getTestById(id);
    }

    const result = await pool.query(
        `UPDATE tests SET status = $1 WHERE id = $2 RETURNING id`,
        [status, id]
    );
    if (result.rowCount === 0) return null;
    return getTestById(id);
}

export async function syncScheduledTestStatuses() {
    const liveResult = await pool.query(`
        UPDATE tests t
        SET status = 'live'
        WHERE t.status IN ('upcoming', 'completed')
          AND ${TEST_SCHEDULE_TS_EXPR} IS NOT NULL
          AND NOW() >= ${TEST_SCHEDULE_TS_EXPR}
        RETURNING t.id
    `);

    const liveTests = [];
    for (const row of liveResult.rows) {
        const test = await getTestById(row.id);
        if (test) {
            liveTests.push(test);
        }
    }

    return {
        liveCount: liveResult.rowCount,
        liveTests,
    };
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
        await ensureActiveBatchIds(batchIds, client);

        const existingTestResult = await client.query(
            `SELECT title, format, duration_minutes, total_marks, scheduled_at, schedule_time, instructions
             FROM tests
             WHERE id = $1`,
            [id]
        );

        if (existingTestResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return null;
        }

        const existingTest = existingTestResult.rows[0];
        const normalizedScheduleDate = scheduleDate || "";
        const existingScheduleDate = existingTest.scheduled_at
            ? new Date(existingTest.scheduled_at).toISOString().slice(0, 10)
            : "";

        const metadataChanged = (
            existingTest.title !== title ||
            (existingTest.format || null) !== (format || null) ||
            Number(existingTest.duration_minutes || 0) !== Number(durationMinutes) ||
            Number(existingTest.total_marks || 0) !== Number(totalMarks) ||
            existingScheduleDate !== normalizedScheduleDate ||
            (existingTest.schedule_time || null) !== (scheduleTime || null) ||
            (existingTest.instructions || null) !== (instructions || null)
        );

        if (metadataChanged) {
            await client.query(
                `UPDATE tests
                 SET title = $1, format = $2, duration_minutes = $3, duration_mins = $4, total_marks = $5,
                     scheduled_at = NULLIF($6, '')::date, schedule_time = $7, instructions = $8
                 WHERE id = $9`,
                [title, format, durationMinutes, durationMinutes, totalMarks, normalizedScheduleDate, scheduleTime || null, instructions || null, id]
            );
        }

        // Diff batch assignments instead of recreating the whole set.
        const existingBatchResult = await client.query(
            `SELECT batch_id FROM test_target_batches WHERE test_id = $1`,
            [id]
        );
        const existingBatchIds = new Set(existingBatchResult.rows.map((row) => row.batch_id));
        const nextBatchIds = Array.from(new Set((batchIds || []).filter(Boolean)));

        const batchIdsToDelete = Array.from(existingBatchIds).filter((batchId) => !nextBatchIds.includes(batchId));
        if (batchIdsToDelete.length > 0) {
            await client.query(
                `DELETE FROM test_target_batches
                 WHERE test_id = $1
                   AND batch_id = ANY($2::uuid[])`,
                [id, batchIdsToDelete]
            );
        }

        const batchIdsToInsert = nextBatchIds.filter((batchId) => !existingBatchIds.has(batchId));
        if (batchIdsToInsert.length > 0) {
            const batchValues = batchIdsToInsert.map((_, i) => `($1, $${i + 2})`).join(", ");
            await client.query(
                `INSERT INTO test_target_batches (test_id, batch_id) VALUES ${batchValues} ON CONFLICT DO NOTHING`,
                [id, ...batchIdsToInsert]
            );
        }

        // Diff questions by ID so draft saves only touch changed rows.
        const existingQuestionResult = await client.query(
            `SELECT
                id, subject, section, type, question_text, question_img,
                options, option_imgs, correct_ans, correct_answer, marks, neg_marks,
                explanation, explanation_img, order_index, difficulty
             FROM questions
             WHERE test_id = $1`,
            [id]
        );

        const existingQuestionMap = new Map(
            existingQuestionResult.rows.map((row) => [row.id, normalizeStoredQuestion(row)])
        );
        const nextQuestions = (questions || []).map((question, index) => normalizeQuestionPayload(question, index));
        const nextQuestionIds = new Set(nextQuestions.map((question) => question.id).filter(Boolean));

        const questionIdsToDelete = existingQuestionResult.rows
            .map((row) => row.id)
            .filter((questionId) => !nextQuestionIds.has(questionId));

        if (questionIdsToDelete.length > 0) {
            await client.query(
                `DELETE FROM questions
                 WHERE test_id = $1
                   AND id = ANY($2::uuid[])`,
                [id, questionIdsToDelete]
            );
        }

        for (const question of nextQuestions) {
            if (question.id && existingQuestionMap.has(question.id)) {
                const existingQuestion = existingQuestionMap.get(question.id);
                if (existingQuestion && questionsDiffer(existingQuestion, question)) {
                    await updateQuestion(client, question);
                }
                continue;
            }

            await insertQuestion(client, id, question);
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
