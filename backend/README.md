# Coaching Backend

Minimal backend scaffold.

## Setup
- Copy `.env.example` to `.env` and fill `DATABASE_URL`.
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

## Notes
- DB check logic lives in `backend/src/server.js`.
