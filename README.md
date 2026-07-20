# JAHEEZ — Smart Delivery & Errands Platform

> **جاهز** — "Ready" in Arabic. A multi-app motorcycle-delivery and errand platform built for Safi, Morocco.

JAHEEZ connects customers ordering food, groceries, and errands with motorcycle drivers in their city. It consists of four separate apps managed from a single monorepo.

---

## Architecture

```text
Frontend UI  →  Backend API/Socket  →  Routes  →  Middleware/Validators
→  Controllers  →  Services  →  Repositories  →  Supabase/PostgreSQL
```

**Frontend apps are display clients only.** Pricing, promos, permissions, fraud detection, finance, dispatch, payout, delay logic, and all business-critical mutations live exclusively in the backend.

Online card payments are intentionally disabled. Only Morocco-compatible providers (CMI, Payzone, Cashplus) will be enabled after staging validation passes. Stripe is not supported.

---

## Project Layout

```text
Jaheez-v1/
├── backend/                    Node.js + Express + TypeScript API
│   └── src/
│       ├── features/           17 domain modules (see below)
│       ├── middleware/         Auth, RBAC, validation, error handling
│       ├── redis/              Redis client (ephemeral state only)
│       ├── workers/            Dispatch + heartbeat background workers
│       ├── notifications/      Push notification sender
│       ├── validators/         Zod request validators
│       └── utils/              Shared utilities
├── frontend/
│   ├── user-app/               Expo SDK 55 — customer mobile app
│   ├── driver-app/             Expo SDK 55 — driver mobile app
│   └── admin/                  Vite + React — web admin panel
├── shared/                     TypeScript types & constants (shared across apps)
├── supabase_migrations/        SQL migrations (009 → 056, 47 files)
├── supabase_schema.sql         Full schema snapshot
├── scripts/                    Dev/test utility scripts
├── docs/                       Architecture and audit documents
└── LOCAL_SETUP.md              Complete local dev setup guide
```

> The active mobile apps are under `frontend/`. Do **not** run Expo from old root-level `user-app/` or `driver-app/` directories — those are legacy remnants.

---

## Applications

### Backend API

**Path:** `backend/`
**Port:** `3002`
**Run:** `npm run dev` (inside `backend/`)

**Stack:**
- Node.js 20+
- TypeScript (strict mode)
- Express 4
- Supabase PostgreSQL (source of truth)
- Socket.IO (real-time order tracking)
- Redis (ephemeral — heartbeats, locks, offer timers)
- JWT (separate secrets per role: admin, driver, customer)
- Zod (runtime request validation)
- Winston (structured logging)
- Vitest (unit tests)

**Backend Domain Modules (`src/features/`):**

| Module | Responsibility |
|--------|---------------|
| `auth` | Customer + driver authentication, OTP, sessions |
| `admin` | Admin panel API, dashboards, moderation |
| `customer` | Customer profiles, addresses, account |
| `driver` | Driver profiles, state machine, CIN auth |
| `order` | Order lifecycle: create → assign → pickup → deliver |
| `dispatch` | Driver matching, offer management, reassignment |
| `realtime` | Socket.IO events, location streaming |
| `commission` | Driver commission rates and ledger |
| `finance` | COD settlement, wallet, refunds, payouts |
| `payments` | Payment provider boundary (currently disabled) |
| `reliability` | Driver reliability scores and snapshots |
| `risk` | Fraud flags, suspicious behaviour detection |
| `delay` | Delay evidence, anti-fraud delay tracking |
| `errand` | Custom and guided errand order flow |
| `store` | Store management, capacity, zones |
| `settings` | Platform configuration via admin |
| `support` | Customer support tickets |

---

### User App (Customer)

**Path:** `frontend/user-app/`
**Run:** `npx expo start`

**Stack:**
- Expo SDK 55 + React Native 0.83.6
- React 19
- Expo Router v3 (file-based navigation)
- Zustand (local state)
- React Query / TanStack Query (server state)
- Socket.IO client (order tracking)
- Supabase Auth (phone/OTP)
- NativeWind v4 + Tailwind CSS
- Cairo font (Arabic-first)
- react-native-maps (Google Maps)
- react-native-reanimated + moti (animations)
- i18next (AR/FR localisation)
- react-hook-form + Zod

**Screen Groups:**
- `(auth)/` — Splash, onboarding, login, register, OTP
- `(tabs)/` — Home, search, orders, chat, profile
- `(flows)/` — Store, cart, checkout, custom request, tracking, confirmation, settings

---

### Driver App

**Path:** `frontend/driver-app/`
**Run:** `npx expo start --port 8082`

