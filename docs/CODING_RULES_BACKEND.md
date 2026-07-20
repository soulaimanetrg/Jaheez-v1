# JAHEEZ — Backend Coding Rules

> **Purpose**: Supabase architecture rules, Edge Function patterns, database access rules, Row-Level Security conventions, real-time subscription patterns, AI moderation pipeline rules, security enforcement, and backend review standards.  
> **Companion**: See `CODING_RULES_FRONTEND.md` for React Native and NativeWind rules.

---

## 1. Supabase as Backend — Fundamental Rules

JAHEEZ uses Supabase as its **complete backend**. There is no custom server. Understand these boundaries:

| Layer | What It Does | How You Interact |
|---|---|---|
| **PostgREST API** | Auto-generated REST from Postgres schema | Via `supabase-js` client SDK |
| **Auth** | Phone/OTP, JWT tokens, session management | Via `supabase.auth.*` methods |
| **Realtime** | WebSocket channels, postgres_changes | Via `supabase.channel()` subscriptions |
| **Storage** | S3-compatible object storage with policies | Via `supabase.storage.from()` |
| **Edge Functions** | Deno serverless functions | Via `supabase.functions.invoke()` |
| **Postgres** | Primary database with RLS | Never accessed directly from client |

### The Golden Rule

> **All data access from client apps MUST go through the Supabase JS client**, which automatically includes the user's JWT. Row-Level Security (RLS) policies on each table enforce authorization. You never write authorization logic in the client.

---

## 2. Database Access Patterns

### 2.1 API Layer (`lib/api.ts`)

All Supabase queries are centralized in `lib/api.ts`. This file is the **only place** where Supabase query builder calls appear.

#### Function Signature Convention

```typescript
// Every API function follows this pattern:
async function functionName(params: TypedParams): Promise<ApiResponse<ReturnType>> {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('columns')
      .eq('column', value);

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database operation failed';
    return { data: null, error: message };
  }
}
```

#### Required API Functions (User App)

| Function | Query | Returns |
|---|---|---|
| `getActiveOrder(userId)` | Orders where status not in terminal states, limit 1 | `ApiResponse<Order>` |
| `getOrderById(orderId)` | Full order with driver, items, moderation joined | `ApiResponse<Order>` |
| `getOrderHistory(userId, page)` | User orders paginated, descending by date | `ApiResponse<Order[]>` |
| `createOrder(input, userId)` | Insert order + trigger moderation workflow | `ApiResponse<Order>` |
| `cancelOrder(orderId, reason)` | Update order status to cancelled | `ApiResponse<void>` |
| `confirmDelivery(orderId)` | Update order status to completed | `ApiResponse<void>` |
| `submitReview(orderId, rating, comment)` | Insert into reviews table | `ApiResponse<void>` |
| `sendChatMessage(orderId, content, senderId)` | Insert into chat_messages | `ApiResponse<void>` |
| `getChatMessages(orderId)` | Messages for order, ascending by created_at | `ApiResponse<ChatMessage[]>` |

#### Required API Functions (Driver App)

| Function | Query | Returns |
|---|---|---|
| `getAvailableOrders()` | Orders with status = pending_driver | `ApiResponse<Order[]>` |
| `acceptOrder(orderId, driverId)` | Update order with driver_id and status | `ApiResponse<void>` |
| `declineOrder(orderId, driverId)` | Log decline, no status change | `ApiResponse<void>` |
| `updateOrderStatus(orderId, status)` | Update order status with validation | `ApiResponse<void>` |
| `updateDriverStatus(isOnline, lat, lng)` | Update driver online/offline + location | `ApiResponse<void>` |
| `insertDriverLocation(driverId, lat, lng, speed, heading)` | Insert GPS breadcrumb | `ApiResponse<void>` |

### 2.2 Query Patterns (Exact Supabase Syntax)

#### Joins (selecting related data)

```typescript
// Get order with driver info (joined through drivers → users)
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    driver:drivers(
      id, rating_avg, vehicle_type,
      users!inner(full_name, phone, avatar_url)
    ),
    order_items(*),
    order_moderation(decision, reason, reviewed_at)
  `)
  .eq('id', orderId)
  .single();
```

#### Filtering Terminal States

```typescript
// Get active orders (not completed, cancelled, or rejected)
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
  .not('status', 'in', '("completed","cancelled","moderation_rejected")')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

