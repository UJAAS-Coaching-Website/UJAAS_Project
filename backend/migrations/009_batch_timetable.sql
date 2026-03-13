-- Add timetable_url to batches
ALTER TABLE batches ADD COLUMN IF NOT EXISTS timetable_url text;
