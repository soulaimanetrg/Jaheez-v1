# NEXT STEPS — JAHEEZ

> **Generated:** 2026-05-05 | **Based on:** Full workspace discovery

---

## Phase 0 — STOP & STABILIZE (Do First)

These items must be resolved before any new feature work. They prevent the app from being trustworthy and consistent.

### 0.1 Resolve the Color System Conflict ⚡
**Why first:** Every screen uses brand tokens. If the source of truth is wrong, every new screen will be wrong too.

- [ ] Decide on ONE primary color: `#F03030` (brand.ts), `#EF4444` (AGENTS.md), or `#AB3500` (app.json/tailwind)
- [ ] Update `app.json` `primaryColor` and `backgroundColor` to match `brand.ts`
- [ ] Update `tailwind.config.js` to match `brand.ts` OR remove NativeWind entirely
- [ ] Update `AGENTS.md` to reflect the actual current brand tokens

### 0.2 Decide on Styling Approach ⚡
**Why:** NativeWind is configured but unused. This adds build complexity and confusion.

- [ ] **Option A:** Commit to NativeWind — convert all `StyleSheet.create()` to `className`
- [ ] **Option B:** Remove NativeWind — strip babel plugin, metro config wrapper, tailwind config, global.css

**Recommendation:** Option B (remove NativeWind) since the entire codebase already uses `StyleSheet.create()` with brand tokens. Migration to NativeWind would touch every file.

### 0.3 Secure the Secrets ⚡
- [ ] Create `.env.example` files with placeholder values
- [ ] Add `.env` to `.gitignore` (verify it's excluded)
- [ ] Rotate Supabase service role key, Infobip key, Stripe keys
- [ ] Remove hardcoded Supabase URL/key from `supabase.ts` — fail gracefully instead

### 0.4 Clean Up Root Directory
- [ ] Write a real `README.md` with setup instructions
- [ ] Remove or move to `/archive`: `jaheez-temp/`, `user-app/expo-new/`, `html-preview/`, `server.js`
- [ ] Remove `soulaimanr.rar` and `docs.rar` if contents are already extracted
- [ ] Remove the `i` package from root `package.json`

---

## Phase 1 — VERIFY RUNTIME (Do Second)

Before building anything new, verify the app actually runs.

### 1.1 Verify User App Starts
- [ ] Run `cd user-app && npm start` — fix any Metro errors
- [ ] Test on Expo Go (Android/iOS) or dev build
- [ ] Verify splash → welcome → login flow works
- [ ] Verify home screen renders with mock data

### 1.2 Verify Admin Panel Starts
- [ ] Run `cd admin && npm run dev` — fix any Vite errors
- [ ] Navigate to login page
- [ ] Test login with an admin account (create one first with `scripts/create-admin.js`)

### 1.3 Verify Database Schema
- [ ] Confirm `supabase_schema.sql` has been run against the Supabase instance
- [ ] Run `scripts/seed-stores.js` to populate sample stores
- [ ] Verify stores appear in admin panel

### 1.4 Verify Admin API Starts
- [ ] Run `node scripts/admin-api.js` — confirm it starts on port 3001
- [ ] Test the `/admin-api/auth/login` endpoint
- [ ] Verify admin can see users/stores/orders

---

## Phase 2 — CORE FLOW COMPLETION (Do Third)

Complete the primary user journey: Browse → Order → Track → Deliver.

### 2.1 Connect Home Screen to Real Data
- [ ] Replace mock data fallbacks in home screen with live Supabase queries
- [ ] Verify store listings load from `public.stores`
- [ ] Verify promo banners load or show empty state

### 2.2 Complete Store → Cart → Checkout Flow
- [ ] Verify store detail loads menu from Supabase
- [ ] Verify cart works end-to-end
- [ ] Verify checkout creates a real order in Supabase

### 2.3 Implement Wallet Tab
- [ ] Replace the redirect stub with a real wallet screen
- [ ] Show balance, transaction history
- [ ] Connect to `public.wallets` and `public.wallet_transactions`

### 2.4 Implement Forgot Password
- [ ] Create `app/(auth)/forgot-password.tsx`
- [ ] Integrate with OTP flow for password reset

---

## Phase 3 — DRIVER APP COMPLETION (Do Fourth)

### 3.1 Add Driver Assets
- [ ] Create/copy tab bar icons for driver app
- [ ] Add brand illustrations for welcome/empty states

### 3.2 Fix Dependency Versions
- [ ] Align `react-native-reanimated` version with user-app
- [ ] Align `react-native-worklets` version with user-app

### 3.3 Verify Driver Auth Flow
- [ ] Test driver registration
- [ ] Test KYC document upload
- [ ] Test driver login

### 3.4 Verify Delivery Flow
- [ ] Test accepting an order
- [ ] Test active delivery status updates
- [ ] Test delivery completion

---

## What Should Wait

| Item | Why Wait |
|------|----------|
| AI content moderation | Requires Supabase Edge Functions + Gemini API setup — defer until core ordering works |
| Push notifications (server-side) | Requires Expo push API server setup — defer until orders work |
| Stripe payment flow | Cash-on-delivery works first — add card payments after MVP |
| CI/CD pipeline | Set up after manual testing proves the app works |
| EAS production builds | Not needed until app is ready for beta testing |
| Testing | Critical but should start after Phase 2 to avoid testing mock data |

---

## What Should NOT Be Done Yet

| Item | Why Not |
|------|---------|
| Adding new screens/features | Existing screens aren't connected to real data yet |
| Redesigning the UI | Current design is functional — polish after core flow works |
| Deploying to app stores | App is not ready for end users |
| Migrating to NativeWind | Would touch every file for no functional benefit right now |
| Adding new packages | Existing dependency set is already complex |

---

## What Must Be Clarified Before Implementation

| Question | Why It Matters |
|----------|---------------|
| Which color palette is the final one? | Affects every screen's visual appearance |
| Is the Supabase schema deployed? | Determines if screens can query real data |
| Should NativeWind be kept or removed? | Affects build config and coding approach |
| Is the admin API running somewhere? | User app auth depends on it (phone-disabled fallback) |
| What is inside `soulaimanr.rar`? | 26MB archive — could contain important assets |
| Are the HTML mockups (`html-preview/`) the approved design? | Need to know what the target UI looks like |
| What are the design images in `design/` showing? | Need to visually inspect them |

---

## Recommended Implementation Order

```
1. Phase 0: Stabilize (color fix, styling decision, secrets, cleanup)
2. Phase 1: Verify runtime (start apps, verify DB, test flows)
3. Phase 2: Core flow (real data, wallet, forgot password)
4. Phase 3: Driver app (assets, deps, auth, delivery)
5. Phase 4: Backend services (Edge Functions, push, Stripe)
6. Phase 5: Testing (unit, component, E2E)
7. Phase 6: Polish (animations, assets, accessibility)
8. Phase 7: Deployment (EAS, CI/CD, monitoring)
```
