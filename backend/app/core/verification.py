"""Single-use tokens for email verification and password resets.

Same design as the OAuth auth codes (`app/core/oauth.py`): a 256-bit random
token goes to the user in an email link, only its sha256 is stored, and it's
claimed atomically with `DELETE ... RETURNING` so it can't be replayed or raced.
"""
import hashlib
import secrets
from datetime import timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.time import utcnow
from app.db.models import VerificationToken

VERIFY_EMAIL = "verify_email"
RESET_PASSWORD = "reset_password"

VERIFY_TTL_SECONDS = 24 * 60 * 60   # 24 hours
RESET_TTL_SECONDS = 60 * 60         # 1 hour


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def create_token(db: Session, user_id: int, purpose: str) -> str:
    """Issue a single-use token for `purpose`; store only its hash, return raw."""
    raw = secrets.token_urlsafe(32)
    db.add(VerificationToken(token_hash=_hash(raw), user_id=user_id, purpose=purpose))
    db.commit()
    return raw


def consume_token(db: Session, raw: str, purpose: str, ttl_seconds: int) -> int | None:
    """Atomically claim a token; return its user_id if valid + unexpired, else None.

    The purpose must match, so a verify-email token can't be used to reset a
    password (and vice-versa). Single-use is enforced by the atomic delete.
    """
    row = db.execute(
        delete(VerificationToken)
        .where(
            VerificationToken.token_hash == _hash(raw),
            VerificationToken.purpose == purpose,
        )
        .returning(VerificationToken.user_id, VerificationToken.created_at)
    ).first()
    db.commit()

    if row is None:
        return None

    user_id, created_at = row
    cutoff = utcnow() - timedelta(seconds=ttl_seconds)
    return None if created_at < cutoff else user_id
