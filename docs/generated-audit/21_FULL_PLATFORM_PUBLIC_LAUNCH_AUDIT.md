# JAHEEZ Full Platform Public-Launch Audit

**Audit date:** 2026-07-22  
**Code revision:** `4fbace457d3a017e49244b3f081827d90594320b` (2026-07-20)  
**Target:** public launch with real customers, COD, precise locations, and operational incidents  
**Scope:** `backend/`, `frontend/user-app/`, `frontend/driver-app/`, `frontend/admin/`, `shared/`, the complete append-only `supabase_migrations/` chain, and archived/legacy areas only for accidental inclusion, secrets, or conflicting instructions  
**Change policy:** audit and roadmap only; no runtime application fixes or existing-migration edits were made

## Executive verdict

**NO-GO for public launch.** JAHEEZ has a credible product shell and a meaningful amount of safety infrastructure, but it is not yet safe to expose to unrestricted public traffic or real COD operations.

The positive baseline is real: 176 backend tests pass, the backend and admin production builds pass, both mobile TypeScript checks pass, online payments are disabled, frontend direct-business-table access is blocked by a static gate, privileged finance functions are generally service-role-only, and the code contains admin rescue, reconciliation, idempotency, confirmation-code, dispatch, and audit concepts.

Those strengths do not cancel the launch blockers found in active paths:

1. Checkout can persist `pending`, fail to transition, and still tell the customer the order is `confirmed`.
2. A checkout retry can return a different schema and a different status from the first response.
3. The service fee is charged in the total but is not stored as a separately reconcilable order component; store/menu/order money remains decimal DH while the declared finance invariant is integer centimes.
4. Confirmation-code, dispatch, capacity, and driver-state paths contain fail-open compatibility behavior when migrations/columns are absent.
5. Order, driver, confirmation, and finance state changes are split across multiple commits and best-effort side effects.
6. Customer endpoints return raw or overly broad rows, including order, wallet-reference, support, profile, favorite-store, and favorite-product internals.
7. The historical database baseline retains raw core-table RLS reads; the current hardening chain does not explicitly revoke every core-table read. The live effect must be verified in isolated staging.
8. Internal driver alerts are stored as customer support tickets, including a driver name and phone in one path, so customers can receive operational/private data.
9. Customer contact-change, password recovery, and account-deletion screens call OTP/account routes that are not mounted.
10. Background workers start in every API process without leader election or distributed locks; health checks do not test the database; the CI “health” step does not actually assert container health.
11. Three local launch gates fail: route security, npm audit policy, and readiness-manifest consistency.

No Critical finding was assigned without live-database or exploit confirmation. The concentration of verified High findings is nevertheless sufficient for a no-go decision.

## Method and confidence model

The review traced important flows through:

`Frontend UI -> Backend API/Socket -> authentication/validation -> controller -> service -> repository -> Supabase/PostgreSQL`

Status labels:

- **Verified:** directly reproducible from current source or a local executable gate.
- **Runtime-unverified:** current source establishes a credible risk, but live Supabase grants, concurrency, provider behavior, deployment topology, or device behavior must be checked in isolated staging.
- **Confidence:** High means the evidence directly supports the conclusion; Medium means a deployment or data assumption remains.

Severity means realistic public-launch impact, not coding-style importance:

- **Critical:** likely platform-wide compromise, unrecoverable finance corruption, or severe safety exposure.
- **High:** launch blocker with realistic security, money, privacy, order, dispatch, or availability impact.
- **Medium:** material correctness, scalability, UX, or defense-in-depth gap that must be planned before scale.
- **Low:** limited-impact hardening or cleanup.

## Scope and inventory

The active review covered approximately 69,000 non-generated code/SQL lines:

| Area | Files | Approx. code lines |
|---|---:|---:|
| Backend `src` | 186 | 20,114 |
| Customer app | 322 | 25,257 |
| Driver app | 153 | 3,965 |
| Admin `src` | 112 | 16,403 |
| Shared | 2 | 680 |
| Append-only migrations | 47 | 3,418 |

The duplicate/archived roots (`jaheez/`, `user-app/`, `_archive/`, `scratch/`) are not imported by the reviewed active TypeScript paths or included in CI builds. The active backend intentionally mounts only a 410 legacy payment route. Historical documents are not treated as launch evidence.

This report supersedes historical owner summaries, including any prior “100/100” or launch-ready statement. Current code and executable evidence control this verdict.

## Architecture and launch-readiness scorecard

This is a maturity score, not a test-coverage percentage.

| Domain | Score | State | Why |
|---|---:|---|---|
| Frontend/backend authority boundary | 3.0/5 | Amber | Static direct-Supabase boundary passes; raw backend DTOs and possible raw RLS reads undermine it. |
| Authentication and actor separation | 2.4/5 | Red | Admin/driver/customer middleware exists; phone ownership, dead OTP flows, shared secret fallbacks, and socket admin revalidation remain. |
| PostgreSQL/RLS/schema | 2.1/5 | Red | Strong service-role RPC intent; core read-policy closure and live grants are unproven, money models conflict, and indexes are incomplete in the chain. |
| Checkout/order lifecycle | 1.7/5 | Red | Server pricing and idempotency exist; response/state divergence and split commits are launch blockers. |
| Dispatch/realtime | 2.2/5 | Red | Offer rooms and claim locking are thoughtful; fail-open compatibility, multi-instance workers, and race windows remain. |
| COD/commission/refunds | 2.5/5 | Red | Centime ledgers and idempotent RPCs are good; end-to-end atomicity, stored fee composition, immutability, and staging proof are incomplete. |
| Customer/driver UX | 2.7/5 | Amber/Red | Broad screen coverage and localization exist; broken account flows, accessibility debt, driver offline ergonomics, and oversized screens remain. |
| Admin/merchant operations | 2.8/5 | Amber/Red | Many rescue and finance views exist; worker/store health and merchant operations are incomplete. |
| Deployment/observability/recovery | 1.6/5 | Red | CI, Docker, and backup scripts exist; actual health, alerting, HA worker control, restore proof, and rollback readiness are not demonstrated. |
| Product differentiation | 2.3/5 | Amber | Guided errands are promising; scheduled UI, group orders, multi-store, loyalty, Plus, and merchant tooling are incomplete or absent. |

