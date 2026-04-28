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
    """Generates the Google OAuth URL for sign-in.
    Uses the SAME redirect URI that's already registered in Google Cloud Console."""
    # Reuse the registered integrations callback
    registered_redirect_uri = f"{BACKEND_URL}/api/v1/integrations/google/callback"
    scopes = " ".join([
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/analytics.readonly"
    ])
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={registered_redirect_uri}"
        f"&response_type=code"
        f"&scope={scopes}"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state=auth_signin"
    )
    return {"url": auth_url}

# The actual Google OAuth callback is handled by integrations.py
# (/api/v1/integrations/google/callback) which is already registered
# in Google Cloud Console. The state="auth_signin" parameter tells it
# to create/find the user and return a JWT.