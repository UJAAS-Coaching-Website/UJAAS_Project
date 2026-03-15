# Persistent Test Attempts With Server-Timed Sessions

## Summary
Implement real test-attempt persistence so students can attempt a test multiple times, every attempt is stored in the database, and both students and admin/faculty can see attempt history and analysis. The server becomes the source of truth for attempt lifecycle, countdown timing, submission, and scoring. Include preload/recovery behavior so the full test is downloaded before the attempt begins and a refresh can resume the same active session.

## Key Changes
- Database and backend attempt model:
  - Extend `test_attempts` from a minimal submission record into a session-backed attempt table with fields for `attempt_no`, `started_at`, `deadline_at`, `submitted_at`, `auto_submitted`, `time_spent`, `answers`, `score`, `correct_answers`, `wrong_answers`, `unattempted`, and a persisted snapshot of derived result metrics needed for analytics.
  - Add uniqueness/indexing so one student can have many attempts per test, ordered by `attempt_no`, and at most one active attempt for a given student/test at a time.
  - Score submissions on the server using the current question/answer key in the DB at submission time.
  - Keep all attempts in history; do not collapse or overwrite old submissions.

- Student attempt lifecycle APIs:
  - Add endpoints to:
    - fetch the student’s attempt summary/history for a test
    - start or resume an active attempt
    - fetch the full preloaded attempt payload before entering the exam UI
    - save progress periodically and on key actions
    - submit an attempt
    - fetch a specific submitted attempt result
  - `start` should create a new active attempt only if none is already active; otherwise return the existing active attempt for recovery.
  - `exit`/page close behavior should auto-submit the current active attempt on the server.
  - Server responses for an active attempt must include `serverNow`, `startedAt`, and `deadlineAt`; frontend countdown is derived from server timestamps, not local test duration alone.

- Student frontend flow:
  - Replace local-only test taking in `TestSeriesContainer` / `StudentTestTaking` with an API-backed attempt session.
  - On `Start Test`, first fetch the full attempt payload including all questions and image URLs/data needed for the exam, then enter the test UI only after preload completes.
  - Persist answers to the backend during the attempt so refresh/reopen can recover the same active attempt.
  - Show card status as `Completed` after the first submitted attempt, while still allowing re-attempts.
  - Add student-visible attempt history per test with attempt number, submitted time, score, rank, and a way to open analytics for any prior attempt.
  - After submission, immediately show analytics for that submitted attempt.

- Analytics and analysis screens:
  - Replace mock performance generation in admin/faculty analysis with real DB-backed attempt data.
  - In admin/faculty analysis, count all submitted attempts by default, not just latest/best.
  - Update the analysis table to show attempt-level rows, including student name, attempt number, submitted time, score, accuracy, time spent, and on-time/late status.
  - Keep drill-down into `StudentAnalytics`, but feed it real attempt results from the backend.
  - For test-level summary metrics, define them explicitly as attempt-based totals unless a metric is inherently student-based.

- Server-side timer and recovery rules:
  - `deadline_at` is set when the attempt starts from the configured test duration.
  - Submission is accepted until deadline; after deadline, any active attempt is auto-submitted using the last saved answers.
  - Refresh/reopen during an active attempt resumes the same attempt with remaining time recomputed from the server.
  - No pause feature in this phase.
  - Closing/leaving the page triggers auto-submit instead of discard.

## Public APIs / Types
- Add attempt-oriented API shapes such as:
  - `TestAttemptSummary`
  - `ActiveTestAttempt`
  - `SubmittedTestAttemptResult`
  - `TestAttemptHistoryEntry`
- Add attempt routes under tests or attempts, for example:
  - start/resume attempt
  - save answers
  - submit attempt
  - list attempt history for a student/test
  - list attempt analytics for admin/faculty per test
- `PublishedTest` / student test list should gain enough per-student metadata to show:
  - whether the student has any submitted attempts
  - attempt count
  - active attempt presence, if used for recovery UI
- Preserve current test read APIs for listing tests; attempt details should come from new attempt APIs, not from overloading `/api/tests` too far.

## Test Plan
- Student starts a test:
  - full test payload is fetched before exam UI opens
  - images/questions are available without mid-attempt fetching
  - an active attempt row is created with server deadline
- Student refreshes mid-test:
  - same attempt resumes
  - answers already saved are restored
  - remaining time matches server deadline, not client clock
- Student exits the test:
  - active attempt is auto-submitted
  - attempt appears in history and analytics
- Student submits normally:
  - result is scored on server
  - status becomes completed for that student
  - new attempt entry is visible immediately in student history and admin/faculty analysis
- Same student re-attempts:
  - a new `attempt_no` is created
  - previous attempts remain visible
  - test card still shows completed
- Admin/faculty analysis:
  - no mock data is used
  - all submitted attempts appear
  - drill-down opens the correct attempt result
- Server timer integrity:
  - changing browser clock does not affect deadline
  - expired attempts auto-submit with last saved answers
- Authorization:
  - student can only access own attempts for assigned tests
  - admin/faculty can view attempt analytics only through existing allowed test access paths

## Assumptions
- A student may have unlimited completed attempts for a test.
- Only one active attempt per student/test may exist at a time.
- Scoring uses the current answer key at submission time, not a frozen snapshot.
- Leaving the test auto-submits the current attempt.
- Student card status becomes `Completed` after the first submitted attempt and stays that way even if re-attempts are allowed.
- Results are visible to the student immediately after submission.
- This phase also includes recovery after refresh and a student-visible attempt history UI.