#### Pagination

```typescript
// Paginated order history
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

const { data, count } = await supabase
  .from('orders')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(from, to);
```

#### Upsert with Conflict

```typescript
// Update driver's online status (upsert pattern)
const { data } = await supabase
  .from('drivers')
  .update({ is_online: isOnline, current_zone: zone })
  .eq('user_id', userId);
```

---

## 3. Row-Level Security (RLS) Rules

### Philosophy

Every table has RLS enabled. Policies enforce who can read/write what. **The client never sends authorization headers manually** — the JWT from `supabase.auth` is automatically included.

### Policy Patterns

#### Users Table
- User can `SELECT` their own row: `auth.uid() = id`
- User can `UPDATE` their own row: `auth.uid() = id`
- No user can `DELETE` rows (soft-delete via `is_banned`)
- Admin can `SELECT` all rows: `auth.jwt()->>'role' = 'admin'`

#### Orders Table
- User can `SELECT` their own orders: `auth.uid() = user_id`
- User can `INSERT` orders: `auth.uid() = user_id`
- Driver can `SELECT` pending orders: `status = 'pending_driver'`
- Driver can `SELECT` their assigned orders: `driver_id = auth.uid()`
- Driver can `UPDATE` order status: `driver_id = auth.uid()` with status validation

#### Chat Messages
- User can `SELECT` messages for their orders
- Driver can `SELECT` messages for their assigned orders
- Both can `INSERT` messages for active orders only

#### Driver Locations
- Driver can `INSERT` their own locations: `driver_id` matches their driver record
- User can `SELECT` location of their assigned driver (via order join)
- Admin can `SELECT` all locations

### RLS Rules for Developers

1. **Never bypass RLS** from client code — it's there for security
2. **Always test with proper auth** — unauthenticated calls should fail
3. **Edge Functions use service role key** — they bypass RLS intentionally for admin operations
4. **If a query returns empty unexpectedly**, check RLS policies first
5. **Never expose `service_role` key** to mobile apps — only `anon` key

---

## 4. Edge Functions Rules

### Runtime: Deno

Edge Functions run on **Deno** (not Node.js). Key differences:

| Feature | Deno | Node.js |
|---|---|---|
| Module system | ES modules (`import`) | CommonJS (`require`) deprecated |
| Standard library | `Deno.serve()` | `express` / `http` |
| Environment variables | `Deno.env.get()` | `process.env` |
| Top-level await | Supported | Supported (ESM) |
| TypeScript | Native | Requires compilation |
| Package management | URL imports or import maps | npm |

### Edge Function Template

```typescript
// supabase/functions/function-name/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    // 1. Parse request
    const { order_id, title, description } = await req.json();

    // 2. Create service-role client (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 3. Business logic here
    // ...

    // 4. Return success
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    // 5. Return error
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
```

### The Three Edge Functions

#### Moderation Workflow — Manual Review Pipeline

**Input**: `{ order_id, title, description }`  
**Output**: `{ decision, explanation }`

Pipeline steps:

```
Step 1: Check blocked categories → If category is in banned list, flag for rejection
Step 2: Keyword scanning → Search for high-risk words in title/description
Step 3: Initial filter → 
  → If blocked category/keyword found → Set status to 'manual_review'
  → Otherwise → Set status to 'pending_driver' (auto-approve safe requests)
Step 4: Manual Admin Review → 
  → Admin views queue in Admin Panel
  → Admin makes final 'approve' or 'reject' decision
Step 5: Write results → INSERT into order_moderation, UPDATE orders table
```

**Moderation Criteria:**
- No illicit substances
- No weapons or dangerous goods
- No prohibited services
- Clear and descriptive title

#### `match-driver` — Driver Matching Algorithm

**Input**: `{ order_id }`  
**Output**: `{ matched: boolean, driver_id?: string, rounds: number }`

Algorithm:

