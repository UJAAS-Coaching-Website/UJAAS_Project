# UJAAS Page Functionality Test Reference

## 1. Purpose
- QA-facing page and control inventory for the current UJAAS implementation.
- Each section lists entry condition, visible controls, expected behavior, persistence type, and core checks.
- Persistence tags:
  - `backend-backed`
  - `localStorage-backed`
  - `mock/demo-only`
  - `mixed`

## 1.1 Latest Verified Branch Changes
- Student submitted-attempt review for tests and DPPs now uses explicit review states for MCQ, MSQ, and Numerical questions.
  - QA should verify `Right Answer`, `Wrong`, `Wrong Answer`, and `Unattempted` labeling behavior.
- Explanations inside submitted-attempt review are now hidden by default and fetched only when the user opens them for a specific question.
- Numerical-answer attempt fields now accept input only from the on-screen numeric keypad in student attempt mode.
- Test and DPP creation forms now start with editable default instruction templates.
- Student test overview no longer shows generic fallback instructions.
  - Only authored instructions should render.
- Inactive batches are read-only/no-action in admin and faculty UI.
- Inactive admin batches now show a `Delete Permanently` flow with destructive confirmation.
- Question bank is now backend-backed for faculty and students, including real upload, listing, search, sort, download, and faculty delete-from-batch behavior.
- Notes upload and question bank upload now surface clearer validation causes for bad format, oversize files, and invalid upload shape.
- Shared image upload route now returns clearer backend validation errors for invalid format and oversize submissions.
- Admin batch management now uses backend-confirmed updates (no optimistic batch UI changes).
- Admin batch subject assignment now uses a database-backed subject catalog with a type-to-create flow.
- Batch subjects can be added without assigning any faculty.
- Redundant batch-level "Assign Faculty" action is removed from the admin batch dashboard.
- Landing page images are now stored in Supabase S3 (`landing-page` bucket) instead of Base64 in the database.
  - Upload/delete handled through `/api/upload` with `context=landing`.
  - `AdminDashboard` uses `uploadLandingImage` / `deleteLandingImage` API functions.
- Landing page data schema normalized from a single JSON blob table into four relational tables: `landing_courses`, `landing_faculty`, `landing_achievers`, `landing_visions`.
  - Old `landing_page_data` and `landing_contact` tables dropped.
  - Ordering uses `created_at ASC` (no manual display_order).
- Landing page courses now return `{id, name}` objects from the API.
  - Frontend components (`GetStarted.tsx`, `AdminDashboard.tsx`, `App.tsx`) use course objects.
- Prospect query form course dropdown now uses `course.id` as the submitted value (FK to `landing_courses`) instead of plain text.
  - `prospect_queries.course` column replaced by `prospect_queries.course_id` (UUID FK).
  - Backend JOINs `landing_courses` to resolve course name for admin display.
- Change-password flow is now backend-backed for student, faculty, and admin.
  - Current password is verified first; new/confirm inputs appear only after verification.
- Student profile performance uses real subject ratings only (assigned subjects).
- Admin/faculty student detail test performance summary uses real test analysis per batch.
- User profile and avatar functionality is now fully backend-backed for all roles.
  - Avatars are compressed and resized to 400x400 (WebP, <50kb) using `sharp` in the backend.
  - Avatar storage uses the `avatar` S3 bucket in Supabase.
  - All profile details (Roll Number, Phone, DOB, Address, Parent Contact, Admin Remarks) are now fully fetched from the database for students, faculty, and admins.
  - Dashboard navigation and welcome cards use the `MiniAvatar` component.
  - Profile pages use the `EditableAvatar` component with a floating camera upload button.
- Student Timetable is now fully backend-backed.
  - Admin can upload/delete timetable images per batch (Supabase S3 `timetables` bucket).
  - Student dashboard fetches and displays the real batch timetable.
- Admin Remarks for students are now fully persisted in the `students.admin_remark` database column.
- DPP creation and publishing are now fully backend-backed through the `CreateDPP` component and `dppService.js`.
- Batch Notifications are now backend-backed for creation, though a dedicated fetch/read-tracking endpoint for students is still pending.

## 2. Public Pages

### 2.1 Get Started / Landing Page
- Entry condition: unauthenticated user.
- Visibility: public.
- Persistence: `mixed`.
- Main controls:
  - `Login` button in hero
  - vision carousel arrows and dots
  - achiever carousel arrows and dots
  - interest form:
    - full name
    - email address
    - phone number
    - course dropdown
    - optional message
  - `Submit Interest`
