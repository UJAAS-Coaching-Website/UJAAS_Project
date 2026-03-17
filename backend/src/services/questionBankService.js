import { pool } from "../db/index.js";

const FACULTY_CONTEXT_QUERY = `
    SELECT
        u.id AS faculty_user_id,
        COALESCE(NULLIF(TRIM(s.name), ''), '') AS subject_name
    FROM users u
    JOIN faculties f ON f.user_id = u.id
    LEFT JOIN subjects s ON s.id = f.subject_id
    WHERE u.id = $1
      AND u.role = 'faculty'
    LIMIT 1
`;

const DIFFICULTY_SORT_SQL = `
    CASE qbf.difficulty
        WHEN 'easy' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'hard' THEN 3
        ELSE 4
    END
`;

function buildSortClause(sort) {
    switch (sort) {
        case "name_asc":
            return "qbf.title ASC, qbf.created_at DESC";
        case "name_desc":
            return "qbf.title DESC, qbf.created_at DESC";
        case "oldest":
            return "qbf.created_at ASC, qbf.title ASC";
        case "difficulty_asc":
            return `${DIFFICULTY_SORT_SQL} ASC, qbf.created_at DESC, qbf.title ASC`;
        case "difficulty_desc":
            return `${DIFFICULTY_SORT_SQL} DESC, qbf.created_at DESC, qbf.title ASC`;
        case "newest":
        default:
            return "qbf.created_at DESC, qbf.title ASC";
    }
}

export async function getFacultyQuestionBankContext(facultyUserId) {
    const contextResult = await pool.query(FACULTY_CONTEXT_QUERY, [facultyUserId]);
    const context = contextResult.rows[0] || null;

    if (!context || !context.subject_name) {
        return null;
    }

    const batchesResult = await pool.query(
        `
        SELECT DISTINCT b.id, b.name
        FROM faculty_assignments fa
        JOIN batch_subjects bs ON bs.id = fa.batch_subject_id
        JOIN batches b ON b.id = bs.batch_id
        WHERE fa.faculty_id = $1
          AND b.is_active = true
        ORDER BY b.name ASC
        `,
        [facultyUserId]
    );

    return {
        facultyUserId,
        subject_name: context.subject_name,
        accessibleBatches: batchesResult.rows,
    };
}

export async function listFacultyQuestionBankFiles({ facultyUserId, batchId, search = "", sort = "newest" }) {
    const context = await getFacultyQuestionBankContext(facultyUserId);
    if (!context) {
        return { accessibleBatches: [], items: [] };
    }

    const accessibleBatchIds = new Set(context.accessibleBatches.map((batch) => batch.id));
    if (batchId && !accessibleBatchIds.has(batchId)) {
        const error = new Error("forbidden");
        error.code = "FORBIDDEN_BATCH";
        throw error;
    }

    const params = [context.subject_name];
    const whereClauses = [
        `LOWER(TRIM(COALESCE(qbf.subject_name, ''))) = LOWER(TRIM(COALESCE($1, '')))`,
        `qbl.batch_id = ANY($2::uuid[])`,
    ];

    params.push(context.accessibleBatches.map((batch) => batch.id));

    if (batchId) {
        params.push(batchId);
        whereClauses.push(`qbl.batch_id = $${params.length}`);
    }

    if (search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        whereClauses.push(`LOWER(qbf.title) LIKE $${params.length}`);
    }

    const result = await pool.query(
        `
        SELECT
            qbf.id,
            qbf.subject_name,
            qbf.title,
            qbf.difficulty,
            qbf.file_url,
            qbf.original_file_name,
            qbf.created_by,
            qbf.created_at,
            ARRAY_AGG(DISTINCT qbl.batch_id) AS batch_ids,
            JSON_AGG(
                DISTINCT JSONB_BUILD_OBJECT('id', b.id, 'name', b.name)
            ) FILTER (WHERE b.id IS NOT NULL) AS batches
        FROM question_bank_files qbf
        JOIN question_bank_batch_links qbl ON qbl.question_bank_file_id = qbf.id
        JOIN batches b ON b.id = qbl.batch_id
        WHERE ${whereClauses.join("\n          AND ")}
        GROUP BY qbf.id
        ORDER BY ${buildSortClause(sort)}
        `,
        params
    );

    return {
        accessibleBatches: context.accessibleBatches,
        items: result.rows,
    };
}

