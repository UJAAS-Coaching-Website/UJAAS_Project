-- 018_add_faculty_remarks_to_ratings.sql
ALTER TABLE student_ratings ADD COLUMN IF NOT EXISTS remarks TEXT;
