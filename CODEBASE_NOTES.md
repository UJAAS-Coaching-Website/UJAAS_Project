# Codebase Notes (Auto-maintained)

## Summary
- Mono-repo layout with `frontend/` (Vite + React) and `backend/` (Express).
- Entry point: `frontend/index.html` -> `frontend/src/main.tsx` -> `frontend/src/App.tsx`.
- UI uses Radix UI components, Tailwind utilities, and assorted UI helpers.

## Tooling
- Frontend build: Vite (`frontend/vite.config.ts`)
- Frontend scripts: `npm run dev`, `npm run build` (`frontend/package.json`)
- Backend scripts: `npm run dev`, `npm start` (`backend/package.json`)

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
- `backend/src/index.js`: Express app entry
- `backend/src/db.js`: Postgres connection + health check

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
  - `ugasUser` for current session user
  - `ugasHasVisited` for get-started gating
  - `ugasNotifications` for notifications
  - `student_details_<id>` for student details

## Backend Notes
- Express scaffold with `GET /` and `GET /health`.
- DB health check: `GET /health/db` using `backend/src/db.js`.
- Env template at `backend/.env.example` with `DATABASE_URL`.

## Known Gaps
- No API routes or DB integration yet.

## Update Log
- 2026-02-24: Initial structure snapshot and key notes.
- 2026-02-24: Added Express backend scaffold under `backend/`.
- 2026-02-24: Moved frontend files into `frontend/` directory.
- 2026-02-24: Added Postgres health check and db helper.