**Risk-weighted maturity: 2.3/5. Public-launch threshold should be at least 4/5 with every P0 acceptance test green.**

## Severity summary

| Severity | Count | Launch effect |
|---|---:|---|
| Critical | 0 | None asserted without staging/live proof. |
| High | 16 | Any unresolved item blocks public launch. |
| Medium | 15 | Must be resolved or explicitly risk-accepted with owner/date. |
| Low | 1 | Hardening cleanup. |

## Findings

### Security, privacy, and authentication

| ID | Severity / status / confidence | Evidence | Actor and realistic scenario | Recommended correction | Acceptance test |
|---|---|---|---|---|---|
| **SEC-01** | **High** / Runtime-unverified / High | `supabase_schema.sql:218-256`, `340-362`, `410-421`; `supabase_migrations/014_harden_rls_migration.sql:7-30`; protected list in `040_migration_chain_security_hardening.sql:110-129` omits core `orders`, `drivers`, `stores`, `menu_items`, `support_requests`, `chat_messages`, and `notifications`. | An attacker can use the shipped anon key or a normal customer JWT against Supabase REST. Historical policies allow raw own-order reads and public full-driver reads; the driver row now contains authentication and precise-location fields in the active backend contract. The exact live grants/policies are unproven. | Add a new append-only migration that inventories and revokes `anon`/`authenticated` table privileges and policies on every backend-owned table. Expose only API DTOs or intentionally safe views. Never edit migrations 014/040. | In isolated staging, enumerate `information_schema.role_table_grants` and `pg_policies`; as `anon`, customer A, customer B, driver, and admin JWTs, prove raw core-table reads/mutations fail, including selected `cin`, `password_hash`, confirmation codes, exact driver coordinates, risk and finance columns. |
| **SEC-02** | **High** / Verified / High | `customer.repository.ts:42-49`, `116-135`, `183-254`; `customer.service.ts:101-120`; wallet transactions retain `ref_id` at `customer.service.ts:107-110`. | A legitimate customer receives internal profile, order, support, favorite store/product, and wallet-reference fields because repositories use `select('*')` and services often return the rows unchanged. This can reveal trust/risk flags, confirmation/dispatch internals, admin notes, or idempotency references. | Replace every customer-facing `*` with explicit app-safe selects and typed DTO mappers. Add response-schema tests that deny internal columns. | Snapshot every customer endpoint with seeded sensitive columns and assert none of: confirmation codes, offered/rejected driver IDs, fraud/reliability fields, `admin_note`, `ref_id`, internal centimes, provider payloads, or server-owned flags appear. |
| **SEC-03** | **High** / Verified / High | Mounted customer auth routes are only register/login/bootstrap in `customerAuth.routes.ts:11-13`; recovery screens redirect at `forgot-password.tsx:1-4` and `reset-password.tsx:1-4`; profile/delete flows call absent `/admin-api/otp/send`, `/otp/verify`, and `/auth/account` in `infobipOtp.ts:11-80` and `delete-account.tsx:48-121`; registration returns `requires_verification:false` in `customerAuth.service.ts:19-40`. | A customer can create an account without proving ownership of the submitted phone, cannot recover a password, cannot safely change phone/email, and cannot complete the advertised account deletion. Stolen/recycled numbers, fake accounts, support burden, and legal deletion complaints are realistic. | Define one supported launch auth model. Add phone/email ownership proof, recovery, contact-change, and deletion endpoints with separate OTP proof signing secret/audience/purpose; or remove/disable the unreachable UI until implemented. | Real-device tests for new phone registration, duplicate/recycled number, wrong OTP, replay, recovery, contact change, account deletion, session revocation, and data-retention behavior. No screen may call an unmounted route. |
| **SEC-04** | **High** / Verified risk; runtime expiry check required / High | `utils/jwt.ts:7-9` falls driver signing back to `ADMIN_JWT_SECRET`; `env.ts:37-46` makes driver and OTP secrets optional; `realtime.service.ts:25-35` accepts an admin JWT without the HTTP middleware's active-account/role database check. | A single admin-secret disclosure can forge driver tokens when the dedicated secret is absent. A disabled or role-demoted admin can retain existing socket access until token/socket expiry. | Require independent production `ADMIN_JWT_SECRET`, `DRIVER_JWT_SECRET`, and `OTP_HASH_SECRET`; add issuer/audience/algorithm claims. Revalidate admin status/role on socket connect and periodically or disconnect sessions on admin changes. Remove the unused refresh token. | Production env validation fails if secrets are absent/equal. Forged cross-role tokens fail. Disable/demote an admin with an open socket and prove room access/emissions stop immediately. |
| **SEC-05** | **Medium** / Verified / High | Driver document routes remain active at `driver.routes.ts:65-76`; arbitrary HTTP(S) URLs are accepted at `driver.validators.ts:32-37`; driver-document CRUD remains at `driver.repository.ts:180-227`; admin upload accepts a `drivers` folder and returns a public URL at `upload.routes.ts:66+`. | The code retains a private-document/KYC surface contrary to the selected manual-approval model. Identity documents can be referenced from arbitrary origins or placed in a public bucket, increasing privacy, malware-link, retention, and support risk. | Immediately restrict any existing identity objects; then execute the no-document deprecation roadmap below. Do not store identity documents in a public bucket. | Driver document endpoints return 410, admin no longer fetches document rows, public storage cannot read legacy identity objects, and retention/export deletion is evidenced. |
| **SEC-06** | **Medium** / Runtime-unverified / High | Webhook and 24 MB base64 upload mounts precede the general limiter at `app.ts:67-95`; Redis is optional at `env.ts:45-46`; the limiter falls back to process memory in `rateLimit.middleware.ts:14-31`. | A compromised admin or distributed attacker can consume memory/CPU with large uploads. Multi-replica auth limits can be multiplied when Redis is unavailable. | Add route-specific upload limits/rate limits, streaming/multipart storage, centralized production rate limiting, and webhook-provider replay/IP controls where supported. Set `REDIS_REQUIRED=true` for public traffic or use a managed equivalent. | Multi-instance load test proves one global auth/upload quota, rejected oversized bodies do not inflate memory, and limiter-store loss fails according to an explicit policy. |
| **SEC-07** | **Low** / Verified / High | Admin login distinguishes missing account and wrong password at `adminAuth.service.ts:63-74`; it returns a refresh token with no mounted refresh flow at `:86-90`. | Attackers can enumerate admin emails; an unnecessary 30-day token expands secret material and confuses incident response. | Return one generic credential error with equivalent timing; remove refresh-token issuance unless a rotating, revocable refresh flow is intentionally implemented. | Existing/non-existing email attempts have the same status/body/timing envelope; login response contains only the used token type. |
| **SEC-08** | **Medium** / Verified / High | Forbidden Socket.IO joins log the full principal at `socket.server.ts:46-51`; principals can contain admin email or driver phone from `realtime.service.ts:28-52`. The sensitive-log gate does not detect this structure. | A malicious client can deliberately trigger forbidden joins and cause PII-bearing principals to be written to logs available to broad operations staff or external log systems. | Log actor type and hashed/internal actor ID only. Expand sensitive-log scanning to structured objects. | Trigger rejected joins for every actor and prove logs contain no email, phone, token, precise coordinates, address, or payload content. |
| **SEC-09** | **High** / Verified / High | Fresh `check-npm-audit-policy.js` fails. Unique high advisory roots include transitive `brace-expansion` in backend and `brace-expansion`, `js-yaml`, and `shell-quote` in both mobile trees. npm reports package-instance counts of backend 4 high/4 low, customer 49 high/22 moderate, driver 62 high/8 moderate. | Vulnerable build/runtime dependency paths remain in launch artifacts or developer tooling. Some mobile findings are Expo-toolchain paths; impact must be established rather than assumed. | Trace each advisory with `npm explain`, classify runtime versus build-only reachability, upgrade/override within Expo SDK 55 compatibility, remove unnecessary direct `@expo/ngrok`, and document time-bound exceptions. Do not apply the suggested Expo 46 downgrade. | Audit policy passes or a signed exception records package path, reachability, compensating control, owner, expiry, and upgrade test. Build/EAS/device regression remains green. |

