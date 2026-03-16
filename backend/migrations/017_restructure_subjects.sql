-- 017_restructure_subjects.sql

-- 1. Create global subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create batch_subjects table (links batches to subjects and stores total_classes)
CREATE TABLE IF NOT EXISTS batch_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    total_classes NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (batch_id, subject_id)
);

-- 3. Create faculty_assignments table (links faculty to their specific batch-subject)
CREATE TABLE IF NOT EXISTS faculty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculties(user_id) ON DELETE CASCADE,
    batch_subject_id UUID NOT NULL REFERENCES batch_subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (faculty_id, batch_subject_id)
);

-- 4. DATA MIGRATION: Subjects
INSERT INTO subjects (name)
SELECT DISTINCT name FROM (
    SELECT unnest(subjects) as name FROM batches
    UNION
    SELECT subject as name FROM faculties WHERE subject IS NOT NULL
) as all_subs
ON CONFLICT (name) DO NOTHING;

-- 5. DATA MIGRATION: Batch Subjects
DO $$
DECLARE
    b_record RECORD;
    s_name TEXT;
    s_id UUID;
BEGIN
    FOR b_record IN SELECT id, subjects FROM batches LOOP
        IF b_record.subjects IS NOT NULL THEN
            FOREACH s_name IN ARRAY b_record.subjects LOOP
                SELECT id INTO s_id FROM subjects WHERE name = s_name;
                IF s_id IS NOT NULL THEN
                    INSERT INTO batch_subjects (batch_id, subject_id)
                    VALUES (b_record.id, s_id)
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- 6. Modify faculties table
ALTER TABLE faculties ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);
UPDATE faculties f SET subject_id = s.id FROM subjects s WHERE f.subject = s.name;

-- 7. DATA MIGRATION: Faculty Assignments
INSERT INTO faculty_assignments (faculty_id, batch_subject_id)
SELECT fb.faculty_id, bs.id
FROM faculty_batches fb
JOIN faculties f ON f.user_id = fb.faculty_id
JOIN batch_subjects bs ON bs.batch_id = fb.batch_id AND bs.subject_id = f.subject_id
ON CONFLICT DO NOTHING;

-- 8. Modify chapters table
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS batch_subject_id UUID REFERENCES batch_subjects(id);
UPDATE chapters c SET batch_subject_id = bs.id FROM batch_subjects bs JOIN subjects s ON s.id = bs.subject_id WHERE c.batch_id = bs.batch_id AND c.subject_name = s.name;

-- 9. Modify student_ratings table
ALTER TABLE student_ratings ADD COLUMN IF NOT EXISTS batch_subject_id UUID REFERENCES batch_subjects(id);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'assigned_batch_id') THEN
        UPDATE student_ratings r
        SET batch_subject_id = bs.id
        FROM students s
        JOIN batch_subjects bs ON bs.batch_id = s.assigned_batch_id
        JOIN subjects sub ON sub.id = bs.subject_id
        WHERE r.student_id = s.user_id AND r.subject = sub.name;
    END IF;
END $$;

-- Ensure constraints for UPSERT in student_ratings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_ratings_student_id_batch_subject_id_key') THEN
        ALTER TABLE student_ratings ADD CONSTRAINT student_ratings_student_id_batch_subject_id_key UNIQUE (student_id, batch_subject_id);
    END IF;
END $$;

-- 10. CLEANUP (Drop legacy columns and tables)
-- We use DO blocks to make it safe to rerun
DO $$
BEGIN
    -- DROP faculty_batches table
    DROP TABLE IF EXISTS faculty_batches;
    
    -- Drop batch columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'batches' AND column_name = 'subjects') THEN
        ALTER TABLE batches DROP COLUMN subjects;
    END IF;
    
    -- Drop faculty columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faculties' AND column_name = 'subject') THEN
        ALTER TABLE faculties DROP COLUMN subject;
    END IF;
    
    -- Drop chapter columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chapters' AND column_name = 'batch_id') THEN
        ALTER TABLE chapters DROP COLUMN batch_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chapters' AND column_name = 'subject_name') THEN
        ALTER TABLE chapters DROP COLUMN subject_name;
    END IF;
    
    -- Drop rating columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_ratings' AND column_name = 'subject') THEN
        ALTER TABLE student_ratings DROP COLUMN subject;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_ratings' AND column_name = 'total_classes') THEN
        ALTER TABLE student_ratings DROP COLUMN total_classes;
    END IF;
END $$;
