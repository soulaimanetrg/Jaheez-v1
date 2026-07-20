# JAHEEZ — Backend Prompts (A to Z)

> **How to use**: Copy-paste each prompt in order. Every prompt references the instruction files so the AI never drifts. Backend prompts are designed to work **in parallel with or after** Frontend Prompts M-Z (they share the same types and constants from Frontend Prompts A-B).

---

## PROMPT BA — Database Schema: Users & Drivers

```
MANDATORY CONTEXT — Read and obey these files before writing ANY code:
• docs/MASTER_INSTRUCTIONS.md (non-negotiable rules)
• docs/CODING_RULES_BACKEND.md (ALL sections — Supabase, RLS, schema rules)
• docs/ARCHITECTURE_GUIDE.md (Section 7 — Supabase Architecture)
• AGENTS.md (Supabase Tables section)

TASK: Create supabase/migrations/001_create_users.sql

CREATE TABLE users:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- phone VARCHAR(20) UNIQUE NOT NULL
- full_name VARCHAR(100) NOT NULL
- avatar_url TEXT
- role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user','driver','admin'))
- trust_score INTEGER DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100)
- is_banned BOOLEAN DEFAULT FALSE
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()

Enable RLS on users.
Policies:
- users_select_own: SELECT WHERE auth.uid() = id
- users_update_own: UPDATE WHERE auth.uid() = id
- users_insert_own: INSERT WHERE auth.uid() = id
- admin_select_all: SELECT WHERE auth.jwt()->>'role' = 'admin'

CREATE TABLE drivers:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL
- vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('motorcycle','car','bicycle','on_foot'))
- plate_number VARCHAR(20)
- is_online BOOLEAN DEFAULT FALSE
- is_approved BOOLEAN DEFAULT FALSE
- rating_avg DECIMAL(3,2) DEFAULT 0.00
- total_deliveries INTEGER DEFAULT 0
- current_zone VARCHAR(50)
- created_at TIMESTAMPTZ DEFAULT NOW()

Enable RLS. Policies:
- drivers_select_own: SELECT WHERE user_id = auth.uid()
- drivers_update_own: UPDATE WHERE user_id = auth.uid()
- admin_select_all: SELECT WHERE auth.jwt()->>'role' = 'admin'
- admin_update_all: UPDATE WHERE auth.jwt()->>'role' = 'admin'

Indexes on: users(phone), drivers(user_id), drivers(is_online, is_approved).
Include rollback comments (DROP TABLE IF EXISTS).
Show complete SQL.
```

---

## PROMPT BB — Database Schema: Orders & Moderation

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 5 — State Machine, Section 8 — Schema Rules)
• docs/ARCHITECTURE_GUIDE.md • AGENTS.md

PREVIOUS: 001_create_users.sql created users and drivers tables.

TASK: Create supabase/migrations/002_create_orders.sql

CREATE TABLE orders:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID REFERENCES users(id) NOT NULL
- driver_id UUID REFERENCES drivers(id)
- type VARCHAR(10) NOT NULL CHECK (type IN ('delivery','errand'))
- title VARCHAR(200) NOT NULL
- description TEXT
- category VARCHAR(30) CHECK (category IN ('food','grocery','pharmacy','custom_errand'))
- status VARCHAR(30) DEFAULT 'pending_moderation' CHECK (status IN ('pending_moderation','pending_driver','driver_assigned','in_progress','picked_up','delivered','completed','cancelled','disputed','moderation_rejected'))
- pickup_address TEXT
- pickup_lat DECIMAL(10,7)
- pickup_lng DECIMAL(10,7)
- dropoff_address TEXT NOT NULL
- dropoff_lat DECIMAL(10,7) NOT NULL
- dropoff_lng DECIMAL(10,7) NOT NULL
- estimated_price DECIMAL(10,2)
- final_price DECIMAL(10,2)
- moderation_status VARCHAR(20) DEFAULT 'pending'
- cancel_reason TEXT
- created_at TIMESTAMPTZ DEFAULT NOW()
- updated_at TIMESTAMPTZ DEFAULT NOW()

Enable RLS. Policies:
- users_select_own: SELECT WHERE user_id = auth.uid()
- users_insert: INSERT WHERE user_id = auth.uid()
- drivers_select_pending: SELECT WHERE status = 'pending_driver'
- drivers_select_assigned: SELECT WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
- drivers_update_assigned: UPDATE for assigned driver only + valid status transitions
- admin_all: full CRUD for admin role

