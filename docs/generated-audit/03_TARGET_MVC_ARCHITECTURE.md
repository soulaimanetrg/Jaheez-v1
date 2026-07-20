# 03. Target MVC Architecture

This document defines the strict target architecture for the JAHEEZ backend and API layers.

---

## 1. Unified Layer Flow

```
   [ Client App ]
         │
         ▼
 ┌───────────────┐
 │  Routes Layer │  <-- Route registration, middleware, and request validation
 └───────┬───────┘
         │
         ▼
 ┌───────────────┐
 │  Controller   │  <-- Extracts context (JWT), parses params, handles HTTP response
 └───────┬───────┘
         │
         ▼
 ┌───────────────┐
 │ Service Layer │  <-- Owns ALL business rules, calculations, and transitions
 └───────┬───────┘
         │
         ▼
 ┌───────────────┐
 │  Repository   │  <-- Persists and queries data (Supabase SQL / RPC / Redis)
 └───────┬───────┘
         │
         ▼
 ┌───────────────┐
 │   Database    │  <-- Supabase / PostgreSQL (Source of Truth)
 └───────────────┘
```

---

## 2. Layer Responsibilities

### Routes Layer
*   **Allowed**:
    *   Mount endpoints (e.g., `router.post('/checkout', ...)`).
    *   Attach JWT authentication middleware.
    *   Attach request payload validation middleware (e.g., Zod validator).
    *   Map HTTP verbs directly to specific Controller methods.
*   **Forbidden**:
    *   Executing database queries.
    *   Containing business logic (conditional validations, totals, etc.).
    *   Sending HTTP responses directly (except when rejected by middleware).

### Controller Layer
*   **Allowed**:
    *   Extract authentication context (user ID, client type, IP address).
    *   Validate the presence and format of query and body parameters.
    *   Translate incoming HTTP requests into clean method arguments for the Service layer.
    *   Map Service return values (data or exceptions) to HTTP responses and status codes (200, 201, 400, etc.).
*   **Forbidden**:
    *   Calculating prices, subtotals, or delivery fees.
    *   Executing SQL queries or database transactions.
    *   Performing direct Supabase updates or Redis writes.
    *   Managing driver assignments or processing wallet state logic.

### Service Layer
*   **Allowed**:
    *   Executing all business rules (subtotal calculations, promo checks, and driver matching).
    *   Enforcing logical state machines (e.g., confirming transition from `preparing` to `ready`).
    *   Coordinating multi-entity updates (e.g., creating an order and debiting a wallet).
    *   Triggering external events (sending notifications, publishing Socket.IO updates, writing telemetry to Redis).
*   **Forbidden**:
    *   Reading request headers or accessing Express HTTP context directly.
    *   Formatting HTTP responses.
    *   Running direct raw SQL queries without going through a Repository.

### Repository Layer
*   **Allowed**:
    *   Abstracting database calls via structured database helpers (e.g., Knex, pg, or Supabase client).
    *   Executing stored database functions (RPCs).
    *   Managing database transactions (`BEGIN`, `COMMIT`, `ROLLBACK`).
    *   Accessing Redis cache methods (`GET`, `SET`, `GEOADD`).
*   **Forbidden**:
    *   Evaluating higher-level business decisions (e.g., checking if a promo is valid for a specific user).
    *   Evaluating role-based access permissions.

### Database Layer (PostgreSQL)
*   **Allowed**:
    *   Enforcing Row-Level Security (RLS) policies.
    *   Securing transaction boundaries and data integrity constraints.
*   **Forbidden**:
    *   Holding mutable application-level business state variables.

### Redis Layer
*   **Allowed**:
    *   Caching active coordinates and heartbeats.
*   **Forbidden**:
    *   Serving as the permanent source of truth for accounts, orders, or wallets.

### Socket.IO Layer
*   **Allowed**:
    *   Validating connection JWTs before handshake.
    *   Isolating events into secure rooms (`order:{id}`, `driver:{id}`).
*   **Forbidden**:
    *   Allowing arbitrary room subscriptions.
    *   Writing directly to databases inside socket event handlers.