- Expected behavior:
  - login button opens login page
  - carousel controls rotate visible content
  - required form fields are enforced
  - successful submit shows alert and resets form
  - API failure may still create local fallback query state
- QA checks:
  - verify all public sections render without auth
  - verify required validation on name/email/phone/course
  - verify course dropdown is populated from `landing_courses` table (dynamic, not hardcoded)
  - verify form submits `courseId` (UUID) not course name text
  - verify carousel wrap behavior
  - verify empty-state handling when visions or achievers are missing

### 2.2 Login Page
- Entry condition: public login route or hero login action.
- Visibility: public.
- Persistence: `backend-backed`.
- Main controls:
  - login ID input
  - password input
  - `Sign In`
- Expected behavior:
  - submit sends credentials to backend
  - button shows in-flight state
  - failure shows inline error
  - success stores token and loads correct role dashboard
- QA checks:
  - verify invalid credentials do not redirect
  - verify admin/faculty/student all route correctly after login
  - verify logout clears protected access

## 3. Student Pages

### 3.1 Student Navigation Shell
- Entry condition: authenticated `student`.
- Visibility: student only.
- Persistence: `mixed`.
- Main controls:
  - logo button
  - nav tabs: `Dashboard`, `Test Series`, `Question Bank`
  - notification center
  - profile avatar button
- QA checks:
  - verify active styling follows current tab
  - verify navigation hides during fullscreen DPP/test flows

### 3.2 Student Home / Dashboard
- Entry condition: student on `home` or `batch-detail`.
- Visibility: student only.
- Persistence: `mixed`.
- Main controls:
  - performance card
  - `Time Table`
  - batch content subject cards
- Expected behavior:
  - performance card opens profile performance section
  - timetable opens modal with demo image
  - subject cards enter chapter view
- QA checks:
  - verify welcome card shows name, roll, and batch
  - verify DPP count is calculated from assigned-batch backend content and completed DPP attempts
  - verify no-batch state shows placeholder

### 3.3 Student Timetable Modal
- Entry condition: click `Time Table`.
- Visibility: student only.
- Persistence: `mock/demo-only`.
- Main controls:
  - close icon
  - `Download PDF`
  - `Close`
- QA checks:
  - verify modal closes from overlay and buttons
  - verify body scroll is disabled while open
  - verify download button is present but not backed by generated file behavior

### 3.4 Student Batch Content Tracker
- Entry condition: assigned-batch student on home page.
- Visibility: student only.
- Persistence: `mixed`.
- Main controls:
  - subject cards
  - chapter cards
  - content tabs: `Study Notes`, `Practice DPPs`
  - note download buttons
  - back arrow in nested levels
- Expected behavior:
  - subject opens chapter list
  - chapter opens notes tab by default
  - notes load from backend
  - DPP tab shows placeholder
- QA checks:
  - verify only batch subjects appear
  - verify chapter fetch depends on selected subject
  - verify notes empty state
  - verify DPP placeholder remains visible

### 3.5 Student Test Series List
- Entry condition: student opens `Test Series`.
- Visibility: student only.
- Persistence: `mixed`.
- Main controls:
  - open/start test controls
  - `View Results`
  - analytics/view attempt actions
- Expected behavior:
  - list is backend-filtered to student-visible tests
  - selecting a test loads overview
  - results button opens result history
- QA checks:
  - verify draft tests are hidden
  - verify tests outside student batch are hidden
  - verify loading states during overview/results fetch

### 3.6 Student Test Overview
- Entry condition: student selects a test.
- Visibility: student only.
- Persistence: `backend-backed`.
- Main controls:
  - `Back to List`
  - `Confirm & Start Test`
- Expected behavior:
  - breakdown table renders grouped question stats
  - instructions render only saved test-specific content
  - instructions appear above the question breakdown
  - start only succeeds when backend allows it
- QA checks:
  - verify counts and marking display match backend response
  - verify page opens at top when test overview is shown
  - verify not-live and max-attempt errors surface

### 3.7 Student Live Test Taking
- Entry condition: student confirms start or resumes active session.
- Visibility: student only.
- Persistence: `mixed`.
- Main controls:
  - question palette/status controls
  - answer controls
  - internal navigation controls
  - submit/exit path
