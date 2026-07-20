# NAVIGATION AND ROUTING MAP

> Generated: 2026-05-19 | Source: `user-app/app/` directory + `_layout.tsx` files

---

## Navigation Architecture

**System:** Expo Router v3 (file-based routing)  
**Root Layout:** `app/_layout.tsx` — provides global providers, font loading, error boundary  
**Entry:** `app/index.tsx` — redirect logic based on auth state

---

## Route Groups

### (auth) — Authentication Flow
```
/(auth)/_layout.tsx    → Stack navigator (headerShown: false)
/(auth)/splash         → Splash screen
/(auth)/onboarding     → Onboarding carousel
/(auth)/welcome        → Login/Register entry
/(auth)/login          → Phone+password login
/(auth)/register       → Registration form
/(auth)/otp            → OTP verification
```

### (tabs) — Main App (Bottom Tabs)
```
/(tabs)/_layout.tsx    → Tab navigator (custom tab bar)
/(tabs)/index          → Home (الرئيسية)
/(tabs)/search         → Search (البحث)
/(tabs)/orders         → Orders (طلباتي)
/(tabs)/chat           → Chat (الرسائل)
/(tabs)/profile        → Profile (حسابي)
/(tabs)/wallet         → Wallet (محفظتي) — ⚠️ STUB
```

### (flows) — Push/Modal Screens
```
/(flows)/_layout.tsx          → Stack navigator (modal presentation)
/(flows)/category/[id]        → Category store listing
/(flows)/store/[id]           → Store details + menu
/(flows)/cart                 → Cart review
/(flows)/checkout             → Checkout flow
/(flows)/confirmation         → Order placed success
/(flows)/custom-request       → Custom errand form
/(flows)/order/[id]           → Order details
/(flows)/tracking/[id]        → Live tracking + map
/(flows)/chat/[id]            → Chat thread
/(flows)/addresses            → Saved addresses
/(flows)/profile-edit         → Edit profile
/(flows)/settings             → App settings
/(flows)/favorites            → Favorite stores
/(flows)/notifications        → Notification inbox
/(flows)/payment-methods      → Stripe card management
/(flows)/payment-success      → Payment callback
/(flows)/faq                  → FAQ accordion
/(flows)/terms                → Terms of use
/(flows)/support-ticket       → Support form
/(flows)/delete-account       → Account deletion
```

---

## Entry Point Logic (`app/index.tsx`)

```
App Start
  │
  ├─ isLoading=true → show splash
  │
  ├─ isAuthenticated=false
  │     ├─ hasCompletedOnboarding=false → redirect to /(auth)/onboarding
  │     └─ hasCompletedOnboarding=true  → redirect to /(auth)/welcome
  │
  └─ isAuthenticated=true → redirect to /(tabs)
```

---

## Navigation Flow Diagram

```
                    ┌─────────────┐
                    │   App Start  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Splash    │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────▼────────┐     ┌─────────▼─────────┐
     │   Onboarding    │     │    Main Tabs       │
     │  (first time)   │     │  ┌─────────────┐   │
     └────────┬────────┘     │  │ Home        │   │
              │              │  │ Search      │   │
     ┌────────▼────────┐     │  │ Orders      │   │
     │    Welcome      │     │  │ Chat        │   │
     │  Login│Register │     │  │ Profile     │   │
     └───┬────────┬────┘     │  └─────────────┘   │
         │        │          └─────────┬───────────┘
    ┌────▼──┐  ┌──▼────┐               │
    │ Login │  │Register│       ┌───────┴───────┐
    └───┬───┘  └───┬───┘       │  Flow Screens  │
        │          │           │  (push/modal)   │
    ┌───▼──────────▼───┐       │                 │
    │       OTP        │       │ Store→Cart→     │
    └────────┬─────────┘       │ Checkout→       │
             │                 │ Confirm→Track   │
         ┌───▼───┐             │                 │
         │ Tabs  │◄────────────│ Settings,       │
         └───────┘             │ Profile Edit,   │
                               │ Addresses, etc. │
                               └─────────────────┘
```

---

## Tab Bar Configuration

| Tab | Icon | Label (AR) | Screen |
|-----|------|-----------|--------|
| 1 | home.png | الرئيسية | /(tabs)/index |
| 2 | cart.png | البحث | /(tabs)/search |
| 3 | middle.png (center FAB) | طلب جديد | → custom-request or service selector |
| 4 | orders.png | طلباتي | /(tabs)/orders |
| 5 | favorites.png or chat.png | حسابي | /(tabs)/profile |

**Tab bar style:** 64px + safe area padding, white background, 1px top border, custom rendering

---

## Deep Linking (Planned)
- No deep link configuration found in `app.json`
- No `expo-linking` scheme configured
- **Needed for:** push notification → order details, promo links, password reset

---

## Screen Transition Animations
- Stack screens: `animation: 'fade'` or default slide
- Modal screens: `presentation: 'modal'` (slide up from bottom)
- Tab transitions: instant (no animation)
