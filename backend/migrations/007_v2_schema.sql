-- 007_v2_schema.sql
-- Transitioning to the proposed schema in DATABASE_SCHEMA_PROPOSAL.md

-- 1. Create Enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_format') THEN
        CREATE TYPE test_format AS ENUM ('JEE MAIN', 'NEET', 'Custom');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_status') THEN
        CREATE TYPE test_status AS ENUM ('upcoming', 'live', 'completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('announcement', 'info', 'warning');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'query_status') THEN
        CREATE TYPE query_status AS ENUM ('new', 'contacted', 'completed');
    END IF;
END $$;

-- 2. Modify users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Modify students table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'students'
          AND column_name = 'date_of_birth'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'students'
          AND column_name = 'dob'
    ) THEN
        ALTER TABLE students RENAME COLUMN date_of_birth TO dob;
    END IF;
END $$;
ALTER TABLE students ADD COLUMN IF NOT EXISTS admin_remark TEXT;

-- 4. Modify faculties table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'faculties'
          AND column_name = 'subject_specialty'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'faculties'
          AND column_name = 'subject'
    ) THEN
        ALTER TABLE faculties RENAME COLUMN subject_specialty TO subject;
    END IF;
END $$;
ALTER TABLE faculties ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE faculties ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE faculties ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE faculties DROP COLUMN IF EXISTS join_date;

-- 5. Modify batches table
ALTER TABLE batches ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS subjects TEXT[];
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'batches'
          AND column_name = 'active'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'batches'
          AND column_name = 'is_active'
    ) THEN
        ALTER TABLE batches RENAME COLUMN active TO is_active;
    END IF;
END $$;
ALTER TABLE batches DROP COLUMN IF EXISTS year;
ALTER TABLE batches DROP COLUMN IF EXISTS start_date;
ALTER TABLE batches DROP COLUMN IF EXISTS end_date;

-- 6. Modify student_batches table
ALTER TABLE student_batches DROP COLUMN IF EXISTS joined_at;
ALTER TABLE student_batches DROP COLUMN IF EXISTS left_at;

-- 7. Modify tests table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tests'
          AND column_name = 'duration_minutes'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tests'
          AND column_name = 'duration_mins'
    ) THEN
        ALTER TABLE tests RENAME COLUMN duration_minutes TO duration_mins;
    END IF;
END $$;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS format test_format DEFAULT 'Custom';
ALTER TABLE tests ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS status test_status DEFAULT 'upcoming';
ALTER TABLE tests ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- 8. Create test_target_batches table
CREATE TABLE IF NOT EXISTS test_target_batches (
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    PRIMARY KEY (test_id, batch_id)
);

-- Migrate existing test targets only on legacy schemas that still store tests.batch_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tests'
          AND column_name = 'batch_id'
    ) THEN
        INSERT INTO test_target_batches (test_id, batch_id)
        SELECT id, batch_id FROM tests WHERE batch_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Now remove batch_id from tests (after migration)
ALTER TABLE tests DROP COLUMN IF EXISTS batch_id;
ALTER TABLE tests DROP COLUMN IF EXISTS type;

-- 9. Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    section TEXT,
    type TEXT NOT NULL, -- MCQ, Numerical
    question_text TEXT NOT NULL,
    question_img TEXT,
    options JSONB,
    option_imgs JSONB,
    correct_ans TEXT NOT NULL,
    marks INTEGER DEFAULT 4,
    neg_marks INTEGER DEFAULT 1,
    explanation TEXT,
    explanation_img TEXT,
    order_index INTEGER
);

-- 10. Modify test_attempts table
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS time_spent INTEGER;
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE test_attempts DROP COLUMN IF EXISTS status;

-- 11. Modify notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS chapter TEXT;

-- 12. Modify notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE CASCADE;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notifications'
          AND column_name = 'read'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'notifications'
          AND column_name = 'is_read'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN read TO is_read;
    END IF;
END $$;
ALTER TABLE notifications DROP COLUMN IF EXISTS icon;

-- 13. Modify ratings table (Rename to student_ratings)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'ratings'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'student_ratings'
    ) THEN
        ALTER TABLE ratings RENAME TO student_ratings;
    END IF;
END $$;
ALTER TABLE student_ratings ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE student_ratings DROP COLUMN IF EXISTS tests;
ALTER TABLE student_ratings DROP COLUMN IF EXISTS engagement;

-- 14. Create landing_page_data table
CREATE TABLE IF NOT EXISTS landing_page_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_key TEXT UNIQUE NOT NULL,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Create prospect_queries table
CREATE TABLE IF NOT EXISTS prospect_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    course TEXT,
    message TEXT,
    status query_status DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
