# Deployment Plan: Vercel + Railway + Upstash

This document is a clear, explainable deployment plan for the current stack:
Frontend: Vite + React. Backend: Node/Express. Database: PostgreSQL. Cache: Upstash Redis. Storage: S3-compatible.

It also includes a comparison with Hostinger so you can explain why these choices were made.

## Executive Summary (Why This Stack)
- We will use Vercel for the frontend, Railway for backend + PostgreSQL, and Upstash for Redis caching.
- This choice fits our budget, avoids server management, and is production-ready for India users.
- Our traffic pattern is short, read-heavy peaks (test start), which Railway + Upstash handles well.
- If peaks become sustained and CPU-heavy for many hours, a higher fixed tier (Render) or a larger VPS can be considered, but with higher cost and more ops.

## Full Conversation Summary (What We Decided and Why)
- Stack checked: Vite/React frontend, Node/Express backend, PostgreSQL via `pg`, Redis via Upstash, S3-compatible storage.
- Supabase is not suitable for production because it requires VPN access in India.
- Budget is ₹1,000–₹1,200/month.
- Users are India-only (Gujarat), mostly read-only.
- Peak traffic: ~500 concurrent at test start, with a large download burst then uploads later.
- Decision: Vercel (frontend) + Railway (backend + Postgres) + Upstash (cache).

## Peak Traffic Detailing (500 Concurrent Users)
- Peak event: test start when ~500 users download at once.
- Most suitable approach:
  - Serve test files from object storage/CDN using presigned URLs.
  - Cache test metadata in Redis to reduce database reads.
  - Keep API CPU light; uploads spread out later.
- This peak pattern favors Railway + Upstash because bursts are short and mostly read-heavy.

## Why This Is Most Suitable For Us
- It matches our traffic profile: short, read-heavy peaks.
- It is the lowest-ops option for a small team.
- It stays within budget at low usage.
- It avoids VPN issues and works for India users.

## Pros and Cons (Clear, Explainable)

### Vercel (Frontend)
Pros
- Fast global CDN delivery for static Vite builds.
- Simple Git deploys and previews for safe releases.
- Free tier is usually enough for a static frontend.
Cons
- Only hosts the frontend; backend must be elsewhere.

### Railway (Backend + PostgreSQL)
Pros
- Managed backend and database in one place.
- Usage-based pricing keeps early costs low.
- Easy scaling without server management.
Cons
- Cost can rise with heavy sustained CPU/RAM usage.
- Requires a credit card for the Hobby plan.

### Upstash (Redis)
Pros
- Serverless Redis, easy to integrate, global.
- Free tier works for early traffic.
Cons
- If cache usage grows, a paid tier may be needed.

## Alternatives Summary (Why Not Primary Choice)

### Render
Pros
- All-in-one provider with managed services.
- Good production features and predictable tiers.
Cons
- Higher fixed costs at low usage.
- Upgrading means jumping to larger tiers sooner.
When to choose Render
- When traffic is sustained for many hours and you want fixed capacity.

### Hostinger (VPS)
Pros
- More resources per rupee for a fixed price.
Cons
- You manage the server, database, backups, and security.
- Higher operational risk during launch.
When to choose Hostinger
- When you have sysadmin skills and want full control.

## Reasons for Each Choice (Clear, Non-Technical)
- Vercel: Fast website loads for students in India, easy updates from GitHub, and no server costs for the frontend.
- Railway: We can host both the API and database in one place, avoid managing servers, and keep the backend reliable.
- Upstash: It reduces database load and keeps the app fast during peak daytime traffic.

## Architecture Overview
- Vercel hosts the static frontend build from `frontend/`.
- Railway hosts the API from `backend/`.
- Railway provides a managed PostgreSQL database.
- Upstash provides Redis caching.
- Optional: S3-compatible storage remains as-is if file uploads are needed.

## Deployment Plan (Step-by-Step)

### 1) Prepare the Repo
1. Confirm production environment variables required by the backend. Check `backend/.env` for keys used in code.
2. Confirm frontend build outputs to `dist/` (Vite default).
3. Ensure migrations are ready in `backend/scripts/`.

### 2) Create Upstash Redis
1. Create a new Upstash Redis database for production.
2. Copy the REST URL and REST token.
3. These map to:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3) Create Railway Project
1. Create a Railway project.
2. Add a **Node service** for the backend.
3. Add a **PostgreSQL database** to the same project.
4. Choose the closest region available to India (usually Singapore).
5. Copy the Railway `DATABASE_URL` once the database is provisioned.

### 4) Configure Backend on Railway
1. Set environment variables in the Railway service.
2. Required variables will include:
   - `DATABASE_URL`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - Any S3 keys if file uploads are enabled
3. Set the start command to match your `package.json`:
   - `npm start`

### 5) Run Database Migrations
1. In Railway, use a one-time command or script to run migrations.
2. Suggested command:
   ```bash
   npm run db:migrate
   ```
3. If you seed initial data, run:
   ```bash
   npm run db:seed
   ```

### 6) Deploy Backend
1. Connect the Railway service to your Git repository.
2. Deploy on push to the main branch.
3. Verify API health by hitting a known route in the browser or Postman.