CREATE TABLE order_moderation:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL
- decision VARCHAR(20) CHECK (decision IN ('approved','manual_review','rejected'))
- keyword_flags JSONB DEFAULT '[]'
- explanation TEXT
- reviewed_at TIMESTAMPTZ
- reviewed_by UUID REFERENCES users(id)
- reviewed_by UUID REFERENCES users(id)
- created_at TIMESTAMPTZ DEFAULT NOW()

RLS: users can SELECT their own order's moderation. Admin full access.

Indexes: orders(user_id), orders(driver_id), orders(status), orders(created_at DESC), order_moderation(order_id).
Show complete SQL.
```

---

## PROMPT BC — Database Schema: Chat, Payments, Locations

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md • docs/ARCHITECTURE_GUIDE.md • AGENTS.md

PREVIOUS: users, drivers, orders, order_moderation tables exist.

TASK: Create supabase/migrations/003_create_chat_payments_locations.sql

CREATE TABLE chat_messages:
- id UUID PK DEFAULT gen_random_uuid()
- order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL
- sender_id UUID REFERENCES users(id) NOT NULL
- sender_role VARCHAR(10) CHECK (sender_role IN ('user','driver','system'))
- content TEXT NOT NULL
- type VARCHAR(10) DEFAULT 'text' CHECK (type IN ('text','image','system'))
- media_url TEXT
- created_at TIMESTAMPTZ DEFAULT NOW()

RLS: users can SELECT/INSERT for their own orders. Drivers for assigned orders.

CREATE TABLE payments:
- id UUID PK, order_id UUID REF orders, user_id UUID REF users
- amount DECIMAL(10,2) NOT NULL, method VARCHAR(10) CHECK ('cash','card','wallet')
- status VARCHAR(20) DEFAULT 'pending', transaction_ref VARCHAR(100)
- created_at TIMESTAMPTZ DEFAULT NOW()

CREATE TABLE driver_locations:
- id UUID PK, driver_id UUID REF drivers ON DELETE CASCADE NOT NULL
- lat DECIMAL(10,7) NOT NULL, lng DECIMAL(10,7) NOT NULL
- speed DECIMAL(5,2), heading DECIMAL(5,2)
- created_at TIMESTAMPTZ DEFAULT NOW()

RLS: drivers INSERT own. Users SELECT for assigned driver via order join. Admin all.
Index: driver_locations(driver_id, created_at DESC).

Show complete SQL.
```

---

## PROMPT BD — Database Schema: Supporting Tables

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md • AGENTS.md

PREVIOUS: Core tables exist (users, drivers, orders, chat, payments, locations).

TASK: Create supabase/migrations/004_create_supporting.sql

CREATE TABLE order_status_log:
- id UUID PK, order_id UUID REF orders ON DELETE CASCADE
- from_status VARCHAR(30), to_status VARCHAR(30) NOT NULL
- changed_by VARCHAR(50) NOT NULL (values: 'user','driver','system', or admin user_id)
- reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW()

CREATE TABLE order_items:
- id UUID PK, order_id UUID REF orders ON DELETE CASCADE
- name VARCHAR(200) NOT NULL, quantity INTEGER DEFAULT 1
- unit_price DECIMAL(10,2), notes TEXT

CREATE TABLE reviews:
- id UUID PK, order_id UUID REF orders, reviewer_id UUID REF users
- driver_id UUID REF drivers, rating INTEGER CHECK (1-5), comment TEXT
- created_at TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(order_id, reviewer_id)

CREATE TABLE fraud_flags:
- id UUID PK, user_id UUID REF users, driver_id UUID REF drivers
- order_id UUID REF orders, type VARCHAR(50), severity VARCHAR(10) CHECK ('low','medium','high','critical')
- evidence JSONB, resolved BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()

CREATE TABLE notifications:
- id UUID PK, user_id UUID REF users NOT NULL, title VARCHAR(200), body TEXT
- type VARCHAR(50), order_id UUID REF orders, is_read BOOLEAN DEFAULT FALSE
- created_at TIMESTAMPTZ DEFAULT NOW()

CREATE TABLE moderation_rules:
- id UUID PK, name VARCHAR(100), description TEXT, is_active BOOLEAN DEFAULT TRUE
- rule_type VARCHAR(20), config JSONB, created_at TIMESTAMPTZ DEFAULT NOW()

