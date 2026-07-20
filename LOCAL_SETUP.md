# 🚀 JAHEEZ — Local Development Setup Guide

> **Everything you need to run the full Jaheez platform locally from scratch.**
> This covers all 4 apps: **Backend API**, **User App**, **Driver App**, and **Admin Panel**.

---

## 📦 Prerequisites — Install These First

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | `>= 20.x LTS` | https://nodejs.org |
| **npm** | `>= 10.x` (comes with Node) | — |
| **Git** | Latest | https://git-scm.com |
| **Expo CLI** | Latest (global) | `npm install -g expo-cli` |
| **EAS CLI** | Latest (for builds) | `npm install -g eas-cli` |
| **Android Studio** | Latest | https://developer.android.com/studio (for Android emulator) |
| **Xcode** | Latest | Mac App Store — **macOS only** (for iOS simulator) |
| **Redis** | `>= 7.x` | https://redis.io/download (optional — see note below) |

> **Redis Note:** Redis is optional for local dev. The backend defaults to `REDIS_REQUIRED=false` and works without it. Only install Redis if you need rate-limiting or caching features.

> **Windows Note:** For Android development on Windows, install Android Studio. iOS builds require a Mac. You can still run the Expo app on a physical device via the **Expo Go** app.

---

## 🗂️ Project Structure

```
Jaheez-v1/
├── backend/             → Node.js + Express API server
├── frontend/
│   ├── user-app/        → Expo React Native app (customers)
│   ├── driver-app/      → Expo React Native app (drivers)
│   └── admin/           → Vite + React web admin panel
├── shared/              → Shared TypeScript types & constants
├── supabase_migrations/ → SQL migration files (001 → 056)
└── .env.example         → Root environment variable template
```

---

## ☁️ Step 1 — Supabase Setup (Required)

Jaheez uses **Supabase** as its database and auth provider. You need a Supabase project before running anything.

1. Go to https://supabase.com and create a **free account**.
2. Create a **New Project** (pick any region, remember your DB password).
3. Once created, go to **Project Settings → API** and copy:
   - `Project URL` → used as `SUPABASE_URL`
   - `anon / public` key → used as `SUPABASE_ANON_KEY`
   - `service_role` key → used as `SUPABASE_SERVICE_ROLE_KEY` (**keep secret!**)
4. Go to **Project Settings → Database** and copy:
   - The **connection string** (URI format) → used as `DATABASE_URL`

### Apply Database Migrations

Paste each `.sql` file inside `supabase_migrations/` into the **Supabase SQL Editor** in order (001 → 056).
Or use the Supabase CLI:

```bash
npx supabase db push
```

> The full schema is also in `supabase_schema.sql` at the root for reference.

---

## 🔑 Step 2 — Environment Variables

Each app needs its own `.env` file. Copy the examples and fill in your values.

### 2a — Root / Backend `.env`

```bash
cp .env.example .env
```

Then open `.env` and fill in these **required** values:

```env
# ── Supabase ──────────────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres.your-ref:password@host:5432/postgres

# ── JWT Secrets (min 32 characters each) ──────────────
ADMIN_JWT_SECRET=change-this-to-a-strong-random-secret-min32chars
DRIVER_JWT_SECRET=change-this-to-a-different-secret-min32chars
OTP_HASH_SECRET=change-this-to-another-random-secret-min32chars

# ── Server ────────────────────────────────────────────
PORT=3002
NODE_ENV=development

# ── OTP (frozen by default — leave as-is for local dev) ──
OTP_DELIVERY_FROZEN=true

# ── Payments (disabled for local dev) ─────────────────
ONLINE_PAYMENTS_ENABLED=false
PAYMENT_PROVIDER=disabled

# ── Redis (optional for local dev) ────────────────────
REDIS_REQUIRED=false
REDIS_URL=redis://127.0.0.1:6379

# ── Expo frontend (for user-app and driver-app) ───────
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Generate secure secrets:** Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` for each secret.

### 2b — Admin Panel `.env`

```bash
cd frontend/admin
cp .env.example .env
```

Fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2c — User App `.env`

Create `frontend/user-app/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3002
```

### 2d — Driver App `.env`

