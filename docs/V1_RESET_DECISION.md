# V1 RESET DECISION — JAHEEZ

> **Date:** 2026-05-05  
> **Status:** APPROVED — This is the binding product and implementation decision for JAHEEZ V1.  
> **Scope:** User App only. Everything else is deferred.

---

## 1. Executive Summary

The full workspace audit revealed a project with substantial code across three apps (user, driver, admin) but critical foundation problems: conflicting color systems, unused styling frameworks adding build complexity, exposed secrets, mock data everywhere, and no verified runtime. Attempting to push forward on features without fixing these foundations will compound every problem.

**The new direction is:**

- **Focus exclusively on the User App.** Driver app and admin panel are frozen — they exist, they stay, but they receive zero development effort until User App V1 ships.
- **Do not rebuild from zero.** The existing user-app has ~35 screens, 26 UI components, a working auth system, a cart store, a language system, and a comprehensive type system. This is preserved and improved, not thrown away.
- **Stabilize before expanding.** The color conflict, NativeWind confusion, hardcoded secrets, duplicate splash logic, and mock data reliance are fixed before any new screen work begins.
- **Strip V1 to the essentials.** No AI moderation, no wallet, no Stripe payments, no live GPS tracking, no driver dispatch engine. V1 is a user who browses stores, adds to cart, checks out with cash on delivery, and tracks order status. WhatsApp and manual admin operations fill every gap.
- **Design quality is non-negotiable.** The app must look and feel premium — smooth animations, proper brand assets, no emoji placeholders in production. But this is achieved through polish of existing screens, not by adding new ones.

The goal is a shippable V1 User App that a real user in Safi, Morocco can download, browse restaurants, order food, pay cash on delivery, and see their order status. Everything else waits.

---

## 2. What We Keep

### Monorepo Structure
The `user-app/`, `driver-app/`, `admin/`, `shared/`, `scripts/` separation is correct and stays. No restructuring.

### User App Screens (Preserve and Improve)
All existing screens in `user-app/app/` are kept. They have substantial code (10-29KB each) and represent real work:

| Group | Screens Kept |
|-------|-------------|
| **Auth** | `splash.tsx`, `welcome.tsx`, `onboarding.tsx`, `login.tsx`, `register.tsx`, `otp.tsx` |
| **Tabs** | `index.tsx` (home), `search.tsx`, `orders.tsx`, `profile.tsx` |
| **Flows** | `store/[id].tsx`, `category/[id].tsx`, `cart.tsx`, `checkout.tsx`, `confirmation.tsx`, `order/[id].tsx`, `custom-request.tsx`, `notifications.tsx`, `favorites.tsx`, `addresses.tsx`, `settings.tsx`, `profile-edit.tsx`, `support-ticket.tsx`, `faq.tsx`, `terms.tsx`, `delete-account.tsx` |

These screens will be improved and connected to real data, not rewritten.

### Shared Types & Constants
- `shared/types.ts` (462 lines) — comprehensive, well-typed, stays as-is.
- `shared/constants.ts` (60 lines) — order statuses, zones, thresholds, stays as-is.

### Brand Token System (After Correction)
- `user-app/constants/brand.ts` is the single source of truth for all colors, spacing, shadows, fonts.
- After the color conflict is resolved, every screen, config file, and doc must reference these values.

### Reusable UI Components
All 26 components in `user-app/components/ui/` are kept:
- Layout: `ScreenWrapper`, `TopNav`, `Card`, `BottomSheet`
- Input: `Button`, `Input`, `OTPInput`
- Feedback: `Loader`, `EmptyState`, `Badge`, `StatusBadge`, `SkeletonBox`, `ShimmerPlaceholder`
- Animation: `AnimatedPressable`, `AnimatedTransition`, `FadeInView`, `PulseIndicator`
- Domain: `OrderCard`, `ProgressTimeline`, `MapMarker`, `Avatar`
- Platform: `OfflineBanner`, `MaintenanceBanner`, `ForceUpdateModal`, `TText`

### State Management Foundation
- `store/authStore.ts` — working Zustand auth with AsyncStorage persistence.
- `store/cartStore.ts` — full cart logic with multi-store protection, totals, promo support.
- `store/languageStore.ts` — trilingual (AR/FR/EN) with ModernMT dynamic translation.
- `store/locationStore.ts` — minimal but correctly structured.
- `store/orderStore.ts` — minimal but correctly structured.
- `store/platformStore.ts` — maintenance mode, force update checks.

