from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, Integration
from app.api.deps import get_current_user
from app.core.security import decrypt_data

from app.services.google_analytics import (
    fetch_ga4_metrics, 
    predict_future_views, 
    generate_roi_insights,
    detect_traffic_anomalies
)

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_data(
    property_id: str = Query(None, description="Specific GA4 Property ID to fetch"),
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # 1. Fetch all integrations for the dropdown menu
    user_integrations = db.query(Integration).filter(
        Integration.user_id == current_user.id, 
        Integration.provider == "google_analytics"
    ).all()

    if not user_integrations:
        return {"data": {"status": "pending", "company_name": current_user.company_name}}

    # Format the list of properties for the frontend dropdown
    available_properties = [{"id": i.property_id, "name": getattr(i, 'client_name', f"Property {i.property_id}")} for i in user_integrations]

    # 2. Select the specific integration to display (default to the first one if none provided)
    active_integration = next((i for i in user_integrations if i.property_id == property_id), user_integrations[0])

    try:
        decrypted_json = decrypt_data(active_integration.encrypted_credentials)
        live_data = fetch_ga4_metrics(active_integration.property_id, decrypted_json)
        
        return {
            "data": {
                "summary": live_data['summary'],
                "post_level": live_data['post_level'],
                "forecast": predict_future_views(live_data['post_level']),
                "suggestions": generate_roi_insights(live_data['post_level']),
                "anomaly": detect_traffic_anomalies(live_data['post_level']),
                "company_name": current_user.company_name,
                "status": "connected",
                "properties": available_properties,
                "active_property_id": active_integration.property_id
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))