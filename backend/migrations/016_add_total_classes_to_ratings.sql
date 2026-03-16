-- 016_add_total_classes_to_ratings.sql
ALTER TABLE student_ratings ADD COLUMN IF NOT EXISTS total_classes numeric NOT NULL DEFAULT 0;

-- Ensure unique constraint for UPSERT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'student_ratings_student_id_subject_key'
    ) THEN
        ALTER TABLE student_ratings ADD CONSTRAINT student_ratings_student_id_subject_key UNIQUE (student_id, subject);
    END IF;
END $$;
