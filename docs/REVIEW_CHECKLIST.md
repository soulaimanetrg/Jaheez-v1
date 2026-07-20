# JAHEEZ — Review Checklist

> **Purpose**: Comprehensive checklist for reviewing AI-generated output. Run this after every build phase and before every commit. Covers architecture, styling, typing, accessibility, folder conventions, logic boundaries, Supabase patterns, UX, and animation quality.

---

## How to Use

1. **Run this checklist after every phase** — not just at the end
2. **Each section is independent** — you can run specific sections per file type
3. **Mark items as PASS / FAIL** — document any failures with file:line references
4. **Fix all FAIL items before proceeding** to the next phase
5. **Use the Quick Check (5-Point)** for individual file reviews during development

---

## Quick Check (5-Point Verification)

Run this on **every single file** before accepting it:

| # | Check | How to Verify |
|---|---|---|
| 1 | **No hardcoded colors** | Search for `#` followed by hex — should only exist in `brand.ts` |
| 2 | **No `any` type** | Search for `: any`, `as any`, `<any>` — zero matches |
| 3 | **No unnecessary inline styles** | Search for `style={{` — only dynamic values or animated values |
| 4 | **Accessibility labels** | Every `<Pressable` and `<Image` has `accessibilityLabel` |
| 5 | **All states handled** | Every `useQuery` has `isLoading`, `error`, and empty guards |

---

## Section 1: Architecture Checks

### Import Boundaries

- [ ] Screens only import from: `hooks/`, `components/ui/`, `constants/`, `lib/`
- [ ] Screens never import from other screens
- [ ] Screens never import `supabase` directly (only through hooks/api)
- [ ] Components (`components/ui/`) never import hooks, stores, or `lib/`
- [ ] Hooks never import components
- [ ] All types imported from `shared/types.ts` — no inline type definitions

### Layer Compliance

- [ ] Business logic is in hooks, not in screens or components
- [ ] Supabase queries are in `lib/api.ts`, not in hooks directly (except Realtime)
- [ ] Supabase client is instantiated only in `lib/supabase.ts`
- [ ] Navigation is in screens only — hooks and components don't call `router`
- [ ] State management uses Zustand for shared state, React Query for server data

### Export Rules

- [ ] All components use named exports
- [ ] All hooks use named exports
- [ ] All stores use named exports
- [ ] All constants use named exports
- [ ] Only screen files (`app/` directory) use default exports
- [ ] Barrel export exists in `components/ui/index.ts`

---

## Section 2: Frontend Style Checks

### NativeWind Compliance

- [ ] All static styles use `className` props (NativeWind)
- [ ] No `StyleSheet.create()` usage
- [ ] Inline `style` only used for: dynamic brand values, animated values, computed dimensions
- [ ] No hardcoded spacing values in styles — uses 8px grid via NativeWind classes

### Brand Token Compliance

- [ ] All colors imported from `constants/brand.ts`
- [ ] No hex values outside of `brand.ts`
- [ ] RED (`#EF4444`) used for primary buttons and active states
- [ ] YELLOW (`#F2C94C`) used for backgrounds and accents
- [ ] BG (`#FEFCE8`) used for screen backgrounds
- [ ] SURFACE (`#FFFFFF`) used for cards and nav bars
- [ ] ERROR_RED (`#DC2626`) used for error states (not brand RED)
- [ ] GREEN (`#22C55E`) used for success/delivered
- [ ] WARN (`#F59E0B`) used for pending/review states

### Typography

- [ ] All text uses DM Sans or JetBrains Mono
- [ ] Prices, OTP digits, and reference IDs use JetBrains Mono
- [ ] Font sizes follow the type scale (28, 24, 20, 18, 16, 14, 12, 10)
- [ ] No system default fonts visible

### Component Dimensions

- [ ] Buttons are 52px height with pill radius (9999)
- [ ] Inputs are 52px height with 12px radius
- [ ] Cards have 16px radius and shadow
- [ ] Bottom tab bar is 64px + safe area
- [ ] Top nav bar is 56px
- [ ] All touch targets are minimum 44px × 44px

