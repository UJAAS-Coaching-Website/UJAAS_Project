import { pool } from "../db/index.js";

async function tableExists(tableName, client = pool) {
    const result = await client.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = $1
        ) AS exists`,
        [tableName]
    );
    return result.rows[0]?.exists === true;
}

async function columnExists(tableName, columnName, client = pool) {
    const result = await client.query(
        `SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = $1
              AND column_name = $2
        ) AS exists`,
        [tableName, columnName]
    );
    return result.rows[0]?.exists === true;
}

async function getSubjectName(subjectId, client) {
    if (!(await tableExists("subjects", client))) {
        return null;
    }
    const result = await client.query("SELECT name FROM subjects WHERE id = $1", [subjectId]);
    return result.rows[0]?.name ?? null;
}

async function getBatchSubjectId(batchId, subjectId, client) {
    if (!(await tableExists("batch_subjects", client))) {
        return null;
    }
    const result = await client.query(
        "SELECT id FROM batch_subjects WHERE batch_id = $1 AND subject_id = $2",
        [batchId, subjectId]
    );
    return result.rows[0]?.id ?? null;
}

function hasAnyLinks(links) {
    return Object.values(links).some((value) => Number(value) > 0);
}

async function countBatchSubjectLinks(batchSubjectId, batchId, subjectName, client) {
  const links = {
    chapters: 0,
    notes: 0,
    dpps: 0,
    tests: 0,
    questions: 0,
    studentRatings: 0,
  };

    const hasChapters = await tableExists("chapters", client);
    const hasChapterBatchSubjectId = hasChapters && await columnExists("chapters", "batch_subject_id", client);
    const hasChapterBatchId = hasChapters && await columnExists("chapters", "batch_id", client);
    const hasChapterSubjectName = hasChapters && await columnExists("chapters", "subject_name", client);

    if (hasChapters) {
        if (hasChapterBatchSubjectId) {
            const res = await client.query(
                "SELECT COUNT(*)::int AS count FROM chapters WHERE batch_subject_id = $1",
                [batchSubjectId]
            );
            links.chapters = res.rows[0]?.count ?? 0;
        } else if (hasChapterBatchId && hasChapterSubjectName) {
            const res = await client.query(
                "SELECT COUNT(*)::int AS count FROM chapters WHERE batch_id = $1 AND subject_name = $2",
                [batchId, subjectName]
            );
            links.chapters = res.rows[0]?.count ?? 0;
        }
    }

    if (await tableExists("notes", client) && hasChapters) {
        if (hasChapterBatchSubjectId) {
            const res = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM notes n
                 JOIN chapters c ON c.id = n.chapter_id
                 WHERE c.batch_subject_id = $1`,
                [batchSubjectId]
            );
            links.notes = res.rows[0]?.count ?? 0;
        } else if (hasChapterBatchId && hasChapterSubjectName) {
            const res = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM notes n
                 JOIN chapters c ON c.id = n.chapter_id
                 WHERE c.batch_id = $1 AND c.subject_name = $2`,
                [batchId, subjectName]
            );
            links.notes = res.rows[0]?.count ?? 0;
        }
    }

    if (await tableExists("dpps", client) && hasChapters) {
        if (hasChapterBatchSubjectId) {
            const res = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM dpps d
                 JOIN chapters c ON c.id = d.chapter_id
                 WHERE c.batch_subject_id = $1`,
                [batchSubjectId]
            );
            links.dpps = res.rows[0]?.count ?? 0;
        } else if (hasChapterBatchId && hasChapterSubjectName) {
            const res = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM dpps d
                 JOIN chapters c ON c.id = d.chapter_id
                 WHERE c.batch_id = $1 AND c.subject_name = $2`,
                [batchId, subjectName]
            );
            links.dpps = res.rows[0]?.count ?? 0;
        }
    }

    if (await tableExists("questions", client) && await tableExists("test_target_batches", client)) {
        const res = await client.query(
            `SELECT
                COUNT(*)::int AS questions,
                COUNT(DISTINCT q.test_id)::int AS tests
             FROM questions q
             JOIN test_target_batches tb ON tb.test_id = q.test_id
             WHERE tb.batch_id = $1
               AND LOWER(TRIM(COALESCE(q.subject, ''))) = LOWER(TRIM(COALESCE($2, '')))`,
            [batchId, subjectName]
        );
        links.questions = res.rows[0]?.questions ?? 0;
        links.tests = res.rows[0]?.tests ?? 0;
    }

    if (await tableExists("student_ratings", client)) {
        const hasBatchSubjectId = await columnExists("student_ratings", "batch_subject_id", client);
        if (hasBatchSubjectId) {
            const res = await client.query(
                "SELECT COUNT(*)::int AS count FROM student_ratings WHERE batch_subject_id = $1",
                [batchSubjectId]
            );
            links.studentRatings = res.rows[0]?.count ?? 0;
        } else if (await columnExists("student_ratings", "subject", client) && await tableExists("students", client)) {
            const hasAssignedBatch = await columnExists("students", "assigned_batch_id", client);
            if (hasAssignedBatch) {
                const res = await client.query(
                    `SELECT COUNT(*)::int AS count
                     FROM student_ratings r
                     JOIN students s ON s.user_id = r.student_id
                     WHERE s.assigned_batch_id = $1
                       AND LOWER(TRIM(COALESCE(r.subject, ''))) = LOWER(TRIM(COALESCE($2, '')))`,
                    [batchId, subjectName]
                );
                links.studentRatings = res.rows[0]?.count ?? 0;
            }
        }
    }

    return links;
}

async function countGlobalSubjectLinks(subjectId, subjectName, client) {
  const links = {
    batches: 0,
    faculty: 0,
    chapters: 0,
    notes: 0,
    dpps: 0,
    tests: 0,
    questions: 0,
    studentRatings: 0,
  };

    if (await tableExists("batch_subjects", client)) {
        const res = await client.query(
            "SELECT COUNT(*)::int AS count FROM batch_subjects WHERE subject_id = $1",
            [subjectId]
        );
        links.batches = res.rows[0]?.count ?? 0;
    } else if (await tableExists("batches", client) && await columnExists("batches", "subjects", client)) {
        const res = await client.query(
            "SELECT COUNT(*)::int AS count FROM batches WHERE $1 = ANY(subjects)",
            [subjectName]
        );
        links.batches = res.rows[0]?.count ?? 0;
    }

    if (await tableExists("faculties", client)) {
        if (await columnExists("faculties", "subject_id", client)) {
            const res = await client.query(
                "SELECT COUNT(*)::int AS count FROM faculties WHERE subject_id = $1",
                [subjectId]
            );
            links.faculty = res.rows[0]?.count ?? 0;
        } else if (await columnExists("faculties", "subject", client)) {
            const res = await client.query(
                "SELECT COUNT(*)::int AS count FROM faculties WHERE LOWER(TRIM(COALESCE(subject, ''))) = LOWER(TRIM(COALESCE($1, '')))",
                [subjectName]
            );
            links.faculty = res.rows[0]?.count ?? 0;
        }
    }

    const hasChapters = await tableExists("chapters", client);
    const hasChapterBatchSubjectId = hasChapters && await columnExists("chapters", "batch_subject_id", client);
    const hasChapterSubjectName = hasChapters && await columnExists("chapters", "subject_name", client);

    if (hasChapters) {
        if (hasChapterBatchSubjectId && await tableExists("batch_subjects", client)) {
            const res = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM chapters c
                 JOIN batch_subjects bs ON bs.id = c.batch_subject_id
                 WHERE bs.subject_id = $1`,
                [subjectId]
            );
            links.chapters = res.rows[0]?.count ?? 0;
        } else if (hasChapterSubjectName) {
            const res = await client.query(
                "SELECT COUNT(*)::int AS count FROM chapters WHERE LOWER(TRIM(COALESCE(subject_name, ''))) = LOWER(TRIM(COALESCE($1, '')))",
                [subjectName]
            );
            links.chapters = res.rows[0]?.count ?? 0;
        }
    }

    if (await tableExists("notes", client) && hasChapters) {
        if (hasChapterBatchSubjectId && await tableExists("batch_subjects", client)) {
            const res = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM notes n
                 JOIN chapters c ON c.id = n.chapter_id
                 JOIN batch_subjects bs ON bs.id = c.batch_subject_id
                 WHERE bs.subject_id = $1`,
                [subjectId]
            );
            links.notes = res.rows[0]?.count ?? 0;
        } else if (hasChapterSubjectName) {
            const res = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM notes n
                 JOIN chapters c ON c.id = n.chapter_id
                 WHERE LOWER(TRIM(COALESCE(c.subject_name, ''))) = LOWER(TRIM(COALESCE($1, '')))`,
                [subjectName]
            );
            links.notes = res.rows[0]?.count ?? 0;
        }
    }

    if (await tableExists("dpps", client) && hasChapters) {
        if (hasChapterBatchSubjectId && await tableExists("batch_subjects", client)) {
            const res = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM dpps d
                 JOIN chapters c ON c.id = d.chapter_id
                 JOIN batch_subjects bs ON bs.id = c.batch_subject_id
                 WHERE bs.subject_id = $1`,
                [subjectId]
            );
            links.dpps = res.rows[0]?.count ?? 0;
        } else if (hasChapterSubjectName) {
            const res = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM dpps d
                 JOIN chapters c ON c.id = d.chapter_id
                 WHERE LOWER(TRIM(COALESCE(c.subject_name, ''))) = LOWER(TRIM(COALESCE($1, '')))`,
                [subjectName]
            );
            links.dpps = res.rows[0]?.count ?? 0;
        }
    }

    if (await tableExists("questions", client)) {
        const res = await client.query(
            `SELECT
                COUNT(*)::int AS questions,
                COUNT(DISTINCT test_id)::int AS tests
             FROM questions
             WHERE LOWER(TRIM(COALESCE(subject, ''))) = LOWER(TRIM(COALESCE($1, '')))`,
            [subjectName]
        );
        links.questions = res.rows[0]?.questions ?? 0;
        links.tests = res.rows[0]?.tests ?? 0;
    }

    if (await tableExists("student_ratings", client)) {
        const hasBatchSubjectId = await columnExists("student_ratings", "batch_subject_id", client);
        if (hasBatchSubjectId && await tableExists("batch_subjects", client)) {
            const res = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM student_ratings r
                 JOIN batch_subjects bs ON bs.id = r.batch_subject_id
                 WHERE bs.subject_id = $1`,
                [subjectId]
            );
            links.studentRatings = res.rows[0]?.count ?? 0;
        } else if (await columnExists("student_ratings", "subject", client)) {
            const res = await client.query(
                "SELECT COUNT(*)::int AS count FROM student_ratings WHERE LOWER(TRIM(COALESCE(subject, ''))) = LOWER(TRIM(COALESCE($1, '')))",
                [subjectName]
            );
            links.studentRatings = res.rows[0]?.count ?? 0;
        }
    }

    return links;
}

export async function listSubjects() {
    if (!(await tableExists("subjects"))) {
        return [];
    }
    const result = await pool.query("SELECT id, name FROM subjects ORDER BY name ASC");
    return result.rows;
}

export async function removeSubjectFromBatch(batchId, subjectId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (!(await tableExists("batch_subjects", client))) {
            const error = new Error("subjects are not configured for batches");
            error.code = "SUBJECTS_UNSUPPORTED";
            throw error;
        }

        const subjectName = await getSubjectName(subjectId, client);
        if (!subjectName) {
            const error = new Error("subject not found");
            error.code = "SUBJECT_NOT_FOUND";
            throw error;
        }

    const batchSubjectId = await getBatchSubjectId(batchId, subjectId, client);
    if (!batchSubjectId) {
      const error = new Error("subject not linked to batch");
      error.code = "BATCH_SUBJECT_NOT_FOUND";
      throw error;
    }

    const globalLinks = await countGlobalSubjectLinks(subjectId, subjectName, client);
    const batchCount = Number(globalLinks.batches || 0);

    if (batchCount <= 1) {
        const { batches, ...otherLinks } = globalLinks;
        if (hasAnyLinks(otherLinks)) {
            await client.query("ROLLBACK");
            return { ok: false, links: globalLinks };
        }
        await client.query("DELETE FROM batch_subjects WHERE id = $1", [batchSubjectId]);
        await client.query("DELETE FROM subjects WHERE id = $1", [subjectId]);
        await client.query("COMMIT");
        return { ok: true, action: "deleted" };
    }

    const batchLinks = await countBatchSubjectLinks(batchSubjectId, batchId, subjectName, client);
    if (hasAnyLinks(batchLinks)) {
        await client.query("ROLLBACK");
        return { ok: false, links: batchLinks };
    }

    await client.query("DELETE FROM batch_subjects WHERE id = $1", [batchSubjectId]);
    await client.query("COMMIT");
    return { ok: true, action: "removed" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
    } finally {
        client.release();
    }
}

export async function deleteSubjectGlobal(subjectId) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const subjectName = await getSubjectName(subjectId, client);
        if (!subjectName) {
            const error = new Error("subject not found");
            error.code = "SUBJECT_NOT_FOUND";
            throw error;
        }

        const links = await countGlobalSubjectLinks(subjectId, subjectName, client);
        if (hasAnyLinks(links)) {
            await client.query("ROLLBACK");
            return { ok: false, links };
        }

        await client.query("DELETE FROM subjects WHERE id = $1", [subjectId]);
        await client.query("COMMIT");
        return { ok: true };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
