# User App Audit

## Verdict

Status: PARTIALLY WORKING, RISKY / INSECURE

The user app has real screens and some backend-connected flows, but it still violates backend authority. Store checkout is partly server-authoritative; custom orders, addresses, favorites, chat, push token updates, and several reads/subscriptions bypass the backend.

## Key Traced Flows

### Store checkout

CURRENT FLOW:
`checkout.tsx -> useCreateOrder -> user-app/lib/orderApi.ts createOrder -> POST /admin-api/v1/checkout -> backend/legacy depending on proxy -> create_order_atomic RPC -> Supabase`

TARGET FLOW:
`Frontend -> Communication Layer -> Controller -> Service -> Repository -> Database`

Status: PARTIALLY WORKING

Evidence:

- `user-app/lib/orderApi.ts` posts to `/admin-api/v1/checkout`.
- `backend/src/routes/checkout.routes.ts` defines `POST /v1/checkout` with `verifySupabaseJwt`, validation, controller.
- `backend/src/services/checkout.service.ts` fetches store/menu data, calculates totals, and calls `createAtomicOrder`.
- `supabase/migrations/015_secure_checkout.sql` defines `create_order_atomic`.

Violations:

- `user-app/app/(flows)/checkout.tsx` calculates `subtotal`, `discountMAD`, `finalTotal`, and displays/sends payment amounts.
- Stripe session creation uses `amount_centimes` from UI-calculated `finalTotal`.
- Promo validation calls legacy `/admin-api/validate-promo`, not the new checkout service.

### Custom request

CURRENT FLOW:
`custom-request.tsx -> createCustomOrder -> supabase.from('orders').insert(...)`

TARGET FLOW:
`Frontend -> Communication Layer -> Controller -> Service -> Repository -> Database`

Status: RISKY / INSECURE

Issue:

- Category: Direct DB write
- Severity: CRITICAL
- File path: `user-app/lib/orderApi.ts`
- Current behavior: `createCustomOrder` inserts directly into `orders` with client-defined delivery fee/total.
- Broken behavior: skips controller, service, repository, validation, dispatch, and notification orchestration.
- Product impact: custom errands may enter the order table without the same integrity checks as store checkout.
- Exploit / failure risk: client tampering or RLS drift can create inconsistent orders.
- Exact recommended fix: add `POST /api/v1/custom-orders`; service owns pricing/status; frontend sends only request fields.
- Priority: P0

### Addresses, favorites, chat, push token

Status: RISKY / INSECURE for writes

Evidence:

- `user-app/app/(flows)/addresses.tsx` inserts/updates/deletes `user_addresses`.
- `user-app/lib/storeApi.ts` and `user-app/app/(flows)/favorites.tsx` insert/delete `favorites`.
- `user-app/app/(flows)/chat/[id].tsx` inserts `chat_messages`.
- `user-app/hooks/usePushNotifications.ts` updates `users.push_token`.

These can be acceptable only as read-only Supabase subscriptions or if explicitly treated as non-sensitive local/user-owned data with tight RLS. Under the mandatory architecture, all writes must move behind backend services.

## Fake / UI-only / Weak Areas

- `user-app/lib/placesApi.ts` has deterministic fake ratings and mock fallback data.
- `user-app/app/(flows)/custom-request.tsx` comments that delivery cost estimation is mock.
- Confirmation/chat screens guard `orderId === 'demo'`, showing demo-aware paths.
- Live order tracking uses Supabase realtime, not authenticated Socket.IO.

## Required Fix Sequence

1. Keep `createOrder` on backend, but remove client-sent card amount.
2. Add backend endpoints for custom orders, addresses, favorites, chat send, and push token registration.
3. Convert communication helpers to pure fetch wrappers.
4. Tighten Supabase policies to read-only for frontend where backend owns writes.
5. Remove mock/demonstration fallbacks from production builds.
