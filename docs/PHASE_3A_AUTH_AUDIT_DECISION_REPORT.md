# 🔐 PHASE 3A — Auth Flow Audit & Decision Report

**Date:** 2026-05-22 | **Role:** Auth flow auditor | **Status:** READ-ONLY — Zero code changes made.

---

## 1. Auth Flow Diagram (Current State)

```
App Launch
    │
    ▼
app/index.tsx (RootIndex)
    │  ┌─ isLoading=true ──────────────────► (auth)/splash.tsx
    │  │   └─ 2.5s static image → video → navigate()
    │  │
    │  ├─ isAuthenticated=true ────────────► (tabs)/  [Home]
    │  │
    │  ├─ hasCompletedOnboarding=false ───► (auth)/onboarding.tsx
    │  │   └─ 3-slide carousel → Skip/Finish → (auth)/welcome
    │  │
    │  └─ default ────────────────────────► (auth)/welcome.tsx
    │
(auth)/welcome.tsx
    │  ├─ Login → (auth)/login.tsx
    │  ├─ Register → (auth)/register.tsx
    │  └─ Guest → (tabs)/  [bypasses auth]
    │
(auth)/login.tsx  [mode: phone | email]
    │  Phone mode: phone + password → loginUser() → supabase.signInWithPassword(phone)
    │              [Phone disabled] → backend /admin-api/auth/login → signInWithPassword(email)
    │              → router.replace('/(tabs)')
    │  Email mode: email + password → loginWithEmail() → supabase.signInWithPassword(email)
    │              → router.replace('/(tabs)')
    │  Google: signInWithGoogle() → supabase OAuth (web only)
    │  Forgot (phone): → (auth)/otp  [no phone param passed — open OTP form]
    │  Forgot (email): → [NO onPress — dead button]
    │
(auth)/register.tsx  [mode: phone | email]
    │  Phone mode: phone + full_name + password + confirmPassword + city
    │              → registerUser() → supabase.signUp(phone, password)
    │              → [if sessionReady] → (tabs)/
    │              → [if !sessionReady] → (auth)/otp?phone=...&flow=register
    │  Email mode: email + full_name + password + confirmPassword + city
    │              → registerWithEmail() → supabase.signUp(email, password)
    │              → [if sessionReady] → (tabs)/
    │              → [if !sessionReady] → shows English error in Arabic UI
    │
(auth)/otp.tsx
    │  Receives: phone (from params), flow ('register' | undefined)
    │  6-digit code, 105s countdown timer, resend button
    │  → verifyOTP(phone, code) → infobipVerifyOTP → supabase.getSession()
    │  → [if session exists] → (tabs)/
    │  → [if no session] → (auth)/login?verified=1&phone=...
    │
(tabs)/  ← Authenticated home
```

---

## 2. Current Login Method

| Method | Status |
| :--- | :---: |
| **Primary:** Supabase phone + password (`signInWithPassword({ phone, password })`) | ✅ Implemented |
| **Fallback:** Backend admin API `/admin-api/auth/login` → synthetic email login | ✅ Implemented |
| **Secondary tab:** Direct email + password (`signInWithPassword({ email, password })`) | ✅ Implemented |
| **Tertiary:** Google OAuth via `supabase.signInWithOAuth` | ✅ Implemented |
| Mock/demo auth | ❌ None |
| Supabase phone OTP (magic link style) | ❌ Not used |
| Email magic link | ❌ Not used |

**Primary method confirmed:** `phone + password`. The dual-tab login UI makes both phone and email methods accessible from the same screen.

---

## 3. Current Registration Method

**Fields in phone mode:**
| Field | Schema name | DB column |
| :--- | :--- | :--- |
| Full name | `full_name` | `full_name` ✅ |
| Phone | `phone` | `phone` ✅ |
| Password | `password` | — |
| Confirm password | `confirmPassword` | — |
| City | `city` | `city` ✅ |

**Fields in email mode:**
| Field | Schema name | DB column |
| :--- | :--- | :--- |
| Full name | `full_name` | `full_name` ✅ |
| Email | `email` | `email` ✅ |
| Password | `password` | — |
| Confirm password | `confirmPassword` | — |
| City | `city` | `city` ✅ |

**What registration does (phone path):**
1. `supabase.auth.signUp({ phone, password, options: { data: { full_name, city, phone } } })`
2. `insertProfile(uid, phone, input)` — inserts into `users` table (non-fatal)
3. `infobipSendOTP(phone)` — sends SMS OTP (non-fatal)
4. Returns `{ sessionReady: boolean }` — if `true` goes to tabs; if `false` goes to `/otp`

**What registration does (email path):**
1. `supabase.auth.signUp({ email, password, options: { data: { full_name, city } } })`
2. `insertProfile(uid, phone: '', ...)` — inserts with empty phone
3. Returns `{ sessionReady: boolean }` — if `true` goes to tabs; if `false` shows an **English error message** (bug)

**Field naming:** Uses `full_name` (snake_case) correctly throughout — matches DB column. No `fullName` mismatch.

---

## 4. Current OTP Method

