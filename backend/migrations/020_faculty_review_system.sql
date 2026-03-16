-- 020_faculty_review_system.sql

-- 1. Add rating tracking to faculties
ALTER TABLE faculties ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE faculties ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- 2. Table for the active session (only one should be active at a time)
CREATE TABLE IF NOT EXISTS faculty_review_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES users(id),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    expiry_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Table for individual reviews
CREATE TABLE IF NOT EXISTS faculty_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES faculty_review_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensures one student can only rate a specific faculty once per session
    UNIQUE(student_id, faculty_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_faculty_reviews_student ON faculty_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_faculty_reviews_faculty ON faculty_reviews(faculty_id);
