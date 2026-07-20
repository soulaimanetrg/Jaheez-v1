# 7. DATA AND SQL MODEL — JAHEEZ

**Purpose:** Document database structure and relationships | **Last Updated:** 2026-05-19

---

## Core Tables & Relationships

### TABLE 1: users (Extends auth.users)

**Implementation Status:** ✅ Exists in schema | Used by app | Verification needed

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','driver','admin')),
  trust_score INTEGER NOT NULL DEFAULT 50,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  city TEXT NOT NULL DEFAULT 'آسفي',
  language TEXT NOT NULL DEFAULT 'ar' CHECK (language IN ('ar','fr','en')),
  is_plus_member BOOLEAN NOT NULL DEFAULT FALSE,
  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** User accounts (customers, drivers, admins)  
**Screens using this:** Every auth screen, profile, registration  
**Used by:** authStore, profileStore, User app + Driver app + Admin  
**RLS Policy:** Users can READ/UPDATE own record only (except admin)  
**Indexes:** phone (unique), role, city, is_banned

**Relationships:**
- 1:1 with auth.users (via id reference)
- 1:N with user_addresses
- 1:N with orders (as user_id)
- 1:1 with wallets
- 1:1 with drivers (via user_id, if driver)

---

### TABLE 2: stores

**Implementation Status:** ✅ Exists in schema | Used by app | Verification needed

```sql
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL CHECK (category IN ('food','grocery','pharmacy','parcel','errand')),
  cuisine_tags TEXT[] DEFAULT '{}',
  logo_url TEXT,
  cover_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  address_ar TEXT,
  city TEXT NOT NULL DEFAULT 'آسفي',
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_open BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  delivery_fee DECIMAL(8,2) DEFAULT 15.00,
  min_order DECIMAL(8,2) DEFAULT 0,
  delivery_time INTEGER DEFAULT 30, -- minutes
  opening_hours JSONB DEFAULT '{}',
  owner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Restaurant/store/pharmacy listings  
**Screens using this:** Home, Search, Category, Store detail  
**Queried by:** Home screen (`useFeaturedStores`), Search screen  
**Relationships:**
- N:1 with users (owner_id)
- 1:N with menu_categories
- 1:N with menu_items
- 1:N with orders
- N:N with users via user_favorites

**Key fields:**
- `category`: Filter by service type (food, grocery, etc.)
- `is_featured`: Featured on home screen
- `is_open`: Open/closed status
- `delivery_fee`: Charge per order
- `lat/lng`: For distance-based filtering
- `opening_hours`: JSONB with hours per day

---

### TABLE 3: menu_categories

**Implementation Status:** ✅ Exists in schema | Used by app | Verification needed

```sql
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Menu section grouping (appetizers, mains, desserts)  
**Screens using this:** Store detail menu tabs  
**Relationships:**
- N:1 with stores (store_id)
- 1:N with menu_items

---

### TABLE 4: menu_items

**Implementation Status:** ✅ Exists in schema | Used by app | Verification needed

```sql
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  price DECIMAL(8,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  calories INTEGER,
  allergens TEXT[] DEFAULT '{}',
  options JSONB NOT NULL DEFAULT '[]', -- size, extras, etc.
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Individual menu items (dish, product, service)  
**Screens using this:** Store detail, Menu browsing, Cart  
**Data used:** Name, price, image, options (size, extras)  
**Relationships:**
- N:1 with stores
- N:1 with menu_categories (optional)
- 1:N with order_items

**Key fields:**
- `price`: In centimes internally (divide by 100 for display)
- `options`: JSONB array: `[{name: "Size", choices: ["Small", "Large"]}, {name: "Extra", choices: [...]}]`
- `is_available`: Stock management
- `allergens`: Array of allergen tags

---

### TABLE 5: user_addresses

**Implementation Status:** ✅ Exists in schema | Used by app | Verification needed

```sql
CREATE TABLE public.user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'المنزل', -- "Home" in Arabic
  address TEXT NOT NULL,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  is_default BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Delivery addresses for users  
**Screens using this:** Addresses list, Checkout address selector  
**Relationships:**
- N:1 with users (user_id)
- 1:N with orders (as delivery address reference)

