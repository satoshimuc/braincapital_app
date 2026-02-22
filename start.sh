#!/bin/bash
# PBCM App Startup Script

set -e

echo "=== Personal Brain Capital Monitor (PBCM) ==="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is required"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required"
    exit 1
fi

# Setup backend
echo "[1/4] Setting up backend dependencies..."
cd backend
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt
echo "  Backend dependencies installed."

# Start backend in background
echo "[2/4] Starting FastAPI backend on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
sleep 2

# Setup frontend
cd ../frontend
echo "[3/4] Installing frontend dependencies..."
npm install --silent
echo "  Frontend dependencies installed."

# Build or dev
if [ "$1" = "build" ]; then
    echo "[4/4] Building frontend for production..."
    npm run build
    echo ""
    echo "=== Build Complete ==="
    echo "  Frontend: ./frontend/dist"
    echo "  Backend:  http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
else
    echo "[4/4] Starting frontend dev server on port 5173..."
    npm run dev &
    FRONTEND_PID=$!
    echo ""
    echo "=== PBCM App Started ==="
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    echo "  Press Ctrl+C to stop all services"
    echo ""

    # Trap to kill both processes
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM

    wait
fi