- Expected behavior:
  - active session is cached in localStorage
  - progress save hits backend
  - unload triggers keepalive auto-submit
  - submit clears active session cache and opens analytics
  - numerical-answer questions accept input only from the on-screen numeric keypad
- QA checks:
  - verify timer or unload auto-submit path
  - verify session recovery after reload when attempt is still active
  - verify submit result matches chosen answers
  - verify physical keyboard input is blocked for numerical-answer questions

### 3.8 Student Analytics
- Entry condition: student submits test or opens prior attempt analytics.
- Visibility: student only.
- Persistence: `backend-backed`.
- Main controls:
  - attempt history selectors
  - close/back control
  - per-question `Show Explanation` / `Hide Explanation`
- QA checks:
  - verify switching attempts loads the selected result
  - verify close returns to list state
  - verify analytics opens from the top of the page
  - verify close during in-flight loading does not reopen analytics from a stale late response
  - verify explanation content is fetched only when the specific question is expanded

### 3.9 Student Result History
- Entry condition: student clicks `View Results`.
- Visibility: student only.
- Persistence: `backend-backed`.
- Main controls:
  - row action for detailed analytics
  - close/back control
- QA checks:
  - verify empty state when no attempts exist
  - verify list refreshes after completing a test

### 3.10 Student Profile
- Entry condition: student clicks avatar or navigates to profile.
- Visibility: student only.
- Persistence: `mixed`.
- Main controls:
  - section tabs: `Overview`, `Performance`, `Settings`
  - subject performance cards
  - subject detail modal close button
  - `Change Password`
  - `Logout`
  - logout confirm modal
  - change password modal
- Expected behavior:
  - overview shows backend user data
  - performance uses backend subject ratings only (no mock subjects)
  - logout works
  - change password verifies current password, then updates via backend
- QA checks:
  - verify profile refresh uses `/api/auth/me`
  - verify overall rating calculation
  - verify change password uses `/api/auth/change-password`

### 3.11 Student Question Bank
- Entry condition: student opens `Question Bank`.
- Visibility: student only.
- Persistence: `backend-backed`.
- Main controls:
  - subject cards
  - in-subject search input
  - sort dropdown
  - search input
  - download buttons
  - back button
- Expected behavior:
  - subjects are derived from files published to the student's assigned batch
  - opening a subject lists that subject's files only
  - search filters by file title
  - sort supports name, uploaded time, and difficulty ordering
- QA checks:
  - verify only assigned-batch content is visible
  - verify subject drilldown
  - verify empty state when nothing matches
  - verify clicking a card opens the file and download triggers a file download

## 4. Faculty Pages

### 4.1 Faculty Global Navigation
- Entry condition: authenticated `faculty`.
- Visibility: faculty only.
- Persistence: `mixed`.
- Main controls:
  - global section buttons: `Batches`, `Test Series`, `Question Bank`
  - batch-context tabs: `Dashboard`, `Batch Students`, `Question Bank`
  - profile avatar button
- QA checks:
  - verify question bank is reachable in both global and batch context
  - verify navigation mode changes when a batch is selected or cleared

### 4.2 Faculty Batch Selection
- Entry condition: faculty opens `Batches` with no selected batch.
- Visibility: faculty only.
- Persistence: `mixed`.
- Main controls:
  - batch selection cards/list
- Expected behavior:
  - choosing a batch enters batch context

### 4.3 Faculty Batch Dashboard
- Entry condition: faculty selects a batch and lands on `home`.
- Visibility: faculty only.
- Persistence: `mock/demo-only` plus `localStorage-backed`.
- Main controls:
  - timetable viewer
  - attendance open control
  - batch navigation controls
- Expected behavior:
  - dashboard uses mock student data and local attendance data
  - attendance modal stores updates in localStorage
- QA checks:
  - verify attendance persists after refresh
  - verify displayed student data remains consistent with mock dataset

### 4.4 Faculty Students Page
- Entry condition: faculty opens `students` within selected batch.
- Visibility: faculty only.
- Persistence: `mock/demo-only` plus `localStorage-backed`.
- Main controls:
  - view student button/modal
  - attendance edit mode toggle
  - save attendance action
- QA checks:
  - verify latest-month attendance save updates local state
  - verify student detail modal opens for selected row

