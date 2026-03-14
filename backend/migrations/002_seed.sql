-- 002_seed.sql (Updated for V2 Schema)
-- Sample data aligned to the new V2 schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Delete only if we're not using migrations that already handle this, but for a fresh start:
DELETE FROM users WHERE login_id IN ('admin@ujaas.com', 'faculty@ujaas.com', 'UJAAS-2026-001');

WITH
  admin_user AS (
    INSERT INTO users (id, name, login_id, role, password_hash)
    VALUES (
      uuid_generate_v4(),
      'Administrator',
      'admin@ujaas.com',
      'admin',
      'scrypt:f066066066066066:d2185b483ff1a95ec555c1821fe2283457328a89c45e48e5c446153936cf12ebc9a1232cb9bdaf7fa8effc0ef19a9939208c6b7d0b544ea4ae90fa44542d7103'
    )
    RETURNING id
  ),
  faculty_user AS (
    INSERT INTO users (id, name, login_id, role, password_hash)
    VALUES (
      uuid_generate_v4(),
      'Asha Faculty',
      'faculty@ujaas.com',
      'faculty',
      'scrypt:f066066066066066:d2185b483ff1a95ec555c1821fe2283457328a89c45e48e5c446153936cf12ebc9a1232cb9bdaf7fa8effc0ef19a9939208c6b7d0b544ea4ae90fa44542d7103'
    )
    RETURNING id
  ),
  student_user AS (
    INSERT INTO users (id, name, login_id, role, password_hash)
    VALUES (
      uuid_generate_v4(),
      'Fresh Student',
      'UJAAS-2026-001',
      'student',
      'scrypt:f066066066066066:d2185b483ff1a95ec555c1821fe2283457328a89c45e48e5c446153936cf12ebc9a1232cb9bdaf7fa8effc0ef19a9939208c6b7d0b544ea4ae90fa44542d7103'
    )
    RETURNING id
  ),
  batches_inserted AS (
    INSERT INTO batches (id, name, slug, subjects, is_active)
    VALUES
      (uuid_generate_v4(), '11th JEE', '11th-jee', ARRAY['Physics', 'Chemistry', 'Mathematics'], true),
      (uuid_generate_v4(), '11th NEET', '11th-neet', ARRAY['Physics', 'Chemistry', 'Biology'], true),
      (uuid_generate_v4(), '12th JEE', '12th-jee', ARRAY['Physics', 'Chemistry', 'Mathematics'], true),
      (uuid_generate_v4(), '12th NEET', '12th-neet', ARRAY['Physics', 'Chemistry', 'Biology'], true)
    RETURNING id, name
  ),
  student_inserted AS (
    INSERT INTO students (user_id, roll_number, phone, address, dob, parent_contact, join_date, assigned_batch_id)
    SELECT
      id,
      'UJAAS-2026-001',
      '+91 98765 43210',
      'Mumbai, Maharashtra',
      '2005-05-15',
      '+91 98765 43211',
      '2025-09-01',
      (SELECT b.id FROM batches_inserted b WHERE b.name = '11th JEE' LIMIT 1)
    FROM student_user
    RETURNING user_id
  ),
  faculty_inserted AS (
    INSERT INTO faculties (user_id, phone, subject)
    SELECT id, '+91 99999 11111', 'General'
    FROM faculty_user
    RETURNING user_id
  )
INSERT INTO faculty_batches (faculty_id, batch_id)
SELECT f.user_id, b.id
FROM faculties f
JOIN batches b ON b.name = '11th JEE'
WHERE f.user_id IN (SELECT user_id FROM faculties LIMIT 1);

INSERT INTO notes (id, batch_id, title, file_url, subject, chapter, created_at)
SELECT uuid_generate_v4(), b.id, 'Physics - Kinematics Notes', 'https://example.com/notes/kinematics.pdf', 'Physics', 'Kinematics', now()
FROM batches b
WHERE b.name = '11th JEE';

INSERT INTO tests (id, title, duration_mins, total_marks, scheduled_at, format, status)
SELECT uuid_generate_v4(), 'Weekly Test - Physics', 120, 300, '2026-03-05T10:00:00Z', 'JEE MAIN', 'upcoming'
FROM batches b
WHERE b.name = '11th JEE'
LIMIT 1
RETURNING id;

-- Add target batch for the test above
INSERT INTO test_target_batches (test_id, batch_id)
SELECT t.id, b.id
FROM tests t, batches b
WHERE t.title = 'Weekly Test - Physics' AND b.name = '11th JEE';

INSERT INTO tests (id, title, duration_mins, total_marks, scheduled_at, format, status)
SELECT uuid_generate_v4(), 'Mathematics DPP #1', 45, 50, '2026-03-01T10:00:00Z', 'Custom', 'completed'
FROM batches b
WHERE b.name = '11th JEE'
LIMIT 1;

-- Add target batch for the test above
INSERT INTO test_target_batches (test_id, batch_id)
SELECT t.id, b.id
FROM tests t, batches b
WHERE t.title = 'Mathematics DPP #1' AND b.name = '11th JEE';

INSERT INTO test_attempts (id, test_id, student_id, score, time_spent, submitted_at)
SELECT uuid_generate_v4(), t.id, s.user_id, 240, 3600, now()
FROM tests t
JOIN students s ON true
WHERE t.title = 'Weekly Test - Physics'
LIMIT 1;

INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
SELECT uuid_generate_v4(), u.id, 'announcement', 'Welcome to UJAAS!',
       'Start your learning journey with our comprehensive study materials and practice tests.',
       false, now()
FROM users u WHERE u.role = 'student'
LIMIT 1;

INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
SELECT uuid_generate_v4(), u.id, 'info', 'New Notes Available',
       'Physics Wave Optics notes have been uploaded. Download now!',
       false, now()
FROM users u WHERE u.role = 'student'
LIMIT 1;

INSERT INTO student_ratings (id, student_id, subject, attendance, assignments, participation, behavior, updated_at)
SELECT uuid_generate_v4(), s.user_id, 'General', 4.5, 4.2, 4.8, 4.5, now()
FROM students s
LIMIT 1;
