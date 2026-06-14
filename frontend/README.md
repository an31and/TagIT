# TagIT — frontend (React PWA)

React + Tailwind PWA. Installable on Android/iOS via the web manifest, but
**finders never need to install anything** — they just open the QR URL.

## Stack
- Create React App (craco) + React 18
- Tailwind CSS + shadcn/ui
- Service worker for app-shell caching

## Quick start
```bash
yarn install
cp .env.example .env  # set REACT_APP_BACKEND_URL
yarn start
```
Open `http://localhost:3000`.

## Pages
See the root [README](../README.md) for the full route table.

## i18n
Dictionaries live in `src/lib/i18n.jsx`. English, Hindi, Marathi, Bengali, Tamil ship out of the box. Missing keys fall back to English.

## Service worker
`public/sw.js` caches `/`, `/index.html` and `/manifest.json`. Never caches `/api/*`.