### Database, checkout, money, lifecycle, and dispatch

| ID | Severity / status / confidence | Evidence | Actor and realistic scenario | Recommended correction | Acceptance test |
|---|---|---|---|---|---|
| **LOG-01** | **High** / Verified / High | `checkout.service.ts:154-172` catches auto-confirm failure, logs it, then constructs `status:'confirmed'`. Migration 055 creates the row as `pending` at `055_atomic_promo_and_claim_offer.sql:109-120`. | Customer sees a confirmed order that dispatch may not treat as confirmed; duplicate support contacts, missed orders, or double ordering follow. | Make order creation plus initial lifecycle state one authoritative transaction, or return the committed status and a retryable failure. Never synthesize a status. | Force lifecycle failure after insert; API and DB must agree, no push says confirmed, and safe retry returns one order with the same response. |
| **LOG-02** | **High** / Verified / High | Replay returns raw `cached_response` at `checkout.service.ts:133-137`; migration 055 caches decimal legacy fields and `status:'pending'` at `055...sql:151-166`; first response uses `*_dh`, items/promo, and `status:'confirmed'` at `checkout.service.ts:168-182`, `408-421`. | A network retry produces a different API contract/status, breaking confirmation UI and making client recovery ambiguous. | Store the final versioned public response only after the final state commits, or deterministically rebuild the exact DTO from DB. Bind idempotency key to a request hash. | Same key/same payload returns byte-equivalent semantic body and status; same key/different payload returns 409; concurrent calls create one order. |
| **FIN-01** | **High** / Verified / High | Checkout adds service fee at `checkout.service.ts:234-238`, but the atomic call at `:106-122` and migration function `055...sql:21-36,109-139` have no service-fee component. Orders/items/store pricing use decimal DH while the readiness manifest declares `internal_money_storage: integer_centimes`. | The charged total cannot be reconstructed from stored components. Rounding or refund/commission reconciliation can diverge, and finance cannot explain a receipt. | Introduce append-only centime columns and a versioned money equation including subtotal, delivery, service, discount, tip, tax if any, and total. Migrate reads/writes safely; never edit history. | Database constraint/RPC proves `total = subtotal + delivery + service + tip - discount`; property tests cover fractional inputs; invoice/refund/reconciliation reproduce exact centimes. |
| **LOG-03** | **High** / Verified / High | Checkout selects no capacity field and forces `OPEN` at `checkout.repository.ts:129-138`; dispatch loads capacity but the assignment engine only checks dispatch mode around `assignmentEngine.ts:67+`; compatibility fallback forces store capacity/mode open/auto at `dispatch.repository.ts:85-88`. | Orders can be accepted and dispatched while a store is overloaded/closed for capacity, overwhelming merchants and creating cancellations/delays. Missing schema widens the risk by failing open. | Make capacity authoritative at quote, checkout, and dispatch; define BUSY/OVERLOADED/CLOSED behavior and fail closed on missing required columns. | Toggle every capacity state during quote/checkout/dispatch; assert consistent rejection/throttling/manual queue behavior and no fallback to OPEN. |
| **LOG-04** | **Medium** / Verified and runtime-unverified race / High | Atomic promo lock checks active/usage only at `055...sql:84-107`; it does not recheck expiry, store scope, or minimum subtotal inside the transaction. Pre-055 fallback remains at `checkout.service.ts:140-151` and `checkout.repository.ts:281-340`. | A promo can expire or become inapplicable between quote and commit. If migration 055 is absent, concurrent uses can oversell and usage recording can fail after order commit. | Remove production legacy fallback after migration readiness is enforced. Revalidate all promo invariants and request hash under the same transaction/locks. | Boundary-time and concurrent-promo tests prove expiry/store/minimum/per-user/global limits under 50+ parallel checkouts; missing RPC fails closed. |
| **LOG-05** | **High** / Verified / High | Confirmation setup/validation skips enforcement on missing columns or absent expected code at `orderLifecycle.service.ts:89-169`; pickup/delivery transition precedes marking the code used at `:541-564`. | A schema mismatch can allow pickup/delivery without proof. A post-transition code-write failure returns an error after the order already advanced, making replay behavior unsafe. | Put code presence, constant-time validation, attempt count/rate limit, status transition, and used timestamp in one locked RPC. Missing code/schema must block. | Remove/NULL a code in staging and prove transition fails. Concurrent correct/wrong/replayed codes yield one transition and one immutable attempt trail. |
| **LOG-06** | **High** / Verified / High | Lifecycle RPC commits order status, then driver state and delivered-order finance are updated later at `orderLifecycle.service.ts:309-350`; claim commits before confirmation codes, driver state, history, and baselines at `:421-495`; many failures are swallowed. | Order can be assigned while driver remains AVAILABLE, delivered without finalized ledger, or cancelled while driver load remains stale. The commission retry worker helps only one subset. | Define aggregate transactions/outbox events: order+driver assignment/load, pickup/delivery+code, delivered+financial outbox, cancellation/reassignment+driver release. Side effects must be idempotent consumers. | Inject a failure after each database step and prove invariant tables are either all committed or recover automatically without duplicate money/events. |
| **LOG-07** | **High** / Verified code defect; concurrency staging required / High | Driver decline reads ownership then updates by order ID only at `driver.service.ts:351-385`, so a stale driver can clear a newly reoffered order. Driver claim updates order before driver eligibility/load. `driverStateCache.ts:40,64-80,143-163` defaults or falls back in ways that can omit shift enforcement. | Old driver declines after offer reassignment and clears the new driver's offer; two API instances can offer multiple orders to one AVAILABLE driver; missing columns can admit off-shift drivers. | Use locked/conditional RPCs for offer/decline/claim keyed by order, offered driver, expiry, driver state, shift, and capacity; return affected-row conflict. Remove fail-open compatibility. | Race old decline vs reoffer, two claims, and two orders vs one driver across two backend replicas; exactly one legal assignment survives and driver load is correct. |
| **LOG-08** | **High** / Verified / High | Timeout alert inserts the customer's `user_id` and driver full name/phone into `support_requests` at `timeoutWorker.ts:123-134`; driver issue reporting does the same customer-ticket reuse at `driver.service.ts:727-759`; customers list their tickets with `select('*')` at `customer.repository.ts:116-124`. | A customer can see an internal driver discipline alert, phone number, notes, or a driver complaint. Driver/admin/customer issues are mixed into one ownership model. | Create actor-scoped support/incident tables or explicit `requester_type`, `requester_id`, visibility and redacted DTOs. Never use customer ownership for internal alerts. | Seed customer, driver, store, and internal incidents for one order; each actor sees only intended fields. Timeout alert never appears in customer APIs. |
| **SEC-10** | **Medium** / Verified / High | Customer support creation accepts `order_id`, inserts it with customer `user_id`, but does not verify order ownership before `createSupportTicket` (`customer.repository.ts:260-273`; customer service support path). | Customer A can attach Customer B's order UUID to a ticket, contaminating admin investigations and potentially exposing correlated information in support tools. | Resolve and verify referenced order ownership before insertion; use UUID FK instead of legacy text where possible. | Customer A referencing B's order returns 404/403 without revealing existence; own order succeeds; deleted order behavior is defined. |
| **DB-01** | **Medium** / Runtime-unverified schema/performance risk / High | The migration/schema chain lacks visible indexes for several high-use FK/access paths such as `order_items(order_id)`, `menu_categories(store_id)`, `menu_items(category_id)`, support ownership, and several review/notification relations. Remaining historical RLS policies call `auth.uid()` directly. Customer order pagination uses offset/range, and rating recalculation loads all ratings at `customer.service.ts:551-555`. | Cascades, order detail joins, RLS checks, deep pages, and review writes slow or lock more rows as data grows. | Query live `pg_constraint`/`pg_indexes`; add missing FK and composite indexes in a new migration. Use `(select auth.uid())` in any intentionally retained RLS policy, cursor pagination, and DB-side aggregate/trigger for ratings. | `EXPLAIN (ANALYZE, BUFFERS)` on launch-volume data meets budgets; no unindexed FK report; page 1 and deep cursor page remain stable during inserts. |
| **FIN-02** | **Medium** / Verified design gap / Medium | Financial/reliability tables are privilege-restricted, but no append-only trigger prevents service-role updates to monetary/source fields; migrations update ledger status directly (`028_commission_delay_dh_security.sql:424-444`). | A future backend bug or operator SQL can rewrite historical earnings instead of creating a reversal, defeating audit reconstruction. | Enforce DB-level immutability for identity/source/amount/rate fields; permit explicit status transitions only; corrections append reversal entries with unique references. | Attempt updates to immutable fields as service role and prove rejection; status transition RPC succeeds; reversal is append-only and reconciles to zero. |
| **OPS-01** | **High** / Verified code topology; runtime replica count unverified / High | Every API process starts dispatch, heartbeat, reconciliation, and commission retry at `server.ts:14-17`. There is only an in-process `running` flag. Reconciliation scans capped 500-row sets and performs per-shift ledger queries at `risk.repository.ts:4-42`. Heartbeat excludes NULL `last_seen_at` at `driverHeartbeat.worker.ts:44-52`. | Multiple replicas duplicate scans and side effects. First 500 rows can starve later discrepancies, N+1 queries overload Supabase, and online drivers with NULL heartbeat remain phantom-available. | Run workers separately or add DB advisory-lock/lease leadership per job. Use cursor batches/set-based reconciliation, explicit retry/dead-letter state, metrics, and `last_seen_at IS NULL OR stale`. | Start two replicas and prove one owner per job/fenced takeover. Reconcile >1,000 seeded issues once. NULL/stale heartbeats go offline; active heartbeats remain online. |

