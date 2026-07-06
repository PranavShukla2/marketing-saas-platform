from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
import os
from datetime import timedelta

from app.db.database import get_db
from app.db.models import User, Integration, VerificationToken
from app.schemas import (
    UserCreate, UserLogin, UserResponse, AuthCodeExchange,
    EmailRequest, TokenPayload, PasswordResetPayload,
)
from app.core.config import (
    SECRET_KEY, ALGORITHM,
    SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, COOKIE_SECURE,
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

    expire = utcnow() + timedelta(hours=24)
    token_data = {"sub": str(user.id), "exp": expire}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    # Session travels as an httpOnly cookie; the body copy stays for API
    # clients and the transition period (the frontend no longer stores it).
    _set_session_cookie(response, token)

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
    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    """Clear the session cookie. (Bearer clients just drop their token.)"""
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )
    return {"detail": "Signed out."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """The authenticated user's own profile (used by the settings page)."""
    return current_user


@router.delete("/me", status_code=204)
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permanently delete the account and everything attached to it — the
    user's row plus all their connected integrations (which hold encrypted
    OAuth tokens). This is the GDPR/CCPA right-to-erasure path; it's
    irreversible and cascades so no orphaned credentials are left behind."""
    db.query(Integration).filter(Integration.user_id == current_user.id).delete()
    db.query(VerificationToken).filter(VerificationToken.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()
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
    return {"detail": "Password updated. You can now sign in with your new password."}

# The actual Google OAuth callback is handled by integrations.py
# (/api/v1/integrations/google/callback) which is already registered
# in Google Cloud Console. The signed state token (purpose="signin") tells
# it to create/find the user and issue a single-use auth code.