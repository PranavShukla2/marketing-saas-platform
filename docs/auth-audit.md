# Auth security & UX audit — July 2026

A full pass over sign-up, sign-in, Google OAuth, and the session layer:
every finding, why it matters, and how it was fixed. Verified end-to-end
locally (curl against the API + a scripted browser run of the real
register → login → dashboard flow).

## Security findings & fixes

### 1. Login timing oracle (account enumeration) — fixed
**Where:** `backend/app/api/auth.py`
**Problem:** `if not user or not pwd_context.verify(...)` short-circuits: for an
unknown email, bcrypt never runs, so the response returns measurably faster
than for a wrong password. An attacker could confirm which emails have
accounts by timing requests, then target those with credential stuffing.
**Fix:** every login now runs exactly one bcrypt verify — against the real
hash when the user exists, against a server-generated dummy hash when they
don't. Both paths take the same time and return the same generic 401.

### 2. No server-side input validation — fixed
**Where:** `backend/app/schemas.py`
**Problem:** the API accepted a 1-character password and any string as an
email. The frontend's `type="email"` and `required` are trivially bypassed
with curl. Also, bcrypt silently ignores everything past 72 bytes, so
"passwords" longer than that were partially meaningless.
**Fix:** Pydantic validation on the schemas themselves: password 8–72 chars,
email checked against a proper shape regex, company name 1–120 chars, email
capped at 254. Applies to every consumer of the schema automatically.

### 3. Email case-sensitivity could split one identity into two accounts — fixed
**Where:** `schemas.py` (register/login) + `integrations.py` (Google callback)
**Problem:** `Pranav@x.com` and `pranav@x.com` were different rows. Worse,
Google sign-in matches by exact string — someone who registered with a
capitalized email and later used Google sign-in would get a *second* account
and "lose" their data.
**Fix:** emails are normalized (trim + lowercase) at every entry point: the
register/login schemas and the Google userinfo callback.

### 4. No rate limiting on auth endpoints — fixed
**Where:** new `backend/app/core/ratelimit.py`
**Problem:** unlimited attempts on `/login` (password brute-force),
`/register` (bot signups), and `/exchange` (auth-code guessing).
**Fix:** per-IP sliding-window limiter — login 10/min, register 5/min,
exchange 10/min → HTTP 429 with a human message. In-memory by design: we run
a single uvicorn process; the interface is swappable for Redis if we scale
out. Client IP is read from the left-most `X-Forwarded-For` entry (Render
sits behind a proxy).

### 5. One-time auth codes stored in plaintext next to their JWTs — fixed
**Where:** `backend/app/core/oauth.py`
**Problem:** after Google sign-in, the callback stores `(code, session JWT)`
in the `auth_codes` table. Anyone with read access to the DB (leaked backup,
injection elsewhere) could redeem pending codes for live sessions.
**Fix:** only the sha256 of the code is stored; the plaintext code exists
once, in the user's redirect URL. Lookup hashes the presented code. (sha256
is appropriate here — the input is a 256-bit random token, not a human
password.) Codes were already single-use with a 120s TTL; old plaintext rows
age out on their own within that window.

### 6. Cancelling Google consent crashed the callback — fixed
**Where:** `backend/app/api/integrations.py`
**Problem:** clicking "Cancel" on Google's consent screen redirects back with
`?error=access_denied` and *no* `code` param → FastAPI's validation returned
a raw 422 JSON page to the user mid-flow.
**Fix:** `code`/`state`/`error` are now optional; any error or missing param
redirects to `/login?error=google_cancelled`, which the login page renders as
"Google sign-in was cancelled. You can try again anytime."

### 7. Outbound Google calls had no timeout — fixed
**Where:** `integrations.py` (token exchange + userinfo)
**Problem:** a hung Google endpoint would pin a worker forever — with one
uvicorn process that's a cheap denial of service.
**Fix:** `timeout=15` on both calls.

### 8. CORS allowed every `*.vercel.app` origin — tightened
**Where:** `backend/app/main.py`
**Problem:** the regex `https://.*\.vercel\.app` let any Vercel-hosted site
make credentialed API calls. Not directly exploitable today (tokens live in
localStorage and are attached by our JS, not cookies), but it's needless
surface.
**Fix:** regex scoped to this project's deployments:
`https://marketing-saas-platform[a-z0-9-]*\.vercel\.app`, plus the
`CORS_ORIGINS` env var for custom domains.

### 9. Unconfigured Google OAuth produced a broken redirect — fixed
**Where:** `auth.py` `/google/login`
**Problem:** with `GOOGLE_CLIENT_ID` unset, the generated URL literally
contained `client_id=None` and users landed on an opaque Google error page.
**Fix:** returns 503 with "Google sign-in isn't configured on this server";
the frontend surfaces that message instead of spinning.

## UX findings & fixes

### 10. AuthGuard flashed protected content to logged-out visitors — fixed
`AuthGuard` rendered children as soon as auth state was *known*, including
when it was `false` — so `/dashboard` flashed for a beat before the redirect
landed. It now holds the loading spinner unless auth is confirmed `true`.

### 11. Registration ended in an unexplained redirect — fixed
Creating an account dumped you on `/login` with zero feedback. Register now
routes to `/login?registered=1` and the login page shows a green
"Account created — sign in below." notice.

### 12. Raw error payloads in the UI — fixed
"Failed to fetch" (server down / offline) and FastAPI 422 arrays (which
render as `[object Object]`) reached users verbatim. Both pages now translate
network failures and validation payloads into plain English.

### 13. Google button could spin forever — fixed
If the backend responded without a `url` (e.g. OAuth not configured), the
button stayed in its loading state indefinitely. It now shows the server's
actual reason and resets.

### 14. Password fields — small but real friction — fixed
Added show/hide toggles on both pages, an inline "at least 8 characters"
hint + client-side check on register (matching the server rule), and
`minLength` on the input.

## What was verified

- **API level (curl):** register happy path; duplicate email → 400; short
  password → 422; login with UPPERCASED email → 200 (normalization through
  the stack); wrong password → 401; 12 rapid logins → 429 kicks in exactly at
  the limit; OAuth callback with `?error=access_denied` → 307 to
  `/login?error=google_cancelled` (previously 422).
- **Browser level (Playwright):** inline short-password error; show/hide
  toggle; register → green notice on login; wrong-password error; uppercase
  email + correct password → dashboard; token cleared + `/dashboard` →
  redirect to login with no content flash; zero console/page errors.

## Known limitations / accepted tradeoffs

- **JWT in localStorage:** XSS-exfiltratable in principle. Migrating to
  httpOnly cookies would need CSRF tokens and a same-site strategy — worth it
  when the product hardens, not before. No XSS vectors exist today (React
  escaping, no `dangerouslySetInnerHTML`).
- **Rate limiter is per-process:** resets on deploy and doesn't share state
  across instances. Fine for one Render instance; swap for Redis when scaling.
- **No password reset flow yet** — needs an email provider first.
- **24h token lifetime, no refresh/rotation** — acceptable for the current
  product stage.