### API Layer Foundation
- `lib/authApi.ts` — phone+password auth with email fallback, OTP, error translation.
- `lib/supabase.ts` — Supabase client (after removing hardcoded values).
- `lib/storeApi.ts`, `lib/orderApi.ts` — basic CRUD (after switching from mock to real data).
- `lib/mockData.ts` — kept as development fallback, not as production path.
- `lib/schemas.ts` — Zod validation schemas.
- `lib/infobipOtp.ts` — Infobip SMS OTP integration.

### Hooks
- `hooks/useAuth.ts`, `hooks/useLocation.ts`, `hooks/useNetworkStatus.ts`
- `hooks/useAnimations.ts`, `hooks/useTranslatedText.ts`
- `hooks/queries/*` and `hooks/mutations/*` — React Query hooks.

### Admin Panel (Frozen, Not Deleted)
The admin panel (`admin/`) has 22 coded pages and a working auth system. It stays in the repo untouched. It will be the operations tool when V1 launches, but it receives no development effort now.

### Database Schema (Reference Only)
`supabase_schema.sql` is kept as the future backend reference. It defines 11+ tables with RLS policies, triggers, and migrations. No schema changes are made during V1 frontend work.

---

## 3. What We Stop for V1

Every item below is **explicitly stopped**. No code, no planning, no research until V1 User App ships.

| Stopped Item | Reason |
|-------------|--------|
| **AI content moderation** | Core complexity, requires Edge Functions + Gemini API. WhatsApp manual review covers V1. |
| **Gemini API / AI edge functions** | No `supabase/functions/` directory exists. Not needed for V1 ordering. |
| **Driver app development** | `driver-app/` is frozen. Drivers are onboarded manually via WhatsApp for V1. |
| **Wallet tab** | Currently a 6-line redirect. Wallet is a V2 feature. Cash is enough. |
| **Stripe / online card payments** | Test keys exist but no server-side charge flow. Cash on delivery is V1 payment. |
| **Advanced live GPS tracking** | `react-native-maps` is installed but no real driver location broadcasting. V1 shows order status text, not a live map. |
| **Driver earnings / payout system** | Exists in schema and admin panel. Not a V1 user-app concern. |
| **Full dispatch engine** | No driver matching algorithm exists. V1: admin manually assigns drivers or uses WhatsApp. |
| **NativeWind migration** | NativeWind is configured but zero screens use it. Migrating 35 screens for no functional gain is waste. Decision: keep `StyleSheet.create()`. |
| **Push notification server-side** | Client setup exists. Server-side send is deferred. V1 uses in-app status polling. |
| **Supabase Edge Functions** | No functions directory exists. Not needed for V1 frontend. |
| **CI/CD pipeline** | Deferred until V1 is manually tested and ready for beta. |
| **EAS production builds** | Deferred until V1 is feature-complete. |
| **Testing infrastructure** | Zero tests exist. Writing tests against mock data is waste. Tests start after real data is connected. |

---

## 4. What Must Be Fixed First

These are **blockers**. No screen work begins until they are resolved. Estimated effort: 1 session.

### 4.1 Color System Conflict (CRITICAL)

**Problem:** Four different "primary" colors exist:
- `brand.ts` → `#F03030`
- `AGENTS.md` → `#EF4444`
- `app.json` → `#AB3500`
- `tailwind.config.js` → `#AB3500`

**Fix:**
- `brand.ts` values are the truth. `#F03030` is the brand red. `#F5CE2E` is the brand yellow.
- Update `app.json` → `primaryColor: "#F03030"`, `backgroundColor: "#FEFDF8"`
- Update `AGENTS.md` → replace all color values with the actual `brand.ts` values.
- Update `tailwind.config.js` colors to match `brand.ts` (or delete entire Tailwind color override if NativeWind is removed).

### 4.2 NativeWind vs StyleSheet Decision (CRITICAL)

**Problem:** NativeWind is fully configured (babel plugin, metro wrapper, tailwind config, global.css) but zero screens use `className`. It adds build complexity for nothing.

**Decision: Remove NativeWind from the build pipeline.**
- Remove `"nativewind/babel"` from `babel.config.js` plugins.
- Remove `withNativeWind` wrapper from `metro.config.js`.
- Keep `nativewind` and `tailwindcss` in `package.json` for now (removing them can cause lockfile churn) but they become inert.
- Delete or empty `global.css`.
- `tailwind.config.js` becomes irrelevant.

