# UJAAS Website Flow & Functionalities Reference for TestSprite

This document outlines the end-to-end flows, functionalities, and expected behaviors of the UJAAS Career Institute web application. It is structured by user role (Public, Student, Faculty, Admin) to serve as reference data for automated testing in TestSprite.

---

## 1. Public User Flow (Unauthenticated)

### 1.1 Landing / Get Started Page
- **Entry Condition**: Unauthenticated user visits the root `/get-started` route.
- **Key Sections**: Hero (Login button), Vision Carousel, Admissions/Courses, Faculty Showcase, Achievers Carousel, Interest Registration Form.
- **Actions**:
  - `Login` button redirects to the `/login` route.
  - Carousels (Visions, Achievers) support next/previous and dot navigation.
  - **Submit Interest Form**: Requires Full Name, Email, Phone, and Course (selected from dropdown). Submitting triggers a query creation via `POST /api/queries` and displays a success alert, resetting the form.

### 1.2 Login Page
- **Entry Condition**: User navigates to `/login`.
- **Inputs**: Login ID and Password.
- **Behaviors**:
  - Submitting sends credentials to `POST /api/auth/login`.
  - On failure: Displays an inline error message.
  - On success: Access token is stored in `localStorage` (`ujaasToken`), and the user is redirected to their respective role-based dashboard (Student, Faculty, or Admin).

---

## 2. Student Flow

### 2.1 Navigation & Global Controls
- **Tabs**: `Dashboard` (Home), `Test Series`, `Question Bank`.
- **Global Elements**: Notification Center, Profile Avatar button.

### 2.2 Student Dashboard (Home)
- **Content**: Welcome card (Name, Roll No, Batch), Performance/DPP completion stats, and assigned Batch Subjects.
- **Actions**:
  - **Performance Card**: Clicking navigates to the detailed profile performance section.
  - **Timetable**: Opens a modal displaying the batch timetable image (fetched from Supabase S3).
  - **Subject Cards**: Clicking a subject drills down into the associated Chapters for that subject.

### 2.3 Batch Content Tracker (Notes & DPPs)
- **Flow**: Dashboard Subject Card -> Chapter List -> Content Tabs (`Study Notes`, `Practice DPPs`).
- **Actions**:
  - Selecting a chapter loads its respective notes from the backend.
  - **Study Notes**: Users can view the note inline or click `Download` to retrieve the PDF file.
  - **DPPs**: Expected to load practice items (currently partially mock/placeholder).

### 2.4 Test Series
- **States**: List, Overview, Live Attempt, Analytics, Result History.
- **Flow**:
  1. **List**: Displays tests specifically assigned to the student's batch. Drafts are hidden.
  2. **Overview**: Selecting a test shows grouping breakdown and authored instructions. Requires backend validation before starting.
  3. **Live Attempt**: 
     - Answers are saved continuously (`progress` endpoint).
     - Numerical inputs are restricted to the on-screen numeric keypad.
     - Unload/disconnect triggers an auto-submit keepalive request.
     - Submitting finalizes the attempt and navigates to Analytics.
  4. **Analytics**: Post-submission view showing accurate labels (Right, Wrong, Unattempted). Explanations are fetched asynchronously only when the user expands a specific question.
  5. **Result History**: Lists all past attempts via `View Results`.

### 2.5 Question Bank
- **Flow**: Navigates to Question Bank -> Browses by Subject.
- **Actions**:
  - Shows content mapped to the student's assigned batches.
  - Supports searching files by title and sorting (by name, uploaded time, difficulty).
  - Cards can be clicked to open or downloaded directly.

### 2.6 Student Profile
- **Tabs**: `Overview`, `Performance`, `Settings`.
- **Actions**:
  - **Overview**: Fetches identity from `/api/auth/me`. Avatar can be uploaded/changed.
  - **Performance**: Calculates overall rating based on authentic subject ratings provided by faculty.
  - **Settings**: Change Password (verifies current password through backend before updating) and Logout flows.

---

## 3. Faculty Flow

### 3.1 Faculty Navigation Model
- **Non-Selected Batch Context**: `Batches` list, `Test Series`, `Question Bank`.
- **Selected Batch Context (Drill-down)**: `Dashboard`, `Batch Students`, `Question Bank` (filtered to batch).

### 3.2 Faculty Batch Dashboard & Students
- **Dashboard**: Displays timetable viewer and high-level mock student stats.
- **Students View**: 
  - Allows marking/saving attendance (latest month persists locally).
  - Clicking a student opens a detail modal containing profile, performance, and ratings.
