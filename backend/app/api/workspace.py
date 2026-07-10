from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.api.analytics import get_dashboard_data
from app.schemas import _EmailNormalizer
from app.core.email import send_team_invite_email
from app.core.ratelimit import enforce_rate_limit
from app.core.team import (
    ROLES, accept_invitation, accessible_workspaces, create_invitation,
    require_manage, resolve_workspace_owner,
)
from app.services.audit import record as audit
from app.db.models import TeamInvitation, TeamMembership, User

router = APIRouter()


@router.get("/campaigns")
def get_campaigns(workspace: int | None = Query(default=None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns real traffic source channels from GA4 as campaign cards."""
    dash_info = get_dashboard_data(property_id=None, refresh=False, workspace=workspace, db=db, current_user=current_user)
    dash_data = dash_info.get("data", {})

    status = dash_data.get("status", "pending_integration")
    campaigns = []

    if status == "active":
        post_level = dash_data.get("post_level", [])
        for idx, channel in enumerate(post_level):
            views = channel.get("views", 0)
            users = channel.get("users", 0)
            campaigns.append({
                "id": idx + 1,
                "name": f"{channel.get('source', 'Unknown')}",
                "status": "Active" if views > 50 else "Low Traffic",
                "views": views,
                "users": users,
                "ctr": f"{round((users / max(1, views)) * 100, 1)}%"
            })

    return {"campaigns": campaigns, "ga_status": status}


@router.get("/billing")
def get_billing(workspace: int | None = Query(default=None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns billing correctly mapped to GA4 page views limits."""
    dash_info = get_dashboard_data(property_id=None, refresh=False, workspace=workspace, db=db, current_user=current_user)
    dash_data = dash_info.get("data", {})

    current_views = 0
    if dash_data.get("status") == "active":
        current_views = int(dash_data.get("summary", {}).get("page_views", 0))

    # The free beta includes 100k tracked views/month. (Real enforced limits and
    # paid plans arrive with Stripe.)
    limit = 100000
    percentage = min(int((current_views / limit) * 100), 100)

    return {
        "plan": "Free Beta",
        "billing_cycle": "—",
        "price": "$0",
        "renewal_date": "—",
        "usage": {"current": current_views, "limit": limit, "percentage": percentage},
        # Honest: nothing has ever been billed, so there are no invoices.
        "invoices": []
    }


# ---------------- Teams / multi-user workspaces ----------------

class InviteBody(_EmailNormalizer):
    role: str = "member"
    workspace: int | None = None


class AcceptBody(BaseModel):
    token: str


def _avatar(name: str) -> str:
    return (name or "?")[0].upper()


@router.get("/workspaces")
def list_workspaces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Every workspace the caller can open (their own + memberships)."""
    return {"workspaces": accessible_workspaces(current_user, db)}


@router.get("/team")
def get_team(workspace: int | None = Query(default=None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Members + pending invites of a workspace (default: your own)."""
    owner, role = resolve_workspace_owner(current_user, workspace, db)

    team = [{
        "member_id": owner.id, "name": owner.company_name, "email": owner.email,
        "role": "Owner", "status": "Active", "avatar": _avatar(owner.company_name), "removable": False,
    }]
    memberships = db.query(TeamMembership).filter(TeamMembership.owner_id == owner.id).all()
    can_manage = role in ("owner", "admin")
    for m in memberships:
        u = db.query(User).filter(User.id == m.member_id).first()
        if not u:
            continue
        team.append({
            "member_id": u.id, "name": u.company_name, "email": u.email,
            "role": m.role.capitalize(), "status": "Active", "avatar": _avatar(u.company_name),
            "removable": can_manage,
        })

    invites = []
    if can_manage:
        for inv in db.query(TeamInvitation).filter(TeamInvitation.owner_id == owner.id).all():
            invites.append({"email": inv.email, "role": inv.role, "status": "Pending"})

    return {"team": team, "invites": invites, "my_role": role, "can_manage": can_manage}


@router.post("/team/invite")
def invite_member(body: InviteBody, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    owner, role = resolve_workspace_owner(current_user, body.workspace, db)
    require_manage(role)
    if body.role not in ROLES:
        raise HTTPException(status_code=422, detail="Invalid role.")

    enforce_rate_limit(request, "email")  # invite emails share the email-abuse bucket
    email = body.email.strip().lower()

    if email == owner.email.strip().lower():
        raise HTTPException(status_code=400, detail="That's the workspace owner.")
    already = (
        db.query(TeamMembership).join(User, TeamMembership.member_id == User.id)
        .filter(TeamMembership.owner_id == owner.id, User.email == email).first()
    )
    if already:
        raise HTTPException(status_code=400, detail="That person is already on the team.")

    raw = create_invitation(db, owner.id, email, body.role)
    send_team_invite_email(email, owner.company_name, body.role, raw)
    audit(db, "team.invited", request, user_id=current_user.id, email=email, detail=f"role={body.role}")
    return {"detail": f"Invite sent to {email}."}


@router.post("/team/accept")
def accept_invite(body: AcceptBody, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = accept_invitation(db, body.token, current_user)
    audit(db, "team.joined", request, user_id=current_user.id, email=current_user.email, detail=f"workspace={result['workspace_id']}")
    return result


@router.delete("/team/member/{member_id}", status_code=204)
def remove_member(member_id: int, request: Request, workspace: int | None = Query(default=None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    owner, role = resolve_workspace_owner(current_user, workspace, db)
    require_manage(role)
    db.query(TeamMembership).filter(
        TeamMembership.owner_id == owner.id, TeamMembership.member_id == member_id
    ).delete()
    db.commit()
    audit(db, "team.member_removed", request, user_id=current_user.id, detail=f"member={member_id}")
    return None


@router.delete("/team/invite", status_code=204)
def revoke_invite(request: Request, email: str = Query(...), workspace: int | None = Query(default=None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    owner, role = resolve_workspace_owner(current_user, workspace, db)
    require_manage(role)
    db.query(TeamInvitation).filter(
        TeamInvitation.owner_id == owner.id, TeamInvitation.email == email.strip().lower()
    ).delete()
    db.commit()
    return None
