#!/bin/bash

echo "Starting ArbFlow SaaS Platform..."

# Start Backend using uvicorn in the background
echo "Starting FastAPI Backend..."
cd backend
# Make sure python environment matches. Depending on OS it might be python3
source venv/bin/activate 2>/dev/null || true
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start Frontend using next dev in the foreground
echo "Starting Next.js Frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $FRONTEND_PID
wait $BACKEND_PID
