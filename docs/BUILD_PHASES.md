# JAHEEZ — Build Phases

> **Purpose**: Complete phased execution plan from zero to working user-app prototype, with goals, deliverables, and "done" criteria for each phase. Designed for incremental AI-assisted development.

---

## Build Philosophy

1. **One phase at a time** — Never start Phase N+1 until Phase N is verified complete.
2. **Foundation before features** — Types, tokens, and components before any screen.
3. **Vertical slices** — Each phase produces something testable on a real device.
4. **Review gates** — Use `REVIEW_CHECKLIST.md` after every phase before proceeding.

---

## Phase 0 — Foundation

> **Goal**: Establish all shared infrastructure that every screen will depend on. No UI yet.

### Deliverables

| # | File | Description |
|---|---|---|
| 1 | `shared/types.ts` | All TypeScript interfaces and type aliases |
| 2 | `shared/constants.ts` | Enums: ORDER_STATUSES, VEHICLE_TYPES, CATEGORIES, ZONES |
| 3 | `user-app/constants/brand.ts` | All BRAND color tokens + FONTS object |
| 4 | `user-app/constants/animations.ts` | Spring configs, timing presets, Lottie references |
| 5 | `user-app/constants/strings.ts` | All user-facing strings in Arabic and French |
| 6 | `user-app/lib/supabase.ts` | Supabase client singleton with env vars |
| 7 | `user-app/lib/api.ts` | All typed API query functions (9 user functions) |
| 8 | `user-app/lib/maps.ts` | Google Maps helpers (placeholder) |

### Done Criteria

- [ ] All types compile with `tsc --noEmit`
- [ ] `supabase.ts` connects to a real or test Supabase project
- [ ] `api.ts` has all 9 user-app functions with `ApiResponse<T>` wrappers
- [ ] `brand.ts` exports `BRAND` and `FONTS` as const
- [ ] `animations.ts` exports all spring/timing presets
- [ ] `strings.ts` has Arabic and French keys for all UI text
- [ ] No `any` types in any file
- [ ] No hardcoded color values

### Common Mistakes
- Forgetting `as const` on the BRAND object
- Using `process.env` instead of `EXPO_PUBLIC_` prefix for Expo
- Defining types inline instead of in `shared/types.ts`
- Missing the `CreateOrderInput` interface

---

## Phase 1 — UI Component System

> **Goal**: Build every reusable component before any screen. This is the design system.

### Pre-Requisite
Google Stitch search: `"premium mobile component library"`, `"delivery app buttons cards"`, `"arabic mobile UI components"` — study 5+ results before starting.

### Deliverables

| # | Component | Priority |
|---|---|---|
| 1 | `Button.tsx` | Critical — used everywhere |
| 2 | `Input.tsx` | Critical — all forms |
| 3 | `Card.tsx` | Critical — content containers |
| 4 | `Badge.tsx` | High — category pills |
| 5 | `StatusBadge.tsx` | High — order status display |
| 6 | `Avatar.tsx` | High — user/driver images |
| 7 | `Loader.tsx` | High — loading states |
| 8 | `EmptyState.tsx` | High — no-data states |
| 9 | `BottomSheet.tsx` | High — modals and sheets |
| 10 | `OrderCard.tsx` | Medium — order list items |
| 11 | `MapMarker.tsx` | Medium — map pins |
| 12 | `AnimatedTransition.tsx` | Medium — shared animation wrapper |
| 13 | `ShimmerPlaceholder.tsx` | Medium — skeleton loading |
| 14 | `PulseIndicator.tsx` | Medium — live dot animation |
| 15 | `ProgressTimeline.tsx` | Medium — horizontal step tracker |
| 16 | `components/ui/index.ts` | Critical — barrel export |

### Done Criteria

- [ ] All 15 components created with TypeScript interfaces
- [ ] Every component has press animations (buttons, cards)
- [ ] Every component has `accessibilityLabel` prop where needed
- [ ] Barrel export in `index.ts` includes all components
- [ ] Shimmer loading uses smooth gradient animation
- [ ] StatusBadge maps all 10 OrderStatus values to Arabic labels
- [ ] Button shows loading spinner when `isLoading` is true
- [ ] Input has animated focus border transition
- [ ] Components tested visually in a scratch screen
- [ ] No business logic in any component

### Common Mistakes
- Forgetting the press scale animation on Buttons and Cards
- Not making BottomSheet dismissible by overlay tap AND drag
- Using `TouchableOpacity` instead of `Pressable`
- Putting navigation logic inside components

