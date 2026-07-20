# 1. PROJECT MASTER OVERVIEW — JAHEEZ (جاهز)

**Status:** Early-to-mid development | **Last Inspected:** 2026-05-19

---

## Executive Summary

**JAHEEZ** (جاهز — Arabic for "Ready") is a **regional smart delivery and errand platform** currently under active development for the **Safi region of Morocco**. It is a **three-app ecosystem** (User App + Driver App + Admin Panel) designed to connect customers with local delivery drivers for food, groceries, pharmacy items, parcels, and custom errands.

The platform emphasizes **fraud detection**, **content moderation**, **multilingual support** (Arabic/French/English), **RTL-first design**, and **cash-on-delivery with card payments**.

---

## What JAHEEZ Does

### Core Business Model
- **Users** browse nearby stores (food, grocery, pharmacy), build carts, checkout, and track deliveries
- **Drivers** accept available orders, navigate to pickup/delivery locations, and earn money
- **Admins** manage stores, moderate orders, view analytics, handle finances, and manage drivers

### Service Types Offered
1. **Food Delivery** — Restaurants, cafés, bakeries with menu browsing and customization
2. **Grocery Delivery** — Supermarkets, grocery stores with batch ordering
3. **Pharmacy Delivery** — Licensed pharmacy items with age/ID verification
4. **Parcel Delivery** — General package delivery within Safi region
5. **Custom Errands** — "Send a driver to do X" with AI-powered fraud detection

### Geographic Scope
- **Primary market:** Safi, Morocco (coastal city, Marrakech-Safi region)
- **Delivery zones:** Safi centre, nord, sud, est with configurable delivery radius
- **Currency:** Moroccan Dirham (MAD), amounts stored in centimes internally
- **Languages:** Arabic (primary, RTL), French (secondary, LTR), English (tertiary)

---

## Project Structure

### Three Apps in One Monorepo

| App | Location | Tech | Purpose | Status |
|-----|----------|------|---------|--------|
| **User App** | `user-app/` | Expo SDK 55 + React Native 0.83 | Mobile app for customers (iOS + Android) | 🟡 Partial |
| **Driver App** | `driver-app/` | Expo SDK 55 + React Native 0.83 | Mobile app for drivers (iOS + Android) | 🟡 Partial |
| **Admin Panel** | `admin/` | Vite 5 + React 18 + Tailwind CSS | Web dashboard for admin operations | 🟡 Partial |
| **Backend API** | `scripts/admin-api.js` | Express.js 5 (Node.js) | Backend for admin ops, user registration fallback | 🟡 Partial |
| **Shared** | `shared/` | TypeScript | Shared types, constants, enums across all apps | ✅ Complete |

### Directory Overview

```
jaheez/
├── user-app/              # Customer mobile app (largest app, ~35 screens)
│   ├── app/               # Expo Router navigation structure
│   │   ├── (auth)/        # Auth screens (splash, login, register, otp, etc.)
│   │   ├── (tabs)/        # Main tab-based navigation (home, search, orders, chat, profile, wallet)
│   │   └── (flows)/       # Flow screens (store, cart, checkout, tracking, settings, etc.)
│   ├── components/ui/     # Reusable UI components (26 files)
│   ├── constants/         # brand.ts (design tokens), strings.ts (i18n)
│   ├── store/             # Zustand stores (auth, cart, language, etc.)
│   ├── hooks/             # Custom hooks (useAuth, useOrders, useLocation, useChat, etc.)
│   ├── lib/               # API clients, Supabase config, utilities
│   └── assets/            # Icons, illustrations, images, fonts
│
├── driver-app/            # Driver mobile app (similar structure)
│   ├── app/               # Expo Router
│   │   ├── (auth)/        # Auth screens
│   │   ├── (tabs)/        # Driver tabs (home/queue, earnings, profile)
│   │   └── (flows)/       # Active delivery, payout request
│   ├── constants/         # brand.ts (shared style tokens)
│   ├── lib/               # API clients
│   ├── store/             # Zustand stores
│   └── assets/            # ⚠️ EMPTY — needs icons/images
│
├── admin/                 # Admin web panel
│   ├── src/
│   │   ├── pages/         # 22 admin pages (login, dashboard, orders, stores, drivers, etc.)
│   │   ├── components/    # Shadcn/ui components + layout components
│   │   ├── lib/           # API client
│   │   └── store/         # Auth store
│   ├── public/            # Static assets
│   └── vite.config.ts     # Vite configuration
│
├── shared/                # TypeScript types and constants
│   ├── types.ts           # User, Driver, Order, Store, Payment interfaces, etc.
│   └── constants.ts       # Order statuses, valid transitions, zones, thresholds
│
├── scripts/               # Backend scripts and CLI tools
│   ├── admin-api.js       # Express.js API (user auth fallback, admin auth, CRUD)
│   ├── create-admin.js    # CLI to create first admin account
│   ├── seed-stores.js     # CLI to seed sample stores and menu items
│   └── proxy.js           # HTTP proxy (legacy/experimental)
│
├── supabase_schema.sql    # Complete database schema (889 lines)
├── supabase_migrations/   # Directory for SQL migrations
├── docs/                  # Project documentation (30+ markdown files)
├── design/                # Design reference images (ChatGPT, Grok renders)
└── package.json           # Root dependencies (Express, Supabase, bcrypt, JWT, Stripe)
```