CREATE TABLE banned_keywords:
- id UUID PK, keyword VARCHAR(200) NOT NULL, language VARCHAR(10) DEFAULT 'ar'
- severity VARCHAR(10) CHECK ('low','medium','high','critical')
- category VARCHAR(50), is_active BOOLEAN DEFAULT TRUE
- created_at TIMESTAMPTZ DEFAULT NOW()

CREATE TABLE user_verifications:
- id UUID PK, user_id UUID REF users, type VARCHAR(30), document_url TEXT
- status VARCHAR(20) DEFAULT 'pending', verified_at TIMESTAMPTZ

CREATE TABLE driver_verifications:
- id UUID PK, driver_id UUID REF drivers, type VARCHAR(30), document_url TEXT
- status VARCHAR(20) DEFAULT 'pending', verified_at TIMESTAMPTZ

Appropriate RLS on each table. Indexes on foreign keys.
Show complete SQL.
```

---

## PROMPT BE — Seed Data: Banned Keywords

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 4 — moderation pipeline)
• AGENTS.md

PREVIOUS: All tables exist including banned_keywords.

TASK: Create supabase/migrations/005_seed_banned_keywords.sql

Insert 50+ banned keywords across these categories:
- drugs (Arabic, French, Darija, Arabizi): مخدرات, حشيش, قرقوبي, cocaine, drogue, 7chich, kif, حبوب هلوسة, extasy
- weapons: سلاح, مسدس, couteau, pistolet, 3tad, خنجر, سيوف, bombe
- illegal_services: تزوير, وثائق مزورة, faux papiers, contrefaçon, بطاقة مزورة, جواز سفر مزور
- exploitation: دعارة, prostitution, قاصر, mineur, traite
- stolen_goods: مسروق, volé, سرقة, marchandise volée
- alcohol (context-dependent): خمر, vin, bière, vodka, whisky, كحول

Each with:
- keyword: the text
- language: 'ar', 'fr', or 'mixed'
- severity: 'critical' for drugs/weapons/exploitation, 'high' for illegal services/stolen, 'medium' for alcohol
- category: matching the categories above
- is_active: TRUE

Include Arabizi variants (numbers replacing Arabic letters):
7chich (حشيش), 9ar9oubi (قرقوبي), sla7 (سلاح), m9adrat (مخدرات)

Show complete SQL with all 50+ INSERT statements.
```

---

## PROMPT BF — Enable Supabase Realtime

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 6 — Real-Time Patterns)
• docs/ARCHITECTURE_GUIDE.md (Section 7.4 — Realtime Channels)
• AGENTS.md

PREVIOUS: All tables exist.

TASK: Create supabase/migrations/006_enable_realtime.sql

Enable Supabase Realtime on these tables:
- orders (for status change tracking)
- driver_locations (for GPS tracking)
- chat_messages (for real-time chat)
- order_moderation (for admin moderation queue)

SQL for enabling Realtime:
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE order_moderation;

Also create the updated_at trigger function for orders:
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

Show complete SQL.
```

---

## PROMPT BG — Moderation Logic (Edge Function)

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 4 — Moderation Workflow)
• docs/ARCHITECTURE_GUIDE.md • AGENTS.md

TASK: Create supabase/functions/moderate/index.ts (Deno TypeScript)

This Edge Function handles the initial automated pass of the moderation pipeline.

Input: { order_id: string, title: string, description: string }
Uses SUPABASE_SERVICE_ROLE_KEY.

Workflow:
1. Load banned keywords from banned_keywords table.
2. Search title and description for keywords.
3. If critical/high severity keywords are found:
   - Set decision to 'manual_review'
   - Mark order status as 'pending_moderation'
4. Otherwise:
   - Set decision to 'approved'
   - Update order status to 'pending_driver'
5. Write final results to order_moderation and log in order_status_log.

Return: { success: true, decision }
Error handling: catch errors, return generic failure, log locally.
Show complete Deno TypeScript.
```

---

## PROMPT BI — Match Driver Edge Function

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 4 — match-driver algorithm)
• docs/ARCHITECTURE_GUIDE.md • AGENTS.md

TASK: Create supabase/functions/match-driver/index.ts (Deno TypeScript)

