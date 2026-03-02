# Codebase Notes (Auto-maintained)

## Project Overview
**UJAAS** is a comprehensive coaching management system designed to streamline educational operations. It provides distinct interfaces for **Students**, **Faculty**, and **Administrators**, covering aspects like test series, daily practice problems (DPP), student analytics, batch management, and a customizable public landing page.

## Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Motion (framer-motion).
- **Backend:** Node.js, Express, PostgreSQL, `pg` (Postgres driver).
- **Styling:** Custom theme using Teal and Cyan palettes, integrated with Radix UI primitives via shadcn/ui.

## Frontend Architecture (`frontend/`)

### Core Structure
- **Entry Point:** `src/main.tsx` -> `src/App.tsx`.
- **State Management:** `App.tsx` serves as the central hub, managing user sessions, landing page data, published tests, and global notifications. It utilizes `localStorage` for cross-session persistence.
- **Routing:** A custom routing system based on `window.history` and `popstate` events is implemented in `App.tsx`, supporting nested paths like `/student/test-series` or `/admin/11th-jee/home`.
- **Persistence Keys:**
  - `ujaasToken`: JWT authentication token.
  - `ujaasUser`: Current session user data.
  - `ujaasLandingData`: Public landing page configuration (courses, faculty, achievers, visions).
  - `ujaasPublishedTests`: Store for created tests and DPPs.
  - `ujaasAdminBatches`: Batch definitions and assignments.
  - `ujaasQueries`: User queries from the "Get Started" landing page.

### Features by Role

#### 1. Students
- **Dashboard:** Overview of announcements, upcoming tests, and performance stats.
- **Test Series:** Interface to browse, view instructions, and take scheduled tests.
- **DPP Section:** Daily Practice Problems sorted by subject.
- **Analytics:** Visual performance insights using Recharts.
- **Question Bank:** Categorized questions for self-practice.
- **Profile:** Management of personal details and view of student ratings (attendance, assignments, etc.).

#### 2. Faculty
- **Batch Management:** Overview of assigned batches, students, and schedules.
- **Content Upload:** Tooling for uploading notes, DPPs, and notices.
- **Analytics:** View test performance across batches and individual student progress.
- **Test Management:** Ability to preview and manage published tests.
- **Rankings:** View batch-wise student rankings based on performance.

#### 3. Administrators
- **Full System Control:** Access to all faculty and student dashboards.
- **Landing Page Editor:** Dynamic customization of the public "Get Started" page sections.
- **Batch CRUD:** Create, update, and delete batches and assign faculty.
- **Test Creation:** Advanced form for creating tests with multiple sections, marking schemes, and question uploads.
- **Query Management:** Review and respond to prospective student queries.
- **Student Ratings:** Update behavioral and academic ratings for students.

## Backend Architecture (`backend/`)

### Database Schema (PostgreSQL)
- **`users`:** Core auth table using `login_id` (email for staff, roll_number for students) and `password_hash`.
- **`students`:** Detailed profile for students (roll_number, parent_contact, address, etc.).
- **`faculties`:** Detailed profile for faculty (subject_specialty, phone).
- **`batches`:** Groups of students (e.g., "11th JEE").
- **`student_batches` / `faculty_batches`:** Join tables for role-to-batch assignment.
- **`tests`:** Metadata for tests and DPPs.
- **`test_attempts`:** Tracks student scores and submission status.
- **`notes`:** Shared files/links for study material.
- **`notifications`:** User-specific alerts (announcements, info, warnings).
- **`ratings`:** Multi-metric student evaluation (attendance, behavior, etc.).

### API Design (`backend/src/`)
- **Authentication:** JWT-based with refresh token logic. Routes include `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh`.
- **Profile:** `/api/profile/me` for user-driven updates.
- **Migrations:** Automated via `backend/scripts/migrate.js` using versioned SQL files in `backend/migrations/`.

## Key UI Components
- **`TestTaking.tsx`:** A complex, full-screen testing interface with timers, question navigation, and auto-submission.
- **`AdminDashboard.tsx`:** A multi-layered dashboard using a sidebar/tabs pattern for granular control.
- **`NotificationCenter.tsx`:** Interactive notification tray with read/delete functionality.
- **`StudentRankingsEnhanced.tsx`:** Tabular view of student performance with filtering.

## Update Log
- 2026-03-02: Completed frontend UI and logic. Updated documentation with full project architecture, role features, and database schema details.
- 2026-02-24: Initial structure snapshot and backend scaffold. Added Postgres health checks and migration scripts.