**Stack:**
- Expo SDK 55 + React Native 0.83.6
- React 19
- Expo Router v3
- Zustand
- Socket.IO client (real-time dispatch)
- NativeWind v4 + Tailwind CSS
- Cairo font
- expo-location (GPS heartbeat)
- CIN + password authentication (no OTP)

**Driver State Machine:**

```text
AVAILABLE → OFFERED → ACCEPTED → PICKUP → DELIVERING
AVAILABLE ↔ BREAK | FORCED_BREAK
AVAILABLE ↔ OFFLINE | PAUSED_BY_SYSTEM | SUSPENDED
```

Driver eligibility requires: state = AVAILABLE, active shift, zero active orders, no active cooldown, fresh GPS heartbeat.

---

### Admin Panel

**Path:** `frontend/admin/`
**Port:** `3000`
**Run:** `npm run dev` (inside `frontend/admin/`)

**Stack:**
- Vite 8 + React 18
- TypeScript
- Tailwind CSS v4
- React Router DOM v6
- TanStack Query
- Zustand
- Recharts (analytics)
- Radix UI + shadcn/ui components
- Framer Motion

---

## Database

**Provider:** Supabase (PostgreSQL)
**Migrations:** `supabase_migrations/` — 47 files, from `009_otp_codes.sql` to `056_zone_neighbors_and_service_fee.sql`

Key tables: `users`, `drivers`, `orders`, `order_items`, `order_status_log`, `payments`, `driver_locations`, `fraud_flags`, `reviews`, `chat_messages`, `notifications`, `user_verifications`, `driver_verifications`, `order_moderation`, `moderation_rules`, `banned_keywords`

---

## Running Locally

> **See [LOCAL_SETUP.md](LOCAL_SETUP.md) for the full step-by-step guide** including Supabase setup, all environment variables, and troubleshooting.

Quick summary — open 4 terminals:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — User App
cd frontend/user-app && npx expo start

# Terminal 3 — Driver App
cd frontend/driver-app && npx expo start --port 8082

# Terminal 4 — Admin Panel
cd frontend/admin && npm run dev
```

Redis is optional for local dev — set `REDIS_REQUIRED=false` in `backend/.env`.

---

## Environment Variables

Copy `.env.example` to `.env` at the repo root and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (backend only) |
| `SUPABASE_ANON_KEY` | ✅ | Public anon key |
| `ADMIN_JWT_SECRET` | ✅ | ≥ 32 chars, for admin tokens |
| `DRIVER_JWT_SECRET` | ✅ | ≥ 32 chars, for driver tokens |
| `OTP_HASH_SECRET` | ✅ | ≥ 32 chars, for OTP hashing |
| `PORT` | ✅ | Backend port (default: 3002) |
| `OTP_DELIVERY_FROZEN` | — | `true` by default — no SMS/WhatsApp sent |
| `REDIS_REQUIRED` | — | `false` by default — Redis optional |
| `ONLINE_PAYMENTS_ENABLED` | — | `false` — payments disabled |
| `PAYMENT_PROVIDER` | — | `disabled` — no provider active |

Frontend apps use `EXPO_PUBLIC_*` prefix; admin uses `VITE_*` prefix.

---

## Architecture Rules

These are **never** allowed in production code:

- Frontend calculating prices, fees, commissions, or discounts
- Frontend directly querying Supabase business tables
- Frontend owning order lifecycle transitions, driver assignment, or wallet mutations
- Frontend containing mock/fallback production data (fake stores, orders, drivers)
- Controllers accessing Supabase directly (must go through Services → Repositories)
- Repositories calling external APIs directly
- Redis used as permanent source of truth
- Socket.IO handlers mutating critical state without service validation
- Fallback/default JWT secrets
- Default admin credentials

---

## Brand

- **Name:** JAHEEZ (جاهز)
- **Tagline:** Smart Delivery & Errands
- **Market:** Safi, Morocco
- **Primary colors:** Red `#F03030` (CTAs) + Yellow `#F5CE2E` (backgrounds/accents)
- **Font:** Cairo (Arabic-first, used across all apps)
- **Token file:** `frontend/user-app/constants/brand.ts` — never hardcode colors

---

## Docs

| File | Purpose |
|------|---------|
| `LOCAL_SETUP.md` | Complete local dev guide |
| `DEPLOY.md` | Deployment procedures |
| `docs/ACTIVE_OPERATOR_DOCS.md` | Operational source-of-truth |
| `docs/PRODUCTION_READINESS_MANIFEST.json` | Machine-readable readiness contract |
| `docs/JAHEEZ_STRICT_AI_SECURITY_RULES.md` | Security rules for AI-assisted development |
| `supabase_schema.sql` | Full database schema snapshot |
