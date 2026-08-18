# Operations runbook

What to do when something breaks, and how routine operations work. Written for
whoever is on the pager (today: the maintainer).

**Stack**: frontend on Vercel (`arbflow.pranavmshukla.in`), backend FastAPI on
Render (`arbflow-backend.onrender.com`), Postgres on Neon. All browser traffic
reaches the API through the frontend's same-origin proxy (`/api/backend/*`).

---

## Routine operations

### Deploying
Push to `main`. Vercel and Render both auto-deploy. CI (GitHub Actions) runs
backend tests, a fresh-DB migration apply, frontend build/lint, and blocking
dependency/secret scans — **don't merge red CI**.

Schema changes ship as Alembic migrations. On paid Render the blueprint's
`preDeployCommand` applies them before the new code serves; on the free tier
**apply manually right after pushing**:

```bash
cd backend && alembic upgrade head       # local .env points at the prod DB
```

All migrations are idempotent against a `create_all`-built schema, so applying
"again" is safe.

### Rolling back
- **Frontend**: Vercel dashboard → Deployments → previous deployment → Promote.
- **Backend**: Render dashboard → Deploys → previous deploy → Rollback. If the
  bad deploy included a migration, the code rollback usually suffices —
  migrations are additive by convention. Only run `alembic downgrade` if the
  new schema itself is the problem, and take a Neon branch/backup first.
- **One bad commit**: `git revert <sha>` and push — full pipeline redeploys.

### Database restore
Neon → Branches/Restore (point-in-time if PITR is enabled — **enable it**).
Restore to a new branch, verify, then update `DATABASE_URL` in Render.
Never restore over the live branch blind.

---

## Incidents

### "Internal server error" on sign-in / all auth 500s
Almost always schema drift: code that expects a column/table the prod DB
doesn't have (this happened with `users.is_verified`).
1. `cd backend && alembic current` vs `alembic heads` — if behind, `alembic upgrade head`.
2. If alembic was never stamped (no `alembic_version` table):
   `alembic stamp <baseline> && alembic upgrade head`.
3. Confirm: `curl -X POST .../api/v1/auth/login` with bogus creds → expect 401, not 500.

### Custom domain is down, but the *.vercel.app URL works
Symptom: `arbflow.pranavmshukla.in` won't load; the Vercel URL is fine.
Almost always a **missing DNS record**, not a Vercel or app fault — easy to do
by accident while adding another subdomain to the same domain.

Diagnose in this order (30 seconds):

```bash
dig +short arbflow.pranavmshukla.in           # empty = no DNS record. That's it.
# Is the domain still attached in Vercel? Bypass DNS and ask Vercel directly:
VIP=$(dig +short marketing-saas-platform-pi.vercel.app | head -1)
curl -sI --resolve "arbflow.pranavmshukla.in:443:$VIP" https://arbflow.pranavmshukla.in | head -1
```

- Empty `dig` + `200` from the forced request → **DNS only**. Vercel config and
  the TLS cert are intact; just re-add the record (below).
- Empty `dig` + 404 / "deployment not found" → the domain was also removed from
  the Vercel project. Re-add it under Project → Settings → Domains first.

**Fix:** in the DNS host for `pranavmshukla.in` (Cloudflare), add for `arbflow`
whatever Vercel shows under Project → Settings → Domains — normally
`CNAME arbflow → cname.vercel-dns.com`. On Cloudflare set it **DNS-only (grey
cloud)** so Vercel terminates TLS; proxying (orange cloud) needs SSL mode
Full (strict) or you get redirect loops / cert errors. Propagation is minutes.

**Don't forget the knock-on:** Render's `FRONTEND_URL` is this domain, and the
Google OAuth callback redirects there — so while the domain is dead, **Google
sign-in is broken from every frontend URL**, including the working Vercel one
(email/password login still works). Restoring DNS fixes it automatically. If
you instead decide to *abandon* the custom domain, change `FRONTEND_URL` on
Render to the Vercel URL, or OAuth keeps redirecting users into the void.

### /health returns "degraded"
The DB ping failed. Usually Neon cold-start or a dropped idle connection —
the pool's `pre_ping` self-heals on the next request. If it persists:
Neon dashboard → is the project suspended/over quota? Check `DATABASE_URL`
in Render hasn't been rotated.

### Render backend won't start (crash loop)
Check Render logs. The app **fails fast** if `JWT_SECRET_KEY` or
`ENCRYPTION_KEY` is missing/invalid — the error message names the variable.
`ENCRYPTION_KEY` must be a *Fernet key* (the output of
`Fernet.generate_key()`, not the command text — that mistake has happened).

### Google sign-in broken (but app is up)
Land on `/login?error=...` — the code tells you where it broke:
- `google_auth_failed` → token exchange: check `GOOGLE_CLIENT_ID/SECRET` in
  Render, and that the Google Cloud redirect URI is exactly
  `<BACKEND_URL>/api/v1/integrations/google/callback`.
- `invalid_state` → expired/forged state; retrying is normal. Widespread =
  `JWT_SECRET_KEY` changed mid-flight.
- `email_unverified` / `no_email` → the Google account itself.

### Dashboards show sample data for a connected user
`data.status` explains: `reauth_required` (refresh token dead → user
reconnects), `no_properties` (their Google account has no GA4 property),
`no_access` (Analytics Admin/Data API disabled in the Cloud project). Only
`no_access` is on us — check the API toggles in Google Cloud Console.

### A user reports a 500
The response body/header carries `request_id` — grep Render logs for it;
every log line of that request is tagged `[<request_id>]`. Sentry (if DSN set)
has the stack under the same timestamp.

### Refresh-token reuse alarms (`auth.refresh.reuse_detected` in audit_logs)
One-off: probably a user's flaky double-refresh — family revoked, they sign in
again, no action. A burst across users: treat as token theft, rotate
`JWT_SECRET_KEY` (invalidates all access tokens), investigate.

### Emails not sending
Without `RESEND_API_KEY` the mailer logs `[email:dev]` lines instead of
sending (by design). With a key: check Render logs for `Resend error` lines
and the Resend dashboard for domain verification.

---

## Keys & secrets

- `JWT_SECRET_KEY`: rotating it signs everyone out (access + refresh become
  invalid). Safe emergency lever.
- `ENCRYPTION_KEY`: **do not rotate** — there is no re-key path yet; rotation
  strands every stored OAuth token (all users must reconnect GA4).
- OAuth secrets: rotate in Google Cloud Console + update Render env together.

## Known limits (by design, documented)
- Free-tier Render sleeps: background sync/digests/reports fire on next wake.
- Rate limiter is in-memory unless `REDIS_URL` is set (fine at 1 instance).
- bcrypt caps logins ≈20/s/worker; the per-IP limiter sheds floods as 429s.
