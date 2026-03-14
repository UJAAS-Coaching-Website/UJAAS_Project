# Proposed Database Schema for UJAAS

Based on the full feature set implemented in the frontend, the following database schema is proposed to replace the current minimal setup. This design ensures data integrity, supports complex test structures, dynamic landing page content, and granular student analytics.

---

## 1. Core Authentication & User Management

### `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier |
| `login_id` | TEXT | UNIQUE, NOT NULL | email for staff, roll_number for students |
| `password_hash` | TEXT | NOT NULL | Argon2 or BCrypt hash |
| `role` | ENUM | 'student', 'faculty', 'admin' | User role |
| `name` | TEXT | NOT NULL | Full name |
| `avatar_url` | TEXT | | Profile picture link |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

### `students`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | PRIMARY KEY, REFERENCES users(id) | |
| `roll_number` | TEXT | UNIQUE, NOT NULL | |
| `phone` | TEXT | | Student's primary phone |
| `address` | TEXT | | Permanent/Current address |
| `dob` | DATE | | Date of birth |
| `parent_contact` | TEXT | | Parent's phone/email |
| `join_date` | DATE | DEFAULT CURRENT_DATE | |
| `assigned_batch_id` | UUID | REFERENCES batches(id) | Single assigned batch for the student |
| `admin_remark` | TEXT | | Private remark by admin |

### `faculties`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | PRIMARY KEY, REFERENCES users(id) | |
| `phone` | TEXT | | |
| `subject`| TEXT | | e.g., 'Physics' |
| `designation` | TEXT | | e.g., 'Senior HOD' |
| `experience` | TEXT | | e.g., '15+ Years' |
| `bio` | TEXT | | Brief biography |

---

## 2. Academic Structure

### `batches`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `name` | TEXT | NOT NULL | e.g., '11th JEE' |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-friendly name |
| `subjects` | TEXT[] | | Array of subjects (Physics, etc.) |
| `is_active` | BOOLEAN | DEFAULT TRUE | |

### `faculty_batches`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `faculty_id` | UUID | REFERENCES faculties(user_id) | |
| `batch_id` | UUID | REFERENCES batches(id) | |
| PRIMARY KEY | | (faculty_id, batch_id) | |

---

## 3. Test & Exam Engine (Complex Structure)

### `tests`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `title` | TEXT | NOT NULL | |
| `format` | ENUM | 'JEE MAIN', 'NEET', 'Custom' | Pattern type |
| `duration_mins`| INTEGER | NOT NULL | |
| `total_marks` | INTEGER | NOT NULL | |
| `instructions` | TEXT | | Markdown or raw text |
| `scheduled_at` | TIMESTAMPTZ | | |
| `status` | ENUM | 'upcoming', 'live', 'completed'| |
| `created_by` | UUID | REFERENCES users(id) | |

### `test_target_batches`
- Maps tests to one or more batches.
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `test_id` | UUID | REFERENCES tests(id) |
| `batch_id` | UUID | REFERENCES batches(id) |

### `questions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `test_id` | UUID | REFERENCES tests(id) | |
| `subject` | TEXT | NOT NULL | e.g., 'Physics' |
| `section` | TEXT | | e.g., 'Section A' |
| `type` | ENUM | 'MCQ' ,'MSQ' , 'Numerical' | |
| `question_text`| TEXT | | Supports LaTeX/Markdown |
| `question_img` | TEXT | | URL to asset storage |
| `options` | JSONB | | Array of strings for MCQ |
| `option_imgs` | JSONB | | Array of URLs for options |
| `correct_ans` | TEXT | NOT NULL | Index for MCQ, Value for Numerical |
| `marks` | INTEGER | DEFAULT 4 | |
| `neg_marks` | INTEGER | DEFAULT 1 | |
| `explanation` | TEXT | | Solution text |
| `explanation_img`| TEXT | | Solution asset |
| `order_index` | INTEGER | | Sort order in test |

### `test_attempts`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `test_id` | UUID | REFERENCES tests(id) | |
| `student_id` | UUID | REFERENCES students(user_id) | |
| `score` | INTEGER | | Final calculated score |
| `time_spent` | INTEGER | | In seconds |
| `answers` | JSONB | | {q_id: answer_val} map |
| `submitted_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

## 4. Content & Communications

### `notes`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `batch_id` | UUID | REFERENCES batches(id) | |
| `title` | TEXT | NOT NULL | |
| `file_url` | TEXT | NOT NULL | Cloud storage link |
| `subject` | TEXT | | |
| `chapter` | TEXT | | |
| `created_at` | TIMESTAMPTZ | | |

### `notifications`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `user_id` | UUID | REFERENCES users(id) | NULL if broadcast |
| `batch_id` | UUID | REFERENCES batches(id) | NULL if individual |
| `type` | ENUM | 'announcement', 'info', 'warning'| |
| `title` | TEXT | NOT NULL | |
| `message` | TEXT | NOT NULL | |
| `is_read` | BOOLEAN | DEFAULT FALSE | |
| `created_at` | TIMESTAMPTZ | | |

---

## 5. Performance Tracking (Student Analytics)

### `student_ratings`
- Periodic snapshot of student engagement.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `student_id` | UUID | REFERENCES students(user_id) | |
| `subject` | TEXT | | Specific rating per subject |
| `attendance` | NUMERIC | CHECK(0-5) | |
| `assignments` | NUMERIC | CHECK(0-5) | |
| `participation`| NUMERIC | CHECK(0-5) | |
| `behavior` | NUMERIC | CHECK(0-5) | |
| `updated_at` | TIMESTAMPTZ | | |

---

## 6. Public Landing Page & Queries

### `landing_page_data`
- Stores the dynamic configuration for the public site.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `section_key` | TEXT | UNIQUE, NOT NULL | 'hero', 'faculty', 'achievers', 'visions', etc. |
| `content` | JSONB | NOT NULL | The detailed elements (see example below) |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

#### **Example `content` structure for 'faculty' section:**
```json
[
  {
    "name": "Dr. Rajesh Kumar",
    "subject": "Physics",
    "designation": "Head of Department",
    "experience": "15+ Years",
    "image": "https://storage.ujaas.com/faculty/rajesh.jpg"
  }
]
```
#### **Example `content` structure for 'visions' section:**
```json
[
  {
    "name": "Shri G.S. Sharma",
    "designation": "Founder & Director",
    "vision": "Our vision is to provide quality education...",
    "image": "https://storage.ujaas.com/visions/founder.jpg"
  }
]
```

### `prospect_queries`
- Managed queries from the "Get Started" page.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `name` | TEXT | NOT NULL | |
| `email` | TEXT | | |
| `phone` | TEXT | NOT NULL | |
| `course` | TEXT | | Course they are interested in |
| `message` | TEXT | | |
| `status` | ENUM | 'new', 'contacted', 'completed'| |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

## Summary of Relationships
1. **User Role Specialization:** `users` table linked 1:1 with `students` and `faculties`.
2. **Batch Assignment Model:** Each student belongs to at most one batch through `students.assigned_batch_id`, while faculty can belong to multiple batches through `faculty_batches`.
3. **Complex Tests:** A `test` has many `questions`. A `test` can target multiple `batches`.
4. **Rich Metadata:** `questions` store JSONB for options and image URLs, mirroring the frontend state.
5. **Analytics:** `test_attempts` stores detailed student answers for per-question analysis.
