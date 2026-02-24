# Codebase Notes (Auto-maintained)

## Summary
- Mono-repo layout with `frontend/` (Vite + React) and `backend/` (Express).
- Entry point: `frontend/index.html` -> `frontend/src/main.tsx` -> `frontend/src/App.tsx`.
- UI uses Radix UI components, Tailwind utilities, and assorted UI helpers.

## Tooling
- Frontend build: Vite (`frontend/vite.config.ts`)
- Frontend scripts: `npm run dev`, `npm run build` (`frontend/package.json`)
- Backend scripts: `npm run dev`, `npm start`, `npm run db:test`, `npm run db:migrate`, `npm run db:status`, `npm run db:reset`, `npm run db:seed` (`backend/package.json`)

## Dependencies (high level)
- React 18
- Vite + React SWC
- Radix UI primitives
- Tailwind CSS + utilities (`tailwind-merge`, `class-variance-authority`)
- Motion (`motion`)
- Recharts, embla-carousel, sonner, react-hook-form, react-day-picker
- Express, Helmet, Morgan, CORS, dotenv, pg

## Source Layout
- `frontend/src/main.tsx`: app bootstrap
- `frontend/src/App.tsx`: routing/flow controller (login, get started, dashboards)
- `frontend/src/index.css`, `frontend/src/styles/globals.css`: styling
- `frontend/src/guidelines/Guidelines.md`: placeholder guidance
- `backend/src/index.js`: minimal server serving DB status page
- `backend/src/server.js`: Postgres connection + health check
- `backend/scripts/db-test.js`: DB connectivity test script
- `backend/scripts/migrate.js`: migration runner
- `backend/scripts/reset.js`: drop all tables
- `backend/scripts/status.js`: check required tables
- `backend/scripts/seed.js`: seed sample data
- `backend/migrations/001_init.sql`: initial DB schema (batches-only)
- `backend/migrations/002_seed.sql`: sample data

## Components (top-level)
- `AdminDashboard.tsx`
- `AdminTestAnalytics.tsx`
- `DPPPractice.tsx`
- `DPPSection.tsx`
- `Footer.tsx`
- `GetStarted.tsx`
- `Login.tsx`
- `NotesSection.tsx`
- `NotificationCenter.tsx`
- `StudentAnalytics.tsx`
- `StudentDashboard.tsx`
- `StudentProfile.tsx`
- `StudentRankingsEnhanced.tsx`
- `StudentRating.tsx`
- `TestSeriesContainer.tsx`
- `TestSeriesSection.tsx`
- `TestTaking.tsx`
- `ViewResults.tsx`

## UI Library
- `frontend/src/components/ui/*`: local Radix UI-based components
- `frontend/src/components/figma/ImageWithFallback.tsx`: Figma helper

## App Behavior Notes
- Uses `localStorage` keys:
  - `ujaasUser` for current session user
  - `ujaasHasVisited` for get-started gating
  - `ujaasNotifications` for notifications
  - `student_details_<id>` for student details

## Backend Notes
- Minimal server responds at `/` with DB status text.
- DB helper lives in `backend/src/server.js`.
- Env template at `backend/.env.example` with `DATABASE_URL`.

## Known Gaps
- No API routes or DB integration yet.

## Update Log
- 2026-02-24: Initial structure snapshot and key notes.
- 2026-02-24: Added Express backend scaffold under `backend/`.
- 2026-02-24: Moved frontend files into `frontend/` directory.
- 2026-02-24: Added Postgres health check and db helper.
- 2026-02-24: Added DB test script under `backend/scripts/db-test.js`.
- 2026-02-24: Renamed DB helper to `backend/src/server.js`.
- 2026-02-24: Restored minimal `backend/src/index.js` with web DB status.
- 2026-02-24: Added initial SQL schema for batches-only setup.
- 2026-02-24: Added migration runner script.
- 2026-02-24: Added db:status and db:reset scripts.
- 2026-02-24: Added seed data for batches-only schema.
