# JAHEEZ â€” Production Deployment Guide

## Architecture Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
â”‚                    INTERNET                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
              â”‚                  â”‚
     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”Œâ”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
     â”‚  api.jaheez.ma  â”‚  â”‚ admin.jaheez.maâ”‚
     â”‚   VPS (Hetzner  â”‚  â”‚   (Vercel)     â”‚
     â”‚   / DigitalOceanâ”‚  â”‚                â”‚
     â”‚   / OVH)        â”‚  â”‚  Vite SPA      â”‚
     â”‚                 â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
     â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ  â”‚
     â”‚  â”‚  Nginx    â”‚  â”‚         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
     â”‚  â”‚  (SSL +   â”‚  â”‚         â”‚    Supabase      â”‚
     â”‚  â”‚  proxy)   â”‚  â”‚â—„â”€â”€â”€â”€â”€â”€â”€â–؛â”‚  (PostgreSQL +   â”‚
     â”‚  â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”ک  â”‚         â”‚   Auth + Storage)â”‚
     â”‚        â”‚        â”‚         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
     â”‚  â”Œâ”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”گ  â”‚
     â”‚  â”‚  Docker   â”‚  â”‚         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”گ
     â”‚  â”‚  Backend  â”‚  â”‚â—„â”€â”€â”€â”€â”€â”€â”€â–؛â”‚ Payment Adapter â”‚
     â”‚  â”‚  (Node)   â”‚  â”‚         â”‚  (Payments)      â”‚
     â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک  â”‚         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
              â–²
              â”‚
     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”گ
     â”‚  Mobile Apps     â”‚
     â”‚  (Expo/RN)       â”‚
     â”‚  User + Driver   â”‚
     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”ک
```

---

## Part 1: VPS Setup (Backend)

### 1.1 Choose a VPS Provider

| Provider | Location | Price | Recommended |
|---|---|---|---|
| **Hetzner** | Germany/Finland | â‚¬4.5/mo (CX22) | âœ… Best value |
| **DigitalOcean** | Multiple | $6/mo (1GB) | Good for beginners |
| **OVH** | France | â‚¬3.5/mo | Closest to Morocco |
| **Contabo** | Germany | â‚¬4/mo (4GB) | Most RAM for price |

**Minimum specs**: 1 vCPU, 1GB RAM, 20GB SSD, Ubuntu 22.04

### 1.2 Initial Server Setup

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Create a deploy user (don't run as root)
adduser jaheez
usermod -aG sudo jaheez
usermod -aG docker jaheez

# Copy SSH keys
rsync --archive --chown=jaheez:jaheez ~/.ssh /home/jaheez

# Switch to deploy user
su - jaheez
```

### 1.3 Install Docker & Dependencies

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# Install firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install fail2ban (brute force protection)
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
```

### 1.4 Deploy the Backend

```bash
# Clone project
cd /opt
sudo mkdir jaheez && sudo chown jaheez:jaheez jaheez
git clone https://github.com/YOUR_REPO/Jaheez-v1.git /opt/jaheez

# Create production env
cd /opt/jaheez
cp .env.production.example .env.production
nano .env.production  # Fill in ALL real values

# Build and start
docker compose up -d --build

# Check health
curl http://localhost:3002/health
```

### 1.5 SSL Certificate (Let's Encrypt)

```bash
# First time â€” get certificate
# Stop nginx temporarily if running
docker compose stop nginx

# Get certificate
sudo docker run -it --rm \
  -p 80:80 \
  -v /opt/jaheez/deploy/certbot/conf:/etc/letsencrypt \
  -v /opt/jaheez/deploy/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --standalone \
  -d api.jaheez.ma \
  --email admin@jaheez.ma \
  --agree-tos \
  --no-eff-email

# Start everything
docker compose up -d
```

### 1.6 DNS Configuration

Point these records to your VPS IP:

| Type | Name | Value |
|---|---|---|
| A | api.jaheez.ma | YOUR_VPS_IP |

### 1.7 Verify Backend

```bash
# Should return {"status":"ok"}
curl https://api.jaheez.ma/health

# Check logs
docker compose logs -f backend

# Check all services
docker compose ps
```

---

## Part 2: Admin Panel (Vercel)

### 2.1 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From the admin directory
cd frontend/admin

# Deploy
vercel --prod
```

