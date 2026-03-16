-- Drop unused description column from batches
ALTER TABLE batches DROP COLUMN IF EXISTS description;
