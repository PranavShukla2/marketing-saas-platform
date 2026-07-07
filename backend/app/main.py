import asyncio
import os
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import SESSION_COOKIE_NAME

from app.db.database import engine
from app.db import models
from app.api import analytics, auth, integrations, workspace

# Create database tables. NOTE: this is a dev convenience; Alembic
# (backend/alembic/) is the source of truth for schema changes going forward.
models.Base.metadata.create_all(bind=engine)

from app.core.log import get_logger
from app.services.sync import SYNC_ENABLED, sync_loop

log = get_logger("main")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Background dashboard sync (cache warmer + anomaly emails). Env-gated so
    # tests and one-off scripts can turn it off.
    task = asyncio.create_task(sync_loop()) if SYNC_ENABLED else None
    yield
    if task:
        task.cancel()


app = FastAPI(title="Marketing SaaS API", lifespan=lifespan)

# Optional error tracking — only turns on if SENTRY_DSN is set, so local/dev
# and unconfigured deploys are unaffected.
_sentry_dsn = os.getenv("SENTRY_DSN")
if _sentry_dsn:
    try:
        import sentry_sdk

        sentry_sdk.init(
            dsn=_sentry_dsn,
            environment=os.getenv("ENVIRONMENT", "production"),
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
            send_default_pii=False,
        )
    except Exception as e:  # never let observability break startup
        log.warning(f"Sentry init skipped: {e}")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """Consistent error envelope for anything unexpected.

    Every intentional error in the API is an HTTPException with a `detail`
    string; this makes *unintentional* ones look the same to the frontend
    (instead of a bare 500 with a non-JSON body), and hands the exception to
    Sentry when it's configured.
    """
    try:
        import sentry_sdk

        sentry_sdk.capture_exception(exc)
    except Exception:
        pass
    log.error(f"Unhandled error on {request.method} {request.url.path}: {exc!r}")
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on our end."})

# Allowed browser origins. Localhost, our production domain, and our known Vercel
# URLs are baked in; any other origin can be appended via the CORS_ORIGINS env
# var (comma-separated). The regex matches our own Vercel deploys (prod +
# previews) and any *.pranavmshukla.in subdomain, so custom-domain and preview
# URLs keep working without redeploying the backend.
default_origins = [
    "http://localhost:3000",
    "https://arbflow.pranavmshukla.in",
    "https://marketing-saas-platform-nb3q.vercel.app",
    "https://marketing-saas-platform-pi.vercel.app",
]
extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
origins = list(dict.fromkeys(default_origins + extra_origins))

# Our Vercel deployments (prod + previews) OR any pranavmshukla.in subdomain
# (e.g. arbflow.pranavmshukla.in) — not every vercel.app site. Shared by CORS
# and the CSRF origin check below.
ORIGIN_REGEX = r"https://(marketing-saas-platform[a-z0-9-]*\.vercel\.app|([a-z0-9-]+\.)*pranavmshukla\.in)"
_origin_pattern = re.compile(ORIGIN_REGEX)


def _origin_allowed(origin: str) -> bool:
    return origin in origins or _origin_pattern.fullmatch(origin) is not None


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def csrf_origin_check(request, call_next):
    """CSRF guard for cookie-based sessions.

    The session cookie is SameSite=Lax behind a same-origin proxy, which already
    blocks classic cross-site sends; this is defense-in-depth. For state-changing
    requests that carry the session cookie, the browser-sent Origin must be one
    of ours. Requests without the cookie (Bearer/API clients) and requests
    without an Origin header (curl, server-to-server) are untouched — CSRF is a
    browser problem, and every modern browser sends Origin on such requests.
    """
    if request.method in ("POST", "PUT", "PATCH", "DELETE") and SESSION_COOKIE_NAME in request.cookies:
        origin = request.headers.get("origin")
        if origin is not None and not _origin_allowed(origin):
            return JSONResponse(status_code=403, content={"detail": "Origin not allowed."})
    return await call_next(request)

# Security headers on every response. Kept deliberately light for an API:
# `frame-ancestors 'none'` (+ X-Frame-Options) stops clickjacking without a
# `default-src` that would break the Swagger docs at /docs. HSTS is inert over
# plain HTTP, so it's safe locally and enforced in prod behind HTTPS.
_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "Content-Security-Policy": "frame-ancestors 'none'",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    for key, value in _SECURITY_HEADERS.items():
        response.headers.setdefault(key, value)
    return response

# Register our API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["Integrations"]) 
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(workspace.router, prefix="/api/v1/workspace", tags=["Workspace"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the ArbFlow Marketing API"}


@app.get("/health")
def health_check():
    """Liveness + readiness probe. Verifies the process is up AND that the
    database is actually reachable, so uptime monitors catch a dead DB, not
    just a dead process. Returns 503 (not 200) when the DB is down."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "ok"}
    except Exception as e:
        log.error(f"Health check DB error: {e}")
        return JSONResponse(status_code=503, content={"status": "degraded", "database": "unreachable"})