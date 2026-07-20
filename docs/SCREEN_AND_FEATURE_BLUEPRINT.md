# SCREEN AND FEATURE BLUEPRINT

> Generated: 2026-05-19 | Source: Full file inspection

---

## Auth Screens

### Splash (`(auth)/splash.tsx`, 4.8KB) — ✅ Done
- Image → video splash transition, auto-redirect to onboarding/welcome/tabs
- Assets: `splash_first.png` ✅, `splash_video.webm` ⚠️ iOS compat risk

### Onboarding (`(auth)/onboarding.tsx`, 8.4KB) — ✅ Done
- 3-4 slide carousel, Skip/Next/Start buttons, sets `hasCompletedOnboarding`
- Assets: `scooter.png` (1.3MB), `bag_hero.png` (1.7MB), `scooter2.png` (1.7MB) — all oversized

### Welcome (`(auth)/welcome.tsx`, 8.8KB) — ✅ Done
- Login/Register/Guest entry, brand logo + tagline + illustration

### Login (`(auth)/login.tsx`, 21.6KB) — ✅ Done
- Phone+password, Zod `loginSchema`, demo login, forgot password link
- Phone regex: `(06|07)\d{8}` or `+212(6|7)\d{8}`, password ≥6 chars
- Success → OTP or tabs; Failure → inline error

### Register (`(auth)/register.tsx`, 28.1KB) — ✅ Done
- Full name, phone, password, confirm password, city, terms checkbox
- Zod `registerSchema`: name≥2, phone regex, password≥6, passwords match
- Success → OTP; Failure → inline field errors

### OTP (`(auth)/otp.tsx`, 10.9KB) — ✅ Done
- 4-6 digit code input, 60s resend timer, Infobip verify
- Success → tabs; Failure → "رمز غير صحيح"

### Forgot Password — ❌ Missing
- Link exists on login screen but no screen file found

---

## Tab Screens

### Home (`(tabs)/index.tsx`, 24.7KB) — ✅ Done
- Location header, search bar, 5 service tiles (food/grocery/pharmacy/parcel/errand)
- Promo banner, "near you" store list, active order card, quick actions
- Data: `storeApi` → `fallbackApi`; Loading: skeleton grid; Empty: "لا توجد متاجر"

### Search (`(tabs)/search.tsx`, 29.3KB) — ✅ Done
- Full-text search, filter tabs (Restaurants/Products/Stores), recent searches, trending
- Data: `storeApi.searchStores()` + fallback; Empty: "لا توجد نتائج"

### Orders (`(tabs)/orders.tsx`, 28.4KB) — ✅ Done
- Filter tabs (All/Active/Completed/Cancelled), active order banner, history list
- Components: OrderCard, StatusBadge, ProgressTimeline, EmptyState

### Chat (`(tabs)/chat.tsx`, 16.8KB) — ✅ Done
- Conversation list per order with driver avatar, last message, unread count

### Profile (`(tabs)/profile.tsx`, 13.4KB) — ✅ Done
- Avatar+name+phone, stats row, menu items (orders/addresses/favorites/settings/FAQ/logout)

### Wallet (`(tabs)/wallet.tsx`, 129 bytes) — ⚠️ Stub
- Only placeholder. API (`walletApi.ts`) and DB tables exist but no UI.

---

## Flow Screens

### Category (`(flows)/category/[id].tsx`, 17.3KB) — ✅ Done
- Store listing filtered by service category. Entry: home service tile tap.

### Store Details (`(flows)/store/[id].tsx`, 29.8KB) — ✅ Done
- Cover image, store info (rating/time/fee), menu category tabs, item grid, reviews section
- Buttons: Add to Cart (per item), Favorite toggle, Cart FAB with count
- Data: `storeApi` → fallback TheMealDB

### Cart (`(flows)/cart.tsx`, 21.2KB) — ✅ Done
- Item list with +/- quantity, remove, promo code input, order summary totals
- Buttons: Checkout (RED), Clear Cart, Continue Shopping

### Checkout (`(flows)/checkout.tsx`, 30KB) — ✅ Done
- Address selector+map, time slot, payment method (cash/card), notes, promo, place order
- Validation: `checkoutSchema` (address≥3, notes≤200)
- Success: creates order → confirmation; Failure: toast error

### Confirmation (`(flows)/confirmation.tsx`, 8.8KB) — ✅ Done
- Success icon, order reference, ETA, Track Order / Back to Home buttons

### Custom Request (`(flows)/custom-request.tsx`, 26.5KB) — ✅ Done
- Errand form: title, description, category, pickup/dropoff addresses, estimated price

### Order Details (`(flows)/order/[id].tsx`, 30.2KB) — ✅ Done
- Full order breakdown: status, items, delivery info, payment, timeline, action buttons

### Tracking (`(flows)/tracking/[id].tsx`, 21.1KB) — ✅ Done (⚠️ Partial)
- Map with driver marker, 4-step status timeline, driver info card, ETA
- Buttons: Confirm Delivery (GREEN), Cancel (RED), Chat, Call
- ⚠️ Driver location may be mock data — no real-time streaming confirmed

### Chat Thread (`(flows)/chat/[id].tsx`, 10.6KB) — ✅ Done
- Message bubbles (user=right, driver=left), input bar, Supabase Realtime

### Other Flow Screens (all ✅ Done)
| Screen | File | Size | Key Features |
|--------|------|------|--------------|
| Addresses | `addresses.tsx` | 20.9KB | CRUD, map picker, default toggle |
| Profile Edit | `profile-edit.tsx` | 14.5KB | Name, avatar (image picker), city |
| Settings | `settings.tsx` | 23.3KB | Notification toggles, language, privacy, delete, logout |
| Favorites | `favorites.tsx` | 12.6KB | Store grid with unfavorite |
| Notifications | `notifications.tsx` | 9.7KB | List with read/unread |
| Payment Methods | `payment-methods.tsx` | 21.2KB | Stripe card add/remove/default |
| Payment Success | `payment-success.tsx` | 4KB | Stripe callback |
| FAQ | `faq.tsx` | 13.5KB | Accordion Q&A |
| Terms | `terms.tsx` | 9.3KB | Static legal text |
| Support Ticket | `support-ticket.tsx` | 15.6KB | Category, urgency, subject, message |
| Delete Account | `delete-account.tsx` | 17KB | Confirm + soft delete |

---

## Missing Screens
| Screen | Status | Notes |
|--------|--------|-------|
| Forgot Password | ❌ Missing | Link exists, no file |
| Wallet Full UI | ❌ Missing | Stub only (129 bytes) |
| Store Reviews Page | ❌ Missing | Reviews inline in store details only |
| Reorder Flow | ❌ Missing | Button may exist, no pre-fill logic |
| Referral/Invite | ❌ Missing | Not implemented |
| No Internet Full Screen | ⚠️ Partial | OfflineBanner exists, no full-page |
