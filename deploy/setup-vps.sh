#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# JAHEEZ — VPS Production Setup Script
# Run this on a fresh Ubuntu 22.04+ VPS
#
# Usage:
#   chmod +x deploy/setup-vps.sh
#   sudo ./deploy/setup-vps.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

DOMAIN="${1:-api.jaheez.ma}"
EMAIL="${2:-admin@jaheez.ma}"
APP_DIR="/opt/jaheez"

echo "╔═══════════════════════════════════════════════════╗"
echo "║  JAHEEZ VPS Setup — $DOMAIN                      ║"
echo "╚═══════════════════════════════════════════════════╝"

# ── 1. System updates ────────────────────────────────────────
echo "→ Updating system..."
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw fail2ban

# ── 2. Firewall ──────────────────────────────────────────────
echo "→ Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# ── 3. Fail2ban (brute force protection) ─────────────────────
echo "→ Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# ── 4. Install Docker ────────────────────────────────────────
echo "→ Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# ── 5. Install Docker Compose ────────────────────────────────
echo "→ Installing Docker Compose..."
if ! command -v docker compose &> /dev/null; then
  apt-get install -y docker-compose-plugin
fi

# ── 6. Create app directory ──────────────────────────────────
echo "→ Setting up app directory..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/deploy/ssl
mkdir -p $APP_DIR/deploy/certbot/conf
mkdir -p $APP_DIR/deploy/certbot/www

# ── 7. Clone or copy project ────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  MANUAL STEPS REQUIRED                           ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "1. Copy your project to $APP_DIR:"
echo "   scp -r ./* user@your-vps-ip:$APP_DIR/"
echo ""
echo "2. Create production environment file:"
echo "   cp $APP_DIR/.env.production.example $APP_DIR/.env.production"
echo "   nano $APP_DIR/.env.production  # Fill in real values"
echo ""
echo "3. Get SSL certificate (first time):"
echo "   # Temporarily use HTTP-only nginx for certbot challenge:"
echo "   docker run -it --rm -p 80:80 \\"
echo "     -v $APP_DIR/deploy/certbot/conf:/etc/letsencrypt \\"
echo "     -v $APP_DIR/deploy/certbot/www:/var/www/certbot \\"
echo "     certbot/certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos"
echo ""
echo "4. Start the application:"
echo "   cd $APP_DIR && docker compose up -d"
echo ""
echo "5. Verify deployment:"
echo "   curl https://$DOMAIN/health"
echo ""
echo "6. View logs:"
echo "   docker compose logs -f backend"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "Setup complete! Follow the manual steps above."
