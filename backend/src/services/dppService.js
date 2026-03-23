import { pool } from "../db/index.js";
import { pickStudentBatchModel } from "./studentBatchModel.js";
import {
    calculateTotalMarks,
    mapAssessmentQuestionRow,
    mapAttemptQuestionsForResult,
    scoreAttempt,
} from "./assessmentCore.js";

const MAX_DPP_ATTEMPTS = 3;

async function ensureActiveBatchForChapter(chapterId, client = pool) {
    const result = await client.query(`
        SELECT c.id, b.is_active
        FROM chapters c
        JOIN batch_subjects bs ON bs.id = c.batch_subject_id
        JOIN batches b ON b.id = bs.batch_id
        WHERE c.id = $1
        LIMIT 1
    `, [chapterId]);

    if (result.rowCount === 0) {
        const error = new Error("chapter not found");
        error.code = "CHAPTER_NOT_FOUND";
        throw error;
    }

    if (!result.rows[0].is_active) {
        const error = new Error("inactive batches cannot be used for this action");
        error.code = "BATCH_INACTIVE";
        throw error;
    }
}

async function getQuestionsForDpp(dppId, client = pool) {
    const result = await client.query(`
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
        WHERE dpp_id = $1
        ORDER BY order_index, subject
    `, [dppId]);

    return result.rows.map(mapAssessmentQuestionRow);
}

async function getDppRowById(id, client = pool) {
    const result = await client.query(`
        SELECT
            d.id,
            d.title,
            d.instructions,
            d.chapter_id,
            d.created_by,
            d.created_at,
            c.name AS chapter_name,
            sub.name AS subject_name,
            bs.batch_id,
            b.name AS batch_name,
            (
                SELECT COUNT(*)
                FROM questions q
                WHERE q.dpp_id = d.id
            )::int AS question_count
        FROM dpps d
        JOIN chapters c ON c.id = d.chapter_id
        JOIN batch_subjects bs ON bs.id = c.batch_subject_id
        JOIN batches b ON b.id = bs.batch_id
        JOIN subjects sub ON sub.id = bs.subject_id
        WHERE d.id = $1
        LIMIT 1
    `, [id]);

    return result.rows[0] || null;
}

async function getStudentVisibleDppRow(dppId, studentId, client = pool) {
    const result = await client.query(await pickStudentBatchModel({
        single: `
        SELECT
            d.id,
            d.title,
            d.instructions,
            d.chapter_id,
            d.created_by,
            d.created_at,
            c.name AS chapter_name,
            sub.name AS subject_name,
            bs.batch_id,
            b.name AS batch_name,
            (
                SELECT COUNT(*)
                FROM questions q
                WHERE q.dpp_id = d.id
            )::int AS question_count
        FROM dpps d
        JOIN chapters c ON c.id = d.chapter_id
        JOIN batch_subjects bs ON bs.id = c.batch_subject_id
        JOIN batches b ON b.id = bs.batch_id
        JOIN subjects sub ON sub.id = bs.subject_id
        JOIN dpp_target_batches dtb ON dtb.dpp_id = d.id
        JOIN students s ON s.assigned_batch_id = dtb.batch_id
        WHERE d.id = $1
          AND s.user_id = $2
        LIMIT 1
    `,
        legacy: `
        SELECT
            d.id,
            d.title,
            d.instructions,
            d.chapter_id,
            d.created_by,
            d.created_at,
            c.name AS chapter_name,
            sub.name AS subject_name,
            bs.batch_id,
            b.name AS batch_name,
            (
                SELECT COUNT(*)
                FROM questions q
                WHERE q.dpp_id = d.id
            )::int AS question_count
        FROM dpps d
        JOIN chapters c ON c.id = d.chapter_id
        JOIN batch_subjects bs ON bs.id = c.batch_subject_id
        JOIN batches b ON b.id = bs.batch_id
        JOIN subjects sub ON sub.id = bs.subject_id
        JOIN dpp_target_batches dtb ON dtb.dpp_id = d.id
        JOIN student_batches sb ON sb.batch_id = dtb.batch_id
        WHERE d.id = $1
          AND sb.student_id = $2
        LIMIT 1
    `,
    }), [dppId, studentId]);

    return result.rows[0] || null;
}

