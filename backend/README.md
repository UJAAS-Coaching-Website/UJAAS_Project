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

# UJAAS Backend

Node.js + Express backend for the UJAAS coaching platform.

## What This Service Handles

- Authentication and session refresh
- Student, faculty, and admin APIs
- Batch, subject, chapter, notes, tests, DPP, notifications
- Landing page and public enquiry APIs
- File/image storage integration (S3-compatible)
- Optional Redis caching via Upstash

## Tech Stack

- Node.js (ESM)
- Express
- PostgreSQL (`pg`)
- Multer (uploads)
- Sharp (avatar image compression)
- AWS SDK S3 client (S3-compatible storage)
- Upstash Redis client (optional cache)

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Optional: S3-compatible object storage
- Optional: Upstash Redis

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `backend/.env` (see template below).

3. Run migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

4. Start server:

```bash
npm run dev
```

Backend default URL: `http://localhost:4000`

## Environment Variables

Required:

```env
PORT=4000
NODE_ENV=development

DATABASE_URL=postgres://...
JWT_SECRET=change-this-in-production

# Comma-separated list supported
CORS_ORIGIN=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:3000
```

Auth/session tuning (optional):

```env
ACCESS_TTL_SECONDS=315360000
REFRESH_TTL_SECONDS=315360000
```

Storage (required for uploads, notes, avatars, timetable, question-bank files):

```env
STORAGE_S3_REGION=...
STORAGE_S3_ENDPOINT=...
STORAGE_S3_ACCESS_KEY_ID=...
STORAGE_S3_SECRET_ACCESS_KEY=...
STORAGE_BUCKET_NAME=...
STORAGE_PUBLIC_BASE_URL=...
```

Redis cache (optional):

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Cleanup queue path (optional):

```env
STORAGE_CLEANUP_QUEUE_FILE=runtime/storage-cleanup-queue.json
```

## Scripts

Core:

- `npm run dev` - run with watch mode
- `npm run start` - run in normal mode

Database:

- `npm run db:test`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:status`
- `npm run db:reset`

Storage/cache utilities:

- `npm run db:audit:storage-refs`
- `npm run storage:cleanup:retry`
- `npm run storage:cleanup:retry:50`
- `npm run test:cache-consistency`
- `npm run cleanup:cache-test-subjects`

Additional smoke tests:

- `npm run test:batch-student-lifecycle`
- `npm run test:new-test-student-visibility`
- `npm run test:storage-bucket-structure`
- `npm run test:avatar-db-persistence`
- `npm run test:avatar-storage-object`
- `npm run test:faculty-rating-visibility`

## Key Routes (High-Level)

- Auth: `/api/auth/*`
- Profile: `/api/profile/*`
- Landing: `/api/landing/*`
- Queries: `/api/queries/*`
- Batches: `/api/batches/*`
- Students: `/api/students/*`
- Faculties: `/api/faculties/*`
- Tests: `/api/tests/*`
- DPP: `/api/dpps/*`
- Chapters: `/api/chapters/*`
- Notes: `/api/notes/*`
- Question bank: `/api/question-bank/*`
- Upload: `/api/upload/*`
- Subjects: `/api/subjects/*`
- Faculty reviews: `/api/faculty-reviews/*`
- Notifications: `/api/notification-center/*`

Health endpoint:

- `GET /` -> returns database up/down status message

## Storage Path Conventions

This service stores objects under structured prefixes, including:

- `avatars/...`
- `questions/...`
- `landing-page/...`
- `notes/...`
- `question-bank/...`
- `timetables/...`

## Seed Credentials (Development)

- Admin: `admin@ujaas.com` / `admin123`
- Faculty: `faculty@ujaas.com` / `faculty123`
- Student: `student@ujaas.com` / `student123`

## Production Notes

- Do not use weak/default `JWT_SECRET`.
- Set explicit `CORS_ORIGIN` instead of permissive defaults.
- Enable storage and Redis env vars according to your deployment.
- Run migrations before deploying new backend versions.

