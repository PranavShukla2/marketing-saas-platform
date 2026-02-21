from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, Integration
from app.api.deps import get_current_user
from app.core.security import decrypt_data
from app.services.google_analytics import (
    fetch_ga4_metrics, 
    predict_future_views, 
    generate_roi_insights
)

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ga4 = db.query(Integration).filter(Integration.user_id == current_user.id, Integration.provider == "google_analytics").first()
    if not ga4:
        return {"data": {"status": "pending", "company_name": current_user.company_name}}

    try:
        decrypted_json = decrypt_data(ga4.encrypted_credentials)
        live_data = fetch_ga4_metrics(ga4.property_id, decrypted_json)
        
        return {
            "data": {
                "summary": live_data['summary'],
                "post_level": live_data['post_level'],
                "forecast": predict_future_views(live_data['post_level']),
                "suggestions": generate_roi_insights(live_data['post_level']),
                "company_name": current_user.company_name,
                "status": "connected"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))