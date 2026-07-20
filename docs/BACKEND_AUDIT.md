# JAHEEZ (جاهز) — BACKEND & API AUDIT
**Prepared by: Technical Due Diligence Team**  
**Project:** Moroccan Hyperlocal Logistics Platform (Safi Launch)  
**Status:** Medium Risk — Monolithic Architecture Refactoring Needed

---

## 1. ARCHITECTURAL CRITIQUE: THE 3,000-LINE MONOLITH

The backend API server resides in a single, unstructured file: [admin-api.js](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/scripts/admin-api.js). It spans over 3,190 lines of code, managing:
1. Postgres connection pools.
2. Supabase service role initializations.
3. JWT admin sessions and lockout tracking.
4. ~90 REST endpoints covering orders, drivers, stores, refunds, push notifications, and support tickets.
5. Scaffolding for Stripe and SMS gateways.

### Key Monolith Risks:
* **Single Point of Failure:** An unhandled error or native crash in a payment route crashes the entire API, bringing down order routing, driver updates, and admin dashboards simultaneously.
* **Maintainability & Scale Blocker:** Multiple developers editing a single 3k+ line file leads to frequent merge conflicts and regression bugs.

---

## 2. TRANSACTION SAFETY & VALIDATION GAPS

### Direct Database Inserts & Missing Schema Checks
* **Issue:** Incoming request bodies are passed directly to SQL queries or Supabase inserts with minimal validation.
* **Example:** In `POST /admin-api/products`, properties from `req.body` are inserted directly:
  ```javascript
  const { data, error } = await sb.from('menu_items').insert({
    store_id:       d.store_id,
    category_id:    d.category_id || null,
    name:           d.name,
    ...
  });
  ```
  If fields like `price` contain invalid data types (e.g. text instead of integer), the DB driver throws unhandled exceptions.
* **Fix:** Integrate **Zod** schema validation middleware on all write endpoints.

---

## 3. MISSING INTEGRATIONS & SECURITY CONTROLS

### Stripe Webhook Verification Gaps
* **Issue:** The Stripe payment flow creates sessions, but does not implement raw-body webhook signature validation (`stripe.webhooks.constructEvent`). If the checkout redirect fails, the payment state will never synchronize.
* **Fix:** Wire up a dedicated webhook route `/admin-api/stripe/webhook` that processes raw request bodies and securely updates order states upon `checkout.session.completed`.

---

### Rate Limiting & DoS Gaps
* **Issue:** endpoints like `/admin-api/login` and `/admin-api/otp/send` do not limit request counts, making them vulnerable to brute-force and SMS OTP gateway costs.
* **Fix:** Integrate `express-rate-limit` to block IPs exceeding a specific requests threshold.
