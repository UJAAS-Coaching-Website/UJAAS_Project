# UJAAS Website SRS

## 1. Purpose
- Current-state software requirements and behavior specification for the UJAAS website and web application.
- Scope includes public pages, role-based dashboards, backend APIs, persistence behavior, and known implementation gaps.
- This document describes the codebase as implemented, not an ideal future target.

## 2. Product Summary
- Product: `UJAAS Career Institute` / `UJAAS`.
- Type: single-page web application with role-based dashboards and an Express/PostgreSQL backend.
- Frontend: React 18, TypeScript, Vite, Motion, utility-first styling, Radix-based primitives.
- Backend: Node.js, Express, PostgreSQL, JWT auth, multer-based uploads, S3-style storage integration.
- Roles:
  - `Public visitor`
  - `Student`
  - `Faculty`
  - `Admin`

## 3. System Goals
- Present institute information and admission capture to public visitors.
- Authenticate students, faculty, and administrators into role-specific workspaces.
- Support batch, student, faculty, test, note, and landing-page management.
- Support student test-taking, result review, and content access.

## 4. Architecture Overview

### 4.1 Frontend
- Main entry: `frontend/src/main.tsx`.
- Orchestrator: `frontend/src/App.tsx`.
- Routing: custom `window.history` and path parsing, not React Router.
- Global state in `App.tsx`:
  - authenticated user
  - active tab, section, and batch
  - landing data
  - batches
  - students
  - faculties
  - published tests
  - notifications
  - public queries

### 4.2 Backend
- Main app: `backend/src/app.js`.
- Mounted API groups:
  - `/api/auth`
  - `/api/profile`
  - `/api/landing`
  - `/api/queries`
  - `/api/batches`
  - `/api/faculties`
  - `/api/students`
  - `/api/tests`
  - `/api/chapters`
  - `/api/notes`
  - `/api/upload`
- Health endpoint: `/`.

### 4.3 Persistence Labels Used In This SRS
- `backend-backed`: persisted through API into database or storage.
- `localStorage-backed`: stored in browser storage only.
- `mock/demo-only`: UI flow exists but is driven by hardcoded or simulated data.
- `mixed`: uses backend for some parts and local or mock storage for others.

## 5. Roles and Access Rules

### 5.1 Public Visitor
- Can view landing/get-started page.
- Can submit an admission-interest query.
- Cannot access protected dashboards or APIs.

### 5.2 Student
- Can access:
  - dashboard/home
  - batch academic content tracker
  - test series, overview, live attempt, analytics, result history
  - profile
  - question bank
- Protected student API usage:
  - `/api/auth/me`
  - `/api/profile/me`
  - student test-attempt endpoints
  - authenticated read endpoints for batches, chapters, notes, and tests

### 5.3 Faculty
- Can access:
  - batch selection and selected-batch dashboard
  - students view for selected batch
  - test series list and preview
  - notes/content manager
  - upload notes page
  - create DPP page
  - question bank
  - profile
- Can manage chapters, notes, and uploaded images.
- Cannot use admin-only CRUD endpoints for students, faculty, landing management, or query management.

### 5.4 Admin
- Can access:
  - landing management
  - batch CRUD and assignments
  - student CRUD and batch assignment
  - faculty CRUD and batch assignment
  - test creation, draft save, publish, preview, force-live, delete
  - content and note management
  - query management
  - notice upload
  - profile

## 6. Functional Specification

### 6.1 Public Website

#### 6.1.1 Landing / Get Started
- Entry condition: unauthenticated default app state.
- Main sections:
  - hero with institute branding
  - vision carousel
  - admissions/course cards
  - faculty showcase
  - achievers carousel
  - interest registration form
- Backing type: `mixed`
  - display content: backend-backed but initialized and merged with local defaults/localStorage
  - query submission: backend-backed with local fallback when API fails
- Behaviors:
  - `Login` button switches to login view.
  - vision cards support previous/next and dot navigation.
  - achievers section supports carousel navigation when more than 3 achievers exist.
  - interest form requires name, email, phone, and course.
  - submit triggers query creation, success alert, and form reset.

#### 6.1.2 Public Query Submission
- Endpoint: `POST /api/queries`.
- Fields: name, email, phone, course, optional message.
- Behavior:
  - backend create on success
  - local fallback query insert in frontend state on API failure
- Backing type: `mixed`.

### 6.2 Authentication and Session Management

#### 6.2.1 Login
- UI fields:
  - login ID
  - password
  - sign-in button
