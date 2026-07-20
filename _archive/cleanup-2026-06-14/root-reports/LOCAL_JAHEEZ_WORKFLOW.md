# LOCAL JAHEEZ WORKFLOW
### Complete Local Setup, Run, Debug & Handoff Guide

> Cleanup note, 2026-06-14: this guide contains historical details from before the frontend restructure. The official source roots are now `backend/`, `frontend/user-app`, `frontend/driver-app`, and `frontend/admin`. The old root `user-app/`, `driver-app/`, `admin/`, and `scripts/admin-api.js` paths were intentionally removed.

> Last generated: 2026-05-03  
> Source of truth for development: `docs/JAHEEZ_FULL_PLATFORM_WORKFLOW.md`  
> For schema: `supabase_schema.sql` + `supabase_migrations/`

---

## 1. Project Summary

**JAHEEZ (جاهز)** is a Morocco-first multi-service delivery and errand super-platform. The pilot city is **Safi**. It is modelled on Glovo-class UX with Moroccan character — red/yellow brand, Arabic + French bilingual, all money in **integer centimes** (never floating-point MAD).

### What exists in this repository

| App / Module | Stack | Status |
|---|---|---|
| **User App** | Expo 55 + Expo Router v3, NativeWind, Supabase | ✅ Implemented — auth, home, stores, cart, checkout, orders, tracking, wallet, support, profile |
| **Driver App** | Expo 55 + Expo Router v3, NativeWind | ✅ Implemented — auth, KYC gate, dashboard (online/offline, 45 s order accept countdown), earnings, profile, active-delivery 5-stage flow, issue reporting |
| **Admin Panel** | Vite 5 + React 18, React Router v6, Supabase | ✅ Implemented — login, dashboard, stores, products, orders, drivers (KYC review), categories, promotions, banners, support tickets, refunds, payouts, audit logs, analytics, cities, admins, reviews, notifications, settings |
| **Backend API** | Express, TypeScript, Supabase, Redis, Socket.IO | ✅ Active MVC backend under `backend/src` |
| **Proxy Router** | Node.js http | ✅ Single port :5000 routes to all four services |
| **Supabase Backend** | Postgres, Supabase Auth (users), Storage | ✅ Hosted project; 12 migrations applied |
| **Shared types** | TypeScript only | ✅ `shared/types.ts`, `shared/constants.ts` |

### What is planned but not yet implemented

- Driver app: multi-step register wizard (currently single-step, works)
- Driver app: real `expo-image-picker` KYC document upload (currently posts a placeholder URL from profile — functional for admin review but not production-grade)
- Admin panel: order timeline / event log per order; bulk-assign driver; CSV export; per-document rejection UI; zone polygon map picker
- Payments: CMI / PayZone gateway (Stripe integration exists but is gateway-ready scaffolding)
- Notifications: push delivery rate tracking
- Observability / error monitoring

---

## 2. Project Structure