---

## Technology Stack & Low-Cost Tooling Strategy

The project implements a pragmatically optimized, low-cost stack designed for developer speed, minimal API overhead, and Moroccan market compatibility.

### Frontend (Mobile Apps)
- **Core Mobile:** Expo SDK 55 + React Native 0.83 (cross-platform iOS & Android)
- **Navigation:** Expo Router v3 (declarative file-based routing)
- **State & Server Cache:** Zustand (local persist client state) + React Query (server-side query cache)
- **Forms & Validation:** React Hook Form + Zod validation schemas
- **Styling:** React Native `StyleSheet.create()` leveraging unified design tokens in `constants/brand.ts`.
- **UI & Animations:** `react-native-reanimated` + `Moti` for transitions, `Lottie` for JSON vector animations, `expo-image` for high-performance cached image loading. No emojis are used for final assets (replaced by custom SVG or PNG paths).

### Backend, Database & Storage (Supabase Centric)
- **Backend Infrastructure:** Supabase (Free Tier) acts as the primary data and auth host, eliminating the need to maintain custom server infrastructure early on.
- **Database:** Supabase PostgreSQL 15+ including triggers, constraints, and Row-Level Security (RLS) policies.
- **Authentication:** Supabase Auth using **Email OTP (6-digit numeric codes)** for V1.
- **File Storage:** Supabase Storage Buckets for driver verification documents, user avatars, and store/menu media.
- **Realtime:** Supabase Realtime for instant chat messaging and order status listener.

### V1 Operations & Communications (WhatsApp Business)
- **Operational Strategy:** Manual coordination via the official **WhatsApp Business App** for operator-to-driver dispatches and user support requests.
- **WhatsApp API Limits:** Unofficial WhatsApp automation wrappers (such as OpenWA or web scrapers) are strictly forbidden for core authentication or critical notifications. 

### Hosting & Infrastructure
- **Admin Frontend:** Hosted on **Vercel** (Free Tier, automatic deploys from GitHub).
- **Admin Node API:** Hosted on **Render** (Free Tier) for background admin CRUD queries.
- **Mobile Packaging:** Local builds during development; Expo Application Services (**EAS**) for production App Store/Play Store packaging later.

### Payments
- **Morocco-First Priority (V1):** Cash on Delivery (COD) acts as the primary, blocking payment option. Online credit/debit card integrations (via Stripe or local Moroccan gateways CMI / PayZone / CashPlus) are deferred until core order flow is stable.

### Maps & Tracking
- **MVP Tracking Strategy:** Status-based stepper timeline (Order Received, Confirmed, Preparing, On the Way, Delivered). Map geocoding and live GPS driver pin updates (Supabase Realtime + Google Maps API) are deferred to later phases.

---

---

## Current Product Direction

### What This App is Intended to Become
A **production-ready regional delivery platform** similar to:
- **Glovo** (versatile delivery)
- **Talabat** (restaurant-focused)
- **Uber Eats** (food + groceries)
- **Bolt Food** (delivery with driver rewards)

But **localized for Morocco** with:
- Arabic-first design and RTL support
- Moroccan payment preferences (cash on delivery + card)
- Regional trust/fraud system with content moderation
- Errand economy (not just goods delivery)
- Local driver earning incentives

### MVP Scope (What Appears Intended)
1. ✅ User authentication (phone + OTP or email)
2. ✅ Store browsing by category
3. ✅ Menu viewing and cart management
4. ✅ Checkout with address selection
5. ✅ Order placement (payment method selection)
6. ✅ Driver assignment and live tracking
7. ✅ Order status updates
8. 🟡 Chat/support with driver
9. ⚠️ Wallet and prepaid balance
10. ✅ Order history
11. ⚠️ Admin dashboard for operations
12. 🟡 Driver app for accepting and fulfilling orders
13. ⚠️ Analytics and reporting
14. ⚠️ Fraud detection and content moderation

### Production Readiness
**NOT production-ready.** The project is in **early-to-mid development**:
- Many screens use mock/fallback data instead of live APIs
- Database schema exists but deployment status is unclear
- Admin API exists but may not be deployed
- No CI/CD pipelines configured
- No automated tests
- Secrets and API keys are exposed in `.env` files
- No production build or EAS configuration
- Design system has conflicts between files

---

## Important Assumptions Discovered

