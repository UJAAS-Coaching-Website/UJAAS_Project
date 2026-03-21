# Product Specification - Faculty Portal

## 1. Purpose
Define functional and non-functional requirements for Faculty workflows in UJAAS, including batch-level operations, academic content management, student oversight, and constrained test management.

## 2. Scope
In scope:
- Faculty authentication and route authorization
- Batch context navigation and batch dashboard
- Student attendance, student detail modal, subject-specific ratings
- Notes/chapter management and DPP composition flow
- Faculty test series visibility, preview/edit, insights
- Faculty question bank upload and batch-link-aware deletion
- Faculty profile and security settings

Out of scope:
- Admin-only test creation and global management
- Student-only test attempt workflow

## 3. User Persona
- Primary user: Teaching faculty assigned to specific batches and subject specialties
- Goal: Manage instructional materials, monitor students, and update subject ratings within permitted boundaries

## 4. Entry Points and Navigation
- Login route: `/login`
- Post-login redirect: Faculty area
- Context model:
  - Non-selected batch: `Batches`, `Test Series`, `Question Bank`
  - Selected batch: `Dashboard`, `Batch Students`, `Question Bank` (batch-filtered)

## 5. Functional Requirements

### 5.1 Authentication and Access Control
- Faculty login must authenticate via shared auth endpoint and role mapping.
- Faculty must only access faculty-approved routes and operations.
- Batch/test/content data visibility must be limited to assigned batches.

### 5.2 Batch Dashboard and Students
- Dashboard must show timetable viewer and summary student stats.
- Attendance marking must be editable and savable from students view.
- Latest month attendance context should persist locally for UX continuity.
- Clicking a student must open detail modal with profile, performance, and ratings.

### 5.3 Subject Ratings and Remarks
- Faculty can edit only ratings/remarks for their assigned subject specialty.
- Attempts to edit unauthorized subject fields must be blocked.
- Authorized rating updates must persist to backend and reflect after refresh.

### 5.4 Test Series (Faculty Capabilities)
- Faculty sees tests mapped to their assigned batches only.
- Faculty can open preview/editor for existing tests.
- Faculty can access insights analytics for accessible tests.
- Faculty cannot create new tests; create endpoints/actions must be unavailable.

### 5.5 Academic Content Management
- In batch subject context, faculty can:
  - add/delete chapters
  - upload notes through `/api/notes/upload`
  - initiate DPP creation flow in UI state
- Notes upload must validate type and max size (50MB).
- Upload success/failure states must be clearly communicated.

### 5.6 Faculty Question Bank
- Faculty can upload files with metadata including difficulty and target batches.
- Delete behavior must unlink file from selected batch only when multi-linked.
- If selected batch is last linked batch, delete may remove file fully.

### 5.7 Faculty Profile and Settings
- Faculty profile supports overview and avatar upload.
- Password change requires current password validation.
- Logout must clear session and redirect appropriately.

## 6. Data and Integrations
- Auth endpoints and role-based identity APIs
- Batch and student APIs for attendance/ratings
- Notes and question bank upload APIs
- Test analytics and test update APIs (non-create access)
- Object storage for uploaded files/assets

## 7. Validation and Error Handling
- Unauthorized route/action attempts must return guarded UI state.
- Oversized or invalid-file uploads must show explicit validation messages.
- Ratings save failures must be retriable with clear user feedback.
- Partial backend failures should preserve form state where possible.

## 8. Non-Functional Requirements
- Security: strict subject-level permission enforcement for rating edits.
- Reliability: no silent data loss for attendance and ratings updates.
- Performance: batch dashboards should load acceptably under normal class sizes.
- Usability: key teaching actions should be reachable within batch context quickly.

## 9. Acceptance Criteria
- Faculty logs in and sees only assigned batch/test data.
- Faculty can mark attendance and save it successfully.
- Faculty can edit authorized subject ratings; unauthorized edits are blocked.
- Faculty can upload notes with valid files and receive errors for invalid files.
- Faculty can preview/edit allowed tests and view insights.
- Faculty question bank batch-link delete behavior matches expected logic.

## 10. Test Coverage Priorities
- P0: Permission boundaries, attendance save, ratings restrictions
- P1: Notes upload validation and recovery from failures
- P2: Question bank multi-batch unlink behavior, profile edge cases

