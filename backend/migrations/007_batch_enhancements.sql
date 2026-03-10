-- 007_batch_enhancements.sql
-- Add missing columns to batches table

-- These columns may or may not exist depending on which migrations were run
ALTER TABLE batches ADD COLUMN IF NOT EXISTS year text;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS subjects text[];
