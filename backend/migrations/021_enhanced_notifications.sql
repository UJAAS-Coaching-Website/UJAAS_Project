-- 021_enhanced_notifications.sql

-- 1. Main notification content
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'test', 'dpp', 'notice', 'review'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- Store { test_id: '...', chapter_id: '...' }
    is_sticky BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Link notifications to multiple batches
CREATE TABLE IF NOT EXISTS notification_batches (
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    PRIMARY KEY (notification_id, batch_id)
);

-- 3. Track individual student interactions (Read/Delete)
CREATE TABLE IF NOT EXISTS notification_deliveries (
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (notification_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nb_batch ON notification_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_nd_student ON notification_deliveries(student_id, is_deleted);
