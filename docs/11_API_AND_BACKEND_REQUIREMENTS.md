# 11. API AND BACKEND REQUIREMENTS — JAHEEZ

**Purpose:** Document backend API needs and integration points | **Last Updated:** 2026-05-19

---

## Existing API Files Found

| File | Purpose | Status |
|------|---------|--------|
| `user-app/lib/authApi.ts` | User authentication | ✅ Exists |
| `user-app/lib/api.ts` | General API client | ✅ Exists |
| `user-app/lib/supabase.ts` | Supabase configuration | ✅ Exists |
| `driver-app/lib/api.ts` | Driver API client | 🟡 Likely incomplete |
| `admin/src/lib/api.ts` | Admin API client (JWT) | ✅ Exists |
| `scripts/admin-api.js` | Express.js backend | ✅ Exists (146KB) |

---

## Required API Endpoints

### Authentication Endpoints

| Endpoint | Method | Request | Response | Status |
|----------|--------|---------|----------|--------|
| `/auth/login` | POST | `{phone, password}` OR `{email, password}` | `{user, session, otp_required?}` | ⚠️ Unclear |
| `/auth/register` | POST | `{full_name, phone, password, city, email?}` | `{user, pending_otp}` | ⚠️ Unclear |
| `/auth/verify-otp` | POST | `{phone, otp_code}` | `{user, session}` | ⚠️ Unclear |
| `/auth/resend-otp` | POST | `{phone}` | `{success, message}` | ⚠️ Unclear |
| `/auth/login-google` | POST | `{id_token}` | `{user, session}` | ❌ Unknown |
| `/auth/forgot-password` | POST | `{email}` | `{success}` | ⚠️ Not implemented |
| `/auth/reset-password` | POST | `{token, new_password}` | `{success}` | ⚠️ Not implemented |
| `/auth/logout` | POST | `{}` | `{success}` | ⚠️ Unclear |
| `/users/profile` | GET | - | `{user}` | ⚠️ Unclear |
| `/users/profile` | PATCH | `{full_name?, email?, city?, language?, avatar_file?}` | `{user}` | ⚠️ Unclear |
| `/users/delete-account` | POST | `{password}` | `{success}` | ⚠️ Unclear |

---

### Store Endpoints

| Endpoint | Method | Request | Response | Screens |
|----------|--------|---------|----------|---------|
| `/stores/featured` | GET | - | `{stores[]}` | Home |
| `/stores/search` | GET | `?q=name&category=food&rating=4.5&sort=rating` | `{stores[], total, page}` | Search |
| `/stores/[id]` | GET | - | `{store, menu_categories[], menu_items[]}` | Store detail |
| `/stores` | POST | (admin) `{name, category, address}` | `{store}` | Admin |
| `/stores/[id]` | PATCH | (admin) `{name, is_open}` | `{store}` | Admin |
| `/stores/[id]/menu-items` | GET | - | `{items[]}` | Store detail |

---

### Order Endpoints

| Endpoint | Method | Request | Response | Screens |
|----------|--------|---------|----------|---------|
| `/orders` | POST | `{store_id, items[], address_id?, payment_method, promo_code?}` | `{order}` | Checkout |
| `/orders/[id]` | GET | - | `{order, items[], status_log[]}` | Order detail |
| `/orders` | GET | `?status=active` or `?status=completed` | `{orders[], total}` | Orders tab |
| `/orders/[id]/status` | PATCH | (admin) `{status, reason?}` | `{order}` | Admin |
| `/orders/[id]/cancel` | POST | `{reason}` | `{order, refund}` | User/Admin |
| `/orders/[id]/refund` | POST | (admin) `{}` | `{order, refund_status}` | Admin |

---

### Address Endpoints