### Operations, administration, features, UX, and creativity

| ID | Severity / status / confidence | Evidence | Actor and realistic scenario | Recommended correction | Acceptance test |
|---|---|---|---|---|---|
| **OPS-02** | **High** / Verified / High | `docs/PRODUCTION_READINESS_MANIFEST.json` omits migrations 055 and 056 while `backend/scripts/migration-manifest.js` includes them. The readiness gate fails. Route-security fails because active driver OTP endpoints remain. | Deployment sign-off can claim readiness without the atomic checkout/claim and data-driven fee/zone migrations, while compatibility code then fails open. | Make one checksum-tracked authoritative manifest, update readiness documents, and make required-schema absence fatal at startup. Return 410 for obsolete OTP routes. | Restore production backup to isolated staging, apply manifest twice, verify checksums/functions/columns, and run all local gates with zero failures. |
| **OPS-03** | **High** / Verified / High | `/health` checks only optional Redis at `app.ts:99-123`, not Supabase/database or worker freshness. CI `ci.yml` runs a container with an `ADMIN_JWT_SECRET` shorter than the enforced 32 characters and only prints logs/stops it; it never curls health or checks Docker health. | A backend with invalid env or inaccessible database can pass the CI step or report healthy. Traffic reaches a process that cannot serve core flows. | Split liveness/readiness; readiness checks DB connectivity/schema manifest, required Redis, and worker lease freshness. CI must wait for and assert a healthy container with valid env. | Break DB, schema, Redis, and env individually; liveness/readiness behave as designed and CI fails. Healthy image responds to a real HTTP probe. |
| **OPS-04** | **Medium** / Runtime-unverified / Medium | Backup/restore and staging scripts exist, plus one commission runbook, but no evidence in scope demonstrates scheduled encrypted backups, restore RTO/RPO, centralized metrics/traces/alerts, full incident roles, deployment canary/rollback, or worker dashboards. | Detection and recovery depend on logs/manual discovery during a COD or dispatch incident. | Establish operational SLOs, structured metrics, alert routes, backup schedule/retention, quarterly restore drill, incident runbooks, on-call owner, release canary and tested rollback. | Signed drill shows restore within RTO/RPO; synthetic checkout/dispatch/Socket/finance alerts fire; previous release can be restored without data loss. |
| **OPS-05** | **Medium** / Verified / High | User ban/unban at `admin.service.ts:410-415` has no audit context/write. Several financial actions commit first and write audit after; wallet adjustment explicitly errors “do not retry” after audit failure at `finance.service.ts:126-142`. | Admin accountability has gaps; operators may retry a committed action after a 500 and duplicate business consequences unless idempotency protects it. | Put mandatory audit rows in the same DB transaction as sensitive state changes, with request IDs, reason, before/after, actor, and IP. Add audit to ban/unban and overrides. | Force audit failure: sensitive mutation rolls back or returns a durable reconciliation ID and safe replay result. Every role/status/finance/ban action is searchable. |
| **FEAT-01** | **Medium** / Verified / High | Driver OTP/KYC/document terminology and APIs remain across `driverAuth.routes.ts:14-15`, `driver.routes.ts:65-76`, driver i18n `i18n.ts:43-52,94-105`, admin/service/repository KYC fields, and shared/API types. Driver UI hardcodes `kycBlocked=false` in `DriverDashboardScreen.tsx:59`. | The selected business process is manual approval without document uploads, but code and copy describe a conflicting KYC flow that is partly dead and partly active. | Execute the dedicated no-document compatibility roadmap below; preserve CIN/password, `is_active`, `is_verified`, suspension, and audit history. | Search/build/route tests show no active KYC/document/driver OTP surface; manual approval and suspension still work; legacy data retention is documented. |
| **FEAT-02** | **Medium** / Verified / High | Public config defaults referrals and loyalty to true at `customer.service.ts:227-233`, but no referral/loyalty implementation exists. Profile advertises Jaheez Plus benefits at `profile.tsx:158-184` without a purchase/benefit flow. Parcel home action displays “coming soon” at `index.tsx:580`. | Customers see promises or flags for unavailable products, eroding trust and creating support demand. | Default unfinished flags false; make UI server-driven and show only an end-to-end capability. Define Plus/loyalty economics before exposure. | Fresh account in production config cannot discover or trigger an unfinished feature; each enabled flag has API, admin control, analytics, support, and rollback tests. |
| **FEAT-03** | **Medium** / Verified product gap / High | Guided errands accept `scheduled_for`, but customer UI always submits `null` at `custom-request.tsx:136`. No general scheduled order, group order, or multi-store cart exists. Store-partner capability is API credentials plus ready signal, with no merchant queue/portal. | JAHEEZ lacks common convenience/merchant patterns and cannot reliably coordinate scheduled demand or store preparation at scale. | After P0/P1, prioritize scheduled standard orders/errands and a minimal merchant tablet/web queue. Then validate group carts and same-route multi-store economics before building. | Scheduled order respects store hours/capacity, dispatch lead time, cancellation and timezone; merchant sees/acknowledges/marks-ready with audit and offline recovery. |
| **UX-01** | **Medium** / Verified / High | Static counts found 195 customer Pressables vs 140 accessibility labels, 42 driver Pressables vs 13 labels, 65 customer and 233 driver inline style objects, and hundreds of hardcoded color literals. `ActiveDeliveryScreen.tsx` alone has ~101 inline styles; `DriverDashboardScreen.tsx` ~92. | Screen-reader and motor-access users cannot reliably operate critical actions. Styling and touch behavior diverge, especially in the driver's safety-critical delivery screen. | Run an accessibility remediation pass: labels/roles/hints/states, 44 px targets, focus order, dynamic type, contrast, RTL, and tokens/StyleSheet components. | Automated lint plus TalkBack/VoiceOver test can complete login, accept, navigate, pickup, deliver, cancel, checkout, tracking, and support without unlabeled controls. |
| **UX-02** | **Medium** / Verified / High | Customer has an offline banner, but native status is a 10-second `/admin-api/health` poll (`useNetworkStatus.ts:20-32`), and health omits DB. Driver app has no network-state UX. Major customer screens are extremely large (`store/[id].tsx` ~2,489 lines; home ~1,513; category ~1,378; cart ~1,322) and both mobile/admin trees retain many `any` usages. | Driver may believe an action succeeded/failed ambiguously on weak networks; UI regressions are difficult to isolate; banner can say online while database is unavailable. | Add driver connectivity/stale-data/action queue semantics, mutation idempotency status, last-sync indicators, and retry-safe state. Split screens into tested feature components/hooks while keeping business rules on backend. | Simulate airplane mode, 2G, socket loss, app kill, and retry at every lifecycle stage. No duplicate transition/order; UI states whether action is queued, committed, or failed. |
| **FEAT-04** | **Medium** / Verified partial / Medium | Admin exposes manual reassignment, force offline, cooldown, reliability overturn, reconciliation, COD, payout and refund views. Store partners only have scoped credential/ready APIs. There is no consolidated worker/store health or incident command view. | Operations has many individual controls but lacks a single rescue workflow showing order timeline, actor connectivity, capacity, offer history, code attempts, money state, and safe next actions. | Build an operations incident console from authoritative backend DTOs and append-only events; add merchant queue/ack/readiness and worker lease health. | Given a stuck order, operator can diagnose cause, contact correct actor, reassign/cancel/refund/hold with reasons, and produce a complete audit timeline without SQL access. |