### 7) Deploy Frontend to Vercel
1. Create a Vercel project linked to the frontend repo or monorepo.
2. Set the project root to `frontend/`.
3. Build command:
   ```bash
   npm run build
   ```
4. Output directory:
   - `dist`
5. Set frontend environment variables that point to the Railway API base URL.

### 8) Connect GoDaddy Custom Domain to Vercel
1. Add the domain in Vercel.
2. Vercel will show exact DNS records to copy.
3. In GoDaddy DNS, add those records exactly.
4. Wait for DNS propagation and verify HTTPS is active in Vercel.

### 9) Verify Production Readiness
1. Test critical user flows: login, listing tests, attempting tests, viewing results.
2. Test peak-hour traffic with a light load test.
3. Confirm caching works by observing reduced DB read load.

### 10) Monitoring and Rollback
1. Enable Railway logs for backend errors.
2. Use Vercel preview deployments for safe testing.
3. If a release fails, roll back via Vercel's deployment history.

## Cost Control Tips
- Keep Vercel on the free tier for the static frontend.
- Keep Railway resource usage minimal for initial load.
- Use Upstash free tier as long as cache volume is low.
- Set alerts in Railway to avoid unexpected usage spikes.

## Detailed Pricing Comparison (Base + Scaling)

Notes:
- Prices below are monthly and can change; check provider pages before purchase.
- Snapshot date for these numbers: 2026-03-24.
- "Base setup" assumes a small Node/Express API + a small Postgres database.

### Base Pricing (Small Production Setup)
| Provider | Backend base plan | Database base plan | Base monthly total | What it includes |
|---|---|---|---|---|
| Railway | Hobby $5 minimum usage | Included, usage-based Postgres | $5 minimum (usage-based) | Subscription covers the first $5 of usage, then pay for extra resources. |
| Render | Web Service Starter $7 (512 MB RAM, 0.5 CPU) | Postgres Basic-256mb $6 | $13 (plus storage) | Fixed service tier + fixed DB tier. |
| Hostinger (VPS) | KVM 1 ₹599/mo promo, renew ₹999/mo | Included (self-managed Postgres on VPS) | ₹599–₹999/mo | 1 vCPU, 4 GB RAM, 50 GB NVMe; you manage OS and DB. |

### Scaling Prices (RAM, CPU, Storage)
| Provider | RAM pricing | CPU pricing | Storage pricing | Scaling model |
|---|---|---|---|---|
| Railway | $0.00000386 per GB-second (about $10 per GB-month) | $0.00000772 per vCPU-second (about $20 per vCPU-month) | $0.00000006 per GB-second (about $0.16 per GB-month) | Metered usage; pay only for what you actually use. |
| Render | Included in fixed tiers | Included in fixed tiers | Postgres storage $0.30 per GB-month | Upgrade to larger instance tiers for more RAM/CPU. |
| Hostinger (VPS) | Bundled in VPS plan | Bundled in VPS plan | Bundled in VPS plan | Upgrade to a larger VPS plan to scale. |

### Scaling Example (When You Need More RAM/CPU)
| Provider | Next step from base | Approx new monthly cost | What changes |
|---|---|---|---|
| Railway | Increase RAM/CPU on the same service | Linear cost based on usage | You pay only for extra RAM/CPU you allocate. |
| Render | Upgrade from Starter to Standard | $25/month for 2 GB RAM, 1 CPU | Fixed jump to the next tier. |
| Hostinger (VPS) | Upgrade from KVM 1 to KVM 2 | ₹799 promo, renew ₹1,199 | More vCPU/RAM/storage in a bigger VPS. |

### Why Railway Still Fits Our Budget Best
- We can scale in small steps and pay only for what we use.
- Render requires tier jumps that can cost more at low usage.
- Hostinger is cost-effective per GB but requires server management.

## Hostinger Comparison (Clear Rationale)

### Summary
Hostinger is a good general hosting provider, but it is not the most efficient or safe option for a Node/Express + PostgreSQL stack at launch because it usually requires server management.

### Comparison Table
| Category | Vercel + Railway + Upstash | Hostinger (Shared/Cloud/VPS) |
|---|---|---|
| Frontend hosting | Optimized for Vite/React, CDN by default | Works, but more manual |
| Backend hosting | Managed Node service, no server admin | Requires VPS or Cloud plan |
| Database | Managed PostgreSQL | You must install/manage Postgres |
| Ops effort | Very low | Medium to high |
| Reliability | Built for app deploys | Depends on your server setup |
| Scaling | Easy, built-in | Manual scaling |
| Best for | Small team, fast launch | Teams with sysadmin skills |

### Why We Are Not Choosing Hostinger
- We want to avoid server management and reduce production risk.
- We want predictable deployment and rollback features.
- We want a setup the team can maintain without DevOps overhead.

## Final Recommendation (One Sentence)
Use **Vercel for the frontend**, **Railway for backend + PostgreSQL**, and **Upstash for Redis**, because it is the fastest, lowest-maintenance, and safest way to launch in India on a small budget.
