ALTER TABLE test_attempts
    ADD COLUMN IF NOT EXISTS device_id TEXT;

CREATE TABLE IF NOT EXISTS dpp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dpp_id UUID NOT NULL REFERENCES dpps(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_dpp_session_student_dpp
    ON dpp_sessions (dpp_id, student_id);
