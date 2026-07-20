# JAHEEZ Strict AI Security Rules

This file is the permanent rulebook for every AI agent, developer, or automation tool modifying Jaheez.

Read this file before touching code. If another document conflicts with this one, this file wins.

Security baseline:

- OWASP API Security Top 10 2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP MASVS: https://mas.owasp.org/MASVS/
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

## 1. Non-negotiable architecture

Jaheez uses a strict backend-only business architecture:

```text
Frontend UI
  -> Backend API / Socket contract
  -> Routes
  -> Middleware / Validators
  -> Controllers
  -> Services
  -> Repositories
  -> Supabase / PostgreSQL
```

The frontend is a display client. The backend is the authority.

This supersedes older docs that describe direct Supabase business access from frontend apps.

## 2. Frontend responsibilities

Frontend apps may only:

- render UI;
- collect form input;
- call approved backend API client functions;
- subscribe to backend-authorized Socket.IO events;
- store UI-only preferences such as language, theme, layout state, and draft cart state;
- show loading, empty, error, retry, and offline UI states.

Frontend apps must not:

- call `supabase.from(...)` or query business tables directly;
- create Supabase clients for business data access;
- calculate checkout totals, promo eligibility, delivery fees, commission, delay points, COD, payouts, refunds, fraud, dispatch, or reliability;
- decide permissions, roles, ownership, fraud state, finance state, order state transitions, or driver assignment;
- contain production mock/fallback stores, products, orders, prices, users, test accounts, or hidden bypasses;
- submit or display internal fields such as `_centimes`, ledger internals, fraud thresholds, service-role data, RLS-sensitive rows, commission internals, or point internals;
- log tokens, OTPs, passwords, bank/payment data, phone numbers, raw precise locations, idempotency keys, or provider response bodies.

Allowed frontend persistence:

- Native customer and driver auth/session tokens: SecureStore only.
- Web admin session storage: must use short expiry and backend session validation; do not expand sensitive localStorage usage.
- AsyncStorage is allowed for non-sensitive UI state only.

## 3. Backend MVC contract

Every backend feature must follow this shape:

- `*.routes.ts`: routing only.
- `*.validators.ts`: strict external DTO validation.
- `*.controller.ts`: read request context, call service, return response.
- `*.service.ts`: business rules, authorization decisions, state machines, fraud/security decisions.
- `*.repository.ts`: database access only.

Layer rules:

- Controllers do not calculate business rules.
- Repositories do not decide permissions.
- Services do not trust client-submitted totals, statuses, actor IDs, points, commission values, fraud flags, finance states, driver assignment, or ownership fields.
- Validators are allowlists. Unknown fields must be rejected for sensitive mutations.
- Object-ID endpoints must check object-level authorization in the service layer.
- All sensitive mutations must audit actor, role, object, before/after state when safe, reason, IP/request ID, and result.

## 4. API and DTO rules

Application-facing DTOs must be safe and explicit:

- Money exposed to apps is `*_dh`.
- Stored money remains integer centimes internally.
- Do not expose raw database rows.
- Do not expose `_centimes`, service-role fields, internal ledgers, fraud thresholds, RLS policy helpers, password hashes, OTPs, confirmation codes, bank details, or precise private location except to authorized delivery/tracking endpoints.
- Client requests must not include server-owned fields such as `user_id`, `driver_id`, `admin_id`, `status`, `assigned_driver_id`, `payment_status`, `fraud_status`, `points_delta`, `score_after`, `commission_amount`, `cod_balance`, `payout_status`, or `responsible_party`.
- If a client needs something, create a backend endpoint that returns exactly what the screen needs.

## 5. Database and migration rules