```
/                              ← monorepo root (Node 20, npm)
├── frontend/user-app/         ← USER mobile app (Expo 55)
│   ├── app/                   ← Expo Router v3 screens
│   │   ├── (auth)/            ← welcome, login, OTP, register, onboarding, splash
│   │   ├── (tabs)/            ← home, search, orders, chat, wallet, profile
│   │   └── (flows)/           ← cart, checkout, store, category, order detail,
│   │                             tracking, addresses, support, settings, etc.
│   ├── assets/
│   │   ├── icons/             ← tab bar PNG icons (6 files)
│   │   └── illustrations/     ← service-card PNGs (bag_hero, food, grocery, etc.)
│   ├── components/            ← shared UI components (cards, modals, inputs)
│   ├── constants/             ← brand.ts (colors, fonts, spacing)
│   ├── hooks/                 ← custom React hooks
│   ├── lib/                   ← supabase.ts, adminApi.ts, maps.ts, modernmt.ts
│   ├── store/                 ← Zustand stores (cart, auth, platform)
│   ├── app.json               ← Expo config (slug: jaheez-user, scheme: jaheez)
│   ├── metro.config.js        ← ⚠️ DO NOT simplify — has critical zustand CJS fix
│   ├── babel.config.js
│   ├── tailwind.config.js     ← NativeWind 4
│   ├── tsconfig.json
│   ├── .env                   ← Supabase public keys (EXPO_PUBLIC_*)
│   └── package.json
│
├── frontend/driver-app/       ← DRIVER mobile app (Expo 55)
│   ├── app/
│   │   ├── (auth)/            ← welcome, login, OTP, register, pending (KYC gate)
│   │   ├── (tabs)/            ← dashboard (index), earnings, profile
│   │   └── (flows)/           ← active-delivery (5-stage), payout-request
│   ├── assets/                ← icon.png, splash.png
│   ├── constants/             ← brand.ts
│   ├── lib/                   ← api.ts (driverApi), supabase.ts
│   ├── store/                 ← driverStore.ts (Zustand)
│   ├── app.json               ← slug: jaheez-driver; experiments.baseUrl: /driver
│   ├── metro.config.js        ← ⚠️ DO NOT simplify — has React blockList + zustand CJS fix
│   ├── babel.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/admin/            ← ADMIN panel (Vite + React)
│   ├── src/
│   │   ├── pages/             ← Dashboard, Orders, Drivers, Stores, Products,
│   │   │                         Categories, Promotions, Banners, Support, Refunds,
│   │   │                         Payouts, Analytics, AuditLogs, Reviews, Notifications,
│   │   │                         Cities, Admins, Settings, Login
│   │   ├── components/        ← AdminLayout, Sidebar, Header, Badge, Modal, StatCard
│   │   └── lib/               ← api.ts (fetches /admin-api/*), supabase.ts
│   ├── .env                   ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── scripts/
│   ├── proxy.js               ← port 5000 router (user :8081 / driver :8000 / admin :3000 / api :3001)
│   ├── admin-api.js           ← Express backend (~97 endpoints, port 3001)
│   └── seed-stores.js         ← optional local seed script
│
├── shared/
│   ├── types.ts               ← cross-app TypeScript interfaces
│   └── constants.ts           ← status enums, money helpers
│
├── supabase_schema.sql        ← canonical idempotent DDL (run this to recreate schema)
├── supabase_migrations/       ← numbered SQL migrations (001–012)
│
├── docs/                      ← living documentation (see §11 for list)
├── design/                    ← AI-generated design mockup images (ChatGPT, Apr 2026)
├── jaheez icons/              ← original brand icon + illustration PNGs from designer
│   ├── icon/                  ← icon set (home, order, cart, message, etc.)
│   └── illustrations/         ← courier, delivery, food, discount illustrations
├── attached_assets/           ← screenshots taken during development
│
├── package.json               ← root (proxy + admin-api dependencies)
└── node_modules/              ← root node_modules (proxy + admin-api)
```

**Orphaned / legacy folders** (do not delete, but do not use):
- `jaheez-temp/` — scratch Expo app from early prototyping
- `jaheez_workspace/` — early monorepo experiment
- `artifacts/mockup-sandbox/` — Replit canvas component preview server (Replit-only)
- `html-preview/` — static HTML mock

---

## 3. Local Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | 20.x LTS | Project runs on Node 20.20 in Replit |
| **npm** | 10.x | Root, driver-app, and admin-api all use `npm`. Do NOT use pnpm/yarn unless you switch package managers everywhere |
| **Expo CLI** | via `npx expo` | Do not install expo-cli globally — use `npx expo` |
| **Git** | any | For version control |
| **Expo Go** | Latest (SDK 53/54/55) | Install on your Android/iOS phone |
| **Android Studio** | optional | Only needed for emulator; not required for web preview |
| **Supabase account** | required | The project uses a hosted Supabase project (credentials in `.env`) |
| **Infobip account** | required for OTP | Without this, OTP SMS will not send (you can stub it for dev) |
| **Stripe account** | required for payments | Without this, Stripe checkout sessions fail gracefully |
| **VS Code** | recommended | With ESLint + TypeScript extensions |

**Not required:**
- Supabase CLI (all migrations are plain SQL; no `supabase start` needed)
- EAS CLI (no `eas.json` found; builds use `npx expo start` only)
- Docker

---

## 4. Dependency Installation

> **Important**: Each app has its own `node_modules`. Install in each folder separately. Do NOT hoist all dependencies to root — it will break the driver-app React deduplication.

