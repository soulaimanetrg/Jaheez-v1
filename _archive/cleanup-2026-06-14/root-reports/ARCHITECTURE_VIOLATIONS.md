# Architectural Violations Report

This document outlines structural deviations from the strict Express MVC + Service-Layer + Repository pattern established for the JAHEEZ platform.

---

## 1. Direct Frontend Table Reads (Bypassing MVC)

* **Exact File Path**: `frontend/user-app/app/(flows)/addresses.tsx` (line 40)
* **Exact Function/Component**: Address list screen React hook.
* **Root Cause**: Bypasses the unified Express MVC backend layer. The client application queries the database directly using `supabase.from('user_addresses').select('*')` instead of calling the backend REST endpoints.
* **Severity**: CRITICAL
* **Why it is a violation**:
  1. **Bypasses Service Layer**: Bypasses business validation, formatting rules, and logging.
  2. **Bypasses Audit Logging**: Bypasses the unified `AuditLogService` logging system, which is only executed inside backend Express controllers.
  3. **Duplicate Security Logic**: Forces security to be managed in both PostgreSQL RLS and Express route middlewares, increasing maintenance overhead and the chance of security configuration drift.
* **Exact Fix**:
  Refactor the React screen to fetch addresses via the Express API using:
  ```typescript
  const data = await backendJson<Address[]>('/admin-api/v1/customer/addresses', { method: 'GET' });
  ```

---

## 2. Legacy Monolith Script Retention

* **Exact File Path**: `scripts/admin-api.js`
* **Exact Function/Component**: Legacy startup configuration.
* **Root Cause**: The deprecated monolith API file `admin-api.js` is still present in the workspace root and is still launched by scripts during local development.
* **Severity**: MEDIUM
* **Why it is a violation**:
  1. **Attack Surface**: Obsolete files increase the system's attack surface.
  2. **Configuration Drift**: Running two backend processes locally (`scripts/admin-api.js` and `npm run dev --prefix backend`) creates port conflicts and leads to confusion during API testing.
* **Exact Fix**:
  1. Delete `scripts/admin-api.js`.
  2. Update all startup command scripts (`package.json`) to run the compiled Express backend directly.

---

## 3. Redundant Routing Prefix Muxing

* **Exact File Path**: `scripts/proxy.js` and `backend/src/app.ts`
* **Exact Function/Component**: App-level route registration.
* **Root Cause**: All API routes in the Express backend are registered under the `/admin-api` path prefix, regardless of whether the route is for drivers, customers, store listings, or administrative panel operations.
* **Severity**: LOW
* **Why it is a violation**:
  Creates namespace confusion. Naming all client routes as `/admin-api` obscures route ownership, complicates API documentation, and creates security routing concerns.
* **Exact Fix**:
  Simplify API routing namespaces to follow standard conventions:
  * `/api/v1/customer/*`
  * `/api/v1/driver/*`
  * `/api/v1/admin/*`

---

## 4. Mixed Transactional Abstraction (Direct SDK Queries vs SQL RPCs)

* **Exact File Path**: `backend/src/features/order/orderLifecycle.repository.ts` and related features.
* **Exact Function/Component**: Service/Repository layers.
* **Root Cause**: The backend mixes SQL transaction methods. Some features execute complex transactional sequences via client-built queries, while others rely on raw PostgreSQL RPC functions (`supabase.rpc('update_order_lifecycle')`) defined in Supabase.
* **Severity**: MEDIUM
* **Why it is a violation**:
  Violates clean code separation. Spreading transactional flow logic across both TypeScript files and SQL migrations makes it difficult to audit transaction safety, handle error boundaries, or trace side effects.
* **Exact Fix**:
  Unify transactional write operations under repositories that execute atomic operations, deprecating raw RPC functions in favor of structured backend queries.
