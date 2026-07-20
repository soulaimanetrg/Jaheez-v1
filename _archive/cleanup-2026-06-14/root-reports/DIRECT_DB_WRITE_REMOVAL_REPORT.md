# DIRECT DB WRITE REMOVAL REPORT

Generated: 2026-06-10

## Summary

Frontend production paths no longer contain direct Supabase `insert`, `update`, `delete`, or `upsert` calls in `user-app`, `driver-app`, or `admin` from the enforced scan pattern.

Allowed remaining frontend Supabase usage is read-only querying and realtime subscriptions.

## Removed Writes

| Source file | Removed mutation | Replacement endpoint | Classification | Status |
|---|---|---|---|---|
| `user-app/app/(flows)/favorites.tsx` | `favorites.delete` | `POST /admin-api/v1/customer/favorites/toggle` | SECURITY VIOLATION | Removed |
| `user-app/app/(flows)/chat/[id].tsx` | `chat_messages.insert` | `POST /admin-api/v1/customer/orders/:orderId/chat` | SECURITY VIOLATION | Removed |
| `user-app/app/(flows)/addresses.tsx` | `user_addresses.insert/update/delete` | `/admin-api/v1/customer/addresses` | SECURITY VIOLATION | Removed in current Phase 1 pass |
| `user-app/hooks/usePushNotifications.ts` | `users.update(push_token)` | `PATCH /admin-api/v1/customer/push-token` | SECURITY VIOLATION | Removed in current Phase 1 pass |
| `user-app/lib/supportApi.ts` | `support_requests.insert` | `POST /admin-api/v1/customer/support-tickets` | SECURITY VIOLATION | Removed in current Phase 1 pass |
| `user-app/lib/storeApi.ts` | `favorites.insert/delete` | `POST /admin-api/v1/customer/favorites/toggle` | SECURITY VIOLATION | Removed in current Phase 1 pass |
| `user-app/lib/api.ts` | order lifecycle/chat/review writes | `/admin-api/v1/...` customer/order endpoints | ARCHITECTURE VIOLATION / DESYNC RISK | Removed in current Phase 1 pass |
| `user-app/lib/orderApi.ts` | order/custom-order/cancel writes | `/admin-api/v1/checkout`, `/admin-api/v1/customer/orders/custom`, `/admin-api/v1/orders/:id/cancel` | ARCHITECTURE VIOLATION / DESYNC RISK | Removed in current Phase 1 pass |
| `user-app/lib/authApi.ts` | `users.insert/update` profile writes | `POST/PATCH /admin-api/v1/customer/profile` | SECURITY VIOLATION | Removed in current Phase 1 pass |

## Verification

Command:

```powershell
rg "supabase\.from\([^\n]+\)\.(insert|update|delete|upsert)|\.insert\(|\.update\(|\.delete\(" user-app driver-app admin -g "*.ts" -g "*.tsx"
```

Result:

- `admin/src/hooks/use-toast.ts`: local `Map.delete`, not a database write.
- `user-app/app/(flows)/category/[id].tsx`: local `Set.delete`, not a database write.

## Remaining Risk

Checkout and Stripe display/payment paths still include frontend-calculated display totals and a legacy Stripe amount payload. Backend checkout recalculates order totals, but Stripe session authority should be fully migrated to the new backend before production payment enablement.