```
Step 1: Fetch order → get pickup_lat, pickup_lng
Step 2: Query available drivers
  → is_online = true AND is_approved = true
  → No currently active order assigned
  → Within 5km radius (Haversine or PostGIS ST_Distance)
Step 3: Score each driver
  → proximity_score = (1 - distance_km / max_radius) × 0.40
  → rating_score = (rating_avg / 5) × 0.30
  → experience_score = min(total_deliveries / 100, 1) × 0.20
  → idle_score = 0.10 (simplified for MVP)
  → composite = sum of all scores
Step 4: Sort by composite DESC, take top 5
Step 5: Broadcast offer to each driver via Realtime channel
Step 6: Wait 30 seconds for acceptance
  → If accepted: done
  → If not: expand to 8km, repeat from Step 2
  → After 3 rounds: cancel order (no_drivers_available)
```

#### `send-notification` — Push Notification

**Input**: `{ user_id, title, body, type, order_id? }`  
**Output**: `{ success: boolean, notification_id: string }`

Steps:
1. Insert record into `notifications` table
2. Fetch user's Expo push token
3. POST to `https://exp.host/--/api/v2/push/send`
4. Log success/failure

---

## 5. Order State Machine Rules

### Valid Transitions (Exhaustive)

```
pending_moderation  → pending_driver       (auto/manual APPROVE)
pending_moderation  → moderation_rejected  (auto/manual REJECT)
pending_driver      → driver_assigned      (driver accepts)
pending_driver      → cancelled            (user cancels / no drivers)
driver_assigned     → in_progress          (driver starts moving)
driver_assigned     → pending_driver       (driver cancels — re-broadcast)
driver_assigned     → cancelled            (user cancels before driver moves)
in_progress         → picked_up            (driver marks item collected)
in_progress         → cancelled            (emergency — admin only)
picked_up           → delivered            (driver arrives at dropoff)
delivered           → completed            (user confirms receipt)
delivered           → disputed             (user disputes)
disputed            → completed            (admin resolves)
cancelled           → [TERMINAL]
completed           → [TERMINAL]
moderation_rejected → [TERMINAL]
```

### Enforcement Rules

1. **Validate transitions in `lib/api.ts`** before sending UPDATE to Supabase
2. **Log every transition** in `order_status_log` table
3. **Never allow** a terminal state to transition to anything
4. **If an illegal transition is attempted**, throw an error — never silently ignore
5. **Include `changed_by`** in the log: 'user', 'driver', 'system', or admin user_id

### Transition Validation Function

