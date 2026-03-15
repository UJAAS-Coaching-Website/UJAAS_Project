CREATE TABLE IF NOT EXISTS question_bank_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    difficulty VARCHAR(16) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    file_url TEXT NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_bank_batch_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_bank_file_id UUID NOT NULL REFERENCES question_bank_files(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    UNIQUE (question_bank_file_id, batch_id)
);
