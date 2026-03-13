-- 006_rename_email_to_login_id.sql

-- 1. Rename email to login_id only on legacy schemas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'email'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'login_id'
    ) THEN
        ALTER TABLE users RENAME COLUMN email TO login_id;
    END IF;
END $$;

-- 2. Update the constraint name for clarity
ALTER TABLE users DROP CONSTRAINT IF EXISTS non_student_must_have_email;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'login_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'non_student_must_have_login_id'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT non_student_must_have_login_id
        CHECK (role = 'student' OR login_id IS NOT NULL);
    END IF;
END $$;

-- 3. Ensure students have their roll_number as their login_id
-- This update handles existing data
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'login_id'
    ) THEN
        UPDATE users u
        SET login_id = s.roll_number
        FROM students s
        WHERE u.id = s.user_id
          AND u.role = 'student';
    END IF;
END $$;

-- 4. Add a constraint to students to ensure roll_number matches login_id
-- We use a trigger or just ensure logic in backend. 
-- Since roll_number is already in students, we'll keep it there for profile info,
-- but the primary identifier for auth is now users.login_id.
