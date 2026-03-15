# UJAAS Detailed Functional Audit

This audit focuses on functionality, not just UI presence.

## Status Legend
- `[REAL]` UI action is backed by API/database logic in code
- `[PARTIAL]` Some real wiring exists, but behavior is incomplete, fragile, or only partly persisted
- `[DEMO]` UI exists, but behavior is mock, local-only, or placeholder
- `[RISK]` Security, authorization, persistence, or correctness concern
- `[VERIFY]` Likely implemented, but still needs runtime verification with seeded data and real env config

## Audit Scope
- Based on static analysis of frontend components, frontend API clients, backend routes/controllers/services, and existing project docs
- This is not a full runtime QA pass
- Use this together with `PROJECT_CHECKLIST.md`

## Latest Verified Changes In This Branch
- `[REAL]` Student review mode for both tests and DPPs now uses explicit answer-state rendering for MCQ, MSQ, and Numerical questions.
  - Correct answers are highlighted clearly.
  - Wrong selected options are shown in red.
  - Unattempted states are shown explicitly.
  - Numerical answers now explicitly say whether the student's answer is right or wrong.
- `[REAL]` Submitted-attempt explanations are lazy-loaded per question instead of being preloaded with the main result payload.
  - Explanation panels are hidden by default.
  - Opening one question loads only that question's explanation.
- `[REAL]` Numerical-answer entry is locked to an on-screen numeric keypad in student attempt flows.
  - Physical keyboard input is blocked for numerical-answer fields.
- `[REAL]` Test and DPP authoring forms now start with editable default instruction templates.
  - Student-side generic fallback instructions were removed from test overview; only authored instructions are shown.
- `[REAL]` Inactive batches are now operationally locked.
  - Backend blocks assignment and content-creation actions against inactive batches.
  - Frontend hides/disables the corresponding admin/faculty action UI.
- `[REAL]` Admin can permanently delete an already inactive batch.
  - Batch-owned chapters, notes, DPPs, DPP attempts, and exclusive tests are deleted.
  - Shared tests are preserved and only unlinked from the deleted batch.
  - Student and faculty accounts are preserved while their batch links are removed.
- `[VERIFY]` Permanent delete still needs targeted runtime validation around shared-test preservation and destructive cleanup ordering.

## Top Findings First

### Critical / High Attention
- `[RISK]` Test access control for faculty is too broad.
  - `backend/src/routes/testRoutes.js` allows faculty on `GET /api/tests/:id`, `PUT /api/tests/:id`, and `GET /api/tests/:id/attempts/analysis`.
  - `backend/src/controllers/testController.js` does not check whether that faculty actually manages the related batch/test.
  - Impact: a faculty user may be able to read, update, or analyze tests outside their scope if they know the ID.

- `[RISK]` Chapter management for faculty is too broad.
  - `backend/src/routes/chapterRoutes.js` allows any admin or faculty user to create/update/delete chapters.
  - `backend/src/controllers/chapterController.js` does not enforce faculty ownership of the batch/subject.
  - Impact: any faculty may be able to modify chapters unrelated to their assigned subject/batch.

- `[RISK]` Auth token is stored in `localStorage` even though httpOnly cookies also exist.
  - Seen in `frontend/src/api/auth.ts`, `frontend/src/api/tests.ts`, `frontend/src/api/dpps.ts`, and other API modules.
  - Impact: any XSS bug would expose the bearer token.

- `[RISK]` Backend has insecure fallbacks for production misconfiguration.
  - `backend/src/config/index.js` falls back to `JWT_SECRET="dev-secret-change-me"`.
  - `CORS_ORIGIN` defaults to `true`, effectively allowing all origins if not configured.
  - Impact: unsafe deployment if env vars are missing.

- `[RISK]` Upload endpoints have size limits but weak file-type validation.
  - `backend/src/routes/uploadRoutes.js` and `backend/src/routes/noteRoutes.js` use multer memory storage and size limits.
  - No strong MIME whitelist or content validation is visible.
  - Impact: malicious or unexpected file upload risk.