```bash
cd frontend/driver-app
cp .env.example .env
```

Fill in:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3002
```

---

## 📥 Step 3 — Install Dependencies

Run `npm install` in each of the 4 app directories:

```bash
# 1. Backend
cd backend
npm install

# 2. User App
cd ../frontend/user-app
npm install

# 3. Driver App
cd ../driver-app
npm install

# 4. Admin Panel
cd ../admin
npm install
```

---

## ▶️ Step 4 — Run the Apps

Open **4 separate terminal windows/tabs** and run each command:

### Terminal 1 — Backend API

```bash
cd backend
npm run dev
```

✅ API starts at `http://localhost:3002`
✅ Socket.IO available on the same port for real-time tracking

### Terminal 2 — User App (Expo)

```bash
cd frontend/user-app
npx expo start
```

Then in the Expo menu:
- Press **`a`** → open on Android emulator
- Press **`i`** → open on iOS simulator (macOS only)
- Scan the **QR code** with **Expo Go** on your phone

### Terminal 3 — Driver App (Expo)

```bash
cd frontend/driver-app
npx expo start --port 8082
```

Same options as User App above.

### Terminal 4 — Admin Panel

```bash
cd frontend/admin
npm run dev
```

✅ Admin panel opens at `http://localhost:3000`

---

## 🔧 Optional Services

### Google Maps API Key

Required for the maps/tracking features in both mobile apps.

1. Get a key from https://console.cloud.google.com
2. Enable: Maps SDK for Android, Maps SDK for iOS, Geocoding API, Places API
3. Add to root `.env`:

```env
GOOGLE_MAPS_SERVER_API_KEY=your-google-maps-api-key
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your-google-maps-api-key
```

### WhatsApp OTP (Wasender)

Only needed when OTP delivery is unfrozen for production. For local dev, leave `OTP_DELIVERY_FROZEN=true` — drivers log in with CIN+password, customer auth skips SMS delivery.

### Redis (Rate Limiting / Caching)

```bash
# Windows (via Chocolatey):
choco install redis-64

# macOS:
brew install redis && brew services start redis

# Ubuntu/Debian:
sudo apt install redis-server
```

Then set `REDIS_REQUIRED=false` in `.env` to keep it optional.

---

## 📱 Physical Device Testing

If testing on a real phone:

1. Your phone and PC must be on the **same Wi-Fi network**.
2. Replace `localhost` with your computer's local IP in `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.x.x:3002
   ```
3. Install **Expo Go** from App Store / Google Play.
4. Scan the QR code shown in the Expo terminal.

---

## 🧩 Full Tech Stack Reference

### Backend (`backend/`)

| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | >= 20 | Runtime |
| TypeScript | ^5.4.5 | Type safety |
| Express | ^4.19.2 | HTTP server framework |
| Socket.IO | ^4.8.3 | Real-time (order tracking) |
| @supabase/supabase-js | ^2.43.4 | Database & Auth client |
| jsonwebtoken | ^9.0.2 | JWT auth (drivers/admins) |
| bcryptjs | ^2.4.3 | Password hashing |
| zod | ^3.23.8 | Runtime validation |
| helmet | ^7.1.0 | Security headers |
| cors | ^2.8.5 | CORS middleware |
| express-rate-limit | ^7.3.1 | Rate limiting |
| ioredis | ^5.4.1 | Redis client |
| winston | ^3.13.0 | Structured logging |
| expo-server-sdk | ^3.10.0 | Push notifications |
| pg | ^8.12.0 | Direct PostgreSQL access |
| standardwebhooks | ^1.0.0 | Webhook signature validation |
| ts-node-dev | ^2.0.0 | Dev server with hot reload |
| vitest | ^4.1.9 | Unit testing framework |

### User App (`frontend/user-app/`)

| Package | Version | Purpose |
|---------|---------|---------|
| Expo SDK | ~55.0.27 | Mobile platform |
| React Native | 0.83.6 | UI framework |
| React | 19.2.0 | Component library |
| Expo Router | ~55.0.16 | File-based navigation |
| @tanstack/react-query | ^5.39.0 | Server state / caching |
| Zustand | ^4.5.2 | Local state management |
| socket.io-client | ^4.8.3 | Real-time order tracking |
| @supabase/supabase-js | ^2.43.0 | Database & Auth |
| react-native-maps | ^1.20.1 | Google Maps integration |
| react-native-reanimated | 4.2.1 | High-performance animations |
| moti | ^0.28.1 | Declarative animations |
| nativewind | ^4.0.1 | Tailwind CSS for React Native |
| tailwindcss | ^3.4.0 | CSS utility classes |
| react-hook-form | ^7.75.0 | Form state management |
| zod | ^4.4.2 | Form validation schemas |
| i18next | ^26.0.4 | Internationalisation (AR/FR) |
| react-i18next | ^17.0.2 | React bindings for i18next |
| expo-secure-store | ~55.0.15 | Encrypted token storage |
| expo-location | ~55.1.11 | GPS location access |
| expo-notifications | ~55.0.24 | Push notifications |
| expo-image | ~55.0.11 | Optimised image component |
| expo-linear-gradient | ~55.0.15 | Gradient backgrounds |
| expo-blur | ~55.0.15 | Blur effect |
| expo-image-picker | ~55.0.21 | Camera & gallery access |
| expo-font | ~55.0.8 | Custom font loading |
| expo-splash-screen | ~55.0.22 | Splash screen control |
| expo-video | ~55.0.18 | Video playback |
| expo-localization | ~55.0.16 | Locale detection |
| @expo-google-fonts/cairo | ^0.4.2 | Cairo font (Arabic-first) |
| @expo-google-fonts/dm-sans | ^0.4.2 | DM Sans font |
| @expo/vector-icons | ^15.0.3 | Icon library |
| react-native-safe-area-context | ~5.6.2 | Safe area handling |
| react-native-screens | ~4.23.0 | Native navigation screens |
| react-native-svg | 15.15.3 | SVG rendering |
| react-native-web | ^0.21.0 | Web support |
| react-native-url-polyfill | ^3.0.0 | URL API polyfill |
| @react-native-async-storage/async-storage | ^2.2.0 | Persistent storage |
| @hookform/resolvers | ^5.2.2 | Zod resolver for react-hook-form |

### Driver App (`frontend/driver-app/`)

| Package | Version | Purpose |
|---------|---------|---------|
| Expo SDK | ~55.0.27 | Mobile platform |
| React Native | 0.83.6 | UI framework |
| Expo Router | ~55.0.16 | File-based navigation |
| Zustand | ^4.5.2 | State management |
| socket.io-client | ^4.8.3 | Real-time dispatch updates |
| nativewind | ^4.0.1 | Tailwind CSS for React Native |
| expo-location | ~55.1.11 | GPS for driver tracking |
| expo-secure-store | ~55.0.15 | Auth token storage |
| expo-image-picker | ~55.0.21 | Document uploads |
| expo-linear-gradient | ~55.0.15 | Gradient UI |
| expo-splash-screen | ~55.0.22 | Splash screen |
| lucide-react-native | ^1.14.0 | Icon library |
| @expo-google-fonts/cairo | ^0.4.2 | Cairo font |
| @expo/vector-icons | ^15.0.3 | Icon library |
| react-native-reanimated | 4.2.1 | Animations |
| react-native-safe-area-context | ~5.6.2 | Safe area insets |
| react-native-screens | ~4.23.0 | Native screens |
| react-native-svg | 15.15.3 | SVG support |
| react-native-url-polyfill | ^3.0.0 | URL polyfill |
| @react-native-async-storage/async-storage | ^2.2.0 | Storage |

### Admin Panel (`frontend/admin/`)

| Package | Version | Purpose |
|---------|---------|---------|
| Vite | ^8.0.16 | Build tool |
| React | ^18.3.1 | UI framework |
| TypeScript | ^5.5.0 | Type safety |
| Tailwind CSS | ^4.1.0 | CSS framework |
| React Router DOM | ^6.28.0 | Client-side routing |
| @tanstack/react-query | ^5.56.0 | Data fetching & caching |
| Zustand | ^4.5.0 | Global state management |
| @supabase/supabase-js | ^2.45.0 | Database & Auth |
| Recharts | ^2.15.2 | Charts & analytics dashboards |
| Framer Motion | ^11.15.0 | Animations |
| react-hook-form | ^7.55.0 | Form management |
| zod | ^3.24.0 | Validation schemas |
| @hookform/resolvers | ^3.10.0 | Zod resolver |
| lucide-react | ^1.17.0 | Icon library |
| react-icons | ^5.4.0 | Icon library (extended) |
| Radix UI (full suite) | ^1.x–^2.x | Accessible UI primitives |
| class-variance-authority | ^0.7.1 | Component variant management |
| clsx + tailwind-merge | — | Conditional class merging |
| cmdk | ^1.1.1 | Command palette |
| sonner | ^2.0.7 | Toast notifications |
| date-fns | ^3.6.0 | Date formatting |
| embla-carousel-react | ^8.6.0 | Carousel component |
| next-themes | ^0.4.6 | Dark/light mode |
| vaul | ^1.1.2 | Drawer component |
| react-day-picker | ^9.11.1 | Date picker |
| react-resizable-panels | ^2.1.7 | Resizable layout panels |
| input-otp | ^1.4.2 | OTP input component |

---

## 🛠️ Common Dev Commands

```bash
# Backend
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript to dist/
npm run test             # Run unit tests (vitest)
npm run test:watch       # Watch mode tests

