# Codebase Notes (Auto-maintained)

## Summary
- Vite + React frontend.
- Express backend scaffold in `backend/`.
- Entry point: `index.html` -> `src/main.tsx` -> `src/App.tsx`.
- UI uses Radix UI components, Tailwind utilities, and assorted UI helpers.

## Tooling
- Frontend build: Vite (`vite.config.ts`)
- Frontend scripts: `npm run dev`, `npm run build` (`package.json`)
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
- `src/main.tsx`: app bootstrap
- `src/App.tsx`: routing/flow controller (login, get started, dashboards)
- `src/index.css`, `src/styles/globals.css`: styling
- `src/guidelines/Guidelines.md`: placeholder guidance
- `backend/src/index.js`: Express app entry

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
- `src/components/ui/*`: local Radix UI-based components
- `src/components/figma/ImageWithFallback.tsx`: Figma helper

## App Behavior Notes
- Uses `localStorage` keys:
  - `ugasUser` for current session user
  - `ugasHasVisited` for get-started gating
  - `ugasNotifications` for notifications
  - `student_details_<id>` for student details

## Backend Notes
- Express scaffold with `GET /` and `GET /health`.
- Env template at `backend/.env.example` with `DATABASE_URL`.

## Known Gaps
- No API routes or DB integration yet.

## Update Log
- 2026-02-24: Initial structure snapshot and key notes.
- 2026-02-24: Added Express backend scaffold under `backend/`.
