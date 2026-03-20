# Sequential Optimization Roadmap

## Summary
- Split the optimization into small, reviewable execution plans.
- Each plan is self-contained, low-risk within its scope, and can be implemented and verified before moving to the next.
- UI, functionality, routes, and API contracts remain unchanged throughout.

## Status
- Plan 1: Completed
- Plan 2: Completed
- Plan 3: Completed
- Plan 4: Completed
- Plan 5: Completed
- Plan 6: Completed
- Plan 7: Completed
- Plan 8: Completed
- Plan 9: Completed
- Plan 10: Completed
- Plan 11: Completed
- Plan 12: Completed

## Stepwise Plans
### Plan 1: Baseline And Dead-Surface Audit
- Create a precise inventory of:
  - unused frontend `ui` wrappers
  - non-runtime files living inside `frontend/src`
  - duplicated helper logic across major files
  - oversized frontend bundle hotspots
  - backend exports/routes that appear unreachable
- Produce a remove/extract candidate list grouped into:
  - safe to remove
  - safe to extract
  - keep for compatibility
- Acceptance:
  - no code changes yet beyond audit-safe cleanup if explicitly bundled into implementation
  - clear candidate map for the next plans

### Plan 2: Frontend Dead Code And Dependency Pruning
- Remove verified-unused frontend runtime files, especially unused `components/ui` wrappers.
- Remove matching unused frontend packages from `frontend/package.json`.
- Move or delete non-runtime docs/scripts currently inside `frontend/src` so source tree contains app code only.
- Keep every reachable feature, including landing interest/query flow.
- Acceptance:
  - frontend build passes
  - no visible UI change
  - import graph contains no references to removed files
  - dependency list is smaller and cleaner

### Plan 3: Shared Frontend Utilities
- Extract duplicated frontend helpers into shared modules:
  - test/question mapping
  - answer parsing
  - date/profile helpers
  - attendance rating helpers
  - localStorage helpers for stored remarks and related state
- Update all current callers without changing behavior.
- Acceptance:
  - duplicated helper bodies are removed from major components
  - frontend build passes
  - affected pages behave identically

### Plan 4: Shared Frontend Hooks And Viewport Logic
- Standardize repeated viewport/mobile listeners into shared hooks.
- Replace duplicated `resize`/mobile detection logic in dashboards, question bank, test pages, login, and landing-related screens.
- Extract repeated body scroll locking or modal overflow patterns where practical.
- Acceptance:
  - same responsive behavior
  - fewer direct `window.addEventListener('resize', ...)` implementations
  - no UI layout change on desktop/mobile

### Plan 5: Timetable And Shared Dashboard Behavior
- Extract repeated timetable modal/download/view behavior from student, faculty, and admin dashboards into shared units.
- Extract other clearly duplicated dashboard behavior shared between admin and faculty where the render output can remain identical.
- Acceptance:
  - same timetable experience in all roles
  - reduced duplicate dashboard code
  - no visual changes

### Plan 6: Break Up `App.tsx`
- Refactor `frontend/src/App.tsx` into smaller orchestration modules/hooks:
  - auth bootstrap/session restore
  - landing/query management
  - notification polling/state
  - admin data actions
  - published test lifecycle
  - shared toast state
- Keep `App.tsx` as a thin composition shell.
- Acceptance:
  - app boot/login/logout flows behave the same
  - `App.tsx` becomes substantially smaller
  - no route/view behavior changes

### Plan 7: Admin And Faculty Dashboard Modularization
- Break `frontend/src/components/AdminDashboard.tsx` into focused internal sections/components.
- Break `frontend/src/components/FacultyDashboard.tsx` similarly.
- Preserve current tab structure, props, and rendered UI.
- Acceptance:
  - both files become materially smaller
  - repeated blocks are shared where safe
  - all existing admin/faculty flows still work

### Plan 8: Student Dashboard And Question/Test Flow Cleanup
- Modularize `frontend/src/components/StudentDashboard.tsx`, `frontend/src/components/QuestionBank.tsx`, and test container/orchestration pieces.
- Extract repeated asset preload/download/session logic where helpful.
- Acceptance:
  - student flows remain identical
  - files are easier to read and smaller
  - no change in test/question-bank behavior

### Plan 9: Frontend Code-Splitting And Bundle Optimization
- Add lazy loading for top-level screens:
  - `GetStarted`
  - `Login`
  - `StudentDashboard`
  - `FacultyDashboard`
  - `AdminDashboard`
- Improve chunking without changing app behavior or loading UX.
- Acceptance:
  - frontend build passes
  - main bundle size drops materially from current baseline
  - Vite oversized chunk warning is reduced or removed if feasible

### Plan 10: Backend Shared Assessment Core
- Extract shared logic from `backend/src/services/testService.js` and `backend/src/services/dppService.js`:
  - answer normalization
  - scoring
  - question mapping
  - explanation stripping
  - attempt/result mapping
- Keep service APIs and controller behavior unchanged.
- Acceptance:
  - backend behavior remains identical
  - duplicated assessment logic is centralized
  - tests/manual validation for test and DPP flows pass

### Plan 11: Backend Compatibility And Service Modularization
- Keep legacy student-batch compatibility, but isolate schema branching behind a smaller compatibility layer.
- Reduce duplication in large backend services without altering route contracts.
- Review for genuinely unreachable server code and remove only what is proven unused.
- Acceptance:
  - all existing backend routes still function
  - compatibility path still exists
  - service files become smaller and more focused

### Plan 12: Final Verification And Cleanup Pass
- Run final build/check pass after all prior plans.
- Re-audit for leftover dead imports, duplicate helpers, and temporary compatibility shims introduced during refactors.
- Acceptance:
  - frontend builds cleanly
  - no broken role flow
  - final codebase is lighter, more reusable, and easier to read

## Execution Defaults
- Execute these plans in order.
- After each plan:
  - validate locally
  - summarize exact changes
  - pause for review before starting the next one
- If a later plan becomes unnecessary because an earlier plan already solved it cleanly, shrink or skip it instead of forcing refactors.
