from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
import os
from datetime import timedelta

from app.db.database import get_db
from app.db.models import User, Integration
from app.schemas import UserCreate, UserLogin, UserResponse, AuthCodeExchange
from app.core.config import SECRET_KEY, ALGORITHM
from app.core.oauth import create_oauth_state, consume_auth_code
from app.core.ratelimit import enforce_rate_limit
from app.core.time import utcnow
from app.api.deps import get_current_user

router = APIRouter()

# 1. Setup Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# A real bcrypt hash of a random throwaway value. When a login hits an unknown
# email we still verify against this, so "no such user" and "wrong password"
# take the same time — otherwise response timing quietly reveals which emails
# have accounts.
_DUMMY_HASH = pwd_context.hash(os.urandom(24).hex())

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

    return new_user

@router.post("/login")
def login_user(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
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

    expire = utcnow() + timedelta(hours=24)
    token_data = {"sub": str(user.id), "exp": expire}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

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
def exchange_auth_code(payload: AuthCodeExchange, request: Request, db: Session = Depends(get_db)):
    """Exchange a single-use OAuth `auth_code` for the session JWT.

    Keeps the long-lived token out of the redirect URL: the callback hands the
    browser an opaque code, and the frontend trades it here for the real token.
    """
    enforce_rate_limit(request, "exchange")
    token = consume_auth_code(db, payload.code)
    if not token:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    return {"access_token": token, "token_type": "bearer"}


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
    db.delete(current_user)
    db.commit()
    return None

# The actual Google OAuth callback is handled by integrations.py
# (/api/v1/integrations/google/callback) which is already registered
# in Google Cloud Console. The signed state token (purpose="signin") tells
# it to create/find the user and issue a single-use auth code.