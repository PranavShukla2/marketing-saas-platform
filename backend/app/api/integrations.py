from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Integration
from app.api.deps import get_current_user
from app.schemas import IntegrationCreate, IntegrationResponse
from app.core.security import encrypt_data

router = APIRouter()

@router.post("/", response_model=IntegrationResponse)
def save_integration(
    integration_data: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # The Bouncer!
):
    print(f"🔒 Encrypting {integration_data.provider} keys for {current_user.company_name}...")
    
    # 1. Encrypt the sensitive JSON string
    encrypted_json = encrypt_data(integration_data.service_account_json)

    # 2. Check if this user already has a GA4 integration saved
    existing_integration = db.query(Integration).filter(
        Integration.user_id == current_user.id,
        Integration.provider == integration_data.provider
    ).first()

    if existing_integration:
        # If they do, update it with the new keys
        existing_integration.property_id = integration_data.property_id
        existing_integration.encrypted_credentials = encrypted_json
        db.commit()
        db.refresh(existing_integration)
        return existing_integration
    else:
        # If they don't, create a brand new integration record
        new_integration = Integration(
            user_id=current_user.id,
            provider=integration_data.provider,
            property_id=integration_data.property_id,
            encrypted_credentials=encrypted_json
        )
        db.add(new_integration)
        db.commit()
        db.refresh(new_integration)
        return new_integration