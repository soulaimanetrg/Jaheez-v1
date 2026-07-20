# AI CODING PLAN — JAHEEZ

> **Generated:** 2026-05-05 | **Purpose:** Instructions for an AI coding agent to proceed safely

---

## ⚠️ Rules Before Coding

### Rule 1: Never Touch Without Verifying First
Before modifying ANY file, check:
1. Does this file already have substantial code? (Don't overwrite working code)
2. Does this file import from `brand.ts`? (Use those tokens, not hardcoded colors)
3. Is there an existing pattern in similar files? (Follow it)
4. Does this change affect other files? (Update them together)

### Rule 2: Always Use `brand.ts` Tokens
- Import `BRAND`, `FONTS`, `RADIUS`, `SIZE`, `SPACE`, `SHADOW` from `constants/brand.ts`
- NEVER use raw hex colors like `'#F03030'` in screen files
- The only file allowed to define colors is `brand.ts`

### Rule 3: Follow the Existing Styling Pattern
- Screens use `StyleSheet.create()` with brand tokens — continue this pattern
- Do NOT introduce NativeWind `className` props (inconsistent with existing code)
- All styles should be in a `const styles = StyleSheet.create({})` at the bottom of the file

### Rule 4: Follow the Existing Architecture
- Screens go in `app/(auth)/`, `app/(tabs)/`, or `app/(flows)/`
- Reusable components go in `components/ui/`
- API functions go in `lib/`
- Zustand stores go in `store/`
- React Query hooks go in `hooks/queries/` and `hooks/mutations/`
- All TypeScript interfaces go in `shared/types.ts`

### Rule 5: Always Handle Loading + Error States
Every screen that fetches data must have:
1. A loading state (use `<Loader />` or `<SkeletonBox />`)
2. An error state (use `<EmptyState />` with retry button)
3. An empty state (for when data is empty but not errored)

### Rule 6: Use the Existing Translation System
- Import `useLangStore` from `store/languageStore`
- Access translations via `const { t } = useLangStore()`
- All user-facing text must be from `t.*` — never hardcoded strings
- If a new key is needed, add it to `languageStore.ts` in ALL THREE languages

### Rule 7: Respect RTL
- Use `flexDirection: 'row-reverse'` for horizontal layouts (Arabic is RTL)
- Use `textAlign: 'right'` for text
- Check `useLangStore(s => s.isRTL)` for conditional layout

### Rule 8: Test After Each Change
- After each batch, the app should still start with `expo start`
- After each batch, verify the modified screen renders without crashes
- Watch for TypeScript errors before moving to the next batch

---

## Implementation Batches

### Batch 0: Stabilization (No New Features)

**Files to touch:**
- `user-app/app.json` — fix `primaryColor` and `backgroundColor`
- `user-app/tailwind.config.js` — update colors to match `brand.ts` OR mark for removal
- `AGENTS.md` — update brand color values to match `brand.ts`
- Root `package.json` — remove `i` package
- Root `.env`, `user-app/.env` — create `.env.example` versions
- `user-app/lib/supabase.ts` — remove hardcoded fallback values

**Validation:** App still starts. No new features. Colors are consistent.

---

### Batch 1: Core Connectivity

**Goal:** Replace mock data paths with real Supabase queries.

**Files to touch:**
- `user-app/lib/storeApi.ts` — ensure real Supabase queries work (remove/reduce fallback)
- `user-app/lib/orderApi.ts` — ensure order creation writes to Supabase
- `user-app/hooks/queries/useStores.ts` — verify React Query hooks hit real data
- `user-app/hooks/queries/useOrders.ts` — verify order queries work
- `user-app/app/(tabs)/index.tsx` — connect to real store data

**Validation:** Home screen shows real stores from Supabase. Orders tab shows real orders.

---

### Batch 2: Missing Auth Screen

**Goal:** Add the forgot password screen.

**Files to create:**
- `user-app/app/(auth)/forgot-password.tsx` — new screen

**Files to touch:**
- `user-app/app/(auth)/login.tsx` — link the "forgot password" button
- `user-app/store/languageStore.ts` — add forgot password strings if missing

**Validation:** User can tap "forgot password" → enter phone → receive OTP → reset password.

---

### Batch 3: Wallet Screen

**Goal:** Replace the wallet redirect stub with a real screen.

**Files to replace:**
- `user-app/app/(tabs)/wallet.tsx` — replace 6-line redirect with full wallet screen

**Files to touch:**
- `user-app/lib/walletApi.ts` — verify wallet API functions
- `user-app/hooks/queries/useWallet.ts` — verify wallet query hook

**Validation:** Wallet tab shows balance + transaction history.

---

### Batch 4: Driver App Stabilization

**Files to touch:**
- `driver-app/package.json` — align `react-native-reanimated` and `react-native-worklets` versions
- `driver-app/constants/brand.ts` — expand to match user-app token set

**Files to create:**
- Driver-specific assets (icons) — copy/adapt from user-app if needed

**Validation:** Driver app starts without dependency errors.

---

### Batch 5: Admin API Documentation

**Files to create:**
- `docs/ADMIN_API.md` — document all endpoints in `scripts/admin-api.js`

**No code changes.** This is documentation-only.

---

### Batch 6: Edge Functions (AI Moderation)

**Files to create:**
- `supabase/functions/ai-analyze/index.ts` — AI content moderation
- `supabase/functions/match-driver/index.ts` — driver matching algorithm
- `supabase/functions/send-notification/index.ts` — push notification sender

**Validation:** Custom errand request gets moderated before being sent to drivers.

---

## Files That Should NOT Be Touched Yet

| File/Directory | Reason |
|----------------|--------|
| `shared/types.ts` | Stable and comprehensive — only touch if adding new types |
| `shared/constants.ts` | Stable — only touch if adding new constants |
| `user-app/store/authStore.ts` | Working auth state — don't break it |
| `user-app/store/cartStore.ts` | Working cart logic — don't break it |
| `user-app/app/_layout.tsx` | Root layout with providers — very fragile |
| `user-app/components/ui/*` | Existing components are stable |
| `supabase_schema.sql` | Schema should only change via new migration files |
| `scripts/admin-api.js` | 146KB working API — too risky to refactor now |

---

## How to Avoid Random Coding

1. **Always work in batches** — one batch at a time, validate before the next
2. **Check the CURRENT_PROJECT_STATUS.md** before starting — know what exists
3. **Check the SCREEN_AND_FEATURE_STATUS.md** — know which screens need what
4. **Never create a file without checking if it already exists** — many screens are already coded
5. **Never install a new package** without checking if the functionality is already available
6. **Read the file before editing it** — most files are 10-30KB with substantial logic
7. **Follow the existing file's pattern** — don't introduce new patterns

---

## How to Keep Consistency with Existing Docs/Assets

### Design Consistency
- All colors come from `user-app/constants/brand.ts` — this is the single source of truth
- All fonts use the Cairo family (Regular, SemiBold, Bold)
- All spacing is on an 8px grid (`SPACE.SM=8, MD=16, LG=24, XL=32`)
- All buttons are 52px height, pill radius
- All inputs are 52px height, 12px radius
- All cards use 16px radius, white background, SHADOW

### Data Consistency
- All TypeScript interfaces live in `shared/types.ts`
- All API responses use the `ApiResponse<T>` wrapper
- All Supabase queries go through files in `lib/`
- All server state uses React Query hooks in `hooks/queries/` and `hooks/mutations/`
- All client state uses Zustand stores in `store/`

### Translation Consistency
- All user-facing text uses `const { t } = useLangStore()`
- New strings must be added to AR, FR, and EN in `languageStore.ts`
- Arabic strings are the primary — FR/EN are translations

### Navigation Consistency
- Use `router.push()` for forward navigation
- Use `router.replace()` for redirects (no back button)
- Use `router.back()` for back navigation
- Never use `setTimeout` for navigation
