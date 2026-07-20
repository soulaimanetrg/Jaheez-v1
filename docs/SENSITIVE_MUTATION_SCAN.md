# SENSITIVE MUTATION SCAN
**Prepared by: Technical Security Architect**  
**Project:** JAHEEZ (Safi Launch)  
**Status:** Audit Completed — Mutations Located

---

## 1. DIRECT CLIENT ORDERS MUTATIONS (CRITICAL WRITE RISK)

The customer application makes direct writes to the Supabase database for creating orders, which allows clients to control critical financial parameters (like payment status and delivery fees) bypassing the server layer.

### 1.1 Store Order Creation
* **File:** [user-app/lib/orderApi.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/lib/orderApi.ts#L96)
* **Code Block:**
  ```typescript
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: order.user_id,
      store_id: order.store_id,
      delivery_address: order.delivery_address,
      delivery_lat: order.delivery_lat ?? null,
      delivery_lng: order.delivery_lng ?? null,
      notes: order.notes ?? null,
      subtotal,
      delivery_fee,
      total_amount,
      status: 'pending',
      payment_status,
      payment_method,
      stripe_payment_intent_id: order.stripe_payment_intent_id ?? null,
    })
  ```
* **Risk:** The client passes calculated totals (`subtotal`, `delivery_fee`, `total_amount`) and payment states (`payment_status`) directly. An attacker can intercept this insert query and set arbitrary prices or mark orders as `paid` without paying.

### 1.2 Store Order Items Insertion
* **File:** [user-app/lib/orderApi.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/lib/orderApi.ts#L126)
* **Code Block:**
  ```typescript
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
  ```
* **Risk:** Order items are written client-side. If the second query fails, the database is left with an orphaned order header with zero items (no transaction rollback).

### 1.3 Custom Errand/Parcel Order Creation
* **File:** [user-app/lib/orderApi.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/lib/orderApi.ts#L172)
* **Code Block:**
  ```typescript
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id:          params.user_id,
      store_id:         null,
      delivery_address: params.dropoff_address,
      notes:            notesParts.join(' — '),
      subtotal:         0,
      delivery_fee:     1500,
      total_amount:     1500,
      status:           'pending',
      payment_status:   'pending',
      payment_method:   'cash',
    })
  ```

---

## 2. DIRECT CLIENT STATUS MUTATIONS (VERIFICATION BYPASS RISK)

The customer and driver applications update order statuses and user details directly, which exposes RLS rules to abuse.

### 2.1 Customer Cancel Order Mutation
* **File:** [user-app/lib/orderApi.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/lib/orderApi.ts#L140)
* **Code Block:**
  ```typescript
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .in('status', ['pending', 'confirmed']);
  ```
* **Risk:** Highly permissive RLS update policies allow the client to update the `status` column directly. An attacker can modify the query payload to set `status = 'delivered'` or `status = 'completed'` without driver confirmation.

### 2.2 Client User Settings Modifications
* **File:** [user-app/lib/authApi.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/lib/authApi.ts#L289)
* **Code Block:**
  ```typescript
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
  ```
* **Risk:** The client can pass arbitrary fields in `updates`. If the update payload includes the `role` field, they can escalate privileges to `admin` or `driver`.
