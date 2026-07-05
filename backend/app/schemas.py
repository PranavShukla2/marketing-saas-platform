import re

from pydantic import BaseModel, Field, field_validator

# Simple, dependency-free email shape check. The frontend's type="email" is
# trivially bypassed with curl, so the server must validate too.
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class _EmailNormalizer(BaseModel):
    """Shared: validate the email's shape and normalize to lowercase, so
    Pranav@x.com and pranav@x.com can never become two different accounts."""

    email: str = Field(max_length=254)

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Enter a valid email address.")
        return v


# What we expect from the frontend when signing up
class UserCreate(_EmailNormalizer):
    company_name: str = Field(min_length=1, max_length=120)
    # bcrypt only reads the first 72 bytes, so cap there; floor of 8 keeps
    # trivially guessable passwords out.
    password: str = Field(min_length=8, max_length=72)

# What we expect from the frontend when logging in
class UserLogin(_EmailNormalizer):
    password: str = Field(max_length=72)

# Single-use code exchanged for a JWT after Google OAuth sign-in
class AuthCodeExchange(BaseModel):
    code: str

# Just an email (verification resend, forgot-password) — normalized like the rest
class EmailRequest(_EmailNormalizer):
    pass

# A single-use token from an email link (email verification)
class TokenPayload(BaseModel):
    token: str = Field(min_length=1, max_length=512)

# Reset a password with a single-use token + the new password
class PasswordResetPayload(BaseModel):
    token: str = Field(min_length=1, max_length=512)
    password: str = Field(min_length=8, max_length=72)

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