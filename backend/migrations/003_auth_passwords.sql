ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash text;

UPDATE users
SET password_hash = 'admin_seed_salt:0b7d88c3a05e53e82430f7d7f76931abd3d21f710df4c3746b5db71edc669fd16b48dc2263e709e521f32558ceac43ee4468481fc39f4eefa0dd4a2fb52c7d42'
WHERE role = 'admin' AND (password_hash IS NULL OR password_hash = '');

UPDATE users
SET password_hash = 'student_seed_salt:f52a9eabd44b4662ce26d5ad1f287bdeafc2b78d4e40ad3cb7f275c505dd5d0bbb0126109e5489a89e10edec7640e59a1f03e71d89f5f86df60a70e697996a53'
WHERE role = 'student' AND (password_hash IS NULL OR password_hash = '');

UPDATE users
SET password_hash = 'teacher_seed_salt:4cd0c38ba859d32b04943c9f6f1f4bc20a4c3af5670f6a0f7b377d4b9b9bec2e8cebe9f3778c12e09cf8ee5085fb3d986f438e56dc759f9a4f40a8dd9e4238f4'
WHERE role = 'teacher' AND (password_hash IS NULL OR password_hash = '');

UPDATE users
SET password_hash = 'default_seed_salt:b14cc879686ef73fe9504404a50592f69f8dd5a0aaa4bae2d17f5b9e82ef7dfe13c382a28d00a72579296dcf58936db01e13064533af4071c1a0d35566ed59cd'
WHERE password_hash IS NULL OR password_hash = '';

ALTER TABLE users
ALTER COLUMN password_hash SET NOT NULL;