### 4.5 Faculty Student Detail / Rating Modal
- Entry condition: faculty opens a student from student list.
- Visibility: faculty only.
- Persistence: `localStorage-backed`.
- Main controls:
  - profile/performance/rating subviews
  - edit subject rating buttons
  - save subject rating button
  - edit remark button
  - save remark button
  - close button
- Expected behavior:
  - faculty can edit only ratings/remarks tied to matching subject specialty
  - save actions persist to backend
- QA checks:
  - verify invalid rating values outside 0-5 are blocked
  - verify subject mismatch disables editing
  - verify remarks persist after refresh (backend)

### 4.6 Faculty Test Series Management
- Entry condition: faculty opens `Test Series`.
- Visibility: faculty only.
- Persistence: `mixed`.
- Main controls:
  - preview test
  - open analytics
  - create test path
- Expected behavior:
  - only tests tied to faculty-assigned batches are shown
  - preview opens fullscreen test preview editor
- QA checks:
  - verify draft tests are hidden
  - verify preview save routes through update handler
  - verify analytics open for selected test

### 4.7 Faculty Preview Test
- Entry condition: faculty opens a test preview.
- Visibility: faculty only.
- Persistence: `backend-backed` for updates, preview itself client-side.
- Main controls:
  - submit/exit path
  - editable question content with save
- QA checks:
  - verify edits propagate through test update handler
  - verify exit returns to test-series screen

### 4.8 Faculty Create Test
- Entry condition: faculty opens create-test UI.
- Visibility: faculty only.
- Persistence: `mixed`.
- Main controls:
  - same wizard controls as admin create-test
- Important QA note:
  - backend create endpoint is admin-only
- QA checks:
  - verify create is blocked or fails as expected depending on auth
  - verify update-only behavior if entered through preview/edit path

### 4.9 Faculty Notes Management
- Entry condition: faculty in batch context uses academic content tracker.
- Visibility: faculty only.
- Persistence: `mixed`.
- Main controls:
  - subject cards
  - chapter rows/cards
  - `Add Chapter`
  - chapter delete buttons
  - chapter-level `Upload Notes`
  - chapter-level `Create DPP`
  - note download/delete buttons
- Expected behavior:
  - chapter create/delete uses backend
  - note fetch/upload/delete uses backend
  - DPP tab remains placeholder
- QA checks:
  - verify subject access respects faculty subject when edit permissions apply
  - verify note delete removes item after API success
  - verify placeholder remains in DPP tab

### 4.10 Faculty Upload Notes Page
- Entry condition: faculty navigates from chapter view to upload notes.
- Visibility: faculty only.
- Persistence: `backend-backed`.
- Main controls:
  - back button
  - notes title input
  - file drop zone/input
  - selected file remove button
  - `Cancel`
  - `Upload Content`
- Expected behavior:
  - chapter context is restored from localStorage
  - upload requires title and file
  - success shows modal and returns back after delay
- QA checks:
  - verify chapter context restoration
  - verify single-file behavior
  - verify invalid format and oversize errors display the actual cause
  - verify progress and success modal
  - verify stored context keys are cleared after success

### 4.11 Faculty Create DPP
- Entry condition: faculty clicks `Create DPP`.
- Visibility: faculty only.
- Persistence: `mock/demo-only`.
- Main controls:
  - step navigation
  - DPP title
  - duration
  - instructions
  - question authoring form
  - question remove buttons
  - publish button
- QA checks:
  - verify step validation works locally
  - verify publish shows success modal only and creates no backend record

### 4.12 Faculty Question Bank
- Entry condition: faculty opens question bank.
- Visibility: faculty only.
- Persistence: `backend-backed`.
- Main controls:
  - `Add to Question Bank`
  - batch cards
  - back button inside batch
  - search input
  - sort dropdown
  - delete-from-batch action
  - add modal with:
    - title
    - difficulty buttons
    - target batch toggles
    - upload file input
    - `Cancel`
    - `Upload Content`
- Expected behavior:
  - upload stores the file in storage and metadata in DB
  - faculty sees only their mapped subject content
  - faculty sees only assigned batches
  - delete removes the file only from the selected batch unless it was the last linked batch
- QA checks:
  - verify at least one batch is required
  - verify supported file validation and 50MB limit messaging
  - verify added entries persist after refresh
  - verify delete from one batch does not remove the file from other published batches
  - verify clicking a card opens the file and download triggers a file download