Or connect via Vercel Dashboard:
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Set **Root Directory** to `frontend/admin`
4. Framework: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`

### 2.2 Environment Variables (Vercel Dashboard)

Add these in Vercel â†’ Project â†’ Settings â†’ Environment Variables:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://api.jaheez.ma` |

### 2.3 Custom Domain

1. Vercel Dashboard â†’ Domains â†’ Add `admin.jaheez.ma`
2. Add DNS records:

| Type | Name | Value |
|---|---|---|
| CNAME | admin.jaheez.ma | cname.vercel-dns.com |

### 2.4 Update CORS

Add the admin domain to your backend `.env.production`:

```
CORS_ORIGINS=https://admin.jaheez.ma,https://jaheez.ma
```

Then restart:
```bash
docker compose restart backend
```

---

## Part 3: Mobile Apps (Expo)

### 3.1 Update API URLs

In each mobile app, set the production API URL:

**User App** â€” `frontend/user-app/.env`:
```
EXPO_PUBLIC_API_BASE=https://api.jaheez.ma
```

**Driver App** â€” `frontend/driver-app/.env`:
```
EXPO_PUBLIC_API_BASE=https://api.jaheez.ma
```

### 3.2 Build with EAS (when ready)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure (run in each app directory)
eas build:configure

# Build Android APK
eas build --platform android --profile preview

# Build iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

---

## Part 4: Payment Provider Configuration

Online card payments are intentionally paused until JAHEEZ selects and contracts a Morocco-compatible provider.

Production must stay fail-closed:

```env
ONLINE_PAYMENTS_ENABLED=false
PAYMENT_PROVIDER=disabled
```

When a provider is selected, integrate it through the backend payment adapter boundary, rehearse in isolated staging, and only then enable one of:

- `PAYMENT_PROVIDER=cmi`
- `PAYMENT_PROVIDER=payzone`
- `PAYMENT_PROVIDER=cashplus`
- `PAYMENT_PROVIDER=manual`

Legacy Stripe routes are disabled and must continue returning `410 Gone`.


---

## Part 5: Supabase Production

### 5.1 Run Migrations

Do not paste production migrations manually until the staging rehearsal passes.

The commission/fraud/reliability rollout uses the guarded staging runner:

```bash
npm run staging:full --prefix backend
```

That runner validates backup/restore, migrations `024` through `030`, RLS, concurrency, fraud fixtures, reconciliation, E2E, and Android device readiness before production is considered eligible.

Production migration order must follow the verified migration history in `supabase_migrations/`. Corrections after `030` must be new migrations; never edit already-applied migration files.

### 5.2 Rotate Keys

1. Supabase Dashboard â†’ Settings â†’ API
2. **Regenerate** the `service_role` key
3. Update `.env.production` with the new key
4. Restart: `docker compose restart backend`

### 5.3 Enable Realtime

1. Supabase Dashboard â†’ Database â†’ Replication
2. Enable for tables: `orders`, `drivers`

---

## Part 6: Ongoing Operations

### Deploy Updates

```bash
ssh jaheez@YOUR_VPS_IP
cd /opt/jaheez
git pull origin main
docker compose build --no-cache backend
docker compose up -d --force-recreate backend
curl https://api.jaheez.ma/health
```

Or use the deploy script:
```bash
./deploy/deploy.sh
```

### Monitor Logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Restart Services

```bash
# Restart backend
docker compose restart backend

# Restart everything
docker compose down && docker compose up -d

# Full rebuild
docker compose build --no-cache && docker compose up -d
```

### SSL Certificate Renewal

Certbot auto-renews via the Docker container. To manually renew:

```bash
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

### Database Backups

```bash
# Supabase handles automatic backups on Pro plan
# For manual backup, use pg_dump through Supabase connection string
```

---

## Security Checklist

- [ ] VPS firewall (UFW) enabled â€” only 22, 80, 443 open
- [ ] fail2ban active
- [ ] SSL certificate installed and auto-renewing
- [ ] All secrets in `.env.production` (not in code)
- [ ] `.env.production` NOT committed to git
- [ ] Supabase `service_role` key rotated
- [ ] CORS whitelist configured
- [ ] Online payments are disabled unless a Moroccan provider passed staging validation
- [ ] Admin JWT secret is 64+ chars
- [ ] Rate limiting active (Nginx + Express)