function mapDpp(dpp, extra = {}) {
    return {
        id: dpp.id,
        title: dpp.title,
        instructions: dpp.instructions || null,
        chapter_id: dpp.chapter_id,
        chapter_name: dpp.chapter_name,
        subject_name: dpp.subject_name,
        batch_id: dpp.batch_id,
        batch_name: dpp.batch_name,
        question_count: Number(dpp.question_count || 0),
        created_by: dpp.created_by || null,
        created_at: dpp.created_at,
        ...extra,
    };
}

export async function listDpps({ chapterId, user }) {
    const params = [];
    let chapterFilter = "";
    if (chapterId) {
        params.push(chapterId);
        chapterFilter = ` AND d.chapter_id = $${params.length}`;
    }

    let query;
    if (user?.role === "student") {
        params.push(user.sub);
        query = await pickStudentBatchModel({
            single: `
            SELECT
                d.id,
                d.title,
                d.instructions,
                d.chapter_id,
                d.created_by,
                d.created_at,
                c.name AS chapter_name,
                sub.name AS subject_name,
                bs.batch_id,
                b.name AS batch_name,
                (
                    SELECT COUNT(*)
                    FROM questions q
                    WHERE q.dpp_id = d.id
                )::int AS question_count,
                (
                    SELECT COUNT(*)
                    FROM dpp_attempts da
                    WHERE da.dpp_id = d.id
                      AND da.student_id = $${params.length}
                )::int AS submitted_attempt_count
            FROM dpps d
            JOIN chapters c ON c.id = d.chapter_id
            JOIN batch_subjects bs ON bs.id = c.batch_subject_id
            JOIN batches b ON b.id = bs.batch_id
            JOIN subjects sub ON sub.id = bs.subject_id
            JOIN dpp_target_batches dtb ON dtb.dpp_id = d.id
            JOIN students s ON s.assigned_batch_id = dtb.batch_id
            WHERE s.user_id = $${params.length}
            ${chapterFilter}
            GROUP BY d.id, c.id, b.id, bs.batch_id, sub.name
            ORDER BY d.created_at DESC, d.title
        `,
            legacy: `
            SELECT
                d.id,
                d.title,
                d.instructions,
                d.chapter_id,
                d.created_by,
                d.created_at,
                c.name AS chapter_name,
                sub.name AS subject_name,
                bs.batch_id,
                b.name AS batch_name,
                (
                    SELECT COUNT(*)
                    FROM questions q
                    WHERE q.dpp_id = d.id
                )::int AS question_count,
                (
                    SELECT COUNT(*)
                    FROM dpp_attempts da
                    WHERE da.dpp_id = d.id
                      AND da.student_id = $${params.length}
                )::int AS submitted_attempt_count
            FROM dpps d
            JOIN chapters c ON c.id = d.chapter_id
            JOIN batch_subjects bs ON bs.id = c.batch_subject_id
            JOIN batches b ON b.id = bs.batch_id
            JOIN subjects sub ON sub.id = bs.subject_id
            JOIN dpp_target_batches dtb ON dtb.dpp_id = d.id
            JOIN student_batches sb ON sb.batch_id = dtb.batch_id
            WHERE sb.student_id = $${params.length}
            ${chapterFilter}
            GROUP BY d.id, c.id, b.id, bs.batch_id, sub.name
            ORDER BY d.created_at DESC, d.title
        `,
        });
    } else {
        query = `
            SELECT
                d.id,
                d.title,
                d.instructions,
                d.chapter_id,
                d.created_by,
                d.created_at,
                c.name AS chapter_name,
                sub.name AS subject_name,
                bs.batch_id,
                b.name AS batch_name,
                (
                    SELECT COUNT(*)
                    FROM questions q
                    WHERE q.dpp_id = d.id
                )::int AS question_count
            FROM dpps d
            JOIN chapters c ON c.id = d.chapter_id
            JOIN batch_subjects bs ON bs.id = c.batch_subject_id
            JOIN batches b ON b.id = bs.batch_id
            JOIN subjects sub ON sub.id = bs.subject_id
            WHERE 1=1
            ${chapterFilter}
            ORDER BY d.created_at DESC, d.title
        `;
    }

    const result = await pool.query(query, params);
    return result.rows.map((row) => mapDpp(row, {
        submitted_attempt_count: Number(row.submitted_attempt_count || 0),
        max_attempts: user?.role === "student" ? MAX_DPP_ATTEMPTS : undefined,
    }));
}