**Key fields:**
- `label`: "Home", "Office", "Parents' house", etc.
- `lat/lng`: For calculating delivery distance and routing
- `is_default`: One per user

---

### TABLE 6: drivers

**Implementation Status:** ✅ Exists in schema | Used by app | Verification needed

```sql
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  vehicle_type TEXT DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle','bicycle','car','on_foot')),
  vehicle_plate TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  current_lat DECIMAL(10,7),
  current_lng DECIMAL(10,7),
  city TEXT DEFAULT 'آسفي',
  verification_doc_url TEXT, -- URL to ID/license document uploaded in Supabase Storage '/verifications/' bucket
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Driver profile info  
**Screens using this:** Driver app (home, profile), Admin (driver management), User app (tracking)  
**Verification:** Documents (National ID, driver license) must be uploaded to `/verifications/` bucket before approval.
**Relationships:**
- 1:1 with users (user_id)
- 1:N with orders (as driver_id)
- 1:N with driver_locations (realtime GPS)
- 1:N with reviews (driver rating)

---

### TABLE 7: orders

**Implementation Status:** ✅ Exists in schema | Used by app | Verification needed

```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  driver_id UUID REFERENCES public.drivers(id),
  status TEXT NOT NULL DEFAULT 'pending_moderation'
    CHECK (status IN ('pending_moderation','pending_driver','driver_assigned','in_progress','picked_up','delivered','completed','cancelled','disputed','moderation_rejected')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_method TEXT NOT NULL DEFAULT 'cash' -- Defaults to 'cash' (COD) in V1. 'card' and 'wallet' check values are disabled in UI.
    CHECK (payment_method IN ('cash','card','wallet')),
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10,7), -- Deferred/Optional in V1 (defaults to default city coordinates)
  delivery_lng DECIMAL(10,7), -- Deferred/Optional in V1 (defaults to default city coordinates)
  notes TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 15,
  discount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  eta TEXT,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Order records  
**Screens using this:** Orders history, Order detail, Tracking, Admin orders  
**Order lifecycle:** pending_moderation → pending_driver → driver_assigned → in_progress → picked_up → delivered → completed  
**Relationships:**
- N:1 with users (user_id)
- N:1 with stores (store_id)
- N:1 with drivers (driver_id, nullable)
- 1:N with order_items
- 1:N with order_status_log
- 1:1 with payments (optional)

---

### TABLE 8: order_items

**Implementation Status:** ✅ Exists in schema | Used by app | Verification needed

```sql
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  options JSONB DEFAULT '{}', -- selected size, extras
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Line items in an order  
**Screens using this:** Order detail, Cart, Order confirmation  
**Relationships:**
- N:1 with orders
- N:1 with menu_items

---

### TABLE 9: order_status_log

**Implementation Status:** ✅ Exists in schema | Used by app | Verification needed

```sql
CREATE TABLE public.order_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by TEXT, -- 'user', 'driver', 'admin', 'system'
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Audit log of order status changes  
**Screens using this:** Order detail (timeline view)  
**Relationships:**
- N:1 with orders

---

### TABLE 10: wallets

**Implementation Status:** ✅ Exists in schema | Mock/fallback only | Needs Phase 9 UI implementation