| Property | Value |
| :--- | :--- |
| OTP length | 6 digits |
| Delivery | **Infobip SMS** via `infobipSendOTP(phone)` |
| Verification | `infobipVerifyOTP(phone, code)` → then `supabase.auth.getSession()` |
| Countdown timer | 105 seconds (1m45s) |
| Resend | Available when timer reaches 0 |
| Phone format | E.164 via `normalizePhone()` (Moroccan: `+212`) |
| Supabase OTP | ❌ NOT used (`supabase.auth.verifyOtp()` is NOT called) |
| Infobip | ✅ Referenced in `authApi.ts` via `infobipSendOTP` / `infobipVerifyOTP` |
| WhatsApp OTP | ❌ Not present |
| Twilio | ❌ Not referenced |
| Email OTP | ❌ Not used for OTP |

> [!IMPORTANT]
> The OTP screen uses **Infobip** for both sending and verifying the code — Supabase's built-in phone OTP is NOT used. Verification success checks `supabase.getSession()` for an existing session (not a Supabase token). If no session is active, it redirects to `/login` with a `verified=1` flag.

---

## 5. Supabase Configuration

| Item | Status |
| :--- | :--- |
| URL source | `EXPO_PUBLIC_SUPABASE_URL` env var ✅ |
| Anon key source | `EXPO_PUBLIC_SUPABASE_ANON_KEY` env var ✅ |
| Hardcoded credentials | ❌ None |
| Missing env runtime error | Logs `console.error` only — does NOT crash ✅ |
| `IS_STUB_MODE` | `false` — always live mode |
| Session storage | `AsyncStorage` via Supabase client config ✅ |
| `autoRefreshToken` | `true` ✅ |
| `persistSession` | `true` ✅ |
| `detectSessionInUrl` | `false` (correct for React Native) ✅ |
| Email magic link redirect risk | N/A — magic links NOT used in current flow |

**Required env vars:**
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 6. Auth Store (Zustand)

| Item | Value |
| :--- | :--- |
| Store name | `jaheez-auth` |
| Storage | Zustand `persist` + `createJSONStorage(AsyncStorage)` |
| Persisted fields | `user`, `isAuthenticated`, `hasCompletedOnboarding` |
| NOT persisted | `isLoading`, `pendingPhone` |
| Auth init | `_layout.tsx` → `useSupabaseAuthInit()` → `supabase.auth.getSession()` + `onAuthStateChange` |
| Session init also in | `app/index.tsx` → `getCurrentUser()` — **duplicate init** |
| Onboarding completion | `completeOnboarding()` → persisted flag |
| Logout | Clears `user`, `isAuthenticated`, `isLoading`, `pendingPhone` |
| `pendingPhone` | Set after successful `useRegister()` — used to pass phone to OTP screen |

> [!WARNING]
> **Duplicate auth initialization:** Both `app/_layout.tsx` (`useSupabaseAuthInit`) and `app/index.tsx` (`getCurrentUser`) call `getSession()` on mount. This creates two parallel session fetches on every app cold start. Not a breaking bug, but it is wasteful and can cause a race condition where `setUser` is called twice. This should be noted for Prompt 6B but NOT fixed now.

---

## 7. Risks and Conflicts

| Risk | Severity | Notes |
| :--- | :---: | :--- |
| **Duplicate auth init** (`_layout.tsx` + `index.tsx`) | Medium | Two `getSession()` calls on cold start — race condition possible |
| **Infobip SMS not configured = OTP screen broken** | High | OTP verify always calls Infobip; if key is missing it will fail silently |
| **"Forgot password" (email mode) has no `onPress`** | High | Email forgot button is visually there but completely non-functional |
| **"Forgot password" (phone mode) sends to `/otp` with no phone param** | Medium | OTP screen shows empty phone placeholder — user can't enter phone there |
| **English error message on email registration** | Low | `setServerError('Verification email sent!...')` — hardcoded English in Arabic app |
| **Email registration: empty `phone: ''` in users table** | Low | Accepted — email users have no phone |
| **`adminApiUrl` import in authApi.ts** | Medium | `adminApi.ts` must exist with `adminApiUrl` — not inspected but assumed present |
| **Google OAuth** | Info | `signInWithGoogle` uses `window.location.origin` — **web only**. No deep link handling for mobile. Will fail on iOS/Android without OAuth redirect setup |
| **`completeOnboarding()` called in OTP verify** | Low | Onboarding mark is set at OTP completion, not at welcome screen — expected behavior |
| **Screen style hardcodes `'#fff'`, `'#FFFFFF'`, `#FEF2F2`, etc.** | Info | Screens have more hardcoded colors than components — noted for UI polish phase |
| **`HERO_H` differs** between login (27% height) and register (16% height) | Info | Intentional design difference — not a bug |

---

## 8. Recommended Auth Strategy

### ✅ Recommendation: Option C — Keep current auth logic, polish screens only

**Rationale:**
- The auth logic is **substantially complete** — phone+password, email+password, OTP, Google, and logout are all wired up.
- The `authApi.ts` is well-structured with Infobip integration, fallback paths, error translation, and profile management.
- The Supabase client is correctly configured.
- The `authStore` persists properly with Zustand + AsyncStorage.
- **Changing the auth method now would break the working Infobip OTP flow.**
- The screens have structural issues (hardcoded colors, missing `onPress`, English error text) that can be fixed without touching auth logic.