All screens continue using `StyleSheet.create()` + `brand.ts` tokens. This is the established pattern.

### 4.3 Secrets / Environment Cleanup (CRITICAL)

**Fix:**
- Create `user-app/.env.example` and root `.env.example` with placeholder values.
- Verify `.gitignore` excludes all `.env` files.
- Remove hardcoded Supabase URL and anon key from `user-app/lib/supabase.ts`. If env vars are missing, show a clear error instead of silently connecting to a hardcoded instance.
- Plan to rotate all keys after Git history is cleaned (Supabase service role, Infobip, Stripe, ModernMT).

### 4.4 Duplicate Splash Logic

**Problem:** Both `app/index.tsx` and `app/(auth)/splash.tsx` render splash-like screens with overlapping animation logic.

**Fix:** `app/index.tsx` should be a clean redirect (check auth state → navigate). The branded splash animation belongs in `app/(auth)/splash.tsx` only. Remove the inline SplashScreen component from `index.tsx`.

### 4.5 app.json Correction

**Fix:**
- `backgroundColor` → `"#FEFDF8"` (matches `BRAND.BG`)
- `primaryColor` → `"#F03030"` (matches `BRAND.RED`)
- Verify all plugin configs are correct for SDK 55.

### 4.6 README and Setup Docs

**Fix:** Write a real `README.md` at root with:
- What the project is (1 paragraph)
- How to set up the environment
- How to run user-app
- How to run admin panel
- Required environment variables
- Link to `docs/` for detailed documentation

### 4.7 Oversized Assets

**Fix:**
- Compress `user-app/assets/illustrations/bag_hero.png` (1.7MB), `scooter.png` (1.3MB), `scooter2.png` (1.7MB), `support.png` (1.5MB) to under 200KB each.
- Compress tab bar icon PNGs (304-391KB) to under 50KB each.
- Consider converting to WebP for further savings.

### 4.8 Mock Data Reliance

**Problem:** Most screens call `fallbackApi.ts` which returns mock data when Supabase queries fail. This masks real bugs.

**Fix (deferred to after UI stabilization):** In Phase 2, switch screens to fail visibly when Supabase is unreachable instead of silently showing fake data. Keep `mockData.ts` for explicit dev mode only.

---

## 5. Correct V1 Product Scope

### V1 User App — Feature Set

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Auth: Splash** | Branded animated splash | Existing `(auth)/splash.tsx` — polish |
| **Auth: Welcome** | Welcome screen with CTA | Existing `(auth)/welcome.tsx` — polish |
| **Auth: Onboarding** | 2-3 slide intro | Existing `(auth)/onboarding.tsx` — polish |
| **Auth: Login** | Phone + password | Existing `(auth)/login.tsx` — simplify, remove email fallback UI clutter |
| **Auth: Register** | Name, phone, password, city | Existing `(auth)/register.tsx` — simplify |
| **Auth: OTP** | SMS verification | Existing `(auth)/otp.tsx` — verify Infobip integration |
| **Home** | Categories, stores near you, promo banner | Existing `(tabs)/index.tsx` — connect to real data |
| **Search** | Search stores/products by name | Existing `(tabs)/search.tsx` — connect to real data |
| **Services** | Food, Grocery, Pharmacy, Parcel, Errand categories | Existing category system in home screen |
| **Store Listing** | Stores by category | Existing `(flows)/category/[id].tsx` |
| **Store Detail** | Menu, items, add to cart | Existing `(flows)/store/[id].tsx` |
| **Cart** | Items, quantities, totals | Existing `(flows)/cart.tsx` |
| **Checkout** | Address, notes, cash on delivery | Existing `(flows)/checkout.tsx` — strip card/Stripe UI, keep cash only |
| **Custom Errand** | Describe what you need, set addresses | Existing `(flows)/custom-request.tsx` |
| **Order Confirmation** | Success screen with reference code | Existing `(flows)/confirmation.tsx` |
| **Order History** | List of past/active orders | Existing `(tabs)/orders.tsx` |
| **Order Detail** | Order info, items, status | Existing `(flows)/order/[id].tsx` |
| **Order Status** | Text-based status (Pending → Confirmed → Preparing → Picked Up → Delivered) | Existing status system, no live map needed |
| **Profile** | Name, phone, avatar, menu | Existing `(tabs)/profile.tsx` |
| **Profile Edit** | Edit name, avatar | Existing `(flows)/profile-edit.tsx` |
| **Settings** | Language, notifications, terms | Existing `(flows)/settings.tsx` |
| **Support** | Contact via WhatsApp + in-app ticket | Existing `(flows)/support-ticket.tsx` + WhatsApp link |
| **FAQ** | Frequently asked questions | Existing `(flows)/faq.tsx` |
| **Terms** | Terms and conditions | Existing `(flows)/terms.tsx` |
| **Favorites** | Save favorite stores | Existing `(flows)/favorites.tsx` |
| **Addresses** | Saved delivery addresses | Existing `(flows)/addresses.tsx` |
| **Notifications** | In-app notification list | Existing `(flows)/notifications.tsx` |

