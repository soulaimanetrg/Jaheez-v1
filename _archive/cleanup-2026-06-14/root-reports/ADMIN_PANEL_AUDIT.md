# Admin Panel Audit

## Verdict

Status: LEGACY ACTIVE, PARTIALLY WORKING, NOT STRICT MVC

The admin panel is connected primarily to the legacy monolith. It has many management pages, but role checks and data mutations rely on `scripts/admin-api.js` and service-role Supabase access, not the new MVC backend.

## API Connection Evidence

- `admin/vite.config.ts` proxies `/admin-api` to `http://localhost:3001`.
- `admin/src/lib/api.ts` uses `BASE = '/admin-api'`.
- `admin/src/lib/adminApi.ts` also uses `/admin-api`.
- `admin/src/pages/settings.tsx` constructs URLs like `${API_BASE}/admin-api/settings`, which risks double-prefix problems depending on API base configuration.

## Role Permissions

Status: PARTIALLY WORKING

Evidence:

- Admin UI has route-level role mapping in `admin/src/components/layout.tsx`.
- Legacy API has `requireRole(...)` in `scripts/admin-api.js`.

Risk:

- UI guards are not sufficient. Server-side enforcement must be the source of truth. Many admin operations do use `requireRole`, but because the API is monolithic, role enforcement is duplicated and hard to audit.

## Dashboard / Analytics / Finance

Status: PARTIALLY WORKING / RISKY

Evidence:

- Legacy API includes dashboard stats, finance settings, COD settlement, payout requests, refunds, wallets, and driver revenue endpoints.
- Finance is tied to `earnings_centimes`, `driver_share_pct`, and `payout_requests`, which conflicts with salary-based drivers.

## Realtime

Status: NOT CONNECTED

Socket.IO client dependency exists, but the admin app does not have a traced authenticated socket subscription to order/dashboard rooms, and the backend has no wired Socket.IO server.

## Critical Admin Issue

- Category: Deployment/API authority
- Severity: CRITICAL
- File path: `admin/vite.config.ts`
- Current behavior: admin proxies `/admin-api` to legacy port `3001`.
- Broken behavior: admin does not use the new MVC backend as the production source of truth.
- Why it matters: admin actions define operational truth for orders, stores, drivers, finance, refunds, and notifications.
- Product impact: operations can mutate data through a legacy code path while mobile apps use different assumptions.
- Exploit / failure risk: inconsistent role enforcement and service-role broad mutation surface.
- Exact recommended fix: migrate admin endpoints to MVC backend, then switch proxy/API base to the new API only.
- Priority: P0
