# DATA AND SQL MODEL

> Generated: 2026-05-19 | Source: `supabase_schema.sql` (889 lines) + `shared/types.ts`

---

## Tables (from schema inspection)

### 1. `public.users` — User profiles
- **Purpose:** Extends Supabase `auth.users` with app-specific profile data
- **PK:** `id UUID` (references `auth.users(id)`)
- **Key Columns:** phone, full_name, email, avatar_url, role, trust_score, is_banned, city, language, is_plus_member, notification_enabled, notif_orders, notif_promos, location_share, push_token, deleted_at
- **Screens:** Profile, Profile Edit, Settings, Login, Register
- **RLS:** Users read/update own; admins read/update all
- **Trigger:** `on_auth_user_created` → auto-creates profile row

### 2. `public.stores` — Merchant/store listings
- **PK:** `id UUID`
- **Key Columns:** name, name_ar, description, category, cuisine_tags[], logo_url, cover_url, phone, whatsapp, address, city, lat, lng, rating_avg, is_open, is_featured, is_verified, delivery_fee, min_order, delivery_time, opening_hours (JSONB), owner_id
- **Screens:** Home, Search, Category, Store Details, Favorites
- **RLS:** Public read; admin full CRUD

### 3. `public.menu_categories` — Menu sections within stores
- **PK:** `id UUID`
- **FK:** store_id → stores(id)
- **Key Columns:** name, name_ar, sort_order, is_active

### 4. `public.menu_items` — Products/dishes
- **PK:** `id UUID`
- **FK:** store_id → stores(id), category_id → menu_categories(id)
- **Key Columns:** name, name_ar, description, price, image_url, is_available, is_featured, is_popular, sort_order, calories, allergens[], options (JSONB)
- **Screens:** Store Details, Cart, Order Details

### 5. `public.user_addresses` — Saved delivery addresses
- **PK:** `id UUID`
- **FK:** user_id → users(id)
- **Key Columns:** label, address, lat, lng, is_default, notes
- **RLS:** Own user only

### 6. `public.drivers` — Delivery drivers
- **PK:** `id UUID`
- **FK:** user_id → users(id)
- **Key Columns:** full_name, phone, avatar_url, vehicle_type, vehicle_plate, is_online, is_verified, rating_avg, current_lat, current_lng, city, kyc_status, kyc_note, jobs_completed, rib, bank_name, cod_balance_centimes, earnings_centimes

### 7. `public.orders` — All orders
- **PK:** `id UUID`
- **FK:** user_id → users(id), store_id → stores(id), driver_id → drivers(id)
- **Key Columns:** status, payment_status, payment_method, delivery_address, delivery_lat, delivery_lng, notes, subtotal, delivery_fee, discount, total_amount, eta, picked_up_at, delivered_at, cancelled_reason, heading_to_pickup_at, arrived_pickup_at, arrived_customer_at
- **⚠️ CONFLICT:** Schema CHECK: `pending,confirmed,preparing,picked_up,delivered,completed,cancelled`. But `shared/types.ts` defines: `pending_moderation,pending_driver,driver_assigned,in_progress,picked_up,delivered,completed,cancelled,disputed,moderation_rejected`. These are **incompatible**.

### 8. `public.order_items` — Line items per order
- **PK:** `id UUID`
- **FK:** order_id → orders(id), menu_item_id → menu_items(id)
- **Key Columns:** quantity, unit_price, total_price, notes

### 9. `public.store_reviews` — User reviews of stores
- **PK:** `id UUID`
- **FK:** store_id → stores(id), user_id → users(id), order_id → orders(id)
- **Unique:** (store_id, user_id, order_id)

### 10. `public.notifications` — Push/in-app notifications
- **PK:** `id UUID`
- **FK:** user_id → users(id)
- **Key Columns:** title, body, type, data (JSONB), is_read

### 11. `public.favorites` — User favorite stores
- **PK:** `id UUID`
- **FK:** user_id → users(id), store_id → stores(id)
- **Unique:** (user_id, store_id)

### 12. `public.wallets` — User wallet balances
- **PK:** `id UUID`
- **FK:** user_id → users(id) (UNIQUE)
- **Key Columns:** balance_centimes (integer ≥ 0), is_frozen, frozen_reason, frozen_at, frozen_by
- **Trigger:** Auto-created when user is created

