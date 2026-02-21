from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# For local development, we use SQLite. 
# For production (AWS/GCP), you just change this string to your PostgreSQL URL.
SQLALCHEMY_DATABASE_URL = "sqlite:///./saas.db"

# connect_args={"check_same_thread": False} is only needed for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get the database session in our API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()