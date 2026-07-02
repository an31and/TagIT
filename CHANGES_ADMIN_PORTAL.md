# InfoTag — Admin Portal & Landing Update (July 2026)

## New features

### 1. Admin portal (founder-only) — `/admin`
- Visible only when the signed-in user has `role: "admin"` (the account
  seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD`). Every `/api/admin/*`
  endpoint re-verifies the role **server-side** (403 otherwise) — hiding
  the UI is not the security boundary.
- Dashboard cards: unique visitors (total / today / 7d), tag scans
  (total / today / 7d), found reports + items recovered + currently-lost,
  registered users, tags, finder messages, feedback queue, sponsor intents.
- 14-day scans-per-day mini bar chart (`GET /api/admin/scans/daily`).
- Feedback moderation: approve → shows on landing page; hide; delete.
- Sponsor intents list (this data was collected before but had no viewer).

### 2. Visitor counting (privacy-first)
- `POST /api/public/visit` — frontend sends one beacon per browser session;
  server dedupes per salted-hashed-IP per calendar day via a unique index.
  No cookies, no raw IPs, no fingerprinting.

### 3. Feedback & comments
- `POST /api/public/feedback` — name/email optional, message + 1–5 star
  rating, honeypot bot trap, HTML stripped, max 3 per IP-hash per day.
- `GET /api/public/feedback` — only admin-approved entries; email and
  ip_hash are never exposed publicly.
- Landing page gains a "What people say" testimonial wall + submit form.

### 4. Landing page updates
- Live social-proof counters strip (scans, items recovered, active tags,
  visitors) via `GET /api/public/stats`.
- Footer updated: contact `anandlakhera@info-tag.in` (mailto link) and
  "Founder: Anand Lakhera — Cloud FinOps Engineer & DevOps Consultant".

## Fixes / hardening included
- `role` is now returned by `/api/auth/me` (it existed in the DB but was
  never serialized — the frontend had no way to know who the admin was).
- Finder-message rate limiting now reads `X-Forwarded-For` like the scan
  tracker, so it actually works behind nginx / a PaaS load balancer.
- Boot-time warning if `ADMIN_PASSWORD` is still the default `admin123`.
- Added `backend/.env.example` (docker-compose referenced it; it was missing).
- New Mongo indexes: `visits(ip_hash, day)` unique, `feedback(created_at)`,
  `feedback(is_public)`.

## Files added
- `backend/routes/admin_routes.py`
- `backend/routes/public_routes.py`
- `backend/.env.example`
- `frontend/src/pages/Admin.jsx`
- `frontend/src/components/FeedbackSection.jsx`
- `frontend/src/components/LiveStats.jsx`

## Files modified
- `backend/server.py` (register routers)
- `backend/models.py` (FeedbackCreatePayload, UserPublic.role)
- `backend/db.py` (indexes, default-password warning)
- `backend/routes/auth_routes.py` (serialize role)
- `backend/routes/message_routes.py` (X-Forwarded-For fix)
- `frontend/src/App.js` (/admin route + AdminOnly gate + visit beacon)
- `frontend/src/components/AppShell.jsx` (Admin nav tab for admins)
- `frontend/src/pages/Landing.jsx` (stats strip, feedback section, footer)