Input: { order_id: string }
Uses SUPABASE_SERVICE_ROLE_KEY.

Algorithm:
1. Fetch order: get pickup_lat, pickup_lng from orders table
2. Query available drivers: is_online=true AND is_approved=true AND NOT currently assigned to active order
3. Calculate distance using Haversine formula:
   distance = 2 * R * asin(sqrt(sin²((lat2-lat1)/2) + cos(lat1)*cos(lat2)*sin²((lng2-lng1)/2)))
   R = 6371 (km)
4. Filter to drivers within RADIUS (start at 5km)
5. Score each driver:
   - proximity_score = (1 - distance/max_radius) × 0.40
   - rating_score = (rating_avg / 5) × 0.30
   - experience_score = min(total_deliveries / 100, 1) × 0.20
   - idle_score = 0.10
   - composite = sum
6. Sort DESC, take top 5
7. For each: broadcast offer via Supabase Realtime channel driver_offers:{driverId}
   Payload: { order_id, title, category, pickup_address, dropoff_address, estimated_price, distance_km }
8. Wait 30 seconds (setTimeout or polling) for acceptance
   - Check if order.driver_id is set (driver accepted)
9. If no acceptance: expand radius to 8km, repeat from step 2
10. After 3 rounds with no acceptance: update order status to 'cancelled' with reason 'no_drivers_available'

Return: { matched: boolean, driver_id?: string, rounds: number }
Export haversineDistance as helper function.
Show complete Deno TypeScript.
```

---

## PROMPT BJ — Send Notification Edge Function

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 4 — send-notification)
• AGENTS.md

TASK: Create supabase/functions/send-notification/index.ts (Deno TypeScript)

Input: { user_id: string, title: string, body: string, type: string, order_id?: string }
Uses SUPABASE_SERVICE_ROLE_KEY.

Steps:
1. Validate input: user_id required, title required, body required, type required
2. INSERT into notifications table: user_id, title, body, type, order_id, is_read=false
3. Fetch user's Expo push token (from users table expo_push_token column — add if not exists)
4. If push token exists: POST to https://exp.host/--/api/v2/push/send
   Body: { to: token, title, body, data: { type, order_id }, sound: 'default' }
5. Handle invalid/expired push tokens gracefully (log but don't fail)
6. Return: { success: true, notification_id: string }

Error handling: try/catch, return { success: false, error: message }.
Show complete Deno TypeScript.
```

---

## PROMPT BK — Driver App: API Layer

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 2 — Database Access)
• docs/ARCHITECTURE_GUIDE.md • AGENTS.md

PREVIOUS: shared/types.ts exists. Supabase tables exist.
RELATED TO: Frontend Prompt G (user-app/lib/api.ts)

TASK: Create driver-app/lib/api.ts

Same Supabase client pattern as user-app. Import types from shared/types.ts.

Driver-specific API functions (all return ApiResponse<T>):

1. getAvailableOrders(): ApiResponse<Order[]>
   → orders WHERE status = 'pending_driver', ordered by created_at DESC

2. getAssignedOrder(driverId: string): ApiResponse<Order>
   → orders WHERE driver_id AND status NOT IN terminal, limit 1

3. acceptOrder(orderId: string, driverId: string): ApiResponse<void>
   → UPDATE orders SET driver_id, status='driver_assigned'. Log in order_status_log.

4. declineOrder(orderId: string, driverId: string): ApiResponse<void>
   → Log decline (does not change order status). Could log to a separate table.

5. updateOrderStatus(orderId: string, newStatus: OrderStatus): ApiResponse<void>
   → Validate transition using VALID_TRANSITIONS. UPDATE orders. Log in order_status_log.

6. updateDriverStatus(driverId: string, isOnline: boolean, lat?: number, lng?: number): ApiResponse<void>
   → UPDATE drivers SET is_online, current_zone if applicable.

7. insertDriverLocation(driverId: string, lat: number, lng: number, speed?: number, heading?: number): ApiResponse<void>
   → INSERT into driver_locations.

8. getDriverEarnings(driverId: string, period: 'today'|'week'|'month'): ApiResponse<{total: number, count: number}>
   → SUM(final_price) from orders WHERE driver_id AND status='completed' AND date filter.

