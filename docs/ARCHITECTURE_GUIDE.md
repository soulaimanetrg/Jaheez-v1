# JAHEEZ — Architecture Guide

> **Purpose**: Explain the high-level architecture, why Supabase is used, frontend architecture, data flow, folder structure rationale, boundaries between layers, and how the project scales.

---

## 1. High-Level Architecture

JAHEEZ is a **client-heavy, backend-light** architecture. The mobile apps contain all UI and business logic orchestration, while Supabase provides the entire backend infrastructure.

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  user-app   │  │ driver-app  │  │    admin     │     │
│  │ Expo + RN   │  │ Expo + RN   │  │  Next.js 14  │     │
│  │ NativeWind  │  │ NativeWind  │  │  Tailwind    │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          │                              │
│  ┌───────────────────────┼───────────────────────────┐  │
│  │              SHARED LAYER                         │  │
│  │  shared/types.ts — TypeScript interfaces          │  │
│  │  shared/constants.ts — Enums and constants        │  │
│  └───────────────────────┼───────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │
              ┌────────────┼────────────────┐
              │     SUPABASE BACKEND        │
              │  ┌──────────────────────┐   │
              │  │   REST API (PostgREST)│   │
              │  │   Auto-generated from │   │
              │  │   Postgres schema     │   │
              │  └──────────┬───────────┘   │
              │  ┌──────────┴───────────┐   │
              │  │   Supabase Auth       │   │
              │  │   Phone/OTP + JWT     │   │
              │  └──────────────────────┘   │
              │  ┌──────────────────────┐   │
              │  │   Supabase Realtime   │   │
              │  │   WebSocket channels  │   │
              │  │   postgres_changes    │   │
              │  └──────────────────────┘   │
              │  ┌──────────────────────┐   │
              │  │   Supabase Storage    │   │
              │  │   Avatars, chat imgs  │   │
              │  └──────────────────────┘   │
              │  ┌──────────────────────┐   │
              │  │   Edge Functions      │   │
              │  │   match-driver        │   │
              │  │   send-notification   │   │
              │  └──────────────────────┘   │
              │  ┌──────────────────────┐   │
              │  │   PostgreSQL + RLS    │   │
              │  │   PostGIS for geo     │   │
              │  │   16 tables          │   │
              │  └──────────────────────┘   │
              └─────────────────────────────┘
```

---

## 2. Why Supabase?

### The Decision

Supabase was chosen as the **complete backend** for JAHEEZ. No custom server. No Express/NestJS. No additional API layer.

### Rationale

| Need | Supabase Solution | Alternative (rejected) |
|---|---|---|
| Database | Managed PostgreSQL with PostGIS | Self-hosted Postgres (ops overhead) |
| Authentication | Built-in phone/OTP auth with JWT | Custom auth service (security risk) |
| Real-time | WebSocket channels with postgres_changes | Socket.IO server (extra infra) |
| File storage | S3-compatible storage with policies | AWS S3 (separate billing, config) |
| Server-side logic | Edge Functions (Deno runtime) | Node.js server (deployment complexity) |
| API | Auto-generated REST from schema | Hand-written REST endpoints (time) |
| Row-level security | Built-in RLS policies | Custom middleware (error-prone) |

### What This Means in Practice

1. **No server to maintain** — Supabase handles hosting, scaling, backups
2. **Auto-generated API** — Every table gets REST endpoints automatically
3. **Real-time out of the box** — Subscribe to database changes via WebSocket
4. **Auth is built-in** — Phone/OTP, JWT tokens, session management
5. **Edge Functions for custom logic** — driver matching, notifications

### Limitations Accepted

- Edge Functions are Deno (not Node.js) — slightly different ecosystem
- No custom middleware layer — logic lives in hooks (client) and Edge Functions (server)
- RLS policies can be complex — but provide strong per-user data isolation
- Supabase Realtime has connection limits on free tier — production requires Pro plan

---

## 3. Frontend Architecture

### Layer Model

The frontend follows a strict layer model. Each layer can only import from the layers below it.

```
Layer 4: SCREENS (app/ directory)
    ↓ imports from
