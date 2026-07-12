from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import json
import jwt
import os
from datetime import timedelta

from app.db.database import get_db
from app.db.models import User, Integration, VerificationToken, DashboardCache, AuditLog, RefreshToken, TeamMembership, TeamInvitation, BrandSettings, NotificationSettings, ReportSchedule
from app.schemas import (
    UserCreate, UserLogin, UserResponse, AuthCodeExchange,
    EmailRequest, TokenPayload, PasswordResetPayload,
)
from app.core.config import (
    SECRET_KEY, ALGORITHM,
    SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, COOKIE_SECURE,
    ACCESS_TOKEN_TTL_MINUTES, REFRESH_COOKIE_NAME, REFRESH_COOKIE_MAX_AGE_SECONDS,
)
from app.core.oauth import create_oauth_state, consume_auth_code
from app.core.ratelimit import enforce_rate_limit
from app.core.time import utcnow
from app.core.verification import (
    create_token, consume_token,
    VERIFY_EMAIL, RESET_PASSWORD, VERIFY_TTL_SECONDS, RESET_TTL_SECONDS,
)
from app.core.email import send_verification_email, send_password_reset_email
from app.api.deps import get_current_user
from app.services.audit import record as audit
from app.core.refresh import ReuseDetected, create_family, revoke_all, revoke_family, rotate

router = APIRouter()

# Opt-in: when true, unverified accounts can't log in. Default off so existing
# deployments (and any without email configured) keep working unchanged.
REQUIRE_EMAIL_VERIFICATION = os.getenv("REQUIRE_EMAIL_VERIFICATION", "false").lower() == "true"

# 1. Setup Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# A real bcrypt hash of a random throwaway value. When a login hits an unknown
# email we still verify against this, so "no such user" and "wrong password"
# take the same time — otherwise response timing quietly reveals which emails
# have accounts.
_DUMMY_HASH = pwd_context.hash(os.urandom(24).hex())


def _set_session_cookie(response: Response, token: str) -> None:
    """Attach the session JWT as an httpOnly cookie.

    JS can't read it (httpOnly), so an XSS can't exfiltrate the session the way
    it could with localStorage. The frontend reaches the API through a
    same-origin rewrite proxy, so Lax is enough and works in every browser.
    """
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )

def _set_refresh_cookie(response: Response, raw: str) -> None:
    """The rotating refresh token rides its own httpOnly cookie.

    Path is "/" (not scoped to /auth/refresh) because the browser reaches us
    through the /api/backend rewrite — a backend-side path would never match
    the browser's path and the cookie would never be sent.
    """
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw,
        max_age=REFRESH_COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def _mint_access_token(user_id: int) -> str:
    expire = utcnow() + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

BACKEND_URL = os.getenv("BACKEND_URL", "https://arbflow-backend.onrender.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://marketing-saas-platform-pi.vercel.app")
GOOGLE_AUTH_REDIRECT_URI = f"{BACKEND_URL}/api/v1/auth/google/callback"

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(request, "register")

    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = pwd_context.hash(user_data.password)
    new_user = User(
        company_name=user_data.company_name,
        email=user_data.email,
        hashed_password=hashed_pw
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send the verification email (best-effort — a failed send never blocks
    # signup; the user can request a fresh link from /verify/resend).
    token = create_token(db, new_user.id, VERIFY_EMAIL)
    send_verification_email(new_user.email, token)

    audit(db, "auth.register", request, user_id=new_user.id, email=new_user.email)

    return new_user

@router.post("/login")
def login_user(credentials: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    enforce_rate_limit(request, "login")

    user = db.query(User).filter(User.email == credentials.email).first()

    # Always run exactly one bcrypt verify so unknown emails don't return
    # faster than wrong passwords (timing-based account enumeration).
    hash_to_check = user.hashed_password if user else _DUMMY_HASH
    password_ok = pwd_context.verify(credentials.password, hash_to_check)

    if not user or not password_ok:
        audit(db, "auth.login.failed", request, user_id=user.id if user else None, email=credentials.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Opt-in gate: block unverified accounts only when explicitly enabled.
    if REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in. Check your inbox for the link.",
        )

    token = _mint_access_token(user.id)

    audit(db, "auth.login.success", request, user_id=user.id, email=user.email)

    # Session travels as an httpOnly cookie; the body copy stays for API
    # clients and the transition period (the frontend no longer stores it).
    # A rotating refresh token (its own cookie) silently renews the short
    # access token — see POST /auth/refresh.
    _set_session_cookie(response, token)
    _set_refresh_cookie(response, create_family(db, user.id))

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "company_name": user.company_name
    }

# ---- Google Sign-In OAuth ----

@router.get("/google/login")
def google_auth_redirect():
    """Generates the Google OAuth URL for sign-in.
    Uses the SAME redirect URI that's already registered in Google Cloud Console."""
    if not GOOGLE_CLIENT_ID:
        # Without this the URL would literally contain "None" and users would
        # land on an opaque Google error page.
        raise HTTPException(status_code=503, detail="Google sign-in isn't configured on this server.")

    # Reuse the registered integrations callback
    registered_redirect_uri = f"{BACKEND_URL}/api/v1/integrations/google/callback"
    scopes = " ".join([
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/analytics.readonly"
    ])
    # Signed, short-lived CSRF state. The callback reads the flow's intent from
    # the verified token, never from a raw/guessable value.
    state = create_oauth_state(purpose="signin")
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={registered_redirect_uri}"
        f"&response_type=code"
        f"&scope={scopes}"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={state}"
    )
    return {"url": auth_url}


@router.post("/exchange")
def exchange_auth_code(payload: AuthCodeExchange, request: Request, response: Response, db: Session = Depends(get_db)):
    """Exchange a single-use OAuth `auth_code` for the session JWT.

    Keeps the long-lived token out of the redirect URL: the callback hands the
    browser an opaque code, and the frontend trades it here for the real token.
    """
    enforce_rate_limit(request, "exchange")
    token = consume_auth_code(db, payload.code)
    if not token:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    _set_session_cookie(response, token)
    try:
        user_id = int(jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])["sub"])
        _set_refresh_cookie(response, create_family(db, user_id))
        audit(db, "auth.login.google", request, user_id=user_id)
    except Exception:
        audit(db, "auth.login.google", request)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """Sign out this device: revoke its refresh-token family server-side and
    clear both cookies. (Bearer clients just drop their token.)"""
    raw = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw:
        revoke_family(db, raw)
    for name in (SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME):
        response.delete_cookie(key=name, path="/", httponly=True, secure=COOKIE_SECURE, samesite="lax")
    return {"detail": "Signed out."}


