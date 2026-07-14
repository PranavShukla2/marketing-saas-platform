# ArbFlow — Marketing Agency Analytics SaaS !!

ArbFlow is a multi-tenant analytics platform for marketing agencies. Connect a
client's data sources, and ArbFlow unifies them into clean, white-labelable
dashboards. Each client's API credentials are **encrypted at rest** and every
account is fully isolated.

Google Analytics 4 is a live, real-data integration today. Meta (Facebook /
Instagram / Ads) and LinkedIn dashboards are fully built and run on rich sample
data, ready to swap in live data once their backend integrations land.

> **Docs:** see [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how it all fits
> together, and [`docs/auth-audit.md`](./docs/auth-audit.md) for the security
> review of the auth flow.

## ✨ Features

- **Multi-tenant, isolated workspaces** — one agency, many clients, no data bleed.
- **Live GA4 dashboards** — users, sessions, revenue, channels, geography,
  devices, pages, events, funnels and more across five sections (Overview,
  Audience, Acquisition, Behavior, Conversions).
- **Meta workspace** — Facebook, Instagram and Ads views with the full metric set
  (on sample data, ready for live).
- **Google OAuth sign-in** — one click, auto-connects GA4 (read-only scopes).
- **Encryption at rest** — OAuth tokens sealed with Fernet (AES) before they
  touch the database; passwords hashed with bcrypt.
- **Hardened auth** — rate limiting, timing-safe login (no account enumeration),
  hashed single-use OAuth codes, signed OAuth state, server-side validation.
- **Flo, your guide** — an in-app assistant that walks you through the workspace.
- **Report export** — branded PDF / CSV.
- **Account controls** — GDPR-style account deletion, Privacy Policy & Terms.
- **Tested & CI'd** — a pytest suite + GitHub Actions on every push.

## 🛠️ Tech stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts |
| **Backend** | FastAPI (Python 3.12), SQLAlchemy, Pydantic, Alembic |
| **Database** | SQLite (local) · PostgreSQL / Neon (production) |
| **Auth & security** | JWT, Fernet (AES) encryption, bcrypt, per-IP rate limiting |
| **Integrations** | Google Analytics 4 (Data + Admin APIs), Google OAuth |
| **Infra** | Vercel (frontend), Render (backend), Neon (DB), GitHub Actions (CI) |

## 🏁 Getting started

### Prerequisites
- Node.js 20+, Python 3.12+

### 1. Clone
```bash
git clone https://github.com/PranavShukla2/marketing-saas-platform.git
cd marketing-saas-platform
```

### 2. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env        # then fill it in (see below)
uvicorn app.main:app --reload --port 8000
```

Fill `backend/.env`. The two secrets are **required** — the app refuses to start
without them:
```bash
# generate a JWT secret
python -c "import secrets; print(secrets.token_urlsafe(48))"
# generate a valid Fernet encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
Set `DATABASE_URL`, `JWT_SECRET_KEY`, `ENCRYPTION_KEY`, and (for Google sign-in)
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. See `.env.example` for the rest.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```
Optionally set `NEXT_PUBLIC_API_URL` (defaults to the local backend on
`http://localhost:8000`, or the prod Render URL when deployed).

### Or run both at once
```bash
./start.sh             # backend :8000 + frontend :3000
```

## 🗄️ Database migrations

Alembic is the source of truth for schema changes:
```bash
cd backend
alembic upgrade head                              # apply migrations
alembic revision --autogenerate -m "your change" # after editing models
```
See [`backend/alembic/README.md`](./backend/alembic/README.md) (including the
one-time `alembic stamp head` for an existing database).

## ✅ Testing & CI

```bash
cd backend && python -m pytest -q     # hermetic; no .env needed
cd frontend && npm run build          # production build
```
GitHub Actions runs the backend tests and a frontend build on every push / PR.

## 🚀 Deployment

- **Frontend → Vercel**: set `NEXT_PUBLIC_API_URL` to the backend URL.
- **Backend → Render**: uses `render.yaml`; set the `sync: false` secrets in the
  dashboard (`ENCRYPTION_KEY`, `DATABASE_URL`, `GOOGLE_CLIENT_ID/SECRET`,
  `FRONTEND_URL`). Run `alembic upgrade head` on release.
- **Database → Neon Postgres**: enable backups.
- **Google Cloud Console**: authorized redirect URI must equal
  `<BACKEND_URL>/api/v1/integrations/google/callback`, with the Analytics
  **Admin API** and **Data API** enabled.

## 📈 Status

Actively developed. GA4 is live; Meta/LinkedIn integrations, billing (Stripe),
team management, and anomaly alerts are on the roadmap. See
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for current limitations.

## 📄 License

© 2026 ArbFlow Systems · built by Pranav Shukla.