### 4.1 Root (proxy + admin-api)

```bash
cd /path/to/jaheez
npm install
```

Lock file: `package-lock.json`. Installs `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`, `@supabase/supabase-js`, `stripe`.

### 4.2 User App

```bash
cd user-app
npm install
```

Lock file: `user-app/package-lock.json`. Key packages: `expo ~55.0.0`, `react-native 0.83.6`, `expo-router`, `nativewind ^4`, `@supabase/supabase-js`, `zustand`, `@tanstack/react-query`, `react-native-maps`.

### 4.3 Driver App

```bash
cd driver-app
npm install
```

Lock file: `driver-app/package-lock.json`. Key packages: `expo ~55.0.0`, `react-native 0.83.6`, `expo-router`, `nativewind ^4`, `@supabase/supabase-js`, `zustand`, `@expo-google-fonts/cairo`.

### 4.4 Admin Panel

```bash
cd admin
npm install
```

Lock file: `admin/package-lock.json`. Key packages: `vite`, `react 18`, `react-router-dom`, `@supabase/supabase-js`, `@tanstack/react-query`, `zustand`, `lucide-react`, `date-fns`.

### Common install issues

| Problem | Fix |
|---|---|
| `ERESOLVE` peer conflict | Run `npm install --legacy-peer-deps` as a last resort |
| `gyp` build failure on `bcryptjs` | Use `bcryptjs` (already the case) not `bcrypt` — no native code |
| Metro cannot find module | Make sure you installed inside the correct sub-folder, not the root |
| `import.meta` error on web | Do NOT remove metro.config.js zustand CJS fix — see §13 |

---

## 5. Environment Variables

### 5.1 User App — `user-app/.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

> The app has a hardcoded fallback to the Replit Supabase project if these are missing/wrong. For your own project, replace both values. These are **public** — safe to commit to your own private repo but not to a public one.

### 5.2 Driver App — `driver-app/.env` (create this file)

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Same Supabase project as the user app. The driver app also has a hardcoded fallback.

### 5.3 Admin Panel — `admin/.env`

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

### 5.4 Admin API — environment variables (set in shell or `.env` at root)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Required | PostgreSQL connection string (for admin-only tables: admins, audit_log, etc.) |
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ Required | Same Supabase URL (admin-api reads shared data via service_role) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Required | Supabase **service role** key — bypasses RLS. **Keep secret.** |
| `ADMIN_JWT_SECRET` | Recommended | JWT signing secret for admin sessions. Falls back to a hardcoded dev string — change this in production! |
| `INFOBIP_API_KEY` | For OTP | Infobip API key for SMS OTP. Without it, OTP will throw a 503 |
| `INFOBIP_BASE_URL` | For OTP | Infobip base URL (e.g. `xyz.api.infobip.com`) |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key for checkout sessions |

To run locally, create a `.env` file at the project root OR export these variables in your shell:

```bash
# At project root — copy and fill in:
export DATABASE_URL="postgresql://user:pass@localhost:5432/jaheez"
export EXPO_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="YOUR-SERVICE-ROLE-KEY"
export ADMIN_JWT_SECRET="change-this-in-production"
export INFOBIP_API_KEY="your-key"
export INFOBIP_BASE_URL="your-subdomain.api.infobip.com"
export STRIPE_SECRET_KEY="sk_test_..."
```

> ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` must never be committed or exposed to the browser.** It belongs only in the admin-api server process.

### 5.5 Missing `.env.example` files

There are no `.env.example` files in the project. The table in §5.4 above is the authoritative list. Create your own `.env.example` by copying the variables above with empty values.

---

## 6. Running the User App Locally

```bash
cd user-app
npm install          # only first time
npx expo start -c    # -c clears Metro cache
```

- **Web preview**: press `w` → opens `http://localhost:8081`
- **Expo Go (phone)**: scan QR code shown in terminal
- **Android emulator**: press `a` (Android Studio must be running with a device)
- **iOS simulator**: press `i` (macOS + Xcode only)

For remote testing (different network than your computer):

```bash
npx expo start -c --tunnel
```

### Common Expo errors