### V1 User App — What Is NOT Included

| Not in V1 | Replacement |
|-----------|-------------|
| Online card payment | Cash on delivery only |
| Wallet/balance | Not needed with cash on delivery |
| Live GPS driver tracking | Text-based order status updates |
| AI moderation | Admin manually reviews via WhatsApp/admin panel |
| In-app chat with driver | WhatsApp link to driver (if needed) |
| Driver matching algorithm | Admin manually assigns via admin panel |
| Push notifications | In-app notification list + future SMS |
| Forgot password screen | "Contact support via WhatsApp" link |

---

## 6. Correct Technical Direction

### Framework
- **Keep** the existing Expo SDK 55 + React Native 0.83.6 + Expo Router setup.
- **Keep** React 19.2 (already installed, working).
- No framework changes. No version upgrades.

### Styling
- **Use `StyleSheet.create()` + `brand.ts` tokens.** This is the established pattern in all 35 screens.
- **Remove NativeWind from the build pipeline** (babel plugin + metro wrapper). The packages can stay in `package.json` but must not affect the build.
- `tailwind.config.js` becomes a dead file. Do not delete it (avoid unnecessary churn) but do not reference it.
- All colors come from `brand.ts`. No exceptions.

### State Management
- **Keep React Query** (`@tanstack/react-query`) for all server data fetching (stores, orders, notifications).
- **Keep Zustand** for client state (auth, cart, language, location).
- No new state libraries.

### Backend
- **Keep Supabase** as the backend. The schema is comprehensive and correct.
- Do NOT modify the database schema during frontend stabilization.
- Connect to real Supabase data only after UI/config stabilization is complete (Phase 2).
- Keep `mockData.ts` as a development tool, not a production fallback.

### Dependencies
- **Do not install new packages.** The existing dependency set is large enough.
- **Do not remove packages** unless they cause build errors (avoid lockfile churn).
- Exception: if NativeWind removal from build pipeline requires uninstalling, do it cleanly.

### Admin API
- `scripts/admin-api.js` stays as-is. It will be needed when connecting to real data.
- No modifications to the admin API during V1 frontend work.

---

## 7. Correct Design Direction

### Source of Truth
- The **latest design images** in `design/` and `user-app/assets/illustrations/` define the visual direction.
- `brand.ts` defines the exact color values, spacing, and typography.
- The HTML mockups in `html-preview/` are an older prototype and are NOT the current design direction. They are informational only.

### Quality Standard
The app must feel premium. This means:

| Requirement | How |
|-------------|-----|
| **No ugly placeholders** | Every screen must have proper backgrounds, illustrations, or patterns. No grey boxes. |
| **No emoji as final icons** | The splash screen currently uses 🛵 as a logo. This must be replaced with the actual brand icon (`assets/icons/middle.png` or a proper logo image). |
| **Smooth animations** | Use `react-native-reanimated` and the animation presets in `constants/animations.ts`. Every navigation transition, button press, and state change should feel responsive. |
| **Consistent typography** | Cairo font family throughout. Display (Bold), Body (Regular), SemiBold for emphasis. |
| **Consistent spacing** | 8px grid. Every padding and margin is a multiple of 8 (via `SPACE` constants). |
| **Proper illustrations** | Use the existing 3D-style illustrations from `assets/illustrations/`. Do not use stock photos or Unsplash URLs in production. |
| **Optimized assets** | All images under 200KB. Tab icons under 50KB. No 1.7MB PNGs loading on app start. |

### Asset Organization
- All app assets live in `user-app/assets/`.
- `user-app/assets/icons/` — tab bar and navigation icons.
- `user-app/assets/illustrations/` — hero images, category icons, empty states.
- The `jaheez icons/` folder at root should be reviewed. Useful assets are copied into `user-app/assets/`. The rest is archived or deleted.
- The `design/` folder stays as reference material.