### Medium Attention
- `[DEMO]` Student profile change-password flow is UI-only.
- `[DEMO]` Admin reset-password flow is UI-only and just shows an alert.
- `[DEMO]` Admin/faculty student performance modal includes hardcoded mock test history.
- `[DEMO]` Student ratings, faculty remarks, and attendance rely on browser storage instead of backend persistence.
- `[PARTIAL]` Test autosubmit on browser close uses `beforeunload` + `fetch(... keepalive)`, which is best-effort and not guaranteed.

## Feature Audit By Area

## 1. Authentication And Session

### Login
- `[REAL]` Login form is backed by `/api/auth/login`.
- `[REAL]` Refresh flow exists through `/api/auth/refresh`.
- `[REAL]` Logout route exists and frontend clears token.
- `[VERIFY]` Refresh token rotation logic exists and looks intentional.

### Session Storage Behavior
- `[PARTIAL]` Access token is sent via bearer token from `localStorage`.
- `[PARTIAL]` Backend also sets auth cookies.
- `[RISK]` This mixed strategy increases complexity and XSS exposure.

### Missing User-Facing Auth Functionality
- `[DEMO]` Student “Change Password” modal submits only local UI state and closes.
  - Source: `frontend/src/components/StudentProfile.tsx`
  - No matching password-change API client or backend route found.

## 2. Student Dashboard And Student Utilities

### Home Dashboard
- `[REAL]` DPP completion stats are loaded from backend batches -> chapters -> DPP list.
  - Source: `frontend/src/components/StudentDashboard.tsx`
- `[REAL]` Batch academic content is loaded through notes/chapters/DPP APIs.
- `[DEMO]` Timetable modal uses a static image asset.
- `[DEMO]` Timetable “Download PDF” button in student dashboard has no real handler.
  - Source: `frontend/src/components/StudentDashboard.tsx`

### Notifications
- `[PARTIAL]` Notification center UI exists and read/delete actions work in app state.
- `[DEMO]` Notification persistence appears frontend-local in `App.tsx`; no full backend notification workflow was verified from the student UI path.

### Question Bank
- `[DEMO]` Question bank data is persisted in `localStorage`.
  - Source: `frontend/src/components/QuestionBank.tsx`
- `[RISK]` Browser-only storage means no shared source of truth, no role enforcement, and no cross-device persistence.

## 3. Student Profile And Ratings

### Profile Editing
- `[REAL]` Student profile update is backed by `/api/profile/me`.
  - Source: `frontend/src/api/auth.ts`, `backend/src/controllers/profileController.js`
- `[VERIFY]` Needs runtime testing for validation, formatting, and edge cases.

### Password Change
- `[DEMO]` “Change Password” opens modal only; submit does not call any API.
  - Source: `frontend/src/components/StudentProfile.tsx`

### Performance Breakdown
- `[DEMO]` Subject detail ratings are described as mocked in code comments.
  - Source: `frontend/src/components/StudentProfile.tsx`
- `[RISK]` UI may imply real per-subject analytics where only synthetic values are shown.

## 4. Test Series

### Student Test List
- `[REAL]` Student can view assigned tests loaded from backend.
- `[REAL]` Attempt metadata such as submitted attempts and active attempt is included in API payloads.

### Start Test
- `[REAL]` “Start Test” first fetches full test details.
- `[REAL]` “Confirm & Start Test” starts/resumes a server-backed attempt.
- `[REAL]` Test assets are preloaded before entering the test UI.
  - Source: `frontend/src/components/TestSeriesContainer.tsx`

### During Test
- `[REAL]` Save-progress API exists and is called from the test container.
- `[PARTIAL]` Active session metadata is also stored in `localStorage` for route/session recovery.
- `[PARTIAL]` Browser-close autosubmit is implemented as best-effort only.
  - Source: `frontend/src/components/TestSeriesContainer.tsx`

### Submit And Analytics
- `[REAL]` Submit goes to backend and result analytics screen opens from returned attempt result.
- `[REAL]` Attempt history and result review are API-backed.
- `[REAL]` Student analytics/review now supports explanation-on-demand per question rather than eager explanation loading.
- `[VERIFY]` Needs end-to-end verification for resume, autosubmit, and ranking integrity.