- Endpoint: `POST /api/auth/login`.
- Validation: both fields required in browser and backend.
- Success behavior:
  - access token returned in body
  - access token stored in `localStorage` as `ujaasToken`
  - backend also sets cookies during token issuing flow
  - app loads correct role dashboard
- Failure behavior: inline error box.
- Backing type: `backend-backed`.

#### 6.2.2 Session Refresh
- Endpoint: `POST /api/auth/refresh`.
- Trigger model:
  - frontend retries unauthorized requests once after refresh
  - refresh token is cookie-based
- Backend behavior:
  - rotates refresh token family
  - revokes invalid/expired family
  - returns new access token
- Backing type: `backend-backed`.

#### 6.2.3 Current User Fetch
- Endpoint: `GET /api/auth/me`.
- Used during app bootstrap and profile refresh.
- Returns role-specific embedded details such as `studentDetails` and `facultyDetails`.

#### 6.2.4 Logout
- Endpoint: `POST /api/auth/logout`.
- Behavior:
  - clears frontend token from localStorage
  - revokes or blacklists active tokens best-effort
  - clears auth cookies
  - returns user to get-started page
- Backing type: `backend-backed`.

### 6.3 Student Area

#### 6.3.1 Student Dashboard Home
- Tabs:
  - `home`
  - `test-series`
  - `profile`
  - `question-bank`
- `batch-detail` routes to the same home content.
- Content:
  - welcome card with name, email, roll number, batch
  - DPP completed stat
  - performance rating stat
  - batch content area
  - timetable modal
- Backing type: `mixed`
  - profile identity from backend
  - DPP attempts from localStorage
  - batch content from backend batches, chapters, and notes
  - timetable uses static demo asset

#### 6.3.2 Student Batch Academic Content
- Implemented through `NotesManagementTab` in read-only student mode.
- Flow:
  - fetch assigned batch details from `/api/batches`
  - show subject list
  - open chapter list
  - open notes or DPP tab
  - fetch notes from backend
  - show DPP placeholder
- Backing type: `mixed`
  - chapters and notes: backend-backed
  - DPP list: placeholder/mock

#### 6.3.3 Student Test Series
- Implemented through `TestSeriesContainer`.
- States:
  - list
  - overview
  - taking
  - analytics
  - results history
- Behaviors:
  - student-visible tests come from backend-filtered `/api/tests`
  - overview loads full test detail
  - start attempt calls `/api/tests/:id/attempts/start`
  - progress save calls `/api/tests/attempts/:attemptId/progress`
  - submit calls `/api/tests/attempts/:attemptId/submit`
  - analytics loads `/api/tests/attempts/:attemptId/result`
  - results list loads `/api/tests/attempts/mine`
  - active session pointer is cached in localStorage
  - browser unload triggers keepalive auto-submit request
- Backend rules observed:
  - only `live` tests can be started
  - attempt limit is enforced server-side
- Backing type: `mixed`
  - authoritative attempt state: backend-backed
  - resume pointers: localStorage-backed

#### 6.3.4 Student Profile
- Sections:
  - overview
  - performance
  - settings
- Overview shows roll number, batch, join date, phone, date of birth, address, and parent contact.
- Performance:
  - calculates overall rating from ratings data
  - displays subject cards and detail modal
  - uses generated fallback subject detail when detailed per-subject data is missing
- Settings:
  - logout confirm modal
  - change password modal
- Backing type: `mixed`
  - user identity/details: backend-backed
  - change password: UI-only
  - detailed subject breakdown: partially mocked/generated

#### 6.3.5 Student Question Bank
- Browse subjects, chapters, and question sets.
- Supports search in question-set view.
- Filters visible entries by student batch.
- Entire question bank dataset is stored in browser localStorage under `ujaas_question_bank`.
- Backing type: `localStorage-backed`.

### 6.4 Faculty Area

#### 6.4.1 Faculty Navigation Model
- Global sections without a selected batch:
  - `batches`
  - `test-series`
  - `question-bank`
- Selected-batch tabs:
  - `home`
  - `students`
  - `question-bank`
- Profile is globally reachable.

#### 6.4.2 Faculty Batch and Student Surface
- Faculty can:
  - choose a batch
  - review selected-batch dashboard
  - open timetable modal
  - open attendance modal
  - open students view
  - open student detail modal
  - edit subject ratings and remarks when subject matches faculty specialty
- Important implementation fact:
  - faculty dashboard student and faculty lists are seeded from hardcoded mock arrays
  - attendance, remarks, and some ratings are stored in localStorage
- Backing type: `mock/demo-only` plus `localStorage-backed`.

#### 6.4.3 Faculty Test Series
- Faculty sees only tests linked to batches where the faculty name is assigned in frontend batch data.
- Can:
  - preview tests
  - open performance insights
  - open create-test UI
