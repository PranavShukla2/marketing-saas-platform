"""Rotating refresh tokens with reuse detection.

The contract:
- `create_family()` on login — one family per device/session; returns the raw
  token (only its sha256 ever touches the database).
- `rotate()` on every refresh — atomically consumes the presented token and
  issues a successor in the same family. A token can be spent exactly once.
- Reuse of an already-consumed token is the classic stolen-token signature
  (attacker and victim both hold it; whoever refreshes second replays a spent
  token) — the entire family is revoked so *both* parties are signed out.
- `revoke_family()` / `revoke_all()` back logout and "sign out everywhere".

Expired or unknown tokens are simply invalid. Consumed rows are kept until
they age past the TTL (they're the reuse-detection memory), then pruned
opportunistically.
"""
import hashlib
import os
import secrets
from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.log import get_logger
from app.core.time import utcnow
from app.db.models import RefreshToken

log = get_logger("refresh")

REFRESH_TTL_DAYS = int(os.getenv("REFRESH_TOKEN_TTL_DAYS", "30"))


class ReuseDetected(Exception):
    """A consumed refresh token was replayed — the family has been revoked."""

    def __init__(self, user_id: int):
        self.user_id = user_id
        super().__init__(f"refresh token reuse for user {user_id}")


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _expired_cutoff():
    return utcnow() - timedelta(days=REFRESH_TTL_DAYS)


def create_family(db: Session, user_id: int) -> str:
    """Start a new token family (a fresh login on some device)."""
    raw = secrets.token_urlsafe(32)
    family_id = secrets.token_urlsafe(16)
    db.add(RefreshToken(token_hash=_hash(raw), user_id=user_id, family_id=family_id))
    db.commit()
    return raw


def rotate(db: Session, raw: str) -> tuple[int, str] | None:
    """Spend `raw`; return (user_id, new_raw_token), None if invalid.

    Raises ReuseDetected (after revoking the whole family) when a consumed
    token is replayed — the caller decides how to respond/audit.
    """
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == _hash(raw)).first()
    if row is None:
        return None

    # Expired tokens are dead regardless of state; clean the family's stale rows.
    if row.created_at < _expired_cutoff():
        db.query(RefreshToken).filter(
            RefreshToken.family_id == row.family_id,
            RefreshToken.created_at < _expired_cutoff(),
        ).delete()
        db.commit()
        return None

    if row.consumed_at is not None:
        # Someone is replaying a spent token — kill the whole family.
        log.warning(f"Refresh-token reuse detected for user {row.user_id}; revoking family")
        user_id = row.user_id
        db.query(RefreshToken).filter(RefreshToken.family_id == row.family_id).delete()
        db.commit()
        raise ReuseDetected(user_id)

    # Atomic single-spend: flip consumed_at only if it's still NULL. Exactly one
    # concurrent caller wins; the loser sees 0 rows updated and walks away.
    updated = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == row.token_hash, RefreshToken.consumed_at.is_(None))
        .update({"consumed_at": utcnow()}, synchronize_session=False)
    )
    if updated == 0:
        db.commit()
        return None  # lost the race; treat as invalid rather than double-issue

    new_raw = secrets.token_urlsafe(32)
    db.add(RefreshToken(token_hash=_hash(new_raw), user_id=row.user_id, family_id=row.family_id))
    db.commit()
    return (row.user_id, new_raw)


def revoke_family(db: Session, raw: str) -> None:
    """Logout: kill the family of the presented token (this device's session)."""
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == _hash(raw)).first()
    if row is not None:
        db.query(RefreshToken).filter(RefreshToken.family_id == row.family_id).delete()
        db.commit()


def revoke_all(db: Session, user_id: int) -> int:
    """Sign out everywhere: kill every refresh token the user has."""
    n = db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    db.commit()
    return n
