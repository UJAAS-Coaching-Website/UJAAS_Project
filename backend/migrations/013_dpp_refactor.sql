ALTER TABLE dpps
    ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'dpps'
          AND column_name = 'description'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'dpps'
          AND column_name = 'instructions'
    ) THEN
        ALTER TABLE dpps RENAME COLUMN description TO instructions;
    END IF;
END $$;

ALTER TABLE dpp_attempts
    ADD COLUMN IF NOT EXISTS attempt_no INTEGER,
    ADD COLUMN IF NOT EXISTS correct_answers INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS wrong_answers INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unattempted INTEGER NOT NULL DEFAULT 0;

WITH numbered AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY dpp_id, student_id
            ORDER BY COALESCE(submitted_at, NOW()), id
        ) AS row_num
    FROM dpp_attempts
)
UPDATE dpp_attempts da
SET attempt_no = numbered.row_num
FROM numbered
WHERE da.id = numbered.id
  AND da.attempt_no IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_dpp_attempt_student_attempt_no
    ON dpp_attempts (dpp_id, student_id, attempt_no);

DO $$
DECLARE
    missing_count INTEGER;
    has_legacy_subject BOOLEAN;
    has_legacy_chapter BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'dpps'
          AND column_name = 'subject'
    ) INTO has_legacy_subject;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'dpps'
          AND column_name = 'chapter'
    ) INTO has_legacy_chapter;

    IF has_legacy_subject AND has_legacy_chapter THEN
        UPDATE dpps d
        SET chapter_id = matched.chapter_id
        FROM (
            SELECT
                d2.id AS dpp_id,
                MIN(c.id::text)::uuid AS chapter_id,
                COUNT(*) AS match_count
            FROM dpps d2
            JOIN dpp_target_batches dtb ON dtb.dpp_id = d2.id
            JOIN chapters c
              ON c.batch_id = dtb.batch_id
             AND LOWER(TRIM(c.subject_name)) = LOWER(TRIM(COALESCE(d2.subject, '')))
             AND LOWER(TRIM(c.name)) = LOWER(TRIM(COALESCE(d2.chapter, '')))
            WHERE d2.chapter_id IS NULL
            GROUP BY d2.id
        ) AS matched
        WHERE d.id = matched.dpp_id
          AND matched.match_count = 1;
    END IF;

    SELECT COUNT(*) INTO missing_count
    FROM dpps
    WHERE chapter_id IS NULL;

    IF missing_count > 0 THEN
        RAISE EXCEPTION 'Unable to backfill chapter_id for % dpp rows. Resolve ambiguous or missing chapter matches before rerunning migration.', missing_count;
    END IF;
END $$;

ALTER TABLE dpps
    ALTER COLUMN chapter_id SET NOT NULL;

ALTER TABLE dpp_attempts
    ALTER COLUMN attempt_no SET NOT NULL;

ALTER TABLE dpps
    DROP COLUMN IF EXISTS subject,
    DROP COLUMN IF EXISTS chapter;

ALTER TABLE notes
    DROP COLUMN IF EXISTS subject,
    DROP COLUMN IF EXISTS chapter;
