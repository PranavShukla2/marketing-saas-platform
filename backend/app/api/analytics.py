from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Integration
from app.api.deps import get_current_user
from app.core.security import decrypt_data
from app.services.google_analytics import fetch_ga4_metrics

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"✅ Secure data requested by: {current_user.company_name} (ID: {current_user.id})")
    
    # 1. Look for a Google Analytics integration in the database for THIS user
    ga4_integration = db.query(Integration).filter(
        Integration.user_id == current_user.id,
        Integration.provider == "google_analytics"
    ).first()

    # 2. If they haven't connected GA4 yet, send placeholder/empty data
    if not ga4_integration:
        return {
            "data": {
                "active_users": "-",
                "page_views": "-",
                "bounce_rate": "-",
                "company_name": current_user.company_name,
                "status": "pending_integration"
            }
        }

    try:
        # 3. Decrypt the sensitive JSON string from the database
        decrypted_json = decrypt_data(ga4_integration.encrypted_credentials)
        property_id = ga4_integration.property_id

        # 4. Fetch the real data from Google's servers!
        print(f"📡 Fetching live Google Analytics data for Property ID: {property_id}...")
        live_metrics = fetch_ga4_metrics(property_id=property_id, decrypted_json_str=decrypted_json)
        
        # 5. Combine the metrics with the user's company name and send to React
        live_metrics["company_name"] = current_user.company_name
        live_metrics["status"] = "connected"
        
        return {"data": live_metrics}

    except Exception as e:
        # If decryption fails or Google rejects the key, catch it cleanly
        raise HTTPException(status_code=400, detail=str(e))