Layer 3: HOOKS (hooks/ directory)
    ↓ imports from
Layer 2: API LAYER (lib/api.ts)
    ↓ imports from
Layer 1: SUPABASE CLIENT (lib/supabase.ts)
    ↓ connects to
Layer 0: SUPABASE BACKEND

Cross-cutting (imported by all layers):
  - shared/types.ts (TypeScript interfaces)
  - constants/brand.ts (design tokens)
  - components/ui/ (presentational components — used by Layer 4 only)
```

### What Each Layer Does

#### Layer 0: Supabase Backend
- PostgreSQL database with 16 tables
- Row-Level Security policies
- Edge Functions (match-driver, send-notification)
- Realtime channels
- Storage buckets

#### Layer 1: Supabase Client (`lib/supabase.ts`)
- Single instance of `createClient` from `@supabase/supabase-js`
- Configured with environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- Exports one `supabase` object — never instantiated elsewhere
- This is the lowest-level abstraction in the frontend

#### Layer 2: API Layer (`lib/api.ts`)
- Wraps all Supabase queries in typed functions
- Returns `ApiResponse<T>` wrapper: `{ data: T | null, error: string | null }`
- Handles try/catch and error normalization
- Functions: `getActiveOrder`, `getOrderById`, `createOrder`, `cancelOrder`, etc.
- **No screen or hook should call Supabase directly** — always go through `api.ts`

#### Layer 3: Hooks (`hooks/`)
- Business logic layer
- Uses React Query for server state (fetching, caching, mutations)
- Uses Zustand stores for shared client state
- Manages Supabase Realtime subscriptions
- Examples: `useAuth`, `useOrder`, `useTracking`, `useChat`, `useLocation`
- **All logic lives here** — not in screens, not in components

#### Layer 4: Screens (`app/`)
- Pure presentation and orchestration
- Calls hooks for data and actions
- Uses `components/ui/` for rendering
- Handles navigation via Expo Router
- Handles all three states: loading, error, empty/data

### Cross-Cutting Concerns

#### `components/ui/` — Presentational Components
- Pure, stateless (or minimal local state for animations)
- No business logic, no API calls, no Supabase imports
- Accept props, render UI, fire callbacks
- Examples: Button, Input, Card, Badge, StatusBadge, BottomSheet, EmptyState

#### `shared/types.ts` — Type Definitions
- All TypeScript interfaces live here
- Shared across user-app, driver-app, and admin
- Never define types inline in components or hooks
- Includes: `User`, `Driver`, `Order`, `OrderStatus`, `ChatMessage`, etc.

#### `constants/brand.ts` — Design Tokens
- All colors, spacing, radius, shadow values
- Never hardcode hex values anywhere else
- Includes font family names and dimension constants

#### `store/` — Zustand Stores
- Persistent state that survives screen navigation
- `authStore.ts` — current user, authentication state
- `cartStore.ts` — shopping cart items
- `orderStore.ts` — active order being tracked
- `locationStore.ts` — user's current location

---

## 4. Data Flow

1. User fills form on custom-request.tsx
2. Screen calls useOrder().createOrder(formData)
3. Hook calls api.createOrder(input, userId)
4. api.ts inserts into `orders` table via Supabase client
5. Supabase trigger or Edge Function:
   a. Normalizes text
   b. Checks banned keywords
   c. Updates `orders.status` to 'pending_moderation'
6. Admin Panel receives new moderation task via Realtime
7. Screen navigates based on immediate insertion:
   - Success → confirmation screen (waiting for review)

### 4.2 Real-Time Tracking (Read Flow)

```
1. Tracking screen mounts with orderId
2. useTracking(orderId) hook activates
3. Hook subscribes to two Supabase Realtime channels:
   a. `order:{orderId}` — listens for order status changes
   b. `driver_location:{driverId}` — listens for location updates
4. When driver's location changes:
   a. New row inserted into `driver_locations` table
   b. Supabase Realtime fires postgres_changes event
   c. Hook receives new DriverLocation
   d. Hook calculates ETA (distance / 25 km/h)
   e. Screen re-renders with new marker position
