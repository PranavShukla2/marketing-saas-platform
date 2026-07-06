# ArbFlow — Architecture

A living document describing how ArbFlow is built. It will change as the product
evolves; treat it as the current map, not a contract.

## Overview

ArbFlow is a multi-tenant marketing-analytics SaaS for agencies. An agency signs
up, connects a client's data sources (Google Analytics 4 today; Meta and
LinkedIn are next), and ArbFlow unifies them into clean, white-labelable
dashboards. Each client's API credentials are **encrypted at rest**, and every
account is isolated.

The mascot, **Flo** (a purple water-drop), appears on the landing page and as an
in-app guide.

```
                    ┌──────────────────────────────────────┐
   Browser  ──────► │  Next.js frontend (Vercel)            │
                    │  marketing site + authed workspace    │
                    └───────────────┬──────────────────────┘
                                    │  HTTPS  /api/v1/*  (Bearer JWT)
                                    ▼
                    ┌──────────────────────────────────────┐
                    │  FastAPI backend (Render)            │
                    │  auth · integrations · analytics ·   │
                    │  workspace  +  /health               │
                    └───────┬───────────────────┬──────────┘
                            │                   │
              ┌─────────────▼─────┐   ┌─────────▼──────────────┐
              │ Postgres (Neon)   │   │ Google APIs (GA4 Data  │
              │ users, integr-    │   │ + Admin), OAuth        │
              │ ations, authcodes │   │ (Meta/LinkedIn later)  │
              └───────────────────┘   └────────────────────────┘
```

## Tech stack

**Frontend** (`frontend/`)
- Next.js 16 (App Router, Turbopack) + React 19, TypeScript
- Tailwind CSS v4, Framer Motion v12 (all animation)
- Recharts (dashboards), jsPDF / jspdf-autotable (report export)
- Fonts: Inter (body) + Caveat (handwritten annotations) via `next/font`

**Backend** (`backend/`)
- FastAPI + Uvicorn, Python 3.12
- SQLAlchemy ORM; **Alembic** for migrations
- **SQLite** locally, **Postgres (Neon)** in production
- Auth: JWT (PyJWT), bcrypt password hashing (passlib)
- Credential encryption: **Fernet** (`cryptography`)
- Google Analytics **Data** + **Admin** APIs (`google-analytics-data`, `google-analytics-admin`, `google-auth`)
- Optional error tracking: Sentry (enabled only if `SENTRY_DSN` is set)

**Infra**: Vercel (frontend), Render (backend), Neon (Postgres). GitHub Actions
for CI.

## Repository layout

```
backend/
  app/
    main.py            FastAPI app, CORS, router registration, /health, Sentry
    core/
      config.py        loads .env, fails fast on missing secrets
      security.py      password hashing, JWT, Fernet encrypt/decrypt
      oauth.py         signed OAuth state + hashed single-use auth codes
      ratelimit.py     in-memory per-IP rate limiter
    db/
      database.py      engine/session from DATABASE_URL, get_db dependency
      models.py        User, Integration, AuthCode
    api/
      auth.py          register/login/google-login/exchange, me (GET+DELETE)
      integrations.py  OAuth connect flows (google/meta/linkedin)
      analytics.py     GET /dashboard — live GA4 data
      workspace.py     campaigns/team/billing (derived from GA4)
      deps.py          shared deps (get_current_user)
    services/          per-provider fetchers (google_analytics real; meta/linkedin stubs)
    schemas.py         Pydantic request/response models + validation
  alembic/             migrations (baseline + future revisions)
  tests/               pytest suite (auth, security, health)
frontend/
  src/
    app/
      (marketing)/     public: landing, pricing, about, privacy, terms, login, register
      (app)/           authed: dashboard, campaigns, reports, billing, team, settings, integrations
    components/        app chrome + dashboards (Sidebar, MetaDashboard, ...)
      landing/         landing-page system (Flo, PhoneChat, PinnedShowcase, ...)
      workspace/       primitives (KpiCard, SectionCard, BarList) + FloAssistant
    lib/
      auth.ts          getApiUrl() + OAuth auth-code exchange
      demoData.ts      sample GA4 dataset (shape mirrors the API)
      metaDemoData.ts  sample Meta dataset
docs/
  auth-audit.md        security + UX audit of the auth flow
ARCHITECTURE.md        this file
```

