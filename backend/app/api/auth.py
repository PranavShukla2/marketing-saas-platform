from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt
import os
import json
import requests
from datetime import datetime, timedelta

from app.db.database import get_db
from app.db.models import User, Integration
from app.schemas import UserCreate, UserLogin, UserResponse

router = APIRouter()

# 1. Setup Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. Setup JWT configuration
SECRET_KEY = "my-super-secret-saas-key"
ALGORITHM = "HS256"

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

BACKEND_URL = os.getenv("BACKEND_URL", "https://arbflow-backend.onrender.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://marketing-saas-platform-pi.vercel.app")
GOOGLE_AUTH_REDIRECT_URI = f"{BACKEND_URL}/api/v1/auth/google/callback"

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
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
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not pwd_context.verify(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    expire = datetime.utcnow() + timedelta(hours=24)
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
    """Generates the Google OAuth URL for sign-in and redirects."""
    scopes = " ".join([
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/analytics.readonly"
    ])
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_AUTH_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope={scopes}"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return {"url": auth_url}

@router.get("/google/callback")
def google_auth_callback(code: str, db: Session = Depends(get_db)):
    """Handles the Google OAuth callback for sign-in. 
    Creates a user if they don't exist, and auto-connects their GA4."""
    
    # 1. Exchange authorization code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GOOGLE_AUTH_REDIRECT_URI
    }
    
    token_response = requests.post(token_url, data=payload)
    token_data = token_response.json()
    
    if "error" in token_data:
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_auth_failed")
    
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    id_token = token_data.get("id_token")
    
    # 2. Fetch user profile from Google
    userinfo_response = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    userinfo = userinfo_response.json()
    
    google_email = userinfo.get("email")
    google_name = userinfo.get("name", google_email.split("@")[0])
    
    if not google_email:
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_email")
    
    # 3. Find or create user
    user = db.query(User).filter(User.email == google_email).first()
    
    if not user:
        # Auto-register via Google
        user = User(
            company_name=google_name,
            email=google_email,
            hashed_password=pwd_context.hash(os.urandom(32).hex())  # Random password (they use Google)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # 4. Auto-connect their Google Analytics (same account!)
    credentials_dict = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": token_data.get("expires_in"),
        "token_type": token_data.get("token_type")
    }
    credentials_json = json.dumps(credentials_dict)
    
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
    
    # 5. Generate JWT and redirect to frontend
    expire = datetime.utcnow() + timedelta(hours=24)
    token_payload = {"sub": str(user.id), "exp": expire}
    jwt_token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    from fastapi.responses import RedirectResponse
    return RedirectResponse(
        url=f"{FRONTEND_URL}/dashboard?token={jwt_token}&integration=success"
    )