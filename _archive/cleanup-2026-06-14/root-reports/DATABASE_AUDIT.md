# Database Audit

## Verdict

Status: PARTIALLY HARDENED, SOURCE-OF-TRUTH CONFLICTS

Supabase/PostgreSQL is the intended permanent source of truth, but application code still treats clients and legacy service-role routes as mutation authorities.

## Positive Findings

- `supabase/migrations/015_secure_checkout.sql` removes older order insert/update policies and defines `create_order_atomic`.
- `create_order_atomic` creates order and order items in a transaction.
- Wallet hardening exists in `supabase_schema.sql` and later functions such as `admin_wallet_adjust`.

## Risks

### Conflicting RLS history

- Severity: HIGH
- Files: `supabase_schema.sql`, `supabase/migrations/015_secure_checkout.sql`
- Current behavior: baseline schema allows own order insert/update, later migration drops those policies.
- Risk: deployments that miss migration 015 remain unsafe.
- Fix: make migration state explicit; add verification SQL to deployment.

### Frontend write code conflicts with hardened RLS

- Severity: HIGH
- Files: `user-app/lib/orderApi.ts`, `user-app/app/(flows)/addresses.tsx`, `user-app/lib/storeApi.ts`
- Current behavior: code still expects direct writes to some tables.
- Risk: tightening RLS can break app flows; leaving RLS broad violates backend authority.
- Fix: migrate writes to backend endpoints before tightening policies.

### Finance model mismatch

- Severity: HIGH
- Tables: `drivers`, `payout_requests`, `cod_settlements`, `app_settings`
- Current behavior: driver earnings and payout requests are active.
- Risk: salary-based target conflicts with revenue-share schema and screens.
- Fix: preserve historical columns, stop accrual, move payroll outside order completion.

### Split local PostgreSQL + Supabase

- Severity: MEDIUM
- File: `scripts/admin-api.js`
- Current behavior: local PostgreSQL is used for admin-only fallbacks/tables while Supabase stores shared entities.
- Risk: operational data split and degraded behavior when local DB unavailable.
- Fix: consolidate admin data model or explicitly isolate local-only dev data.

## Source of Truth

Target source of truth: Supabase/PostgreSQL through backend repositories and RPCs.

Current source of truth: mixed Supabase direct clients, service-role monolith, new backend repositories, and some local PostgreSQL admin data.