| Error | Fix |
|---|---|
| `Unable to resolve module` | Run `npx expo start -c` to clear cache |
| `SDK version mismatch in Expo Go` | Update Expo Go on your phone, or use a dev build |
| `Error: ENOSPC: no space left` | Clear old bundles: `rm -rf .expo node_modules && npm install` |
| `Cannot use 'import.meta'` | Do NOT simplify metro.config.js — the zustand CJS resolver is required |
| `NativeWind styles not applying` | Ensure `global.css` is imported in `_layout.tsx` |
| Maps blank on web | Expected — `react-native-maps` does not support web; map views are hidden on web platform |

---

## 7. Running the Driver App Locally

```bash
cd driver-app
npm install          # only first time
npx expo start --web --port 8000 -c
```

- The driver app uses `experiments.baseUrl = "/driver"` in `app.json`. This means the web bundle is served **under `/driver/`** — not at `/`.
- When running standalone (not behind the proxy), open `http://localhost:8000/driver/` in your browser.
- To run behind the proxy so API calls route correctly, start both the driver app AND the proxy (see §9).

### Important metro.config.js rules for driver-app

The driver-app metro config has two non-negotiable fixes:

1. **React blockList** — blocks `../node_modules/react` and `../user-app/node_modules/react` so Metro only uses driver-app's own React copy. Removing this causes the "Hooks can only be called inside a function component" crash.
2. **Zustand CJS resolver** — forces `zustand` to its CJS build on web. Removing this causes `Cannot use 'import.meta' outside a module` browser error.

**Never simplify or replace `driver-app/metro.config.js` with a default config.**

### OTP + login flow

The driver app authenticates via `POST /admin-api/otp/send` → `POST /admin-api/otp/verify` → `POST /admin-api/driver/login`. All calls use relative URLs (`/admin-api/...`). These only work when the proxy is running (see §9). Without the proxy, auth will fail with network errors.

---

## 8. Running the Admin Panel Locally

```bash
cd admin
npm install          # only first time
npm run dev
```

Opens at `http://localhost:3000/admin/`

The admin panel calls `/admin-api/*` — those calls must reach the Express API on port 3001. When running without the proxy, the browser's same-origin fetch to `/admin-api/...` from `localhost:3000` will fail. Either:

**Option A** — run with the proxy (recommended, see §9)  
**Option B** — set a Vite proxy in `admin/vite.config.ts` pointing `/admin-api` to `http://localhost:3001`

### First-time admin login

The admin panel has its own login separate from Supabase. Admin users are stored in a local `admins` table in your PostgreSQL database (not Supabase). The first admin must be created manually:

```bash
# From project root, connect to your PostgreSQL and run:
# INSERT INTO admins (username, password_hash, role) 
# VALUES ('admin', '<bcrypt-hash>', 'super_admin');
# Generate hash with: node -e "const b=require('bcryptjs'); console.log(b.hashSync('yourpassword', 10))"
```

---

## 9. Running All Services Locally (Full Stack)

The recommended local setup mirrors the Replit environment — one proxy on port 5000 fans out to all services.

**Terminal 1 — Admin API (Express)**:
```bash
# From project root:
node scripts/admin-api.js
# Listens on :3001
```

**Terminal 2 — Admin Panel (Vite)**:
```bash
cd admin && npm run dev
# Listens on :3000, serves /admin/
```

**Terminal 3 — Driver App (Expo Metro)**:
```bash
cd driver-app && npx expo start --web --port 8000 -c
# Listens on :8000, serves /driver/
```

**Terminal 4 — User App (Expo Metro)**:
```bash
cd user-app && npx expo start --web --port 8081 -c
# Listens on :8081
```

**Terminal 5 — Proxy**:
```bash
# From project root:
node scripts/proxy.js
# Single public port :5000 routes to all four services
# /admin/* → :3000  |  /admin-api/* → :3001  |  /driver/* → :8000  |  /* → :8081
```

Then open `http://localhost:5000` for the user app, `http://localhost:5000/admin/` for admin, `http://localhost:5000/driver/` for driver.

---

## 10. Supabase Database Setup

The project uses a **hosted Supabase project** (not local Supabase). All apps point to the same Supabase project URL.