## Data model (`backend/app/db/models.py`)

- **User** — an agency account: `company_name`, `email` (unique, stored
  lowercase), `hashed_password` (bcrypt). Has many Integrations.
- **Integration** — a connected data source: `provider`, `property_id`,
  `encrypted_credentials` (a Fernet-encrypted JSON blob of the OAuth tokens),
  FK to User.
- **AuthCode** — a single-use, short-lived (120s) code swapped for a JWT after
  OAuth sign-in. Stored as a **sha256 hash**, deleted on first use.

Schema changes go through Alembic (`backend/alembic/README.md`).

## API surface (all under `/api/v1`)

- `auth`: `POST /register`, `POST /login`, `GET /google/login`, `POST /exchange`,
  `GET /me`, `DELETE /me`
- `integrations`: `GET /{google,meta,linkedin}/link` + `/callback`
- `analytics`: `GET /dashboard`
- `workspace`: `GET /campaigns`, `/team`, `/billing`
- top-level: `GET /health` (pings the DB; 503 when unreachable)

## Authentication & OAuth flow

Two ways in, both ending in a 24-hour JWT delivered as an **httpOnly, Secure,
SameSite=Lax session cookie** (`arbflow_session`) — JS can never read it:

1. **Email / password** — `POST /register` then `POST /login` (login response
   sets the cookie).
2. **Google sign-in** — the frontend calls `GET /auth/google/login` to get a
   Google consent URL carrying a **signed `state`** (a short-lived JWT encoding
   the flow's intent, so callbacks can't be forged). After consent, Google
   redirects to `/integrations/google/callback`, which:
   - verifies the signed `state`,
   - exchanges the code for tokens (encrypted and stored),
   - **auto-connects GA4** and finds/creates the user by verified email,
   - mints the session JWT but hands the browser a **single-use `auth_code`** in
     the redirect URL (never the JWT itself),
   - the frontend `POST`s that code to `/auth/exchange`, whose response sets the
     session cookie.

**Why the cookie works cross-deployment:** the browser never calls the Render
origin directly. All API calls go through a **same-origin Next.js rewrite proxy**
(`/api/backend/* → the FastAPI backend`, see `next.config.ts`), so the cookie is
*first-party* in every browser — including Safari, which blocks third-party
cookies. `get_current_user` also still accepts `Authorization: Bearer` for API
clients, and `POST /auth/logout` clears the cookie. CSRF: SameSite=Lax plus a
middleware that rejects cookie-carrying state-changing requests with a foreign
`Origin`. Note the rewrite destination is **baked at build time** — changing the
backend URL requires a frontend rebuild.

`AuthGuard` (frontend) gates the authed routes: it runs the auth-code exchange,
else asks `GET /auth/me` whether the session cookie is live, else redirects to
`/login`.

### GA4 connection status
`GET /analytics/dashboard` returns a `status` the workspace maps to a banner:
`active` (live data), `pending_integration` (never connected), `reauth_required`
(token refresh failed), `no_properties` (no GA4 property on the account),
`no_access` (Admin/Data API disabled or no access). The backend **proactively
refreshes** the Google access token each load (tokens expire ~1h and no expiry
is persisted) and re-encrypts the new one.

## Frontend architecture

- **Route groups**: `(marketing)` is the public site with a shared Navbar/Footer
  layout; `(app)` wraps everything in `AuthGuard` + `Sidebar` (a fixed rail on
  desktop, a slide-in drawer on mobile).
- **The workspace** (`app/(app)/dashboard/page.tsx`) is the core screen: a
  segmented **source switcher** (Google Analytics / Meta / LinkedIn), GA4
  **section tabs** (Overview, Audience, Acquisition, Behavior, Conversions), and
  a Meta view with **Facebook / Instagram / Ads** sub-tabs. It renders live data
  when connected, otherwise rich **sample data** (`lib/demoData.ts`,
  `lib/metaDemoData.ts`) with a clear "sample data" banner — the datasets mirror
  the API shapes, so a live integration drops straight in.