export async function getDppByIdForUser(dppId, user) {
    const row = user?.role === "student"
        ? await getStudentVisibleDppRow(dppId, user.sub)
        : await getDppRowById(dppId);

    if (!row) return null;

    const questions = await getQuestionsForDpp(dppId);
    return mapDpp(row, { questions });
}

async function getSubmittedAttemptCount(dppId, studentId, client = pool) {
    const result = await client.query(`
        SELECT COUNT(*)::int AS count
        FROM dpp_attempts
        WHERE dpp_id = $1
          AND student_id = $2
    `, [dppId, studentId]);
    return Number(result.rows[0]?.count || 0);
}

async function getActiveDppSession(client, dppId, studentId, forUpdate = false) {
    const result = await client.query(`
        SELECT *
        FROM dpp_sessions
        WHERE dpp_id = $1
          AND student_id = $2
        ${forUpdate ? "FOR UPDATE" : ""}
    `, [dppId, studentId]);

    return result.rows[0] || null;
}

export async function getStudentDppAttemptSummary(dppId, studentId) {
    const dpp = await getStudentVisibleDppRow(dppId, studentId);
    if (!dpp) return null;

    const historyResult = await pool.query(`
        SELECT
            id,
            attempt_no,
            submitted_at,
            score,
            correct_answers,
            wrong_answers,
            unattempted
        FROM dpp_attempts
        WHERE dpp_id = $1
          AND student_id = $2
        ORDER BY attempt_no DESC
    `, [dppId, studentId]);

    return {
        dppId,
        maxAttempts: MAX_DPP_ATTEMPTS,
        submittedAttemptCount: historyResult.rowCount,
        remainingAttempts: Math.max(0, MAX_DPP_ATTEMPTS - historyResult.rowCount),
        history: historyResult.rows.map((row) => ({
            id: row.id,
            attempt_no: Number(row.attempt_no),
            submitted_at: row.submitted_at,
            score: Number(row.score || 0),
            correct_answers: Number(row.correct_answers || 0),
            wrong_answers: Number(row.wrong_answers || 0),
            unattempted: Number(row.unattempted || 0),
        })),
    };
}

