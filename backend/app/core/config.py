import os
from dotenv import load_dotenv

# Load .env once, as early as anything that imports config.
load_dotenv()


def _require(name: str) -> str:
    """Fetch a required environment variable or fail fast at startup.

    We deliberately do NOT provide defaults for secrets: a missing value
    should crash the process loudly rather than silently fall back to a
    well-known (and therefore worthless) key.
    """
    value = os.getenv(name)
    if not value:
        raise RuntimeError(
            f"Required environment variable '{name}' is not set. "
            f"Copy backend/.env.example to backend/.env and fill it in."
        )
    return value


# --- JWT ---
SECRET_KEY = _require("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# --- Credential encryption (Fernet / AES-128-CBC + HMAC) ---
# Must be a 32-byte url-safe base64-encoded key, e.g. Fernet.generate_key().
ENCRYPTION_KEY = _require("ENCRYPTION_KEY").encode("utf-8")

# --- Session cookies (httpOnly) ---
# The frontend proxies all API calls through its own origin (a Next.js
# rewrite), so these cookies are first-party and SameSite=Lax works everywhere —
# including Safari, which blocks third-party cookies outright.
#
# Access tokens are short-lived; the rotating refresh token (own cookie, hashed
# at rest, reuse-detected) silently renews them. Frontend retries a 401 once
# through POST /auth/refresh.
ACCESS_TOKEN_TTL_MINUTES = int(os.getenv("ACCESS_TOKEN_TTL_MINUTES", "30"))
SESSION_COOKIE_NAME = "arbflow_session"
SESSION_MAX_AGE_SECONDS = ACCESS_TOKEN_TTL_MINUTES * 60  # cookie dies with the JWT
REFRESH_COOKIE_NAME = "arbflow_refresh"
REFRESH_COOKIE_MAX_AGE_SECONDS = int(os.getenv("REFRESH_TOKEN_TTL_DAYS", "30")) * 24 * 60 * 60
# Secure=True is right for prod and also fine on http://localhost in
# Chrome/Firefox (localhost counts as a trustworthy origin). Set
# COOKIE_SECURE=false only if a local browser refuses the cookie.
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true").lower() == "true"