- **Subject Ratings**: Faculty can **only** edit subject ratings and remarks that match their assigned subject specialty. Edits persist to the database.

### 3.3 Test Series Management
- **Visibility**: Faculty only sees tests mapped to batches they are assigned to.
- **Actions**:
  - **Preview**: Open a fullscreen preview editor to review/edit questions.
  - **Insights**: View test performance analytics.
  - *Note*: Faculty cannot create tests (create endpoint is Admin-only), but they can update existing ones.

### 3.4 Academic Content Management (Notes & Chapters)
- **Flow**: In batch context -> Select Subject -> View/Add/Delete Chapters -> Manage Notes.
- **Actions**:
  - **Upload Notes**: Faculty can add notes to a chapter (`/api/notes/upload`). Validates file type and size (limit 50MB).
  - **Create DPP**: UI-driven flow to assemble DPP questions (publishes to frontend state without a durable backend endpoint).

### 3.5 Faculty Question Bank
- **Actions**: 
  - Faculty can upload files specifically tagging difficulty and mapping them to multiple target batches.
  - File deletions only remove the file from the selected batch, unless it's the last linked batch.

### 3.6 Faculty Profile
- Works similar to the Student profile (Avatar upload, Overview stats, Change Password).

---

## 4. Admin Flow

### 4.1 Global Navigation
- **Sections**: `LPM` (Landing Page Management), `Batches`, `Students`, `Faculty`, `Test Series`, `Queries`.

### 4.2 Landing Page Management (LPM)
- **Functionality**: Manage public-facing website data dynamically.
- **Actions**:
  - Add/Update/Delete landing courses, faculty showcase, achievers, and visions.
  - Image uploads hit an S3 bucket (`landing-page` context); replacing images deletes the old bucket object.
  - All data is relationally stored and fetched dynamically on the public side.

### 4.3 Batch Management
- **Functionality**: Full CRUD on Batches.
- **Actions**:
  - **Create Default/Active**: Add a new batch with type-to-select subject mapping. Subjects can be added without assigning a faculty.
  - **Batch Dashboard**: Open a batch to assign/remove students and faculty.
  - **Permanently Delete**: Only available for batches marked as inactive.

### 4.4 User Directories (Students & Faculty)
- **Functionality**: Full CRUD operations on Users.
- **Actions**: 
  - Creating a user auto-generates an initial password displayed via alert.
  - **Student Details**: Admin can edit details, edit admin-specific remarks, and view actual test performance summaries per batch. Admin remark persists to `students.admin_remark` in db.
  - **Review System**: Admin can trigger a 3-day global "Faculty Review Session" which resets current faculty ratings and surfaces a sticky notification to students.

### 4.5 Test Series Administration
- **Visibility**: Complete access to Draft, Upcoming, and Live tests.
- **Actions**:
  - **Create Wizard**: 3-step authoring process (Setup -> Add Questions -> Publish).
    - Auto-saves as a Draft continuously.
    - Format constraints automatically track max questions (e.g., JEE Main = 90).
    - Instructions textarea prepopulates with default editable templates.
    - Questions support image uploads for question text, options, and explanations.
  - **Force Live**: Admin can force `upcoming` tests to become `live` immediately.
  - **Insights**: Full access to resulting analytics for all completed attempts.

### 4.6 Content & Academic Mapping
- Inside a specific Batch -> Subjects -> Chapters context:
  - Admin has blanket permissions to Add Subjects, Add Chapters, Upload Notes, Upload Batch Notices, and configure Timetable images.
  - Timetable images are uploaded to the `timetables` S3 bucket.

### 4.7 Query Management
- View prospect queries submitted from the public Landing page.
- Modify status and review contact details.

---

## 5. System Mechanisms for Testing
- **Persistence Types**: Tests should validate storage behavior correctly:
  - `backend-backed`: Validated against API success and DB/S3 state. (e.g., Landing configs, Test Series generation, Notes Upload)
  - `localStorage-backed` / Mock: Evaluated within browser sessions (e.g., Question Bank mock state in older iterations, UI mock data in Faculty views).
- **Error Handling Scenarios**:
  - File Uploads: 5MB limit for images, 50MB for notes. Invalid extensions should return specific error toasts.
  - Session Refresh: Automatically retries 401 Unauthorized API calls exactly once using the cookie-based refresh token.
  - Form validation: Name/Email/Phone/Course inputs aggressively block bad submissions.
