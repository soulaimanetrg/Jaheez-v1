# 13. Function and Module Map

This document maps functions, services, and modules across the applications.

---

## 1. Restructured Backend Modules (`backend/src/`)

### Module 01: Checkout Controller
*   **File**: `backend/src/controllers/checkout.controller.ts`
*   **Methods**:
    *   `checkout`: Validates input payloads, extracts user context, handles optional `idempotency-key` header, and calls `CheckoutService.processCheckout`.
    *   `acceptOrder`, `pickupOrder`, `deliverOrder`: Coordinates driver-side order stages.
    *   `completeOrder`: Admin-only order completion endpoint.
    *   `createStripeCheckoutSession`, `verifyStripeSession`: Server-authoritative payment routes.
*   **Status**: **WORKING (COMPILE) / RUNTIME TABLE DESYNC RISK**. Compiles successfully, but will crash at runtime when querying the missing `idempotency_keys` and `promotions` tables on Supabase.

### Module 02: Checkout Service
*   **File**: `backend/src/services/checkout.service.ts`
*   **Methods**:
    *   `processCheckout`: Executes server-authoritative calculations, item availability/store status validations, and invokes the atomic order creation database transaction.
    *   `createStripeCheckoutSession`, `verifyStripeSession`: Generates session URLs using backend order amounts and checks session statuses against Stripe's API.
    *   `acceptOrder`, `pickupOrder`, `deliverOrder`: Implements status state machine controls and driver metrics updates (jobs, COD balance).
*   **Status**: **WORKING (COMPILE) / RUNTIME TABLE DESYNC RISK**. Compiles successfully, but references missing promotions/idempotency tables and relies on the wrong review table name.

### Module 03: Driver Service
*   **File**: `backend/src/services/driver.service.ts`
*   **Methods**:
    *   `updateLocation`: Pushes active driver coordinates to Redis via `geoadd` and updates the driver's online heartbeat timestamp.
*   **Status**: **WORKING (COMPILE)**. Compiles successfully, but requires client app telemetry integration to function.

---

## 2. Legacy Backend Modules (`scripts/admin-api.js`)

### Module 01: Admin Login
*   **Methods**:
    *   `POST /admin-api/login`: Authenticates admins against local PostgreSQL databases, falls back to hardcoded accounts, and returns custom JWT tokens.
*   **Status**: **WORKING (LEGACY)**.

### Module 02: Dashboard Statistics
*   **Methods**:
    *   `GET /admin-api/dashboard`: Performs counts and aggregates on active database tables.
*   **Status**: **WORKING (LEGACY)**.

---

## 3. Frontend API Modules

### Module 01: User Order API
*   **File**: `user-app/lib/orderApi.ts`
*   **Methods**:
    *   `createOrder`: Sends normal checkouts to the backend API.
    *   `createCustomOrder`: Inserts custom requests directly into Supabase.
*   **Status**: **PARTIALLY WORKING**. Custom checkouts bypass validation rules.

### Module 02: Driver API Client
*   **File**: `driver-app/lib/api.ts`
*   **Methods**:
    *   `updateMe`: Pushes location updates to the backend.
    *   `claim`: Assigns available orders.
*   **Status**: **PARTIALLY WORKING**.