**What Option C means:**
- ✅ Keep all `authApi.ts` functions unchanged
- ✅ Keep `authStore.ts` unchanged
- ✅ Keep `useAuth.ts` hooks unchanged
- ✅ Keep `supabase.ts` unchanged
- ⚠️ Fix UI-level bugs in screens (dead forgot password button, English error text)
- ⚠️ Polish screen visual quality (hardcoded colors → brand tokens)
- ⚠️ Do NOT change the Infobip OTP flow
- ⚠️ Do NOT switch to Supabase email OTP
- ⚠️ Do NOT add/remove any auth providers

---

## 9. Prompt 6B Implementation Boundaries

### ✅ Files Prompt 6B is ALLOWED to modify:

```
user-app/app/(auth)/splash.tsx       — Add animation polish
user-app/app/(auth)/welcome.tsx      — Replace hardcoded rgba/hex with brand tokens
user-app/app/(auth)/onboarding.tsx   — Minor style cleanup
user-app/app/(auth)/login.tsx        — Fix dead email forgot button; replace hardcoded colors
user-app/app/(auth)/register.tsx     — Replace English error message with Arabic; style cleanup
user-app/app/(auth)/otp.tsx          — Use shared OTPInput component; minor style polish
```

### ❌ Files Prompt 6B is NOT ALLOWED to modify:

```
user-app/lib/authApi.ts             — Auth logic is working; do not touch
user-app/lib/supabase.ts            — Correctly configured; do not touch
user-app/store/authStore.ts         — Session/persist logic is correct; do not touch
user-app/hooks/mutations/useAuth.ts — Mutation hooks are correct; do not touch
user-app/lib/schemas.ts             — Validation schemas are correct; do not touch
user-app/app/_layout.tsx            — Root auth init; do not touch
user-app/app/index.tsx              — Routing logic; do not touch
shared/types.ts                     — Type definitions; do not touch
driver-app/*                        — Out of scope
admin/*                             — Out of scope
```

### What Prompt 6B MUST do:

1. **Fix dead email forgot password button** — Add `onPress` that navigates to OTP or shows a bottom sheet (do NOT add a new screen).
2. **Fix phone forgot password** — Currently sends user to OTP with no phone. Should pre-fill or add a phone input step.
3. **Fix English error message in register** — Replace `'Verification email sent!...'` with Arabic text.
4. **Replace hardcoded colors in screens:**
   - `'rgba(255,255,255,0.18)'` → `BRAND.GLASS`
   - `'rgba(255,255,255,0.10)'` → decorative (acceptable)
   - `'#F03030'`, `'#C42020'` in gradient → These are `BRAND.RED` and `BRAND.RED_DARK` — already imported
   - `'#FEF2F2'`, `'#FECACA'` → `BRAND.RED_LIGHT`, `BRAND.BORDER`
   - `'#F0FDF4'`, `'#86EFAC'` → Informational success colors — defined as named constants
   - `'#15803d'` → Informational success text — named constant
   - `'#fff'` in LinearGradient text → `BRAND.SURFACE`
5. **Replace `Alert` in otp.tsx** — Replace `Alert.alert()` calls with the inline error banner pattern used in login/register.
6. **Replace raw OTP box logic in otp.tsx** — The OTP screen duplicates the OTPInput component logic using raw `TextInput` boxes. Consider using the shared `OTPInput` component.

### What Prompt 6B MUST NOT do:
- Add new screens (`forgot.tsx`)
- Change auth method or provider
- Install packages
- Touch backend or Supabase config
- Change navigation structure
- Add SMS/Twilio/WhatsApp

---

## 10. Is It Safe to Modify Auth Screens Next?

**✅ YES — Auth screens are safe to polish in Prompt 6B.**

The auth logic layer (authApi, authStore, hooks, supabase) is complete and correct. The screens have UI-level issues (hardcoded colors, a dead button, English text, raw OTP boxes) that can be fixed with confidence without breaking the auth flow.

**Priority order for Prompt 6B:**
1. Fix dead email forgot button (functional bug)
2. Fix English error message in register (UX bug)
3. Replace hardcoded colors with brand tokens (compliance)
4. Replace Alert with inline error banner in otp.tsx (UX polish)
5. Replace raw OTP boxes in otp.tsx with shared `OTPInput` component

---

## Verification Checklist

- [x] No source code modified
- [x] All auth files inspected: `splash`, `welcome`, `onboarding`, `login`, `register`, `otp`, `_layout`, `index`, `authApi`, `supabase`, `authStore`, `useAuth`
- [x] Current auth method identified: phone+password (primary), email+password (secondary), Infobip OTP (verification)
- [x] Supabase/authApi fully inspected
- [x] `forgot.tsx` confirmed missing — forgottn password handled via OTP for phone / dead button for email
- [x] Report created: `docs/PHASE_3A_AUTH_AUDIT_DECISION_REPORT.md`
- [x] Clear Prompt 6B boundaries defined
