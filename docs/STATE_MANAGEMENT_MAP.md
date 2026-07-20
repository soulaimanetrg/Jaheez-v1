# STATE MANAGEMENT MAP

> Generated: 2026-05-19 | Source: `store/`, `hooks/`, `lib/` inspection

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   UI Components  │────►│  Custom Hooks    │────►│  Zustand Stores │
│                  │     │  (React Query)   │     │  (Local State)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │                         │
                              ▼                         ▼
                        ┌──────────────┐         ┌──────────────┐
                        │  API Layer    │         │ AsyncStorage │
                        │  (lib/*.ts)   │         │ (Persist)    │
                        └──────────────┘         └──────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │   Supabase   │
                        │ (PostgreSQL) │
                        └──────────────┘
```

---

## Zustand Stores (6 total)

### 1. `authStore.ts` — Authentication State
| State | Type | Persisted? | Screens |
|-------|------|-----------|---------|
| `user` | User | null | ✅ Yes | All (via `useAuth`) |
| `isLoading` | boolean | No | Splash, Index |
| `isAuthenticated` | boolean | ✅ Yes | Index, AuthGuard |
| `hasCompletedOnboarding` | boolean | ✅ Yes | Index (redirect logic) |
| `pendingPhone` | string | null | No | OTP |

| Action | Trigger | Effect |
|--------|---------|--------|
| `setUser(user)` | Login/register success | Sets user, isAuthenticated=true, isLoading=false |
| `setLoading(bool)` | App init | Loading state |
| `completeOnboarding()` | Onboarding finish | hasCompletedOnboarding=true |
| `setPendingPhone(phone)` | Register → OTP | Stores phone for verification |
| `updateProfile(partial)` | Profile edit save | Merges updates into user |
| `logout()` | User logout | Clears user, isAuthenticated=false |

**Persist:** `jaheez-auth` key in AsyncStorage; only `user`, `isAuthenticated`, `hasCompletedOnboarding` are persisted.

### 2. `cartStore.ts` — Cart State
| State | Type | Persisted? | Screens |
|-------|------|-----------|---------|
| `items` | CartItem[] | No | Cart, Checkout |
| `storeId` | string | null | No | Cart, Store Details |
| `storeName` | string | No | Cart, Checkout |
| `deliveryFee` | number | No | Cart, Checkout |
| `promoCode` | string | null | No | Cart, Checkout |
| `promoDiscount` | number | No | Cart, Checkout |

| Computed | Returns |
|----------|---------|
| `getTotals()` | `{ subtotal, delivery_fee, promo_discount, total, item_count }` |
| `getItemCount()` | Total item quantity |
| `getItemById(id)` | Specific cart item |

| Action | Trigger | Effect |
|--------|---------|--------|
| `addItem(item)` | Store Details → Add | Adds item; if different store, clears cart first |
| `removeItem(id)` | Cart → remove | Removes item; if last item, resets cart |
| `updateQuantity(id, qty)` | Cart → +/- | Updates qty; if 0, removes |
| `setPromo(code, discount)` | Checkout promo apply | Sets promo code and discount |
| `clearCart()` | Checkout success, explicit clear | Resets all cart state |
| `setStore(id, name, fee)` | First item added | Sets store metadata |

**Not persisted.** Cart is lost on app restart. Intentional design choice.

### 3. `languageStore.ts` — Language & i18n State
| State | Type | Persisted? | Screens |
|-------|------|-----------|---------|
| `lang` | 'ar' | 'fr' | 'en' | ✅ Yes | All |
| `isRTL` | boolean | No (derived) | All |
| `t` | Translations | No (rebuilt) | All |
| `isTranslating` | boolean | No | All (shows loading) |

| Action | Trigger | Effect |
|--------|---------|--------|
| `setLang(lang)` | Settings language picker | 1) Sets hardcoded translations immediately. 2) Checks AsyncStorage cache. 3) Falls back to ModernMT API call. |

**Persist:** `jaheez-lang` key; only `lang` code persisted. Translations rebuilt on rehydrate.
**Default:** `fr` (French) — NOT Arabic.

### 4. `locationStore.ts` — User Location
| State | Type | Screens |
|-------|------|---------|
| `currentLocation` | { lat, lng } | null | Home, Checkout, Tracking |
| `hasPermission` | boolean | Home (request prompt) |
| `isLoading` | boolean | Home |

### 5. `orderStore.ts` — Active Order
| State | Type | Screens |
|-------|------|---------|
| `activeOrder` | Order | null | Home, Orders, Tracking |
| `isPolling` | boolean | Tracking |

### 6. `platformStore.ts` — Platform Config
| State | Type | Screens |
|-------|------|---------|
| `isUnderMaintenance` | boolean | All (shows MaintenanceBanner) |
| `forceUpdateRequired` | boolean | All (shows ForceUpdateModal) |
| `minVersion` | string | App version check |

---

## React Query Layer

### Query Hooks (`hooks/queries/`)
| Hook | Key | API Function | Stale Time | Screens |
|------|-----|-------------|------------|---------|
| `useStores(category?)` | `['stores', category]` | `storeApi.getStores()` | 5 min | Home, Search, Category |
| `useOrders(userId, page)` | `['orders', userId, page]` | `orderApi.getOrderHistory()` | 1 min | Orders |
| `useNotifications(userId)` | `['notifications', userId]` | `notificationInbox.getNotifications()` | 2 min | Notifications |
| `usePromotion(code)` | `['promo', code]` | promo validation | 0 (always fresh) | Checkout |
| `useSupportTickets(userId)` | `['support', userId]` | `supportApi.getTickets()` | 2 min | Support |
| `useWallet(userId)` | `['wallet', userId]` | `walletApi.getBalance()` | 1 min | Wallet (stub) |

### Mutation Hooks (`hooks/mutations/`)
| Hook | API Function | Invalidates | Screens |
|------|-------------|-------------|---------|
| `useCreateOrder` | `orderApi.createOrder()` | `['orders']` | Checkout |
| `useCancelOrder` | `api.cancelOrder()` | `['orders']` | Order Details, Tracking |
| `useConfirmDelivery` | `api.confirmDelivery()` | `['orders']` | Tracking |
| `useSubmitReview` | `api.submitReview()` | `['orders']` | Order Details |
| `useSendMessage` | `api.sendChatMessage()` | — (realtime) | Chat Thread |
| `useSubmitSupport` | `supportApi.createTicket()` | `['support']` | Support Ticket |

---

## Supabase Realtime Subscriptions

| Channel | Table | Filter | Used In |
|---------|-------|--------|---------|
| orders | orders | `user_id=eq.{userId}` | Orders, Tracking |
| drivers | drivers | — | Tracking (driver location) |
| notifications | notifications | `user_id=eq.{userId}` | Notifications |
| chat_messages | chat_messages | `order_id=eq.{orderId}` | Chat Thread |

---

## Data Flow for Key Scenarios

### Login Flow
```
Login Screen → authApi.login(phone, password)
  → Supabase auth.signInWithPassword()
  → Returns session + user
  → authStore.setUser(user)
  → authStore.setAuthenticated(true)
  → Router redirects to (tabs)
```

### Add to Cart Flow
```
Store Details → "Add" button pressed
  → cartStore.addItem(item)
    → If different storeId: confirmation dialog → clearCart first
    → If same item exists: increment quantity
    → Else: append to items array
  → Cart FAB badge updates (getItemCount())
```

### Place Order Flow
```
Checkout → "Place Order" pressed
  → useCreateOrder.mutate({
      items: cartStore.items,
      delivery_address, payment_method, notes
    })
  → api.createOrder() → Supabase orders.insert()
  → Success: cartStore.clearCart() → navigate to confirmation
  → Failure: toast error
```

### Language Change Flow
```
Settings → Language picker → setLang('en')
  → 1. Hardcoded EN translations applied IMMEDIATELY
  → 2. Check AsyncStorage for cached MMT overrides
    → If cache hit: merge → done
    → If cache miss:
      → 3. Call ModernMT API (background)
      → 4. Merge results → update store
      → 5. Persist to AsyncStorage cache
```

---

## ⚠️ Known Issues

1. **Dual i18n systems:** `languageStore.ts` (flat Translations) and `strings.ts` (nested STRINGS). Some screens may use one, others the other. Not unified.
2. **Cart not persisted:** If user closes app mid-cart, items are lost. Consider adding AsyncStorage persistence.
3. **Default language is French:** Users in Morocco (Arabic-first market) get French by default.
4. **No optimistic updates:** Mutations wait for server response before updating UI.
