"""Audit trail for security-relevant events.

`record()` must never break the request it's called from — auditing is
best-effort by design; a failed insert logs a warning and moves on.
"""
from fastapi import Request
from sqlalchemy.orm import Session

from app.core.log import get_logger
from app.core.ratelimit import client_ip
from app.db.models import AuditLog

log = get_logger("audit")


def record(
    db: Session,
    event: str,
    request: Request | None = None,
    user_id: int | None = None,
    email: str | None = None,
    detail: str | None = None,
) -> None:
    try:
        db.add(AuditLog(
            user_id=user_id,
            event=event,
            email=email,
            ip=client_ip(request) if request is not None else None,
            detail=detail,
        ))
        db.commit()
    except Exception as e:
        log.warning(f"Audit write failed for {event}: {e}")
        try:
            db.rollback()
        except Exception:
            pass
