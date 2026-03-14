-- 012_single_student_batch.sql
-- Move student assignments from student_batches to students.assigned_batch_id

ALTER TABLE students
ADD COLUMN IF NOT EXISTS assigned_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;

DO $$
DECLARE
    has_student_batches BOOLEAN;
    has_joined_at BOOLEAN;
    backfill_sql TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'student_batches'
    ) INTO has_student_batches;

    IF has_student_batches THEN
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'student_batches'
              AND column_name = 'joined_at'
        ) INTO has_joined_at;

        backfill_sql := '
            WITH ranked_assignments AS (
                SELECT
                    sb.student_id,
                    sb.batch_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY sb.student_id
                        ORDER BY ' ||
                        CASE
                            WHEN has_joined_at THEN 'sb.joined_at DESC NULLS LAST, '
                            ELSE ''
                        END ||
                        'sb.ctid DESC
                    ) AS row_num
                FROM student_batches sb
            )
            UPDATE students s
            SET assigned_batch_id = ra.batch_id
            FROM ranked_assignments ra
            WHERE s.user_id = ra.student_id
              AND ra.row_num = 1
              AND s.assigned_batch_id IS NULL
        ';

        EXECUTE backfill_sql;

        DROP TABLE student_batches;
    END IF;
END $$;