### To connect your own Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase_schema.sql` — this creates all tables idempotently
3. Run each file in `supabase_migrations/` in numeric order (001 → 012) for any schema additions
4. Set the connection credentials in all `.env` files (see §5)
5. The `SUPABASE_SERVICE_ROLE_KEY` is in your Supabase project → Settings → API → `service_role`

### Key Supabase tables

| Table | Description |
|---|---|
| `users` | User accounts (Supabase Auth + extended profile) |
| `drivers` | Driver accounts, KYC status, earnings, location |
| `driver_documents` | KYC document URLs and review status |
| `stores` | Partner stores |
| `products` | Store products |
| `orders` | All orders — core entity |
| `order_items` | Line items per order |
| `wallet_transactions` | Double-entry ledger (centimes) |
| `support_requests` | Customer and driver support tickets |
| `payout_requests` | Driver payout requests |
| `promotions` | Discount codes |
| `banners` | Home screen banners |
| `cities` | Supported cities (multi-city ready) |
| `zones` | Delivery zones per city |
| `push_tokens` | Expo push tokens per user/driver |

### Local PostgreSQL (admin-only tables)

The admin-api also uses a local PostgreSQL database (`DATABASE_URL`) for:
- `admins` table (admin users + bcrypt passwords)
- `audit_log` table (all admin actions)
- `admin_lockout` table (failed login tracking)
- `promotions` mirror (may also be in Supabase — check your schema)
- `push_tokens` (server-side push token registry)

If you do not have a local PostgreSQL, you can use a Supabase connection string as `DATABASE_URL` — the SSL settings in admin-api.js handle both.

---

## 11. Assets and Design System

### Asset locations

| Asset type | Location | Status |
|---|---|---|
| Service illustrations (PNG) | `user-app/assets/illustrations/` | ✅ 10 files (bag_hero, errand, grocery, food, pharmacy, parcel, scooter, discount, etc.) |
| Tab bar icons (PNG) | `user-app/assets/icons/` | ✅ 6 files (cart, chat, favorites, home, middle, orders) |
| Driver app icon | `driver-app/assets/icon.png` | ✅ Present |
| Original brand icons | `jaheez icons/icon/` | ✅ Full designer icon set (PNG) |
| Original illustrations | `jaheez icons/illustrations/` | ✅ Courier, delivery, food, discount, etc. |
| Design mockups | `design/` | ✅ 14 ChatGPT reference images |
| App icon (user-app) | `user-app/assets/` | ⚠️ Check — not explicitly seen; may use Expo default |

### Colors (from `constants/brand.ts`)

| Token | Hex | Usage |
|---|---|---|
| `RED` | `#F03030` | Primary brand — buttons, active states |
| `RED_DARK` | `#C42020` | Gradient end, pressed states |
| `YELLOW` | `#F5CE2E` | Accent — CTAs, highlights |
| `BG` | `#FEFDF8` | Warm white — app background |
| `SURFACE` | `#FFFFFF` | Cards |
| `TEXT` | `#1C1C1E` | Primary text |
| `TEXT2` | `#5C5C5E` | Secondary text |
| `GREEN` | `#2DB87A` | Success, online status |
| `ERROR` | `#DC2626` | Errors |

### Fonts

**Cairo** (Google Fonts) is the exclusive font:
- `Cairo-Bold` → display headings
- `Cairo-SemiBold` → labels, buttons
- `Cairo-Regular` → body text

Loaded via `@expo-google-fonts/cairo`. The app includes a 2-second fallback timer so UI renders with system font if Google Fonts is slow or blocked.

### Design rules

- **No emoji as final UI icons** — use `lucide-react-native` (mobile) or `lucide-react` (admin)
- Money always displayed as `(centimes / 100).toFixed(2) + " MAD"`
- RTL only for Arabic text content — page layout stays LTR
- Rounded corners: `borderRadius: 14-20` for cards, `borderRadius: 999` for pills
- No hardcoded hex values — always reference `BRAND.*` tokens

---

## 12. Features Implemented

### User App

