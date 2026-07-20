# PROJECT MASTER OVERVIEW

> Generated: 2026-05-19 | Source: Full workspace inspection | Status: Comprehensive audit

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Name** | JAHEEZ (جاهز — "Ready" in Arabic) |
| **Type** | On-demand delivery & errands platform |
| **Business Model** | Multi-service delivery (food, grocery, pharmacy, parcels, custom errands) |
| **Target Market** | Morocco — Safi region (آسفي) initially, expandable |
| **Target Users** | Moroccan consumers (Arabic-first, French-second, English tertiary) |
| **Tagline** | "Smart Delivery & Errands" |
| **Currency** | MAD (Moroccan Dirham), stored as centimes internally |

---

## 2. Apps & Modules Found

### 2.1 User App (`user-app/`)
- **Framework:** Expo SDK 55 + React Native 0.83 + Expo Router v3
- **Purpose:** Consumer-facing mobile app for ordering food, groceries, pharmacy items, sending parcels, and requesting custom errands
- **Status:** Most advanced — ~35+ screens implemented, connected to Supabase
- **Running:** Currently active on `npx expo start`

### 2.2 Driver App (`driver-app/`)
- **Framework:** Same Expo/RN stack as user-app
- **Purpose:** Driver-facing app for accepting/managing deliveries, KYC, earnings tracking, payout requests
- **Status:** Early-stage — basic screens exist (auth, tabs, flows), but far less developed than user-app
- **Notable:** Has its own separate `node_modules`, `package.json`, and Expo config

### 2.3 Admin Panel (`admin/`)
- **Framework:** Vite + React 18 + Tailwind CSS v4 + Radix UI + shadcn/ui pattern
- **Purpose:** Back-office dashboard for managing orders, stores, products, users, drivers, promotions, support, finance
- **Status:** Heavily developed — 23 page files, comprehensive CRUD operations
- **Running:** Currently active on `npm run dev` (port 3000)

### 2.4 Admin API (`scripts/admin-api.js`)
- **Framework:** Express.js (Node.js)
- **Purpose:** Backend API proxy between admin panel and Supabase + local PostgreSQL
- **Status:** Massive file (152KB, 3194 lines) — fully functional with JWT auth, RBAC, audit logging
- **Running:** Currently active on `node scripts/admin-api.js` (port 3001)

### 2.5 Shared (`shared/`)
- **Files:** `types.ts` (462 lines), `constants.ts` (60 lines)
- **Purpose:** Cross-app TypeScript interfaces and constants (order statuses, vehicle types, risk thresholds, valid transitions)

### 2.6 Database (`supabase_schema.sql`)
- **Platform:** Supabase (hosted PostgreSQL + Auth + Realtime + Storage)
- **Status:** 889-line comprehensive schema with 12+ migrations, RLS policies, triggers, functions
- **Remote URL:** `https://lwgoiktmfbbtewujojor.supabase.co`

---

## 3. Main Features (Designed or Implemented)

### User App Features
| Feature | Status |
|---------|--------|
| Splash screen (image → video → app) | ✅ Implemented |
| Onboarding slides | ✅ Implemented |
| Welcome screen | ✅ Implemented |
| Phone + password login | ✅ Implemented |
| Phone + password registration | ✅ Implemented |
| OTP verification (Infobip) | ✅ Implemented |
| Demo/guest login | ✅ Implemented |
| Home screen with services grid | ✅ Implemented |
| Search (stores, products) | ✅ Implemented |
| Category browsing | ✅ Implemented |
| Store details + menu | ✅ Implemented |
| Cart management | ✅ Implemented |
| Checkout (address, payment, promo) | ✅ Implemented |
| Order tracking with map | ✅ Implemented |
| Order history | ✅ Implemented |
| Order details | ✅ Implemented |
| Custom errand request | ✅ Implemented |
| Order confirmation | ✅ Implemented |
| Chat (user ↔ driver) | ✅ Implemented |
| Notifications | ✅ Implemented |
| Profile view | ✅ Implemented |
| Profile edit | ✅ Implemented |
| Saved addresses | ✅ Implemented |
| Favorites | ✅ Implemented |
| Payment methods (Stripe) | ✅ Implemented |
| Payment success | ✅ Implemented |
| Wallet tab | ⚠️ Stub (129 bytes) |
| Settings | ✅ Implemented |
| FAQ | ✅ Implemented |
| Terms of use | ✅ Implemented |
| Support ticket | ✅ Implemented |
| Delete account | ✅ Implemented |
| Offline banner | ✅ Implemented |
| Force update modal | ✅ Implemented |
| Maintenance banner | ✅ Implemented |
| RTL support (Arabic) | ✅ Implemented |
| i18n (AR/FR/EN) | ✅ Implemented (languageStore + ModernMT) |
| Push notifications | ✅ Implemented (Expo) |

