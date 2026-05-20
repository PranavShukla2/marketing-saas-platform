import os
import json 
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

from app.api.deps import get_db, get_current_user
from app.db.models import Integration, User

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

SECRET_KEY = "my-super-secret-saas-key"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/google/link")
def get_google_login_link(current_user: User = Depends(get_current_user)):
    """Generates a personalized Google OAuth URL for the logged-in user."""
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=https://www.googleapis.com/auth/analytics.readonly"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={current_user.id}"  
    )
    return {"url": auth_url}

@router.get("/google/login")
def google_login(user_id: str):
    """Generates the Google OAuth 2.0 URL and redirects the user."""
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=https://www.googleapis.com/auth/analytics.readonly"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={user_id}" 
    )
    return RedirectResponse(url=auth_url)

@router.get("/google/callback")
def google_callback(code: str, state: str, db: Session = Depends(get_db)): 
    """Handles Google OAuth callback for BOTH:
    1. Sign-in flow (state='auth_signin') — auto-creates user + connects GA4 + returns JWT
    2. Integration flow (state=user_id) — just connects GA4 for an existing user
    """
    
    # 1. Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GOOGLE_REDIRECT_URI
    }
    
    response = requests.post(token_url, data=payload)
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
    credentials_json = json.dumps(credentials_dict)
    
    # ---- SIGN-IN FLOW ----
    if state == "auth_signin":
        # Fetch Google profile
        userinfo_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        userinfo = userinfo_response.json()
        
        google_email = userinfo.get("email")
        google_name = userinfo.get("name", google_email.split("@")[0] if google_email else "User")
        
        if not google_email:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_email")
        
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
        
        # Generate JWT and redirect
        expire = datetime.utcnow() + timedelta(hours=24)
        jwt_token = jwt.encode({"sub": str(user.id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
        
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?token={jwt_token}&integration=success")
    
    # ---- INTEGRATION FLOW (existing user connecting GA4) ----
    else:
        try:
            user_id = int(state)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID in state parameter")
        
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
        
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?integration=success")

# ---- META OAUTH SCAFFOLDING ----

@router.get("/meta/link")
def get_meta_login_link(current_user: User = Depends(get_current_user)):
    """Generates Meta OAuth URL"""
    auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth"
        f"?client_id={META_APP_ID}"
        f"&redirect_uri={META_REDIRECT_URI}"
        f"&state={current_user.id}"
        f"&scope=ads_management,ads_read,business_management,pages_read_engagement,pages_show_list,instagram_basic,instagram_manage_insights"
    )
    return {"url": auth_url}

@router.get("/meta/callback")
def meta_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handles Meta OAuth callback (Scaffold)"""
    try:
        user_id = int(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state")
        
    # Scaffold: Exchange code for token (would use META_APP_SECRET here)
    mock_token = {"access_token": "mock_meta_token_123", "type": "meta"}
    
    existing = db.query(Integration).filter(Integration.user_id == user_id, Integration.provider == "meta_ads").first()
    if existing:
        existing.encrypted_credentials = json.dumps(mock_token)
    else:
        db.add(Integration(user_id=user_id, provider="meta_ads", encrypted_credentials=json.dumps(mock_token)))
    
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
        f"&state={current_user.id}"
        f"&scope=r_organization_social,r_basicprofile"
    )
    return {"url": auth_url}

@router.get("/linkedin/callback")
def linkedin_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handles LinkedIn OAuth callback (Scaffold)"""
    try:
        user_id = int(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state")
        
    # Scaffold: Exchange code for token (would use LINKEDIN_CLIENT_SECRET here)
    mock_token = {"access_token": "mock_linkedin_token_123", "type": "linkedin"}
    
    existing = db.query(Integration).filter(Integration.user_id == user_id, Integration.provider == "linkedin").first()
    if existing:
        existing.encrypted_credentials = json.dumps(mock_token)
    else:
        db.add(Integration(user_id=user_id, provider="linkedin", encrypted_credentials=json.dumps(mock_token)))
    
    db.commit()
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?platform=linkedin&integration=success")