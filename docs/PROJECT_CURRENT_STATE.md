# PROJECT CURRENT STATE

> Generated: 2026-05-19 | Source: Full workspace code inspection

---

## 1. Completed Work

### User App — Fully Implemented Screens
| Screen | File | Notes |
|--------|------|-------|
| Splash | `user-app/app/(auth)/splash.tsx` (4.8KB) | Image → video → app transition |
| Onboarding | `user-app/app/(auth)/onboarding.tsx` (8.4KB) | Multi-slide carousel |
| Welcome | `user-app/app/(auth)/welcome.tsx` (8.8KB) | Login/register entry point |
| Login | `user-app/app/(auth)/login.tsx` (21.6KB) | Phone+password, demo login, Zod validation |
| Register | `user-app/app/(auth)/register.tsx` (28.1KB) | Full form with city, Zod validation |
| OTP | `user-app/app/(auth)/otp.tsx` (10.9KB) | 4-6 digit code, resend, Infobip integration |
| Home | `user-app/app/(tabs)/index.tsx` (24.7KB) | Services grid, promo banner, near-you stores |
| Search | `user-app/app/(tabs)/search.tsx` (29.3KB) | Multi-tab (stores, products, dishes), trending |
| Orders | `user-app/app/(tabs)/orders.tsx` (28.4KB) | Filter tabs, active order card, history |
| Chat List | `user-app/app/(tabs)/chat.tsx` (16.8KB) | Conversation list per order |
| Profile | `user-app/app/(tabs)/profile.tsx` (13.4KB) | Avatar, stats, menu links |
| Category | `user-app/app/(flows)/category/[id].tsx` (17.3KB) | Store listing by service type |
| Store Details | `user-app/app/(flows)/store/[id].tsx` (29.8KB) | Menu, reviews, add-to-cart |
| Cart | `user-app/app/(flows)/cart.tsx` (21.2KB) | Item list, quantities, promo |
| Checkout | `user-app/app/(flows)/checkout.tsx` (30KB) | Address, payment, notes, time slot |
| Confirmation | `user-app/app/(flows)/confirmation.tsx` (8.8KB) | Order placed success |
| Custom Request | `user-app/app/(flows)/custom-request.tsx` (26.5KB) | Errand form with category, pickup, dropoff |
| Order Details | `user-app/app/(flows)/order/[id].tsx` (30.2KB) | Full order breakdown |
| Tracking | `user-app/app/(flows)/tracking/[id].tsx` (21.1KB) | Map + status timeline |
| Chat Thread | `user-app/app/(flows)/chat/[id].tsx` (10.6KB) | Real-time messages |
| Addresses | `user-app/app/(flows)/addresses.tsx` (20.9KB) | CRUD saved addresses |
| Profile Edit | `user-app/app/(flows)/profile-edit.tsx` (14.5KB) | Edit name, avatar, city |
| Settings | `user-app/app/(flows)/settings.tsx` (23.3KB) | Notifications, privacy, language, help |
| Favorites | `user-app/app/(flows)/favorites.tsx` (12.6KB) | Saved stores |
| Notifications | `user-app/app/(flows)/notifications.tsx` (9.7KB) | Notification inbox |
| Payment Methods | `user-app/app/(flows)/payment-methods.tsx` (21.2KB) | Stripe card management |
| Payment Success | `user-app/app/(flows)/payment-success.tsx` (4KB) | Stripe success callback |
| FAQ | `user-app/app/(flows)/faq.tsx` (13.5KB) | Expandable questions |
| Terms | `user-app/app/(flows)/terms.tsx` (9.3KB) | Terms & conditions |
| Support Ticket | `user-app/app/(flows)/support-ticket.tsx` (15.6KB) | Category, subject, message |
| Delete Account | `user-app/app/(flows)/delete-account.tsx` (17KB) | Confirmation + soft delete |

### User App — Fully Implemented Components (26 files)
`AnimatedPressable`, `AnimatedTransition`, `Avatar`, `Badge`, `BottomSheet`, `Button`, `Card`, `EmptyState`, `FadeInView`, `ForceUpdateModal`, `Input`, `Loader`, `MaintenanceBanner`, `MapMarker`, `OTPInput`, `OfflineBanner`, `OrderCard`, `ProgressTimeline`, `PulseIndicator`, `ScreenWrapper`, `ShimmerPlaceholder`, `SkeletonBox`, `StatusBadge`, `TText`, `TopNav`, barrel `index.ts`

### User App — Fully Implemented Stores (6)
`authStore.ts`, `cartStore.ts`, `languageStore.ts`, `locationStore.ts`, `orderStore.ts`, `platformStore.ts`

