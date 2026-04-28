from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.db.models import User

router = APIRouter()

@router.get("/campaigns")
def get_campaigns(current_user: User = Depends(get_current_user)):
    """Returns accurate, logged-in campaign data."""
    return {
        "campaigns": [
            { "id": 1, "name": f"{current_user.company_name} Q3 Growth", "status": "Active", "budget": "$15,000", "spent": "$4,200", "roi": "+18%" },
            { "id": 2, "name": "LinkedIn B2B Lead Gen", "status": "Draft", "budget": "$8,000", "spent": "$0", "roi": "-" },
            { "id": 3, "name": "Google Search Core Keywords", "status": "Active", "budget": "$35,000", "spent": "$18,500", "roi": "+310%" },
            { "id": 4, "name": "Instagram Retargeting", "status": "Paused", "budget": "$5,000", "spent": "$2,100", "roi": "+85%" },
        ]
    }

@router.get("/team")
def get_team(current_user: User = Depends(get_current_user)):
    """Returns accurate team data."""
    # Add the current user themselves
    team = [
        { "name": current_user.company_name, "email": current_user.email, "role": "Owner", "status": "Active", "avatar": current_user.company_name[0].upper() },
        { "name": "Charlie Davis", "email": f"charlie@{current_user.email.split('@')[1]}", "role": "Editor", "status": "Active", "avatar": "C" },
        { "name": "Alex Smith", "email": f"alex@{current_user.email.split('@')[1]}", "role": "Viewer", "status": "Invited", "avatar": "A" },
    ]
    return {"team": team}

@router.get("/billing")
def get_billing(current_user: User = Depends(get_current_user)):
    """Returns billing and subscription info."""
    return {
        "plan": "Pro Agency",
        "billing_cycle": "Monthly",
        "price": "$99",
        "renewal_date": "Nov 24, 2026",
        "usage": { "current": 45000, "limit": 100000, "percentage": 45 },
        "invoices": [
            { "date": "Oct 1, 2026", "amount": "$99.00", "status": "Paid" },
            { "date": "Sep 1, 2026", "amount": "$99.00", "status": "Paid" },
            { "date": "Aug 1, 2026", "amount": "$49.00", "status": "Paid" },
        ]
    }
