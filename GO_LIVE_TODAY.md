# InfoTag — Go Live TODAY at ₹0/month

Stack: **MongoDB Atlas M0 (free) + Render free web service (backend) +
Cloudflare Pages (frontend) + your domain `info-tag.in`**.
Total monthly cost: **₹0** (domain renewal is the only recurring cost you
already pay). Time required: ~60–90 minutes.

> **The one honest tradeoff:** Render's free tier puts the backend to sleep
> after 15 minutes of inactivity; the first request after that takes
> ~30–60 s. For a QR-scan product that's bad UX, so Step 7 keeps it warm
> with a free uptime pinger. When you get real traction, upgrade the
> backend to Render Starter (~US$7/mo) or move to a small VPS — nothing
> else changes.

---

## Step 0 — Push the updated code (5 min)

```bash
# unzip InfoTag-updated.zip over your local clone, review the diff, then:
git add -A
git commit -m "Admin portal, visitor/scan/found stats, feedback, landing update"
git push origin main
```

## Step 1 — MongoDB Atlas free cluster (10 min)

1. https://www.mongodb.com/cloud/atlas → sign up → **Create** → choose
   **M0 Free**, provider AWS, region **Mumbai (ap-south-1)** (closest to
   your users).
2. Security → Database Access → **Add New Database User** → username
   `infotag`, click *Autogenerate Secure Password* — save it.
3. Security → Network Access → **Add IP Address** → `0.0.0.0/0`
   (allow from anywhere — required because Render's egress IPs rotate;
   auth is enforced by the strong password + TLS).
4. Database → **Connect** → *Drivers* → copy the connection string:
   `mongodb+srv://infotag:<password>@cluster0.xxxxx.mongodb.net/`

## Step 2 — Generate your secrets (2 min)

```bash
python3 -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(48))"
```
Also decide your **ADMIN_PASSWORD** — long and unique. This pair
(`anandlakhera@info-tag.in` + this password) is your admin-portal login.

## Step 3 — Deploy the backend on Render (15 min)

1. https://render.com → sign up with GitHub → **New → Web Service** →
   select `an31and/InfoTag`.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker (it auto-detects `backend/Dockerfile`)
   - **Instance Type:** Free
3. Environment variables:

   | Key | Value |
   |---|---|
   | `MONGO_URL` | your Atlas string (with password filled in) |
   | `DB_NAME` | `infotag` |
   | `JWT_SECRET` | from Step 2 |
   | `ADMIN_EMAIL` | `anandlakhera@info-tag.in` |
   | `ADMIN_PASSWORD` | from Step 2 |
   | `SITE_URL` | `https://api.info-tag.in` |
   | `FRONTEND_URL` | `https://info-tag.in` |
   | `CORS_ORIGINS` | `https://info-tag.in,https://www.info-tag.in` |

4. Deploy. When it's live, open
   `https://<your-service>.onrender.com/api/health` → should return
   `{"ok": true, ...}`.
5. Render → your service → **Settings → Custom Domains** → add
   `api.info-tag.in`. Render shows you a CNAME target — you'll add it in
   Step 5.

## Step 4 — Deploy the frontend on Cloudflare Pages (15 min)

1. https://dash.cloudflare.com → **Workers & Pages → Create → Pages →
   Connect to Git** → select the repo.
2. Build settings:
   - **Root directory:** `frontend`
   - **Build command:** `yarn install && yarn build`
   - **Build output directory:** `build`
   - **Environment variable:** `REACT_APP_BACKEND_URL=https://api.info-tag.in`
     (⚠️ baked in at build time — if you ever change it, re-deploy)
3. Deploy → you get `something.pages.dev`. Verify the landing page loads.
4. Pages project → **Custom domains** → add `info-tag.in` and
   `www.info-tag.in`.

> Why Cloudflare Pages over Vercel/Netlify: unlimited free bandwidth,
> and if your DNS is on Cloudflare, custom domains are one click.

## Step 5 — DNS (10 min)

If `info-tag.in` DNS isn't already on Cloudflare, move it (free plan):
Cloudflare → Add site → it imports records → change nameservers at your
registrar (GoDaddy/Namecheap/whoever). Propagation: minutes to a few hours.

Records to have:
- `info-tag.in` → CNAME → your Pages project (Cloudflare adds this
  automatically when you attach the custom domain)
- `www` → CNAME → same
- `api` → CNAME → `<your-service>.onrender.com` (**set the cloud to
  "DNS only" / grey**, not proxied — Render manages its own TLS)

HTTPS is automatic on both platforms. Nothing to configure.

## Step 6 — Smoke test (10 min)

1. `https://info-tag.in` — landing loads, live-stats strip appears,
   footer shows your email + founder line.
2. Sign in with `anandlakhera@info-tag.in` + your ADMIN_PASSWORD →
   an **Admin** tab appears in the nav → `https://info-tag.in/admin`
   shows the dashboard.
3. Open a demo tag → QR page → scan the QR with your phone →
   the finder page loads from `api.info-tag.in` → send a test message.
4. Admin portal → scan count and message count moved.
5. Submit feedback from the landing page → approve it in the admin
   portal → refresh landing → it appears under "What people say".

## Step 7 — Keep the free backend awake (5 min)

https://uptimerobot.com (free) → **Add Monitor** → HTTP(s) →
`https://api.info-tag.in/api/health` → interval **5 minutes**.
This doubles as downtime alerting on the endpoint that matters most
(if scans are down, the product is down).

## Step 8 — Email notifications (optional, do this week)

Owner "your tag was scanned/messaged" emails are env-gated and currently
off. Free option: **Brevo** (300 emails/day free) → get SMTP credentials →
add to Render env: `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`,
`SMTP_USER=...`, `SMTP_PASS=...`, `EMAIL_FROM=no-reply@info-tag.in` →
redeploy. Add Brevo's SPF/DKIM DNS records so mail lands in inboxes.

---

## Cost summary

| Item | Cost |
|---|---|
| MongoDB Atlas M0 | ₹0 |
| Render free web service | ₹0 |
| Cloudflare Pages + DNS | ₹0 |
| UptimeRobot | ₹0 |
| Brevo email (optional) | ₹0 |
| **Total** | **₹0/month** |

**Upgrade path when you outgrow free:** Render Starter (~US$7/mo) kills
cold starts entirely; later, a ₹400–800/mo VPS (Hetzner/DigitalOcean) with
your existing `docker-compose.yml` runs everything on one box — as a
DevOps engineer that migration is an afternoon for you, and the code
needs zero changes.