### Faculty/Admin Test Analytics
- `[REAL]` Test attempt analytics endpoints exist.
- `[RISK]` Faculty authorization on test analytics is too broad.

## 5. DPP Flow

### Student DPP Start
- `[REAL]` “Attempt DPP” is backed by `/api/dpps/:id/attempts/start`.
- `[REAL]` Question assets are preloaded before opening practice mode.
  - Source: `frontend/src/components/NotesManagementTab.tsx`

### Student DPP Submission
- `[REAL]` Submit is backend-backed through `/api/dpps/:id/submit`.
- `[REAL]` Attempt history and review result are backend-backed.

### DPP Review
- `[REAL]` Review mode can fetch explanation per question.
- `[REAL]` DPP review now shares the same explicit answer-state behavior as test review for MCQ, MSQ, and Numerical questions.
- `[PARTIAL]` DPP attempts do not have the richer timed-session persistence used in tests.

### Admin/Faculty DPP Analytics
- `[REAL]` Analytics route exists.
- `[REAL]` Faculty DPP access is scoped more carefully than tests via `contentAccessService`.

## 6. Notes, Chapters, Subjects, Notices

### Subjects In Batch
- `[REAL]` Add/remove subject appears to update batch structure through parent batch update callbacks.
- `[VERIFY]` Needs runtime validation that faculty assignments and batch subjects stay consistent after updates.

### Chapters
- `[REAL]` Add/delete chapter uses chapter APIs.
- `[RISK]` Faculty chapter modification is not properly scoped server-side.

### Notes
- `[REAL]` Note upload/create/update/delete APIs exist.
- `[REAL]` Note create/delete checks faculty-managed chapter/note ownership.
  - Source: `backend/src/controllers/noteController.js`, `backend/src/services/contentAccessService.js`
- `[VERIFY]` Needs real storage environment validation.

### Batch Notices
- `[REAL]` “Upload Notice” in notes/content flow calls batch notification API.
- `[VERIFY]` Should be tested for delivery, visibility, and persistence across roles.

## 7. Admin Dashboard

### Student CRUD
- `[REAL]` Add/edit/delete student is backend-backed.
- `[REAL]` Assign/remove student from batch is backend-backed.
- `[VERIFY]` Needs runtime validation for duplicate roll numbers and batch transitions.

### Faculty CRUD
- `[REAL]` Add/edit/delete faculty is backend-backed.
- `[VERIFY]` Needs runtime validation for duplicate email/login IDs and subject assignment integrity.

### Batch CRUD
- `[REAL]` Batch create/update/delete exists.
- `[REAL]` Inactive batches are prevented from participating in operational actions.
- `[REAL]` Permanent delete exists for already inactive batches and performs scoped destructive cleanup.
- `[VERIFY]` Needs validation for faculty assignment and cross-feature consistency.

### Landing Page Editor
- `[REAL]` Landing page update API exists and is wired.
- `[PARTIAL]` App still keeps some local cached landing state.
- `[VERIFY]` Large images/storage edge cases should be tested.

### Query Management
- `[REAL]` Query listing, submission, and status update paths exist.

### Student Detail Modal
- `[DEMO]` Mock test performance array is hardcoded.
  - Source: `frontend/src/components/AdminDashboard.tsx`
- `[DEMO]` Reset password only shows generated password in confirm/alert.
  - Source: `frontend/src/components/AdminDashboard.tsx`
- `[PARTIAL]` Student remarks/profile editing inside this area should be checked for whether values persist to backend or remain local in component state.

### Ratings
- `[DEMO]` Student rating system is browser-local only.
  - Source: `frontend/src/components/StudentRating.tsx`

## 8. Faculty Dashboard

### Faculty Content Workflows
- `[REAL]` Faculty can create/update/delete DPPs through real APIs.
- `[REAL]` Faculty can upload/manage notes through real APIs.

### Student Tracking In Faculty Area
- `[DEMO]` Student remarks are stored in `localStorage`.
- `[DEMO]` Attendance is stored in `localStorage`.
- `[DEMO]` Mock students/performance data are still injected in places.
  - Source: `frontend/src/components/FacultyDashboard.tsx`

