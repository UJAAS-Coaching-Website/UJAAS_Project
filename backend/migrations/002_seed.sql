-- 002_seed.sql
-- Sample data aligned to frontend defaults

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

WITH
  admin_user AS (
    INSERT INTO users (id, name, email, role)
    VALUES (uuid_generate_v4(), 'Admin User', 'admin@ujaas.local', 'admin')
    RETURNING id
  ),
  teacher_user AS (
    INSERT INTO users (id, name, email, role)
    VALUES (uuid_generate_v4(), 'Asha Teacher', 'teacher@ujaas.local', 'teacher')
    RETURNING id
  ),
  student_user AS (
    INSERT INTO users (id, name, email, role)
    VALUES (uuid_generate_v4(), 'Demo Student', 'student@ujaas.local', 'student')
    RETURNING id
  ),
  batches_inserted AS (
    INSERT INTO batches (id, name, year, start_date, end_date, active)
    VALUES
      (uuid_generate_v4(), '2025-26 Morning Batch', '2025-26', '2025-04-01', '2026-03-31', true),
      (uuid_generate_v4(), '2025-26 Evening Batch', '2025-26', '2025-04-01', '2026-03-31', true)
    RETURNING id, name
  ),
  student_inserted AS (
    INSERT INTO students (user_id, roll_number, phone, address, date_of_birth, parent_contact, join_date)
    SELECT id, 'UG2025001', '+91 98765 43210', 'Mumbai, Maharashtra', '2005-05-15', '+91 98765 43211', '2025-09-01'
    FROM student_user
    RETURNING user_id
  ),
  teacher_inserted AS (
    INSERT INTO teachers (user_id, phone, subject_specialty, join_date)
    SELECT id, '+91 99999 11111', 'Physics', '2024-06-01'
    FROM teacher_user
    RETURNING user_id
  )
INSERT INTO student_batches (student_id, batch_id, joined_at)
SELECT s.user_id, b.id, '2025-09-01'
FROM student_inserted s
JOIN batches_inserted b ON b.name = '2025-26 Morning Batch';

INSERT INTO teacher_batches (teacher_id, batch_id)
SELECT t.user_id, b.id
FROM teachers t
JOIN batches b ON b.name = '2025-26 Morning Batch'
WHERE t.user_id IN (SELECT user_id FROM teachers LIMIT 1);

INSERT INTO notes (id, batch_id, title, file_url, created_at)
SELECT uuid_generate_v4(), b.id, 'Physics - Wave Optics', 'https://example.com/notes/wave-optics.pdf', now()
FROM batches b
WHERE b.name = '2025-26 Morning Batch';

INSERT INTO tests (id, batch_id, title, type, scheduled_at, duration_minutes, total_marks)
SELECT uuid_generate_v4(), b.id, 'Physics Test Series 1', 'test_series', '2026-02-28T10:00:00Z', 120, 300
FROM batches b
WHERE b.name = '2025-26 Morning Batch';

INSERT INTO tests (id, batch_id, title, type, scheduled_at, duration_minutes, total_marks)
SELECT uuid_generate_v4(), b.id, 'Chemistry DPP #8', 'dpp', '2026-02-26T10:00:00Z', 45, 50
FROM batches b
WHERE b.name = '2025-26 Morning Batch';

INSERT INTO test_attempts (id, test_id, student_id, score, submitted_at, status)
SELECT uuid_generate_v4(), t.id, s.user_id, 240, now(), 'submitted'
FROM tests t
JOIN students s ON true
WHERE t.title = 'Physics Test Series 1'
LIMIT 1;

INSERT INTO notifications (id, user_id, type, title, message, icon, read, created_at)
SELECT uuid_generate_v4(), u.id, 'announcement', 'Welcome to UJAAS!',
       'Start your learning journey with our comprehensive study materials and practice tests.',
       'award', false, now()
FROM users u WHERE u.role = 'student'
LIMIT 1;

INSERT INTO notifications (id, user_id, type, title, message, icon, read, created_at)
SELECT uuid_generate_v4(), u.id, 'info', 'New Notes Available',
       'Physics Wave Optics notes have been uploaded. Download now!',
       'notes', false, now()
FROM users u WHERE u.role = 'student'
LIMIT 1;

INSERT INTO notifications (id, user_id, type, title, message, icon, read, created_at)
SELECT uuid_generate_v4(), u.id, 'warning', 'DPP Deadline Approaching',
       'Chemistry DPP #8 is due in 2 days. Complete it soon!',
       'dpp', false, now()
FROM users u WHERE u.role = 'student'
LIMIT 1;

INSERT INTO ratings (id, student_id, attendance, assignments, tests, participation, behavior, engagement, updated_at)
SELECT uuid_generate_v4(), s.user_id, 0, 0, 0, 0, 0, 0, now()
FROM students s
LIMIT 1;
