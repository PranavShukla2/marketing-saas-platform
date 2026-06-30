# CLAUDE.md

Guidance for working in this repo. Read this first.

## Project overview

**ArbFlow** is a multi-tenant marketing-analytics SaaS for agencies. An agency
connects a client's data sources (GA4, Meta, LinkedIn), and ArbFlow unifies them
into white-labeled dashboards plus plain-English alerts about what changed. Each
client lives in an isolated workspace and their API credentials are encrypted at
rest.

The mascot is **Flo**, a purple water-drop character used throughout the landing
page.

Deployed: frontend on Vercel (`marketing-saas-platform-*.vercel.app`), backend
intended for Render.

## Tech stack

**Frontend** (`frontend/`)
- Next.js 16 (App Router, Turbopack) + React 19, TypeScript, Tailwind CSS v4
- Framer Motion (`framer-motion` v12) for all animation
- recharts (dashboards), jspdf / jspdf-autotable (report export), matter-js (present but minor)
- Fonts: Inter (body) + Caveat (handwritten annotations), via `next/font/google`

**Backend** (`backend/`)
- FastAPI + Uvicorn, Python 3.12
- SQLAlchemy ORM; **SQLite** locally (`backend/saas.db`), Postgres in docker-compose / prod
- Auth: JWT (PyJWT / python-jose), bcrypt password hashing (passlib)
- Credential encryption: **Fernet** (`cryptography`)
- Google Analytics Data/Admin APIs (`google-analytics-data`, `google-auth`) for real GA4

## Running it

```bash
# Both services together (from repo root)
./start.sh                       # backend :8000 (uvicorn --reload) + frontend :3000

# Or separately:
cd backend && uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev        # http://localhost:3000

# Frontend checks
cd frontend && npm run build      # production build
cd frontend && npm run lint       # eslint
cd frontend && npx tsc --noEmit   # typecheck (see Known issues — currently has pre-existing errors)
```

Backend requires `backend/.env` (gitignored). Copy `backend/.env.example` and fill
in: `DATABASE_URL`, `JWT_SECRET_KEY`, `ENCRYPTION_KEY` (the two secrets are
**required** — the app fails fast at startup if missing), plus
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` for OAuth. Generate an encryption key
with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`.

## Architecture

### Backend layout (`backend/app/`)
- `main.py` — FastAPI app, CORS (explicit allow-list of frontend origins, not `*`), router registration under `/api/v1/*`, `create_all` on startup
- `core/config.py` — loads `.env`, fails fast on missing required secrets (`JWT_SECRET_KEY`, `ENCRYPTION_KEY`)
- `core/security.py` — password hashing, JWT, and `encrypt_credentials` / `decrypt_credentials` (Fernet)
- `core/oauth.py` — Google OAuth helpers
- `db/database.py` — engine/session from `DATABASE_URL`, `get_db` dependency
- `db/models.py` — 3 tables (see below)
- `api/` — `auth`, `integrations`, `analytics`, `workspace` routers; `deps.py` holds shared deps (current-user)
- `services/` — per-provider data fetchers: `google_analytics.py` (real), `meta_ads.py`, `linkedin_service.py`, `google_ads.py`
- `scripts/migrate_encrypt_credentials.py` — one-off, idempotent migration that encrypts any legacy plaintext `Integration.encrypted_credentials` rows

### Data model (`db/models.py`)
- `User` — agency account (company_name, email, hashed_password); has many Integrations
- `Integration` — provider + property_id + `encrypted_credentials` (Fernet-encrypted JSON blob), FK to User
- `AuthCode` — single-use, short-lived code swapped for a JWT after OAuth (callback puts opaque `?auth_code=` in the URL; frontend POSTs it to `/auth/exchange`, row deleted on first use)

### Key API routes (all under `/api/v1`)
- `auth`: `POST /register`, `POST /login`, `GET /google/login`, `POST /exchange`
- `integrations`: `GET /{google,meta,linkedin}/link` + `/callback` (OAuth connect flows)
- `analytics`: `GET /dashboard`
- `workspace`: `GET /campaigns`, `/team`, `/billing`

### Frontend structure (`frontend/src/`)
- `app/(marketing)/` — public site: landing (`page.tsx`), `pricing`, `about`, `login`, `register`; shared `layout.tsx` with Navbar/Footer
- `app/(app)/` — authenticated app: `dashboard`, `integrations`, `campaigns`, `reports`, `billing`, `team`, `settings`; `layout.tsx` wraps children in `AuthGuard`
- `components/AuthGuard.tsx` — client-side gate: exchanges OAuth `auth_code`, else checks `localStorage` token, redirects to `/login` if absent
- `components/` — app chrome + dashboards: `Navbar`, `Footer`, `Sidebar`, `AppleAnalyticsDashboard`, `MetaDashboard`, `LinkedInDashboard`, `PlatformLoader`, `BentoBox`, `FaqSection`
- `components/landing/` — the landing-page system (see below)
- `lib/auth.ts` — `getApiUrl()` + OAuth `auth_code` exchange helpers

### Landing page system (`components/landing/`)
The marketing landing (`app/(marketing)/page.tsx`) composes these. Section order:
Hero → InsightCards → IntegrationsMarquee → PhoneChat → Features (BentoFeatures) →
PinnedShowcase → StatsStrip → AboutSection → FaqSection → FinalCta, with FloatingFlo persistent.