All: try/catch, ApiResponse wrapper, no any. Validate transitions.
Show complete file.
```

---

## PROMPT BL — Admin Panel: API Layer

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md • docs/ARCHITECTURE_GUIDE.md • AGENTS.md

RELATED TO: Frontend Prompt G (user api) and Backend Prompt BK (driver api)

TASK: Create admin/lib/api.ts (Next.js server-side)

Uses supabase-js with SERVICE_ROLE_KEY (admin bypasses RLS).

Admin-specific functions:

1. getModerationQueue(): Order[] with moderation data, status='pending_moderation', ordered by created_at ASC

2. approveOrder(orderId: string, adminId: string): void
   → UPDATE order status to 'pending_driver'. Log. Update moderation record.

3. rejectOrder(orderId: string, adminId: string, reason: string): void
   → UPDATE order status to 'moderation_rejected'. Log. Notify user.

4. getDashboardStats(): { totalOrders, activeOrders, totalUsers, totalDrivers, pendingModeration }

5. getUsersList(page, search?): PaginatedResponse<User>

6. getDriversList(page, filter?: 'pending'|'approved'|'suspended'): PaginatedResponse<Driver & {user: User}>

7. approveDriver(driverId: string): void → UPDATE is_approved=true. Notify driver.

8. suspendDriver(driverId: string, reason: string): void → UPDATE is_approved=false, is_online=false.

9. getFraudFlags(filter?: 'unresolved'|'all'): FraudFlag[]

10. updateModerationRule(ruleId: string, updates: Partial<ModerationRule>): void

11. addBannedKeyword(keyword: string, language: string, severity: string, category: string): void

All: typed returns, error handling, no any.
Show complete file.
```

---

## PROMPT BM — Supabase Storage Buckets & Policies

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 7 — Security)
• AGENTS.md

TASK: Create supabase/migrations/007_create_storage.sql

Set up Supabase Storage buckets and access policies:

1. Bucket: avatars (public read, authenticated upload own)
   - Users can upload to avatars/{user_id}/*
   - Anyone can read (public URLs for avatars)
   - Max file size: 2MB, allowed: image/jpeg, image/png, image/webp

2. Bucket: chat-images (private, order participants only)
   - Users can upload if they are user_id or driver_id on the order
   - Users can read if they are user_id or driver_id on the order
   - Max file size: 5MB, allowed: image/jpeg, image/png, image/webp

3. Bucket: driver-documents (private, driver + admin only)
   - Driver can upload to driver-documents/{driver_id}/*
   - Only admin can read
   - Max file size: 10MB, allowed: image/jpeg, image/png, application/pdf

Show complete SQL for bucket creation and RLS storage policies.
```

---

## PROMPT BN — Database Functions & Triggers

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 5 — State Machine, Section 8 — Schema)
• AGENTS.md

TASK: Create supabase/migrations/008_create_functions.sql

PostgreSQL functions and triggers:

1. validate_order_transition(): TRIGGER BEFORE UPDATE ON orders
   - If status is being changed: check against VALID_TRANSITIONS map
   - If invalid transition: RAISE EXCEPTION 'Invalid status transition from % to %'
   - If valid: allow UPDATE, auto-insert into order_status_log

2. update_driver_rating(): FUNCTION called after INSERT on reviews
   - Recalculate driver's rating_avg = AVG(rating) from all reviews for that driver
   - UPDATE drivers SET rating_avg

3. update_user_trust_score(): FUNCTION
   - After order completed: +1 to trust_score (max 100)
   - After moderation_rejected: -5 to trust_score (min 0)
   - After fraud_flag created with severity='critical': -20

4. auto_cancel_stale_orders(): FUNCTION (to be called by cron)
   - Orders in 'pending_driver' for > 30 minutes: cancel with reason 'timeout'
   - Orders in 'driver_assigned' for > 60 minutes with no status change: flag for review

Show complete SQL for all functions and triggers.
```

---

## PROMPT BO — Rate Limiting & Security Functions

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 7 — Security)
• AGENTS.md

TASK: Create supabase/migrations/009_security.sql

Security-related database objects:

1. Rate limiting table:
CREATE TABLE rate_limits (
  id UUID PK, user_id UUID REF users, action VARCHAR(50),
  count INTEGER DEFAULT 1, window_start TIMESTAMPTZ DEFAULT NOW()
);

2. check_rate_limit(p_user_id UUID, p_action VARCHAR, p_max INTEGER, p_window_minutes INTEGER): BOOLEAN
   - Count actions within window
   - If count >= max: return FALSE (rate limited)
   - Else: increment and return TRUE
   - Actions: 'create_order' (max 5/10min), 'send_message' (max 30/1min), 'login_attempt' (max 5/5min)

3. mask_phone(phone VARCHAR): VARCHAR
   - Returns '+212 6** *** **{last2}'
   - Used in any user-facing query that shows phone numbers of others

4. sanitize_text(input TEXT): TEXT
   - Strip HTML tags
   - Limit to 500 characters
   - Trim whitespace
   - Replace multiple spaces with single

5. Audit log trigger on orders table:
   - Log all changes to a general audit_log table
   - Include: table_name, record_id, action (INSERT/UPDATE/DELETE), old_data JSONB, new_data JSONB, changed_by, changed_at

Show complete SQL.
```

---

## PROMPT BP — PostGIS Setup for Geo Queries

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md • docs/ARCHITECTURE_GUIDE.md
• AGENTS.md

TASK: Create supabase/migrations/010_postgis_setup.sql

Enable PostGIS and create geo-optimized queries:

1. Enable PostGIS extension: CREATE EXTENSION IF NOT EXISTS postgis;

2. Add geometry columns to existing tables:
   ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_point GEOMETRY(Point, 4326);
   ALTER TABLE orders ADD COLUMN IF NOT EXISTS dropoff_point GEOMETRY(Point, 4326);
   ALTER TABLE driver_locations ADD COLUMN IF NOT EXISTS location_point GEOMETRY(Point, 4326);

3. Create trigger to auto-populate geometry from lat/lng:
   - On INSERT/UPDATE of orders: SET pickup_point = ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)
   - On INSERT of driver_locations: SET location_point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)

4. Create spatial indexes:
   CREATE INDEX idx_orders_pickup_point ON orders USING GIST(pickup_point);
   CREATE INDEX idx_orders_dropoff_point ON orders USING GIST(dropoff_point);
   CREATE INDEX idx_driver_locations_point ON driver_locations USING GIST(location_point);

5. Create helper function find_nearby_drivers(p_lat, p_lng, p_radius_km):
   - Returns drivers within radius using ST_DWithin
   - Ordered by distance ASC
   - Only online + approved + not currently on active order

Show complete SQL.
```

---

## PROMPT BQ — Database Indexes & Performance

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 8 — Schema Rules)
• AGENTS.md

TASK: Create supabase/migrations/011_performance_indexes.sql

Create all performance-critical indexes not already created:

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_driver_status ON orders(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_order ON chat_messages(order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recent ON driver_locations(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_driver ON reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_unresolved ON fraud_flags(resolved, created_at DESC) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_banned_keywords_active ON banned_keywords(is_active, severity) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_order_status_log_order ON order_status_log(order_id, created_at DESC);

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_active ON orders(status) WHERE status NOT IN ('completed','cancelled','moderation_rejected');
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_online, is_approved) WHERE is_online = TRUE AND is_approved = TRUE;

Also add COMMENT ON TABLE for all 16 tables documenting their purpose.
Show complete SQL.
```

---

## PROMPT BR — Testing: Moderation Function

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 9 — Testing)
• AGENTS.md

PREVIOUS: Moderation function exists.

TASK: Create supabase/functions/tests/moderation.test.ts

Test cases for moderation workflow:

1. Safe food request → expect approved outcome
   Input: { title: "بيتزا مارغريتا", description: "أريد بيتزا من مطعم قريب" }

2. Critical keyword found → expect manual_review outcome
   Input: { title: "أريد مخدرات", description: "توصيل سريع" }

3. Category block → verify rejection logic

For each: input, expected output fields, assertions.
Show complete test file.
```

---

## PROMPT BS — Testing: RLS Policy Tests

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 3 — RLS, Section 9 — Testing)
• AGENTS.md

TASK: Create supabase/functions/tests/rls-policies.test.ts

Test cases for Row-Level Security policies:

USERS TABLE:
1. User A can SELECT their own profile → expect 1 row
2. User A cannot SELECT User B's profile → expect 0 rows
3. User A can UPDATE their own profile → expect success
4. User A cannot UPDATE User B's profile → expect failure
5. Unauthenticated request → expect 401/empty

ORDERS TABLE:
6. User can SELECT own orders → expect their orders only
7. User cannot SELECT another user's orders → expect 0 rows
8. User can INSERT order with own user_id → expect success
9. User cannot INSERT order with another user_id → expect failure
10. Driver can SELECT pending_driver orders → expect results

CHAT MESSAGES:
11. User can SELECT messages for their order → expect results
12. User cannot SELECT messages for another's order → expect 0 rows

DRIVER LOCATIONS:
13. Driver can INSERT own location → expect success
14. Driver cannot INSERT location for another driver → expect failure

For each test: describe scenario, set up auth context, execute query, assert result.
Show complete test file.
```

---

## PROMPT BT — Admin Panel: Dashboard API Routes

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md • AGENTS.md
• Admin panel uses Next.js 14 App Router + Tailwind CSS

PREVIOUS: admin/lib/api.ts exists with all admin functions.

TASK: Create Next.js API routes for admin dashboard:

1. admin/app/api/dashboard/route.ts
   - GET: returns getDashboardStats() — total orders, users, drivers, pending moderation, avg risk
   - Protected: verify admin JWT from request headers

2. admin/app/api/moderation/route.ts
   - GET: returns getModerationQueue() — pending orders sorted by risk
   - POST: { action: 'approve'|'reject', orderId, reason? } — calls approveOrder or rejectOrder

3. admin/app/api/drivers/route.ts
   - GET: returns getDriversList(page, filter)
   - POST: { action: 'approve'|'suspend', driverId, reason? }

4. admin/app/api/users/route.ts
   - GET: returns getUsersList(page, search)

5. admin/app/api/keywords/route.ts
   - GET: returns all banned_keywords
   - POST: { keyword, language, severity, category } — adds new keyword

All routes: validate admin role, handle errors, return typed JSON.
Show complete code for all 5 route files.
```

---

## PROMPT BU — Admin Panel: Middleware & Auth

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 7 — Security)
• AGENTS.md

TASK: Create admin panel auth and middleware:

1. admin/middleware.ts
   - Check for Supabase auth session on all routes except /login
   - Verify user role = 'admin'
   - Redirect to /login if not authenticated or not admin

2. admin/lib/supabase-server.ts
   - Create Supabase client for server-side (Next.js)
   - Use createServerClient from @supabase/ssr
   - Handle cookies for session persistence

3. admin/app/login/page.tsx
   - Simple login form: email + password (admins use email, not phone)
   - On success: redirect to /dashboard
   - Error display for invalid credentials

All: TypeScript, no any, proper error handling.
Show complete code for all 3 files.
```

---

## PROMPT BV — Monitoring & Logging Setup

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 7 — Security, Data Protection)
• AGENTS.md

TASK: Create monitoring and logging infrastructure:

1. supabase/functions/shared/logger.ts (shared utility for Edge Functions)
   - log(level, message, metadata): writes structured log
   - Levels: 'info', 'warn', 'error', 'security'
   - Phone numbers auto-masked using mask_phone pattern
   - Passwords/tokens never logged
   - Include: timestamp, function_name, user_id (if available), request_id

2. supabase/functions/shared/validators.ts
   - validateRequired(fields, body): checks all required fields present
   - validateUUID(value): checks valid UUID format
   - validatePhone(value): checks +212 format
   - sanitizeText(input): strip HTML, limit length, trim
   - All return { valid: boolean, error?: string }

3. supabase/migrations/012_monitoring.sql
   - CREATE TABLE api_logs (id, function_name, user_id, request_id, level, message, metadata JSONB, created_at)
   - CREATE TABLE error_logs (id, function_name, error_message, stack_trace, request_body JSONB, created_at)
   - Index on created_at DESC, function_name
   - Auto-delete logs older than 90 days (or document how to set up pg_cron for this)

Show complete code for all 3 files.
```

---

## PROMPT BW — Cron Jobs & Background Tasks

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md • AGENTS.md

TASK: Create scheduled background task definitions:

1. supabase/functions/cron-cleanup/index.ts (Deno Edge Function)
   - Called on schedule (document how to set up via Supabase Dashboard or pg_cron)
   - auto_cancel_stale_orders: cancel pending_driver orders > 30 min
   - clean_old_locations: delete driver_locations > 7 days old
   - clean_old_logs: delete api_logs > 90 days old
   - update_stale_driver_status: set is_online=false for drivers with no location update in 10 min
   - Log all cleanup actions

2. supabase/functions/daily-report/index.ts
   - Generate daily summary stats:
     orders_created, orders_completed, orders_rejected, avg_completion_time,
     new_users, new_drivers, fraud_flags_count, top_rejection_reasons
   - Store in a daily_reports table or return via API

Show complete Deno TypeScript for both.
```

---

## PROMPT BX — Environment Configuration Guide

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md (Section 7 — Security)
• AGENTS.md

TASK: Create docs/ENVIRONMENT_SETUP.md

Document ALL environment variables needed across the project:

USER-APP (.env):
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=

DRIVER-APP (.env):
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=

ADMIN (.env.local):
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

SUPABASE EDGE FUNCTIONS (set via Dashboard > Edge Functions > Secrets):
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
EXPO_PUSH_ACCESS_TOKEN= (optional, for authenticated push)

Instructions:
1. How to find each value in Supabase Dashboard
2. How to set Edge Function secrets
3. .gitignore rules (never commit .env files)
4. How to create a Google Maps API key

Security rules:
- NEVER commit .env files
- NEVER use service role key in mobile apps
- NEVER log API keys
- Rotate keys if exposed

Show complete markdown documentation.
```

---

## PROMPT BY — Database Backup & Recovery Guide

```
MANDATORY CONTEXT — Read and obey:
• docs/CODING_RULES_BACKEND.md • AGENTS.md

TASK: Create docs/BACKUP_RECOVERY.md

Document backup and recovery procedures:

1. Supabase Automatic Backups
   - Pro plan: daily backups, 7-day retention
   - Point-in-time recovery available

2. Manual Backup Procedure
   - Using pg_dump via Supabase connection string
   - Command template with masked credentials
   - What to include: schema + data + RLS policies
   - Storage: where to save backups securely

3. Recovery Procedures
   - Restore from Supabase Dashboard
   - Restore from pg_dump file
   - Partial table restore

4. Migration Rollback
   - Each migration has DROP statements commented
   - Rollback order: reverse of creation order
   - How to test rollback safely

5. Data Protection
   - User data handling (GDPR-like considerations)
   - Right to deletion procedure
   - Data anonymization for development

Show complete markdown.
```

---

## PROMPT BZ — Full Backend Review

```
MANDATORY CONTEXT — Read and obey:
• docs/REVIEW_CHECKLIST.md (Sections 7-9 — Backend, Supabase, Security)
• docs/CODING_RULES_BACKEND.md (ALL sections)
• docs/MASTER_INSTRUCTIONS.md • AGENTS.md

TASK: Final Backend Review

Verify ALL backend files against these criteria:

DATABASE:
1. All 16 tables created with correct columns and constraints
2. RLS enabled on every table with appropriate policies
3. Foreign keys with ON DELETE CASCADE where appropriate
4. Indexes on all foreign keys and commonly queried columns
5. Check constraints on all enum-like columns
6. updated_at triggers on users and orders
7. State transition validation trigger on orders

EDGE FUNCTIONS:
8. moderation: all 5 pipeline steps execute correctly
9. manual review: queue is accessible to admins
11. match-driver: Haversine distance calculation correct
12. match-driver: radius expansion after timeout
13. match-driver: cancels after 3 rounds
14. send-notification: handles missing push tokens
15. All functions validate input
16. All functions use service role key (not anon)
17. All functions return structured JSON responses
18. No stack traces in error responses

SECURITY:
19. No service role key in any mobile app code
20. Phone numbers masked in all logs
21. Rate limiting implemented
22. Text input sanitized before manual analysis
23. Storage bucket policies restrict access correctly
24. Admin routes verify admin role

List any violations with exact file:line.
Then confirm these backend flows work:
• Flow 1: Order created → moderation workflow runs → approved → match-driver broadcasts
• Flow 2: Order created → critical keyword → rejected or flagged → user/admin notified
• Flow 3: Driver accepts → status updates → location tracking → delivery confirmed
• Flow 4: Admin reviews flagged order → approves/rejects → user notified

Report gaps and fix them.
```

---

## AFTER ALL BACKEND PROMPTS

The backend is complete when:
- All 12 migration files are deployed to Supabase
- All 3 Edge Functions are deployed and tested
- Admin API routes respond correctly
- RLS policies verified with test cases
- All frontend prompts (A-Z) connect cleanly to the backend
- The REVIEW_CHECKLIST.md passes with zero violations