---

## 8. Implementation Order After Reset

This is the strict order. Each phase must be verified before the next begins.

### Phase 0: Stabilize Config (No Screen Changes)

| Step | Action | Files Affected |
|------|--------|---------------|
| 0.1 | Fix `app.json` colors to match `brand.ts` | `user-app/app.json` |
| 0.2 | Update `AGENTS.md` brand token values to match `brand.ts` | `AGENTS.md` |
| 0.3 | Remove NativeWind from build pipeline | `user-app/babel.config.js`, `user-app/metro.config.js` |
| 0.4 | Remove hardcoded Supabase fallback from `supabase.ts` | `user-app/lib/supabase.ts` |
| 0.5 | Create `.env.example` files | Root, `user-app/`, `admin/` |
| 0.6 | Verify `.gitignore` excludes `.env` | Root `.gitignore` |
| 0.7 | Write real `README.md` | Root `README.md` |

**Verification:** `cd user-app && npx expo start` launches without errors. No color references are wrong.

### Phase 1: Verify Runtime

| Step | Action |
|------|--------|
| 1.1 | Run `cd user-app && npm start` — fix any Metro/bundler errors |
| 1.2 | Load app on Expo Go or dev build — verify splash → welcome renders |
| 1.3 | Tap through auth flow — verify login/register/OTP screens render |
| 1.4 | Navigate to home tab — verify it renders (with mock data is OK for now) |
| 1.5 | Navigate to all tabs — verify no crashes |
| 1.6 | Navigate to store detail — verify menu renders |
| 1.7 | Add item to cart — verify cart screen works |

**Verification:** App runs end-to-end on a device/emulator without crashes. Every tab and major flow renders.

### Phase 2: Align Design System

| Step | Action |
|------|--------|
| 2.1 | Fix splash screen: remove emoji logo from `index.tsx`, use brand icon image |
| 2.2 | Clean up `app/index.tsx` — make it a pure redirect, no inline splash |
| 2.3 | Compress oversized illustrations (bag_hero, scooter, support → <200KB) |
| 2.4 | Compress tab bar icons (→ <50KB each) |
| 2.5 | Review every auth screen for visual consistency with `brand.ts` |
| 2.6 | Ensure all screens use `ScreenWrapper` or equivalent safe area handling |
| 2.7 | Verify RTL layout works correctly on all screens |

**Verification:** App looks visually consistent. No mismatched colors. No oversized images slowing load time. RTL renders correctly in Arabic.

### Phase 3: Improve Auth Flow

| Step | Action |
|------|--------|
| 3.1 | Simplify login screen — clean up code, ensure phone+password works |
| 3.2 | Simplify register screen — clean up, verify field validation |
| 3.3 | Verify OTP flow with Infobip (or provide clear dev bypass) |
| 3.4 | Ensure welcome → onboarding → login → register → OTP → home flow is seamless |
| 3.5 | Add "Contact support" link as forgot password replacement |

**Verification:** A new user can register, verify OTP, and land on the home screen. An existing user can log in.

### Phase 4: Improve Home & Services

| Step | Action |
|------|--------|
| 4.1 | Review home screen layout and polish |
| 4.2 | Ensure category grid (food, grocery, pharmacy, parcel, errand) works and navigates to category listing |
| 4.3 | Polish store cards in listings |
| 4.4 | Ensure search screen works (can search by name) |
| 4.5 | Verify store detail → menu → add to cart flow |

**Verification:** User can browse categories, view stores, view menus, and add items to cart from the home screen.

### Phase 5: Improve Order & Cart Flow

| Step | Action |
|------|--------|
| 5.1 | Review cart screen — clean up, ensure quantity changes work |
| 5.2 | Simplify checkout — strip Stripe/card UI, keep cash on delivery only |
| 5.3 | Verify order confirmation screen shows order reference |
| 5.4 | Review order detail screen |
| 5.5 | Review order history/list screen with filters |
| 5.6 | Review custom errand request screen |

**Verification:** User can complete a full order flow: browse → cart → checkout (cash) → confirmation. Order appears in history.

### Phase 6: Improve Profile & Support

| Step | Action |
|------|--------|
| 6.1 | Review profile screen — ensure menu items navigate correctly |
| 6.2 | Review settings screen — verify toggles persist |
| 6.3 | Add WhatsApp support link (direct `https://wa.me/+212XXXXXXXXX` link) |
| 6.4 | Review support ticket screen |
| 6.5 | Review FAQ and terms screens |
| 6.6 | Review favorites, addresses, notifications screens |