@router.post("/refresh")
def refresh_session(request: Request, response: Response, db: Session = Depends(get_db)):
    """Trade the rotating refresh token for a fresh access token.

    Single-use: the presented token is spent and a successor in the same
    family is set. Replaying a spent token means two parties hold it (theft) —
    the family is revoked, both get signed out, and the event is audited.
    """
    enforce_rate_limit(request, "refresh")

    raw = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw:
        raise HTTPException(status_code=401, detail="No refresh token.")

    try:
        rotated = rotate(db, raw)
    except ReuseDetected as reuse:
        audit(db, "auth.refresh.reuse_detected", request, user_id=reuse.user_id)
        for name in (SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME):
            response.delete_cookie(key=name, path="/", httponly=True, secure=COOKIE_SECURE, samesite="lax")
        raise HTTPException(status_code=401, detail="Session revoked. Please sign in again.")

    if rotated is None:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    user_id, new_raw = rotated
    token = _mint_access_token(user_id)
    _set_session_cookie(response, token)
    _set_refresh_cookie(response, new_raw)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout-all")
def logout_all(request: Request, response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Sign out everywhere: revoke every refresh token on the account. Existing
    access tokens still ride out their short TTL (max ~30 min)."""
    n = revoke_all(db, current_user.id)
    audit(db, "auth.logout.all", request, user_id=current_user.id, email=current_user.email, detail=f"{n} token(s) revoked")
    for name in (SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME):
        response.delete_cookie(key=name, path="/", httponly=True, secure=COOKIE_SECURE, samesite="lax")
    return {"detail": "Signed out on all devices."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """The authenticated user's own profile (used by the settings page)."""
    return current_user


@router.get("/me/export")
def export_my_data(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """GDPR/CCPA data-portability: download everything we hold about you.

    Encrypted OAuth credentials are deliberately excluded — they're Google's
    secrets, not user data, and exporting them would be a security hole.
    """
    enforce_rate_limit(request, "export")

    integrations = db.query(Integration).filter(Integration.user_id == current_user.id).all()
    trail = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(500)
        .all()
    )
    caches = db.query(DashboardCache).filter(DashboardCache.user_id == current_user.id).all()

    def _iso(dt):
        return dt.isoformat() + "Z" if dt else None

    export = {
        "exported_at": _iso(utcnow()),
        "profile": {
            "id": current_user.id,
            "email": current_user.email,
            "company_name": current_user.company_name,
            "is_verified": current_user.is_verified,
            "created_at": _iso(current_user.created_at),
        },
        "integrations": [
            {
                "provider": i.provider,
                "property_id": i.property_id,
                "created_at": _iso(i.created_at),
                "note": "OAuth credentials are stored encrypted and are not exportable.",
            }
            for i in integrations
        ],
        "audit_trail": [
            {"event": a.event, "ip": a.ip, "detail": a.detail, "at": _iso(a.created_at)}
            for a in trail
        ],
        "cached_dashboards": [
            {
                "property": c.property_key or "(default)",
                "fetched_at": _iso(c.fetched_at),
                "payload": json.loads(c.payload),
            }
            for c in caches
        ],
    }

    audit(db, "account.exported", request, user_id=current_user.id, email=current_user.email)

    return JSONResponse(
        content=export,
        headers={"Content-Disposition": 'attachment; filename="arbflow-data-export.json"'},
    )


@router.delete("/me", status_code=204)
def delete_account(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permanently delete the account and everything attached to it — the
    user's row plus all their connected integrations (which hold encrypted
    OAuth tokens). This is the GDPR/CCPA right-to-erasure path; it's
    irreversible and cascades so no orphaned credentials are left behind.
    The audit trail is kept for incident response but *anonymized* (emails
    nulled), honouring erasure while preserving the security record."""
    user_id = current_user.id
    db.query(Integration).filter(Integration.user_id == user_id).delete()
    db.query(VerificationToken).filter(VerificationToken.user_id == user_id).delete()
    db.query(DashboardCache).filter(DashboardCache.user_id == user_id).delete()
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    # Team ties, in both directions: their workspace's members/invites, and any
    # memberships they hold in other workspaces.
    db.query(TeamMembership).filter(
        (TeamMembership.owner_id == user_id) | (TeamMembership.member_id == user_id)
    ).delete()
    db.query(TeamInvitation).filter(TeamInvitation.owner_id == user_id).delete()
    db.query(BrandSettings).filter(BrandSettings.user_id == user_id).delete()
    db.query(NotificationSettings).filter(NotificationSettings.user_id == user_id).delete()
    db.query(ReportSchedule).filter(ReportSchedule.user_id == user_id).delete()
    db.query(AuditLog).filter(AuditLog.user_id == user_id).update({"email": None})
    db.delete(current_user)
    db.commit()
    audit(db, "auth.account.deleted", request, user_id=user_id)
    return None


# ---- Email verification ----

@router.post("/verify")
def verify_email(payload: TokenPayload, request: Request, db: Session = Depends(get_db)):
    """Confirm an email address from the link we emailed at signup."""
    enforce_rate_limit(request, "token")
    user_id = consume_token(db, payload.token, VERIFY_EMAIL, VERIFY_TTL_SECONDS)
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    if user is None:
        raise HTTPException(status_code=400, detail="This verification link is invalid or has expired.")
    user.is_verified = True
    db.commit()
    audit(db, "auth.email.verified", request, user_id=user.id, email=user.email)
    return {"detail": "Email verified. You can now sign in."}


@router.post("/verify/resend")
def resend_verification(payload: EmailRequest, request: Request, db: Session = Depends(get_db)):
    """Send a fresh verification link. Always returns the same generic response
    so it can't be used to probe which addresses have (unverified) accounts."""
    enforce_rate_limit(request, "email")
    user = db.query(User).filter(User.email == payload.email).first()
    if user and not user.is_verified:
        token = create_token(db, user.id, VERIFY_EMAIL)
        send_verification_email(user.email, token)
    return {"detail": "If that account exists and isn't verified yet, a new link is on its way."}


# ---- Password reset ----

@router.post("/password/forgot")
def forgot_password(payload: EmailRequest, request: Request, db: Session = Depends(get_db)):
    """Start a password reset. Generic response either way — no enumeration."""
    enforce_rate_limit(request, "email")
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        token = create_token(db, user.id, RESET_PASSWORD)
        send_password_reset_email(user.email, token)
        audit(db, "auth.password.reset.requested", request, user_id=user.id, email=user.email)
    return {"detail": "If that account exists, a password-reset link is on its way."}


@router.post("/password/reset")
def reset_password(payload: PasswordResetPayload, request: Request, db: Session = Depends(get_db)):
    """Set a new password using a single-use reset token."""
    enforce_rate_limit(request, "token")
    user_id = consume_token(db, payload.token, RESET_PASSWORD, RESET_TTL_SECONDS)
    user = db.query(User).filter(User.id == user_id).first() if user_id else None
    if user is None:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    user.hashed_password = pwd_context.hash(payload.password)
    # Completing a reset proves the person controls the inbox — treat as verified.
    user.is_verified = True
    db.commit()
    audit(db, "auth.password.reset.success", request, user_id=user.id, email=user.email)
    return {"detail": "Password updated. You can now sign in with your new password."}

# The actual Google OAuth callback is handled by integrations.py
# (/api/v1/integrations/google/callback) which is already registered
# in Google Cloud Console. The signed state token (purpose="signin") tells
# it to create/find the user and issue a single-use auth code.