- Important gap:
  - backend create endpoint is admin-only
  - faculty can update tests, but cannot create them through backend API
- Backing type: `mixed`.

#### 6.4.4 Faculty Notes and Chapters
- Shared `NotesManagementTab` in editable faculty mode.
- Can:
  - browse subjects and chapters for selected batch
  - create/delete chapter
  - upload/delete notes
  - navigate to create DPP
- Permissions:
  - chapter and note APIs allow admin or faculty
- Backing type: `mixed`
  - chapters and notes: backend-backed
  - DPP content tab: placeholder/mock

#### 6.4.5 Faculty Upload Notes
- Standalone upload page for a selected chapter.
- Inputs:
  - note title
  - one file
- Rules:
  - one file only
  - UI advertises support up to 50 MB
- Endpoint: `/api/notes/upload`.
- Behavior:
  - file is uploaded through backend to storage
  - note metadata is created in backend
  - success modal is shown
- Backing type: `backend-backed`.

#### 6.4.6 Faculty Question Bank
- Faculty-only controls:
  - add question-bank item
  - select target batches
  - delete question entry
  - delete chapter and its entries
- Storage is localStorage only.
- Upload is simulated client-side; there is no backend PDF persistence for this feature.
- Backing type: `localStorage-backed`.

#### 6.4.7 Faculty Profile
- Sections:
  - overview
  - settings
- Overview shows contact, specialty, designation, and join date.
- `me()` refresh populates backend faculty details.
- Change password UI exists but does not call backend.
- Backing type: `mixed`.

### 6.5 Admin Area

#### 6.5.1 Admin Navigation Model
- Global sections:
  - `landing` (`LPM`)
  - `batches`
  - `students`
  - `faculty`
  - `test-series`
  - `queries`
- Selected-batch tabs:
  - `home`
  - `students`

#### 6.5.2 Landing Page Management
- Admin can update:
  - course list
  - faculty showcase entries
  - achievers
  - visions
  - contact data
  - related images
- Endpoint: `PUT /api/landing`.
- Important implementation notes:
  - landing data initializes from hardcoded defaults plus localStorage merge
  - storage-full warning exists for image-heavy localStorage data
  - backend is still the intended persistence target
- Backing type: `mixed`.

#### 6.5.3 Batch Management
- Admin capabilities:
  - create, update, delete batch
  - assign/remove students
  - assign/remove faculty
  - send batch notice
- Relevant endpoints:
  - `/api/batches`
  - `/api/batches/:id/students`
  - `/api/batches/:id/faculty`
  - `/api/batches/:id/notifications`
- Backing type: `backend-backed`.

#### 6.5.4 Student Management
- Admin capabilities:
  - list/create/update/delete students
  - assign and remove batch
  - open detailed student modal
  - print student details
  - reset student password in UI
- Implementation notes:
  - CRUD and batch assignment are backend-backed
  - admin remarks and some subject remarks are stored in localStorage
  - password reset in modal is UI-only
- Backing type: `mixed`.

#### 6.5.5 Faculty Management
- Admin capabilities:
  - list/create/update/delete faculty
  - open faculty details modal
- Relevant endpoint set: `/api/faculties`.
- Important gap:
  - initial password is shown by alert on create, but there is no dedicated backend password-reset flow in UI
- Backing type: `backend-backed` for CRUD, UI-only for some password messaging.

#### 6.5.6 Admin Test Series Management
- Admin capabilities:
  - view tests
  - create test series
  - save draft
  - resume draft
  - preview/edit test
  - publish test
  - force test live now
  - delete test
  - open analytics/performance insights
- Backend rules:
  - only admin can create, delete, or update status
  - admin and faculty can update test details
  - non-admin roles cannot view draft tests
  - forcing live is only for `upcoming` tests and never for drafts
- Test statuses:
  - `draft`
  - `upcoming`
  - `live`
- Backing type: `backend-backed`.

#### 6.5.7 Admin Create Test Series Wizard
- Steps:
  - test configuration
  - add questions
  - review and publish
- Inputs:
  - title
  - format (`JEE MAIN`, `NEET`, `Custom`)
  - target batches
  - duration
  - total marks
  - schedule date/time
  - instructions
  - question set with optional images
- Additional behaviors:
  - auto-save draft on question changes
  - manual save/update draft
  - fill-demo-questions helper
  - subject and section filtering during question authoring
  - image upload for question, option, and explanation via `/api/upload`
- Backing type: `mixed`
  - test/question persistence: backend-backed
  - step state and dirty state: client-side only

