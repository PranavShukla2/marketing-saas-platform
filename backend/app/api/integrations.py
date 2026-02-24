import os
import json 
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse

from app.api.deps import get_db, get_current_user
from app.db.models import Integration, User

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# --- THE FIX 1: Dynamic Backend URL for Google's Callback ---
# It defaults to your live Render URL, but you can override it in your local .env
BACKEND_URL = os.getenv("BACKEND_URL", "https://arbflow-backend.onrender.com")
GOOGLE_REDIRECT_URI = f"{BACKEND_URL}/api/v1/integrations/google/callback"

# --- THE FIX 2: Dynamic Frontend URL for the final redirect ---
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://marketing-saas-platform-pi.vercel.app")

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
    """Catches the auth code, exchanges for a token, and saves to PostgreSQL."""
    
    # 1. Convert state back to an integer user_id
    try:
        user_id = int(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID in state parameter")
    
    # 2. Request the tokens from Google
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
        raise HTTPException(status_code=400, detail=token_data.get("error_description", "Unknown error"))
        
    # 3. Package the tokens into a JSON string for the database
    credentials_dict = {
        "access_token": token_data.get("access_token"),
        "refresh_token": token_data.get("refresh_token"), 
        "expires_in": token_data.get("expires_in"),
        "token_type": token_data.get("token_type")
    }
    credentials_json = json.dumps(credentials_dict)
    
    # 4. The Upsert Logic: Check if this user already connected Google Analytics
    existing_integration = db.query(Integration).filter(
        Integration.user_id == user_id,
        Integration.provider == "google_analytics"  
    ).first()
    
    if existing_integration:
        # Update existing record
        existing_integration.encrypted_credentials = credentials_json  
    else:
        # Create new record
        new_integration = Integration(
            user_id=user_id,
            provider="google_analytics",  
            encrypted_credentials=credentials_json  
        )
        db.add(new_integration)
        
    # 5. Commit the transaction to Neon!
    db.commit()
    
    # 6. Redirect the user back to your live Next.js frontend
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?integration=success")