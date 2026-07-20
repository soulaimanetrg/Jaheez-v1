# PROJECT IMPROVEMENT STRATEGY — JAHEEZ

> **Date:** 2026-05-05  
> **Purpose:** Stabilize, organize, and improve the full JAHEEZ platform — not shrink it.  
> **Scope:** User App + Driver App + Admin Panel + Backend + All Platform Features

---

## 1. Executive Summary

JAHEEZ is a multi-app delivery and errand platform targeting Safi, Morocco. It consists of three applications (User App, Driver App, Admin Panel), a Supabase backend, an Express admin API, and supporting infrastructure for payments, tracking, dispatch, and wallet operations.

A full workspace audit revealed that substantial work exists across all three apps — 35+ user-app screens, 10 driver-app screens, 22 admin pages, a comprehensive database schema, and a 146KB admin API. However, the project has **foundation-level problems** that must be resolved before any further feature development:

- Four conflicting primary color definitions across config files
- A styling framework (NativeWind) fully configured but unused in any screen
- Hardcoded secrets and Supabase fallback credentials in source code
- Every screen falling back to mock data, masking real integration bugs
- Oversized image assets (1.7MB illustrations) unsuitable for mobile
- Zero test files, no CI/CD, no EAS production build config
- Driver app dependency version mismatches with user app

**The strategy is NOT to remove features or shrink scope.** The strategy is:

1. **Stabilize** — Fix the foundation problems that make further work unreliable
2. **Organize** — Clean up the codebase so every developer (human or AI) can work safely
3. **Improve** — Polish existing screens to production quality
4. **Continue** — Resume feature development on ALL platform parts in a structured order

Every platform feature — wallet, payments, tracking, dispatch, driver earnings, AI moderation — remains in scope. They are improved and completed in phases, not deleted.

---

## 2. What We Keep

### Applications

| App | Location | Status | Action |
|-----|----------|--------|--------|
| **User App** | `user-app/` | 35 screens, 26 components, full auth/cart/order flows | Stabilize → Polish → Connect real data |
| **Driver App** | `driver-app/` | 10 screens, auth + delivery + earnings flows | Fix deps → Add assets → Stabilize → Polish |
| **Admin Panel** | `admin/` | 22 pages, full CRUD for all entities | Verify → Document → Use for operations |

### Backend & Infrastructure

| Item | Location | Action |
|------|----------|--------|
| Supabase schema | `supabase_schema.sql` | Keep as-is. 11+ tables, RLS, triggers. Deploy and verify. |
| Admin API | `scripts/admin-api.js` | Keep as-is. 146KB Express API. Document endpoints. |
| Seed scripts | `scripts/seed-stores.js`, `scripts/create-admin.js` | Keep. Use to populate real data. |
| Migrations | `supabase_migrations/` | Keep. Add new migrations for future schema changes. |

### Auth System
- `user-app/lib/authApi.ts` — phone+password, email fallback, OTP, Google OAuth
- `user-app/store/authStore.ts` — Zustand with AsyncStorage persistence
- `user-app/hooks/useAuth.ts` — auth hook
- `user-app/lib/infobipOtp.ts` — Infobip SMS integration
- Driver app auth screens (login, register, OTP, KYC pending)

### Wallet & Payment Structure
- `user-app/lib/walletApi.ts` — wallet API functions
- `user-app/lib/stripeClient.ts` — Stripe client setup
- `supabase_schema.sql` — `wallets`, `wallet_transactions` tables with RLS
- `admin/src/pages/Wallets.tsx` — admin wallet management (24.8KB)
- `admin/src/pages/Payouts.tsx` — driver payout approvals
- Schema RPCs: `admin_wallet_adjust` for atomic balance updates

### Order & Tracking Structure
- `user-app/lib/orderApi.ts` — order CRUD
- `user-app/store/orderStore.ts` — order state
- `user-app/hooks/useTracking.ts` — tracking hook
- `user-app/app/(flows)/tracking/[id].tsx` — tracking screen (20KB)
- `user-app/app/(flows)/order/[id].tsx` — order detail (29KB)
- `user-app/components/ui/ProgressTimeline.tsx` — status timeline
- Schema: `orders`, `order_items`, `order_status_log` tables

### Driver Earnings & Dispatch
- `driver-app/app/(tabs)/earnings.tsx` — earnings dashboard
- `driver-app/app/(flows)/payout-request.tsx` — payout requests
- `driver-app/app/(tabs)/index.tsx` — delivery queue / accept flow
- `driver-app/app/(flows)/active-delivery.tsx` — active delivery tracking
- Schema: `driver_locations`, `payments` tables
- Admin: `Drivers.tsx`, `Payouts.tsx` pages

