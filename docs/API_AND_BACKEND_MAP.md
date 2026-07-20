# API AND BACKEND MAP

> Generated: 2026-05-19 | Source: `lib/`, `scripts/admin-api.js`, `.env`

---

## Backend Infrastructure

### Supabase (Primary)
| Service | URL | Usage |
|---------|-----|-------|
| Database | `lwgoiktmfbbtewujojor.supabase.co` | PostgreSQL with RLS |
| Auth | Same URL | Phone/password auth, OTP |
| Storage | Same URL | Avatar uploads, images |
| Realtime | Same URL | Orders, chat, notifications |

### Admin API (Express.js)
| Service | URL | Port |
|---------|-----|------|
| Admin API | `localhost:3001` | 3001 |
| Base Path | `/admin-api/*` | All endpoints prefixed |

### External APIs
| Service | Purpose | Key In |
|---------|---------|--------|
| Infobip | SMS OTP | `INFOBIP_API_KEY`, `INFOBIP_BASE_URL` |
| Stripe | Payments | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| ModernMT | Live translation | `EXPO_PUBLIC_MODERNMT_KEY` |
| Google Maps | Maps/geocoding | ⚠️ Key not found in .env |
| OpenStreetMap Overpass | Fallback store data | No key needed (public API) |
| TheMealDB | Fallback menu data | No key needed (public API) |
| Expo Push | Push notifications | No key needed (Expo token) |

---

## User App API Layer (`user-app/lib/`)

### `supabase.ts` — Client Init
```typescript
supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth config })
```
Fallback URL hardcoded if env var missing/malformed.

### `api.ts` — Core Order/Chat API (9 functions)
| Function | Method | Supabase Table | RLS | Notes |
|----------|--------|---------------|-----|-------|
| `getActiveOrder(userId)` | SELECT | orders | User only | Excludes terminal statuses |
| `getOrderById(orderId)` | SELECT | orders + driver + items + moderation | User only | Nested joins |
| `getOrderHistory(userId, page)` | SELECT | orders | User only | Paginated |
| `createOrder(input, userId)` | INSERT | orders | User only | Sets status='pending_driver' |
| `cancelOrder(orderId, reason)` | UPDATE | orders | User only | Validates transitions |
| `confirmDelivery(orderId)` | UPDATE | orders | User only | Sets status='completed' |
| `submitReview(orderId, rating, comment)` | INSERT | reviews | User only | Requires driver_id |
| `sendChatMessage(orderId, content, senderId)` | INSERT | chat_messages | User only | sender_role='user' |
| `getChatMessages(orderId)` | SELECT | chat_messages | User only | Ordered by created_at |

### `authApi.ts` — Auth Functions (18.9KB)
| Function | API | Notes |
|----------|-----|-------|
| `login(phone, password)` | Supabase auth.signInWithPassword | Returns session |
| `register(data)` | Supabase auth.signUp | Triggers user + wallet creation |
| `loginWithEmail(email, password)` | Supabase auth.signInWithPassword | Email variant |
| `registerWithEmail(data)` | Supabase auth.signUp | Email variant |
| `signOut()` | Supabase auth.signOut | Clears session |
| `deleteAccount()` | Supabase users.update(deleted_at) | Soft delete |
| `getCurrentUser()` | Supabase auth.getUser | Returns current session user |
| `updateProfile(updates)` | Supabase users.update | Profile fields |
| `uploadAvatar(uri)` | Supabase storage.upload | Returns public URL |

### `storeApi.ts` — Store/Menu Queries (9.6KB)
| Function | Supabase Table | Fallback |
|----------|---------------|----------|
| `getStores(category?)` | stores | `fallbackApi.getFallbackStores()` |
| `getStoreById(id)` | stores | `fallbackApi.getFallbackStoreById(id)` |
| `getMenuByStoreId(storeId)` | menu_categories + menu_items | `fallbackApi.getFallbackMenu(storeId)` |
| `searchStores(query)` | stores (ilike) | `fallbackApi.searchFallbackStores(query)` |
| `toggleFavorite(userId, storeId)` | favorites | None |
| `getFavorites(userId)` | favorites + stores | None |

### `orderApi.ts` — Order CRUD (7.9KB)
| Function | Supabase Table |
|----------|---------------|
| `createOrder(input)` | orders + order_items |
| `getOrderById(id)` | orders (joined) |
| `getOrderHistory(userId, page)` | orders |
| `getActiveOrders(userId)` | orders (non-terminal) |

### `walletApi.ts` — Wallet Operations
| Function | Supabase Table |
|----------|---------------|
| `getBalance(userId)` | wallets |
| `getTransactions(userId)` | wallet_transactions |