## Driver verification decision: manual approval without documents

Target model retained:

- Admin creates the driver.
- Driver signs in with normalized CIN and password.
- `is_verified` and `is_active`/activation control eligibility.
- Suspension, force-offline, cooldown, password reset, and audit history remain.
- No driver self-registration and no document upload/review.

Removal map for a follow-up implementation:

1. **Immediately restrict data:** inventory `driver_documents` rows and storage objects; remove public access; define legal/business retention and export needs.
2. **Fail closed at API:** return 410 for driver OTP verify/resend and document GET/POST. Remove `driver_otp_enabled`, OTP challenge, KYC status, partial job-cap behavior, and public `drivers` upload folder from active contracts.
3. **Remove UI/copy:** KYC/document screens, profile services/types, translations, banners, and admin document review/detail joins.
4. **Remove backend dead code:** controllers/services/repositories/routes for OTP challenges and documents; remove KYC compatibility assignments from driver creation.
5. **Shared contract cleanup:** remove KYC/document types only after all active clients no longer consume them; version API responses if installed clients may still request them.
6. **Append-only database cleanup:** a new migration—not edits to historical files—revokes policies/grants/publications first. After the retention window and compatibility telemetry, archive/delete objects and drop obsolete table/columns/functions/indexes.
7. **Preserve evidence:** do not erase driver creation, approval, activation, suspension, password-reset, or operational audit history. Store CIN only where operationally required and protect it from customer/direct-table exposure.