### 4.13 Faculty Profile
- Entry condition: faculty clicks avatar.
- Visibility: faculty only.
- Persistence: `mixed`.
- Main controls:
  - section tabs: `Overview`, `Settings`
  - `Change Password`
  - `Logout`
- QA checks:
  - verify overview is populated from backend `me()`
  - verify logout works
  - verify change password verifies current password and updates via backend

## 5. Admin Pages

### 5.1 Admin Global Navigation
- Entry condition: authenticated `admin`.
- Visibility: admin only.
- Persistence: `mixed`.
- Main controls:
  - section buttons: `LPM`, `Batches`, `Students`, `Faculty`, `Test Series`, `Queries`
  - batch-context tabs: `Dashboard`, `Batch Students`
  - profile avatar button
- QA checks:
  - verify switching sections updates active styling
  - verify selected batch changes navigation mode

### 5.2 Admin Landing Page Management
- Entry condition: admin opens `LPM`.
- Visibility: admin only.
- Persistence: `backend-backed`.
- Main controls:
  - content edit inputs for courses, faculty, achievers, visions
  - image upload/change controls (stored in Supabase S3 `landing-page` bucket)
  - add/remove item controls
- Expected behavior:
  - save routes through landing update handler
  - backend uses normalized relational tables (`landing_courses`, `landing_faculty`, `landing_achievers`, `landing_visions`)
  - courses are `{id, name}` objects; admin can add by name (backend auto-generates ID)
  - image uploads go to S3 via `/api/upload` with `context=landing`; old images are cleaned up on replacement
  - ordering is based on `created_at` (first added = first shown)
- QA checks:
  - verify each content block can be edited and saved
  - verify content survives refresh (fully backend-persisted)
  - verify image upload/delete works against S3
  - verify courses show as `{id, name}` objects in API responses

### 5.3 Admin Batch Selection
- Entry condition: admin opens `Batches` without selected batch.
- Visibility: admin only.
- Persistence: `backend-backed`.
- Main controls:
  - batch cards/selectors
  - `Add Batch`
- Expected behavior:
  - selecting a batch enters batch context
  - add opens batch form modal

### 5.4 Admin Batch Form Modal
- Entry condition: admin clicks add/edit batch.
- Visibility: admin only.
- Persistence: `backend-backed`.
- Main controls:
  - batch name inputs
  - subject assignment controls (type-to-select with suggestions)
  - optional faculty assignment controls per subject
  - create/update/delete actions
  - cancel/close controls
- QA checks:
  - verify create, edit, and delete all persist through backend
  - verify subject/faculty assignments survive refresh
  - verify a subject can be added with no faculty assignment

### 5.5 Admin Batch Dashboard
- Entry condition: admin selects a batch and lands on `home`.
- Visibility: admin only.
- Persistence: `mixed`.
- Main controls:
  - edit batch for active batches
  - `Delete Permanently` for inactive batches
  - clear batch/back
  - view timetable
  - navigation into students/content
- QA checks:
  - verify clear batch returns to global context
  - verify summary updates after student/faculty assignment changes
  - verify inactive batches do not show operational action UI
  - verify permanent delete appears only for inactive batches
  - verify permanent delete confirmation flow completes and removes the batch from dependent views

### 5.6 Admin Student Directory
- Entry condition: admin opens global `Students`.
- Visibility: admin only.
- Persistence: `mixed`.
- Main controls:
  - `Add Student`
  - search/sort controls
  - row actions:
    - view student
    - edit student
    - delete student
- Expected behavior:
  - create/edit/delete use backend
  - view opens detailed modal
- QA checks:
  - verify create shows initial password alert
  - verify delete updates directory and batch counts
  - verify search and sort work

### 5.7 Admin Add/Edit Student Modal
- Entry condition: admin adds or edits student.
- Visibility: admin only.
- Persistence: `backend-backed`.
- Main controls:
  - name
  - roll number
  - batch
  - phone
  - date of birth
  - address
  - parent contact
  - save/cancel
- Expected behavior:
  - create uses student create endpoint
  - edit updates student and reassigns batch if changed
- QA checks:
  - verify required validation
  - verify batch reassignment removes prior batch link when appropriate