### `supportApi.ts` — Support Tickets
| Function | Supabase Table |
|----------|---------------|
| `createTicket(data)` | support_requests |
| `getTickets(userId)` | support_requests |

### `infobipOtp.ts` — SMS OTP
| Function | External API |
|----------|-------------|
| `sendOtp(phone)` | Infobip 2FA API |
| `verifyOtp(phone, code)` | Infobip 2FA verify |
| `sendSms(phone, text)` | Infobip SMS API |

### `stripeClient.ts` — Payment
| Function | External API |
|----------|-------------|
| `initStripe()` | Stripe SDK init |
| `createPaymentSheet(amount)` | Stripe PaymentSheet |

### `modernmt.ts` — Live Translation
| Function | External API |
|----------|-------------|
| `translateText(text, target)` | ModernMT translate API |
| `prewarmTranslations(texts, target)` | Batch translate for UI strings |

---

## Admin API Endpoints (`scripts/admin-api.js`)

### Auth (Local PostgreSQL)
| Method | Path | Auth | Role | Purpose |
|--------|------|------|------|---------|
| POST | `/admin-api/login` | None | None | Admin login (bcrypt + JWT) |
| GET | `/admin-api/me` | JWT | Any | Get current admin profile |

### Dashboard (Supabase)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/dashboard` | super_admin, ops, finance | Stats (orders today, revenue, users, drivers) |

### Orders (Supabase)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/orders` | super_admin, ops, finance | List orders |
| GET | `/admin-api/orders/:id/items` | super_admin, ops, finance | Order line items |
| PATCH | `/admin-api/orders/:id` | super_admin, ops | Update status/driver/notes |

### Stores (Supabase)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/stores` | super_admin, ops, content | List stores |
| POST | `/admin-api/stores` | super_admin, ops | Create store |
| PATCH | `/admin-api/stores/:id` | super_admin, ops | Update store |

### Products (Supabase)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/products` | super_admin, ops, content | List by store |
| POST | `/admin-api/products` | super_admin, ops | Create product |
| PATCH | `/admin-api/products/:id` | super_admin, ops | Update product |
| DELETE | `/admin-api/products/:id` | super_admin, ops | Delete product |

### Users (Supabase)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/users` | super_admin, ops, support | List users |
| PATCH | `/admin-api/users/:id` | super_admin, ops | Ban/unban |

### Drivers (Supabase)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/drivers` | super_admin, ops | List drivers |
| PATCH | `/admin-api/drivers/:id` | super_admin, ops | Update/verify |

### Support (Supabase)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/support` | super_admin, support | List tickets |
| PATCH | `/admin-api/support/:id` | super_admin, support | Update status |

### Promotions (Local PostgreSQL)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/promotions` | super_admin, ops, content | List promos |
| POST | `/admin-api/promotions` | super_admin, ops, content | Create promo |
| PATCH | `/admin-api/promotions/:id` | super_admin, ops, content | Update promo |
| DELETE | `/admin-api/promotions/:id` | super_admin, ops, content | Delete promo |

### Finance (Supabase + Local)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/finance/overview` | super_admin, finance | Revenue/costs |
| GET | `/admin-api/refunds` | super_admin, finance | List refunds |
| POST | `/admin-api/refunds` | super_admin, finance | Process refund |
| GET | `/admin-api/payout-requests` | super_admin, finance | List payouts |
| PATCH | `/admin-api/payout-requests/:id` | super_admin, finance | Approve/reject |
| GET | `/admin-api/cod-reconciliation` | super_admin, finance | COD settlements |

### Admin Management (Local PostgreSQL)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/admins` | super_admin | List admin users |
| POST | `/admin-api/admins` | super_admin | Create admin |
| PATCH | `/admin-api/admins/:id` | super_admin | Update role/active |
| DELETE | `/admin-api/admins/:id` | super_admin | Deactivate admin |

### Audit & Security
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | `/admin-api/audit-logs` | super_admin | View audit trail |

---

## Security Features in Admin API

| Feature | Implementation |
|---------|---------------|
| JWT Auth | `jsonwebtoken`, sliding 4h idle timeout, absolute expiry |
| RBAC | 5 roles: super_admin, operations, finance, support, content_manager |
| Lockout | 3 failed logins within 10 min → account locked for 10 min |
| Idle Timeout | 4-hour inactivity → session expired |
| Sliding Renewal | JWT re-signed on each request with updated `last_seen` |
| DB Role Refresh | Role checked against DB on every request (not cached in JWT) |
| Audit Logging | Failed logins, role denials, sensitive actions logged |
| CORS | Open (`origin: true`) — ⚠️ should be restricted in production |
| Token Kind | Only `kind: 'admin'` tokens accepted (prevents user/driver token reuse) |
| Mock Fallback | `admin@jaheez.ma/admin123` built-in — ⚠️ must remove for production |
