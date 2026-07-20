# JAHEEZ — File Generation Sequence

> **Purpose**: Specify which actual code files should be generated later and in what order. Includes dependency order, review gates, and validation criteria. This is documentation only — no actual code.

---

## How to Use This Document

This file defines the **exact order** in which code files should be generated. Each file has:

- **Path**: Where the file lives
- **Depends On**: Files that must exist before this one
- **Produces**: What this file exports that other files need
- **Review Gate**: What to verify before moving to the next file
- **Prompt**: Which prompt from PROMPT_LIBRARY.md to use

**Never generate a file before its dependencies are complete and verified.**

---

## Generation Order

### 🔷 Tier 1: Shared Foundation (No Dependencies)

These files have zero internal dependencies. Generate in any order (or parallel).

| # | File Path | Produces | Review Gate |
|---|---|---|---|
| 1.1 | `shared/types.ts` | All TypeScript interfaces and type aliases | `tsc --noEmit` passes; no `any`; all interfaces from AGENTS Section 5 |
| 1.2 | `shared/constants.ts` | ORDER_STATUSES, VEHICLE_TYPES, CATEGORIES, ZONES | All enums exported; values match AGENTS file |

**Prompt**: PROMPT F-01

**Gate Check**: Run `tsc --noEmit`. Zero errors. Verify all types from JAHEEZ_AGENTS.md Section 5 are present.

---

### 🔷 Tier 2: App Constants (Depends on Tier 1)

| # | File Path | Depends On | Produces | Review Gate |
|---|---|---|---|---|
| 2.1 | `user-app/constants/brand.ts` | `shared/types.ts` (for type safety) | BRAND object, FONTS object | All hex values match AGENTS Section 2; `as const` used |
| 2.2 | `user-app/constants/animations.ts` | None | Spring configs, timing presets | All presets from DESIGN_SYSTEM_RULES Section 6.1 |
| 2.3 | `user-app/constants/strings.ts` | None | STRINGS.ar and STRINGS.fr | Arabic and French for all UI text |

**Prompt**: PROMPT F-02 (brand + animations), PROMPT F-04 (strings)

**Gate Check**: All constants export correctly. Brand colors match specification exactly.

---

### 🔷 Tier 3: Infrastructure (Depends on Tiers 1-2)

| # | File Path | Depends On | Produces | Review Gate |
|---|---|---|---|---|
| 3.1 | `user-app/lib/supabase.ts` | Environment variables (.env) | `supabase` client singleton | Connects to Supabase project; no errors |
| 3.2 | `user-app/lib/api.ts` | `shared/types.ts`, `lib/supabase.ts` | 9 typed API functions | All functions return `ApiResponse<T>`; try/catch everywhere |
| 3.3 | `user-app/lib/maps.ts` | None | Maps helper functions (placeholder) | File exists; exports stubs |

**Prompt**: PROMPT F-03

**Gate Check**: `supabase.ts` connects to real project. `api.ts` has all 9 functions. No `any` types. All error handling follows `ApiResponse` pattern.

---

### 🔷 Tier 4: UI Components (Depends on Tiers 1-3)

Generate in this order (some components reference others):

| # | File Path | Depends On | Produces | Prompt |
|---|---|---|---|---|
| 4.1 | `components/ui/Button.tsx` | `brand.ts`, `animations.ts` | Button component | C-01 |
| 4.2 | `components/ui/Input.tsx` | `brand.ts`, `animations.ts` | Input component | C-01 |
| 4.3 | `components/ui/Card.tsx` | `brand.ts`, `animations.ts` | Card component | C-02 |
| 4.4 | `components/ui/Badge.tsx` | `brand.ts` | Badge component | C-02 |
| 4.5 | `components/ui/StatusBadge.tsx` | `brand.ts`, `shared/types.ts` (OrderStatus) | StatusBadge component | C-02 |
| 4.6 | `components/ui/Avatar.tsx` | `brand.ts` | Avatar component | C-02 |
| 4.7 | `components/ui/Loader.tsx` | `brand.ts` | Loader component | C-03 |
| 4.8 | `components/ui/EmptyState.tsx` | `brand.ts`, `animations.ts`, Button | EmptyState component | C-03 |
| 4.9 | `components/ui/BottomSheet.tsx` | `brand.ts`, `animations.ts` | BottomSheet component | C-03 |
| 4.10 | `components/ui/ShimmerPlaceholder.tsx` | `brand.ts`, `animations.ts` | ShimmerPlaceholder component | C-03 |
| 4.11 | `components/ui/OrderCard.tsx` | `brand.ts`, StatusBadge, Badge, Card, `shared/types.ts` | OrderCard component | C-04 |
| 4.12 | `components/ui/MapMarker.tsx` | `brand.ts` | MapMarker component | C-04 |
| 4.13 | `components/ui/AnimatedTransition.tsx` | `animations.ts` | AnimatedTransition wrapper | C-04 |
| 4.14 | `components/ui/PulseIndicator.tsx` | `brand.ts`, `animations.ts` | PulseIndicator component | C-04 |
| 4.15 | `components/ui/ProgressTimeline.tsx` | `brand.ts` | ProgressTimeline component | C-04 |
| 4.16 | `components/ui/index.ts` | All above components | Barrel export | C-04 |

