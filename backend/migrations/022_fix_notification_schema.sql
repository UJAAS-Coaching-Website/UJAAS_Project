-- 022_fix_notification_schema.sql

-- 1. Drop the old junction/delivery tables if they were created with wrong foreign keys
DROP TABLE IF EXISTS notification_deliveries CASCADE;
DROP TABLE IF EXISTS notification_batches CASCADE;

-- 2. Drop the old notifications table
DROP TABLE IF EXISTS notifications CASCADE;

-- 3. Re-create the main notifications content table (The "What")
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'test', 'dpp', 'notice', 'review'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', 
    is_sticky BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Re-create the link to multiple batches (The "Who - Groups")
CREATE TABLE notification_batches (
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    PRIMARY KEY (notification_id, batch_id)
);

-- 5. Re-create the individual student interaction tracking (The "Interaction")
CREATE TABLE notification_deliveries (
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (notification_id, student_id)
);

-- Indexes for performance
CREATE INDEX idx_nb_batch ON notification_batches(batch_id);
CREATE INDEX idx_nd_student ON notification_deliveries(student_id, is_deleted);
