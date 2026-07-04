"""OAuth helpers: signed CSRF `state` tokens and one-time auth codes.

These two mechanisms harden the Google sign-in / integration-linking flow:

* `state` is a short-lived signed JWT instead of a raw user id, so an attacker
  can't forge a callback that binds their Google account to someone else's id
  (CSRF). The flow's intent ("signin" vs "link") and the target user id are
  carried *inside* the signed token, never read from attacker-controlled input.

* After a successful sign-in the callback stores the session JWT server-side and
  redirects with a single-use `auth_code`, so the long-lived token never appears
  in a URL / browser history / referer header.
"""
import hashlib
import secrets
from datetime import timedelta

import jwt
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import SECRET_KEY, ALGORITHM
from app.core.time import utcnow
from app.db.models import AuthCode


def _hash_code(code: str) -> str:
    """Auth codes are stored hashed, like passwords: a leaked DB row must not
    be redeemable for a session token. sha256 is fine here — the input is a
    256-bit random value, so there's nothing to brute-force."""
    return hashlib.sha256(code.encode("utf-8")).hexdigest()

STATE_TTL_MINUTES = 10
AUTH_CODE_TTL_SECONDS = 120

VALID_PURPOSES = {"signin", "link"}


def create_oauth_state(purpose: str, user_id: int | None = None) -> str:
    """Create a signed, short-lived OAuth `state` value."""
    if purpose not in VALID_PURPOSES:
        raise ValueError(f"Invalid OAuth state purpose: {purpose!r}")
    payload = {
        "purpose": purpose,
        "uid": user_id,
        "nonce": secrets.token_urlsafe(8),
        "exp": utcnow() + timedelta(minutes=STATE_TTL_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_oauth_state(state: str) -> dict:
    """Decode and validate a `state` token. Raises on tampering/expiry."""
    payload = jwt.decode(state, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("purpose") not in VALID_PURPOSES:
        raise jwt.InvalidTokenError("Unknown OAuth state purpose")
    return payload


def create_auth_code(db: Session, token: str) -> str:
    """Persist a JWT behind a fresh single-use code and return the code.

    Only the sha256 of the code touches the database; the plaintext code goes
    to the browser once, in the redirect URL, and is never stored.
    """
    code = secrets.token_urlsafe(32)
    db.add(AuthCode(code=_hash_code(code), token=token))
    db.commit()
    return code


def consume_auth_code(db: Session, code: str) -> str | None:
    """Atomically claim a single-use code and return its JWT (or None).

    Single use is the whole security value of the claim-ticket, so it has to
    hold under real concurrency. A SELECT-then-DELETE would race: under
    Postgres READ COMMITTED, two exchanges of the same code can both read the
    row before either deletes, and both walk away with the JWT. `DELETE ...
    RETURNING` takes the row lock — exactly one caller gets the row back, the
    loser re-reads and finds nothing. We then check expiry on the returned row.

    Consumed codes delete themselves here; the rare abandoned (never-exchanged)
    code expires harmlessly and can be pruned by a periodic sweep if the table
    ever grows — deliberately kept off this hot path to avoid lock contention.
    """
    row = db.execute(
        delete(AuthCode)
        .where(AuthCode.code == _hash_code(code))
        .returning(AuthCode.token, AuthCode.created_at)
    ).first()
    db.commit()

    if row is None:
        return None

    token, created_at = row
    cutoff = utcnow() - timedelta(seconds=AUTH_CODE_TTL_SECONDS)
    return None if created_at < cutoff else token