- `Flo.tsx` / `FloatingFlo.tsx` — the mascot. Tap = ~1.2s 3D `rotateY` turn (80ms wind-up → spring) with a staggered star burst; debounced via a ref so rapid taps don't stack. Identical timing in both.
- `PhoneChat.tsx` — iPhone mockup, `clamp()` width + `9/19.5` aspect-ratio, 3D tilt with pointer-parallax (mouse only, off under reduced motion), diagonal sheen, directional shadow.
- `BentoFeatures.tsx` — 5-tile CSS-grid bento with mini live visuals (spinning sync, sparkline, typing dots, recoloring swatches, anomaly chart). Staggered scale-reveal.
- `PinnedShowcase.tsx` — the "expand-then-contract" pinned scroll section (`min-h-[150vh] lg:min-h-[240vh]`, sticky). Central `FeatureDashboardCard` scales up then down via `useScroll`/`useTransform`; 6 satellite chart cards (donut, sparkline, alert, bars, live counter, AES badge) slide in/out from both sides at staggered scroll windows. Has a scroll-fading title and a reduced-motion static fallback.
- `Annotation.tsx` — handwritten (Caveat) marker text + a hand-drawn SVG arrow that draws itself in (`pathLength`). `Sticker.tsx` — small rotated vibrant pill accents.
- Supporting: `FeatureDashboardCard`, `StatsStrip`, `InsightCards`, `IntegrationsMarquee`, `GlowBlobs`, `AboutSection`, `FaqSection`, `FinalCta`, `CountUp`.

### Animation conventions
- Transforms/opacity only (60fps); scroll work via `useScroll` + `useTransform`.
- **Reduced motion**: class-based animations are defined in `globals.css` and disabled in its `@media (prefers-reduced-motion: reduce)` block — prefer adding a CSS class over gating it in JS. Inline `style={{ animation }}` bypasses that block, so gate those in JS on the `useReducedMotion()` value. Scroll/parallax/spins are all gated off under reduced motion.

## Current state

- **Landing page**: fully redesigned and the main focus of recent work — polished, animated, responsive, reduced-motion-aware.
- **Auth**: email/password register + login, and Google OAuth sign-in (auth-code exchange) are wired end to end.
- **Integrations**: Google/GA4 is a real OAuth + data flow. **Meta and LinkedIn are mocked** (placeholder tokens like `mock_meta_token_123` in `api/integrations.py`); their dashboards run on mock metrics.
- **App dashboards**: GA4, Meta, LinkedIn dashboard components exist and render (mock data where the provider isn't real yet).
- Credential encryption (Fernet) is live; the one-off migration script exists for legacy rows.

## Known issues / TODOs

1. **Dev-only hydration mismatch under `prefers-reduced-motion`.** `useReducedMotion()` returns `null` on the server and resolves on the client, so components that gate a class string on it (several across the page) trigger Next's recoverable hydration overlay — *only* in dev *and* only with OS reduced-motion enabled. Not present in production; React reconciles. `Sticker.tsx` was already converted to the CSS-driven approach. Proper fix: a shared `useMounted()` gate (or move all class gating into the CSS media query) across the components that still branch on `useReducedMotion`.
2. **Pre-existing TypeScript errors (~17).** `tsc --noEmit` fails on `ease: number[]` cubic-bezier arrays that need `as const` (e.g. `app/(marketing)/about/page.tsx` and other route files). Turbopack/dev is lenient so the app runs; a CI typecheck would fail. None are in the landing components.
3. **Deploy env / OAuth config.** `render.yaml` now provisions the right keys (`JWT_SECRET_KEY` auto-generated; `ENCRYPTION_KEY`, `DATABASE_URL`, `GOOGLE_CLIENT_ID/SECRET`, `FRONTEND_URL` are `sync: false` and must be set in the Render dashboard). The frontend needs `NEXT_PUBLIC_API_URL` on Vercel (else `getApiUrl()` falls back to the prod Render URL). Google sign-in additionally requires the Cloud Console **authorized redirect URI** to equal `<BACKEND_URL>/api/v1/integrations/google/callback`. Earlier symptom of the misconfig: the backend crash-looped on `RuntimeError: Required environment variable 'JWT_SECRET_KEY' is not set`, which broke all auth including Google sign-in.
4. **No DB migration framework.** Schema is created via `create_all`; there's no Alembic. Schema changes need manual handling, and SQLite (local) vs Postgres (compose/prod) can diverge. The encryption change shipped with a standalone migration script rather than a versioned migration.
5. **Meta/LinkedIn are stubs** — replace mock tokens/metrics with real OAuth + API calls when ready.

## Conventions

- Commits are authored as the user (PranavShukla2) with natural, human-style messages — no AI tooling trailers.
- `__pycache__/` / `*.pyc` are gitignored (don't re-track them); `backend/.env` is gitignored — never commit real secrets. `.env.example` documents required vars.
- Verify UI changes by actually running the dev server and screenshotting (Playwright) at desktop + mobile widths, and check the `prefers-reduced-motion` path.

## Where we left off

Last session: pushed a single commit (`Redesign the landing page and encrypt
integration credentials`) covering the landing redesign plus the backend security
pass (Fernet encryption, OAuth/JWT config, `.env.example`, gitignore/`.pyc`
cleanup). The most recent landing work added a HopeRise/revnu-inspired pass:
bigger type scale, scattered sticker + handwritten-arrow accents, tighter
hero/phone spacing, a titled workspace showcase, a fixed two-column About layout,
and a new FAQ accordion. All verified in-browser with no runtime console errors.

Natural next steps: the deploy env mismatch (#3) and the reduced-motion hydration
fix (#1) are the highest-value cleanups; real Meta/LinkedIn integrations (#5) are
the biggest feature gap.
