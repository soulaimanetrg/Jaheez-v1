# 09. Checkout and Payment Security Audit

This document details the checkout workflow, price validation logic, and payment integration security.

---

## 1. Current Checkout Flow

### Restructured Backend Flow (Secure)
*   **Submission**: The customer cart page calls `POST /admin-api/v1/checkout` on the backend, which does all subtotal and delivery calculations server-side and writes the order.
*   **Stripe Request**: The mobile app `stripeClient.ts` calls `POST /admin-api/v1/payments/stripe/checkout-session`, passing only the `order_id`.
*   **Server Verification**: The backend `CheckoutService.createStripeCheckoutSession` fetches the order total from the database (`const order = await this.checkoutRepo.getOrderById(orderId)`), calculates the total in centimes server-side (`Math.round(Number(order.total_amount) * 100)`), and validates that the order belongs to the authenticated customer before creating the Stripe session.

---

## 2. Security Vulnerabilities

### The Monolith Bypass Path (Critical)
*   **Vulnerability**: The legacy monolith `scripts/admin-api.js` exposes the endpoint `POST /admin-api/stripe/checkout-session`. If `LEGACY_STRIPE_ROUTES_ENABLED === 'true'`, it reads `amount_centimes` directly from the client request body and initializes Stripe with it.
*   **Impact**: Malicious users can bypass the restructured backend, invoke the monolith route directly, and pay 1 MAD (100 centimes) for any order. The monolith webhook handler will then update the database `payment_status` to `'paid'` for that order ID.
*   **Risk Classification**: **PRODUCTION BLOCKER / CRITICAL BYPASS**

---

## 3. Required MVC Hardening Plan

1.  **Strict Route Disabling**:
    *   Set `LEGACY_STRIPE_ROUTES_ENABLED = false` in `.env`.
    *   Delete the legacy Stripe routes (`POST /admin-api/stripe/checkout-session` and `GET /admin-api/stripe/session/:id`) from `scripts/admin-api.js` completely.
2.  **Stripe Webhook Signatures**:
    *   Implement cryptographic signature verification (`stripe.webhooks.constructEvent`) on webhook endpoints to prevent users from faking Stripe callbacks.
3.  **Idempotency Keys**:
    *   The restructured backend checkout repository already supports saving/getting idempotency keys in `idempotency_keys` table. Ensure this key is consistently checked and populated for all payment actions.