- Supabase/PostgreSQL is internal infrastructure.
- Frontend production code must not read/write business tables directly.
- Service-role keys exist only in backend/server scripts.
- RLS must deny unsafe direct mutation of financial, reliability, dispatch, fraud, timeline, and payout tables.
- New migrations are append-only. Never edit old shared migrations.
- Transactional operations must be idempotent for money, order lifecycle, COD, payout, refund, readiness, points, and timeline mutations.
- Online payments stay disabled until a Moroccan-compatible provider is selected and implemented behind a backend provider adapter.

## 6. Feature implementation checklist

Before coding:

- Identify the app and screen.
- Identify the backend feature owner.
- Define request/response DTOs.
- Define actor and authorization rule.
- Define idempotency requirement.
- Define audit requirement.
- Check whether money, order state, location, fraud, finance, or reliability is involved.

During coding:

- Add/modify validators first.
- Keep controller thin.
- Put business rules in service.
- Put database access in repository.
- Return app-safe DTOs only.
- Keep frontend as display + submit.

After coding:

- Run local gates.
- Add or update backend tests.
- Add frontend TypeScript check.
- Add security tests for wrong actor and mass assignment.
- Confirm no production mock/fallback path was introduced.

## 7. Common attack tests to run

Every sensitive feature must be tested against:

- BOLA: actor accesses another actor's object.
- Broken authentication: missing, expired, invalid, wrong-kind token.
- BFLA/RBAC: wrong admin role performs restricted action.
- Mass assignment: client submits internal fields.
- Replay/idempotency: repeated request cannot duplicate money, points, timeline, or orders.
- Injection: SQL-like text, script text, path traversal names, oversized payloads.
- SSRF: any feature accepting URLs or external fetch targets.
- Rate-limit abuse: auth, OTP, confirmation codes, checkout, store-ready, upload, support.
- Sensitive logging: no tokens, OTPs, passwords, phone numbers, bank details, exact private locations, idempotency keys, or raw provider bodies.
- RLS matrix: anonymous, customer, driver, store partner, operations, finance, super admin, service role.

## 8. Required local gates

Run before merging or handing off:

```bash
npm run verify:local
npm test --prefix backend
npm run build --prefix backend
npm run build --prefix frontend/admin
cd frontend/user-app && npx tsc --noEmit
cd frontend/driver-app && npx tsc --noEmit
```

`npm run verify:local` must include strict frontend-boundary checks.

## 9. Required staging gates before production

Production readiness requires:

- encrypted production backup restored to isolated staging;
- migrations applied twice with checksum validation;
- RLS/security matrix;
- real PostgreSQL concurrency/idempotency tests;
- full customer -> admin -> driver -> tracking -> delivery -> review flow;
- COD, refund, payout, commission, fraud/reconciliation scenarios;
- real Android device tests for customer and driver apps;
- admin production browser build test;
- zero unresolved financial discrepancies;
- no high/critical security failures.

## 10. Accepted and rejected patterns

Accepted frontend pattern:

```ts
const preview = await orderApi.previewCart({ storeId, items });
setServerPreview(preview);
```

Rejected frontend pattern:

```ts
const total = subtotal + deliveryFee - discount;
const { data } = await supabase.from('orders').insert({ total });
```

Accepted backend pattern:

```ts
router.post('/v1/checkout', verifySupabaseJwt, validate(checkoutSchema), controller.createOrder);
```

Rejected backend pattern:

```ts
router.post('/v1/checkout', controller.createOrder); // missing auth and validation
```

Accepted service pattern:

```ts
await service.createOrder({ actor: req.user, dto: req.body, idempotencyKey });
```

Rejected service pattern:

```ts
await repo.insertOrder(req.body); // trusts client-owned totals/status/user_id
```

## 11. AI instruction

When using any AI coding assistant, paste this rule:

```text
Before coding, read docs/JAHEEZ_STRICT_AI_SECURITY_RULES.md.
Respect strict backend-only MVC.
Frontend is display only.
No hardcoded business data.
No direct Supabase table access from frontend.
Add/update tests and run required gates.
If a requested change conflicts with the rulebook, stop and explain the conflict.
```