Compatibility implication: old mobile binaries may continue calling document/OTP routes. A measured 410 period with telemetry is safer than immediate route disappearance. Data deletion must cover both PostgreSQL rows and storage objects; dropping a table alone does not delete public objects.

## Feature matrix

Legend: **Working-local** means code path/build/tests exist but still needs staging/device proof; **Partial** means meaningful implementation with blockers; **Broken** means current active UI/API contract cannot complete; **Missing** means no end-to-end implementation; **Dead/duplicate** means obsolete or misleading surface.

| Actor/capability | Classification | Evidence-based conclusion |
|---|---|---|
| Customer register/login | Partial | Password flows exist; phone ownership verification and recovery are not launch-ready. |
| Customer onboarding/address/location | Partial | Precise pin/details exist; contact-change proof calls dead OTP routes; device geocoding still needs proof. |
| Store discovery/search/menu/options | Working-local | APIs/UI compile; raw public DB reads and large-screen maintainability remain. |
| Cart/preview/checkout/COD | Broken for launch | Server authority exists, but state/idempotency/money findings block use. |
| Promotions | Partial | Server validation and atomic usage intent exist; invariant race and fallback remain. |
| Order history/detail/reorder | Partial | Screens/APIs exist; DTO leakage and deep pagination remain. |
| Tracking/Socket/chat | Partial | Authorized rooms exist; device isolation/reconnect and admin revocation need staging. |
| Cancellation/reassignment/review | Partial | Ownership/lifecycle checks are present; split commits and rating aggregation remain. |
| Wallet/refunds | Partial | Wallet read and admin refund flows exist; no online payments; finance E2E unproven. |
| Support/account deletion | Broken/Partial | Support works but actor model leaks; deletion is broken. |
| Guided errands/proofs/moderation | Partial, differentiating | Stronger than a simple free-text errand; scheduling UI and full device/ops proof missing. |
| Scheduled ordering | Partial backend only | Errand field exists; UI sends null; store orders lack scheduling. |
| Loyalty/referrals/Jaheez Plus | Dead/misleading | Flags/copy exist without end-to-end product. |
| Group ordering | Missing | No invite/shared cart/host checkout model. |
| Multi-store same-route order | Missing | One store per checkout/order flow. |
| Customer online payments | Intentionally disabled | Correct for current target; remain disabled until provider selection/staging. |
| Driver CIN/password/manual activation | Working-local | Good foundation; secret isolation and device staging remain. |
| Driver shift/availability/heartbeat | Partial | UI/API exist; fail-open and NULL heartbeat issues block launch. |
| Driver offers/claim/decline | Partial | Atomic claim intent exists; decline and multi-instance races remain. |
| Driver active delivery/navigation/codes | Partial | Main ergonomics exist; code atomicity, accessibility and weak-network behavior block sign-off. |
| Driver earnings/payout/COD | Partial | Closed-shift finance model exists; full lifecycle/reconciliation not proven. |
| Driver documents/KYC/OTP | Dead/duplicate and target-incompatible | Must be retired using the compatibility plan. |
| Admin users/drivers/stores/catalog | Working-local/Partial | Broad management exists; validation/audit consistency and device/runtime proof remain. |
| Admin orders/rescue/reliability | Partial | Useful controls exist; needs consolidated incident workflow and atomic invariants. |
| Admin finance/COD/payout/refund | Partial | Strong intent and RPCs; P0 money and staging E2E remain. |
| Admin risk/reconciliation/audit | Partial | Scanners/views exist; worker topology, bounded scans, and audit gaps remain. |
| Store partner ready signal | API-only Partial | Scoped credential and ready RPC exist; no merchant-facing operations product. |
| Background workers | Broken for HA launch | No leader election/lease, weak health and bounded scans. |
| Realtime isolation | Working-local/needs runtime | Room ownership is checked; cross-actor/wrong-order/live-revocation tests required. |

