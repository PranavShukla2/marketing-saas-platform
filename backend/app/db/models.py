from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # A single user can have multiple integrations (GA4, Meta Ads, etc.)
    integrations = relationship("Integration", back_populates="owner")


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    provider = Column(String) # e.g., "google_analytics", "meta_ads"
    property_id = Column(String, nullable=True) # e.g., GA4 Property ID
    encrypted_credentials = Column(String) # The AES-256 encrypted JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="integrations")