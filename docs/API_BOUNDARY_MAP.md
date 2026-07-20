# API BOUNDARY MAP

This document maps out the backend API boundaries, defining the routing, payload validation, authentication, and responses for the newly hardened secure endpoints.

---

## 1. Secure Endpoints Overview

| Method | Route | Auth Required | Description |
|---|---|---|---|
| `POST` | `/admin-api/v1/checkout` | Supabase User JWT | Securely validates, calculates, and inserts a store or custom order inside a transaction. |
| `POST` | `/admin-api/v1/orders/:id/cancel` | Supabase User JWT | Securely cancels an order (replaces client-side status update). |
| `POST` | `/admin-api/v1/orders/:id/complete` | Supabase User JWT | Securely completes an order (replaces client-side status update). |

---

## 2. API Specifications

### 2.1 Checkout Endpoint (`POST /admin-api/v1/checkout`)

#### Request Headers:
- `Authorization`: `Bearer <supabase_user_jwt>` (Required)
- `Idempotency-Key`: `<uuid_v4>` (Required — protects against duplicate submissions)

#### Request Body Schema (Zod Validated):

For **Store Orders**:
```json
{
  "store_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "items": [
    {
      "menu_item_id": "c1a6d71b-3687-43b9-8c67-c5d985a97fa7",
      "quantity": 2,
      "notes": "No onions please"
    }
  ],
  "delivery_address": "حي المطار، آسفي",
  "delivery_lat": 32.2929,
  "delivery_lng": -9.2345,
  "payment_method": "cash",
  "notes": "Call me on arrival"
}
```

For **Custom / Errand Orders**:
```json
{
  "title": "Acheter médicaments",
  "description": "Doliprane 1000mg de la pharmacie",
  "category": "pharmacy",
  "service_type": "errand",
  "pickup_address": "صيدلية الهلال، آسفي",
  "pickup_lat": 32.3012,
  "pickup_lng": -9.2411,
  "delivery_address": "حي الكورس، آسفي",
  "delivery_lat": 32.2987,
  "delivery_lng": -9.2312,
  "payment_method": "cash"
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "order_id": "a9a3b610-d85c-4d56-829d-6c608b1ba260",
  "subtotal": 45.0,
  "delivery_fee": 10.0,
  "total_amount": 55.0,
  "status": "pending",
  "payment_status": "pending"
}
```

---

### 2.2 Cancel Order Endpoint (`POST /admin-api/v1/orders/:id/cancel`)

#### Request Headers:
- `Authorization`: `Bearer <supabase_user_jwt>` (Required)

#### Behavior:
1. Fetch order from database using `service_role`.
2. Check if the authenticated user's ID matches the order's `user_id`.
3. Check if status is either `pending` or `confirmed`.
4. If valid, update the order status to `cancelled`, set `cancelled_reason` or `cancelled_at = NOW()`.
5. Log status transition.

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Commande annulée avec succès",
  "status": "cancelled"
}
```

---

### 2.3 Complete Order Endpoint (`POST /admin-api/v1/orders/:id/complete`)

#### Request Headers:
- `Authorization`: `Bearer <supabase_user_jwt>` (Required)

#### Behavior:
1. Fetch order from database using `service_role`.
2. Check if the authenticated user's ID matches the order's `user_id`.
3. Check if status is `delivered`.
4. If valid, update the order status to `completed`.
5. Log status transition.

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Commande complétée avec succès",
  "status": "completed"
}
```