**Gate Check**: 
- All 15 components created with TypeScript interfaces
- Barrel export includes all components
- Press animations on Button (scale 0.97) and Card (scale 0.98)
- Input focus border animation works
- ShimmerPlaceholder gradient animates
- StatusBadge maps all 10 statuses
- Visual test on real device: all components render correctly

---

### 🔷 Tier 5: State Stores (Depends on Tiers 1-3)

| # | File Path | Depends On | Produces | Prompt |
|---|---|---|---|---|
| 5.1 | `store/authStore.ts` | `shared/types.ts` (User) | Auth state + actions | H-01 |
| 5.2 | `store/cartStore.ts` | `shared/types.ts` (CartItem) | Cart state + actions | H-03 |
| 5.3 | `store/orderStore.ts` | `shared/types.ts` (Order) | Active order state | H-02 |
| 5.4 | `store/locationStore.ts` | None | Location cache state | H-03 |

**Gate Check**: Stores compile. `authStore` uses persist middleware with AsyncStorage. `cartStore.total()` computes correctly.

---

### 🔷 Tier 6: Hooks (Depends on Tiers 1-5)

| # | File Path | Depends On | Produces | Prompt |
|---|---|---|---|---|
| 6.1 | `hooks/useAuth.ts` | `lib/api.ts`, `store/authStore.ts`, `lib/supabase.ts` | Auth logic hook | H-01 |
| 6.2 | `hooks/useOrder.ts` | `lib/api.ts`, `store/orderStore.ts` | Order CRUD hook | H-02 |
| 6.3 | `hooks/useTracking.ts` | `lib/supabase.ts`, `shared/types.ts` | Realtime tracking hook | H-03 |
| 6.4 | `hooks/useChat.ts` | `lib/api.ts`, `lib/supabase.ts` | Chat + realtime hook | H-03 |
| 6.5 | `hooks/useLocation.ts` | `store/locationStore.ts` | GPS location hook | H-03 |
| 6.6 | `hooks/useAnimations.ts` | `constants/animations.ts` | Animation preset hook | — |

**Gate Check**:
- `useAuth` connects to Supabase Auth (sign in, sign up, verify OTP, sign out)
- `useOrder` uses React Query (useQuery + useMutation)
- `useTracking` subscribes to Realtime channels
- `useTracking` cleans up subscriptions on unmount
- `useChat` loads messages and subscribes to new ones
- All hooks return typed objects
- No direct Supabase queries (except Realtime subscriptions)

---

### 🔷 Tier 7: Auth Screens (Depends on Tiers 1-6)

| # | File Path | Depends On | Produces | Prompt |
|---|---|---|---|---|
| 7.1 | `app/(auth)/_layout.tsx` | None (layout only) | Auth stack navigator | A-01 |
| 7.2 | `app/(auth)/splash.tsx` | `useAuth` hook, `brand.ts`, Logo asset | Splash screen | A-01 |
| 7.3 | `app/(auth)/onboarding.tsx` | Button, animations, Lottie assets | Onboarding carousel | A-01 |
| 7.4 | `app/(auth)/login.tsx` | Input, Button, `useAuth` hook | Login form | A-02 |
| 7.5 | `app/(auth)/register.tsx` | Input, Button, `useAuth` hook | Register form | A-02 |
| 7.6 | `app/(auth)/otp.tsx` | Input (OTP type), Button, `useAuth` hook | OTP verification | A-03 |

**Gate Check**:
- Splash → checks session → redirects correctly
- Onboarding → 3 slides with dots → navigates to login
- Login → validates → calls signIn → navigates to home
- Register → validates → calls signUp → navigates to OTP
- OTP → auto-advance → auto-submit → navigates to home
- All screens handle loading and error states
- KeyboardAvoidingView on all form screens

---

### 🔷 Tier 8: Tab Screens (Depends on Tiers 1-7)

| # | File Path | Depends On | Produces | Prompt |
|---|---|---|---|---|
| 8.1 | `app/(tabs)/_layout.tsx` | `brand.ts`, icons | 5-tab bottom navigation | T-01 |
| 8.2 | `app/(tabs)/index.tsx` | `useOrder`, `useAuth`, components, `brand.ts` | Home screen | T-01 |
| 8.3 | `app/(tabs)/search.tsx` | Input, `brand.ts` | Search stub | T-02 |
| 8.4 | `app/(tabs)/orders.tsx` | `useOrder`, OrderCard, StatusBadge, EmptyState | Order history | T-02 |
| 8.5 | `app/(tabs)/chat.tsx` | `useChat`, Avatar, components | Chat list | T-02 |
| 8.6 | `app/(tabs)/profile.tsx` | `useAuth`, Avatar, Card, Button | Profile & settings | T-02 |

**Gate Check**:
- Bottom tab bar shows 5 tabs with correct styling
- Home screen shows all 6 sections
- Orders screen filters correctly
- Profile shows user info and logout works
- All screens handle loading, error, and empty states

