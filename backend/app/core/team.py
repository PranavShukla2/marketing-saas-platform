"""Workspace membership + invitations.

A "workspace" is an owner User's account. Other users get access via a
TeamMembership with a role. Invitations are hashed single-use tokens emailed to
the invitee, consumed on acceptance.

`resolve_workspace_owner` is the access gate every data endpoint runs: it maps
(caller, requested workspace) -> (owner User, caller's role) or 403. Defaulting
the requested workspace to None keeps the caller in their *own* workspace, so
existing single-user behaviour is unchanged.
"""
import hashlib
import secrets
from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.time import utcnow
from app.db.models import TeamInvitation, TeamMembership, User

# Invitable roles (the account holder is implicitly "owner").
ROLES = ("admin", "member", "viewer")
# Roles allowed to manage the team (invite / remove / change roles).
MANAGE_ROLES = ("owner", "admin")

INVITE_TTL_DAYS = 7


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def resolve_workspace_owner(current_user: User, workspace_id: int | None, db: Session) -> tuple[User, str]:
    """Return (owner_user, caller_role) for the requested workspace, or 403.

    workspace_id None or the caller's own id -> their own workspace (role
    "owner"). Otherwise the caller must have a membership in that workspace.
    """
    if workspace_id is None or workspace_id == current_user.id:
        return current_user, "owner"

    membership = (
        db.query(TeamMembership)
        .filter(TeamMembership.owner_id == workspace_id, TeamMembership.member_id == current_user.id)
        .first()
    )
    if membership is None:
        raise HTTPException(status_code=403, detail="You don't have access to this workspace.")

    owner = db.query(User).filter(User.id == workspace_id).first()
    if owner is None:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    return owner, membership.role


def require_manage(role: str) -> None:
    if role not in MANAGE_ROLES:
        raise HTTPException(status_code=403, detail="Only workspace admins can manage the team.")


def accessible_workspaces(current_user: User, db: Session) -> list[dict]:
    """Every workspace the caller can open: their own + memberships."""
    out = [{
        "id": current_user.id,
        "name": current_user.company_name,
        "role": "owner",
        "is_own": True,
    }]
    memberships = db.query(TeamMembership).filter(TeamMembership.member_id == current_user.id).all()
    for m in memberships:
        owner = db.query(User).filter(User.id == m.owner_id).first()
        if owner:
            out.append({"id": owner.id, "name": owner.company_name, "role": m.role, "is_own": False})
    return out


def create_invitation(db: Session, owner_id: int, email: str, role: str) -> str:
    """Create (or replace) a pending invite; return the raw token to email."""
    email = email.strip().lower()
    if role not in ROLES:
        raise HTTPException(status_code=422, detail="Invalid role.")
    # One pending invite per (owner, email): drop any prior one.
    db.query(TeamInvitation).filter(
        TeamInvitation.owner_id == owner_id, TeamInvitation.email == email
    ).delete()
    raw = secrets.token_urlsafe(32)
    db.add(TeamInvitation(token_hash=_hash(raw), owner_id=owner_id, email=email, role=role))
    db.commit()
    return raw


def accept_invitation(db: Session, raw_token: str, member: User) -> dict:
    """Consume an invite for `member` and create the membership.

    The invite email must match the accepting user's email, so a leaked link
    can't be redeemed by someone else's account.
    """
    inv = db.query(TeamInvitation).filter(TeamInvitation.token_hash == _hash(raw_token)).first()
    if inv is None:
        raise HTTPException(status_code=400, detail="This invite is invalid or already used.")
    if inv.created_at < utcnow() - timedelta(days=INVITE_TTL_DAYS):
        db.delete(inv)
        db.commit()
        raise HTTPException(status_code=400, detail="This invite has expired. Ask for a new one.")
    if inv.email != member.email.strip().lower():
        raise HTTPException(status_code=403, detail="This invite was sent to a different email address.")
    if inv.owner_id == member.id:
        db.delete(inv)
        db.commit()
        raise HTTPException(status_code=400, detail="You can't join your own workspace.")

    existing = (
        db.query(TeamMembership)
        .filter(TeamMembership.owner_id == inv.owner_id, TeamMembership.member_id == member.id)
        .first()
    )
    if existing:
        existing.role = inv.role  # re-invite can update the role
    else:
        db.add(TeamMembership(owner_id=inv.owner_id, member_id=member.id, role=inv.role))
    db.delete(inv)
    db.commit()

    owner = db.query(User).filter(User.id == inv.owner_id).first()
    return {"workspace_id": inv.owner_id, "workspace_name": owner.company_name if owner else "", "role": inv.role}