### 13. `public.wallet_transactions` — Wallet ledger
- **PK:** `id UUID`
- **FK:** wallet_id → wallets(id), user_id → users(id)
- **Key Columns:** type (credit/debit/refund/admin_adjustment/payout/cod_settle/topup), direction (credit/debit), amount_centimes, label, sublabel, ref_id

### 14. `public.support_requests` — Customer support tickets
- **PK:** `id UUID`
- **FK:** user_id → users(id)
- **Key Columns:** category, urgency, subject, message, order_id, ref_number, status (open/in_progress/resolved/closed), admin_note

### 15. `public.chat_messages` — Order-level chat
- **PK:** `id UUID`
- **FK:** sender_id → users(id)
- **Key Columns:** order_id, sender_role, text, sent_at
- **Index:** (order_id, sent_at)
- **Realtime:** Enabled

### 16. `public.admins` — Admin panel users (separate from users table)
- **PK:** `id UUID`
- **FK:** auth_id → auth.users(id)
- **Key Columns:** email, full_name, role (super_admin/admin/manager/support), is_active

### 17. `public.driver_documents` — KYC uploads
- **PK:** `id UUID`
- **FK:** driver_id → drivers(id)
- **Key Columns:** doc_type (cin_front/cin_back/selfie/permis/carte_grise/assurance), url, status, rejection_reason

### 18. `public.payout_requests` — Driver payout requests
- **PK:** `id UUID`
- **FK:** driver_id → drivers(id)
- **Key Columns:** amount_centimes, rib, bank_name, status (pending/approved/paid/rejected), admin_note

### 19. `public.cod_settlements` — Cash-on-delivery settlements
- **PK:** `id UUID`
- **FK:** driver_id → drivers(id)
- **Key Columns:** amount_centimes, method, status (pending/confirmed/disputed)

---

## Relationship Map

```
auth.users ──1:1──► public.users ──1:1──► public.wallets
                         │
                         ├──1:N──► public.user_addresses
                         ├──1:N──► public.orders
                         ├──1:N──► public.support_requests
                         ├──1:N──► public.notifications
                         ├──1:N──► public.favorites ◄──N:1──► public.stores
                         └──1:1──► public.drivers
                                       │
                                       ├──1:N──► public.driver_documents
                                       ├──1:N──► public.payout_requests
                                       └──1:N──► public.cod_settlements

public.stores ──1:N──► public.menu_categories ──1:N──► public.menu_items
              ──1:N──► public.store_reviews

public.orders ──1:N──► public.order_items ──N:1──► public.menu_items
              ──N:1──► public.drivers
              ──N:1──► public.stores
              ──1:N──► public.chat_messages

public.wallets ──1:N──► public.wallet_transactions

auth.users ──1:1──► public.admins (separate from public.users)
```

---

## ⚠️ Critical Conflict: Order Status Values

**In `supabase_schema.sql` (orders table CHECK constraint):**
`pending`, `confirmed`, `preparing`, `picked_up`, `delivered`, `completed`, `cancelled`

**In `shared/types.ts` (TypeScript OrderStatus):**
`pending_moderation`, `pending_driver`, `driver_assigned`, `in_progress`, `picked_up`, `delivered`, `completed`, `cancelled`, `disputed`, `moderation_rejected`

**In `shared/constants.ts` (valid transitions):**
Uses the TypeScript version (moderation-based)

**In `admin-api.js` (order update):**
Uses the schema version: `pending, confirmed, preparing, picked_up, delivered, completed, cancelled`

**Resolution needed:** The database schema and the TypeScript types define **different order status enums**. Either the schema needs to be updated to match the types, or the types need to match the schema. Currently, creating orders via the user app API with statuses from `types.ts` would **fail the CHECK constraint**.

---

## Tables Mentioned in Types But Not in Schema

| Type Interface | Schema Table | Status |
|----------------|-------------|--------|
| `OrderModeration` | `order_moderation` | ❌ Table not found in schema |
| `OrderStatusLog` | `order_status_log` | ❌ Table not found in schema |
| `Review` (driver reviews) | `reviews` | ❌ Only `store_reviews` exists |
| `PromoCode` | `promo_codes` | ❌ Promotions in local PG only |
| `PromoBanner` | — | ❌ No table found |
