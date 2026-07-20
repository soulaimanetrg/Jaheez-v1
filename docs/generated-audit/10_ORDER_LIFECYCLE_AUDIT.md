# 10. Order Lifecycle Audit

This document audits the order status workflow, allowed transitions, and role permissions.

---

## 1. Status Transition Table

The system defines the following order statuses: `pending`, `confirmed`, `preparing`, `picked_up`, `delivered`, `completed`, `cancelled`.

| Current Status | Target Status | Authorized Actor | Verification / Condition |
| :--- | :--- | :--- | :--- |
| `pending` | `confirmed` | Admin / Merchant | Merchant accepts order. |
| `pending` | `cancelled` | Customer / Admin | Allowed only before merchant confirmation. |
| `confirmed` | `preparing` | Merchant | Merchant starts preparing items. |
| `preparing` | `ready_for_pickup` | Merchant | Items are ready for pickup. |
| `ready_for_pickup`| `picked_up` | Driver | Driver scans order and picks it up. |
| `picked_up` | `arrived_customer` | Driver | Driver arrives at customer's location. |
| `arrived_customer`| `delivered` | Driver | Driver delivers order. |
| `delivered` | `completed` | Customer / System | Customer confirms delivery or timeout expires. |
| Any state | `cancelled` | Admin | Override allowed only for system errors. |

---

## 2. Security Vulnerabilities

*   **Duplicate Transition Rules**: Stage update rules and allowed statuses (`confirmed`, `preparing`, `picked_up`, `delivered`) are defined in both `scripts/admin-api.js` (line 2547) and the restructured backend service `backend/src/services/driver.service.ts` (line 9).
*   **Missing Status History Logs**: While orders update status flags, they do not create structured history logs, making it difficult to audit delivery times or compute driver metrics.
*   **Driver Operations Guard**: Code audit verifies that the legacy backend (`scripts/admin-api.js` line 2669) and restructured backend (`driver.service.ts` line 126) **DO** verify order driver ownership:
    *   `if (!ord || ord.driver_id !== req.driver.driver_id) return res.status(403).json({ error: 'Accès refusé' });`
    *   This is correctly implemented. Drivers cannot manipulate unrelated orders.
*   **Direct Database Reads**: Customer can read order details directly from Supabase, bypassing backend validation controls.

