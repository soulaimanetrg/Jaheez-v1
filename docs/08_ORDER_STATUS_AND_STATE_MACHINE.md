# 8. ORDER STATUS AND STATE MACHINE — JAHEEZ

**Purpose:** Document all lifecycle states and transitions | **Last Updated:** 2026-05-19

---

## Order Lifecycle State Machine

```
┌────────────────────────────────────────────────────────────────────┐
│                      ORDER LIFECYCLE                               │
└────────────────────────────────────────────────────────────────────┘

pending_moderation (user creates order)
        │
        ├─ AI content check: risky? ──→ moderation_rejected ──→ [END: Refund]
        │
        └─ AI content check: OK ──→ pending_driver
                                          │
                                          ├─ Match driver ──→ driver_assigned
                                          │        │
                                          │        └─ No drivers available (timeout) ──→ cancelled ──→ [END: Refund]
                                          │
                                          └─ Admin manual review needed (uncertain) ──→ [Hold]

driver_assigned (driver found, waiting for acceptance)
        │
        ├─ Driver accepts ──→ in_progress
        │
        └─ Driver rejects / timeout ──→ pending_driver (retry)

in_progress (driver picking up items from store)
        │
        └─ Driver picks up items ──→ picked_up

picked_up (driver has items, heading to delivery)
        │
        └─ Driver arrives & delivers ──→ delivered

delivered (items given to user)
        │
        └─ User/driver confirm ──→ completed ──→ [END: Payment collected]

disputed (user reports issue before completion)
        │
        └─ Admin resolves ──→ completed (with refund) ──→ [END]

cancelled (user or system cancels)
        │
        └─ [END: Refund if applicable]

moderation_rejected (AI flagged as risky/illegal)
        │
        └─ [END: Refund, order blocked]
```

---

## Order Status Reference (V1 Timeline Stepper Setup)
V1 tracking operates on a status-based stepper timeline (displayed to customers). Drivers manually tap buttons in the Driver App to log each transition, which automatically updates the order record and inserts a status event into the `order_status_log`. Live GPS tracking coordinates are deferred.

| Status | Name | Display Label | UI Color | User Sees | Driver Sees | Payment Status | Meaning |
|---|---|---|---|---|---|---|---|
| **pending_moderation** | Pending Moderation | "Processing..." | Gray | ❌ Hidden | ❌ No | Pending | AI scans order for fraud / Admin manual check |
| **pending_driver** | Awaiting Driver | "Finding driver..." | Gray | ❌ Hidden | ❌ No | Pending | Searching for driver (manual dispatch in V1) |
| **driver_assigned** | Driver Assigned | "Driver assigned" | Blue | ✓ Yes | ✓ Yes | Pending | Driver assigned and accepts the task |
| **in_progress** | In Progress | "Preparing" | Blue | ✓ Yes | ✓ Yes | Pending | Driver heading to or waiting at pickup location |
| **picked_up** | Picked Up | "On the way" | Orange | ✓ Yes | ✓ Yes | Pending | Driver picked up items, delivering to customer |
| **delivered** | Delivered | "Delivered" | Green | ✓ Yes | ✓ Yes | Paid (COD collected) | Driver reached user and collected cash |
| **completed** | Completed | "Completed" | Green | ✓ Yes | ✓ Yes | Paid (COD settled) | Cash reconciled, order closed |
| **cancelled** | Cancelled | "Cancelled" | Red | ✓ Yes | ✗ No | Refunded / N/A | Order cancelled by user, driver, or operator |
| **disputed** | Disputed | "Issue reported" | Red | ✓ Yes | ✓ Yes | Pending | User reported issue (diverted to manual WhatsApp) |
| **moderation_rejected** | Rejected | "Order rejected" | Red | ✓ Yes | ✗ No | N/A | AI flagged order as illegal/invalid |

---

## Valid Status Transitions

| From Status | Can Transition To | Triggered By | Notes |
|---|---|---|---|
| **pending_moderation** | pending_driver, moderation_rejected | AI scan / Admin decision | Terminal states: moderation_rejected |
| **pending_driver** | driver_assigned, cancelled | Driver matched / Timeout/User | If timeout (15 mins), auto-cancel + refund |
| **driver_assigned** | in_progress, pending_driver, cancelled | Driver accepted / Rejected / User | Driver can reject (retry matching) |
| **in_progress** | picked_up, cancelled, disputed | Driver action / User report | Can only move forward unless disputed |
| **picked_up** | delivered, disputed | Driver action / User report | Can only move forward unless disputed |
| **delivered** | completed, disputed | Confirmation / User report | Most complete orders become "completed" |
| **completed** | disputed (rare) | User report (post-completion) | Only if user challenges within timeframe |
| **cancelled** | None (terminal) | User/System | Cannot transition from cancelled |
| **disputed** | completed, cancelled | Admin resolution / Refund | Resolution leads to completion or cancellation |
| **moderation_rejected** | None (terminal) | System | No transitions; order is blocked |

