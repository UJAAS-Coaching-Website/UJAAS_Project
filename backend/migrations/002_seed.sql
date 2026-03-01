-- 002_seed.sql
-- Sample data aligned to frontend defaults

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DELETE FROM users
WHERE login_id IN ('admin@ujaas.com', 'faculty@ujaas.com', 'UJAAS-11J-001', 'UJAAS-2026-001');

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
    INSERT INTO batches (id, name, year, start_date, end_date, active)
    VALUES
      (uuid_generate_v4(), '11th JEE', '2025-26', '2025-04-01', '2026-03-31', true),
      (uuid_generate_v4(), '11th NEET', '2025-26', '2025-04-01', '2026-03-31', true),
      (uuid_generate_v4(), '12th JEE', '2025-26', '2025-04-01', '2026-03-31', true),
      (uuid_generate_v4(), '12th NEET', '2025-26', '2025-04-01', '2026-03-31', true)
    RETURNING id, name
  ),
  student_inserted AS (
    INSERT INTO students (user_id, roll_number, phone, address, date_of_birth, parent_contact, join_date)
    SELECT
      id,
      'UJAAS-2026-001',
      '+91 98765 43210',
      'Mumbai, Maharashtra',
      '2005-05-15',
      '+91 98765 43211',
      '2025-09-01'
    FROM student_user
    RETURNING user_id
  ),
  faculty_inserted AS (
    INSERT INTO faculties (user_id, phone, subject_specialty, join_date)
    SELECT id, '+91 99999 11111', 'General', '2024-06-01'
    FROM faculty_user
    RETURNING user_id
  )
INSERT INTO student_batches (student_id, batch_id, joined_at)
SELECT s.user_id, b.id, '2025-09-01'
FROM student_inserted s
JOIN batches_inserted b ON b.name = '11th JEE';

INSERT INTO faculty_batches (faculty_id, batch_id)
SELECT t.user_id, b.id
FROM faculties t
JOIN batches b ON b.name = '11th JEE'
WHERE t.user_id IN (SELECT user_id FROM faculties LIMIT 1);

INSERT INTO notes (id, batch_id, title, file_url, created_at)
SELECT uuid_generate_v4(), b.id, 'Physics - Kinematics Notes', 'https://example.com/notes/kinematics.pdf', now()
FROM batches b
WHERE b.name = '11th JEE';

INSERT INTO tests (id, batch_id, title, type, scheduled_at, duration_minutes, total_marks)
SELECT uuid_generate_v4(), b.id, 'Weekly Test - Physics', 'test_series', '2026-03-05T10:00:00Z', 120, 300
FROM batches b
WHERE b.name = '11th JEE';

INSERT INTO tests (id, batch_id, title, type, scheduled_at, duration_minutes, total_marks)
SELECT uuid_generate_v4(), b.id, 'Mathematics DPP #1', 'dpp', '2026-03-01T10:00:00Z', 45, 50
FROM batches b
WHERE b.name = '11th JEE';

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
SELECT uuid_generate_v4(), s.user_id, 4.5, 4.2, 4.0, 4.8, 4.5, 4.6, now()
FROM students s
LIMIT 1;
