# InfoTag — Deployment Guide

A practical runbook for taking InfoTag (FastAPI + MongoDB + React PWA) from a clone to a live, production URL. Written for a solo developer / small team going live for the first time.

---

## 1. Architecture at a glance

InfoTag is three moving parts:

| Component | Tech | Port | Role |
|-----------|------|------|------|
| **Backend** | FastAPI (uvicorn) | `8001` | REST API under `/api/*`, plus server-side-rendered finder pages |
| **Frontend** | React PWA served by nginx | `3000` | Owner-facing app + PWA shell |
| **Database** | MongoDB 7 | `27017` | All persistent data |

Two things worth understanding before you deploy:

1. **Frontend and backend are separate origins.** nginx serves the SPA and does **not** proxy `/api` — the browser calls the backend directly using the `REACT_APP_BACKEND_URL` baked in at build time. This means **CORS must be configured** (`CORS_ORIGINS`) and `REACT_APP_BACKEND_URL` must point at your public API URL.
2. **The finder pages are server-rendered by the backend** (`/api/finder/{slug}`). When someone scans a QR sticker, they hit the backend directly, not the React app. So the backend must be publicly reachable on its own domain/subdomain.

---

## 2. Prerequisites

- A GitHub account with the repo (`an31and/InfoTag` after you rename it — see §9).
- A domain you control (see the domain note in §7).
- One of the two hosting paths below:
  - **Path A — Single VPS + Docker** (cheapest, most control).
  - **Path B — Managed (Railway + MongoDB Atlas + Cloudflare)** (fastest to live, less ops).
- Email sending credentials (SendGrid API key *or* SMTP).
- *(Optional, for WhatsApp alerts)* Meta Cloud API key and/or Twilio credentials.

---

## 3. Environment variables

The repo's `docker-compose.yml` references `backend/.env.example`, **but that file does not exist yet** — create it. Below is a complete, ready-to-use template. Copy it to `backend/.env` and fill in real values.

```dotenv
# ---- Core (required) ----
MONGO_URL=mongodb://mongo:27017          # Atlas: mongodb+srv://user:pass@cluster.../
DB_NAME=infotag
JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_STRING   # see warning below
SITE_URL=https://infotag.example.com     # public URL of the SSR/backend
FRONTEND_URL=https://app.infotag.example.com
CORS_ORIGINS=https://app.infotag.example.com

# ---- Seed admin (created on first boot) ----
ADMIN_EMAIL=you@yourdomain.com
ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# ---- Email (choose ONE) ----
EMAIL_FROM=no-reply@yourdomain.com
# Option 1: SendGrid
SENDGRID_API_KEY=
# Option 2: SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# ---- WhatsApp / SMS (optional) ----
WHATSAPP_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

> ⚠️ **Security-critical — `JWT_SECRET`.** The code falls back to a hardcoded default if this is unset. Session-token integrity depends entirely on this value. Generate a strong secret and set it in every environment:
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(48))"
> ```
> Never commit `.env`. Confirm `.env` is in `.gitignore`.

**Frontend build variable** (set at build time, not runtime):

```
REACT_APP_BACKEND_URL=https://infotag.example.com   # public API base
```

---

## 4. Path A — Self-host with Docker Compose (single VPS)

Best for: a $5–10/mo VPS (Hetzner, DigitalOcean, Linode) where you want everything in one place.

**Step 1 — Provision & install Docker**
```bash
# On a fresh Ubuntu 22.04+ box
curl -fsSL https://get.docker.com | sh
```

**Step 2 — Clone & configure**
```bash
git clone https://github.com/an31and/InfoTag.git
cd InfoTag
cp backend/.env.example backend/.env
nano backend/.env          # fill in real values from §3
```

**Step 3 — Point the frontend at the public API.** Edit `docker-compose.yml` so the frontend build arg and CORS use real URLs instead of `localhost`:
```yaml
  frontend:
    build:
      context: ./frontend
      args:
        REACT_APP_BACKEND_URL: "https://infotag.example.com"
```
And set `CORS_ORIGINS` in the backend service (or `.env`) to your frontend URL.

**Step 4 — Launch**
```bash
docker compose up --build -d
docker compose logs -f backend      # watch for "InfoTag API ready"
```

**Step 5 — Put it behind HTTPS.** Don't expose ports 3000/8001 raw. Run a reverse proxy (Caddy is the least-effort option — automatic TLS):

```
# Caddyfile
app.infotag.example.com {
    reverse_proxy localhost:3000
}
infotag.example.com {
    reverse_proxy localhost:8001
}
```
```bash
docker run -d --network host \
  -v $PWD/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data caddy
```

> 🔒 **Harden before going live:** In production, **do not publish MongoDB's port** (`27017`) to the host. Remove the `ports:` block from the `mongo` service so it's only reachable on the internal Docker network. The current `docker-compose.yml` exposes it for local dev convenience.

---

## 5. Path B — Managed cloud (Railway + Atlas + Cloudflare)

Best for: fastest route to live, minimal server maintenance. Matches the recommended stack.

**Step 1 — Database: MongoDB Atlas**
1. Create a free **M0** cluster.
2. Add a database user and note the connection string (`mongodb+srv://...`).
3. Under *Network Access*, allow your Railway egress IPs (or `0.0.0.0/0` temporarily, then tighten).
4. This becomes your `MONGO_URL`; set `DB_NAME=infotag`.

