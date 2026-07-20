# JAHEEZ — Backend Authority Unification Report

This report documents the completed migration and consolidation of administrative, configuration, and transactional endpoints from the legacy `scripts/admin-api.js` server (port `3001`) into the restructured Express MVC backend on port `3002`.

---

## 1. Migrated Routes & Features

All legacy monolith endpoints have been ported to the `backend/src` Express MVC codebase. The following domains are now fully authoritative under port `3002`:

| Component / Domain | HTTP Method | Endpoint Path | Middlewares | Description / Action |
| :--- | :--- | :--- | :--- | :--- |
| **Settings & CMS** | `GET` | `/admin-api/settings` | `adminAuth`, `requireRole('super_admin')` | Retrieve all app settings |
| | `POST` | `/admin-api/settings` | `adminAuth`, `requireRole('super_admin')` | Update app settings |
| | `GET` | `/admin-api/app-settings/public` | None (Public) | Fetch public settings (cached 60s) |
| | `GET` | `/admin-api/cities` | `adminAuth`, `requireRole('super_admin','operations')` | List all cities |
| | `POST` | `/admin-api/cities` | `adminAuth`, `requireRole('super_admin')` | Create new city |
| | `PATCH` | `/admin-api/cities/:id` | `adminAuth`, `requireRole('super_admin')` | Update city metadata |
| | `DELETE` | `/admin-api/cities/:id` | `adminAuth`, `requireRole('super_admin')` | Delete city |
| | `GET` | `/admin-api/cities/public` | None (Public) | Fetch active cities list |
| | `GET` | `/admin-api/service-categories` | `adminAuth`, `requireRole('super_admin','operations','content_manager')` | List service categories |
| | `POST` | `/admin-api/service-categories` | `adminAuth`, `requireRole('super_admin','content_manager')` | Create service category |
| | `PATCH` | `/admin-api/service-categories/:id` | `adminAuth`, `requireRole('super_admin','content_manager')` | Update category metadata |
| | `DELETE` | `/admin-api/service-categories/:id` | `adminAuth`, `requireRole('super_admin','content_manager')` | Delete category |
| | `GET` | `/admin-api/service-categories/public` | None (Public) | Fetch public categories |
| | `GET` | `/admin-api/zones` | `adminAuth`, `requireRole('super_admin','operations')` | List delivery zones and fees |
| | `POST` | `/admin-api/zones` | `adminAuth`, `requireRole('super_admin','operations')` | Create delivery zone |
| | `PATCH` | `/admin-api/zones/:id` | `adminAuth`, `requireRole('super_admin','operations')` | Update delivery zone |
| | `DELETE` | `/admin-api/zones/:id` | `adminAuth`, `requireRole('super_admin','operations')` | Delete delivery zone |
| | `GET` | `/admin-api/promotions` | `adminAuth`, `requireRole('super_admin','operations','content_manager')` | List all promotions |
| | `POST` | `/admin-api/promotions` | `adminAuth`, `requireRole('super_admin','content_manager')` | Create discount promotion |
| | `PATCH` | `/admin-api/promotions/:id` | `adminAuth`, `requireRole('super_admin','content_manager')` | Update promotion |
| | `DELETE` | `/admin-api/promotions/:id` | `adminAuth`, `requireRole('super_admin','content_manager')` | Delete promotion |
| | `GET` | `/admin-api/active-promotions` | None (Public) | List active public promotions |
| | `POST` | `/admin-api/validate-promo` | None (Public) | Validate promo code and get discount amount |
| | `GET` | `/admin-api/banners` | `adminAuth`, `requireRole('super_admin','operations','content_manager')` | List home screen banners |
| | `POST` | `/admin-api/banners` | `adminAuth`, `requireRole('super_admin','content_manager')` | Create new banner |
| | `PATCH` | `/admin-api/banners/:id` | `adminAuth`, `requireRole('super_admin','content_manager')` | Update banner |
| | `DELETE` | `/admin-api/banners/:id` | `adminAuth`, `requireRole('super_admin','content_manager')` | Delete banner |
| | `GET` | `/admin-api/banners/public` | None (Public) | Fetch active banners |
| **Finance** | `GET` | `/admin-api/wallets` | `adminAuth`, `requireRole('super_admin','finance')` | List all user wallets |
| | `GET` | `/admin-api/wallets/:user_id` | `adminAuth`, `requireRole('super_admin','finance')` | Wallet details + transactions |
| | `POST` | `/admin-api/wallets/:user_id/adjust` | `adminAuth`, `requireRole('super_admin','finance')` | Manual balance adjust (audited) |
| | `POST` | `/admin-api/wallets/:user_id/freeze` | `adminAuth`, `requireRole('super_admin','finance')` | Freeze user wallet |
| | `POST` | `/admin-api/wallets/:user_id/unfreeze` | `adminAuth`, `requireRole('super_admin','finance')` | Unfreeze user wallet |
| | `GET` | `/admin-api/refunds` | `adminAuth`, `requireRole('super_admin','finance')` | List all refund requests |
| | `GET` | `/admin-api/refunds/stats` | `adminAuth`, `requireRole('super_admin','finance')` | Refund count and amount stats |
| | `POST` | `/admin-api/refunds` | `adminAuth`, `requireRole('super_admin','finance')` | Create refund request |
| | `PATCH` | `/admin-api/refunds/:id` | `adminAuth`, `requireRole('super_admin','finance')` | Moderation: transition status (credits wallet) |
| | `GET` | `/admin-api/payouts` | `adminAuth`, `requireRole('super_admin','finance')` | List driver payout requests |
| | `PATCH` | `/admin-api/payouts/:id` | `adminAuth`, `requireRole('super_admin','finance')` | Approve/pay/reject driver payout |
| | `GET` | `/admin-api/cod-settlements` | `adminAuth`, `requireRole('super_admin','finance')` | List driver cash settlements |
| | `POST` | `/admin-api/cod-settlements` | `adminAuth`, `requireRole('super_admin','finance')` | Confirm driver cash returned |
| **Support & Reviews** | `GET` | `/admin-api/support` | `adminAuth`, `requireRole('super_admin','support')` | List support tickets sorted by urgency |
| | `PATCH` | `/admin-api/support/:id` | `adminAuth`, `requireRole('super_admin','support')` | Update support request status/note |
| | `GET` | `/admin-api/reviews` | `adminAuth`, `requireRole('super_admin','support')` | List store reviews |
| | `PATCH` | `/admin-api/reviews/:id` | `adminAuth`, `requireRole('super_admin','support')` | Moderate store review visibility |
| **Orders (Admin)** | `GET` | `/admin-api/orders` | `adminAuth`, `requireRole('super_admin','operations','finance')` | List all orders |
| | `GET` | `/admin-api/orders/:id/items` | `adminAuth`, `requireRole('super_admin','operations','finance')` | Get order items |
| | `PATCH` | `/admin-api/orders/:id` | `adminAuth`, `requireRole('super_admin','operations','finance')` | Update order (notes, status, driver, payments) |
| **Drivers (Admin)** | `GET` | `/admin-api/drivers` | `adminAuth`, `requireRole('super_admin','operations')` | List drivers |
| | `GET` | `/admin-api/drivers/:id` | `adminAuth`, `requireRole('super_admin','operations')` | Driver details, docs, and payouts |
| **Auth (Admin)** | `GET` | `/admin-api/me` | `adminAuth` | Get logged-in admin profile |
| | `POST` | `/admin-api/login` | `authLimiter` | Authenticate admin account |