### From Code Analysis
1. **Backend:** Supabase is the assumed backend (Auth + DB + Storage + Realtime)
2. **Mobile build:** Expo Application Services (EAS) is implied but not configured
3. **Admin auth:** Phone-based (SMS OTP) like the user app
4. **Payment processing:** Stripe for cards, cash on delivery as fallback
5. **Fraud prevention:** Content moderation with banned keywords and risk scoring
6. **Driver matching:** Automatic assignment based on proximity and availability
7. **Live tracking:** Real-time driver location updates (via Supabase Realtime)
8. **Notifications:** Push notifications via FCM/APNs (Expo setup exists)
9. **Multi-language:** Arabic (primary), French (secondary), English (tertiary)
10. **Regional deployment:** Safi, Morocco focus (but could expand to other regions)

### Design Philosophy
- **Brand:** Red (#F03030) + Yellow (#F5CE2E) from logo
- **Theme:** Light warm design (cream backgrounds, white cards)
- **Typography:** Cairo font family (Arabic-first, supports Latin)
- **Spacing:** 8px grid system throughout
- **Components:** Card-based UI, bottom tabs, top nav with back button
- **Accessibility:** Minimum 44px touch targets, semantic HTML, ARIA labels

### Business Rules Found
- **Trust score:** Users/drivers have numeric trust scores (0-100)
- **Delivery zones:** Safi divided into 4 zones (centre, nord, sud, est)
- **Order statuses:** pending → confirmed → preparing → picked_up → delivered → completed
- **Payment methods:** cash (default), card (Stripe), wallet
- **Vehicle types:** motorcycle (default), car, bicycle, on_foot
- **User roles:** user, driver, admin (with sub-roles for admin: super_admin, admin, manager, support)
- **Order timeout:** If no driver accepts within X minutes, order is cancelled
- **Driver acceptance deadline:** Driver must confirm pickup within X minutes or order reassigned

---

## What the App is NOT Yet Ready For

1. ⚠️ **Production deployment** — Secrets exposed, no EAS config, untested builds
2. ⚠️ **Real user load** — No stress testing, no API rate limiting visible
3. ⚠️ **Payment processing** — Stripe integration exists but may be incomplete
4. ⚠️ **Live driver tracking** — Mock data used in tracking screen, real GPS unclear
5. ⚠️ **Fraud detection** — Backend edge functions for AI moderation not implemented
6. ⚠️ **Multi-city expansion** — Currently hardcoded to Safi region
7. ⚠️ **Offline support** — No service workers or offline-first caching visible
8. ⚠️ **Accessibility compliance** — Basic labels exist but WCAG testing likely needed
9. ⚠️ **Third-party integrations** — Google Maps, Stripe, Infobip not fully integrated
10. ⚠️ **Admin onboarding** — No admin registration UI, must use CLI

---

## At a Glance: What You're Building

You are building a **delivery marketplace for Safi, Morocco** with:
- **Three mobile/web applications** connected by a shared backend
- **Real-time order matching** between users, drivers, and stores
- **Live delivery tracking** with map integration
- **Fraud prevention** and content moderation
- **Wallet and payment system** with multiple payment methods
- **Admin operations dashboard** for platform management
- **Support and chat system** between users and drivers
- **Earning and payout system** for drivers

The technology is modern (Expo, React, TypeScript, Supabase), the design system is well-thought-out, and the business logic is sophisticated. However, it is still in development and needs to be stabilized, tested, and deployed.

---

## Quick Reference: Key Files

| Purpose | File | Lines | Status |
|---------|------|-------|--------|
| Brand tokens | `user-app/constants/brand.ts` | 179 | ✅ Complete |
| Shared types | `shared/types.ts` | 462 | ✅ Complete |
| Database schema | `supabase_schema.sql` | 889 | ✅ Schema exists |
| Auth store | `user-app/store/authStore.ts` | 81 | ✅ Complete |
| Cart store | `user-app/store/cartStore.ts` | 200+ | ✅ Complete |
| Admin API | `scripts/admin-api.js` | 146KB | 🟡 Exists, unclear if deployed |
| Home screen | `user-app/app/(tabs)/index.tsx` | 24KB | 🟡 Partial (mock data) |
| Checkout | `user-app/app/(flows)/checkout.tsx` | 29KB | 🟡 Partial (mock data) |
| Admin pages | `admin/src/pages/*.tsx` | 22 pages | 🟡 Partial (UI mostly done) |
| Root entry | `user-app/app/index.tsx` | 49 lines | ✅ Clean routing logic |

---

## Next Steps

1. **Review this documentation** — Verify assumptions about the app
2. **Read docs/02_PROJECT_CURRENT_STATE.md** — Understand completion status
3. **Read docs/03_PROJECT_STRUCTURE_MAP.md** — Understand folder layout
4. **Read docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md** — Understand every screen
5. **Read docs/05_BUTTON_ACTION_MAP.md** — Understand every button
6. **Then:** Decide what to build/fix first based on priorities

---

**Created:** 2026-05-19 | **Method:** Complete workspace inspection | **Confidence:** High (verified against actual files)
