# Working Features Catalog

This document details the successfully implemented, verified, and active features within the JAHEEZ platform codebase. These systems have been validated programmatically by automated test suites.

---

## 1. Core API & Backend Features

### Server-Authoritative Checkout Calculation
* **File Path**: `backend/src/features/order/checkout.service.ts`
* **Function**: `processCheckout`
* **Details**: Computes subtotals, delivery fees, promo discounts, and order totals authoritatively on the server.
  * Validates that the store exists and is open.
  * Validates menu item availability and fetches official prices directly from the database.
  * Validates required and optional product custom choices and modifiers (options), incorporating official price deltas from the database.
  * Calculates delivery fees dynamically based on the customer's historical order count (first 3 orders get free delivery, subsequent orders cost a flat 15 MAD).
  * Computes promo code discounts against constraints (expiration date, minimum order amount, maximum discount, and usage count).
* **Test Status**: **PASS** (Verified by `test-checkout-security.js` and `test-order-flow.js`)

### API Request Schema Validation (Zod Validation)
* **File Path**: `backend/src/features/order/checkout.validators.ts` and other feature validator files.
* **Function**: Router middleware hooks.
* **Details**: All API endpoints parse incoming payloads against strict Zod validation schemas. Unsupported body fields (e.g. client-side totals) are systematically rejected, returning a `400 Bad Request` or validation error response.
* **Test Status**: **PASS** (Verified by `test-checkout-security.js` and `test-checkout-validation.js`)

### Order Idempotency Safeguards
* **File Path**: `backend/src/features/order/checkout.service.ts` at `processCheckout`
* **Details**: Requires an `Idempotency-Key` header for checkout operations. It stores the key and its response payload atomically in the database to prevent duplicate charges or double order creations on network retry.
* **Test Status**: **PASS** (Verified by `test-checkout-security.js`)

---

## 2. Driver Management under Salary Model

### Salary Model Driver Metrics
* **File Path**: `backend/src/features/order/orderLifecycle.service.ts`
* **Details**: Under the employee salary model:
  * Auto-calculated commission payouts are disabled. Payout requests (`getPayouts` / `requestPayout` in `driver.service.ts`) throw `400 BadRequestError`.
  * Cash-on-Delivery (COD) balance tracks 100% of the cash collected from the client on delivery.
  * Drivers receive exactly 25% of the customer tips (`rider_tip`) as a performance bonus, which is tracked on delivery completion.
* **Test Status**: **PASS** (Verified by `test-order-flow.js`)

### Strict Driver State Engine & Dispatch Rules
* **File Path**: `backend/src/features/driver/driver.service.ts` and `backend/src/features/dispatch/driverStateCache.ts`
* **Details**: Driver status transitions are governed by strict business logic:
  * Only drivers in the `AVAILABLE` state (active, online, and not currently offered or carrying a load) are eligible to receive dispatch offers.
  * Delivering drivers (carrying active loads) are excluded from the dispatch loop.
  * The matching engine prioritizes drivers by:
    1. Status: Must be `AVAILABLE`
    2. Load: Must have 0 active orders
    3. Performance: Sorted by highest Acceptance Rate
    4. Distance: Nearest to the store (tie-breaker)
* **Test Status**: **PASS** (Verified by `test-driver-states.js` and `test-dispatch-rules.js`)

---

## 3. Operations & Telemetry Abuse Controls

### Real-Time GPS Telemetry Gating & Stalling Rules
* **File Path**: `backend/src/features/driver/driver.service.ts` at `updateLocation`
* **Details**: Location heartbeats track coordinates and automatically flag driver stalls:
  * Reassigns the order if a driver remains stationary (> 20 meters) for more than 5 minutes after accepting the order.
  * Fires warning events if a driver remains stationary for more than 3 minutes.
  * Triggers warnings if a driver is arrived at the pickup location but fails to collect the order for more than 10 minutes, and reassigns it after 12 minutes.
  * Triggers warning if the driver exceeds the ETA by more than 15 minutes.
* **Test Status**: **PASS** (Verified by `test-driver-states.js` and `test-customer-protection.js`)

### Automated Abuse Escalation Path
* **File Path**: `backend/src/features/order/abuseDetection.service.ts`
* **Function**: `reportViolation`
* **Details**: Automatically tracks driver warning count and escalates:
  * **Warning 1 & 2**: Emits warning notifications to the driver and admin panel.
  * **Warning 3**: Places a temporary 1-hour block (`suspension_until` in database) and logs driver out.
  * **Warning 4+**: Places a permanent block (`is_active = false` and `suspension_until = 9999-12-31`) and creates a support ticket for administrative review.
* **Test Status**: **PASS** (Verified by `test-abuse-detection.js`)

---

## 4. Frontend & Presentation Assets

### Dynamic Branding & Localization
* **File Path**: `frontend/user-app/` and `frontend/driver-app/`
* **Details**: Standard UI components employ consistent theme configurations (`constants/brand.ts`) and support bilingual localization (Arabic/French) for customer menus, store names, addresses, and status screens.
