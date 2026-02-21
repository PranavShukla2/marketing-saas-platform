from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine
from app.db import models
from app.api import analytics, auth, integrations # <-- Add integrations here

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Marketing SaaS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["Integrations"]) # <-- Add this line!
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the ArbFlow Marketing API"}