# User App / Driver App
npx expo start           # Start Expo development server
npx expo start --clear   # Clear Metro cache and restart
npx expo run:android     # Build + run on Android emulator
npx expo run:ios         # Build + run on iOS simulator (Mac)

# Admin Panel
npm run dev              # Start Vite dev server (port 3000)
npm run build            # Production build
npm run preview          # Preview production build locally

# Secrets generator (run for each JWT secret)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ❌ Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `Environment validation failed` | Check backend `.env` — all required vars must be set |
| `ADMIN_JWT_SECRET must be at least 32 characters` | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `Cannot connect to Supabase` | Verify `SUPABASE_URL` and keys are correct |
| Metro bundler error | Run `npx expo start --clear` to clear cache |
| `Reanimated plugin` error | Ensure `react-native-reanimated/plugin` is last in `babel.config.js` |
| `Module not found: @shared` | Run `npm install` in the app directory |
| `Port 3002 already in use` | Run `npx kill-port 3002` |
| `Redis connection refused` | Set `REDIS_REQUIRED=false` in backend `.env` |
| Android build fails | Set `ANDROID_HOME` env var to your Android SDK path |
| App shows old UI on another device | Run `git fetch && git reset --hard origin/main` on that device |

---

## 🔒 Security Notes

- **Never commit** `.env` files. All `.env` files are in `.gitignore`.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security — **backend use only**, never in frontend code.
- OTP delivery is **frozen by default** (`OTP_DELIVERY_FROZEN=true`) — no WhatsApp/SMS messages sent in local dev.
- Generate strong secrets (≥ 32 chars) for all JWT and hash secrets.
- The backend validates all environment variables at startup via Zod — it will refuse to start if something is wrong.

---

## ✅ Quick Start Checklist

- [ ] Node.js 20+ installed
- [ ] Expo Go installed on physical device (optional)
- [ ] Supabase project created
- [ ] Database migrations applied (supabase_migrations/ 001 → 056)
- [ ] Root `.env` filled from `.env.example`
- [ ] `frontend/admin/.env` filled from `.env.example`
- [ ] `frontend/user-app/.env` created
- [ ] `frontend/driver-app/.env` filled from `.env.example`
- [ ] `npm install` run inside `backend/`
- [ ] `npm install` run inside `frontend/user-app/`
- [ ] `npm install` run inside `frontend/driver-app/`
- [ ] `npm install` run inside `frontend/admin/`
- [ ] Backend running: `cd backend && npm run dev`
- [ ] Admin panel running: `cd frontend/admin && npm run dev`
- [ ] User app running: `cd frontend/user-app && npx expo start`
- [ ] Driver app running: `cd frontend/driver-app && npx expo start --port 8082`

---

*Last updated: July 2026 — Jaheez v1*
