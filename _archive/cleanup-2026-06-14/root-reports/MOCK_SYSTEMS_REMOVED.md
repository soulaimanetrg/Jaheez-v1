# MOCK SYSTEMS REMOVED

Generated: 2026-06-10

## Removed Or Isolated In This Pass

| Source file | Finding | Classification | Action |
|---|---|---|---|
| `user-app/app/(flows)/cart.tsx` | Hardcoded demo coupons `JAHEEZ10` and `JAHEEZ20` calculated frontend discounts. | DESYNC RISK | Removed frontend discount authority. Cart now directs promo validation to checkout/server flow. |
| `user-app/app/(flows)/chat/[id].tsx` | Demo/local chat mode remains only for invalid preview IDs (`new`, `demo`). | DESYNC RISK | Production order IDs now send through backend endpoint. Preview mode is non-persistent. |

## Remaining Legacy Runtime Risks

| Source file | Finding | Classification | Required fix |
|---|---|---|---|
| `scripts/admin-api.js` | `ADMIN_JWT_SECRET` fallback string. | CRITICAL SECURITY VIOLATION | Remove fallback and fail closed when env secret is missing. |
| `scripts/admin-api.js` | Built-in mock admin login `admin@jaheez.ma` / `admin123`. | CRITICAL SECURITY VIOLATION | Remove mock account path entirely. |
| `scripts/admin-api.js` | Service-role Supabase client remains mutation-capable across many routes. | CRITICAL DESYNC RISK | Lock legacy server to read-only/internal-only or retire mutation routes after migration. |
| `scripts/admin-api.js` | Duplicate in-memory OTP stores. | SECURITY VIOLATION | Move OTP proof flow to backend service or disable as release blocker. |
| `user-app/lib/fallbackApi.ts`, `user-app/lib/storeApi.ts` | Store/menu fallback data can still appear in runtime discovery. | DESYNC RISK | Disable production fallback data or gate it behind explicit dev mode. |
| `scripts/test-order-flow.js` | Uses `admin123` test credentials and service role. | SECURITY VIOLATION if run as production path | Keep as dev-only script; do not wire into runtime. |

## Notes

Dev scripts may remain only if isolated from production runtime. `scripts/admin-api.js` is not yet safe as a production mutation authority and must be treated as temporary legacy.