export async function getStudentAssignedBatch(studentUserId) {
    const result = await pool.query(
        `
        SELECT b.id, b.name
        FROM students s
        JOIN batches b ON b.id = s.assigned_batch_id
        WHERE s.user_id = $1
          AND b.is_active = true
        LIMIT 1
        `,
        [studentUserId]
    );

    return result.rows[0] || null;
}

export async function listStudentQuestionBankFiles({ studentUserId, subjectName, search = "", sort = "newest" }) {
    const assignedBatch = await getStudentAssignedBatch(studentUserId);
    if (!assignedBatch) {
        return { assignedBatch: null, items: [] };
    }

    const params = [assignedBatch.id];
    const whereClauses = [`qbl.batch_id = $1`];

    if (subjectName?.trim()) {
        params.push(subjectName.trim());
        whereClauses.push(`LOWER(TRIM(COALESCE(qbf.subject_name, ''))) = LOWER(TRIM(COALESCE($${params.length}, '')))`);
    }

    if (search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        whereClauses.push(`LOWER(qbf.title) LIKE $${params.length}`);
    }

    const result = await pool.query(
        `
        SELECT
            qbf.id,
            qbf.subject_name,
            qbf.title,
            qbf.difficulty,
            qbf.file_url,
            qbf.original_file_name,
            qbf.created_by,
            qbf.created_at,
            ARRAY[qbl.batch_id]::uuid[] AS batch_ids,
            JSON_BUILD_ARRAY(JSONB_BUILD_OBJECT('id', b.id, 'name', b.name)) AS batches
        FROM question_bank_files qbf
        JOIN question_bank_batch_links qbl ON qbl.question_bank_file_id = qbf.id
        JOIN batches b ON b.id = qbl.batch_id
        WHERE ${whereClauses.join("\n          AND ")}
        ORDER BY ${buildSortClause(sort)}
        `,
        params
    );

    return {
        assignedBatch,
        items: result.rows,
    };
}

export async function createQuestionBankFile({
    id,
    subjectName,
    title,
    difficulty,
    fileUrl,
    originalFileName,
    createdBy,
    batchIds,
}) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const insertedFile = await client.query(
            `
            INSERT INTO question_bank_files (
                id,
                subject_name,
                title,
                difficulty,
                file_url,
                original_file_name,
                created_by
            )
            VALUES (
                COALESCE($1, gen_random_uuid()),
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
            RETURNING *
            `,
            [id || null, subjectName, title, difficulty, fileUrl, originalFileName, createdBy]
        );

        for (const batchId of batchIds) {
            await client.query(
                `
                INSERT INTO question_bank_batch_links (question_bank_file_id, batch_id)
                VALUES ($1, $2)
                `,
                [insertedFile.rows[0].id, batchId]
            );
        }

        await client.query("COMMIT");
        return insertedFile.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function removeQuestionBankFileFromBatch({ facultyUserId, fileId, batchId }) {
    const context = await getFacultyQuestionBankContext(facultyUserId);
    if (!context) {
        return null;
    }

    const accessibleBatchIds = new Set(context.accessibleBatches.map((batch) => batch.id));
    if (!accessibleBatchIds.has(batchId)) {
        return null;
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const existingResult = await client.query(
            `
            SELECT qbf.id, qbf.file_url, qbf.subject_name
            FROM question_bank_files qbf
            JOIN question_bank_batch_links qbl ON qbl.question_bank_file_id = qbf.id
            WHERE qbf.id = $1
              AND qbl.batch_id = $2
              AND LOWER(TRIM(COALESCE(qbf.subject_name, ''))) = LOWER(TRIM(COALESCE($3, '')))
            LIMIT 1
            `,
            [fileId, batchId, context.subject_name]
        );

        const existing = existingResult.rows[0];
        if (!existing) {
            await client.query("ROLLBACK");
            return null;
        }

        await client.query(
            `
            DELETE FROM question_bank_batch_links
            WHERE question_bank_file_id = $1
              AND batch_id = $2
            `,
            [fileId, batchId]
        );

        const remainingLinksResult = await client.query(
            `
            SELECT COUNT(*)::int AS count
            FROM question_bank_batch_links
            WHERE question_bank_file_id = $1
            `,
            [fileId]
        );

        const remainingLinks = Number(remainingLinksResult.rows[0]?.count ?? 0);
        let shouldDeleteStorage = false;

        if (remainingLinks === 0) {
            shouldDeleteStorage = true;
            await client.query(
                `
                DELETE FROM question_bank_files
                WHERE id = $1
                `,
                [fileId]
            );
        }

        await client.query("COMMIT");

        return {
            deleted: true,
            shouldDeleteStorage,
            fileUrl: existing.file_url,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