---

## Section 3: Animation Checks

### Required Animations

- [ ] Button press: `scale(0.97)` with spring animation
- [ ] Card press: `scale(0.98)` with spring animation
- [ ] Tab switch: cross-fade transition (150ms)
- [ ] Input focus: border color transition from BORDER to RED (200ms)
- [ ] Status badge: fade-in with slide-up (8px)
- [ ] Order card list: stagger animation (50ms delay between items)
- [ ] Skeleton loading: shimmer gradient sweep
- [ ] Empty state icon: gentle float animation

### Animation Quality

- [ ] All animations run at 60fps on real device
- [ ] No animation exceeds 350ms for UI feedback
- [ ] Interactive elements use spring physics (not linear timing)
- [ ] Animations respect `prefers-reduced-motion` system setting
- [ ] No animation janks or stutters visible on scroll

### Lottie Animations

- [ ] Success checkmark on confirmation screen
- [ ] Searching driver pulse on tracking screen
- [ ] Shimmer placeholder on loading states

---

## Section 4: TypeScript Checks

### Type Safety

- [ ] No `any` type in any file
- [ ] No `as any` type assertions
- [ ] All function parameters have explicit types
- [ ] All hook return types are explicit
- [ ] All component props have TypeScript interfaces
- [ ] All interfaces live in `shared/types.ts` (not inline)
- [ ] `as const` used on all constant objects

### TypeScript Configuration

- [ ] `strict: true` in tsconfig
- [ ] `noImplicitAny: true`
- [ ] `strictNullChecks: true`
- [ ] Project compiles with `tsc --noEmit` (zero type errors)

---

## Section 5: Accessibility Checks

### Labels

- [ ] Every `<Pressable>` has `accessibilityLabel` in Arabic
- [ ] Every `<Image>` has `accessibilityLabel` descriptive text
- [ ] Every interactive element has `accessibilityRole` (button, link, checkbox, etc.)
- [ ] Navigation buttons have descriptive labels ("العودة" not just "back")

### Touch Targets

- [ ] All interactive elements are at minimum 44px × 44px
- [ ] Back buttons have 44px touch area (not just icon size)
- [ ] Tab bar icons have adequate touch targets

### Visual

- [ ] Text has at least 4.5:1 contrast ratio against background
- [ ] Color is never the only indicator of state (always paired with text or icon)
- [ ] Focus indicators visible on all focusable elements

---

## Section 6: Folder & File Checks

### Naming

- [ ] Screen files: kebab-case (`custom-request.tsx`)
- [ ] Components: PascalCase (`StatusBadge.tsx`)
- [ ] Hooks: camelCase with `use` prefix (`useOrder.ts`)
- [ ] Stores: camelCase with `Store` suffix (`authStore.ts`)
- [ ] No files in wrong directories (helpers in `hooks/` or `lib/`, not `app/`)

### Structure

- [ ] No files in root of `user-app/` (everything under `app/`, `components/`, etc.)
- [ ] Dynamic routes use `[param]` brackets
- [ ] Layouts use `_layout.tsx` naming
- [ ] No orphan files (every file is imported somewhere or is a route)

---

## Section 7: Backend & Supabase Checks

### API Layer

- [ ] All Supabase queries go through `lib/api.ts`
- [ ] Every API function returns `ApiResponse<T>` wrapper
- [ ] Every API function has try/catch error handling
- [ ] Error messages are user-friendly (Arabic for user-facing, English for logs)

### State Machine

- [ ] Order status transitions validated before any UPDATE
- [ ] `validateTransition(from, to)` called in hooks before calling API
- [ ] Terminal states (completed, cancelled, moderation_rejected) cannot transition
- [ ] Every transition logged in `order_status_log`

### Real-Time