**Verification:** All profile sub-screens are accessible and functional. WhatsApp support link opens correctly.

### Phase 7: Connect Real Supabase Data

| Step | Action |
|------|--------|
| 7.1 | Verify Supabase schema is deployed |
| 7.2 | Seed real stores via `scripts/seed-stores.js` or admin panel |
| 7.3 | Switch home screen from mock data to real Supabase queries |
| 7.4 | Switch store detail from mock data to real Supabase queries |
| 7.5 | Switch order creation to write to real Supabase `orders` table |
| 7.6 | Switch order history to read from real Supabase `orders` table |
| 7.7 | Remove or disable `fallbackApi.ts` mock data path |

**Verification:** App shows real stores from Supabase. Orders are created in the real database. No mock data in production paths.

---

## 9. Do Not Do Yet

The following must NOT be started until all 7 phases above are complete and verified:

| Item | Why Not Now |
|------|------------|
| Driver app work | No driver features in V1 user app. Drivers are managed manually. |
| Admin panel improvements | Admin panel works well enough for manual operations. |
| Wallet feature | Not needed with cash on delivery. V2 feature. |
| Stripe integration | Not needed with cash on delivery. V2 feature. |
| AI moderation | Complex backend work. Manual review via admin panel/WhatsApp is V1 solution. |
| Supabase Edge Functions | No functions needed for V1 user flows. |
| Push notifications (server) | V2 feature. V1 users check order status in-app. |
| Live GPS map tracking | V2 feature. V1 shows text-based order status. |
| Testing infrastructure | Write tests after real data is connected, not against mock data. |
| CI/CD pipeline | Set up after V1 is manually verified and ready for beta. |
| EAS production builds | After V1 feature-complete. |
| New package installations | Current dependency set is sufficient for V1. |
| In-app chat with driver | WhatsApp link is the V1 solution. |
| Review/rating system | V2 feature. |
| Promo code redemption backend | Can be seeded manually in DB for V1. |
| Database schema changes | Schema is comprehensive. No changes until V1 ships. |
| Refactoring admin-api.js | 146KB monolith works. Do not touch. |
| NativeWind adoption | Decision is made: StyleSheet.create() + brand.ts. NativeWind is removed from the pipeline. |

---

## 10. Acceptance Criteria

The V1 reset is **complete** when ALL of the following are true:

### Config & Foundation
- [ ] `brand.ts`, `app.json`, and `AGENTS.md` use identical color values.
- [ ] NativeWind is removed from the build pipeline (`babel.config.js` and `metro.config.js` no longer reference it).
- [ ] No hardcoded Supabase URL/key in `supabase.ts`.
- [ ] `.env.example` files exist for root, `user-app/`, and `admin/`.
- [ ] `.gitignore` excludes `.env` files.
- [ ] Root `README.md` has setup instructions.
- [ ] All illustration images are under 200KB.
- [ ] All icon images are under 50KB.
- [ ] No emoji used as branding in production screens (splash logo uses actual image).

### Runtime
- [ ] `cd user-app && npx expo start` launches without errors.
- [ ] App loads on a device or emulator without crashes.
- [ ] All 5 tabs render without errors.
- [ ] Navigation between all flow screens works.

### User Flows
- [ ] Auth flow works: welcome → onboarding → register → OTP → home.
- [ ] Login flow works: login → home.
- [ ] Browse flow works: home → category → store → menu → add to cart.
- [ ] Order flow works: cart → checkout (cash on delivery) → confirmation.
- [ ] Order history shows placed orders.
- [ ] Profile and settings are accessible and functional.
- [ ] WhatsApp support link is present and opens correctly.

### Data
- [ ] Home screen shows real stores from Supabase (not mock data).
- [ ] Store detail shows real menu items from Supabase.
- [ ] Orders are written to and read from real Supabase tables.
- [ ] `fallbackApi.ts` is not used in any production code path.

### Quality
- [ ] All screens follow the `brand.ts` design system (correct colors, fonts, spacing).
- [ ] All screens handle loading, error, and empty states.
- [ ] RTL layout is correct for Arabic.
- [ ] Animations are smooth (no janky transitions).
- [ ] No TypeScript `any` types in modified files.
- [ ] No console errors or warnings in production mode.

When every checkbox above is checked, V1 Reset is complete and the app is ready for beta testing with real users in Safi.
