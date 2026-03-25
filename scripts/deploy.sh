#!/bin/bash
set -e

echo "=========================================="
echo "  AGENTIC ENTERPRISE — Deploy Script"
echo "  $(date)"
echo "=========================================="
echo ""

# --- Buoc 1: Pull latest code ---
echo "[1/6] Pulling latest code..."
git pull origin main 2>/dev/null || echo "  (skipped — not a git repo or no remote)"
echo ""

# --- Buoc 2: Check .env ---
echo "[2/6] Checking environment..."
if [ ! -f .env ]; then
  echo "  ERROR: .env file not found!"
  echo "  Run: cp .env.production.template .env"
  echo "  Then fill in the values."
  exit 1
fi
echo "  .env found ✓"
echo ""

# --- Buoc 3: Build + start services ---
echo "[3/6] Building and starting services..."
docker compose up -d --build
echo ""

# --- Buoc 4: Wait for services ---
echo "[4/6] Waiting for services to be healthy (30s)..."
sleep 30
echo "  Checking service status..."
docker compose ps
echo ""

# --- Buoc 5: Run migrations ---
echo "[5/6] Running database migrations..."
docker compose exec -T app npx prisma migrate deploy 2>/dev/null || echo "  (skipped — no pending migrations)"
echo ""

# --- Buoc 6: Health check ---
echo "[6/6] Running health check..."
HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo '{"status":"unavailable"}')
echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
echo ""

echo "=========================================="
echo "  Deploy Complete!"
echo "=========================================="
echo ""
echo "  Dashboard:  http://localhost:3000"
echo "  API Health: http://localhost:3000/api/health"
echo "  Ollama:     http://localhost:11434"
echo "  OpenClaw:   http://localhost:18789"
echo ""
echo "  Next steps:"
echo "  1. Pull AI model (first time only):"
echo "     docker compose exec ollama ollama pull qwen2.5:7b"
echo "  2. Check CLI:"
echo "     npx tsx src/cli/index.ts status"
echo ""
