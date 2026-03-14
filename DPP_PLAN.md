# DPP Access, Schema, and Attempt Flow Refactor

## Summary
Align the app to the live DPP schema already present in the database: use `dpps`, `dpp_target_batches`, `dpp_attempts`, and `questions.dpp_id` for DPPs; keep tests on the existing `tests` flow. Remove admin-facing DPP and note creation paths, restrict DPP/note management to faculty assigned to the batch **and** matching the chapter subject, remove timer-based DPP behavior entirely, and replace the current mock student DPP flow with an API-backed preload → instructions → attempt → submit → result flow.

## Key Changes
- Dashboard and role access:
  - Remove `create-dpp` and `upload-notes` entry points from [frontend/src/components/AdminDashboard.tsx](/d:/UJAAS_Project/frontend/src/components/AdminDashboard.tsx) and any admin navigation wiring in [frontend/src/App.tsx](/d:/UJAAS_Project/frontend/src/App.tsx).
  - Keep DPP/note creation only in faculty UI; update faculty-only screens to use real chapter-based data instead of local placeholders where DPPs/notes are shown.
  - Enforce backend authorization for DPP create/update/delete and note create/update/delete so only faculty can manage them, and only when:
    - the target chapter belongs to a batch the faculty is assigned to via `faculty_batches`
    - the chapter’s `subject_name` matches the faculty’s `faculties.subject`
  - Admin may still view analytics if desired through existing admin screens, but cannot create/upload/manage DPPs or notes.

- Database and backend schema:
  - Add a new migration for the live schema, not just the repo snapshot:
    - `ALTER TABLE dpps DROP COLUMN subject, DROP COLUMN chapter`
    - `ALTER TABLE dpps RENAME COLUMN description TO instructions`
    - `ALTER TABLE dpps ADD COLUMN chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE`
    - backfill `dpps.chapter_id` from existing `subject` + `chapter` + assigned target batch; fail loudly on ambiguous/missing matches
    - `ALTER TABLE dpps ALTER COLUMN chapter_id SET NOT NULL`
    - `ALTER TABLE notes DROP COLUMN subject, DROP COLUMN chapter`
  - Preserve `dpp_attempts` but remove time fields from active usage:
    - stop writing `time_spent`
    - stop deriving/storing completion duration anywhere in DPP APIs
    - if you want schema cleanup in the same phase, drop `dpp_attempts.time_spent`; otherwise leave it unused for backward safety
  - Keep DPP attempt storage in `dpp_attempts`, not `test_attempts`.
  - Standardize DPP question loading through `questions.dpp_id`; DPP APIs should ignore `questions.test_id`.

- DPP backend APIs and service layer:
  - Add/finish DPP service, controller, and routes parallel to tests, backed by the live DPP tables.
  - Public/backend contract for DPPs should include:
    - DPP metadata: `id`, `title`, `instructions`, `chapter_id`
    - derived chapter context: batch, subject, chapter name from `chapters`
    - target batches from `dpp_target_batches`
    - question list from `questions.dpp_id`
    - student attempt summary from `dpp_attempts` with max 3 attempts
  - Attempt lifecycle:
    - `GET` student-visible DPP list filtered by assigned batch
    - `GET` single DPP overview/details with chapter-derived context
    - `GET` student attempt summary/history for a DPP
    - `POST` start/preload endpoint returning full DPP payload plus history/remaining attempts
    - `POST` submit endpoint storing `answers`, `score`, `submitted_at`, correct/wrong/unattempted counts
    - `GET` result endpoint returning submitted result and per-question analytics
  - DPP attempt rules:
    - max 3 submitted attempts per student per DPP
    - no active-session timer, no `started_at`, no `deadline_at`, no auto-submit
    - all questions/data/images loaded before the attempt screen opens
    - no mid-attempt fetch requirement for question content
  - Reuse scoring helpers from test logic where practical, but isolate DPP persistence from test tables.

- Frontend DPP flow:
  - Replace the current local/mock DPP flow in [frontend/src/components/StudentDashboard.tsx](/d:/UJAAS_Project/frontend/src/components/StudentDashboard.tsx), [frontend/src/components/DPPPractice.tsx](/d:/UJAAS_Project/frontend/src/components/DPPPractice.tsx), and any placeholder DPP list UI with API-backed behavior.
  - Student flow:
    - click `Attempt`
    - preload full DPP payload and assets first
    - show instructions screen first if `instructions` exists
    - continue into attempt UI after explicit start
    - show no countdown, no duration badge, no clock in header, no time-based warnings
    - submit answers once; on success show result/analytics immediately
  - Remove localStorage-based DPP score/attempt tracking and derive status from backend `dpp_attempts`.
  - Update `CreateDPP` to collect `chapter_id` instead of free-text subject/chapter and to save `instructions` instead of description/duration.
  - Update DPP and note management views to display derived chapter/batch/subject info from `chapter_id` joins rather than stored text columns.

## Public API / Interface Changes
- Add DPP API client alongside existing test client in `frontend/src/api`, with typed payloads for:
  - `ApiDpp`
  - `ApiDppAttemptSummary`
  - `ApiDppAttemptResult`
  - `CreateDppPayload` using `chapter_id`, `instructions`, `batchIds`, `questions`
- Remove DPP UI dependence on `duration` and any completion-time fields.
- Rename DPP text field usage from `description` to `instructions` everywhere in backend and frontend contracts.
- Note write APIs continue to accept `chapter_id`, `title`, and file data only; no `subject`/`chapter` payloads.

## Test Plan
- Authorization:
  - admin cannot see create/upload controls for DPPs or notes
  - admin note/DPP write requests return `403`
  - faculty assigned to batch but wrong subject gets `403`
  - faculty assigned to batch and matching subject can create/update/delete
- Migration:
  - existing `dpps` rows backfill to the correct `chapter_id`
  - `notes.subject` and `notes.chapter` are no longer read or written
  - `dpps.subject` and `dpps.chapter` are no longer read or written
  - `dpps.description` is replaced by `instructions`
- Student DPP flow:
  - DPP list only shows student’s batch DPPs
  - clicking attempt preloads full payload before entering the attempt UI
  - instructions screen appears first when instructions are present
  - no clock or duration is rendered during attempt
  - submit stores answers and result in `dpp_attempts`
  - result screen shows correct/wrong/unattempted/score from stored attempt
  - student can attempt up to 3 times; 4th start returns conflict and UI handles it cleanly
- Regression coverage:
  - regular test-series timer flow remains unchanged
  - notes upload still works for valid faculty/chapter combinations
  - DPP images/questions load without mid-attempt fetches

## Assumptions
- The live database schema is the source of truth for DPPs: `dpps`, `dpp_attempts`, `dpp_target_batches`, and `questions.dpp_id` already exist.
- DPP attempts should use `dpp_attempts`, not `test_attempts`.
- Attempt limit for DPPs stays at 3.
- Faculty authorization is `batch assignment + matching faculty subject`, not batch-only.
- Admin can be blocked from DPP/note management without removing any read-only analytics/reporting access unless you later want that tightened too.