### Admin Panel Features
| Feature | Status |
|---------|--------|
| Admin login (JWT) | ✅ Implemented |
| Dashboard/stats | ✅ Implemented |
| Orders management | ✅ Implemented |
| Stores CRUD | ✅ Implemented |
| Products/menu CRUD | ✅ Implemented |
| Users management | ✅ Implemented |
| Drivers management | ✅ Implemented |
| Categories management | ✅ Implemented |
| Promotions management | ✅ Implemented |
| Support tickets | ✅ Implemented |
| Analytics page | ✅ Implemented |
| Settings page | ✅ Implemented |
| Admin user management | ✅ Implemented |
| Audit logs | ✅ Implemented |
| Cities management | ✅ Implemented |
| Refunds | ✅ Implemented |
| Finance overview | ✅ Implemented |
| Payout requests | ✅ Implemented |
| COD reconciliation | ✅ Implemented |
| App content management | ✅ Implemented |
| Vehicle types | ✅ Implemented |
| Driver issues | ✅ Implemented |
| RBAC (5 roles) | ✅ Implemented |

### Driver App Features
| Feature | Status |
|---------|--------|
| Welcome screen | ✅ Implemented |
| Login | ✅ Implemented |
| Registration | ✅ Implemented |
| OTP verification | ✅ Implemented |
| Pending approval screen | ✅ Implemented |
| Dashboard (home) | ✅ Implemented |
| Earnings | ✅ Implemented |
| Profile | ✅ Implemented |
| Active delivery flow | ✅ Implemented |
| Payout request | ✅ Implemented |

---

## 4. Current Product Direction

The project is building a **full-stack delivery ecosystem** for Morocco, initially targeting Safi. The platform aims to be a **super-app** for deliveries encompassing:

1. **Food delivery** — restaurant ordering with menus, options, cart
2. **Grocery delivery** — supermarket/convenience store items
3. **Pharmacy delivery** — prescription & OTC items
4. **Parcel delivery** — send packages within the city
5. **Custom errands** — any legal task (AI moderation planned)
6. **Wallet system** — in-app balance with top-up, refunds, payments
7. **Driver ecosystem** — KYC verification, earnings, COD settlement, payouts

---

## 5. What the Final Platform Appears Intended to Be

A **production-ready three-app platform** with:
- A polished consumer mobile app (iOS + Android via Expo/EAS)
- A driver mobile app for delivery partners
- A comprehensive admin web panel for platform operations
- Supabase backend with real-time order tracking, chat, notifications
- AI-powered content moderation for custom errands (Gemini API, planned)
- Stripe payment integration + cash-on-delivery
- SMS OTP via Infobip
- Multi-language support (Arabic primary, French secondary, English tertiary)

---

## 6. What the Project is NOT Yet Ready For

1. **Production deployment** — Multiple mock fallbacks active, local dev passwords in .env, hardcoded Supabase keys
2. **App Store submission** — No EAS build configuration found, no app icons for Android adaptive icon
3. **Real payment processing** — Stripe keys are test mode (`sk_test_...`, `pk_test_...`)
4. **Real SMS sending** — Infobip configured but unclear if fully tested in production
5. **AI moderation** — Mentioned in docs but no Edge Functions found in workspace
6. **Driver matching** — No automated driver-matching algorithm implemented
7. **Performance under load** — No load testing, no CDN, no caching strategy beyond React Query
8. **Security audit** — API keys in .env committed, service role key exposed in file

---

## 7. Important Assumptions Discovered From Files

1. **Fallback-heavy architecture**: The user-app uses `fallbackApi.ts` + `mockData.ts` extensively — when Supabase tables are empty, it falls back to OpenStreetMap Overpass API for real Safi businesses and TheMealDB for menu items
2. **Dual database pattern**: Admin API uses both Supabase (for shared data) and local PostgreSQL (for admin-only tables like promotions, audit logs, login attempts)
3. **Local PostgreSQL issue**: The `DATABASE_URL` in `.env` points to `heliumdb` — past conversations confirm this caused `getaddrinfo ENOTFOUND helium` errors
4. **Two localization systems**: `constants/strings.ts` (structured nested object) AND `store/languageStore.ts` (flat object with ModernMT live translation) — these are potentially conflicting/redundant
5. **NativeWind configured but not actively used**: Both `tailwind.config.js` and `nativewind-env.d.ts` exist but the codebase primarily uses `StyleSheet.create()` with brand tokens
6. **The admin panel was cloned from a template** (`jaheez-admin-template/` directory still present) and then customized
7. **Past "V1 Reset" decision**: `docs/V1_RESET_DECISION.md` suggests the project went through a significant restructuring at some point
8. **Massive documentation already exists**: 35 markdown files in `docs/` folder, plus 8+ spec/architecture files at root — but many may be outdated or conflicting
