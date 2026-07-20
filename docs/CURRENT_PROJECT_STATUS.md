# CURRENT PROJECT STATUS — JAHEEZ

> **Generated:** 2026-05-05 | **Method:** File-by-file workspace inspection

---

## Overall Status: 🟡 Early-to-Mid Development

The project has substantial code written across all three apps, but most of it appears to be **first-pass implementation using mock/fallback data** rather than production-ready code. The backend schema exists in SQL files but it is unclear if it has been fully deployed to the live Supabase instance.

---

## What Exists Now

### ✅ Appears Completed (Functional Code Exists)

| Area | Details |
|------|---------|
| **Project structure** | Monorepo with `user-app/`, `driver-app/`, `admin/`, `shared/`, `scripts/` |
| **Brand tokens** | `user-app/constants/brand.ts` — comprehensive color, spacing, shadow, font system |
| **Shared types** | `shared/types.ts` — 462 lines of TypeScript interfaces covering all entities |
| **Shared constants** | `shared/constants.ts` — order statuses, valid transitions, zones, thresholds |
| **Auth store** | `user-app/store/authStore.ts` — Zustand + AsyncStorage persist |
| **Cart store** | `user-app/store/cartStore.ts` — full cart logic with multi-store protection |
| **Language store** | `user-app/store/languageStore.ts` — AR/FR/EN with ModernMT API integration |
| **Auth API** | `user-app/lib/authApi.ts` — phone+password, email fallback, OTP (Infobip), Google OAuth |
| **Supabase client** | `user-app/lib/supabase.ts` — configured with hardcoded fallback URL |
| **Mock data** | `user-app/lib/mockData.ts` — realistic Arabic mock stores, menus, orders |
| **UI components** | 26 reusable components in `user-app/components/ui/` |
| **Database schema** | `supabase_schema.sql` — 889 lines with 11+ migrations, RLS policies, triggers |
| **Strings / i18n** | `user-app/constants/strings.ts` — Arabic + French string tables |
| **Root layout** | App error boundary, QueryClientProvider, push notifications, RTL sync |
| **Splash screen** | Animated splash with branding (both in `index.tsx` and `(auth)/splash.tsx`) |
| **Admin panel pages** | 22 pages: Dashboard, Orders, Stores, Products, Users, Drivers, Analytics, etc. |
| **Admin auth** | JWT-based admin login with role-based access (super_admin, admin, manager, support) |
| **Server scripts** | `scripts/admin-api.js` (146KB Express API), `scripts/seed-stores.js`, `scripts/create-admin.js` |

### 🟡 Appears Partially Completed

| Area | Details |
|------|---------|
| **User auth screens** | Login, Register, OTP, Splash, Welcome, Onboarding — exist but may have runtime issues (Clerk exploration was abandoned) |
| **Home screen** | `user-app/app/(tabs)/index.tsx` — 24KB, substantial but relies on mock/fallback data |
| **Search screen** | `user-app/app/(tabs)/search.tsx` — 28KB, implemented with mock data fallback |
| **Orders screen** | `user-app/app/(tabs)/orders.tsx` — 27KB, functional with Supabase+fallback |
| **Profile screen** | `user-app/app/(tabs)/profile.tsx` — 13KB, basic profile view |
| **Store detail** | `user-app/app/(flows)/store/[id].tsx` — 29KB, menu display + cart integration |
| **Cart** | `user-app/app/(flows)/cart.tsx` — 20KB cart screen |
| **Checkout** | `user-app/app/(flows)/checkout.tsx` — 29KB checkout flow |
| **Order detail** | `user-app/app/(flows)/order/[id].tsx` — 29KB order detail view |
| **Tracking** | `user-app/app/(flows)/tracking/[id].tsx` — 20KB live tracking (mock driver location) |
| **Custom request** | `user-app/app/(flows)/custom-request.tsx` — 25KB errand creation |
| **Chat** | `user-app/app/(flows)/chat/[id].tsx` — 10KB chat screen |
| **Settings** | `user-app/app/(flows)/settings.tsx` — 22KB settings page |
| **Driver app** | Has auth (login/register/OTP), home (delivery queue), earnings, profile, active-delivery — but **no assets folder is empty** |
| **NativeWind/Tailwind** | Configured but actual screens mostly use `StyleSheet.create()` inline styles |
| **Category browsing** | `user-app/app/(flows)/category/[id].tsx` — 16KB category listing |

### ❌ Appears Missing

| Area | Details |
|------|---------|
| **Wallet tab** | Only a redirect to home (`wallet.tsx` = 6 lines) |
| **Chat tab** | Listed in tabs layout but `chat.tsx` = 16KB — needs verification if it's the in-order chat or a conversation list |
| **AI moderation** | Referenced in docs but no edge functions found in workspace |
| **Supabase Edge Functions** | No `supabase/functions/` directory exists |
| **Push notification server** | Client-side setup exists but no server-side send logic |
| **Real map integration** | `react-native-maps` is a dependency but no Google Maps API key visible |
| **Payment processing** | Stripe keys exist in `.env` but `stripeClient.ts` may be incomplete |
| **Testing** | Zero test files found anywhere |
| **CI/CD** | No GitHub Actions, no EAS build config |
| **Production build** | No `eas.json` for Expo Application Services |
| **README** | Root README is empty (just "# Jaheez") |
| **Driver app assets** | `driver-app/assets/` is an empty directory |
| **Forgot password screen** | Referenced in docs but no `forgot-password.tsx` file exists |
| **Reviews/rating screen** | No dedicated screen for leaving reviews |
| **Promotions/deals screen** | No user-facing promo detail screen |

### ⚠️ Appears Broken or Conflicting

| Issue | Details |
|------|---------|
| **Color system conflict** | `brand.ts` (#F03030), `tailwind.config.js` (#AB3500), `app.json` (#AB3500), `AGENTS.md` (#EF4444) — four different "primary" colors |
| **Font conflict** | `AGENTS.md` says DM Sans; `brand.ts` uses Cairo; `tailwind.config.js` declares DMSans font family |
| **NativeWind unused** | NativeWind is configured but screens use `StyleSheet.create()` instead of `className` |
| **Duplicate splash** | Both `app/index.tsx` and `app/(auth)/splash.tsx` render splash-like screens |
| **Hardcoded Supabase URL** | `supabase.ts` has hardcoded fallback URL/key (including what appears to be a real service role key in `.env`) |
| **Exposed secrets** | `.env` files contain actual API keys (Supabase service role key, Infobip, Stripe, ModernMT) committed to the workspace |
| **SDK version mismatch** | `AGENTS.md` says "Expo SDK 51" but `package.json` shows SDK 55 |
| **Multiple starter projects** | `user-app/expo-new/` contains what appears to be a stock Expo template (unused) |
| **jaheez-temp folder** | Contains another Expo starter project — likely from an earlier attempt |

---

## What Is Unclear

1. Whether the Supabase schema has actually been run against the live instance
2. Whether the admin API (`scripts/admin-api.js`) is deployed or only run locally
3. Whether the app has ever successfully run on a physical device
4. Whether the design images in `design/` represent the current target UI or an older vision
5. Whether the `html-preview/` folder represents an approved design or a prototype
6. The relationship between `jaheez_workspace/` (contains a full HTML/CSS mockup system) and the actual React Native implementation