| Endpoint | Method | Request | Response | Screens |
|----------|--------|---------|----------|---------|
| `/addresses` | GET | - | `{addresses[]}` | Addresses, Checkout |
| `/addresses` | POST | `{label, address, lat?, lng?, is_default?}` | `{address}` | Add address |
| `/addresses/[id]` | PATCH | `{label?, address?, is_default?}` | `{address}` | Edit address |
| `/addresses/[id]` | DELETE | - | `{success}` | Addresses |

---

### Wallet Endpoints

| Endpoint | Method | Request | Response | Screens |
|----------|--------|---------|----------|---------|
| `/wallets/balance` | GET | - | `{balance, currency}` | Wallet tab (MISSING) |
| `/wallets/transactions` | GET | `?limit=20&offset=0` | `{transactions[], total}` | Wallet tab (MISSING) |
| `/wallets/top-up` | POST | `{amount, payment_method}` | `{transaction, payment_intent}` | Wallet tab (MISSING) |
| `/wallets/transactions/[id]` | GET | - | `{transaction}` | Wallet detail |

---

### Payment Endpoints

| Endpoint | Method | Request | Response | Screens |
|----------|--------|---------|----------|---------|
| `/payments/intent` | POST | `{order_id, amount, currency}` | `{client_secret, payment_intent_id}` | Checkout (Stripe) |
| `/payments/confirm` | POST | `{payment_intent_id}` | `{status, order_id}` | Checkout (Stripe) |
| `/payments/[id]` | GET | - | `{payment}` | Admin |
| `/payments/refund` | POST | `{payment_id, reason?}` | `{refund_status}` | Admin |

---

### Chat Endpoints

| Endpoint | Method | Request | Response | Screens |
|----------|--------|---------|----------|---------|
| `/messages` | GET | `?order_id=xxx` | `{messages[]}` | Chat/Tracking |
| `/messages` | POST | `{order_id, message}` | `{message}` | Chat |
| `/messages/subscribe` | WebSocket | (Supabase Realtime) | Real-time updates | Chat |

---

### Support Endpoints

| Endpoint | Method | Request | Response | Screens |
|----------|--------|---------|----------|---------|
| `/support-requests` | POST | `{category, order_id?, subject, description, attachments?}` | `{ticket}` | Support form |
| `/support-requests/[id]` | GET | - | `{ticket, messages[]}` | Support detail |
| `/support-requests` | GET | (admin) - | `{tickets[], total}` | Admin support |
| `/support-requests/[id]/reply` | POST | (admin) `{message, attachment?}` | `{ticket}` | Admin support |

---

### Driver Endpoints

| Endpoint | Method | Request | Response | Screens |
|----------|--------|---------|----------|---------|
| `/drivers/register` | POST | `{full_name, phone, vehicle_type, vehicle_plate}` | `{driver, pending_verification}` | Driver register |
| `/drivers/[id]` | GET | - | `{driver, location}` | Driver profile |
| `/drivers/[id]` | PATCH | `{avatar_file?, city?, vehicle_type?}` | `{driver}` | Driver profile edit |
| `/drivers/online` | PATCH | `{is_online}` | `{driver}` | Driver app |
| `/drivers/location` | PATCH | `{lat, lng}` | `{success}` | Driver app (realtime GPS) |
| `/drivers/orders` | GET | `?status=available` | `{orders[]}` | Driver app home |
| `/drivers/orders/[id]/accept` | POST | - | `{order, assignment}` | Driver app |
| `/drivers/orders/[id]/reject` | POST | `{reason?}` | `{success}` | Driver app |
| `/drivers/earnings` | GET | `?start_date=2026-01-01&end_date=2026-02-01` | `{total, trips, average_rating}` | Driver earnings |
| `/drivers/payouts` | GET | - | `{payouts[]}` | Driver app |
| `/drivers/payouts` | POST | `{amount, bank_account}` | `{payout_request}` | Driver app |
| `/drivers/[id]/verify` | PATCH | (admin) `{approved: boolean}` | `{driver}` | Admin drivers |

---

### Promotion Endpoints

