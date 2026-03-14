-- 001_init.sql
-- Simplified schema: batches only (no courses)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  login_id text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('student','faculty','admin')),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  roll_number text UNIQUE,
  phone text,
  address text,
  dob date,
  parent_contact text,
  join_date date,
  assigned_batch_id uuid REFERENCES batches(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS faculties (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone text,
  subject text,
  join_date date
);

CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE,
  subjects text[],
  is_active boolean NOT NULL DEFAULT true,
  timetable_url text
);

CREATE TABLE IF NOT EXISTS faculty_batches (
  faculty_id uuid REFERENCES faculties(user_id) ON DELETE CASCADE,
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  PRIMARY KEY (faculty_id, batch_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text NOT NULL,
  subject text,
  chapter text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  format text,
  scheduled_at timestamptz,
  schedule_time text,
  duration_mins int,
  duration_minutes int,
  total_marks int,
  instructions text,
  status text NOT NULL DEFAULT 'upcoming',
  created_by uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS test_target_batches (
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, batch_id)
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(user_id) ON DELETE CASCADE,
  score int,
  time_spent int,
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
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_ratings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(user_id) ON DELETE CASCADE,
  subject text,
  attendance numeric NOT NULL DEFAULT 0,
  assignments numeric NOT NULL DEFAULT 0,
  participation numeric NOT NULL DEFAULT 0,
  behavior numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