| Feature | Status | Notes |
|---|---|---|
| Welcome / onboarding | ✅ Done | |
| Phone + OTP login | ✅ Done | Via Infobip SMS |
| Email + password login | ✅ Done | Supabase Auth |
| Registration (phone + email) | ✅ Done | |
| Home — service categories | ✅ Done | Food, grocery, pharmacy, parcel, errand, custom |
| Store listing + detail | ✅ Done | |
| Product browsing + cart | ✅ Done | |
| Checkout | ✅ Done | |
| Order tracking (5-stage) | ✅ Done | |
| Order history | ✅ Done | |
| Wallet (centimes ledger) | ✅ Done | View balance, transactions |
| Profile edit | ✅ Done | |
| Address book | ✅ Done | |
| Chat (support) | ✅ Done | |
| Support tickets | ✅ Done | |
| FAQ | ✅ Done | |
| Favorites | ✅ Done | |
| Notifications | ✅ Done | |
| Promotions / promo codes | ✅ Done | |
| Stripe payment | 🟡 Partial | Session-based, gateway-ready |
| Maps (delivery map) | 🟡 Partial | Works on native; blank on web (expected) |
| ModernMT translation | 🟡 Partial | API key required |

### Driver App

| Feature | Status | Notes |
|---|---|---|
| Welcome screen | ✅ Done | |
| Phone OTP login | ✅ Done | |
| Registration (name + vehicle) | 🟡 Partial | Single-step works; multi-step wizard not built |
| KYC pending/rejected gate | ✅ Done | Full-screen with CTA to upload docs |
| Dashboard (online/offline) | ✅ Done | |
| 45-second order accept countdown | ✅ Done | |
| Active delivery (5-stage) | ✅ Done | |
| Issue reporting | ✅ Done | |
| Earnings + COD balance | ✅ Done | |
| Payout request | ✅ Done | |
| Profile + KYC doc upload | 🟡 Partial | Placeholder URL; no native file picker yet |

### Admin Panel

| Feature | Status | Notes |
|---|---|---|
| Login (JWT) | ✅ Done | Bcrypt, lockout after failures |
| Dashboard stats | ✅ Done | |
| Orders management | ✅ Done | |
| Driver management + KYC review | ✅ Done | |
| Store management | ✅ Done | |
| Product management | ✅ Done | |
| Category management | ✅ Done | |
| Promotions | ✅ Done | |
| Banners | ✅ Done | |
| Support tickets | ✅ Done | |
| Refunds | ✅ Done | |
| Driver payouts | ✅ Done | |
| Analytics | ✅ Done | |
| Audit logs | ✅ Done | |
| Push notifications | ✅ Done | |
| Reviews | ✅ Done | |
| Cities | ✅ Done | |
| Admin user management | ✅ Done | |
| Settings | ✅ Done | |
| Order timeline per order | ❌ Missing | Planned for Sprint 5.2 |
| Bulk driver assign | ❌ Missing | Planned for Sprint 5.2 |
| CSV export | ❌ Missing | Planned for Sprint 5.2 |
| Zone polygon editor | ❌ Missing | Planned for Sprint 5.2 |

---

## 13. Known Issues

| Issue | Severity | Details / Fix |
|---|---|---|
| **`ADMIN_JWT_SECRET` hardcoded fallback** | 🔴 High (production) | `scripts/admin-api.js` line 17 falls back to a hardcoded string if `ADMIN_JWT_SECRET` env var is not set. Any server with the same code can forge admin tokens. **Always set this env var in production.** |
| `react-native-reanimated` version mismatch | 🟡 Medium | Both Expo apps warn `reanimated@3.19.5 — expected 4.2.1` at Metro start. Not blocking for current features but may affect advanced animations. Update when ready for a full dependency upgrade. |
| Google Fonts (Cairo) may time out | 🟡 Medium | `fontfaceobserver` used by `@expo-google-fonts/cairo` times out at 12s if Google Fonts is unreachable. Fixed in `driver-app/_layout.tsx` with a 2s fallback timer. If you see a 12s blank splash, check your network. |
| Maps blank on web | 🟡 Low | `react-native-maps` does not support web. This is expected. |
| Driver doc upload is a placeholder | 🟡 Low | Driver profile uploads a URL string, not a real file. No `expo-image-picker` yet. |
| No `.env.example` files | 🟡 Low | Must manually create from §5 of this document. |
| `jaheez-temp/` and `jaheez_workspace/` leftovers | 🟢 Info | Old prototype folders. Safe to delete from your local copy. |
| Stripe webhook not implemented | 🟡 Medium | Payment sessions work; webhook verification for asynchronous events is not wired up. |