```typescript
// In lib/api.ts — validate before any status update
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_moderation: ['pending_driver', 'moderation_rejected'],
  pending_driver: ['driver_assigned', 'cancelled'],
  driver_assigned: ['in_progress', 'pending_driver', 'cancelled'],
  in_progress: ['picked_up', 'cancelled'],
  picked_up: ['delivered'],
  delivered: ['completed', 'disputed'],
  disputed: ['completed'],
  cancelled: [],
  completed: [],
  moderation_rejected: [],
};

function validateTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

---

## 6. Real-Time Subscription Patterns

### Channel Conventions

| Channel Name | Type | Purpose |
|---|---|---|
| `order:{orderId}` | postgres_changes (UPDATE) | Track order status changes |
| `driver_location:{driverId}` | postgres_changes (INSERT) | Track driver GPS updates |
| `driver_offers:{driverId}` | broadcast | Notify driver of new orders |
| `chat:{orderId}` | postgres_changes (INSERT) | Real-time chat messages |
| `moderation_queue` | postgres_changes (INSERT) | Admin: new flagged orders |

### Subscription Template

```typescript
// In hooks — always clean up on unmount
useEffect(() => {
  const channel = supabase
    .channel(`order:${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, (payload) => {
      handleOrderUpdate(payload.new as Order);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [orderId]);
```

### Real-Time Rules

1. **Always unsubscribe** on component unmount — memory leak prevention
2. **Use specific filters** — never subscribe to an entire table
3. **Handle reconnection** — check `channel.state` for connection status
4. **Expose `isConnected`** in hook return value for UI indicators
5. **Debounce high-frequency updates** — driver location updates every 5s, don't re-render faster

---

## 7. Security Rules

### Client-Side Security

| Rule | Detail |
|---|---|
| **Anon key only** | Mobile apps use `EXPO_PUBLIC_SUPABASE_ANON_KEY` — never service role |
| **RLS enforces access** | Client doesn't need to check ownership — RLS does it |
| **Sanitize inputs** | Strip HTML, limit length before sending to API |
| **Mask phone numbers** | In logs: `+212 6** *** **78` — never full numbers |
| **No secrets in code** | All keys in environment variables |

### Edge Function Security

| Rule | Detail |
|---|---|
| **Service role key** | Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` for admin operations |
| **Validate inputs** | Check required fields, types, and lengths |
| **Rate limit** | Implement basic rate limiting for order creation (max 5/min per user) |
| **Log decisions** | Every moderation decision is written to `order_moderation` table |
| **Never expose internals** | Error responses show generic messages, not stack traces |

### Data Protection

| Data Type | Protection |
|---|---|
| Phone numbers | Hashed in logs, full only in DB |
| Passwords | Never logged, never sent to client |
| JWT tokens | Short-lived (15min access), rotate refresh |
| API keys | Environment variables only |
| User content | Sanitized before manual analysis |
| Chat media | Stored in private bucket with access policies |
| Driver documents | Private bucket, admin-only access |

---

## 8. Database Schema Rules

### General Schema Rules

1. **All tables have `id` as UUID primary key** with `gen_random_uuid()` default
2. **All tables have `created_at`** with `TIMESTAMPTZ DEFAULT NOW()`
3. **Foreign keys have `ON DELETE CASCADE`** where child data is meaningless without parent
4. **Indexes on all foreign keys** and commonly queried columns
5. **Check constraints** on enum-like VARCHAR columns
6. **JSONB** for flexible structured data (keyword_flags, evidence)

### Migration Rules

1. **NEVER edit an existing migration file** — always create a new one
2. **Migrations are numbered sequentially**: `001_`, `002_`, etc.
3. **Each migration is idempotent** — safe to run multiple times
4. **Include rollback** comments showing how to undo
5. **Test migrations** in a dev project before applying to production

### Important Tables and Their Relationships

```
users ──┬── orders (via user_id)
        ├── chat_messages (via sender_id)
        ├── user_verifications
        ├── reviews (via reviewer_id)
        ├── fraud_flags (via user_id)
        └── notifications (via user_id)

drivers ──┬── orders (via driver_id)
          ├── driver_locations (via driver_id)
          ├── driver_verifications
          └── fraud_flags (via driver_id)

orders ──┬── order_moderation (via order_id)
         ├── order_items (via order_id)
         ├── order_status_log (via order_id)
         ├── chat_messages (via order_id)
         └── payments (via order_id)
```

---

## 9. Testing Requirements (Backend)

### Edge Function Tests

| Function | Test Case | Expected |
|---|---|---|
| `moderation` | Safe food request | `approved` |
| `moderation` | Banned keyword found | `manual_review` or `rejected` |
| `match-driver` | Drivers available nearby | Returns top 5, broadcasts |
| `match-driver` | No drivers in 5km | Expands to 8km |
| `match-driver` | No drivers after 3 rounds | Cancels order |
| `send-notification` | Valid push token | Notification sent + logged |
| `send-notification` | Invalid push token | Logged as failed, no crash |

### RLS Policy Tests

| Test | As | Expected |
|---|---|---|
| User reads own orders | Authenticated user | Returns their orders only |
| User reads other's orders | Authenticated user | Returns empty |
| Driver reads pending orders | Authenticated driver | Returns pending_driver orders |
| Unauthenticated read | No auth | Rejected (401) |
| User updates other's order | Authenticated user | Rejected by RLS |

---

## 10. Backend Review Standards

Before any backend code is accepted, verify:

| # | Check | How |
|---|---|---|
| 1 | All queries through `lib/api.ts` | No raw Supabase calls in screens/hooks |
| 2 | Error handling on every query | Try/catch with `ApiResponse` wrapper |
| 3 | State transition validated | `validateTransition()` called before status update |
| 4 | Status log written | Every transition logged in `order_status_log` |
| 5 | Realtime cleaned up | `supabase.removeChannel()` in useEffect cleanup |
| 6 | No service role key in client | Only `anon` key in mobile apps |
| 7 | Input sanitized | Text stripped of HTML, length limited |
| 8 | Phone numbers masked in logs | `+212 6** *** **78` format |
| 9 | Edge Functions handle errors | Try/catch with generic error responses |
| 10 | Edge Functions validate input | Required fields checked, types verified |
| 11 | RLS policies tested | Each role can only access appropriate data |
| 9 | Moderation pipeline complete | All 5 steps executed in order |

---

*The backend is the trust layer. Every query, every validation, every policy must be airtight.*
