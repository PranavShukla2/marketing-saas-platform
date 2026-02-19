from fastapi import APIRouter, HTTPException
from app.services.google_analytics import fetch_user_ga4_data

router = APIRouter()

@router.get("/{user_id}/dashboard")
def get_user_dashboard(user_id: int):
    """
    Fetches the marketing dashboard data for a specific tenant (user).
    """
    try:
        # 1. In a real app, you would query your DB here:
        # encrypted_key = db.query(APIKeys).filter(user_id=user_id).first()
        
        # Mocking the database retrieval for this example:
        mock_encrypted_key = b"gAAAAAB..." if user_id == 1 else None
        
        if not mock_encrypted_key:
             raise HTTPException(status_code=404, detail="Analytics integration not found for this user. Please connect your account.")

        # 2. Pass the encrypted key to your service layer
        data = fetch_user_ga4_data(user_id, mock_encrypted_key)
        
        return {"status": "success", "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))