### Reusable UI Components (26 in user-app)
All components in `user-app/components/ui/` — Button, Input, Card, Badge, Avatar, BottomSheet, Loader, MapMarker, OTPInput, OrderCard, ProgressTimeline, ScreenWrapper, TopNav, AnimatedPressable, FadeInView, SkeletonBox, ShimmerPlaceholder, OfflineBanner, MaintenanceBanner, ForceUpdateModal, TText, etc.

### Design & Assets
- `user-app/constants/brand.ts` — design tokens (after correction)
- `user-app/constants/animations.ts` — animation presets
- `user-app/constants/strings.ts` — AR/FR string tables
- `user-app/assets/icons/` — 6 tab bar icons
- `user-app/assets/illustrations/` — 10 3D-style illustrations
- `jaheez icons/` — brand logo variations
- `design/` — 14 ChatGPT-generated design reference images
- `shared/types.ts` — 462 lines of TypeScript interfaces
- `shared/constants.ts` — order statuses, zones, thresholds

---

## 3. What Needs Improvement

### 🔴 Critical (Blocks reliable development)

| Issue | Details | Impact |
|-------|---------|--------|
| **Color system conflict** | `brand.ts` (#F03030), `AGENTS.md` (#EF4444), `app.json` (#AB3500), `tailwind.config.js` (#AB3500) | Every new screen risks using wrong colors |
| **NativeWind vs StyleSheet** | NativeWind fully configured (babel, metro, tailwind config) but 0/35 screens use `className` | Build complexity for no benefit; confuses contributors |
| **Hardcoded Supabase fallback** | `supabase.ts` has hardcoded URL + anon key as fallback | Security risk; masks missing env vars |
| **Exposed secrets** | `.env` files contain real service role key, Infobip key, Stripe key, JWT secret | Full DB compromise if repo is public |
| **Mock data reliance** | `fallbackApi.ts` silently returns mock data when Supabase fails | Real integration bugs are invisible |
| **Driver app dep mismatch** | `react-native-reanimated` 4.2.1 (user) vs ^3.15.5 (driver); `worklets` 0.7.4 vs ^0.8.1 | Driver app may crash on startup |

### 🟡 Important (Should fix before polishing)

| Issue | Details |
|-------|---------|
| **Duplicate splash** | Both `app/index.tsx` and `app/(auth)/splash.tsx` render splash screens |
| **Oversized assets** | Hero illustrations 1.3-1.7MB, tab icons 304-391KB |
| **Empty driver assets** | `driver-app/assets/` is empty — no icons or images |
| **Wallet tab stub** | `wallet.tsx` is 6 lines — just redirects to home |
| **Missing forgot password** | Referenced in strings, no screen file |
| **app.json colors wrong** | `primaryColor` and `backgroundColor` don't match brand.ts |
| **Unused `i` package** | Accidental `npm i i` in root package.json |
| **Cluttered root** | ~10 planning docs, 2 RAR archives, abandoned temp directories |

### 🟢 Should Improve (Before production)

| Issue | Details |
|-------|---------|
| **Zero test files** | No unit, component, integration, or E2E tests |
| **No EAS config** | Can't build for production without `eas.json` |
| **No CI/CD** | No automated builds, deploys, or checks |
| **Missing Edge Functions** | No `supabase/functions/` — AI moderation, driver matching, notifications need this |
| **Inconsistent docs** | 23 docs files + 7 root markdown files with overlap and contradictions |
| **README empty** | Just "# Jaheez" |
| **Admin API undocumented** | 146KB of endpoints with no API docs |
| **React version split** | Admin uses React 18, mobile apps use React 19 |

---

## 4. What Must Be Stabilized First

These are the **prerequisites** before any screen polish or feature work. Order matters.

### Priority 1: Environment & Secrets

| Task | Why First |
|------|-----------|
| Create `.env.example` for root, user-app, admin | New developers can't set up without this |
| Verify `.gitignore` excludes `.env` | Prevent further secret exposure |
| Remove hardcoded Supabase URL/key from `supabase.ts` | Fail explicitly instead of silently connecting |
| Document all required env vars in README | Onboarding requirement |

### Priority 2: App Startup / Expo Runtime

| Task | Why |
|------|-----|
| Run `expo start` in user-app — fix all Metro errors | Can't improve what doesn't run |
| Run `expo start` in driver-app — fix all Metro errors | Same |
| Run `npm run dev` in admin — fix all Vite errors | Same |
| Resolve NativeWind build pipeline (keep or remove from build) | Metro wrapper and babel plugin affect startup |

### Priority 3: Design Token Consistency

| Task | Why |
|------|-----|
| Declare `brand.ts` as the single source of truth | Ends the 4-color conflict |
| Update `app.json` colors to match `brand.ts` | System-level colors match app colors |
| Update `AGENTS.md` token values to match `brand.ts` | AI agents use correct values |
| Align `tailwind.config.js` with `brand.ts` (or mark as unused) | No conflicting Tailwind palette |

### Priority 4: Routing & Splash Sanity

| Task | Why |
|------|-----|
| Make `app/index.tsx` a pure redirect (no inline splash) | One splash, not two |
| Verify auth → tabs → flows navigation works E2E | Routing is the app skeleton |

### Priority 5: Asset Organization

| Task | Why |
|------|-----|
| Compress illustrations to <200KB | 1.7MB images freeze app on load |
| Compress tab icons to <50KB | Performance |
| Copy useful assets from `jaheez icons/` to `user-app/assets/` | Centralize assets |
| Add basic icons/assets to `driver-app/assets/` | Driver app needs visual elements |

### Priority 6: Dependency Compatibility

| Task | Why |
|------|-----|
| Align driver-app `react-native-reanimated` with user-app version | Prevent runtime crashes |
| Align driver-app `react-native-worklets` with user-app version | Same |
| Remove `i` package from root | Cleanup |

### Priority 7: README & Setup Docs

| Task | Why |
|------|-----|
| Write root `README.md` with project overview and setup instructions | Onboarding |
| Document how to run each app | Repeatability |
| Document env var requirements | Self-service setup |

---

## 5. Full Product Direction

JAHEEZ remains a **complete multi-app delivery and errand platform**. Nothing is removed from the product vision.

### Platform Components

```
┌─────────────────────────────────────────────────────────┐
│                     JAHEEZ PLATFORM                     │
├───────────────┬───────────────┬─────────────────────────┤
│  User App     │  Driver App   │  Admin Panel            │
│  (Expo/RN)    │  (Expo/RN)    │  (Vite/React)           │
├───────────────┴───────────────┴─────────────────────────┤
│                  Supabase Backend                        │
│  Auth │ Database │ Realtime │ Storage │ Edge Functions   │
├─────────────────────────────────────────────────────────┤
│              External Services                           │
│  Stripe │ Infobip │ Google Maps │ ModernMT │ Gemini AI  │
└─────────────────────────────────────────────────────────┘
```

### Feature Map (Full Platform)

| Domain | User App | Driver App | Admin Panel |
|--------|----------|------------|-------------|
| **Auth** | Phone login, register, OTP | Phone login, register, OTP, KYC | Admin login, roles |
| **Browsing** | Categories, stores, menus, search | — | Store/product management |
| **Ordering** | Cart, checkout, custom errands | Accept/reject orders | Order management |
| **Payments** | Cash, card (Stripe), wallet | — | Wallet management, refunds |
| **Tracking** | Live map, status updates | GPS broadcasting, status updates | — |
| **Dispatch** | — | Order queue, accept flow | Driver assignment |
| **Earnings** | — | Earnings dashboard, payout requests | Payout approvals |
| **Support** | Tickets, FAQ, WhatsApp | — | Ticket management |
| **Notifications** | In-app, push | In-app, push | Send notifications |
| **Analytics** | — | — | Dashboard, charts |
| **Moderation** | — | — | AI review, risk scoring |

All of the above stays in scope. The improvement strategy is about **building them correctly in order**, not removing them.

---

## 6. Improvement Roadmap

### Phase 0 — Project Cleanup & Stabilization
**Goal:** The project is clean, runs, and every developer knows where everything is.

| Step | Task | Affected |
|------|------|----------|
| 0.1 | Create `.env.example` files (root, user-app, admin) | New files |
| 0.2 | Verify `.gitignore` excludes `.env` | `.gitignore` |
| 0.3 | Remove hardcoded Supabase fallback from `supabase.ts` | `user-app/lib/supabase.ts` |
| 0.4 | Fix `app.json` colors to match `brand.ts` | `user-app/app.json` |
| 0.5 | Update `AGENTS.md` brand tokens to match `brand.ts` | `AGENTS.md` |
| 0.6 | Resolve NativeWind: remove from build pipeline OR commit to usage | `babel.config.js`, `metro.config.js` |
| 0.7 | Fix duplicate splash — make `index.tsx` a pure redirect | `user-app/app/index.tsx` |
| 0.8 | Remove `i` package from root `package.json` | `package.json` |
| 0.9 | Write real `README.md` | `README.md` |
| 0.10 | Align driver-app reanimated/worklets versions with user-app | `driver-app/package.json` |

**Exit criteria:** All three apps start without errors. Colors are consistent. No hardcoded secrets in source.

---

### Phase 1 — Design System Alignment
**Goal:** Every screen uses the same visual language.

| Step | Task |
|------|------|
| 1.1 | Compress all illustrations to <200KB |
| 1.2 | Compress tab icons to <50KB |
| 1.3 | Copy brand logo assets from `jaheez icons/` into `user-app/assets/` |
| 1.4 | Add basic icons to `driver-app/assets/` (copy/adapt from user-app) |
| 1.5 | Replace emoji logo in splash with actual brand image |
| 1.6 | Audit every auth screen for brand consistency |
| 1.7 | Verify RTL layout on all screens |
| 1.8 | Verify animation presets (`animations.ts`) are used consistently |

**Exit criteria:** App looks visually consistent. No emoji branding. Assets are optimized. RTL works.

---

### Phase 2 — User App Polish & Real Data
**Goal:** User app screens are production-quality and connected to real Supabase data.

| Step | Task |
|------|------|
| 2.1 | Verify Supabase schema is deployed to live instance |
| 2.2 | Seed stores via `seed-stores.js` or admin panel |
| 2.3 | Connect home screen to real Supabase store queries |
| 2.4 | Connect store detail to real Supabase menu queries |
| 2.5 | Connect order creation to real Supabase `orders` table |
| 2.6 | Connect order history to real Supabase queries |
| 2.7 | Polish auth flow (login → register → OTP → home) |
| 2.8 | Polish home, search, category screens |
| 2.9 | Polish cart → checkout → confirmation flow |
| 2.10 | Polish profile, settings, support screens |
| 2.11 | Add forgot password screen or support link |
| 2.12 | Disable `fallbackApi.ts` in production paths (keep for dev mode only) |

**Exit criteria:** User app shows real data. Full ordering flow works E2E. No mock data in production paths.

---

### Phase 3 — Driver App Stabilization & Assets
**Goal:** Driver app runs reliably and has proper visual assets.

| Step | Task |
|------|------|
| 3.1 | Verify driver app starts without errors after Phase 0 dep fixes |
| 3.2 | Add tab bar icons and brand illustrations |
| 3.3 | Expand `driver-app/constants/brand.ts` to full token set |
| 3.4 | Polish auth flow (welcome → login → register → OTP → KYC pending) |
| 3.5 | Polish delivery queue / home screen |
| 3.6 | Polish active delivery screen |
| 3.7 | Polish earnings dashboard |
| 3.8 | Connect to real Supabase data (orders, driver profile) |

**Exit criteria:** Driver app runs, looks professional, auth works, can view available deliveries.

---

### Phase 4 — Admin / API Documentation & Verification
**Goal:** Admin panel is verified and the API is documented.

| Step | Task |
|------|------|
| 4.1 | Create admin account via `create-admin.js` |
| 4.2 | Start admin API (`node scripts/admin-api.js`) and verify it runs |
| 4.3 | Login to admin panel and verify dashboard |
| 4.4 | Test store CRUD, order management, user management |
| 4.5 | Document all admin API endpoints in `docs/ADMIN_API.md` |
| 4.6 | Verify admin panel works with seeded data |

**Exit criteria:** Admin panel works E2E. API endpoints are documented. An operator can manage the platform.

---

### Phase 5 — Wallet & Payments Completion
**Goal:** Wallet and payment features are functional.

| Step | Task |
|------|------|
| 5.1 | Implement wallet tab screen (replace 6-line stub) |
| 5.2 | Connect wallet to `wallets` and `wallet_transactions` tables |
| 5.3 | Implement wallet top-up flow |
| 5.4 | Set up Stripe payment intent server-side flow |
| 5.5 | Implement card payment in checkout (alongside cash) |
| 5.6 | Test payment flow E2E with Stripe test keys |
| 5.7 | Verify admin wallet management page works |

**Exit criteria:** Users can pay with cash, card, or wallet balance. Transactions are recorded.

---

### Phase 6 — Tracking & Dispatch Completion
**Goal:** Real-time order tracking and driver dispatch work.

| Step | Task |
|------|------|
| 6.1 | Configure Google Maps API key |
| 6.2 | Implement driver location broadcasting in driver app |
| 6.3 | Connect user tracking screen to real driver location via Supabase Realtime |
| 6.4 | Implement driver assignment logic (manual via admin or basic proximity matching) |
| 6.5 | Test order lifecycle: placed → assigned → picked up → delivered |
| 6.6 | Verify status updates flow from driver app → Supabase → user app in real-time |

**Exit criteria:** User sees real driver location on map. Order status updates in real-time.

---

### Phase 7 — Notifications & Support Completion
**Goal:** Push notifications and support system work end-to-end.

| Step | Task |
|------|------|
| 7.1 | Set up push notification server-side (Expo Push API) |
| 7.2 | Send order status notifications to users |
| 7.3 | Send new order notifications to drivers |
| 7.4 | Verify in-app notification list shows real notifications |
| 7.5 | Verify support ticket creation and admin response flow |
| 7.6 | Add WhatsApp deep link as support fallback |

**Exit criteria:** Users receive push notifications for order updates. Support tickets work E2E.

---

### Phase 8 — Testing, EAS & Deployment Readiness
**Goal:** Project is testable and buildable for production.

| Step | Task |
|------|------|
| 8.1 | Set up Jest/Vitest for unit tests |
| 8.2 | Write unit tests for critical paths (auth, cart, order creation) |
| 8.3 | Write component tests for key UI components |
| 8.4 | Create `eas.json` for user-app and driver-app |
| 8.5 | Run EAS build for Android (development) |
| 8.6 | Run EAS build for iOS (development) |
| 8.7 | Set up basic CI pipeline (lint + type-check + test) |

**Exit criteria:** Tests pass. EAS builds succeed. CI runs on push.

---

### Phase 9 — Final Polish & Production Preparation
**Goal:** Production-ready release.

| Step | Task |
|------|------|
| 9.1 | Create Supabase Edge Functions (AI moderation, driver matching, notifications) |
| 9.2 | Create proper app icons (adaptive icon for Android, icon for iOS) |
| 9.3 | Create splash screen image |
| 9.4 | Generate app store screenshots |
| 9.5 | Final accessibility audit |
| 9.6 | Performance profiling and optimization |
| 9.7 | Security audit (rotate all exposed keys, verify RLS) |
| 9.8 | Production EAS builds |
| 9.9 | Deploy admin API to hosting (Railway, Fly, etc.) |
| 9.10 | Deploy admin panel to hosting (Vercel, Netlify) |

**Exit criteria:** Apps are on app stores. Backend is deployed. Platform is live.

---

## 7. What Not to Do Yet

These are guardrails to prevent counterproductive work during stabilization.

| ❌ Do Not | Why |
|-----------|-----|
| Add random new features before stabilization | New features on a broken foundation compound problems |
| Refactor everything at once | Change one thing, verify, then change the next |
| Migrate all screens to NativeWind without a plan | If decided, migrate screen-by-screen with verification |
| Install random new packages | Current dependency set is large. Justify every addition. |
| Overwrite working screens without reading them first | Most screens are 10-30KB with real logic. Read before editing. |
| Rebuild any app from zero | The existing code represents months of work. Improve it. |
| Modify `supabase_schema.sql` directly | Use new migration files for schema changes |
| Refactor `admin-api.js` | 146KB monolith is working. Document it, don't rewrite it. |
| Delete driver app, wallet, or payment code | These are platform features, not mistakes |
| Deploy to production before Phase 8 | Must have tests and EAS builds first |

---

## 8. Decision Points

These decisions are **open** and must be resolved at the appropriate phase.

### Decision 1: Final Brand Color Source of Truth
- **Current state:** 4 conflicting colors. `brand.ts` uses `#F03030`, others use `#EF4444` or `#AB3500`.
- **When to decide:** Phase 0 (before any screen work)
- **Options:** (A) Keep `brand.ts` values as-is and update everything else. (B) Redesign the palette and update `brand.ts` + everything else.
- **Recommendation:** Option A — `brand.ts` is already used by all screens.

### Decision 2: NativeWind vs StyleSheet
- **Current state:** NativeWind configured but unused. All screens use `StyleSheet.create()`.
- **When to decide:** Phase 0
- **Options:** (A) Remove NativeWind from build pipeline, keep StyleSheet. (B) Commit to NativeWind, migrate screens incrementally.
- **Recommendation:** Option A for now. Option B can be revisited after V1 ships if migration is justified.

### Decision 3: Supabase Schema Deployment Status
- **Current state:** Schema SQL exists but unclear if it's been run against the live Supabase instance.
- **When to decide:** Phase 2 (before connecting real data)
- **Action:** Check Supabase dashboard. If tables don't exist, run the schema.

### Decision 4: Payment Provider Readiness
- **Current state:** Stripe test keys in `.env`. Client setup exists. No server-side charge flow.
- **When to decide:** Phase 5
- **Action:** Decide if Stripe is the right provider for Morocco/MAD currency. Verify Stripe supports MAD payouts.

### Decision 5: Maps / Tracking Provider Setup
- **Current state:** `react-native-maps` installed. No Google Maps API key configured.
- **When to decide:** Phase 6
- **Action:** Create Google Cloud project, enable Maps SDK, get API key, configure in `app.json`.

### Decision 6: Driver App Priority After User App Stabilization
- **Current state:** Driver app exists but is less developed.
- **When to decide:** After Phase 2
- **Options:** (A) Immediately start Phase 3. (B) Continue polishing user app features. (C) Start both in parallel.
- **Recommendation:** Phase 3 follows Phase 2 sequentially for one developer. Parallel if team grows.

### Decision 7: Production Build Strategy
- **Current state:** No `eas.json`. New Architecture enabled (`newArchEnabled: true`).
- **When to decide:** Phase 8
- **Action:** Decide if New Architecture stays enabled (may cause compatibility issues). Create EAS profiles for development, preview, and production.

### Decision 8: Admin API Future
- **Current state:** 146KB single-file Express API.
- **When to decide:** After Phase 9 (post-V1)
- **Options:** (A) Keep as-is. (B) Migrate to Supabase Edge Functions. (C) Split into microservices.
- **Recommendation:** Keep for V1. Evaluate after platform is live.

---

## 9. Acceptance Criteria

The project is **"improved and ready for next build phase"** when:

### Foundation ✅
- [ ] All three apps start without errors (`expo start` × 2, `npm run dev` × 1)
- [ ] `brand.ts`, `app.json`, and `AGENTS.md` have consistent color values
- [ ] NativeWind build conflict is resolved (either removed from pipeline or committed to)
- [ ] No hardcoded Supabase credentials in source code
- [ ] `.env.example` files exist with documented variables
- [ ] `.gitignore` excludes `.env` files
- [ ] Root `README.md` has project overview and setup instructions
- [ ] Driver-app dependency versions match user-app

### Assets ✅
- [ ] All illustration images are under 200KB
- [ ] All icon images are under 50KB
- [ ] No emoji used as production branding
- [ ] Driver app has basic tab bar icons

### User App ✅
- [ ] Auth flow works: welcome → register → OTP → home
- [ ] Login flow works: login → home
- [ ] Browse flow works: home → category → store → add to cart
- [ ] Order flow works: cart → checkout → confirmation
- [ ] All tabs render without crashes
- [ ] All flow screens are navigable
- [ ] Screens use `brand.ts` tokens consistently

### Code Quality ✅
- [ ] No TypeScript `any` types in modified files
- [ ] All screens handle loading and error states
- [ ] RTL layout renders correctly for Arabic
- [ ] No console errors in normal operation

### Documentation ✅
- [ ] Root README covers setup for all three apps
- [ ] `docs/` folder has current, non-contradictory documentation
- [ ] Decision Points from Section 8 are resolved or explicitly deferred

---

## 10. Next Immediate Task

**The single best next task is: Phase 0, Step 0.1–0.6 — Foundation Stabilization.**

Specifically, in one session:

1. **Fix `app.json`** — set `primaryColor` to `#F03030` and `backgroundColor` to `#FEFDF8` to match `brand.ts`.
2. **Update `AGENTS.md`** — replace the brand token values with the actual `brand.ts` values.
3. **Resolve NativeWind** — remove `nativewind/babel` from `babel.config.js` and `withNativeWind` from `metro.config.js` (or decide to keep and document why).
4. **Clean `supabase.ts`** — remove hardcoded fallback URL and key.
5. **Create `.env.example`** for root and user-app.
6. **Fix `index.tsx`** — make it a pure redirect, remove inline splash component.
7. **Verify app starts** — `cd user-app && npx expo start` must launch clean.

This single session resolves all critical foundation blockers and unlocks Phase 1 (design alignment) and Phase 2 (user app polish).

**After this task, every subsequent phase can build on a stable, consistent, and well-organized base.**
