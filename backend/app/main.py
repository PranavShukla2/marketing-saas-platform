from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine
from app.db import models
from app.api import analytics, auth, integrations 

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Marketing SaaS API")

# --- THE FIX: Explicitly list your frontend domains ---
origins = [
    "http://localhost:3000",
    "https://marketing-saas-platform-nb3q.vercel.app", # Your original Vercel URL
    "https://marketing-saas-platform-pi.vercel.app",   # Your NEW Vercel URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # <-- Uses the strict list instead of "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["Integrations"]) 
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the ArbFlow Marketing API"}