### Student Performance Modal
- `[DEMO]` Mock test performance array is hardcoded.
  - Source: `frontend/src/components/FacultyDashboard.tsx`

## 9. Uploads And Storage

### Question/Image Upload
- `[REAL]` Admin/faculty can upload question/explanation/option images to storage.
- `[PARTIAL]` Context and itemRole are validated.
- `[RISK]` File type validation is still weak.

### Note Upload
- `[REAL]` Faculty note upload path exists and writes to storage + DB.
- `[RISK]` 50 MB memory upload with no strong file validation can be abused or cause pressure.

## 10. Backend Authorization Audit

### Good Patterns
- `[REAL]` DPP ownership checks for faculty are explicit via `contentAccessService`.
- `[REAL]` Note ownership checks for faculty are explicit via `contentAccessService`.

### Weak Patterns
- `[RISK]` Test read/update/analysis lacks equivalent faculty ownership checks.
- `[RISK]` Chapter create/update/delete lacks equivalent faculty ownership checks.
- `[RISK]` Any authenticated user can fetch chapters and notes if they know chapter IDs; this may be intended, but should be reviewed against product rules.

## 11. Backend Validation And Security Audit

### Config
- `[RISK]` `JWT_SECRET` has insecure fallback.
- `[RISK]` `CORS_ORIGIN` default is permissive.

### Auth
- `[REAL]` Access/refresh token model exists with token family rotation and blacklist checks.
- `[PARTIAL]` Frontend still uses bearer tokens from `localStorage`, weakening the benefits of httpOnly cookies.

### Upload Validation
- `[RISK]` No strict MIME allowlist or content inspection found on upload routes.

### Logging / Error Handling
- `[PARTIAL]` Some backend endpoints return raw error messages in JSON.
- `[VERIFY]` Review production logging/error response policy before deployment.

## Actionable Follow-Up Checklist

## Must Fix Before Production
- `[ ]` Add faculty ownership checks for test read/update/analysis endpoints
- `[ ]` Add faculty ownership checks for chapter create/update/delete endpoints
- `[ ]` Remove insecure `JWT_SECRET` fallback and fail fast if unset in production
- `[ ]` Lock down `CORS_ORIGIN`
- `[ ]` Stop storing access tokens in `localStorage`, or explicitly accept the XSS tradeoff and harden accordingly
- `[ ]` Add file-type allowlists and stronger validation for uploads

## Must Fix For Functional Accuracy
- `[ ]` Replace admin mock student performance data with real test/DPP history
- `[ ]` Replace faculty mock student performance data with real test/DPP history
- `[ ]` Implement real change-password flow
- `[ ]` Replace browser-local student ratings with backend persistence
- `[ ]` Replace browser-local attendance/remarks with backend persistence where required
- `[ ]` Decide whether question bank is a real shared feature or intentionally local-only

## Should Verify End-To-End
- `[ ]` Test attempt resume after refresh
- `[ ]` Test autosubmit on timeout and browser close
- `[ ]` DPP attempt limits and result history
- `[ ]` Landing page editor persistence after reload
- `[ ]` Note uploads against real bucket credentials
- `[ ]` Cross-role visibility rules for chapters, notes, tests, and analytics

## Quick Reference: Demo Or Local-Only Behaviors Found
- `[DEMO]` Student profile change password
- `[DEMO]` Student subject-level performance detail generation
- `[DEMO]` Student timetable download button
- `[DEMO]` Student question bank persistence
- `[DEMO]` Student ratings persistence
- `[DEMO]` Admin reset password
- `[DEMO]` Admin student test history modal data
- `[DEMO]` Faculty student test history modal data
- `[DEMO]` Faculty attendance persistence
- `[DEMO]` Faculty remarks persistence

## Summary
- The codebase is not just a UI shell; a lot of the core app is genuinely implemented, especially tests, DPPs, auth, CRUD flows, and content APIs.
- The biggest gaps are:
  - demo/mock data still presented as real insights in some dashboards
  - browser-only persistence for ratings/remarks/attendance/question-bank-style features
  - authorization gaps on faculty test/chapter access
  - deployment/security hardening around tokens, CORS, and uploads
