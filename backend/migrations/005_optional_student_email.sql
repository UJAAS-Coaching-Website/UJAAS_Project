-- 005_optional_student_email.sql

-- 1. Make email nullable only if the legacy column still exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'email'
    ) THEN
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    END IF;
END $$;

-- 2. Add constraint to ensure non-students have a login identifier.
DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS non_student_must_have_email;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'login_id'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'non_student_must_have_login_id') THEN
            ALTER TABLE users ADD CONSTRAINT non_student_must_have_login_id
            CHECK (role = 'student' OR login_id IS NOT NULL);
        END IF;
    ELSIF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'email'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'non_student_must_have_email') THEN
            ALTER TABLE users ADD CONSTRAINT non_student_must_have_email
            CHECK (role = 'student' OR email IS NOT NULL);
        END IF;
    END IF;
END $$;

-- 3. Ensure roll_number is NOT NULL for students
ALTER TABLE students ALTER COLUMN roll_number SET NOT NULL;

-- 4. Set email to NULL for all existing students only on legacy schemas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'email'
    ) THEN
        UPDATE users SET email = NULL WHERE role = 'student';
    END IF;
END $$;