## UX, trust, and product creativity

### What is already promising

- Arabic/French/English coverage and Morocco-first address details are directionally appropriate.
- Guided errands use structured pickup/drop-off, risk flags, quotes, moderation, stages, and proofs rather than an unsafe free-text-only request.
- COD is treated as an operational ledger problem rather than a simple payment label.
- Driver tip masking before acceptance is a thoughtful fairness control.
- Manual reassignment, reliability overturn, store-ready events, and reconciliation cases show the right operational instincts.

### Trust problems to solve before adding novelty

- Never show a state that the database did not commit.
- Give customers an explainable receipt: every centime, status, cancellation, refund, and COD handoff.
- Give drivers unmistakable queued/committed/failed states under weak connectivity.
- Redact actor-private information and separate customer support from internal incidents.
- Replace dead Plus/loyalty/referral/parcel promises with honest server-controlled availability.
- Make exact location visible only to the assigned driver during the necessary lifecycle window; define retention and post-delivery access.

### Current official benchmark gap

The comparison is not a request to copy competitors. It identifies customer expectations and merchant operating patterns:

- Glovo documents scheduled ordering, courier/store ordering, tracking, cancellations and support: [Glovo FAQ](https://glovoapp.com/docs/en/faq/).
- Uber Eats provides host/invite group ordering: [Uber Eats group orders](https://help.uber.com/en/ubereats/restaurants/article/how-to-place-a-group-order?nodeId=886fdace-3cee-4658-9d3c-7cadfbec5280).
- Uber Eats also documents scheduled orders for merchants: [Uber scheduled orders](https://help.uber.com/merchants-and-restaurants/article/what-are-scheduled-orders?nodeId=858cd1be-ce17-4a3b-a819-b941c2114b63).
- DoorDash DoubleDash demonstrates a same-session nearby second-store add-on: [DoorDash DoubleDash](https://help.doordash.com/en-ca/consumers/article/doubledash).
- Glovo's Morocco coverage page includes Safi among a broader national footprint, reinforcing the need for city-configured—not Safi-hardcoded—operations: [Glovo Morocco cities](https://glovoapp.com/en/ma/map/cities).

JAHEEZ currently has a useful errand foundation but lacks customer-visible scheduling, group carts, multi-store orchestration, and a merchant operations interface.

### Recommended differentiation sequence

Do not prioritize novelty before P0/P1. After reliability is proven:

1. **Jaheez Precise Handoff:** entrance pin, landmark, preferred call/WhatsApp instructions, delivery confirmation, privacy window, and a shareable live ETA link. This directly solves Moroccan address ambiguity.
2. **Jaheez Scheduled Local:** scheduled food/grocery/errand with merchant capacity, dispatch lead time, holiday hours, and honest cancellation rules.
3. **Jaheez Family/Office Cart:** invite link, host deadline, item attribution, one authoritative checkout, and COD responsibility clearly assigned to the host.
4. **Jaheez Smart Errand Guardrails:** keep structured categories, proof and moderation; add prohibited-item explanation, price-adjustment consent, and operator rescue.
5. **Jaheez Nearby Add-on:** only after route economics and merchant readiness are measured; a second nearby stop with transparent ETA/fee, not a generic multi-store cart.
6. **Merchant Ready Desk:** low-cost web/tablet queue with acknowledge, prep estimate, ready, pause/overload, stock outage and support. This is more valuable to launch quality than a loyalty program.

## Validation evidence

### Fresh local execution on 2026-07-22

| Check | Result |
|---|---|
| Backend tests | **PASS** — 26 files, 176/176 tests, 7.21 s Vitest runtime |
| Backend production build | **PASS** |
| Admin production build | **PASS** — 3,341 modules transformed |
| Customer TypeScript `--noEmit` | **PASS** |
| Driver TypeScript `--noEmit` | **PASS** |
| Active contract lint | PASS |
| Strict frontend boundary lint | PASS |
| Payment-provider safety | PASS |
| Sensitive logging static lint | PASS, but SEC-08 is a scanner blind spot |
| Secret hygiene | PASS; root `.env` is not tracked |
| Migration safety | PASS |
| Active documentation, CI, root staging scripts | PASS |
| Package locks, gitignore, staging tool/template/env/status checks | PASS |
| Route-security contract | **FAIL** — legacy driver OTP does not fail closed |
| NPM audit policy | **FAIL** — high dependency advisories as described in SEC-09 |
| Readiness manifest | **FAIL** — does not match authoritative 055/056 chain |

The build commands created no tracked changes. A separate untracked root `gm.py` appeared during the audit and was not created, changed, executed, or removed by this task; it is outside the active application scope and contains a placeholder API key in the observed version.

### Historical baseline versus fresh dependency evidence

The requested baseline recorded fewer npm findings (backend 1 high; mobile 3 high each). The fresh registry result is larger by package-instance count while the unique high advisory roots remain limited. Both facts matter: the project has not met its zero-high policy, and registry/advisory changes make audit output time-dependent.

### Not locally verified

No production database was touched. No staging credentials, backup, provider account, two physical Android devices, or live deployment topology were available in this audit. Therefore this report does **not** claim:

- the live Supabase database is exposed or that its migrations match the repository;
- concurrency/locking behavior is correct under multiple API replicas;
- Socket.IO rooms remain isolated during real reconnect/revocation;
- notifications, maps, storage, WhatsApp, or mobile background location work on real devices;
- COD, refund, commission, payout and historical reconciliation balance on real data;
- backups restore within an acceptable time;
- app-store builds, permissions and release signing are ready.

## Stage-two sign-off matrix

All rows are mandatory before changing the verdict.

| Stage test | Actors/data | Required proof |
|---|---|---|
| Isolated restore and migration | Encrypted production backup -> isolated staging | Restore succeeds; authoritative chain/checksums apply twice; 055/056 and all required functions/columns/grants exist; production remains untouched. |
| RLS/grants matrix | anon, customer A/B, driver A/B, admin roles, service role | Wrong actor cannot read/mutate any raw business table or sensitive column; only backend/service RPC paths work. |
| BOLA/mass assignment | Cross-user orders, addresses, support, chat, reviews; cross-driver offers; admin roles | Every wrong-owner ID and server-owned field is denied without existence leaks; unknown fields rejected on sensitive writes. |
| Checkout idempotency/concurrency | Same/different payload keys, concurrent promo, store close/capacity changes | One order, identical replay DTO, correct request-hash conflict, exact centime equation, no promo oversell, committed status equals API. |
| Lifecycle/code replay | Wrong/replayed/concurrent pickup/delivery codes, missing schema | One legal transition; code is single-use; missing schema/code fails closed; driver and order invariants remain synchronized. |
| Dispatch recovery | Two backend replicas, one driver/multiple orders, old decline/new offer, Redis loss/restart | One offer/assignment, correct load/shift/capacity, leader fencing, no off-shift or phantom driver, recovery without duplicate side effects. |
| Socket.IO isolation | All actor types, wrong order/driver/admin room, disabled actors, reconnect | Only authorized rooms; disabled/demoted actors disconnected; no PII in logs; state catches up after reconnect. |
| Full COD lifecycle | Checkout -> pickup -> delivery -> customer confirm -> shift close -> COD settlement -> payout | Every centime reconciles, holds work, idempotent replays are identical, audit exists, no manual SQL. |
| Refund/reversal | Wallet/cash scenarios, partial/full policy, paid/unpaid ledger | Refund transition, wallet credit, COD/payout hold/reversal and audit are atomic/idempotent and reconcile. |
| Reconciliation scale | >1,000 seeded orders/shifts/issues | No starvation/N+1 overload; every discrepancy found once; unresolved failures alert and remain actionable. |
| Backup/rollback | Latest encrypted backup and previous release | Restore meets RTO/RPO; schema/application compatibility is documented; rollback does not discard post-deploy orders. |
| Real Android customer flow | Physical device, Arabic/French, weak network | Register, location, browse, cart, checkout, tracking, chat, cancel, review, recovery/deletion; no duplicates or dead ends. |
| Real Android driver flow | Different physical device, background/lock/weak network | Login, shift, heartbeat, offer, navigation, codes, proof, issue, offline/reconnect, payout view; safe battery/location behavior. |

## Remediation roadmap

### P0 — public-launch blockers

1. **Close database and DTO exposure** (SEC-01, SEC-02, SEC-10).
   - Dependency: isolated staging snapshot of current grants/policies.
   - Acceptance: complete actor RLS matrix green; explicit DTO snapshot denylist green.
2. **Make checkout one authoritative centime transaction** (LOG-01, LOG-02, FIN-01, LOG-04).
   - Dependency: append-only money/schema design and versioned API response.
   - Acceptance: exact replay, request-hash conflict, centime constraint, promo concurrency, and failure-injection tests.
3. **Make lifecycle/assignment/code/finance recoverable and fail closed** (LOG-05, LOG-06, LOG-07).
   - Dependency: locked RPC/outbox design and removal of schema compatibility fallbacks.
   - Acceptance: failure at every step preserves or auto-recovers invariants across two replicas.
4. **Separate support actor visibility** (LOG-08).
   - Dependency: data model/retention decision.
   - Acceptance: customer, driver, merchant and internal incidents have correct visibility/redaction.
5. **Repair release authority** (OPS-02, SEC-09).
   - Make manifest authoritative including 055/056, make obsolete OTP routes 410, triage dependency paths, and require all local gates green.
6. **Productionize worker and readiness behavior** (OPS-01, OPS-03).
   - Require centralized Redis/lease behavior, leader-fenced workers, DB/schema readiness and a real CI health assertion.

### P1 — security, finance, and operational completion

1. Implement verified customer phone/email ownership, recovery, contact change and deletion (SEC-03).
2. Require separate role secrets and live Socket.IO account revalidation (SEC-04, SEC-08).
3. Make store capacity authoritative at quote/checkout/dispatch (LOG-03).
4. Add missing FK/composite indexes, cursor pagination and set-based aggregates (DB-01).
5. Enforce immutable financial/reliability facts and atomic audit writes (FIN-02, OPS-05).
6. Complete backup/restore, monitoring, incident and rollback operations (OPS-04).
7. Execute the driver no-document/KYC/OTP compatibility removal (SEC-05, FEAT-01).

### P2 — launch-quality UX and merchant capability

1. Accessibility and design-token pass for customer and driver critical journeys (UX-01).
2. Weak-network/offline/reconnect semantics and feature-component decomposition (UX-02).
3. Remove or disable unfinished referrals, loyalty, Plus and parcel promises (FEAT-02).
4. Ship a minimal merchant Ready Desk and consolidated admin incident console (FEAT-04).
5. Add scheduled errands and standard orders only after capacity/dispatch invariants are green (FEAT-03).

### P3 — measured differentiation after stable launch

1. Precise Handoff trust layer and shareable tracking.
2. Group/family/office ordering with one accountable payer.
3. Nearby second-store add-on after route-economics experiments.
4. Loyalty/Plus only with defined unit economics, fraud controls, and server-authoritative benefits.
5. Multi-city configuration, service areas, pricing versions and merchant capacity without Safi-coded product behavior.

## Launch decision checklist

Public launch may be reconsidered only when:

- every High finding is closed with an automated or signed staging acceptance artifact;
- all local release gates pass, including route security, dependency policy, and manifest consistency;
- the complete stage-two matrix passes on an isolated restored database and two real Android devices;
- online payments remain disabled unless a Moroccan-compatible provider separately passes its own security/finance certification;
- operations names an on-call owner, incident channel, rollback owner, finance reconciler, and launch-day capacity limits;
- a final go/no-go review confirms backups, monitoring, support staffing, driver/store readiness, and Safi service-area configuration.

Until then, JAHEEZ is suitable for controlled engineering/staging work and possibly a tightly supervised internal pilot with synthetic or explicitly limited exposure—not a public launch with unrestricted customers and real COD liability.