- **Shared UI kit** (`components/workspace/primitives.tsx`): `KpiCard`,
  `SectionCard`, `BarList`, `Sparkline`.
- **Flo assistant** (`components/workspace/FloAssistant.tsx`): a step-by-step
  guide that closes with a "water-drop" vanish and can be reopened.
- **Landing system** (`components/landing/`): an animated, reduced-motion-aware
  marketing page (Flo mascot, 3D phone mockup, bento features, a pinned
  scroll showcase, FAQ). Animations are transforms/opacity only (60fps); the
  reduced-motion path is handled via CSS media queries + `useReducedMotion`.

## Security posture

See `docs/auth-audit.md` for the full audit. In short:
- Passwords hashed with bcrypt; OAuth tokens **encrypted at rest** (Fernet).
- Login is **timing-safe** (constant bcrypt work even for unknown emails) and
  returns an identical 401 for wrong-password vs unknown-email (no enumeration).
- **Rate limiting** on login / register / exchange (per-IP, in-memory).
- Auth codes stored **hashed**, single-use, short-lived.
- OAuth `state` is a **signed** token; the callback handles user-cancel; all
  outbound Google calls have timeouts.
- Emails normalized to lowercase everywhere; server-side input validation
  (Pydantic) independent of the browser.
- CORS is scoped to our own origins (localhost + our deployments); the same
  allow-list backs the **CSRF Origin check** on cookie-authed writes.
- **Sessions are httpOnly cookies** behind a same-origin proxy — XSS can't read
  the token (the old localStorage tradeoff is closed). Security headers (HSTS,
  frame denial, a production CSP) on both apps.
- Secrets (`JWT_SECRET_KEY`, `ENCRYPTION_KEY`) are required at startup — the app
  fails fast if missing.

## Testing & CI

- **`backend/tests/`** — pytest suite (auth flow, rate limiting, timing/
  enumeration, encryption round-trip, OAuth state, hashed single-use codes,
  health). Hermetic: throwaway secrets + a temp SQLite DB, no `.env` needed.
- **GitHub Actions** (`.github/workflows/ci.yml`) — runs backend pytest and a
  frontend production build on every push/PR to `main`.

Run locally:
```bash
cd backend && python -m pytest -q
cd frontend && npm run build
```

## Configuration (environment variables)

**Backend** (`backend/.env`, see `.env.example`):
- `DATABASE_URL`, `JWT_SECRET_KEY` *(required)*, `ENCRYPTION_KEY` *(required —
  a valid Fernet key)*, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`,
  `BACKEND_URL`, `FRONTEND_URL`, optional `CORS_ORIGINS`, optional `SENTRY_DSN`.

**Frontend**: the browser talks to the same-origin `/api/backend/*` proxy; its
destination comes from `API_PROXY_TARGET` at **build time** (defaults to
localhost:8000 in dev, the prod Render URL otherwise). `NEXT_PUBLIC_API_URL`
now only feeds the CSP `connect-src`.

**Google Cloud Console**: the authorized redirect URI must equal
`<BACKEND_URL>/api/v1/integrations/google/callback`, and the project needs the
**Analytics Admin API** and **Data API** enabled.

## Deployment

- **Frontend** → Vercel (no API env needed — the proxy defaults to the prod
  backend; set `API_PROXY_TARGET` only to point elsewhere, then redeploy).
- **Backend** → Render (`render.yaml`; set the `sync: false` secrets in the
  dashboard). Migrations run via the blueprint's `preDeployCommand`
  (`alembic upgrade head`).
- **Database** → Neon Postgres (enable backups; never rely on Render's ephemeral
  SQLite for anything that must persist).

## Current limitations / roadmap

- **Meta & LinkedIn** run on sample data — the frontends are ready; the backend
  OAuth + Graph/Marketing API services are still stubs.
- **Billing / team** pages are placeholders (no Stripe, single-owner team yet).
- **Anomaly alerts** (advertised on the landing page) aren't implemented yet.
- Access tokens are 24h with no refresh-token rotation / server-side revocation
  yet; the rate limiter is per-process (needs Redis before horizontal scaling).

A fuller production-readiness plan is tracked privately by the maintainer.
