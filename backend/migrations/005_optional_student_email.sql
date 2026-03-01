-- 005_optional_student_email.sql

-- 1. Make email nullable
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 2. Add constraint to ensure non-students have emails
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'non_student_must_have_email') THEN
        ALTER TABLE users ADD CONSTRAINT non_student_must_have_email 
        CHECK (role = 'student' OR email IS NOT NULL);
    END IF;
END $$;

-- 3. Ensure roll_number is NOT NULL for students
ALTER TABLE students ALTER COLUMN roll_number SET NOT NULL;

-- 4. Set email to NULL for all existing students
UPDATE users SET email = NULL WHERE role = 'student';