- [ ] All channel subscriptions have cleanup in `useEffect` return
- [ ] Channels use specific filters (not subscribing to entire tables)
- [ ] `isConnected` state exposed in tracking and chat hooks
- [ ] Subscriptions use correct channel name patterns

### Security

- [ ] No service role key in mobile app code
- [ ] Only `EXPO_PUBLIC_` prefixed env vars used in client
- [ ] Phone numbers masked in any log output
- [ ] No passwords or tokens in any log output
- [ ] Text inputs sanitized before moderation analysis (strip HTML, limit length)

### Edge Functions

- [ ] All Edge Functions are Deno TypeScript (not Node.js)
- [ ] All Edge Functions validate input fields
- [ ] All Edge Functions return proper error responses (no stack traces)
- [ ] Moderation workflow executes correctly
- [ ] `match-driver` expands radius after 30s timeout
- [ ] `send-notification` handles missing push tokens gracefully

---

## Section 8: UX Checks

### Screen States

- [ ] Every screen with data fetching has a **loading state** (Loader or ShimmerPlaceholder)
- [ ] Every screen with data fetching has an **error state** (EmptyState with icon and message)
- [ ] Every list screen has an **empty state** (contextual EmptyState)
- [ ] Error states have a way to retry (button or pull-to-refresh)

### Navigation

- [ ] Back button on all flow screens (but not on tab screens)
- [ ] No dead-end screens (always a way to navigate away)
- [ ] Confirmation screen uses `router.replace` (no back to form)
- [ ] Login success uses `router.replace` to tabs (no back to login)

### Forms

- [ ] All forms have validation before submission
- [ ] Required fields are marked or obvious
- [ ] Error messages appear inline next to the relevant field
- [ ] Keyboard avoiding behavior active on all form screens
- [ ] Submit button shows loading state during submission
- [ ] Submit button disabled while loading

### Arabic/RTL

- [ ] All text defaults to Arabic
- [ ] Layouts work correctly in RTL mode
- [ ] Back arrow points right (→) in RTL
- [ ] Numbers use Western Arabic numerals (1, 2, 3)
- [ ] Currency formatted as `{amount} MAD`
- [ ] Phone format: `+212XXXXXXXXX`

---

## Section 9: Regression Checks

Run after any change to existing files:

- [ ] All existing screens still load without errors
- [ ] All 5 tab screens navigate correctly
- [ ] Auth flow still works (login → home)
- [ ] Order creation flow still works (form → moderation → confirmation)
- [ ] Tracking screen still subscribes to real-time updates
- [ ] Chat still sends and receives messages
- [ ] Profile logout still works (logout → splash)
- [ ] No new TypeScript compiler errors (`tsc --noEmit`)

---

## Section 10: Performance Checks

- [ ] FlatList uses `keyExtractor` (never array index)
- [ ] No unnecessary re-renders (Zustand selectors, React.memo where appropriate)
- [ ] Images use expo-image for network images
- [ ] Lottie animations don't run when off-screen
- [ ] Shimmer placeholders stop animating when data loads
- [ ] Scroll performance smooth at 60fps
- [ ] No memory leaks from uncleared subscriptions or timers

---

## Checklist Summary

| Section | Items | Priority |
|---|---|---|
| Quick Check (5-Point) | 5 | 🔴 Every file |
| Architecture | 14 | 🔴 Every phase |
| Frontend Style | 18 | 🔴 Every phase |
| Animations | 13 | 🟡 Phase 1, 7 |
| TypeScript | 8 | 🔴 Every phase |
| Accessibility | 8 | 🟡 Phase 1, 7 |
| Folder & Files | 6 | 🟡 Every phase |
| Backend & Supabase | 15 | 🔴 Phase 0, 7 |
| UX | 14 | 🟡 Every screen |
| Regression | 8 | 🔴 After changes |
| Performance | 7 | 🟡 Phase 7 |

**Total: 116 checks**

---

*Quality is not optional. Run this checklist. Fix every failure. Then move on.*
