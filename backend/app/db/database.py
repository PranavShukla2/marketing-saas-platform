import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv() # Loads the variables from the .env file

# Grabs the URL securely without exposing the password in the code
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

def _engine_kwargs(url: str) -> dict:
    """Pool settings tuned for serverless Postgres (Neon).

    - pool_pre_ping: Neon suspends idle databases and drops idle connections;
      without a ping, the first request after a quiet spell dies with
      'server closed the connection unexpectedly' (the /health 'degraded'
      blips). A cheap SELECT 1 on checkout replaces dead connections silently.
    - pool_recycle: retire connections before the server's idle timeout wins.
    - pool_size/max_overflow: small on purpose — one uvicorn worker and Neon's
      free tier caps concurrent connections; a big pool just hoards them.
      Override via env if the tier ever changes.
    SQLite (local/tests) gets none of this — its pooling is a no-op and the
    kwargs aren't all supported.
    """
    if url.startswith("sqlite"):
        return {}
    return {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "5")),
        "pool_timeout": 30,
    }

engine = create_engine(SQLALCHEMY_DATABASE_URL, **_engine_kwargs(SQLALCHEMY_DATABASE_URL))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
