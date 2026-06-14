# Contributing to TagIT

Thanks for wanting to help. TagIT is a free, public-service project — every
small fix matters.

## Code of conduct
Be kind. Assume good intent. This project exists to help ordinary people; we
hold each other to the same standard.

## Getting set up
```bash
git clone https://github.com/<you>/tagit
cd tagit
cp backend/.env.example backend/.env
docker compose up --build
```
Open `http://localhost:3000`. Default admin is created from the
`ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `backend/.env`.

## Running tests
```bash
# Backend
cd backend && pip install -r requirements.txt
pytest -q

# Frontend
cd frontend && yarn install && yarn test --watchAll=false
```

## Branches & PRs
- `main` is always deployable.
- Branch from `main`, name your branch `feature/<short>` or `fix/<short>`.
- Keep PRs focused (one feature/fix). Add tests where reasonable.

## Things we'd love help with
- **i18n** — drop in your language dictionary at
  `frontend/src/lib/i18n.jsx`. Even partial translations are welcome.
- **Accessibility audits** of the public Finder page (it must work on
  budget Android phones, on 3G, with screen readers).
- **Print templates** for stickers — PVC tags, weather-resistant variants.
- **Bug bounties for security** — please report privately to
  an.31and@gmail.com before opening an issue.

## License
By contributing you agree your contributions will be licensed under the
MIT License (see [`LICENSE`](./LICENSE)).
