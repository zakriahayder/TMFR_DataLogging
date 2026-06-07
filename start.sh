#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "================================================"
echo "  TMFR Data Viewer - Starting up..."
echo "================================================"
echo ""

# Check virtual environment
if [ ! -f "$ROOT/.venv/bin/activate" ]; then
    echo "ERROR: Python virtual environment not found."
    echo "Please run: python3 -m venv .venv"
    echo "Then:       source .venv/bin/activate && pip install -e ."
    exit 1
fi

# Check pnpm
if ! command -v pnpm &>/dev/null; then
    echo "ERROR: pnpm is not installed."
    echo "Install it from: https://pnpm.io/installation"
    exit 1
fi

echo "[1/3] Starting backend server..."
source "$ROOT/.venv/bin/activate"
cd "$ROOT"
uvicorn backend.main:app --reload &
BACKEND_PID=$!

echo "[2/3] Starting frontend..."
cd "$ROOT/frontend"
pnpm dev &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup INT TERM

echo "[3/3] Opening browser (waiting 10 seconds for servers to start)..."
sleep 10

if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
else
    xdg-open http://localhost:3000 2>/dev/null || true
fi

echo ""
echo "Both servers are running. Press Ctrl+C to stop everything."
wait