### User App — Fully Implemented Hooks (16)
- Core: `useAuth.ts`, `useLocation.ts`, `useNetworkStatus.ts`, `usePushNotifications.ts`, `useTracking.ts`, `useAnimations.ts`, `useTranslatedText.ts`
- Queries: `useStores.ts`, `useOrders.ts`, `useNotifications.ts`, `usePromotion.ts`, `useSupportTickets.ts`, `useWallet.ts`
- Mutations: `useAuth.ts`, `useOrderMutations.ts`, `useSupportMutations.ts`

### User App — Fully Implemented Lib (17 files)
`api.ts`, `authApi.ts`, `fallbackApi.ts`, `mockData.ts`, `supabase.ts`, `storeApi.ts`, `orderApi.ts`, `walletApi.ts`, `supportApi.ts`, `notificationInbox.ts`, `placesApi.ts`, `maps.ts`, `schemas.ts`, `stripeClient.ts`, `infobipOtp.ts`, `modernmt.ts`, `adminApi.ts`

### Admin Panel — Fully Implemented
- 23 page components covering all CRUD operations
- Layout with collapsible sidebar, role-based nav
- Comprehensive admin API (3194 lines) with JWT auth, RBAC, audit logging
- Role system: `super_admin`, `operations`, `finance`, `support`, `content_manager`

### Driver App — Basic Implementation
- Auth flow (welcome, login, register, OTP, pending)
- Main tabs (home dashboard, earnings, profile)
- Flows (active delivery with 5-stage progress, payout request)

### Database Schema — Complete
- 889-line SQL with 12+ migrations
- Tables: users, stores, menu_categories, menu_items, user_addresses, drivers, orders, order_items, store_reviews, notifications, favorites, wallets, wallet_transactions, support_requests, chat_messages, admins, driver_documents, payout_requests, cod_settlements
- RLS policies for all tables
- Triggers for updated_at, new user → profile, new user → wallet
- Functions: admin_wallet_adjust, purge_deleted_users, is_admin
- Realtime enabled on: orders, drivers, notifications, wallet_transactions, payout_requests, driver_documents, chat_messages

---

## 2. Partial Work

| Item | What Exists | What's Missing |
|------|-------------|----------------|
| **Wallet tab** | File exists (`wallet.tsx`, 129 bytes) | Only a stub — no actual wallet UI |
| **Fallback data** | `fallbackApi.ts` fetches OSM + TheMealDB | Not real store/product data in Supabase |
| **Mock data** | `mockData.ts` (17.7KB) with sample stores/orders | Used when Supabase is empty — masks missing real data |
| **Driver app** | Auth + basic tabs + active delivery flow | Missing: chat, order history, detailed earnings, KYC document upload, notifications |
| **Payment (Stripe)** | Client SDK initialized, payment-methods screen exists | Only test keys, no server-side payment intent creation found |
| **SMS OTP (Infobip)** | `infobipOtp.ts` exists with send/verify functions | Unclear if fully tested; API key is in `.env` |
| **i18n duplication** | Two systems: `strings.ts` (nested) + `languageStore.ts` (flat) | Potential conflicts; unclear which screens use which |
| **Local PostgreSQL** | Admin API connects to local PG for admin-only tables | `DATABASE_URL` points to `heliumdb` which is unreachable (past bug) |
| **Push notifications** | `usePushNotifications.ts` hook exists | Expo push token registered but end-to-end flow unclear |
| **AI moderation** | Mentioned in docs/AGENTS.md, types exist for `OrderModeration` | No Supabase Edge Functions, no Gemini integration code found |
| **Maps/tracking** | `react-native-maps` installed, tracking screen has map | Google Maps API key not found in env, may use fallback |
| **Driver matching** | Constants for radius/timeout exist | No matching algorithm implemented |

---

## 3. Missing Work

| Category | Items Missing |
|----------|--------------|
| **Screens** | Forgot password, store reviews page, reorder flow, wallet full UI, referral program, promotional deep-links |
| **Backend** | Supabase Edge Functions (AI moderation, driver matching, notifications), production environment variables |
| **Testing** | Zero test files found anywhere in the project |
| **CI/CD** | No GitHub Actions, no EAS build config (`eas.json`), no deployment pipeline |
| **Security** | API keys hardcoded in `.env` (not .env.example), service role key in plain text, no rate limiting on user-facing API |
| **Assets** | No app icon (only splash), no adaptive icon for Android, tab icons are large PNGs (300-400KB each) |
| **Performance** | No image optimization pipeline, illustration PNGs are 1-1.7MB each, no lazy loading strategy |
| **Monitoring** | No error tracking (Sentry/Bugsnag), no analytics (Mixpanel/Amplitude), no crash reporting |
| **Documentation** | Existing 35 docs may be outdated — many reference old architecture patterns |