### 5.8 Admin Student Detail / Ratings Modal
- Entry condition: admin opens student from directory or batch students.
- Visibility: admin only.
- Persistence: `mixed`.
- Main controls:
  - `Print Details`
  - `Edit Details`
  - `Save Details`
  - `View Detailed Ratings`
  - `View Test Performance`
  - `Edit Admin Remark`
  - `Save Admin Remark`
  - `Reset Password`
  - `Close`
- Expected behavior:
  - detail edits update student backend record
  - admin remark persists in localStorage
  - test performance table loads from backend test analysis
  - reset password calls backend admin reset endpoint
  - print opens print preview behavior
- QA checks:
  - verify edited details survive refresh
  - verify admin remark persists on same browser
  - verify password reset is tracked as UI-only gap

### 5.9 Admin Batch Students Page
- Entry condition: admin selects batch and opens `students`.
- Visibility: admin only.
- Persistence: `backend-backed` for assignment, `mixed` for detail modal extras.
- Main controls:
  - `Add Student`
  - row actions:
    - view
    - edit
    - remove from batch
- QA checks:
  - verify remove action unassigns from current batch only
  - verify add in batch context assigns the correct batch

### 5.10 Admin Faculty Directory
- Entry condition: admin opens `Faculty`.
- Visibility: admin only.
- Persistence: `backend-backed`.
- Main controls:
  - `Add Faculty`
  - view faculty
  - edit faculty
  - delete faculty
- Expected behavior:
  - CRUD routes through faculty API
  - create shows generated initial password alert
- QA checks:
  - verify faculty records persist after refresh
  - verify delete confirmation flow

### 5.11 Admin Test Series Management
- Entry condition: admin opens `Test Series`.
- Visibility: admin only.
- Persistence: `backend-backed`.
- Main controls:
  - `Create Test Series`
  - preview test
  - resume draft
  - force live now
  - delete test
  - view insights
- Expected behavior:
  - admin sees drafts, upcoming, and live tests
  - force-live is restricted by backend rules
- QA checks:
  - verify draft tests are admin-only
  - verify delete removes test from list
  - verify invalid force-live attempts error correctly

### 5.12 Admin Create Test Series Wizard
- Entry condition: admin clicks create-test or resumes draft.
- Visibility: admin only.
- Persistence: `mixed`.
- Step 1 controls:
  - test name
  - format buttons
  - batch toggles
  - duration
  - total marks
  - schedule date/time
  - instructions
  - `Continue to Questions`
- Step 2 controls:
  - subject tabs/dropdown
  - section tabs for JEE Main
  - `Fill Demo Questions`
  - question authoring inputs:
    - type
    - marks/negative marks when enabled
    - question text
    - question image upload
    - options or numerical answer
    - correct answer selectors
    - explanation text/image
    - add/update question
    - cancel edit
  - question list row delete buttons
  - draft save/update button
  - `Review & Publish`
- Step 3 controls:
  - previous
  - draft save/update
  - `Publish Test Series`
- QA checks:
  - verify required validation in step 1
  - verify default editable instructions are prefilled for new tests
  - verify question thresholds by format:
    - JEE Main: 90
    - NEET: 180
    - Custom: 5
  - verify draft save and resume preserve data
  - verify previewed questions retain subject/section metadata
  - verify image upload/delete behavior

### 5.12.1 Admin Create DPP / Faculty Create DPP Instruction Check
- QA focus for current branch:
  - verify DPP instruction textarea opens with default editable instructions
  - verify saved DPP instructions appear for the student before starting when present
  - verify no generic fallback text appears if authored instructions are absent

### 5.13 Admin Preview Test
- Entry condition: admin opens preview from test list.
- Visibility: admin only.
- Persistence: `backend-backed`.
- Main controls:
  - submit/exit controls
  - editable question content with save
- QA checks:
  - verify save updates test questions/title/batches
  - verify exit returns to test-series screen

### 5.14 Admin Performance Insights
- Entry condition: admin opens insights for a test.
- Visibility: admin only.
- Persistence: `backend-backed`.
- Main controls:
  - close control
  - download/test-paper actions if surfaced inside insights view
- QA checks:
  - verify selected test analytics open correctly
  - verify empty-attempt or failed-analysis states are handled

### 5.15 Admin Notes and Academic Content
- Entry condition: admin in batch context uses academic content manager.
- Visibility: admin only.
- Persistence: `mixed`.
- Root-level controls:
  - `Time Table`
  - `Add Subject`
  - `Upload Notice`
  - subject delete buttons (single action handles remove-or-delete)
