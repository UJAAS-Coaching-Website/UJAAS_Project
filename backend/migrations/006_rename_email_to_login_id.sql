-- 006_rename_email_to_login_id.sql

-- 1. Rename email to login_id
ALTER TABLE users RENAME COLUMN email TO login_id;

-- 2. Update the constraint name for clarity (optional but recommended)
ALTER TABLE users DROP CONSTRAINT IF EXISTS non_student_must_have_email;
ALTER TABLE users ADD CONSTRAINT non_student_must_have_login_id 
CHECK (role = 'student' OR login_id IS NOT NULL);

-- 3. Ensure students have their roll_number as their login_id
-- This update handles existing data
UPDATE users u
SET login_id = s.roll_number
FROM students s
WHERE u.id = s.user_id AND u.role = 'student';

-- 4. Add a constraint to students to ensure roll_number matches login_id
-- We use a trigger or just ensure logic in backend. 
-- Since roll_number is already in students, we'll keep it there for profile info,
-- but the primary identifier for auth is now users.login_id.
