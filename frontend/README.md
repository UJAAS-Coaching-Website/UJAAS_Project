
# UJAAS Frontend

React + Vite frontend for the UJAAS coaching platform.

## What This App Includes

- Public landing and enquiry flow
- Login and role-based dashboard experience
- Student dashboard, test series, profile, question bank
- Faculty dashboard, students, notes, question bank
- Admin dashboard, landing-page management, batches, tests, queries

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS utilities
- Framer Motion (`motion` package)

## Prerequisites

- Node.js 18+
- Backend API running (default expected at `http://localhost:4000`)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open:

`http://localhost:3000`

## Environment Variables

Create `frontend/.env` (optional for local dev):

```env
# If set, frontend calls this base URL directly.
# Example: https://api.yourdomain.com
VITE_API_URL=

# Dev proxy target for /api when VITE_API_URL is not set.
# Default: http://localhost:4000
VITE_API_PROXY_TARGET=http://localhost:4000
```

### API Resolution Rules

- If `VITE_API_URL` is set, requests go directly there.
- If `VITE_API_URL` is empty, frontend uses relative `/api` and Vite proxies to `VITE_API_PROXY_TARGET`.

## Scripts

- `npm run dev` - start local dev server on port `3000`
- `npm run build` - create production build in `frontend/build`

## Project Structure (High-Level)

- `src/App.tsx` - main app shell and role routing logic
- `src/components/` - role dashboards and feature components
- `src/api/` - frontend API clients
- `src/theme.tsx` - theme provider and dark-mode support logic

## Authentication Behavior

- Access token is stored in `localStorage` key `ujaasToken`.
- Requests include `credentials: include` to support cookie-based refresh.
- On `401`, frontend tries refresh once, then retries request.

## Build and Deploy Notes

- Build output is configured as `build/` (not `dist/`).
- Ensure backend CORS includes your frontend origin.
- For static hosting, serve `build/` and route SPA paths to `index.html`.

## Troubleshooting

- Blank data/cards after login:
  - Confirm backend is running on the expected URL.
  - Check browser devtools for failing `/api/*` calls.
- CORS issues:
  - Update backend `CORS_ORIGIN` to include frontend domain.
- Auth loops:
  - Clear `localStorage` (`ujaasToken`) and login again.
  