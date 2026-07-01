# InfoTag — privacy-first, no-app smart tags

> Lose less. Help more.  

InfoTag is a self-hostable web app + PWA that lets ordinary people stick a QR
sticker on their bike, pet's collar, luggage, keys or wallet — and lets a
kind person reach the owner if it's ever lost, **without installing an app**.

It also offers a **Medical Emergency Mode** so first responders can see blood
group, allergies and an emergency contact in seconds.

## Why

Most "smart tag" products lock finders into an app, expose owners' phone
numbers, or charge a subscription. InfoTag does none of those.

- **No app for finders.** Any phone camera. Open web page. Done.
- **PWA for owners.** Installable on Android/iOS via the web manifest.
- **Privacy-first.** Owner's phone number is never exposed; messages route
  via server-side relays. IPs are hashed.
- **Medical IDs with consent.** Wrong medical data is dangerous, so accuracy
  is a first-class concern: explicit consent + last-updated date.
- **Free and open-source (MIT).** Made in India 🇮🇳.

## Architecture

```
┌──────────────────┐    HTTPS+cookies     ┌────────────────────┐
│  React PWA       │ ───────────────────▶ │  FastAPI backend   │
│  (Tailwind, SW)  │ ◀─────────────────── │  (JWT + Mongo)     │
└──────────────────┘   JSON over /api      └─────────┬──────────┘
                                                     │
                                              ┌──────▼──────┐
                                              │  MongoDB    │
                                              └─────────────┘
```

- **Backend**: FastAPI + async Motor driver + JWT cookies + bcrypt
  passwords + Pydantic v2. Auto-docs at `/docs`.
- **Frontend**: React + Tailwind + shadcn/ui, configured as a PWA.
- **Database**: MongoDB. Collections: `users`, `tags`, `profiles`,
  `scans`, `messages`, `sponsors`, `login_attempts`.
- **Email/WhatsApp/Twilio**: optional, env-gated. Skipped silently if not
  configured; advanced-tier endpoints exist as placeholders.

## Run locally (one command)

```bash
cp backend/.env.example backend/.env
# edit JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, SITE_URL
docker compose up --build
```

Open `http://localhost:3000`. Sign in with the admin you set in `backend/.env`
— the backend boot-seeds it with three demo tags so you can scan immediately.

## Run without Docker

```bash
# 1. MongoDB
mongod --dbpath /tmp/infotag-db &

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then edit
uvicorn server:app --host 0.0.0.0 --port 8001

# 3. Frontend
cd frontend
yarn install
yarn start
```

## API quick tour

| Method | Endpoint                                | Auth       | Purpose                                  |
|-------:|-----------------------------------------|------------|------------------------------------------|
| POST   | `/api/auth/register`                    | none       | email/password signup                    |
| POST   | `/api/auth/login`                       | none       | email/password login                     |
| POST   | `/api/auth/google/session`              | none       | Exchange Emergent Google `session_id`    |
| GET    | `/api/auth/me`                          | cookie JWT | Current user                             |
| GET    | `/api/auth/export`                      | cookie JWT | Full data export (GDPR)                  |
| DELETE | `/api/auth/me`                          | cookie JWT | Right-to-be-forgotten (needs password)   |
| GET    | `/api/tags`                             | cookie JWT | List owner's tags                        |
| POST   | `/api/tags`                             | cookie JWT | Create a tag                             |
| GET    | `/api/tags/{id}/qr.png`                 | cookie JWT | QR PNG                                   |
| GET    | `/api/tags/{id}/pdf?layout=a4_stickers` | cookie JWT | Sticker PDF (a4_stickers/id_card/keyring)|
| GET    | `/api/public/tags/{slug}`               | none       | Finder view + records a scan             |
| POST   | `/api/public/tags/{slug}/messages`      | none       | Finder → owner anonymous message         |
| POST   | `/api/sponsors`                         | none       | Pledge to sponsor printed stickers       |

Full reference: `http://localhost:8001/docs`.

## Folder layout

```
/app
├── backend/                FastAPI + MongoDB
│   ├── server.py
│   ├── auth.py             JWT + bcrypt
│   ├── db.py               Mongo client + indexes + seed
│   ├── notifications.py    Email (env-gated)
│   ├── routes/             auth, tag, profile, message, pdf, sponsor
│   ├── tests/              pytest suite (33 tests)
│   ├── seed.py             Standalone seed script
│   ├── Dockerfile
│   └── .env.example
├── frontend/               React PWA
│   ├── src/
│   │   ├── App.js
│   │   ├── lib/            auth, i18n, theme, api
│   │   ├── components/     AppShell, LanguageSwitcher, ThemeToggle
│   │   └── pages/          Landing, Auth, Dashboard, TagEdit, TagQR,
│   │                       TagMedical, Inbox, Settings, Finder, Claim, Legal
│   ├── public/             manifest.json, sw.js, index.html
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── LICENSE                 MIT
├── CONTRIBUTING.md
└── README.md
```

## Roadmap

- Real WhatsApp notifications (BSP integration) behind a paid-tier flag.
- Twilio masked-calling for the "Call owner" action.
- Server-side render the Finder page to hit the <75 KB 3G budget.
- Native React Native wrapper that reuses the FastAPI backend.

## License

MIT — see [`LICENSE`](./LICENSE). 

## Maintainer

**Anand Lakhera** — an.31and@gmail.com · +91 89042 23100  
Want to sponsor a batch of free physical stickers? Use the form on the
landing page or email directly. 🇮🇳
