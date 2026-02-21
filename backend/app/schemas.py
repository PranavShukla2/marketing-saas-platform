from pydantic import BaseModel

# What we expect from the frontend when signing up
class UserCreate(BaseModel):
    company_name: str
    email: str
    password: str

# What we expect from the frontend when logging in
class UserLogin(BaseModel):
    email: str
    password: str

# What we send back to the frontend (notice we NEVER send the password back!)
class UserResponse(BaseModel):
    id: int
    email: str
    company_name: str

    class Config:
        from_attributes = True

# ... (your existing User models are up here)

# What we expect from the frontend Settings page
class IntegrationCreate(BaseModel):
    provider: str  # e.g., "google_analytics"
    property_id: str
    service_account_json: str

# What we send back (Notice we DO NOT send the JSON key back!)
class IntegrationResponse(BaseModel):
    id: int
    provider: str
    property_id: str
    
    class Config:
        from_attributes = True