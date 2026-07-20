# ORDER STATUS AND STATE MACHINE

> Generated: 2026-05-19 | Source: `shared/constants.ts`, `supabase_schema.sql`, `admin-api.js`

---

## ⚠️ CRITICAL: Two Conflicting Status Systems Exist

### System A: Database Schema (`supabase_schema.sql`)
```
pending → confirmed → preparing → picked_up → delivered → completed
                                                        → cancelled (from any non-terminal)
```

### System B: TypeScript Types (`shared/types.ts` + `shared/constants.ts`)
```
pending_moderation → pending_driver → driver_assigned → in_progress → picked_up → delivered → completed
                  → moderation_rejected                                                     → disputed
                  → cancelled (from pending_moderation, pending_driver, driver_assigned)
```

**Admin API uses System A. User app code uses System B. These are INCOMPATIBLE.**

---

## Order Lifecycle (System B — as designed in TypeScript)

| Status | Meaning | Set By | Next Allowed | UI Label (AR) | Color |
|--------|---------|--------|--------------|----------------|-------|
| `pending_moderation` | Order submitted, being checked for banned content | System | `pending_driver`, `moderation_rejected`, `cancelled` | في انتظار المراجعة | WARN (#F5A623) |
| `pending_driver` | Approved, searching for driver | System | `driver_assigned`, `cancelled` | نبحث عن سائق | WARN |
| `driver_assigned` | Driver accepted the order | Driver | `in_progress`, `cancelled` | تم تعيين سائق | BLUE (#3A8FE8) |
| `in_progress` | Driver heading to pickup | Driver | `picked_up` | السائق في الطريق | BLUE |
| `picked_up` | Driver has the items | Driver | `delivered` | تم الاستلام | BLUE |
| `delivered` | Driver at dropoff, awaiting confirmation | Driver | `completed`, `disputed` | تم التوصيل | GREEN (#2DB87A) |
| `completed` | Confirmed by user | User/System | (terminal) | مكتمل | GREEN |
| `cancelled` | Order cancelled | User/Admin | (terminal) | ملغي | ERROR (#DC2626) |
| `disputed` | User claims issue after delivery | User | (terminal) | متنازع عليه | ERROR |
| `moderation_rejected` | Content failed moderation | System/AI | (terminal) | مرفوض | ERROR |

### Valid Transitions (from `shared/constants.ts`)
```typescript
{
  pending_moderation:   ['pending_driver', 'moderation_rejected', 'cancelled'],
  pending_driver:       ['driver_assigned', 'cancelled'],
  driver_assigned:      ['in_progress', 'cancelled'],
  in_progress:          ['picked_up'],
  picked_up:            ['delivered'],
  delivered:            ['completed', 'disputed'],
  completed:            [],
  cancelled:            [],
  disputed:             [],
  moderation_rejected:  [],
}
```

### Terminal Statuses
`completed`, `cancelled`, `moderation_rejected`

---

## Order Lifecycle (System A — in database + admin API)

| Status | Used By Admin API | Notes |
|--------|-------------------|-------|
| `pending` | Dashboard counts, order listing | Initial state |
| `confirmed` | Admin sets | Store confirmed the order |
| `preparing` | Admin sets | Kitchen is preparing |
| `picked_up` | Admin/Driver sets | Driver has items |
| `delivered` | Admin/Driver sets | At customer |
| `completed` | Auto/Admin | Final |
| `cancelled` | Admin/User | With reason |

---

## Payment Status Lifecycle (from schema)
```
pending → paid → (refunded)
       → failed
```
| Status | Meaning |
|--------|---------|
| `pending` | Payment not yet processed |
| `paid` | Payment received |
| `failed` | Payment attempt failed |
| `refunded` | Payment refunded |

---

## Wallet Transaction Types
From schema: `credit`, `debit`, `refund`, `admin_adjustment`, `payout`, `cod_settle`, `topup`

Each has a `direction`: `credit` or `debit`

---

## Support Ticket Lifecycle
```
open → in_progress → resolved → closed
```
| Status | Set By | Meaning |
|--------|--------|---------|
| `open` | User (auto) | New ticket submitted |
| `in_progress` | Admin | Being investigated |
| `resolved` | Admin | Issue resolved |
| `closed` | Admin | Ticket closed |

---

## Driver KYC Lifecycle
```
pending → partial → full → verified
                        → rejected
```
| Status | Meaning |
|--------|---------|
| `pending` | No documents uploaded |
| `partial` | Some documents uploaded, can do limited deliveries |
| `full` | All documents uploaded, awaiting admin review |
| `verified` | Admin approved — full access |
| `rejected` | Admin rejected — must re-upload |

---

## Payout Request Lifecycle
```
pending → approved → paid
       → rejected
```

## COD Settlement Lifecycle
```
pending → confirmed
       → disputed
```
