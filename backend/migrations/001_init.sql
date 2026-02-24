-- 001_init.sql
-- Simplified schema: batches only (no courses)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('student','teacher','admin')),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  roll_number text UNIQUE,
  phone text,
  address text,
  date_of_birth date,
  parent_contact text,
  join_date date
);

CREATE TABLE IF NOT EXISTS teachers (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone text,
  subject_specialty text,
  join_date date
);

CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  year text,
  start_date date,
  end_date date,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS student_batches (
  student_id uuid REFERENCES students(user_id) ON DELETE CASCADE,
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  joined_at date NOT NULL DEFAULT current_date,
  left_at date,
  PRIMARY KEY (student_id, batch_id)
);

CREATE TABLE IF NOT EXISTS teacher_batches (
  teacher_id uuid REFERENCES teachers(user_id) ON DELETE CASCADE,
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, batch_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('test_series','dpp')),
  scheduled_at timestamptz,
  duration_minutes int,
  total_marks int
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(user_id) ON DELETE CASCADE,
  score int,
  submitted_at timestamptz,
  status text NOT NULL CHECK (status IN ('started','submitted'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('announcement','info','warning')),
  title text NOT NULL,
  message text NOT NULL,
  icon text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(user_id) ON DELETE CASCADE,
  attendance int NOT NULL DEFAULT 0,
  assignments int NOT NULL DEFAULT 0,
  tests int NOT NULL DEFAULT 0,
  participation int NOT NULL DEFAULT 0,
  behavior int NOT NULL DEFAULT 0,
  engagement int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
