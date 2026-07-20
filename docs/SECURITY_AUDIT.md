# JAHEEZ (جاهز) — SECURITY AUDIT & VULNERABILITY REPORT
**Prepared by: Technical Due Diligence Team**  
**Project:** Moroccan Hyperlocal Logistics Platform (Safi Launch)  
**Status:** High Risk — Launch Blockers Present

---

## 1. VULNERABILITY REGISTER

### VULN-001: Client-Driven Order Creation & Payment Status Fraud
* **Location:** `public.orders` table RLS Policy & [orderApi.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/lib/orderApi.ts)
* **Severity:** **CRITICAL**
* **Exploitability:** Easy (no technical skills required, simply modify client payload).
* **Exploit Path:**
  The `orders` table has an RLS policy allowing direct insertion by any authenticated user:
  ```sql
  CREATE POLICY "orders_own_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
  ```
  The user-app performs a direct Supabase insertion:
  ```typescript
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({ ...order, payment_status: 'paid', payment_method: 'card' })
  ```
  An attacker can bypass payment screens and directly insert a row into `orders` with `payment_status = 'paid'` and `payment_method = 'card'`, causing merchants and drivers to process unpaid orders.
* **Fix:** Disable direct client `INSERT` operations on the `orders` table. Create an Express backend endpoint `/api/orders` that processes card payments (e.g. via Stripe) first and inserts the order row server-side using the `service_role` key.

---

### VULN-002: Client-Driven Order Status Bypass (Self-Delivery)
* **Location:** `public.orders` RLS Update Policy
* **Severity:** **CRITICAL**
* **Exploitability:** Easy.
* **Exploit Path:**
  The `orders` table allows the owner to update the order row:
  ```sql
  CREATE POLICY "orders_own_update" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
  ```
  Since the policy does not restrict which columns can be updated, any user can send a PATCH query to Supabase updating their order status directly to `delivered` or `completed`, bypassing payment in Cash on Delivery (COD) scenarios.
* **Fix:** Drop the current update policy. Replace it with a policy that only permits users to update order notes:
  ```sql
  CREATE POLICY "orders_own_update_restricted" ON public.orders 
    FOR UPDATE USING (auth.uid() = user_id) 
    WITH CHECK (status = 'pending' AND payment_status = 'pending');
  ```

---

### VULN-003: Hardcoded Admin JWT Secrets
* **Location:** [admin-api.js](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/scripts/admin-api.js#L18)
* **Severity:** **HIGH**
* **Exploitability:** Medium (requires access to repository or decompiled bundles).
* **Exploit Path:**
  The JWT validation secret has a hardcoded default fallback:
  ```javascript
  const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'jaheez-admin-jwt-2024-secret';
  ```
  If the administrator fails to set `ADMIN_JWT_SECRET` in their production environment, any attacker can forge JWT tokens with `kind: 'admin'` and `role: 'super_admin'`, gaining complete control of the backend.
* **Fix:** Remove the hardcoded fallback. Force the server process to crash on boot-up if `ADMIN_JWT_SECRET` is undefined:
  ```javascript
  if (!process.env.ADMIN_JWT_SECRET) {
    console.error('FATAL: ADMIN_JWT_SECRET is not configured!');
    process.exit(1);
  }
  ```

---

### VULN-004: Insecure Storage of Auth Tokens in AsyncStorage
* **Location:** [supabase.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/lib/supabase.ts)
* **Severity:** **MEDIUM**
* **Exploitability:** Medium (requires physical device access or local backup exploits).
* **Exploit Path:**
  The Supabase client stores session JWTs in unencrypted AsyncStorage:
  ```typescript
  export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { storage: AsyncStorage, ... }
  });
  ```
  On rooted or compromised devices, third-party apps can dump AsyncStorage contents and hijack user sessions.
* **Fix:** Migrate Supabase session storage to `expo-secure-store` or a secure keychain wrapper for mobile platforms.
