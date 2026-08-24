import os
import json 
import requests
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse
from passlib.context import CryptContext
import jwt
from datetime import timedelta

from app.api.deps import get_db, get_current_user
from app.db.models import Integration, User
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_TTL_MINUTES
from app.core.security import encrypt_credentials
from app.core.oauth import create_oauth_state, verify_oauth_state, create_auth_code
from app.core.http import http
from app.services.audit import record as audit
from app.core.time import utcnow

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

BACKEND_URL = os.getenv("BACKEND_URL", "https://arbflow-backend.onrender.com")
GOOGLE_REDIRECT_URI = f"{BACKEND_URL}/api/v1/integrations/google/callback"

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://marketing-saas-platform-pi.vercel.app")

META_APP_ID = os.getenv("META_APP_ID")
META_APP_SECRET = os.getenv("META_APP_SECRET")
META_REDIRECT_URI = f"{BACKEND_URL}/api/v1/integrations/meta/callback"

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
LINKEDIN_REDIRECT_URI = f"{BACKEND_URL}/api/v1/integrations/linkedin/callback"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PROVIDERS = ("google_analytics", "meta_ads", "linkedin")


@router.get("")
@router.get("/")
def list_integrations(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """What this account has actually connected.

    The Integrations page had no way to ask: it rendered three identical cards
    whose button read "Manage Connection" whenever *any* session existed, so a
    user with only GA4 linked was told Meta and LinkedIn were connected too.

    Deliberately returns a row per known provider rather than only the ones
    present in the table, so the page can render the full directory from one
    response. Credentials are never included -- only whether they exist.
    """
    rows = {
        i.provider: i
        for i in db.query(Integration).filter(Integration.user_id == current_user.id).all()
    }
    return {
        "integrations": [
            {
                "provider": p,
                "connected": p in rows,
                "property_id": rows[p].property_id if p in rows else None,
                "connected_at": rows[p].created_at.isoformat() + "Z" if p in rows and rows[p].created_at else None,
            }
            for p in PROVIDERS
        ]
    }


@router.get("/google/link")
def get_google_login_link(current_user: User = Depends(get_current_user)):
    """Generates a personalized Google OAuth URL for the logged-in user."""
    # Signed state binds this link request to the authenticated user id so the
    # callback can trust it without reading a raw, forgeable value from the URL.
    state = create_oauth_state(purpose="link", user_id=current_user.id)
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=https://www.googleapis.com/auth/analytics.readonly"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={state}"
    )
    return {"url": auth_url}

