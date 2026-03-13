ALTER TABLE test_attempts
    ADD COLUMN IF NOT EXISTS attempt_no INTEGER,
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS correct_answers INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS wrong_answers INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unattempted INTEGER NOT NULL DEFAULT 0;

UPDATE test_attempts
SET started_at = COALESCE(started_at, submitted_at, NOW())
WHERE started_at IS NULL;

UPDATE test_attempts
SET deadline_at = COALESCE(deadline_at, submitted_at, started_at)
WHERE deadline_at IS NULL;

WITH numbered AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY test_id, student_id
            ORDER BY COALESCE(submitted_at, started_at, NOW()), id
        ) AS row_num
    FROM test_attempts
)
UPDATE test_attempts ta
SET attempt_no = numbered.row_num
FROM numbered
WHERE ta.id = numbered.id
  AND ta.attempt_no IS NULL;

ALTER TABLE test_attempts
    ALTER COLUMN attempt_no SET NOT NULL,
    ALTER COLUMN started_at SET NOT NULL,
    ALTER COLUMN deadline_at SET NOT NULL,
    ALTER COLUMN answers SET DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS uq_test_attempt_student_attempt_no
    ON test_attempts (test_id, student_id, attempt_no);

CREATE UNIQUE INDEX IF NOT EXISTS uq_test_attempt_one_active
    ON test_attempts (test_id, student_id)
    WHERE submitted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_test_attempts_test_submitted
    ON test_attempts (test_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_attempts_student_submitted
    ON test_attempts (student_id, submitted_at DESC);