---

## Phase 2 — Hooks & State

> **Goal**: Build all business logic hooks and Zustand stores before any screen.

### Deliverables

| # | File | Type |
|---|---|---|
| 1 | `hooks/useAuth.ts` | Auth logic (signIn, signUp, verifyOTP, signOut) |
| 2 | `hooks/useOrder.ts` | Order CRUD + React Query |
| 3 | `hooks/useTracking.ts` | Realtime location + status subscription |
| 4 | `hooks/useChat.ts` | Chat messages + realtime subscription |
| 5 | `hooks/useLocation.ts` | Device GPS + permissions |
| 6 | `hooks/useAnimations.ts` | Shared animation presets (spring, fade, slide) |
| 7 | `store/authStore.ts` | User session (persisted with AsyncStorage) |
| 8 | `store/cartStore.ts` | Cart items + total (persisted) |
| 9 | `store/orderStore.ts` | Active order tracking (session only) |
| 10 | `store/locationStore.ts` | Cached GPS coordinates (session) |

### Done Criteria

- [ ] `useAuth` connects to Supabase Auth (signIn, signUp, verifyOTP, signOut)
- [ ] `useOrder` uses React Query for fetching, useMutation for creates/updates
- [ ] `useTracking` subscribes to Supabase Realtime and cleans up on unmount
- [ ] `useChat` loads initial messages and subscribes to new ones
- [ ] `authStore` persists to AsyncStorage and restores on app start
- [ ] `cartStore.total()` correctly sums all item prices × quantities
- [ ] All hooks return typed objects with `isLoading` and `error` fields
- [ ] No direct Supabase calls in hooks (except Realtime subscriptions)
- [ ] All async errors are caught and returned as strings

### Common Mistakes
- Not cleaning up Realtime subscriptions on unmount (memory leak)
- Using `supabase.from()` directly instead of `api.ts` functions
- Forgetting to invalidate React Query cache after mutations
- Not handling the case where `getSession()` returns null on cold start

---

## Phase 3 — Authentication Screens

> **Goal**: Complete auth flow — splash → onboarding → login → register → OTP → home redirect.

### Pre-Requisite
Google Stitch search: `"premium mobile login screen"`, `"OTP verification screen animation"`, `"mobile onboarding carousel arabic"` — study references.

### Deliverables

| # | Screen | File |
|---|---|---|
| 1 | Auth Layout | `app/(auth)/_layout.tsx` |
| 2 | Splash | `app/(auth)/splash.tsx` |
| 3 | Onboarding | `app/(auth)/onboarding.tsx` |
| 4 | Login | `app/(auth)/login.tsx` |
| 5 | Register | `app/(auth)/register.tsx` |
| 6 | OTP | `app/(auth)/otp.tsx` |

### Screen Details

**Splash**: Brand logo centered on YELLOW background → check session → route to home or onboarding. Animated logo entrance (scale + fade, 800ms spring).

**Onboarding**: 3-slide carousel with Lottie animations. Dot indicators (active = RED, inactive = BORDER). "التالي" button advances, "ابدأ الآن" on last slide. Skip link top-right.

**Login**: Phone + password form. Animated input focus borders. "دخول" primary button. Divider with "أو". Link to register. Error display in ERROR_RED.

**Register**: Full name + phone + password + confirm + terms checkbox. Validation: phone format `+212XXXXXXXXX`, passwords match, minimum 8 chars. On success → OTP screen.

**OTP**: 6 boxes in JetBrains Mono. Auto-advance between boxes. Auto-submit on 6th digit. 90-second countdown for resend. Shake animation on error. Masked phone display.

### Done Criteria

- [ ] Splash checks session and redirects within 2 seconds
- [ ] Onboarding carousel swipes smoothly with spring physics
- [ ] Login validates phone and password before submission
- [ ] Register validates all fields including phone format
- [ ] OTP auto-advances and auto-submits
- [ ] OTP shows countdown timer for resend
- [ ] All screens have loading states while auth operations run
- [ ] All screens have error display for auth failures
- [ ] Keyboard avoiding behavior on all form screens
- [ ] Animated input focus transitions on all inputs
- [ ] No business logic in screen files (all in useAuth hook)

### Common Mistakes
- Using `setTimeout` instead of `router.replace` for splash redirect
- Forgetting `KeyboardAvoidingView` on form screens
- Missing the masked phone display on OTP screen
- Not auto-submitting when 6th OTP digit is entered