| Endpoint | Method | Request | Response | Screens |
|----------|--------|---------|----------|---------|
| `/promotions/active` | GET | - | `{promotions[]}` | Home (promo banner) |
| `/promotions/validate` | POST | `{code, order_total}` | `{discount, amount}` or error | Cart/Checkout |
| `/promotions` | GET | (admin) - | `{promotions[]}` | Admin promotions |
| `/promotions` | POST | (admin) `{code, discount, expiry}` | `{promo}` | Admin promotions |

---

### Notification Endpoints

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/notifications/subscribe` | WebSocket | `{user_id, push_token}` | Real-time notifications |
| `/notifications` | GET | - | `{notifications[]}` |
| `/notifications/[id]/mark-read` | PATCH | - | `{notification}` |

---

## External Service Integration & V1 Limits

### Supabase (Auth, DB, Realtime, Storage)
- **Used for:** User Auth (Email OTP), Postgres Database, Storage (`/verifications/` for drivers, `/avatars/` for profiles), Realtime (order status updates).
- **Files:** `user-app/lib/supabase.ts`, `driver-app/lib/supabase.ts`
- **Config:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- **Status:** ✅ Active core backend.

### Infobip (SMS OTP) (V1 DEPRECATED)
- **Status:** **Disabled/Bypassed for V1.** Replaced entirely by Supabase Email OTP verification to eliminate SMS costs and complex gateway configs.

### Stripe (Card Payments) (V1 DEPRECATED)
- **Status:** **Disabled/Bypassed for V1.** Cash on Delivery (COD) is the exclusive payment method for V1 to eliminate credit card processing setup costs.

### Google Maps API (V1 DEPRECATED)
- **Status:** **Disabled/Bypassed for V1.** Map displays, geocoding search, and real-time path calculation are hidden/disabled in V1 UI. Addresses are entered strictly via descriptive text fields (min 15 characters).

### ModernMT (Translation) (V1 DEPRECATED)
- **Status:** **Disabled/Bypassed for V1.** Replaced by static translations inside the local translations structure to avoid translation API charges.

### FCM/APNs (Push Notifications) (V1 DEPRECATED)
- **Status:** **Disabled/Bypassed for V1.** App tracking is status-based and uses in-app status checks on screen pull-down/timeline mounts. No push server setup.

---

## Backend Deployment Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Supabase project** | ⚠️ Unknown | Schema exists but unclear if deployed |
| **Admin API** | ⚠️ Unknown | Express.js app exists, deployment status unclear |
| **Edge Functions** | ❌ Missing | No `/supabase/functions/` directory |
| **Database migrations** | 🟡 Pending | SQL file exists, apply status unknown |
| **Environment secrets** | 🔴 High risk | Exposed in .env (should use Expo secrets) |

---

## API Design Notes

### Error Handling
All endpoints should return:
```json
{
  "success": true/false,
  "data": {},
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error"
  }
}
```

### Pagination
```json
{
  "data": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  }
}
```

### Authentication
- JWT token in `Authorization: Bearer <token>` header
- Token refresh via `/auth/refresh` endpoint
- Expiry: Typically 1 hour (refresh token for 7 days)

### Rate Limiting
- Should implement: 100 requests/minute per IP
- 1000 requests/minute per authenticated user
- Return 429 Too Many Requests on limit

---

## Backend Implementation Roadmap

### Phase 1: Core APIs (CRITICAL)
1. Authentication endpoints (login, register, OTP)
2. Store endpoints (featured, search, detail)
3. Order creation and retrieval
4. Address management

### Phase 2: Payment & Wallet
1. Stripe payment processing
2. Wallet balance and transactions
3. Promo code validation

### Phase 3: Driver & Matching
1. Driver registration and verification
2. Order assignment algorithm
3. Real-time location tracking

### Phase 4: Support & Admin
1. Support ticket system
2. Admin CRUD endpoints
3. Analytics and reporting

---

**Created:** 2026-05-19 | **Method:** API file inspection + endpoint documentation review | **Confidence:** Medium (many integrations untested)