---

## 14. Debugging Guide

### Metro / Expo issues

```bash
# Clear all caches (run inside the Expo app folder)
npx expo start -c

# Full reset
rm -rf node_modules .expo
npm install
npx expo start -c
```

| Symptom | Fix |
|---|---|
| Blank white screen on web | Open browser DevTools → Console. Look for import errors. |
| Red gradient splash that never clears | Font loading blocked — check network, confirm Cairo fallback timer in `_layout.tsx` |
| `Cannot use 'import.meta' outside a module` | metro.config.js zustand CJS resolver was removed or broken |
| `Hooks can only be called inside a function component` | Two React copies — metro.config.js React blockList was removed (driver-app only) |
| `Unable to resolve "../../shared/types"` | Metro watchFolders must include monorepo root — check metro.config.js |
| `Cannot find module 'expo-router/entry'` | `npx expo install expo-router` inside the app folder |
| Expo Go shows "Something went wrong" | SDK version mismatch — update Expo Go or use `npx expo start --tunnel` |
| QR code not scanning | Use `--tunnel` for cross-network, or type the URL manually in Expo Go |

### API / Admin issues

```bash
# Test if admin-api is reachable
curl http://localhost:3001/admin-api/health    # should return 200 or 404 (no health endpoint) 

# Test OTP send
curl -X POST http://localhost:3001/admin-api/otp/send \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+212600000001"}'
```

| Symptom | Fix |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY not configured` | Set `SUPABASE_SERVICE_ROLE_KEY` env var before starting admin-api |
| `DATABASE_URL` connection refused | Start your local PostgreSQL, or use a remote DATABASE_URL |
| Admin login returns 401 | Admin account not yet created in the `admins` table — see §8 |
| OTP returns 503 | `INFOBIP_API_KEY` or `INFOBIP_BASE_URL` not set |

### NativeWind / Tailwind issues

```bash
# If styles stop applying
npx expo start -c   # clear Metro cache — NativeWind generates at bundle time
```

---

## 15. Safe Command Reference

```bash
# ── Install all (run each in its folder)
cd user-app   && npm install
cd driver-app && npm install
cd admin      && npm install
cd ..         && npm install    # root (proxy + admin-api)

# ── Start user app (web)
cd user-app && npx expo start --web -c

# ── Start user app (phone)
cd user-app && npx expo start -c
# Then scan QR in Expo Go

# ── Start driver app (web)
cd driver-app && npx expo start --web --port 8000 -c

# ── Start admin panel
cd admin && npm run dev

# ── Start admin API
node scripts/admin-api.js

# ── Start proxy (routes all traffic through :5000)
node scripts/proxy.js

# ── Clear Expo cache
npx expo start -c

# ── Full node_modules reset (inside any Expo app folder)
rm -rf node_modules .expo && npm install

# ── TypeScript check (user-app)
cd user-app && npx tsc --noEmit

# ── TypeScript check (driver-app)
cd driver-app && npx tsc --noEmit

# ── TypeScript check (admin)
cd admin && npx tsc --noEmit

