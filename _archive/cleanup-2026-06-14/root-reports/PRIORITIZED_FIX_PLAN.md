# Prioritized Refactor Roadmap

## Phase 1 - Critical Security

- Exact files: `scripts/admin-api.js`, `user-app/app/(flows)/checkout.tsx`, `user-app/lib/stripeClient.ts`, `user-app/lib/orderApi.ts`, Supabase RLS migrations.
- Dependencies: backend build must be fixed enough to host secure replacements.
- Risk level: Critical.
- Deployment order: remove mock admin fallback; make Stripe session order-id-only; add backend replacements for direct writes; tighten RLS.
- Rollback strategy: cash-only mode and legacy read-only fallback.
- Blocking issues: current backend does not compile.
- Estimated complexity: High.

## Phase 2 - Backend Authority

- Exact files: `backend/src/routes`, `backend/src/controllers`, `backend/src/services`, `backend/src/repositories`, `scripts/proxy.js`, client API helpers.
- Dependencies: Phase 1 compile/security fixes.
- Risk level: High.
- Deployment order: migrate endpoints from monolith to MVC one domain at a time: auth, orders, users, addresses, favorites, chat, notifications, admin.
- Rollback strategy: route-level proxy fallback during migration.
- Blocking issues: endpoint parity tests missing.
- Estimated complexity: High.

## Phase 3 - MVC Enforcement

- Exact files: `scripts/admin-api.js`, `backend/src/**`, `user-app/lib/*.ts`, `driver-app/lib/api.ts`, `admin/src/lib/*.ts`.
- Dependencies: MVC backend feature parity.
- Risk level: High.
- Deployment order: controllers thin; services own all business rules; repositories CRUD/RPC only; helpers transport only.
- Rollback strategy: keep old monolith disabled but available in staging.
- Blocking issues: duplicated finance/order logic.
- Estimated complexity: High.

## Phase 4 - Realtime Stabilization

- Exact files: `backend/src/server.ts`, `backend/src/config/socket.ts`, new socket gateway files, `user-app/hooks/useTracking.ts`, driver/admin realtime clients.
- Dependencies: stable auth/JWT.
- Risk level: Medium-high.
- Deployment order: add authenticated socket server; emit from services; keep Supabase realtime as read fallback; add Redis reconciliation.
- Rollback strategy: disable socket feature flag and fall back to polling/Supabase subscriptions.
- Blocking issues: no existing socket server.
- Estimated complexity: Medium-high.

## Phase 5 - Frontend Cleanup

- Exact files: `user-app/store/cartStore.ts`, `user-app/app/(flows)/checkout.tsx`, `driver-app/app/(tabs)/earnings.tsx`, `driver-app/app/(auth)/*`, `admin/src/pages/*`.
- Dependencies: backend endpoints available.
- Risk level: Medium.
- Deployment order: remove secure calculations from UI; remove demo/fake flows; disable KYC/payout screens; make API helpers pure transport.
- Rollback strategy: app release rollback.
- Blocking issues: UI currently depends on direct Supabase for several flows.
- Estimated complexity: Medium.

## Phase 6 - Legacy Removal

- Exact files/directories: `scripts/admin-api.js`, `scripts/proxy.js`, `server.js`, `html-preview`, `jaheez-temp`, `jaheez_workspace`, `artifacts`.
- Dependencies: MVC backend and hosting replacement.
- Risk level: Medium.
- Deployment order: archive prototype folders; remove monolith from production start; replace dev proxy with documented services.
- Rollback strategy: keep archived tag/branch.
- Blocking issues: admin still points to legacy API.
- Estimated complexity: Medium.

## Phase 7 - Production Deployment

- Exact files: package scripts, CI config, env examples, backend/admin/mobile build configs.
- Dependencies: phases 1-6.
- Risk level: High.
- Deployment order: add CI build/typecheck; env validation; health checks; database migration verification; staged rollout.
- Rollback strategy: blue/green or previous deployment image.
- Blocking issues: backend and admin build failures.
- Estimated complexity: Medium-high.

## Phase 8 - Scalability Preparation

- Exact files: backend services/repositories, Redis integration, database indexes/migrations, realtime gateway.
- Dependencies: stable production architecture.
- Risk level: Medium.
- Deployment order: add indexes, Redis queue/dispatch, rate limits, observability, load tests.
- Rollback strategy: disable dispatch acceleration and fall back to DB-backed assignment.
- Blocking issues: no single source of truth today.
- Estimated complexity: Medium.
