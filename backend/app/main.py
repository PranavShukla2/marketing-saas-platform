from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import analytics

app = FastAPI(title="Marketing SaaS API", version="1.0")

# Allow your Next.js frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect the analytics routes
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Multi-Tenant Marketing API"}