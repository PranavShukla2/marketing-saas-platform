import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine
from app.db import models
from app.api import analytics, auth, integrations, workspace

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Marketing SaaS API")

# Allowed browser origins. Localhost + our known Vercel URLs are baked in; any
# other origin (a custom domain, say) can be appended via the CORS_ORIGINS env
# var (comma-separated). Every *.vercel.app deploy is matched by the regex below
# so preview/prod URLs keep working without redeploying the backend.
default_origins = [
    "http://localhost:3000",
    "https://marketing-saas-platform-nb3q.vercel.app",
    "https://marketing-saas-platform-pi.vercel.app",
]
extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
origins = list(dict.fromkeys(default_origins + extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # Only OUR Vercel deployments (prod + previews), not every vercel.app site.
    allow_origin_regex=r"https://marketing-saas-platform[a-z0-9-]*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["Integrations"]) 
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(workspace.router, prefix="/api/v1/workspace", tags=["Workspace"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the ArbFlow Marketing API"}