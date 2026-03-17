import { pool } from "../db/index.js";

async function getSubjectName(subjectId, client = pool) {
    const result = await client.query("SELECT name FROM subjects WHERE id = $1", [subjectId]);
    return result.rows[0]?.name ?? null;
}

async function getBatchSubjectId(batchId, subjectId, client = pool) {
    const result = await client.query(
        "SELECT id FROM batch_subjects WHERE batch_id = $1 AND subject_id = $2",
        [batchId, subjectId]
    );
    return result.rows[0]?.id ?? null;
}

function hasAnyLinks(links) {
    return Object.values(links).some((value) => Number(value) > 0);
}

async function countBatchSubjectLinks(batchSubjectId, batchId, subjectName, client = pool) {
  const links = {
    chapters: 0,
    notes: 0,
    dpps: 0,
    tests: 0,
    questions: 0,
    studentRatings: 0,
  };

    const resChapters = await client.query(
        "SELECT COUNT(*)::int AS count FROM chapters WHERE batch_subject_id = $1",
        [batchSubjectId]
    );
    links.chapters = resChapters.rows[0]?.count ?? 0;

    const resNotes = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM notes n
         JOIN chapters c ON c.id = n.chapter_id
         WHERE c.batch_subject_id = $1`,
        [batchSubjectId]
    );
    links.notes = resNotes.rows[0]?.count ?? 0;

    const resDpps = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM dpps d
         JOIN chapters c ON c.id = d.chapter_id
         WHERE c.batch_subject_id = $1`,
        [batchSubjectId]
    );
    links.dpps = resDpps.rows[0]?.count ?? 0;

    const resQuestions = await client.query(
        `SELECT
            COUNT(*)::int AS questions,
            COUNT(DISTINCT q.test_id)::int AS tests
         FROM questions q
         JOIN test_target_batches tb ON tb.test_id = q.test_id
         WHERE tb.batch_id = $1
           AND LOWER(TRIM(COALESCE(q.subject, ''))) = LOWER(TRIM(COALESCE($2, '')))`,
        [batchId, subjectName]
    );
    links.questions = resQuestions.rows[0]?.questions ?? 0;
    links.tests = resQuestions.rows[0]?.tests ?? 0;

    const resRatings = await client.query(
        "SELECT COUNT(*)::int AS count FROM student_ratings WHERE batch_subject_id = $1",
        [batchSubjectId]
    );
    links.studentRatings = resRatings.rows[0]?.count ?? 0;

    return links;
}

async function countGlobalSubjectLinks(subjectId, subjectName, client = pool) {
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

    const resBatches = await client.query(
        "SELECT COUNT(*)::int AS count FROM batch_subjects WHERE subject_id = $1",
        [subjectId]
    );
    links.batches = resBatches.rows[0]?.count ?? 0;

    const resFaculty = await client.query(
        "SELECT COUNT(*)::int AS count FROM faculties WHERE subject_id = $1",
        [subjectId]
    );
    links.faculty = resFaculty.rows[0]?.count ?? 0;

    const resChapters = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM chapters c
         JOIN batch_subjects bs ON bs.id = c.batch_subject_id
         WHERE bs.subject_id = $1`,
        [subjectId]
    );
    links.chapters = resChapters.rows[0]?.count ?? 0;

    const resNotes = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM notes n
         JOIN chapters c ON c.id = n.chapter_id
         JOIN batch_subjects bs ON bs.id = c.batch_subject_id
         WHERE bs.subject_id = $1`,
        [subjectId]
    );
    links.notes = resNotes.rows[0]?.count ?? 0;

    const resDpps = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM dpps d
         JOIN chapters c ON c.id = d.chapter_id
         JOIN batch_subjects bs ON bs.id = c.batch_subject_id
         WHERE bs.subject_id = $1`,
        [subjectId]
    );
    links.dpps = resDpps.rows[0]?.count ?? 0;

    const resQuestions = await client.query(
        `SELECT
            COUNT(*)::int AS questions,
            COUNT(DISTINCT test_id)::int AS tests
         FROM questions
         WHERE LOWER(TRIM(COALESCE(subject, ''))) = LOWER(TRIM(COALESCE($1, '')))`,
        [subjectName]
    );
    links.questions = resQuestions.rows[0]?.questions ?? 0;
    links.tests = resQuestions.rows[0]?.tests ?? 0;

    const resRatings = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM student_ratings r
         JOIN batch_subjects bs ON bs.id = r.batch_subject_id
         WHERE bs.subject_id = $1`,
        [subjectId]
    );
    links.studentRatings = resRatings.rows[0]?.count ?? 0;

    return links;
}

export async function listSubjects() {
    const result = await pool.query("SELECT id, name FROM subjects ORDER BY name ASC");
    return result.rows;
}

export async function removeSubjectFromBatch(batchId, subjectId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
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
