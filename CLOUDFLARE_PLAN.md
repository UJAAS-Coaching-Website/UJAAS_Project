# Cloudflare Implementation Plan (DNS + API Protection + Rate Limiting)

This plan adds Cloudflare in front of the API (Railway) while keeping the frontend on Vercel. It includes DNS setup and rate limiting. It is written to be clear for non-technical stakeholders.

## Goal
- Protect the backend API from abuse and traffic spikes.
- Reduce risk of unexpected usage bills.
- Keep the frontend on Vercel unchanged.

## High-Level Architecture
- `yourdomain.com` -> Vercel (frontend)
- `www.yourdomain.com` -> Vercel (frontend)
- `api.yourdomain.com` -> Cloudflare proxy -> Railway (backend)

## Phase 1: Add Domain to Cloudflare
1. Create a Cloudflare account.
2. Add your domain in Cloudflare.
3. Cloudflare will provide **nameservers**.
4. Update the nameservers in GoDaddy to Cloudflare's nameservers.
5. Wait for DNS to propagate (can take a few hours).

## Phase 2: DNS Records in Cloudflare
Create these records in Cloudflare DNS:
- Apex domain (`yourdomain.com`) -> Vercel's A record (as shown in Vercel)
- `www` -> Vercel CNAME (as shown in Vercel)
- `api` -> CNAME to your Railway service URL

Set proxy mode:
- For `api`: **Proxy ON** (orange cloud)
- For frontend records: **DNS only** (gray cloud)

## Phase 3: SSL/TLS Settings
1. Go to SSL/TLS in Cloudflare.
2. Set SSL mode to **Full** (or **Full (Strict)** if origin certs are installed).
3. Confirm HTTPS works for `api.yourdomain.com`.

## Phase 4: Security Baseline
1. Enable Cloudflare security defaults.
2. Turn on Bot Fight Mode if available on your plan.
3. Add a simple WAF rule to block obvious bad traffic (optional).

## Phase 5: Rate Limiting (Two Layers)
Use both if possible:

### A) Edge Rate Limiting (Cloudflare)
If your plan supports it:
1. Go to Security -> WAF -> Rate Limiting Rules.
2. Create a rule for `/api/*` or your API routes.
3. Suggested starting thresholds:
   - 100 requests per minute per IP (adjust after testing)
   - Action: Managed Challenge or Block
4. Add exceptions for internal/admin IPs if needed.

### B) App Rate Limiting (Backup)
Implement in the backend using Upstash Redis:
1. Rate limit by IP and/or user ID.
2. Protect login, test-start, and submission routes first.
3. Return HTTP 429 for rate-limited requests.

## Phase 6: Monitoring and Alerts
1. Enable Cloudflare Analytics.
2. Set Railway budget alerts.
3. Review logs during peak test times.

## Rollout Plan
1. Move DNS to Cloudflare.
2. Proxy only the API subdomain first.
3. Test API endpoints and frontend flows.
4. Turn on rate limiting rules.
5. Observe for 1-2 test cycles and adjust thresholds.

## Why This Approach Works
- Cloudflare stops abusive traffic before it hits the backend.
- Rate limiting reduces load spikes and protects the database.
- The frontend remains unchanged on Vercel.
- This plan is simple, low-cost, and reversible.