---

## Phase 4 — Tabs & Home Screen

> **Goal**: Bottom navigation with all 5 tabs, fully functional home screen.

### Pre-Requisite
Google Stitch search: `"delivery app home screen premium"`, `"bottom nav mobile arabic"`, `"category pills horizontal scroll"` — study layout patterns.

### Deliverables

| # | Screen | File |
|---|---|---|
| 1 | Tab Layout | `app/(tabs)/_layout.tsx` (bottom nav with 5 tabs) |
| 2 | Home | `app/(tabs)/index.tsx` |
| 3 | Search | `app/(tabs)/search.tsx` (stub with search UI) |
| 4 | Orders | `app/(tabs)/orders.tsx` |
| 5 | Chat List | `app/(tabs)/chat.tsx` |
| 6 | Profile | `app/(tabs)/profile.tsx` |

### Home Screen Sections
A. **Yellow header** with logo + notification bell  
B. **Active order banner** (conditional, with live StatusBadge)  
C. **Search bar** (pressable, navigates to search tab)  
D. **Category pills** (horizontal scroll, filterable)  
E. **"طلب جديد" CTA button** (primary, full width)  
F. **"آخر طلباتك" section** (3 recent orders or EmptyState)

### Done Criteria

- [ ] Bottom tab bar shows 5 tabs with correct icons
- [ ] Active tab has RED icon + label + dot indicator
- [ ] Tab switch has cross-fade animation
- [ ] Home screen displays all 6 sections
- [ ] Active order banner shows only when user has active order
- [ ] Category pills scroll horizontally with correct selected/unselected states
- [ ] Recent orders show as OrderCard (compact) with stagger animation
- [ ] Empty state shows when no orders exist
- [ ] Orders tab shows filterable history (All/Active/Completed/Cancelled)
- [ ] Profile tab shows user info, trust score bar, settings rows, logout
- [ ] Pull-to-refresh on Orders tab with RED spinner
- [ ] Profile logout confirms before executing

### Common Mistakes
- Not testing the tab bar on devices with different safe area sizes
- Forgetting the stagger animation delay on order cards
- Making the search bar a real input instead of a pressable navigation trigger
- Not handling the "no active order" state on home (banner should be hidden)

---

## Phase 5 — Request Flow

> **Goal**: User can create a custom errand/delivery request with manual moderation.

### Pre-Requisite
Google Stitch search: `"order creation form mobile premium"`, `"delivery request screen"`, `"moderation review state UI"` — study form patterns.

### Deliverables

| # | Screen | File |
|---|---|---|
| 1 | Custom Request | `app/(flows)/custom-request.tsx` |
| 2 | Confirmation | `app/(flows)/confirmation.tsx` |

### Flow
1. User fills form (type, title, description, category, addresses)
2. Submit → show Loader with "جاري إرسال طلبك..."
3. Moderation sequence runs (keyword check + manual review flag)
4. **Sent**: Navigate to confirmation screen (pending approval)
5. **Manual review**: Show BottomSheet "طلبك قيد المراجعة" with realtime subscription
6. **Rejected**: Show inline error card if rules are violated (e.g. banned category)

### Confirmation Screen
- Animated green checkmark (Lottie, scale from 0 to 1)
- Order reference: `#JHZ-{first 8 chars}` in JetBrains Mono
- Price in RED JetBrains Mono
- "تتبع طلبك" primary button → tracking screen
- "العودة للرئيسية" ghost button → home

### Done Criteria

- [ ] Custom request form has all fields (type, title, desc, category, pickup, dropoff)
- [ ] Order type selector (delivery/errand) has correct selected/unselected states
- [ ] Form validates required fields before submission
- [ ] Loading state shows during submission
- [ ] Moderation status handled correctly (pending/review)
- [ ] Manual review shows BottomSheet with realtime subscription
- [ ] Rejection shows error card with explanation
- [ ] Confirmation screen shows animated checkmark
- [ ] Price displays in JetBrains Mono
- [ ] Navigation uses `router.replace` (no going back to form)

### Common Mistakes
- Calling Supabase function directly from screen instead of through hook → api.ts
- Not subscribing to realtime during manual_review state
- Forgetting to clear the form after submission
- Using `router.push` instead of `router.replace` for confirmation

---

## Phase 6 — Tracking, Chat, Orders & Profile Polish

