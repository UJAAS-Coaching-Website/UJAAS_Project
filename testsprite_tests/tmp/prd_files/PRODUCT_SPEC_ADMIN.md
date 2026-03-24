# Product Specification - Admin Portal

## 1. Purpose
Define functional and non-functional requirements for the Admin experience in UJAAS, including platform configuration, user/batch governance, test administration, and public query handling.

## 2. Scope
In scope:
- Admin authentication and full admin-area access
- Landing Page Management (LPM) CRUD and media lifecycle
- Batch lifecycle management and member assignment
- Student/Faculty user directory CRUD and extended admin controls
- Test Series authoring, draft autosave, publish/force-live, insights
- Batch-level academic mapping controls (subjects, chapters, notes, notices, timetables)
- Public query review/status updates

Out of scope:
- Student exam-taking runtime interaction
- Faculty-limited workflows unless validating role boundaries

## 3. User Persona
- Primary user: Operations and academic administrators
- Goal: Configure institution data, govern users and batches, orchestrate assessments, and monitor platform-level content/workflows

## 4. Entry Points and Navigation
- Login route: `/login`
- Post-login redirect: Admin workspace
- Primary sections: `LPM`, `Batches`, `Students`, `Faculty`, `Test Series`, `Queries`

## 5. Functional Requirements

### 5.1 Authentication and Authorization
- Admin login must validate credentials and role.
- Admin-only actions/endpoints must be inaccessible to Student/Faculty roles.
- Session renewal and unauthorized handling must be consistent with platform auth policy.

### 5.2 Landing Page Management (LPM)
- Admin can add/update/delete:
  - landing courses
  - faculty showcase entries
  - achievers
  - visions
- Image upload/update must store to configured bucket context (landing-page).
- Replacing images must remove prior bucket object to prevent orphaned files.
- Public website must reflect latest relational data updates.

### 5.3 Batch Management
- Admin can perform full CRUD on batches.
- Batch creation must support type-based subject mapping.
- Subject creation may allow unassigned faculty initially.
- Batch detail dashboard must support assigning/removing students and faculty.
- Permanent delete must be restricted to inactive batches only.

### 5.4 User Directory Management
- Admin can perform full CRUD for students and faculty records.
- New user creation must produce initial password feedback to admin.
- Student detail view must support:
  - editable user details
  - admin-specific remarks persisted to `students.admin_remark`
  - performance summary visibility per batch

### 5.5 Faculty Review Session Control
- Admin can trigger a global, time-bound faculty review session (3 days).
- Triggering review must reset current faculty ratings as defined by policy.
- Students should receive sticky notification for active review window.

### 5.6 Test Series Administration
- Admin has full visibility into Draft, Upcoming, and Live tests.
- Create wizard must enforce 3-stage flow: Setup -> Add Questions -> Publish.
- Draft autosave must run continuously during authoring.
- Format constraints (for example max question counts) must be enforced.
- Instructions should prepopulate with editable default templates.
- Question content supports image uploads (question/options/explanation).
- Admin can force-upcoming tests to live state immediately.
- Admin can view insights for completed attempts.

### 5.7 Batch Academic Mapping
- Within batch -> subject/chapter context, admin can:
  - add subjects
  - add chapters
  - upload notes
  - upload batch notices
  - configure timetable images
- Timetable images must upload to `timetables` storage bucket.

### 5.8 Query Management
- Admin can view prospect queries from public landing page submissions.
- Admin can update query status and review contact details.

## 6. Data and Integrations
- Auth and identity APIs with role mapping
- CRUD APIs for landing content, users, batches, tests, queries
- Object storage/S3-compatible buckets for images, notes, timetables
- Relational persistence for users, ratings, remarks, assignments, tests

## 7. Validation and Error Handling
- File constraints:
  - images: 5MB max
  - notes: 50MB max
  - invalid extensions blocked with actionable errors
- Destructive actions (delete/inactivate) require clear confirmation UX.
- Autosave failures in test wizard must surface and allow retry without data loss.
- Forbidden action attempts must return explicit access feedback.

## 8. Non-Functional Requirements
- Security: strict role enforcement for all admin operations.
- Data integrity: cascading updates/deletes must avoid orphan mappings/files.
- Performance: core admin lists (users, batches, tests, queries) should remain responsive at scale.
- Auditability: critical operations should be traceable through backend logs/events.

## 9. Acceptance Criteria
- Admin can manage LPM content and public site reflects updates.
- Admin can create, edit, assign, inactivate, and safely delete batches per rules.
- Admin can create and manage users; admin remark persists for students.
- Admin can complete full test creation wizard with autosave and publish.
- Admin can force-live upcoming tests and view resulting insights.
- Admin can update prospect query statuses successfully.

## 10. Test Coverage Priorities
- P0: Role enforcement, test authoring/publish workflow, batch/user CRUD integrity
- P1: LPM media replacement lifecycle, query status updates, review-session trigger
- P2: Large dataset responsiveness, non-critical UI polish and empty states