@router.get("/google/callback")
def google_callback(request: Request, code: str | None = None, state: str | None = None, error: str | None = None, db: Session = Depends(get_db)):
    """Handles Google OAuth callback for BOTH:
    1. Sign-in flow (state purpose='signin') — auto-creates user + connects GA4 + issues a one-time auth code
    2. Integration flow (state purpose='link') — just connects GA4 for the user bound to the state
    """
    # User hit "Cancel" on the consent screen (or Google sent an error): land
    # them back on login with a friendly message, not a raw validation error.
    if error or not code or not state:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_cancelled")

    # Verify the signed state FIRST — reject anything forged/expired.
    try:
        state_data = verify_oauth_state(state)
    except Exception:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=invalid_state")
    purpose = state_data.get("purpose")

    # 1. Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GOOGLE_REDIRECT_URI
    }

    # Never call out without a timeout: a hung upstream would pin a worker forever.
    response = http.post(token_url, data=payload, timeout=15)
    token_data = response.json()
    
    if "error" in token_data:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_auth_failed")
        
    access_token = token_data.get("access_token")
    
    # Package credentials for storage
    credentials_dict = {
        "access_token": access_token,
        "refresh_token": token_data.get("refresh_token"),
        "expires_in": token_data.get("expires_in"),
        "token_type": token_data.get("token_type")
    }
    # Encrypt before it ever touches the database.
    credentials_json = encrypt_credentials(credentials_dict)
    
    # ---- SIGN-IN FLOW ----
    if purpose == "signin":
        # Fetch Google profile
        userinfo_response = http.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
        userinfo = userinfo_response.json()

        # Normalize like /register does, so Google sign-in always matches the
        # password account with the same address instead of duplicating it.
        google_email = (userinfo.get("email") or "").strip().lower() or None
        # Google's v2 userinfo returns this boolean; treat missing as unverified.
        email_verified = userinfo.get("verified_email", False)

        if not google_email:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_email")

        # Only trust the email — and therefore sign into / link a matching
        # account — when Google has confirmed the user actually owns it.
        # Otherwise an attacker could register a Google account claiming a
        # victim's address and be logged straight into the victim's account.
        if not email_verified:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=email_unverified")

        google_name = userinfo.get("name", google_email.split("@")[0])
        
        # Find or create user
        user = db.query(User).filter(User.email == google_email).first()
        
        if not user:
            user = User(
                company_name=google_name,
                email=google_email,
                hashed_password=pwd_context.hash(os.urandom(32).hex())
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Auto-connect GA4
        existing_integration = db.query(Integration).filter(
            Integration.user_id == user.id,
            Integration.provider == "google_analytics"
        ).first()
        
        if existing_integration:
            existing_integration.encrypted_credentials = credentials_json
        else:
            new_integration = Integration(
                user_id=user.id,
                provider="google_analytics",
                encrypted_credentials=credentials_json
            )
            db.add(new_integration)
        
        db.commit()

        # Mint the session JWT, but hand the browser a single-use code instead
        # of the token itself so the JWT never lands in a URL / history / logs.
        expire = utcnow() + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES)
        jwt_token = jwt.encode({"sub": str(user.id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
        auth_code = create_auth_code(db, jwt_token)

        audit(db, "integration.google.connected", request, user_id=user.id, email=user.email, detail="signin flow")

        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?auth_code={auth_code}&integration=success")

    # ---- INTEGRATION FLOW (existing user connecting GA4) ----
    else:
        user_id = state_data.get("uid")
        if not user_id:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=invalid_state")

        existing_integration = db.query(Integration).filter(
            Integration.user_id == user_id,
            Integration.provider == "google_analytics"  
        ).first()
        
        if existing_integration:
            existing_integration.encrypted_credentials = credentials_json  
        else:
            new_integration = Integration(
                user_id=user_id,
                provider="google_analytics",  
                encrypted_credentials=credentials_json  
            )
            db.add(new_integration)
            
        db.commit()

        audit(db, "integration.google.connected", request, user_id=user_id, detail="link flow")

        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?integration=success")

# ---- META OAUTH SCAFFOLDING ----

@router.get("/meta/link")
def get_meta_login_link(current_user: User = Depends(get_current_user)):
    """Generates Meta OAuth URL"""
    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth"
        f"?client_id={META_APP_ID}"
        f"&redirect_uri={META_REDIRECT_URI}"
        f"&state={create_oauth_state(purpose='link', user_id=current_user.id)}"
        f"&scope=ads_management,ads_read,business_management,pages_read_engagement,pages_show_list,instagram_basic,instagram_manage_insights"
    )
    return {"url": auth_url}

@router.get("/meta/callback")
def meta_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handles Meta OAuth callback (Scaffold)"""
    try:
        user_id = verify_oauth_state(state).get("uid")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid state")

    # Scaffold: Exchange code for token (would use META_APP_SECRET here)
    mock_token = {"access_token": "mock_meta_token_123", "type": "meta"}
    encrypted = encrypt_credentials(mock_token)

    existing = db.query(Integration).filter(Integration.user_id == user_id, Integration.provider == "meta_ads").first()
    if existing:
        existing.encrypted_credentials = encrypted
    else:
        db.add(Integration(user_id=user_id, provider="meta_ads", encrypted_credentials=encrypted))
    
    db.commit()
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?platform=meta&integration=success")


# ---- LINKEDIN OAUTH SCAFFOLDING ----

@router.get("/linkedin/link")
def get_linkedin_login_link(current_user: User = Depends(get_current_user)):
    """Generates LinkedIn OAuth URL"""
    auth_url = (
        f"https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={LINKEDIN_CLIENT_ID}"
        f"&redirect_uri={LINKEDIN_REDIRECT_URI}"
        f"&state={create_oauth_state(purpose='link', user_id=current_user.id)}"
        f"&scope=r_organization_social,r_basicprofile"
    )
    return {"url": auth_url}

@router.get("/linkedin/callback")
def linkedin_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handles LinkedIn OAuth callback (Scaffold)"""
    try:
        user_id = verify_oauth_state(state).get("uid")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid state")

    # Scaffold: Exchange code for token (would use LINKEDIN_CLIENT_SECRET here)
    mock_token = {"access_token": "mock_linkedin_token_123", "type": "linkedin"}
    encrypted = encrypt_credentials(mock_token)

    existing = db.query(Integration).filter(Integration.user_id == user_id, Integration.provider == "linkedin").first()
    if existing:
        existing.encrypted_credentials = encrypted
    else:
        db.add(Integration(user_id=user_id, provider="linkedin", encrypted_credentials=encrypted))
    
    db.commit()
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?platform=linkedin&integration=success")