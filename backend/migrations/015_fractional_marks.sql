-- 015_fractional_marks.sql
-- Allow fractional negative marking and fractional scores

ALTER TABLE questions
    ALTER COLUMN neg_marks TYPE NUMERIC USING neg_marks::numeric,
    ALTER COLUMN neg_marks SET DEFAULT 1;

ALTER TABLE test_attempts
    ALTER COLUMN score TYPE NUMERIC USING score::numeric;

ALTER TABLE dpp_attempts
    ALTER COLUMN score TYPE NUMERIC USING score::numeric;
