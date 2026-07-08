from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, false
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.core.time import utcnow

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    # New signups start unverified; existing accounts are grandfathered to
    # verified in the migration. Enforcement of this at login is opt-in via the
    # REQUIRE_EMAIL_VERIFICATION env flag.
    is_verified = Column(Boolean, nullable=False, default=False, server_default=false())
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


class VerificationToken(Base):
    """Single-use, hashed token for email verification and password resets.

    Only the sha256 of the token is stored (like `auth_codes`), the raw token
    goes out once in an email link, and the row is deleted atomically on first
    use. `purpose` separates the two flows so a verify token can't reset a
    password and vice-versa.
    """
    __tablename__ = "verification_tokens"

    token_hash = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    purpose = Column(String, nullable=False)  # "verify_email" | "reset_password"
    created_at = Column(DateTime, default=utcnow, nullable=False)


class DashboardCache(Base):
    """Cached GA4 dashboard payload per (user, property).

    Serves dashboard loads within a TTL instead of hitting Google live on every
    page view, and gives the background sync somewhere to write. Also carries
    the anomaly-alert dedupe key so the same anomaly never emails twice.
    """
    __tablename__ = "dashboard_cache"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    # "" for the account's default property, else the requested property id.
    property_key = Column(String, primary_key=True, default="")
    payload = Column(String, nullable=False)  # JSON blob of the dashboard data
    fetched_at = Column(DateTime, nullable=False, default=utcnow)
    # e.g. "sessions:07/11:dip" — the last anomaly we emailed about.
    last_anomaly_key = Column(String, nullable=True)

class AuditLog(Base):
    """Security-relevant events: who did what, from where, when.

    user_id is a plain Integer (no FK) so history survives account deletion —
    but deletion *anonymizes* the rows (email nulled) to honour erasure. Only
    high-value events are recorded; this is an incident-response trail, not
    general analytics.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, index=True)
    event = Column(String, nullable=False, index=True)   # e.g. "auth.login.failed"
    email = Column(String, nullable=True)                # nulled on account deletion
    ip = Column(String, nullable=True)
    detail = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