#### 6.5.8 Admin Create DPP
- Three-step UI exists:
  - details
  - add questions
  - review/publish
- No dedicated backend DPP persistence is implemented.
- Publish shows success modal and returns to previous screen.
- Backing type: `mock/demo-only`.

#### 6.5.9 Admin Notes and Academic Content
- Shared `NotesManagementTab` in admin-edit mode.
- Admin can:
  - add/delete subject for a batch
  - add/delete chapter
  - upload/delete notes
  - send batch notice
  - navigate to DPP create page
- Important note:
  - DPP tab itself is still placeholder content.
- Backing type: `mixed`.

#### 6.5.10 Admin Queries Management
- Admin can:
  - list queries
  - open query details modal
  - update query status
  - delete query from local UI state
- Backend support:
  - list queries
  - patch query status
- Important gap:
  - delete action has no backend endpoint and is not durable
- Backing type: `mixed`.

#### 6.5.11 Admin Profile
- Shows admin identity and login ID/email.
- Settings:
  - change password modal
  - logout confirm modal
- Change password action is UI-only.
- Backing type: `mixed`.

### 6.6 Shared Features

#### 6.6.1 Notifications
- Notification center is rendered in student/admin/faculty shells.
- Notification list is primarily frontend state in `App.tsx`.
- Batch notice creation exists in backend, but full backend-to-UI notification sync is incomplete.
- Backing type: `mixed`.

#### 6.6.2 Timetable
- Student UI uses a static demo timetable image.
- Admin/faculty UIs expose timetable controls in batch dashboards.
- Batch service supports `timetable_url`, but current UI integration is partial.
- Backing type: `mixed`.

#### 6.6.3 Image Upload
- Endpoint: `POST /api/upload`.
- Roles allowed: admin and faculty.
- Required metadata:
  - context: `tests` or `dpps`
  - itemRole: `question`, `option`, `explanation`
- Image size limit: 5 MB.
- Delete endpoint: `DELETE /api/upload`.
- Backing type: `backend-backed`.

## 7. Backend Interfaces

### 7.1 Public and Auth Endpoints
| Endpoint | Method | Access | Purpose |
| --- | --- | --- | --- |
| `/` | GET | public | health/db status text |
| `/api/auth/login` | POST | public | authenticate and issue tokens |
| `/api/auth/me` | GET | authenticated | return current user profile |
| `/api/auth/refresh` | POST | cookie-based | refresh access token |
| `/api/auth/logout` | POST | client logout | logout and clear cookies |

### 7.2 Profile and Public Content
| Endpoint | Method | Access | Purpose |
| --- | --- | --- | --- |
| `/api/profile/me` | PUT | student | update student profile |
| `/api/landing` | GET | public | fetch public landing data |
| `/api/landing` | PUT | admin | update landing data |
| `/api/queries` | POST | public | submit interest query |
| `/api/queries` | GET | admin | list queries |
| `/api/queries/:id` | PATCH | admin | update query status |

### 7.3 Admin Management Endpoints
| Endpoint | Method | Access | Purpose |
| --- | --- | --- | --- |
| `/api/students` | GET/POST | admin | list/create students |
| `/api/students/:id` | GET/PUT/DELETE | admin | read/update/delete student |
| `/api/students/:id/batches` | POST | admin | assign student to batch |
| `/api/students/:id/batches/:batchId` | DELETE | admin | remove student from batch |
| `/api/faculties` | GET/POST | admin | list/create faculty |
| `/api/faculties/:id` | PUT/DELETE | admin | update/delete faculty |
| `/api/batches` | GET | authenticated | list batches |
| `/api/batches` | POST | admin | create batch |
| `/api/batches/:id` | GET | authenticated | get batch |
| `/api/batches/:id` | PUT/DELETE | admin | update/delete batch |
| `/api/batches/:id/students` | GET/POST | admin | batch students / assign student |
| `/api/batches/:id/students/:studentId` | DELETE | admin | remove batch student |
| `/api/batches/:id/faculty` | GET/POST | admin | batch faculty / assign faculty |
| `/api/batches/:id/faculty/:facultyId` | DELETE | admin | remove batch faculty |
| `/api/batches/:id/notifications` | POST | admin | create batch notice |