> **Goal**: Complete all remaining flow screens and polish existing screens.

### Deliverables

| # | Screen | File |
|---|---|---|
| 1 | Live Tracking | `app/(flows)/tracking/[id].tsx` |
| 2 | Individual Chat | `app/(flows)/chat/[id].tsx` |
| 3 | Store Detail | `app/(flows)/store/[id].tsx` (stub) |
| 4 | Cart | `app/(flows)/cart.tsx` (stub) |
| 5 | Checkout | `app/(flows)/checkout.tsx` (stub) |

### Tracking Screen
- Full screen map with custom markers (driver = RED, pickup = YELLOW, dropoff = GREEN)
- Bottom sheet at 35% height showing order status and driver info
- Driver marker animates smoothly to new positions
- ETA calculated from distance / 25 km/h
- Status timeline (horizontal 5-step progress)
- Cancel button visible only in cancellable states
- Review prompt after delivery confirmation (1-5 stars)

### Chat Screen
- Inverted FlatList (newest at bottom)
- User messages right-aligned (RED bg, white text)
- Driver messages left-aligned (SURFACE bg, TEXT color)
- System messages centered (gray, italic)
- Input bar at bottom with send button and image picker
- Disabled state when order is completed/cancelled

### Done Criteria

- [ ] Tracking map shows all three markers
- [ ] Driver marker animates position changes smoothly
- [ ] Bottom sheet shows correct content for each order status
- [ ] Status timeline highlights completed/current/future steps
- [ ] Cancel button only visible in cancellable states
- [ ] Chat messages display correctly for all three sender types
- [ ] Chat input disabled when order is terminal
- [ ] Real-time messages appear without manual refresh
- [ ] ETA updates as driver moves closer
- [ ] Star rating appears after delivery confirmation

### Common Mistakes
- Not animating driver marker position (jumping instead of sliding)
- Forgetting to clean up Realtime subscriptions on tracking screen unmount
- Not inverting the FlatList for chat
- Allowing cancel when order is in non-cancellable state

---

## Phase 7 — Polish & Testing

> **Goal**: Review everything, fix all violations, test user journeys end-to-end.

### Activities

1. **Run full REVIEW_CHECKLIST.md** against every file
2. **Fix all violations**: hardcoded colors, missing states, missing labels
3. **Test Journey 1**: register → login → home → create request → approved → confirmation → tracking
4. **Test Journey 2**: create request → manual review waiting → approved → confirmation
5. **Test Journey 3**: create request → rejected (banned keyword) → error displayed → clear form
6. **Verify animations**: press animations, screen transitions, loading skeletons, Lottie animations
7. **Test RTL**: Arabic text flows correctly, layout mirrors for RTL
8. **Test empty states**: every list screen with no data
9. **Test error states**: disconnect Supabase, verify error handling
10. **Performance audit**: no jank in animations, FlatLists scroll smoothly

### Done Criteria

- [ ] REVIEW_CHECKLIST.md passes with zero violations
- [ ] All 3 user journeys work end-to-end
- [ ] All animations run at 60fps on real device
- [ ] All screens handle loading + error + empty states
- [ ] No hardcoded colors in any file (grep verified)
- [ ] No `any` types in any file (TypeScript compiler verified)
- [ ] No inline styles in any file (except allowed exceptions)
- [ ] All Pressable/Image elements have accessibilityLabel
- [ ] App runs on both iOS (Expo Go) and Android (Expo Go)
- [ ] All 5 tabs navigate correctly with no crashes

---

## Phase Summary

| Phase | Focus | Est. Sessions | Key Deliverable |
|---|---|---|---|
| Phase 0 | Foundation | 1-2 | Types, tokens, API layer |
| Phase 1 | UI System | 2-3 | 15 components + barrel export |
| Phase 2 | Hooks & State | 2-3 | 6 hooks + 4 stores |
| Phase 3 | Auth | 2-3 | 5 auth screens + flow |
| Phase 4 | Tabs & Home | 2-3 | Bottom nav + 5 tab screens |
| Phase 5 | Request Flow | 2-3 | Custom request + manual moderation + confirmation |
| Phase 6 | Tracking/Chat | 3-4 | Map tracking + chat + polish |
| Phase 7 | Polish/Test | 2-3 | Zero violations + journey tests |
| **Total** | | **16-24 sessions** | **Working user-app MVP** |

---

*Build phase by phase. Review at every gate. Never skip ahead.*