---

## 4. Broken / Risky Items

| Risk | Severity | Details |
|------|----------|---------|
| **`.env` with real keys committed** | 🔴 Critical | Supabase service role key, Stripe test keys, Infobip API key, JWT secret all in `.env` at root and `user-app/.env` |
| **Local PostgreSQL unreachable** | 🟡 Medium | `DATABASE_URL=postgresql://postgres:password@localhost/heliumdb` — hostname `heliumdb` was confirmed broken in past conversations |
| **Schema conflicts** | 🟡 Medium | `shared/types.ts` defines `OrderStatus` with values (`pending_moderation`, `pending_driver`, etc.) that differ from schema's `orders.status` CHECK (`pending`, `confirmed`, `preparing`, etc.) |
| **Dual localization** | 🟡 Medium | `strings.ts` and `languageStore.ts` both define UI strings — screens may reference different systems |
| **NativeWind installed but unused** | 🟢 Low | Adds build complexity; `tailwind.config.js`, `nativewind-env.d.ts`, `global.css` exist but StyleSheet.create is used everywhere |
| **Oversized assets** | 🟡 Medium | `bag_hero.png` (1.7MB), `scooter.png` (1.3MB), `scooter2.png` (1.7MB), `support.png` (1.6MB) — will cause slow app start |
| **Tab icons as PNGs** | 🟡 Medium | `cart.png` (304KB), `chat.png` (383KB), etc. — should be SVG or vector icons |
| **Video asset format** | 🟢 Low | `splash_video.webm` in assets — `.webm` may not play on iOS (past conversation confirms format migration was attempted) |
| **Mock admin login** | 🟡 Medium | `admin@jaheez.ma` / `admin123` hardcoded as fallback in admin-api.js — must be removed for production |
| **Root `server.js`** | 🟢 Low | 1.3KB file at root — purpose unclear, may be legacy |

---

## 5. What Appears Production-Ready

| Component | Ready? | Notes |
|-----------|--------|-------|
| Brand token system | ✅ Yes | Well-structured `brand.ts` with comprehensive tokens |
| Shared types | ✅ Yes | 462-line type file with all interfaces |
| Database schema | ✅ Yes | Comprehensive with RLS, triggers, functions |
| UI component library | ✅ Yes | 26 reusable components with consistent patterns |
| Cart state management | ✅ Yes | Full Zustand store with computed totals |
| Auth flow (structure) | ✅ Yes | Login → OTP → tabs navigation works |
| Admin API (structure) | ✅ Yes | RBAC, audit logging, lockout protection |
| Form validation | ✅ Yes | Zod schemas for all major forms |

---

## 6. What is Only Mock/Fallback/Prototype

| Item | Location | Reality |
|------|----------|---------|
| Store data on home/search | `fallbackApi.ts` | Falls back to OpenStreetMap + TheMealDB when Supabase empty |
| Sample stores | `mockData.ts` | 8 static Arabic-named stores with Unsplash images |
| Menu items | `fallbackApi.ts` | TheMealDB API meals with generated Arabic descriptions |
| Admin mock login | `admin-api.js:362` | `admin@jaheez.ma` / `admin123` hardcoded |
| Demo login in user app | `login.tsx` | Creates anonymous session to bypass auth |
| Order tracking map | `tracking/[id].tsx` | Map exists but no real driver location streaming |

---

## 7. What Needs Verification

1. **Supabase connection**: Does the remote Supabase project have tables created matching `supabase_schema.sql`?
2. **Infobip SMS**: Does the API key work? Is the account funded?
3. **Stripe**: Are test payments going through?
4. **Expo build**: Does `expo prebuild` succeed? Are native modules compatible?
5. **Android build**: The `user-app/android/` directory exists — was it generated from a prebuild? Is it current?
6. **Font loading**: Cairo fonts are loaded via `@expo-google-fonts/cairo` — does this work offline?

---

## 8. What Should Not Be Touched Yet

| Do Not Touch | Reason |
|--------------|--------|
| `supabase_schema.sql` | Central schema — modifications need migration planning |
| `scripts/admin-api.js` | 3194-line working API — extremely risky to refactor without full test coverage |
| `shared/types.ts` | Used by all three apps — changes cascade everywhere |
| `shared/constants.ts` | Order status machine — changes affect state logic across apps |
| `user-app/store/` | State stores are working — wrong change = broken app |
| `.env` files | Contains live credentials — must be handled carefully |
| `admin/src/pages/` | 23 working pages — avoid breaking existing admin functionality |