**Step 2 — Backend on Railway**
1. *New Project → Deploy from GitHub repo → InfoTag*, root set to `/backend`.
2. Railway auto-detects the Dockerfile (`EXPOSE 8001`, uvicorn CMD).
3. Add all backend env vars from §3.
4. Deploy; note the generated public URL → this is your `SITE_URL` and the frontend's `REACT_APP_BACKEND_URL`.

**Step 3 — Frontend on Railway (or Cloudflare Pages / Netlify)**
1. New service, root `/frontend`.
2. Set build arg `REACT_APP_BACKEND_URL` to the backend URL from Step 2.
3. Deploy. Note its URL → set `FRONTEND_URL` and `CORS_ORIGINS` on the backend and redeploy the backend.

**Step 4 — Cloudflare for DNS + SSL**
1. Add your domain to Cloudflare, update nameservers at your registrar.
2. Create records:
   - `infotag.example.com` → backend (proxied, orange cloud)
   - `app.infotag.example.com` → frontend (proxied)
3. SSL/TLS mode: **Full (strict)**.

---

## 6. Post-deploy verification (smoke test)

```bash
# 1. API is up
curl https://infotag.example.com/api/health          # expect {"status":"ok"} style 200

# 2. Public identity
curl https://infotag.example.com/api                  # {"name":"InfoTag API", ...}

# 3. Finder SSR renders (use a real seeded slug)
curl https://infotag.example.com/api/finder/<slug> | grep -i infotag

# 4. Frontend loads and PWA manifest is served
curl https://app.infotag.example.com/manifest.json    # "short_name":"InfoTag"

# 5. Admin login works (seeded from ADMIN_EMAIL/ADMIN_PASSWORD on first boot)
```

Then run the backend test suite against a staging target before trusting production:
```bash
cd backend && pip install -r requirements.txt && pytest tests/
```

---

## 7. Domain decision — read this before printing anything

The rename changed the **brand** to InfoTag, but the codebase still contains the **domain `tagit.in`** in several places that were intentionally left untouched, because a brand name and a registered domain are separate things:

- Default sender addresses (`no-reply@tagit.in`, `admin@tagit.in`)
- Seed/test admin emails (`anand@tagit.in`)
- **Printed on QR stickers**: the PDF generators print `"InfoTag · tagit.in"` and `"or visit tagit.in/api/finder/{slug}"`

You need to make a conscious choice:

1. **Keep `tagit.in`** as the operational domain — then the printed stickers will read `InfoTag · tagit.in` (brand and domain differ, which is common and fine).
2. **Move to a new domain** (e.g. `infotag.in`) — then register it, and update the domain string in `backend/routes/pdf_routes.py` (two `tagit.in/api/finder` strings + two footer strings) and `backend/notifications.py` / `backend/db.py` sender defaults.

Whatever you choose, the QR URL your stickers point to must match the domain where the **backend** is reachable, because scanning hits `/{domain}/api/finder/{slug}` directly.

---

## 8. Production hardening checklist

Before real users and real stickers:

- [ ] `JWT_SECRET` set to a strong random value in every environment.
- [ ] `ADMIN_PASSWORD` changed from any default; login verified.
- [ ] MongoDB **not** publicly exposed (no host `ports:` on the mongo service; Atlas network access restricted).
- [ ] `CORS_ORIGINS` set to your exact frontend origin(s) — not `*`.
- [ ] HTTPS everywhere; Cloudflare SSL mode Full (strict) or Caddy auto-TLS.
- [ ] Rate limiting on the public finder/owner-exposing endpoints. *(This was implemented earlier as `ratelimit.py` but is not committed in the current repo — re-add it before launch, since finder pages expose sensitive data like blood group, allergies, and emergency contacts.)*
- [ ] MongoDB indexes on hot collections (tag `slug`, user `email`). *(Flagged previously as a technical risk; add these to avoid full-collection scans under load.)*
- [ ] `.env` git-ignored and never committed.
- [ ] A backup strategy for MongoDB (Atlas has automated backups on paid tiers; for self-host, schedule `mongodump`).
- [ ] Basic uptime monitoring hitting `/api/health`.

---

## 9. Finishing the rename (manual steps I could not do for you)

The code rename is complete, but two things live outside the codebase:

1. **Rename the GitHub repo.** On GitHub: *Settings → Repository name → `InfoTag`*. Git redirects the old URL, but update any CI, deploy hooks, and your local remote:
   ```bash
   git remote set-url origin https://github.com/an31and/InfoTag.git
   ```
2. **The domain** — see §7.

Also note: the rename changed a few **identifiers**, not just display text:
- `DB_NAME` default is now `infotag` (was `tagit`). If you already have data in a `tagit` database, either keep `DB_NAME=tagit` or migrate: `mongodump --db tagit` then `mongorestore --db infotag`.
- localStorage keys (`infotag_lang`, `infotag_theme`) and the service-worker cache (`infotag-shell-v1`) changed. Pre-launch this is harmless; existing browsers would just re-pick defaults once.

---

## 10. Rollback

- **Docker (Path A):** `docker compose down` then redeploy the previous image tag / git commit.
- **Railway (Path B):** every deploy is a versioned snapshot — use *Deployments → Rollback*.
- **Database:** restore from the most recent `mongodump` / Atlas backup. Keep a fresh dump immediately before any launch-day change.

---

*Generated as part of the InfoTag rebrand. Adjust example domains/URLs to your own before use.*