---

### 🔷 Tier 9: Flow Screens (Depends on Tiers 1-8)

| # | File Path | Depends On | Produces | Prompt |
|---|---|---|---|---|
| 9.1 | `app/(flows)/custom-request.tsx` | `useOrder`, Input, Button, Card, BottomSheet | Order creation form | R-01 |
| 9.2 | `app/(flows)/confirmation.tsx` | `brand.ts`, Lottie, Button | Confirmation screen | R-02 |
| 9.3 | `app/(flows)/tracking/[id].tsx` | `useTracking`, `useOrder`, MapView, MapMarker, BottomSheet, ProgressTimeline | Tracking screen | TC-01 |
| 9.4 | `app/(flows)/chat/[id].tsx` | `useChat`, Avatar, Input, Button | Individual chat | TC-02 |
| 9.5 | `app/(flows)/store/[id].tsx` | Card, components | Store detail (stub) | — |
| 9.6 | `app/(flows)/cart.tsx` | `cartStore`, Card, Button | Cart (stub) | — |
| 9.7 | `app/(flows)/checkout.tsx` | `cartStore`, Card, Button, Input | Checkout (stub) | — |

**Gate Check**:
- Custom request form validates and submits
- All three moderation outcomes handled correctly
- Confirmation shows animated checkmark
- Tracking map shows markers and updates
- Chat sends/receives messages in real-time
- Chat disabled when order is terminal

---

### 🔷 Tier 10: Backend Functions (Independent of Frontend Tiers)

Can be built in parallel with Tiers 7-9 once database is set up.

| # | File Path | Depends On | Produces | Prompt |
|---|---|---|---|---|
| 10.1 | `supabase/functions/moderate/index.ts` | Supabase tables | Moderation workflow | B-01 |
| 10.2 | `supabase/functions/match-driver/index.ts` | Supabase tables, driver_locations | Driver matching algorithm | B-02 |
| 10.3 | `supabase/functions/send-notification/index.ts` | Supabase tables, Expo Push API | Push notification sender | B-02 |

**Gate Check**:
- `moderate`: safe request → approved; keyword → manual_review; admin review queue accessible
- `match-driver`: finds drivers within radius; expands on timeout; cancels after 3 rounds
- `send-notification`: writes to notifications table; calls Expo Push API
- All functions handle errors gracefully
- All functions run as Deno TypeScript

---

### 🔷 Tier 11: Root Layout & App Configuration

| # | File Path | Depends On | Produces | Prompt |
|---|---|---|---|---|
| 11.1 | `app/_layout.tsx` | Font assets, provider setup | Root layout with font loading | — |

This file is often needed as the first screen file but listed separately because it may need updating as the app grows.

**Gate Check**: Fonts load correctly. Providers wrap the app. Navigation works.

---

## Dependency Graph (Visual)

```
Tier 1: shared/types.ts, shared/constants.ts
    ↓
Tier 2: brand.ts, animations.ts, strings.ts
    ↓
Tier 3: supabase.ts, api.ts, maps.ts
    ↓
Tier 4: 15 UI components → index.ts barrel
    ↓
Tier 5: authStore, cartStore, orderStore, locationStore
    ↓
Tier 6: useAuth, useOrder, useTracking, useChat, useLocation
    ↓
Tier 7: Auth screens (splash → onboarding → login → register → otp)
    ↓
Tier 8: Tab screens (layout → home → search → orders → chat → profile)
    ↓
Tier 9: Flow screens (request → confirmation → tracking → chat/[id])
    ↓
Tier 10: Edge Functions (moderate → match-driver → send-notification)
```

---

## Review Gates Summary

| After Tier | Verify |
|---|---|
| Tier 1-3 | `tsc --noEmit` passes. Supabase connects. No `any` types. |
| Tier 4 | All 15 components render. Animations work on device. Barrel export complete. |
| Tier 5-6 | Hooks compile. Auth connects. React Query cache invalidates. Realtime subscriptions clean up. |
| Tier 7 | Full auth flow works on device. Splash → Login → Home redirect. |
| Tier 8 | All 5 tabs navigate. Home shows all sections. Profile logout works. |
| Tier 9 | Order creation → moderation → tracking flow complete. Chat sends/receives. |
| Tier 10 | Edge Functions deployed. Moderation workflow returns correct decisions. |
| **Final** | REVIEW_CHECKLIST.md: all 116 items pass. All 3 user journeys verified. |

---

## Total File Count

| Category | Count |
|---|---|
| Shared types & constants | 2 |
| App constants | 3 |
| Infrastructure (lib/) | 3 |
| UI Components | 16 (including barrel) |
| State Stores | 4 |
| Hooks | 6 |
| Auth Screens | 6 |
| Tab Screens | 6 |
| Flow Screens | 7 |
| Edge Functions | 3 |
| Root Layout | 1 |
| **Total** | **57 files** |

---

*Generate files in this exact order. Skip nothing. Verify at every gate. The sequence is the strategy.*
