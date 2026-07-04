from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.core.time import utcnow

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=utcnow)

    # A single user can have multiple integrations (GA4, Meta Ads, etc.)
    integrations = relationship("Integration", back_populates="owner")


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    provider = Column(String) # e.g., "google_analytics", "meta_ads"
    property_id = Column(String, nullable=True) # e.g., GA4 Property ID
    encrypted_credentials = Column(String) # Fernet-encrypted JSON credentials blob
    created_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="integrations")


class AuthCode(Base):
    """Single-use, short-lived code exchanged for a JWT after OAuth sign-in.

    Lets the OAuth callback hand the browser an opaque code in the URL instead
    of the long-lived JWT itself. The frontend POSTs the code to /auth/exchange
    to obtain the token, and the row is deleted on first use.
    """
    __tablename__ = "auth_codes"

    code = Column(String, primary_key=True, index=True)
    token = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)