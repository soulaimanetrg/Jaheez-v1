# Wallet Manual Adjustment

## What & Why
Per spec section 4.10, finance admins must be able to manually adjust a user's wallet balance (credit or debit) for support cases that don't fit the refund flow — e.g. goodwill credit, correcting a bug-induced miscount, debiting after fraud detection. Today there's no UI for this and no double-entry safeguard, which is non-negotiable for money operations.

## Done looks like
- A new "Portefeuilles" admin page lists users with their current balance, a search box, and a click-through detail view.
- Detail view shows balance + last 50 transactions and has an "Ajuster le solde" button.
- Adjustment modal asks for: amount (signed, MAD), type (credit/debit), reason (min 10 chars, mandatory), internal note.
- Confirmation step shows old balance → new balance and requires explicit "Confirmer".
- Adjustment writes a `wallet_transactions` row (type `admin_adjustment`) and updates `wallets.balance_centimes` **atomically** — same race-safety pattern as the refund completion.
- Every adjustment is recorded in `audit_log` with old/new balance and the admin who did it.
- Endpoint is RBAC-gated to `super_admin` + `admin` (finance role equivalent).
- Wallet freeze/unfreeze toggle on the detail view (writes new `wallets.is_frozen` column).

## Out of scope
- Promo-credit separation (different ledger column) — separate future work.
- Bulk adjustments (CSV upload).
- Driver-side wallet adjustments — separate flow.

## Architectural constraints
- Reuse the same transaction + `FOR UPDATE` pattern from refund completion to avoid race conditions.
- Wallet data lives in Supabase (`wallets`, `wallet_transactions`); admin-side audit lives in local PG. Adjustment must succeed in Supabase first, then audit-log; if Supabase fails, do not record success.
- French UI, brand styling, mobile-friendly modal.

## Steps
1. **Schema change** — Add `wallets.is_frozen BOOLEAN DEFAULT FALSE` and `wallets.frozen_reason TEXT` to `supabase_schema.sql`. Provide SQL for the user to run.
2. **Backend endpoints** — In `scripts/admin-api.js` add: `GET /admin-api/wallets` (list with search), `GET /admin-api/wallets/:user_id` (detail + recent tx), `POST /admin-api/wallets/:user_id/adjust` (atomic adjustment), `POST /admin-api/wallets/:user_id/freeze` and `/unfreeze`. All RBAC-gated and audit-logged.
3. **API client** — Add `wallets` namespace to `admin/src/lib/api.ts` with proper TypeScript interfaces.
4. **Wallets page** — New `admin/src/pages/Wallets.tsx`: list + search; detail drawer with balance, freeze toggle, transaction history, "Adjust" button opening the modal.
5. **Adjustment modal** — Two-step form: (1) amount + reason + note, (2) confirmation showing old → new with explicit confirm. Show error states clearly.
6. **Wire route + sidebar** — Add to `admin/src/App.tsx` and `admin/src/components/layout/Sidebar.tsx` with the Wallet icon.
7. **Manual testing** — Adjust a balance up and down, verify ledger entry appears in user app, freeze a wallet and verify user app blocks wallet payment at checkout, check audit log records both old and new values.

## Relevant files
- `scripts/admin-api.js`
- `admin/src/pages/Refunds.tsx`
- `admin/src/lib/api.ts`
- `admin/src/App.tsx`
- `admin/src/components/layout/Sidebar.tsx`
- `supabase_schema.sql`
- `GAP_ANALYSIS.md`
