# FINANCE DEPRECATION REPORT

## Salary Model Decision

JAHEEZ drivers are formal **employees** receiving a fixed monthly salary. The previous gig-economy commission split / revenue-share architecture is completely deprecated. Driver earnings from individual deliveries are limited exclusively to tip sharing.

---

## Active & Transitioned Finance Logic

| Area | Status | MVC Location | Details |
|---|---|---|---|
| **COD Balance Tracking** | **ACTIVE** | `CheckoutRepository.updateDriverStats` | Tracks the physical Cash-on-Delivery collections. Increments by the **full amount** (subtotal + delivery fee + rider tip) for cash orders. |
| **Driver Tip Allocation** | **ACTIVE** | `OrderLifecycleService.transitionOrder` | Enforces the 25/75 tip split rule. Driver receives **exactly 25%** of the `rider_tip` as a bonus, which is added to `earnings_centimes` in the driver's ledger. |
| **Direct Mutations Block** | **ACTIVE** | Database RLS Policies | Dropped all direct client-side insert/update access on wallets, transactions, and order payouts. All adjustments must go through service role API calls. |

---

## Deprecated & Removed Finance Elements

| Component | Status | Code Reference | Mitigation / Action |
|---|---|---|---|
| **Driver Share Settings** | **DEPRECATED** | `CheckoutRepository.getFinanceSettings` | Tagged as `DEPRECATED_FOR_SALARY_MODEL`. Retained only for audit / backward-compatibility checks. |
| **Gig Payout Requests** | **REMOVED** | `driver-app/app/(flows)/payout-request.tsx` | Deleted the file to prevent drivers from claiming earnings on-demand. |
| **Earnings Tab** | **REMOVED** | `driver-app/app/(tabs)/earnings.tsx` | Replaced with salary-period info or removed to avoid gig-dashboard styling. |
| **Leaderboard / Revenue View** | **REMOVED** | `admin/` pages | Removed driver commission leaderboard panels from the Admin Dashboard. |

---

## Risk & Validation Audit

### 1. Desync Risk (`DESYNC RISK`)
*   **Assessment:** Verified that all order status transitions to `delivered` automatically adjust driver stats in a single transactional path via `OrderLifecycleService`.
*   **Status:** **CLEARED**. There are no duplicate or competing calculations in the client apps or the legacy monolith.

### 2. Architecture Violation (`ARCHITECTURE VIOLATION`)
*   **Assessment:** Confirmed that the mobile clients (both user and driver apps) do not perform any pricing calculations, checkout totals additions, or wallet updates.
*   **Status:** **CLEARED**. All finance arithmetic is strictly backend-authoritative.

### 3. Security Violation (`SECURITY VIOLATION`)
*   **Assessment:** Audited database RLS policies. Ensure client anon keys cannot bypass backend services to increment or claim earnings.
*   **Status:** **CLEARED**. Wallet and orders tables require `service_role` authorization for any modification.