5. When order status changes:
   a. `orders` table updated
   b. Supabase Realtime fires postgres_changes event
   c. Hook receives new status
   d. Screen updates status timeline and bottom sheet content
6. On unmount: hook unsubscribes from both channels
```

### 4.3 Chat Messages (Bidirectional Flow)

```
Sending:
1. User types message in chat screen
2. Screen calls useChat().sendMessage(content)
3. Hook calls api.sendChatMessage(orderId, content, senderId)
4. api.ts inserts into `chat_messages` table
5. Supabase Realtime broadcasts the INSERT event

Receiving:
1. useChat(orderId) subscribes to `chat:{orderId}` channel
2. On INSERT event: new ChatMessage received
3. Hook appends to local messages array
4. Screen re-renders with new message in the list
```

---

## 5. Folder Structure Rationale

### Why This Structure?

The folder structure follows the **Feature-first** principle for screens (grouped by auth, tabs, flows) and the **Layer-first** principle for shared code (hooks, components, stores, lib).

```
user-app/
├── app/          ← SCREENS (Feature-first: grouped by user journey)
│   ├── (auth)/   ← Authentication flow screens
│   ├── (tabs)/   ← Main tab navigation screens
│   └── (flows)/  ← Task-specific flow screens
├── components/   ← PRESENTATION (Reusable UI widgets)
│   └── ui/       ← Only pure presentational components
├── hooks/        ← LOGIC (Business logic and data access)
├── store/        ← STATE (Persistent shared state)
├── constants/    ← CONFIG (Tokens, strings, env)
└── lib/          ← INFRASTRUCTURE (Supabase client, API functions)
```

### Why Separate `(auth)`, `(tabs)`, `(flows)`?

- **(auth)** screens use a Stack navigator with no tab bar
- **(tabs)** screens have the bottom tab bar visible
- **(flows)** screens are pushed on top of tabs (tracking, checkout, chat detail)
- This maps directly to Expo Router's layout groups

### Why `components/ui/` and not just `components/`?

- `components/ui/` signals "these are pure, reusable UI atoms"
- No business logic contamination
- Easy barrel export via `components/ui/index.ts`
- If the project grows, other component directories could be added (e.g., `components/layout/`)

---

## 6. Boundaries (What Goes Where)

### Decision Matrix

| "I need to..." | Put it in... |
|---|---|
| Define a type or interface | `shared/types.ts` |
| Define a color, spacing, or radius value | `constants/brand.ts` |
| Define a user-facing string | `constants/strings.ts` |
| Create a Supabase query function | `lib/api.ts` |
| Initialize the Supabase client | `lib/supabase.ts` |
| Add business logic or data fetching | `hooks/useXxx.ts` |
| Create a reusable visual component | `components/ui/Xxx.tsx` |
| Store state shared between screens | `store/xxxStore.ts` |
| Create a screen the user navigates to | `app/(group)/screen.tsx` |
| Add an AI/backend function | `supabase/functions/xxx/` |

### Forbidden Crossings

| From | Cannot Import | Why |
|---|---|---|
| `components/ui/` | `hooks/`, `lib/`, `store/` | Components are pure — no logic, no data |
| Screens (`app/`) | `lib/supabase.ts` directly | Always go through hooks → api.ts |
| Screens (`app/`) | Other screens | Never cross-import screens |
| `hooks/` | `components/ui/` | Hooks don't render UI |
| `constants/` | Anything except types | Constants are leaf nodes |

---

## 7. Supabase Architecture Details

### 7.1 Database (16 Tables)

**Core Tables**:
- `users` — Customer accounts with trust scores
- `drivers` — Driver profiles with vehicle info and approval status
- `orders` — The central entity with full lifecycle state machine
- `chat_messages` — Real-time chat within orders
- `payments` — Payment records (cash/card/wallet)
- `driver_locations` — Time-series GPS data (partitioned monthly)
- `fraud_flags` — Detected suspicious behavior

**Supporting Tables**:
- `user_verifications`, `driver_verifications` — KYC documents
- `reviews` — Star ratings with comments
- `order_status_log` — Audit trail for state transitions
- `order_items` — Line items for delivery orders
- `moderation_rules` — Configurable rule definitions
- `banned_keywords` — Multi-language keyword blocklist
- `notifications` — Push notification log

### 7.2 Row-Level Security (RLS)

Every table has RLS enabled. Key policies:

- **Users** can only read/write their own rows
- **Drivers** can only read orders where `status = 'pending_driver'` or `driver_id = their_id`
- **Admins** have broader access gated by `auth.jwt()->>'role' = 'admin'`
- The `supabase` anon key is used in mobile apps — RLS prevents unauthorized access

### 7.3 Edge Functions (3 Functions)

| Function | Trigger | Purpose |
|---|---|---|
| `match-driver` | After order approved | Find and notify nearby available drivers |
| `send-notification` | Various events | Write to notifications table + send push via Expo Push API |

### 7.4 Realtime Channels

| Channel Pattern | Event | Used By |
|---|---|---|
| `order:{orderId}` | UPDATE on orders | User tracking screen |
| `driver_location:{driverId}` | INSERT on driver_locations | User tracking screen |
| `driver_offers:{driverId}` | Broadcast | Driver home screen |
| `chat:{orderId}` | INSERT on chat_messages | Chat screen (both) |

---

## 8. How the Project Scales

### Phase 1: MVP (Current)
- Single Supabase project (Free/Pro tier)
- 3 Edge Functions
- ~16 tables
- 1 region (Safi)
- Cash payments only

### Phase 2: Growth
- Supabase Pro plan for higher connection limits
- Add payment integration (card, mobile wallet)
- Driver app completed
- Admin panel completed
- Driver location table partitioned monthly

### Phase 3: Multi-Region
- Consider read replicas for performance
- Zone-based driver matching (already supported via `current_zone` field)
- Expand to additional Moroccan cities
- Consider separate Supabase projects per major region if needed

### Phase 4: Scale
- Move AI moderation to dedicated service if Edge Function limits are hit
- Add Redis layer for driver location caching (via Supabase or external)
- Consider custom backend for complex features (loyalty, analytics)
- CDN for media assets (avatars, chat images)

### Scaling Principles
1. **Start simple** — Supabase handles everything for MVP
2. **Extract when needed** — Only add infrastructure when there's a clear bottleneck
3. **Data portability** — Standard Postgres means data can migrate anywhere
4. **Client-side intelligence** — React Query caching reduces server load
5. **Incremental complexity** — Each phase adds one layer, never a full rewrite

---

## 9. Security Architecture

### Authentication Flow

```
Phone + Password → Supabase Auth → JWT (access token 15min + refresh token 7d)
Phone OTP → Supabase Auth → Verified flag on user record
```

### Security Layers

| Layer | Protection |
|---|---|
| **Transport** | TLS 1.3 for all connections |
| **Authentication** | JWT with short-lived access tokens |
| **Authorization** | Row-Level Security on every table |
| **Data** | No sensitive data in client code; anon key only |
| **Input** | Text sanitization before AI analysis (strip HTML, length limit) |
| **Secrets** | Environment variables for all keys; never in source code |
| **Logging** | Phone numbers masked in logs (+212 6** *** **3) |

### What Must NEVER Be Exposed

- Supabase service role key (server-side only, in Edge Functions)
- Full phone numbers in logs or error messages
- Password hashes in any client response

---

## 10. Key Architectural Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Backend | Supabase (not custom server) | Faster development, built-in real-time, auth, and storage |
| Mobile framework | Expo + React Native (not Flutter) | Existing team knowledge, NativeWind compatibility, Expo Go |
| Styling | NativeWind v4 (not StyleSheet) | Utility-first, consistent with admin Tailwind, faster iteration |
| State management | Zustand + React Query (not Redux) | Lighter weight, less boilerplate, better separation of concerns |
| Moderation | Rule-based + Admin Review | Simple, predictable, and easy to audit |
| Navigation | Expo Router v3 (not React Navigation) | File-based routing, simpler mental model, type-safe |
| Mono repo structure | Flat directories (not npm workspaces) | Simpler for a small team, fewer config issues |

---

*This architecture is designed to get the MVP built fast, run reliably, and scale when needed.*