### 7.4 Content Endpoints
| Endpoint | Method | Access | Purpose |
| --- | --- | --- | --- |
| `/api/chapters` | GET | authenticated | list chapters by batch/subject |
| `/api/chapters/:id` | GET | authenticated | get chapter |
| `/api/chapters` | POST | admin/faculty | create chapter |
| `/api/chapters/:id` | PUT/DELETE | admin/faculty | update/delete chapter |
| `/api/notes` | GET | authenticated | list notes by chapter |
| `/api/notes/:id` | GET | authenticated | get note |
| `/api/notes/upload` | POST | admin/faculty | upload note file and create note |
| `/api/notes` | POST | admin/faculty | create note record |
| `/api/notes/:id` | PUT/DELETE | admin/faculty | update/delete note |
| `/api/upload` | POST | admin/faculty | upload question/explanation image |
| `/api/upload` | DELETE | admin/faculty | delete uploaded image |

### 7.5 Test and Attempt Endpoints
| Endpoint | Method | Access | Purpose |
| --- | --- | --- | --- |
| `/api/tests` | GET | admin/faculty/student | list tests with role-aware filtering |
| `/api/tests/:id` | GET | admin/faculty/student | get test details |
| `/api/tests` | POST | admin | create test |
| `/api/tests/:id` | PUT | admin/faculty | update test |
| `/api/tests/:id/status` | PATCH | admin | update status / force live |
| `/api/tests/:id` | DELETE | admin | delete test |
| `/api/tests/:id/attempts` | GET | student | get my attempt summary |
| `/api/tests/:id/attempts/start` | POST | student | start or resume attempt |
| `/api/tests/:id/attempts/analysis` | GET | admin/faculty | test analytics |
| `/api/tests/attempts/mine` | GET | student | list my attempt results |
| `/api/tests/attempts/:attemptId/progress` | PATCH | student | save attempt progress |
| `/api/tests/attempts/:attemptId/submit` | POST | student | submit attempt |
| `/api/tests/attempts/:attemptId/result` | GET | admin/faculty/student | get attempt result |

## 8. Core Data Entities
- `users`
  - authentication identity
  - role
  - password hash
  - login ID
- `students`
  - roll number
  - phone
  - address
  - date of birth
  - parent contact
  - assigned batch details
  - ratings
- `faculties`
  - subject specialty
  - designation
  - phone
  - joining data
- `batches`
  - name
  - slug
  - subjects
  - active flag
  - timetable URL
  - student/faculty assignment links
- `tests`
  - title
  - format
  - duration
  - total marks
  - schedule date/time
  - instructions
  - status
  - batch mapping
  - question set
- `test_attempts`
  - student
  - attempt number
  - answers
  - deadline
  - submitted timestamp
  - auto-submitted flag
  - score metrics
- `chapters`
  - batch
  - subject
  - chapter name
  - order index
- `notes`
  - chapter
  - title
  - file URL
- `landing content`
  - courses
  - faculty showcase
  - achievers
  - vision statements
  - contact
- `queries`
  - prospect contact and status

## 9. Routing and Navigation Rules
- The app uses custom route parsing instead of a routing library.
- Supported route families include:
  - `/get-started`
  - `/login`
  - `/student/...`
  - `/faculty/...`
  - `/admin/...`
- App state and URL are synchronized with `pushState` and `replaceState`.
- Student test series uses nested subtab routing for list, overview, taking test, analytics, and results.
- If route and authenticated role mismatch, the app rewrites to a canonical path.

## 10. Non-Functional and Technical Observations

### 10.1 Security
- JWT access token validation on protected backend routes.
- Refresh token rotation and family revocation are implemented.
- Access token can be read from bearer header or access cookie.
- Token blacklist storage is used during logout.
- Role enforcement is explicit in middleware.

### 10.2 Limits and Performance
- JSON request body limit: 5 MB.
- General image upload limit: 5 MB.
- Note upload limit: 50 MB and one file.
- Test image assets are preloaded before timer start when launching an attempt.

### 10.3 Error Handling
- Frontend uses alerts, inline errors, and toast notifications.
- Some flows provide local fallback behavior when backend calls fail.
- Many destructive actions rely on `window.confirm`.

### 10.4 Known Gaps and Inconsistencies
- Faculty dashboard core student/faculty data is mock-driven, not backend-driven.
- Question bank is fully localStorage-backed.
- DPP creation UI is not backed by a dedicated backend persistence layer.
- Student, faculty, and admin change-password dialogs do not submit to backend.
- Admin query deletion is local UI removal only; no delete endpoint exists.
- Some admin/faculty remarks and ratings persist only in localStorage.
- Landing management mixes local defaults/localStorage with backend persistence.
- Timetable handling is only partially wired end to end.

## 11. Assumptions
- This document covers reachable behavior in the current repository.
- Existing repo notes were treated as helper context only; code was treated as the source of truth.
- Shared low-level UI primitives are not treated as standalone product features unless surfaced in active workflows.
