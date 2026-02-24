# Coaching Backend

Minimal Express backend scaffold.

## Setup
- Copy `.env.example` to `.env` and fill `DATABASE_URL`.
- Install deps: `npm i` (from `backend/`).

## Run
- Dev: `npm run dev`
- Prod: `npm start`

## Endpoints
- `GET /`
- `GET /health`
- `GET /health/db` (checks Postgres connectivity)

## Notes
- Database connectivity uses `DATABASE_URL`.