```sql
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MAD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** User's prepaid balance  
**Screens using this:** Wallet tab (MISSING), Checkout  
**Relationships:**
- 1:1 with users
- 1:N with wallet_transactions

---

### TABLE 11: wallet_transactions

**Implementation Status:** ✅ Exists in schema | Mock/fallback only | Needs Phase 9 implementation

```sql
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('top_up','payment','refund','bonus','adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2),
  balance_after DECIMAL(10,2),
  reference_id UUID, -- order_id, payment_id, etc.
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Wallet transaction history  
**Screens using this:** Wallet tab (MISSING)  
**Relationships:**
- N:1 with wallets

---

### TABLE 12: payments

**Implementation Status:** ✅ Exists in schema | Needs verification | Stripe integration unclear

```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','card','wallet')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  stripe_payment_intent_id TEXT, -- for card payments
  transaction_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Payment records (one per order)  
**Screens using this:** Admin payments, Finance reporting  
**Relationships:**
- 1:1 with orders

---

### TABLE 13: support_requests

**Implementation Status:** ✅ Exists in schema | Used by app | Verification needed

```sql
CREATE TABLE public.support_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  order_id UUID REFERENCES public.orders(id),
  category TEXT NOT NULL CHECK (category IN ('bug','payment','delivery','account','other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Support tickets. (Note: Bypassed in user-app V1 in favor of direct WhatsApp deep-linking; this table is reserved for V2 database support).
**Screens using this:** Support form (V2), Admin support page (V2)
**Relationships:**
- N:1 with users
- N:1 with orders (optional)

---

### TABLE 14: reviews

**Implementation Status:** ✅ Exists in schema | Needs Phase X implementation | Review form missing

```sql
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  store_id UUID REFERENCES public.stores(id),
  driver_id UUID REFERENCES public.drivers(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Ratings and reviews  
**Screens using this:** Store detail (ratings), Review form (MISSING)  
**Relationships:**
- 1:1 with orders
- N:1 with users
- N:1 with stores
- N:1 with drivers

---

### TABLE 15: chat_messages

**Implementation Status:** ✅ Exists in schema | Needs verification | Realtime status unknown

```sql
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  receiver_id UUID NOT NULL REFERENCES public.users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** In-order chat messages  
**Screens using this:** Chat tab / In-order chat  
**Realtime:** Supabase Realtime subscriptions (status: needs verification)  
**Relationships:**
- N:1 with orders
- N:1 with users (sender + receiver)

---

## Additional Tables (For Admin/Moderation)

| Table | Purpose | Key Fields |
|---|---|---|
| **fraud_flags** | Mark suspicious orders | order_id, severity, reason |
| **banned_keywords** | Content moderation list | keyword, category, severity |
| **moderation_rules** | AI moderation thresholds | rule_name, threshold, action |
| **notifications** | Push notification queue | user_id, title, body, type, sent_at |
| **promotions** | Promo codes and deals | code, discount, min_order, expiry |
| **menu_favorites** | User's saved stores | user_id, store_id |
| **driver_locations** | Real-time GPS tracking | driver_id, lat, lng, timestamp |
| **audit_logs** | Admin action logging | admin_id, action, table_name, old_values, new_values |

---

## Data Relationships Diagram

```
users (1) ──────→ user_addresses (N)
         │
         ├─→ orders (N) ──→ order_items (N) ──→ menu_items
         │        │
         │        ├─→ payments
         │        ├─→ order_status_log
         │        ├─→ reviews ──→ drivers
         │        └─→ chat_messages
         │
         ├─→ wallets ──→ wallet_transactions
         │
         ├─→ support_requests
         │
         └─→ drivers (1) ──→ driver_locations
                      │
                      └─→ reviews

stores (1) ──→ menu_categories (N)
       │           │
       │           └─→ menu_items (N)
       │                    │
       │                    └─→ order_items
       │
       └─→ orders (N)
```

---

## RLS (Row-Level Security) Policies

| Table | Policy | Who | Condition |
|---|---|---|---|
| **users** | SELECT | Self | `auth.uid() = users.id` |
| **users** | UPDATE | Self | `auth.uid() = users.id` |
| **orders** | SELECT | User/Driver/Admin | User sees own, driver sees assigned, admin sees all |
| **order_items** | SELECT | User/Driver | Related order must be readable |
| **wallets** | SELECT | User | Must be owner |
| **chat_messages** | INSERT | User | Must be order participant |
| **reviews** | INSERT | User | Must be order user_id |
| **support_requests** | SELECT | User/Admin | User sees own, admin sees all |

---

## Constraints & Indexes

| Table | Constraint / Index | Purpose |
|---|---|---|
| **users** | UNIQUE(phone) | Prevent duplicate phone registration |
| **drivers** | UNIQUE(user_id) | One driver per user |
| **wallets** | UNIQUE(user_id) | One wallet per user |
| **orders** | status CHECK | Ensure valid status |
| **menu_items** | price > 0 | Prevent invalid prices |
| **orders** | delivery_time INDEX | Speed up filtering by delivery time |
| **stores** | lat/lng INDEX | Geographic searches |
| **chat_messages** | order_id INDEX | Fast message lookups |

---

**Created:** 2026-05-19 | **Method:** SQL schema inspection | **Confidence:** Very High