export async function startStudentDppAttempt(dppId, studentId, deviceId) {
    if (!deviceId) {
        const error = new Error("device id required");
        error.code = "DEVICE_ID_REQUIRED";
        throw error;
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const dpp = await getStudentVisibleDppRow(dppId, studentId, client);
        if (!dpp) {
            await client.query("ROLLBACK");
            return null;
        }

        const session = await getActiveDppSession(client, dppId, studentId, true);
        if (session && session.device_id !== deviceId) {
            await client.query("ROLLBACK");
            const error = new Error("session active on another device");
            error.code = "SESSION_ACTIVE_OTHER_DEVICE";
            throw error;
        }

        if (session) {
            await client.query(`
                UPDATE dpp_sessions
                SET last_seen_at = NOW()
                WHERE id = $1
            `, [session.id]);
        } else {
            await client.query(`
                INSERT INTO dpp_sessions (dpp_id, student_id, device_id)
                VALUES ($1, $2, $3)
            `, [dppId, studentId, deviceId]);
        }

        const submittedAttemptCount = await getSubmittedAttemptCount(dppId, studentId, client);
        if (submittedAttemptCount >= MAX_DPP_ATTEMPTS) {
            await client.query("ROLLBACK");
            const error = new Error("maximum attempts reached");
            error.code = "ATTEMPT_LIMIT_REACHED";
            throw error;
        }

        const questions = await getQuestionsForDpp(dppId, client);
        const summary = await getStudentDppAttemptSummary(dppId, studentId);

        await client.query("COMMIT");
        return {
            dpp: mapDpp(dpp, { questions }),
            maxAttempts: MAX_DPP_ATTEMPTS,
            submittedAttemptCount,
            remainingAttempts: Math.max(0, MAX_DPP_ATTEMPTS - submittedAttemptCount),
            history: summary?.history || [],
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function buildDppAttemptResult(attemptId) {
    const attemptResult = await pool.query(`
        SELECT
            da.id,
            da.dpp_id,
            da.student_id,
            da.attempt_no,
            da.score,
            da.answers,
            da.submitted_at,
            da.correct_answers,
            da.wrong_answers,
            da.unattempted,
            d.title AS dpp_title,
            d.instructions,
            d.chapter_id,
            c.name AS chapter_name,
            sub.name AS subject_name,
            b.name AS batch_name
        FROM dpp_attempts da
        JOIN dpps d ON d.id = da.dpp_id
        JOIN chapters c ON c.id = d.chapter_id
        JOIN batch_subjects bs ON bs.id = c.batch_subject_id
        JOIN subjects sub ON sub.id = bs.subject_id
        JOIN batches b ON b.id = bs.batch_id
        WHERE da.id = $1
    `, [attemptId]);

    if (attemptResult.rowCount === 0) {
        return null;
    }

    const attempt = attemptResult.rows[0];
    const questions = await getQuestionsForDpp(attempt.dpp_id);
    const totalMarks = calculateTotalMarks(questions);

    return {
        attempt_id: attempt.id,
        attempt_no: Number(attempt.attempt_no),
        dppId: attempt.dpp_id,
        dppTitle: attempt.dpp_title,
        chapter_id: attempt.chapter_id,
        chapter_name: attempt.chapter_name,
        subject_name: attempt.subject_name,
        batch_name: attempt.batch_name,
        instructions: attempt.instructions || undefined,
        totalMarks,
        obtainedMarks: Number(attempt.score || 0),
        totalQuestions: questions.length,
        correctAnswers: Number(attempt.correct_answers || 0),
        wrongAnswers: Number(attempt.wrong_answers || 0),
        unattempted: Number(attempt.unattempted || 0),
        submittedAt: attempt.submitted_at,
        questions: mapAttemptQuestionsForResult(questions, attempt.answers),
    };
}

async function getDppAttemptAccessForUser(attemptId, user) {
    const lookup = await pool.query(`
        SELECT id, dpp_id, student_id
        FROM dpp_attempts
        WHERE id = $1
    `, [attemptId]);

    if (lookup.rowCount === 0) return null;

    const attempt = lookup.rows[0];
    if (user?.role === "student") {
        if (attempt.student_id !== user.sub) {
            return null;
        }
        const allowed = await getStudentVisibleDppRow(attempt.dpp_id, user.sub);
        if (!allowed) {
            return null;
        }
    }

    return attempt;
}

export async function submitStudentDppAttempt(dppId, studentId, { answers, deviceId } = {}) {
    if (!deviceId) {
        const error = new Error("device id required");
        error.code = "DEVICE_ID_REQUIRED";
        throw error;
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const dpp = await getStudentVisibleDppRow(dppId, studentId, client);
        if (!dpp) {
            await client.query("ROLLBACK");
            return null;
        }

        const session = await getActiveDppSession(client, dppId, studentId, true);
        if (!session) {
            await client.query("ROLLBACK");
            const error = new Error("session not found");
            error.code = "SESSION_NOT_FOUND";
            throw error;
        }
        if (session.device_id !== deviceId) {
            await client.query("ROLLBACK");
            const error = new Error("session active on another device");
            error.code = "SESSION_ACTIVE_OTHER_DEVICE";
            throw error;
        }

        const submittedAttemptCount = await getSubmittedAttemptCount(dppId, studentId, client);
        if (submittedAttemptCount >= MAX_DPP_ATTEMPTS) {
            await client.query("ROLLBACK");
            const error = new Error("maximum attempts reached");
            error.code = "ATTEMPT_LIMIT_REACHED";
            throw error;
        }

        const nextAttemptResult = await client.query(`
            SELECT COALESCE(MAX(attempt_no), 0) + 1 AS next_attempt_no
            FROM dpp_attempts
            WHERE dpp_id = $1
              AND student_id = $2
        `, [dppId, studentId]);

        const questions = await getQuestionsForDpp(dppId, client);
        const metrics = scoreAttempt(questions, answers || {});

        const insertResult = await client.query(`
            INSERT INTO dpp_attempts (
                dpp_id,
                student_id,
                score,
                answers,
                submitted_at,
                attempt_no,
                correct_answers,
                wrong_answers,
                unattempted
            )
            VALUES ($1, $2, $3, $4::jsonb, NOW(), $5, $6, $7, $8)
            RETURNING id
        `, [
            dppId,
            studentId,
            metrics.score,
            JSON.stringify(answers || {}),
            Number(nextAttemptResult.rows[0].next_attempt_no),
            metrics.correctAnswers,
            metrics.wrongAnswers,
            metrics.unattempted,
        ]);

        await client.query(`
            DELETE FROM dpp_sessions
            WHERE dpp_id = $1
              AND student_id = $2
        `, [dppId, studentId]);

        await client.query("COMMIT");
        return buildDppAttemptResult(insertResult.rows[0].id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function closeStudentDppSession(dppId, studentId, deviceId) {
    if (!deviceId) {
        const error = new Error("device id required");
        error.code = "DEVICE_ID_REQUIRED";
        throw error;
    }

    const result = await pool.query(`
        DELETE FROM dpp_sessions
        WHERE dpp_id = $1
          AND student_id = $2
          AND device_id = $3
    `, [dppId, studentId, deviceId]);

    return result.rowCount > 0;
}

export async function getDppAttemptResultForUser(attemptId, user) {
    const attempt = await getDppAttemptAccessForUser(attemptId, user);
    if (!attempt) return null;

    return buildDppAttemptResult(attemptId);
}

export async function getDppAttemptQuestionExplanationForUser(attemptId, questionId, user) {
    const attempt = await getDppAttemptAccessForUser(attemptId, user);
    if (!attempt) return null;

    const result = await pool.query(`
        SELECT explanation, explanation_img
        FROM questions
        WHERE id = $1
          AND dpp_id = $2
        LIMIT 1
    `, [questionId, attempt.dpp_id]);

    if (result.rowCount === 0) {
        return null;
    }

    return {
        explanation: result.rows[0].explanation || null,
        explanation_img: result.rows[0].explanation_img || null,
    };
}

export async function getDppAttemptAnalysis(dppId, search) {
    const searchTerm = search && String(search).trim() ? `%${String(search).trim()}%` : null;
    const result = await pool.query(`
        WITH question_counts AS (
            SELECT COUNT(*)::int AS total_questions
            FROM questions
            WHERE dpp_id = $1
        )
        SELECT
            da.id,
            da.student_id,
            u.name AS student_name,
            da.attempt_no,
            da.submitted_at,
            da.score,
            da.correct_answers,
            da.wrong_answers,
            da.unattempted,
            qc.total_questions
        FROM dpp_attempts da
        JOIN users u ON u.id = da.student_id
        CROSS JOIN question_counts qc
        WHERE da.dpp_id = $1
        ${searchTerm ? "AND (u.name ILIKE $2 OR u.login_id ILIKE $2)" : ""}
        ORDER BY da.submitted_at DESC, da.attempt_no DESC
    `, searchTerm ? [dppId, searchTerm] : [dppId]);

    const dppRow = await getDppRowById(dppId);
    const questions = await getQuestionsForDpp(dppId);
    const totalMarks = questions.reduce((sum, question) => sum + Number(question.marks || 0), 0);

    const mappedAttempts = await Promise.all(result.rows.map(async (row) => ({
        attemptId: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        attemptNo: Number(row.attempt_no),
        submittedAt: row.submitted_at,
        score: Number(row.score || 0),
        totalMarks,
        accuracy: Number(row.total_questions || 0) > 0
            ? Number((((Number(row.correct_answers || 0) / Number(row.total_questions || 1)) * 100).toFixed(1)))
            : 0,
        result: await buildDppAttemptResult(row.id),
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
                score: attempt.attemptNo === 1 ? attempt.score : 0,
                totalMarks: attempt.totalMarks,
                accuracy: attempt.attemptNo === 1 ? attempt.accuracy : 0,
                attempts: [attempt.result],
            });
            continue;
        }

        existing.attemptCount += 1;
        existing.attempts.push(attempt.result);
        if (attempt.attemptNo === 1) {
            existing.score = attempt.score;
            existing.accuracy = attempt.accuracy;
        }
    }

    return {
        dppId,
        dppTitle: dppRow?.title || "DPP",
        totalMarks,
        totalQuestions: questions.length,
        performances: Array.from(grouped.values()),
    };
}

export async function createDpp({ title, instructions, chapterId, createdBy, questions = [] }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await ensureActiveBatchForChapter(chapterId, client);

        const chapterResult = await client.query(`
            SELECT
                c.id,
                bs.batch_id,
                sub.name AS subject_name
            FROM chapters c
            JOIN batch_subjects bs ON bs.id = c.batch_subject_id
            JOIN subjects sub ON sub.id = bs.subject_id
            WHERE c.id = $1
        `, [chapterId]);

        if (chapterResult.rowCount === 0) {
            throw new Error("chapter not found");
        }

        const chapter = chapterResult.rows[0];
        const dppResult = await client.query(`
            INSERT INTO dpps (title, instructions, chapter_id, created_by, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id
        `, [title, instructions || null, chapterId, createdBy || null]);

        const dppId = dppResult.rows[0].id;

        await client.query(`
            INSERT INTO dpp_target_batches (dpp_id, batch_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `, [dppId, chapter.batch_id]);

        for (let index = 0; index < questions.length; index += 1) {
            const q = questions[index];
            await client.query(`
                INSERT INTO questions (
                    dpp_id,
                    subject,
                    section,
                    type,
                    question_text,
                    question_img,
                    options,
                    option_imgs,
                    correct_ans,
                    correct_answer,
                    marks,
                    neg_marks,
                    explanation,
                    explanation_img,
                    order_index,
                    difficulty
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16)
            `, [
                dppId,
                q.subject || chapter.subject_name || "General",
                q.metadata?.section || q.section || null,
                q.type,
                q.question || q.question_text,
                q.questionImage || q.question_img || null,
                q.options ? JSON.stringify(q.options) : null,
                q.optionImages ? JSON.stringify(q.optionImages) : null,
                Array.isArray(q.correctAnswer) ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer ?? ""),
                Array.isArray(q.correctAnswer) ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer ?? ""),
                1,
                0,
                q.explanation || null,
                q.explanationImage || q.explanation_img || null,
                index,
                q.difficulty || null,
            ]);
        }

        await client.query("COMMIT");
        return getDppByIdForUser(dppId, { role: "faculty" });
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function updateDpp(dppId, { title, instructions, chapterId, questions = [] }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await ensureActiveBatchForChapter(chapterId, client);

        await client.query(`
            UPDATE dpps
            SET title = $2,
                instructions = $3,
                chapter_id = $4
            WHERE id = $1
        `, [dppId, title, instructions || null, chapterId]);

        const chapterResult = await client.query(`
            SELECT
                bs.batch_id,
                sub.name AS subject_name
            FROM chapters c
            JOIN batch_subjects bs ON bs.id = c.batch_subject_id
            JOIN subjects sub ON sub.id = bs.subject_id
            WHERE c.id = $1
        `, [chapterId]);
        if (chapterResult.rowCount === 0) {
            throw new Error("chapter not found");
        }

        const chapter = chapterResult.rows[0];

        await client.query(`DELETE FROM dpp_target_batches WHERE dpp_id = $1`, [dppId]);
        await client.query(`
            INSERT INTO dpp_target_batches (dpp_id, batch_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `, [dppId, chapter.batch_id]);

        await client.query(`DELETE FROM questions WHERE dpp_id = $1`, [dppId]);

        for (let index = 0; index < questions.length; index += 1) {
            const q = questions[index];
            await client.query(`
                INSERT INTO questions (
                    dpp_id,
                    subject,
                    section,
                    type,
                    question_text,
                    question_img,
                    options,
                    option_imgs,
                    correct_ans,
                    correct_answer,
                    marks,
                    neg_marks,
                    explanation,
                    explanation_img,
                    order_index,
                    difficulty
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16)
            `, [
                dppId,
                q.subject || chapter.subject_name || "General",
                q.metadata?.section || q.section || null,
                q.type,
                q.question || q.question_text,
                q.questionImage || q.question_img || null,
                q.options ? JSON.stringify(q.options) : null,
                q.optionImages ? JSON.stringify(q.optionImages) : null,
                Array.isArray(q.correctAnswer) ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer ?? ""),
                Array.isArray(q.correctAnswer) ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer ?? ""),
                1,
                0,
                q.explanation || null,
                q.explanationImage || q.explanation_img || null,
                index,
                q.difficulty || null,
            ]);
        }

        await client.query("COMMIT");
        return getDppByIdForUser(dppId, { role: "faculty" });
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function deleteDpp(dppId) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM questions WHERE dpp_id = $1`, [dppId]);
        await client.query(`DELETE FROM dpp_target_batches WHERE dpp_id = $1`, [dppId]);
        const result = await client.query(`DELETE FROM dpps WHERE id = $1 RETURNING id`, [dppId]);
        await client.query("COMMIT");
        return result.rowCount > 0;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
