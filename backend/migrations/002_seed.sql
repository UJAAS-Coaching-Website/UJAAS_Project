-- 002_seed.sql
-- Sample data aligned to frontend defaults

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DELETE FROM users
WHERE email IN ('admin@ujaas.com', 'teacher@ujaas.com', 'student@ujaas.com');

WITH
  admin_user AS (
    INSERT INTO users (id, name, email, role, password_hash)
    VALUES (
      uuid_generate_v4(),
      'Admin User',
      'admin@ujaas.com',
      'admin',
      'admin_seed_salt:0b7d88c3a05e53e82430f7d7f76931abd3d21f710df4c3746b5db71edc669fd16b48dc2263e709e521f32558ceac43ee4468481fc39f4eefa0dd4a2fb52c7d42'
    )
    RETURNING id
  ),
  teacher_user AS (
    INSERT INTO users (id, name, email, role, password_hash)
    VALUES (
      uuid_generate_v4(),
      'Asha Teacher',
      'teacher@ujaas.com',
      'teacher',
      'teacher_seed_salt:c1a4c6dbbf645eeb99b10fd9751ce2c51463e5b088fe4a53b9dbe5a65c99220d967312f2c287f0338b3f8c0d412ff49ec5223cc3127209fbc8c629a2b7621895'
    )
    RETURNING id
  ),
  student_user AS (
    INSERT INTO users (id, name, email, role, password_hash)
    VALUES (
      uuid_generate_v4(),
      'Demo Student',
      'student@ujaas.com',
      'student',
      'student_seed_salt:f52a9eabd44b4662ce26d5ad1f287bdeafc2b78d4e40ad3cb7f275c505dd5d0bbb0126109e5489a89e10edec7640e59a1f03e71d89f5f86df60a70e697996a53'
    )
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
    SELECT
      id,
      'UG' || TO_CHAR(CURRENT_DATE, 'YYYY') || RIGHT(REPLACE(id::text, '-', ''), 4),
      '+91 98765 43210',
      'Mumbai, Maharashtra',
      '2005-05-15',
      '+91 98765 43211',
      '2025-09-01'
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