---

## Payment Status Parallel State

| Payment Status | When Set | Meaning | Order Status Implications |
|---|---|---|---|
| **pending** | Order created | Payment awaited | Order can still be cancelled |
| **paid** | Payment confirmed | Payment received | Order can proceed to completion |
| **failed** | Payment failed | Transaction declined | Order status unchanged, user must retry |
| **refunded** | Order cancelled/disputed | Money returned | Associated with cancelled or disputed orders |

---

## Driver Availability State Machine

```
offline (driver logged out / app closed)
    │
    └─ Driver logs in ──→ online

online (driver active, waiting for orders)
    │
    ├─ Order assigned to driver ──→ on_delivery
    │
    └─ Driver logs out ──→ offline

on_delivery (driver has active order)
    │
    ├─ Order picked up ──→ on_route
    │
    └─ Driver cancels/timeout ──→ online (becomes available again)

on_route (driver heading to delivery)
    │
    ├─ Driver arrives & delivers ──→ online
    │
    └─ Driver cancels ──→ online
```

---

## Payment Lifecycle

```
pending (payment awaited)
    │
    ├─ Stripe charges card ──→ paid
    │
    └─ Payment fails ──→ failed (retry available)

paid (payment confirmed)
    │
    ├─ Order completed ──→ settled (funds to merchant)
    │
    └─ Order cancelled ──→ refunded

refunded (money returned to customer)
    │
    └─ [Terminal: fund in customer wallet or card]
```

---

## Wallet Transaction Types

| Type | Amount | Trigger | Example |
|---|---|---|---|
| **top_up** | +X DH | User adds funds | User adds 100 DH via card |
| **payment** | -X DH | Order paid from wallet | Order for 85 DH paid from wallet |
| **refund** | +X DH | Order cancelled/refunded | Order cancelled, 85 DH returned |
| **bonus** | +X DH | Promo or cashback | Promo code gave 20 DH bonus |
| **adjustment** | ±X DH | Admin adjustment | Admin adjusts balance (support) |

---

## Support Ticket Lifecycle

```
open (user submits ticket)
    │
    ├─ Admin starts work ──→ in_progress
    │
    └─ User closes ──→ closed

in_progress (admin investigating)
    │
    ├─ Admin resolves ──→ resolved
    │
    └─ More info needed ──→ open

resolved (admin provided solution)
    │
    └─ User closes ──→ closed

closed (ticket finished)
    │
    └─ [Terminal: can reopen within timeframe]
```

---

## Driver Verification Lifecycle

```
not_verified (driver just registered)
    │
    ├─ Submit documents ──→ pending_review
    │
    └─ Cannot accept orders

pending_review (admin reviewing docs)
    │
    ├─ Admin approves ──→ verified ──→ Can accept orders
    │
    └─ Admin rejects ──→ rejected ──→ Can resubmit

verified (driver approved)
    │
    └─ Can accept orders
```

---

## Promo Code Lifecycle

```
active (valid and within timeframe)
    │
    ├─ Code used ──→ decrement_usage (if limited uses)
    │
    └─ Expiration date passes ──→ expired

expired (past expiration date)
    │
    └─ Cannot be used
```

---

## User Notification Triggers

| Event | Notification | Recipient | When |
|---|---|---|---|
| **Order created** | "Order confirmed! Est. delivery: 45 mins" | User | Immediately |
| **Driver assigned** | "[Driver name] is heading to pickup" + phone | User | When driver_assigned status |
| **Picked up** | "Order picked up! Heading your way" | User | When picked_up status |
| **Delivered** | "Order delivered! Rate this delivery →" | User | When delivered status |
| **Order cancelled** | "Order cancelled. Refund initiated." | User | When cancelled status |
| **Support reply** | "New reply to your support ticket" | User | When admin replies |
| **Promo alert** | "New promo: Use code SPRING50 for 50% off" | User | When promo published |

---

## Admin State Transitions

| User Role | Can Perform |
|---|---|
| **super_admin** | All actions: create stores, verify drivers, manage admins, refunds, payouts, analytics |
| **admin** | Store management, order management, driver verification, support replies |
| **manager** | View analytics, manage orders, support replies (read-only admin access) |
| **support** | Support tickets only, cannot manage stores/drivers/payments |

---

**Created:** 2026-05-19 | **Method:** State machine design inspection | **Confidence:** High
