# CUSTOMER BAN RULES REPORT

## Policy & Business Rules

To prevent customer cancellation abuse, JAHEEZ enforces an automatic account suspension rule:

1. Customers may cancel their orders while the order is in `pending` or `confirmed` status.
2. Every cancellation requires a reason.
3. If a customer reaches **3 cancellations** (where the cancellation was initiated by the customer), their account is automatically suspended.
4. Banned accounts are completely blocked from placing checkouts, editing profiles, or performing active operations.

---

## Technical Implementation

### 1. Authoritative Cancellation Count & Ban Trigger
When a customer cancels an order via `POST /v1/orders/:id/cancel`, the backend executes the following check inside `CheckoutService.cancelOrder`:
```typescript
async cancelOrder(orderId: string, userId: string, reason: string) {
  // 1. Transition status using lifecycle rules
  await this.lifecycleService.transitionOrder(orderId, { type: 'customer', id: userId }, 'cancelled', reason);

  // 2. Query customer's total cancellation count
  const cancelCount = await this.checkoutRepo.getCancelledOrdersCount(userId);

  // 3. Trigger ban if count is 3 or more
  if (cancelCount >= 3) {
    logger.warn(`[checkout] User ${userId} reached ${cancelCount} cancellations. Auto-banning user.`);
    await this.checkoutRepo.banUser(userId);
  }
}
```

### 2. Request Blocking Middleware
The middleware `verifySupabaseJwt` in [supabaseJwt.middleware.ts](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/backend/src/middleware/supabaseJwt.middleware.ts) acts as the gating security authority:
*   Resolves the user profile from the database using the UUID retrieved from the JWT token.
*   If `user.is_banned` is set to `true`, the request is immediately aborted with a `403 Forbidden` status:
    ```json
    {
      "error": "Compte suspendu / Banni",
      "error_code": "account_disabled"
    }
    ```
*   This ensures all subsequent REST and socket actions fail.

---

## Risk & Validation Audit

### 1. Desync Risk (`DESYNC RISK`)
*   **Assessment:** Can a customer continue checkouts if their local app session remains active?
*   **Status:** **CLEARED**. Since the ban check is executed on the server *per request* inside the JWT middleware, active client sessions are blocked immediately upon the next API call.

### 2. Architecture Violation (`ARCHITECTURE VIOLATION`)
*   **Assessment:** Check if the React Native app contains client-side checks for the cancellation limit.
*   **Status:** **CLEARED**. The customer app has no knowledge of the cancellation counter; it merely displays the `403` error returned by the server.

### 3. Security Violation (`SECURITY VIOLATION`)
*   **Assessment:** Can a customer bypass the count by deleting local storage or reinstalling?
*   **Status:** **CLEARED**. The cancellation counter is compiled using database queries (`COUNT(*)` on orders where `user_id = :userId` and status is `'cancelled'`), which is persistent and tamper-proof.