---

## 2. Deletion of Duplicated Business Logic

The legacy monolith script `scripts/admin-api.js` has been replaced with a minimal deprecation script that issues an error and terminates execution if run. This guarantees:
1.  **Zero Duplicate Code Paths**: The legacy 151KB monolith has been cleaned up.
2.  **Retired Split Authority Routing**: All mobile applications and the admin panel target port `3002` directly (or port `5000` which forwards all `/admin-api` to `3002`), making split-authority routing obsolete.
3.  **Unified Driver Salary Model**: Gig/commission code blocks present in the monolith have been discarded in favor of the Express service ledger, which records a flat hourly wage base and credits drivers exactly 25% of tips.
4.  **Enforced State Machine Transitions**: The database RPC `update_order_lifecycle` handles all transitions, eliminating JavaScript race conditions.

---

## 3. Remaining Legacy Dependencies & Proxy Status

1.  **Vite Proxy Bypass**: `frontend/admin/vite.config.ts` has been configured to target the Express MVC backend at `http://localhost:3002` directly, bypassing `scripts/proxy.js` for Vite dashboard API requests.
2.  **Mobile Network Client Redirection**:
    *   `frontend/user-app/lib/adminApi.ts` and `frontend/driver-app/lib/api.ts` have been updated to connect directly to port `3002` (Express MVC backend) instead of port `5000` (the development proxy server) for all API operations on native devices.
3.  **Proxy Role**: The proxy server `scripts/proxy.js` (port `5000`) is now strictly a **frontend asset router and dev-server proxy** for Metro (port `8081` / `8082`) and Vite Admin (port `3000`), with zero role in API endpoint or business logic routing.

---

## 4. Blockers Before Deleting `scripts/admin-api.js`

With the complete migration and deprecation finished, there are **no functional blockers** to deleting `scripts/admin-api.js` entirely. However, before executing a hard delete, ensure:
1.  **Dev Environment Configs**: Ensure that no local development runner scripts or shell scripts (e.g., custom startup scripts) in the developer's local system attempt to execute `node scripts/admin-api.js`.
2.  **CI/CD Pipeline Gating**: Verify that no deployment scripts, lint tasks, or Docker configurations reference the file `scripts/admin-api.js`.
3.  **Test Script Documentation**: Update references in custom test suite headers that mention the legacy monolith. (Done: All E2E test suites now run and verify directly against the restructured backend).