- Subject-level controls:
  - `Add Chapter`
  - chapter delete buttons
- Chapter-level controls:
  - content tabs: `Study Notes`, `Practice DPPs`
  - `Upload Notes`
  - `Create DPP`
  - note download/delete buttons
- Expected behavior:
  - add subject mutates batch subjects
  - delete subject removes from current batch or deletes globally if it is the last linked batch
  - delete is blocked if batch-scoped content exists
  - upload notice sends backend batch notification
  - chapters and notes use backend APIs
  - DPP tab remains placeholder
- QA checks:
  - verify subject add rejects duplicates
  - verify subject delete shows a blocking alert listing linked content
  - verify notice requires title and message
  - verify note delete removes the backend note

### 5.16 Admin Upload Notes Page
- Same checks as faculty upload notes page, with admin role.

### 5.17 Admin Create DPP
- Entry condition: admin clicks `Create DPP`.
- Visibility: admin only.
- Persistence: `mock/demo-only`.
- Main controls:
  - same three-step flow as faculty create DPP
- QA checks:
  - verify local step validation
  - verify publish is UI-only and does not create backend data

### 5.18 Admin Queries Management
- Entry condition: admin opens `Queries`.
- Visibility: admin only.
- Persistence: `backend-backed`.
- Main controls:
  - query row open/view action
  - status change controls
  - delete query action
  - query modal close
- Expected behavior:
  - list is fetched from backend with course name resolved via JOIN on `landing_courses`
  - each query shows resolved course name (from `course_id` FK), not raw text
  - status change syncs through backend patch
  - delete permanently removes from database
- QA checks:
  - verify status change persists after refresh
  - verify `new` -> `seen` transition happens automatically on open
  - verify course name displays correctly even if the source course was later renamed/deleted (shows "Unknown" when FK is NULL)
  - verify deleted query does NOT reappear after refresh

### 5.19 Admin Notice Upload Form
- Entry condition: admin opens notice upload from content manager or upload-notice route if surfaced.
- Visibility: admin only.
- Persistence: `backend-backed`.
- Main controls:
  - notice title
  - message content
  - `Send Notice`
  - `Cancel`
- QA checks:
  - verify send is blocked if title/message is missing
  - verify sending overlay appears during API call

### 5.20 Admin Profile
- Entry condition: admin clicks avatar.
- Visibility: admin only.
- Persistence: `mixed`.
- Main controls:
  - `Change Password`
  - `Logout`
  - logout confirm/cancel
  - old/new/confirm password fields in change-password modal
- QA checks:
  - verify profile identity is loaded from backend `me()`
  - verify logout clears session
  - verify change password verifies current password and updates via backend

## 6. Shared and Cross-Cutting QA Checks

### 6.1 Routing and State Recovery
- Verify direct URL navigation resolves to the correct role page after login.
- Verify role mismatch routes are corrected to canonical path.
- Verify student test subtabs restore list, overview, test, analytics, and results appropriately.

### 6.2 Persistence Classification Checks
- `backend-backed`
  - verify data persists after full refresh and fresh login.
- `localStorage-backed`
  - verify data persists only in the same browser profile.
  - verify data disappears if browser storage is cleared.
- `mock/demo-only`
  - verify UI works locally but do not raise backend defects for missing persistence.
- `mixed`
  - verify which sub-actions persist server-side versus local/browser-only.

### 6.3 Role and Permission Checks
- Verify student cannot access admin/faculty APIs.
- Verify faculty cannot use admin-only CRUD endpoints.
- Verify admin can access all admin UI surfaces.
- Verify non-admin users cannot see draft tests.

### 6.4 Upload Limits and Validation
- Verify note upload rejects missing file and missing title.
- Verify note upload shows the specific reason for invalid type, oversize file, or invalid multi-file submission.
- Verify image upload handles invalid metadata or oversize/type errors from backend.
- Verify question bank upload shows the specific reason for invalid type, oversize file, or invalid multi-file submission.
- Verify note upload accepts one file and enforces practical size expectations.

### 6.5 Known Test Notes
- Current code contains several UI-complete but backend-incomplete areas:
  - DPP creation/publishing
  - faculty attendance persistence (if not yet backend-backed)
- These should be logged as current implementation characteristics unless intended requirements explicitly say otherwise.
