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
from app.services.notify import webhook_url_allowed
from app.services.reports import FREQUENCIES, parse_recipients
from app.db.models import (
    BrandSettings, Integration, NotificationSettings, ReportSchedule,
    TeamInvitation, TeamMembership, User,
)

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


# ---------------- Onboarding ----------------

@router.get("/onboarding")
def get_onboarding(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """First-run checklist state, derived from what actually exists in the DB —
    steps check themselves off, no separate 'completed' bookkeeping to drift.
    Always about the caller's OWN workspace (onboarding is per account)."""
    uid = current_user.id
    connected_ga = db.query(Integration).filter(
        Integration.user_id == uid, Integration.provider == "google_analytics"
    ).first() is not None
    invited_team = (
        db.query(TeamMembership).filter(TeamMembership.owner_id == uid).first() is not None
        or db.query(TeamInvitation).filter(TeamInvitation.owner_id == uid).first() is not None
    )
    b = db.get(BrandSettings, uid)
    set_branding = b is not None and any((b.logo_url, b.accent_color, b.report_footer))
    s = db.get(ReportSchedule, uid)
    scheduled_report = s is not None and s.enabled

    steps = {
        "connect_ga": connected_ga,
        "invite_team": invited_team,
        "set_branding": set_branding,
        "schedule_report": scheduled_report,
    }
    return {"steps": steps, "complete": all(steps.values())}


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


# ---------------- White-label branding ----------------

import re as _re

_LOGO_MAX = 700_000  # ~500KB image once base64-encoded
_HEX = _re.compile(r"^#[0-9a-fA-F]{6}$")


class BrandBody(BaseModel):
    logo_url: str | None = None
    accent_color: str | None = None
    report_footer: str | None = None
    workspace: int | None = None


def _brand_dict(b: BrandSettings | None, owner: User) -> dict:
    return {
        "logo_url": b.logo_url if b else None,
        "accent_color": (b.accent_color if b and b.accent_color else "#5b5bd6"),
        "report_footer": (b.report_footer if b else None),
        "company_name": owner.company_name,
    }


@router.get("/branding")
def get_branding(workspace: int | None = Query(default=None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """The workspace's branding (readable by any member, for client-facing display)."""
    owner, _role = resolve_workspace_owner(current_user, workspace, db)
    b = db.get(BrandSettings, owner.id)
    return _brand_dict(b, owner)


@router.put("/branding")
def update_branding(body: BrandBody, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    owner, role = resolve_workspace_owner(current_user, body.workspace, db)
    require_manage(role)

    logo = (body.logo_url or "").strip() or None
    if logo is not None:
        if not (logo.startswith("data:image/") or logo.startswith("https://")):
            raise HTTPException(status_code=422, detail="Logo must be an uploaded image or an https URL.")
        if len(logo) > _LOGO_MAX:
            raise HTTPException(status_code=422, detail="Logo is too large — please use an image under 500KB.")

    accent = (body.accent_color or "").strip() or None
    if accent is not None and not _HEX.match(accent):
        raise HTTPException(status_code=422, detail="Accent colour must be a hex value like #5b5bd6.")

    footer = (body.report_footer or "").strip() or None
    if footer is not None and len(footer) > 300:
        raise HTTPException(status_code=422, detail="Footer is too long (max 300 characters).")

    b = db.get(BrandSettings, owner.id)
    if b is None:
        b = BrandSettings(user_id=owner.id)
        db.add(b)
    b.logo_url, b.accent_color, b.report_footer = logo, accent, footer
    from app.core.time import utcnow as _now
    b.updated_at = _now()
    db.commit()
    audit(db, "workspace.branding_updated", request, user_id=current_user.id)
    return _brand_dict(b, owner)


# ---------------- Notification preferences ----------------

class NotificationBody(BaseModel):
    slack_webhook_url: str | None = None
    digest_enabled: bool = True
    workspace: int | None = None


def _notif_dict(s: NotificationSettings | None) -> dict:
    return {
        "slack_webhook_url": s.slack_webhook_url if s else None,
        "digest_enabled": s.digest_enabled if s else True,
    }


@router.get("/notifications")
def get_notifications(workspace: int | None = Query(default=None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    owner, role = resolve_workspace_owner(current_user, workspace, db)
    require_manage(role)  # delivery settings are owner/admin territory
    return _notif_dict(db.get(NotificationSettings, owner.id))


@router.put("/notifications")
def update_notifications(body: NotificationBody, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    owner, role = resolve_workspace_owner(current_user, body.workspace, db)
    require_manage(role)

    url = (body.slack_webhook_url or "").strip() or None
    if url is not None and not webhook_url_allowed(url):
        raise HTTPException(
            status_code=422,
            detail="Webhook must be a Slack (hooks.slack.com) or Discord (discord.com/api/webhooks) URL.",
        )

    s = db.get(NotificationSettings, owner.id)
    if s is None:
        s = NotificationSettings(user_id=owner.id)
        db.add(s)
    s.slack_webhook_url = url
    s.digest_enabled = bool(body.digest_enabled)
    db.commit()
    audit(db, "workspace.notifications_updated", request, user_id=current_user.id)
    return _notif_dict(s)


# ---------------- Scheduled reports ----------------

class ReportScheduleBody(BaseModel):
    recipients: str = ""            # comma-separated emails
    frequency: str = "weekly"       # weekly | monthly
    enabled: bool = False
    workspace: int | None = None


def _schedule_dict(s: ReportSchedule | None) -> dict:
    return {
        "recipients": s.recipients if s else "",
        "frequency": s.frequency if s else "weekly",
        "enabled": s.enabled if s else False,
        "last_sent_at": (s.last_sent_at.isoformat() + "Z") if s and s.last_sent_at else None,
    }


@router.get("/report-schedule")
def get_report_schedule(workspace: int | None = Query(default=None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    owner, role = resolve_workspace_owner(current_user, workspace, db)
    require_manage(role)  # recipients are client emails — owner/admin only
    return _schedule_dict(db.get(ReportSchedule, owner.id))


@router.put("/report-schedule")
def update_report_schedule(body: ReportScheduleBody, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    owner, role = resolve_workspace_owner(current_user, body.workspace, db)
    require_manage(role)

    if body.frequency not in FREQUENCIES:
        raise HTTPException(status_code=422, detail="Frequency must be weekly or monthly.")
    try:
        recipients = parse_recipients(body.recipients)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    if body.enabled and not recipients:
        raise HTTPException(status_code=422, detail="Add at least one recipient before enabling the schedule.")

    s = db.get(ReportSchedule, owner.id)
    if s is None:
        s = ReportSchedule(user_id=owner.id)
        db.add(s)
    s.recipients = ",".join(recipients)
    s.frequency = body.frequency
    s.enabled = bool(body.enabled)
    db.commit()
    audit(db, "workspace.report_schedule_updated", request, user_id=current_user.id,
          detail=f"{body.frequency}, {len(recipients)} recipient(s), enabled={body.enabled}")
    return _schedule_dict(s)
