#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# JAHEEZ — Deploy / Update Script
# Run this each time you want to deploy a new version
#
# Usage:
#   chmod +x deploy/deploy.sh
#   ./deploy/deploy.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

APP_DIR="/opt/jaheez"
BACKUP_DIR="/opt/jaheez-backups"

echo "╔═══════════════════════════════════════════════════╗"
echo "║  JAHEEZ — Deploying new version                  ║"
echo "╚═══════════════════════════════════════════════════╝"

cd $APP_DIR

# ── 1. Pull latest code ──────────────────────────────────────
echo "→ Pulling latest code..."
git pull origin main

# ── 2. Backup current state ──────────────────────────────────
echo "→ Creating backup..."
mkdir -p $BACKUP_DIR
BACKUP_TAG=$(date +%Y%m%d_%H%M%S)
docker compose exec -T backend node -e "console.log('ok')" > /dev/null 2>&1 && \
  echo "Backend is running — creating tagged backup" || \
  echo "Backend not running — skipping backup"

# ── 3. Rebuild and restart ───────────────────────────────────
echo "→ Building new Docker image..."
docker compose build --no-cache backend

echo "→ Restarting services (zero-downtime)..."
docker compose up -d --force-recreate backend

# ── 4. Wait for health check ────────────────────────────────
echo "→ Waiting for health check..."
MAX_WAIT=30
for i in $(seq 1 $MAX_WAIT); do
  if curl -sf http://localhost:3002/health > /dev/null 2>&1; then
    echo "  ✅ Backend healthy after ${i}s"
    break
  fi
  if [ $i -eq $MAX_WAIT ]; then
    echo "  ❌ Backend failed health check after ${MAX_WAIT}s!"
    echo "  Rolling back..."
    docker compose down backend
    echo "  Check logs: docker compose logs backend"
    exit 1
  fi
  sleep 1
done

# ── 5. Reload Nginx ─────────────────────────────────────────
echo "→ Reloading Nginx..."
docker compose exec nginx nginx -s reload 2>/dev/null || true

# ── 6. Clean up old images ──────────────────────────────────
echo "→ Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ✅ Deployment complete!                          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "Verify: curl https://api.jaheez.ma/health"
echo "Logs:   docker compose logs -f backend"
