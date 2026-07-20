# 19. Codebase Search Log

This document lists the search queries executed to audit the repository.

---

## 1. Search Queries

### Search 01: Direct Supabase Client Mutations (Writes)
*   **Query**: `supabase.from` / `.insert(` / `.update(` / `.delete(` / `.rpc(`
*   **Target Scope**: `user-app`, `driver-app`, `admin`, `backend`, `scripts`
*   **Key Finding**: Identified direct inserts and updates on the `orders`, `user_addresses`, `favorites`, and `chat_messages` tables from the mobile applications.

### Search 02: Stripe Checkout Amounts
*   **Query**: `stripe` / `checkout-session` / `amount_centimes`
*   **Target Scope**: `user-app`, `scripts/admin-api.js`
*   **Key Finding**: Confirmed that Stripe payment amounts are calculated in the customer application and passed directly to the backend.

### Search 03: Auth and JWT Handling
*   **Query**: `jwt` / `Authorization` / `Bearer` / `admin@jaheez.ma`
*   **Target Scope**: `backend/src/`, `scripts/admin-api.js`
*   **Key Finding**: Located a hardcoded mock admin account (`admin@jaheez.ma` / `admin123`) in `scripts/admin-api.js` line 362.

### Search 04: Realtime Systems (Socket.IO & Redis)
*   **Query**: `socket` / `io` / `redis` / `geoadd` / `heartbeat`
*   **Target Scope**: `backend/src/`
*   **Key Finding**: Located Socket.IO server configurations and Redis location updates. Verified that the Socket.IO server is initialized in `server.ts` via `attachSocketServer(server)` and that a driver heartbeat worker is started, but clients lack Socket.IO client library integration.
