# Database Schema (Batches-Only)

This schema is designed for a small coaching center site where content is assigned directly to batches (no separate courses table).

## Overview
- Users have roles: student, teacher, admin.
- Students and teachers are separate profiles linked to users.
- Batches represent cohorts.
- Materials, tests, and notifications are assigned to users or batches.

## Tables

### users
- `id` uuid PK
- `name` text
- `email` text (unique)
- `role` text enum: `student|teacher|admin`
- `created_at` timestamptz

### students
- `user_id` uuid PK, FK ? users.id
- `roll_number` text (unique)
- `phone` text
- `address` text
- `date_of_birth` date
- `parent_contact` text
- `join_date` date

### teachers
- `user_id` uuid PK, FK ? users.id
- `phone` text
- `subject_specialty` text
- `join_date` date

### batches
- `id` uuid PK
- `name` text
- `year` text
- `start_date` date
- `end_date` date
- `active` boolean

### student_batches
- `student_id` uuid FK ? students.user_id
- `batch_id` uuid FK ? batches.id
- `joined_at` date
- `left_at` date (nullable)
- PK: (`student_id`, `batch_id`)

### teacher_batches
- `teacher_id` uuid FK ? teachers.user_id
- `batch_id` uuid FK ? batches.id
- PK: (`teacher_id`, `batch_id`)

### notes
- `id` uuid PK
- `batch_id` uuid FK ? batches.id
- `title` text
- `file_url` text
- `created_at` timestamptz

### tests
- `id` uuid PK
- `batch_id` uuid FK ? batches.id
- `title` text
- `type` text enum: `test_series|dpp`
- `scheduled_at` timestamptz
- `duration_minutes` int
- `total_marks` int

### test_attempts
- `id` uuid PK
- `test_id` uuid FK ? tests.id
- `student_id` uuid FK ? students.user_id
- `score` int
- `submitted_at` timestamptz
- `status` text enum: `started|submitted`

### notifications
- `id` uuid PK
- `user_id` uuid FK ? users.id
- `type` text enum: `announcement|info|warning`
- `title` text
- `message` text
- `icon` text
- `read` boolean
- `created_at` timestamptz

### ratings
- `id` uuid PK
- `student_id` uuid FK ? students.user_id
- `attendance` int
- `assignments` int
- `tests` int
- `participation` int
- `behavior` int
- `engagement` int
- `updated_at` timestamptz

## Notes
- SQL source: `backend/migrations/001_init.sql`.
- Sample data: `backend/migrations/002_seed.sql`.
