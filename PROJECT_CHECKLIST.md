# UJAAS Project Checklist

Use this file as a living tracker while we stabilize and complete the codebase.

## Legend
- `[x]` Completed or clearly implemented in the current codebase
- `[ ]` Remaining, incomplete, or needs dedicated follow-up
- `[~]` Implemented but needs attention, cleanup, or stronger verification

## Core Platform
- [x] Frontend app scaffolded with React + Vite + TypeScript
- [x] Backend app scaffolded with Express
- [x] PostgreSQL migration system and seed/reset/status scripts exist
- [x] Role-based structure exists for student, faculty, and admin experiences
- [~] Production build works for the frontend
- [ ] Add automated CI checks for build, lint, and tests

## Authentication And Session Flow
- [x] Login flow implemented on frontend and backend
- [x] JWT-based auth with refresh flow is implemented
- [x] Role-protected backend routes exist
- [x] Logout flow clears session token on frontend
- [~] Session state still depends on `localStorage` for token persistence
- [ ] Add automated auth tests for login, refresh, protected routes, and logout

## Routing And App Structure
- [x] Custom route/state handling exists in `frontend/src/App.tsx`
- [x] Deep-link style paths for student/admin/faculty views are supported
- [~] `frontend/src/App.tsx` is a very large orchestration file and should be split into smaller modules/hooks
- [ ] Replace custom routing with a formal router if long-term maintainability becomes a priority

## Student Experience
- [x] Student dashboard exists
- [x] Student profile and performance views exist
- [x] Student test series UI exists
- [x] Student DPP flow exists
- [x] Student batch academic content/notes area exists
- [x] Student question bank UI exists
- [~] Some student-facing progress/state still uses browser storage instead of a fully backend-driven source of truth
- [ ] Verify each student screen end-to-end against real seeded backend data

## Admin Experience
- [x] Admin dashboard exists
- [x] Admin batch CRUD exists
- [x] Admin faculty CRUD exists
- [x] Admin student CRUD exists
- [x] Admin landing-page editing exists
- [x] Admin query management exists
- [x] Admin test creation, preview, publish, update, and delete flows exist
- [~] Some admin analytics/performance sections still contain mock data in the UI
- [~] Some admin remarks/rating-related data is stored locally in the browser
- [ ] Replace remaining mock analytics with fully API-backed data

## Faculty Experience
- [x] Faculty dashboard exists
- [x] Faculty content upload/manage flow exists
- [x] Faculty DPP creation and management exist
- [x] Faculty test access/management exists
- [~] Some faculty analytics/performance sections still contain mock data in the UI
- [~] Some faculty attendance/remarks state is stored in `localStorage`
- [ ] Move faculty analytics, attendance, and remarks to durable backend storage

## Tests And Exam Attempts
- [x] Test CRUD exists in backend services/routes
- [x] Student-visible assigned test listing exists
- [x] Server-backed test attempt start/save/submit/result APIs exist
- [x] Test attempt history and analysis endpoints exist
- [x] Question explanation fetch endpoint exists for submitted attempts
- [~] This area is feature-rich and should get dedicated API/integration coverage
- [~] Frontend build warns about a large bundle, likely influenced by the heavy exam/dashboard surface area
- [ ] Add automated tests for attempt recovery, autosubmit, scoring, and role-based access

## DPP Flow
- [x] DPP CRUD exists
- [x] Student DPP listing exists
- [x] Student DPP attempt summary and result flows exist
- [x] DPP analysis exists for admin/faculty
- [~] DPP attempts are persisted, but the flow is simpler than the server-timed test attempt flow
- [ ] Confirm whether DPP needs save-progress/resume behavior or current submit-once behavior is acceptable

## Content, Chapters, Notes, Uploads
- [x] Chapter routes/services exist
- [x] Notes routes/services exist
- [x] Upload route and storage service exist
- [x] Student batch content view is wired into the dashboard
- [~] Storage upload/delete behavior needs real environment validation with the target bucket/provider
- [ ] Add integration tests for upload, note creation, note deletion, and permission checks

## Data And Persistence
- [x] Database schema and migrations cover major app domains
- [x] Backend services are organized by domain
- [~] Several frontend features still rely on `localStorage` or `sessionStorage`
- [~] There is a mix of API-backed persistence and browser-only persistence that should be normalized
- [ ] Decide feature-by-feature which browser-stored data must move into the database

## UI, UX, And Frontend Quality
- [x] Shared UI primitives and skeleton loaders exist
- [x] Motion/animation system is used throughout the frontend
- [x] Teal/cyan visual theme is consistently applied
- [~] Bundle output is large: current production JS bundle is about 867 kB before gzip warning threshold analysis
- [~] Some source files show encoding artifacts in comments/UI text
- [ ] Introduce code-splitting for dashboard-heavy areas
- [ ] Clean up text encoding artifacts and verify display strings

## Documentation
- [x] The repository already includes architecture, SRS, planning, and notes documents
- [~] Existing docs are helpful but not yet turned into a single execution tracker
- [x] This checklist now exists as the project tracking file
- [ ] Add a short root `README.md` with setup, env vars, run steps, and main workflows

## Testing And Verification
- [x] Frontend production build currently passes
- [x] Backend main app file parses successfully
- [ ] Add frontend component/integration tests
- [ ] Add backend route/service tests
- [ ] Add migration smoke tests for a fresh database
- [ ] Add a manual QA checklist for student, faculty, and admin critical flows

## Highest-Priority Attention Items
- [ ] Break up `frontend/src/App.tsx` into smaller feature/state modules
- [ ] Replace remaining mock analytics in admin/faculty dashboards
- [ ] Move remarks, ratings, attendance, and similar browser-only state into backend persistence where needed
- [ ] Add automated tests around auth, tests, DPPs, uploads, and role permissions
- [ ] Reduce frontend bundle size with code-splitting/lazy loading
- [ ] Add a concise setup-and-run README for new contributors

## Notes From This Analysis
- Frontend build succeeded locally with a Vite warning about oversized chunks.
- Test attempt persistence is substantially implemented on the backend.
- DPP flows are implemented, but they appear simpler and should be reviewed against final product expectations.
- The biggest quality gap is not missing screens; it is inconsistency between fully persisted features and browser-only/mock-backed features.