# ── Build admin panel (static export)
cd admin && npm run build
```

---

## 16. Continuing Development with an AI Coding Assistant

### What to show the AI first

1. `docs/JAHEEZ_FULL_PLATFORM_WORKFLOW.md` — the living source of truth for everything planned and done
2. `replit.md` — environment rules, secret names, locale rules
3. `shared/types.ts` and `shared/constants.ts` — data model
4. The specific file you want to change

### Rules for AI sessions

- **One feature at a time.** Never ask "build the whole driver app". Ask "implement the multi-step register wizard for the driver app per the spec in JAHEEZ_FULL_PLATFORM_WORKFLOW.md §5.1".
- **Show the AI the existing file** before asking it to edit. Paste the current code so it doesn't hallucinate a different structure.
- **Money is always centimes** (integer). Remind AI every session: "all amounts are in integer centimes, never floating-point MAD."
- **No AI features.** If the AI suggests adding a recommendation engine, smart sorting, or moderation — reject it. ModernMT translation is the only permitted exception.
- **No emoji in final UI icons.** Lucide icons only.
- **After every AI change**, run `npx tsc --noEmit` and `npx expo start -c` to verify nothing is broken.

### Review checklist after each AI change

- [ ] Money displayed as `(centimes / 100).toFixed(2) + " MAD"` — never stored as MAD
- [ ] No hardcoded hex colors (use `BRAND.*`)
- [ ] No new `package.json` dependencies added without `npm install` run
- [ ] No changes to `metro.config.js` that remove the zustand CJS fix
- [ ] No changes to `driver-app/metro.config.js` that remove the React blockList
- [ ] No emoji used as UI icons
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] App starts: `npx expo start -c`

---

## 17. Download / Handoff Checklist

Before leaving Replit:

- [ ] All changes committed (`git status` is clean)
- [ ] `LOCAL_JAHEEZ_WORKFLOW.md` exists at root and `docs/`
- [ ] `user-app/.env` and `admin/.env` exist (do NOT commit to public repos)
- [ ] `driver-app/.env` created with Supabase keys
- [ ] `supabase_schema.sql` and `supabase_migrations/` are present
- [ ] `scripts/admin-api.js` is present (the entire backend)
- [ ] `scripts/proxy.js` is present
- [ ] `docs/JAHEEZ_FULL_PLATFORM_WORKFLOW.md` is up to date
- [ ] `jaheez icons/` folder included in zip
- [ ] `design/` folder included in zip
- [ ] **No `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_JWT_SECRET` hardcoded in source files** (the fallback in admin-api.js line 17 is a dev convenience — replace it before shipping)
- [ ] `node_modules/` folders are excluded from zip (re-install locally)
- [ ] `.expo/` folders are excluded from zip

**To create a clean zip** (exclude node_modules and .expo):

```bash
zip -r jaheez-handoff.zip . \
  -x "*/node_modules/*" \
  -x "*/.expo/*" \
  -x "*/.git/*" \
  -x "*/artifacts/*" \
  -x "*/.cache/*" \
  -x "*/.local/*" \
  -x "*/jaheez-temp/*" \
  -x "*/jaheez_workspace/*"
```

---

## 18. Recommended Next Steps (in order)

1. **Run it locally** — install dependencies (§4), set env vars (§5), start all five services (§9), confirm user app at `localhost:5000` and admin at `localhost:5000/admin/`
2. **Create your own Supabase project** — run `supabase_schema.sql`, fill in your own env vars (§10)
3. **Create the first admin user** — follow §8
4. **Verify user app screens** — register a test user, browse stores, place a test order
5. **Verify driver app** — register a test driver, log in, go online, accept an order from the user app
6. **Verify admin panel** — log in, see the test order, approve KYC, process a payout
7. **Set up Infobip** for OTP (§5 — without it phone login shows a 503 error)
8. **Set up Stripe** for card payments (§5 — COD and wallet work without it)
9. **Continue feature work** — follow `docs/JAHEEZ_FULL_PLATFORM_WORKFLOW.md` Sprint 5.2 onwards

---

## 19. Final Project Status

| Item | Status |
|---|---|
| Can run locally | ✅ Yes — all five services can run locally |
| User app path | `user-app/` |
| User app start command | `cd user-app && npx expo start -c` |
| Driver app path | `driver-app/` |
| Driver app start command | `cd driver-app && npx expo start --web --port 8000 -c` |
| Admin panel path | `admin/` |
| Admin panel start command | `cd admin && npm run dev` |
| Backend path | `scripts/admin-api.js` |
| Backend start command | `node scripts/admin-api.js` (from project root) |
| Proxy start command | `node scripts/proxy.js` (from project root) |
| **Biggest local blocker** | `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be set before admin-api starts |
| **First local action** | Copy `.env` files, run `npm install` in all four folders, then `node scripts/admin-api.js` to verify backend connects |
| Production-readiness | 🟡 Not yet — `ADMIN_JWT_SECRET` hardcoded fallback must be fixed, document upload needs real file picker, Stripe webhooks need wiring |
