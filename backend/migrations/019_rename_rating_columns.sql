-- 019_rename_rating_columns.sql

DO $$
BEGIN
    -- Rename assignments to test_performance
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_ratings' AND column_name = 'assignments') THEN
        ALTER TABLE student_ratings RENAME COLUMN assignments TO test_performance;
    END IF;

    -- Rename participation to dpp_performance
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_ratings' AND column_name = 'participation') THEN
        ALTER TABLE student_ratings RENAME COLUMN participation TO dpp_performance;
    END IF;

    -- Ensure 'engagement' is really gone
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_ratings' AND column_name = 'engagement') THEN
        ALTER TABLE student_ratings DROP COLUMN engagement;
    END IF;
END $$;
