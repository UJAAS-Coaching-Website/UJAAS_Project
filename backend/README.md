# Coaching Backend

Minimal backend scaffold.

## Setup
- Create `.env` and set:
  - `DATABASE_URL=...`
  - `JWT_SECRET=...` (required for auth token signing)
  - `CORS_ORIGIN=http://localhost:5173` (optional; comma-separated origins supported)
- Install deps: `npm i` (from `backend/`).

## Run
- `npm run dev`

## Web DB Status
- Visit `http://localhost:4000/` to see "Database is UP" or "Database is DOWN".

## Database
- Migrate: `npm run db:migrate`
- Seed: `npm run db:seed`
- Test: `npm run db:test`
- Status: `npm run db:status`
- Reset (drops tables): `npm run db:reset`

## Cache Consistency Smoke Tests
- Start backend first (`npm run dev` or `npm run start`).
- Run: `npm run test:cache-consistency`
- Optional env overrides:
  - `CACHE_TEST_API_BASE_URL` (default `http://localhost:4000`)
  - `CACHE_TEST_ADMIN_LOGIN_ID` (default `admin@ujaas.com`)
  - `CACHE_TEST_ADMIN_PASSWORD` (default `admin123`)

## Notes
- DB check logic lives in `backend/src/server.js`.
- Auth endpoints:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Seed login credentials:
  - Admin: `admin@ujaas.com` / `admin123`
  - Faculty: `faculty@ujaas.com` / `faculty123`
  - Student: `student@ujaas.com` / `student123`
