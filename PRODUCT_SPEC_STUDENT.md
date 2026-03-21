# Product Specification - Student Portal

## 1. Purpose
Define functional and non-functional requirements for the Student experience in the UJAAS web platform, covering learning access, assessments, progress tracking, and profile management.

## 2. Scope
In scope:
- Student authentication and role-based dashboard access
- Student dashboard, subject/chapter drill-down, notes and DPP access
- Test Series lifecycle (list, overview, attempt, analytics, history)
- Question Bank browse/search/sort/download
- Student profile, performance, settings, avatar, password change, logout

Out of scope:
- Admin-only creation workflows
- Faculty-only batch management workflows

## 3. User Persona
- Primary user: Enrolled student assigned to one or more batches
- Goal: Consume assigned academic material, take tests, review performance, and manage profile credentials

## 4. Entry Points and Navigation
- Login route: `/login`
- Redirect after successful auth: student dashboard
- Primary tabs: `Dashboard`, `Test Series`, `Question Bank`
- Global controls: notifications, profile avatar menu

## 5. Functional Requirements

### 5.1 Authentication and Session
- Student logs in using Login ID and Password via `POST /api/auth/login`.
- On success, access token is stored in `localStorage` key `ujaasToken`.
- User must be redirected to Student dashboard only (role-restricted routing).
- On invalid credentials, inline error message must be shown.
- On `401` during API usage, client should trigger a single refresh retry strategy.

### 5.2 Student Dashboard
- System must display student identity snapshot (name, roll no, batch).
- System must display performance and DPP completion cards.
- Subject cards must open chapter-level content for that subject.
- Timetable must open in a modal with batch timetable image.
- Performance card click must navigate to profile performance section.

### 5.3 Batch Content Tracker (Notes and DPP)
- Subject selection must reveal chapter list for assigned batch.
- Chapter selection must expose content tabs: `Study Notes`, `Practice DPPs`.
- Notes must support inline view and file download.
- DPP area must render available practice data (or explicit empty state).

### 5.4 Test Series
- List view must show only tests assigned to student batch (draft hidden).
- Overview must show test grouping and instructions before start.
- Attempt session must:
  - save progress continuously through progress endpoint
  - restrict numerical answers via numeric keypad for configured questions
  - auto-submit/keepalive on unload/disconnect where applicable
- Final submission must lock attempt and open analytics.
- Analytics must display right/wrong/unattempted labels accurately.
- Explanations should load lazily when expanded.
- Result history must list previous attempts and allow detail view.

### 5.5 Question Bank
- Student can browse by assigned subject context.
- Search by title and sorting (name, upload time, difficulty) must be supported.
- File card must support open and download actions.

### 5.6 Profile and Settings
- Overview must fetch profile data via `/api/auth/me`.
- Avatar upload/update must persist and reflect in UI.
- Performance view must render faculty-provided ratings correctly.
- Settings must support change password with current-password validation.
- Logout must terminate session and redirect to login/get-started.

## 6. Data and Integrations
- Auth API: `POST /api/auth/login`, `/api/auth/me`, refresh flow
- Academic APIs: notes/chapter/batch/subject mappings
- Test APIs: assigned tests, progress save, submit, analytics, history
- Storage:
  - Browser: `localStorage` token
  - Backend DB and object storage for notes/timetables/assets

## 7. Validation and Error Handling
- Unauthorized state must trigger controlled retry once, then force re-auth.
- Missing assigned content must show empty-state messaging, not silent fail.
- Download/view failures must show actionable error toast/message.
- Password change failures must show clear reason (invalid current, policy fail).

## 8. Non-Functional Requirements
- Role isolation: Student cannot access Faculty/Admin routes or actions.
- Performance: Dashboard and test views should remain responsive on moderate network latency.
- Reliability: In-test progress persistence should minimize data loss risk.
- Usability: Key actions (start test, submit, download notes) should be discoverable within 1-2 interactions.

## 9. Acceptance Criteria
- Student can login and reach dashboard with correct role gating.
- Student can open subject -> chapter -> notes and download successfully.
- Student can start, progress-save, submit a test, and view analytics/history.
- Student can search/sort question bank and open/download files.
- Student can update avatar, change password, and logout successfully.

## 10. Test Coverage Priorities
- P0: Login/role redirect, test attempt+submission integrity, profile password change
- P1: Notes and timetable retrieval, question bank filtering/sorting
- P2: Notification UX, edge-case empty states, slower-network behavior

