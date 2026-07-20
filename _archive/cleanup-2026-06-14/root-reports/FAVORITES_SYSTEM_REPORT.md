# FAVORITES SYSTEM REPORT

## Architecture Overview

To provide a cleaner, premium user experience, the favorites feature is strictly divided into two independent structures: **Favorite Stores** (to save and browse restaurants) and **Favorite Products** (to quickly bookmark and reorder specific dishes, drinks, or plates).

---

## Database Schema Design

A dedicated table `favorite_products` handles product favoriting atomically.

### 1. Table Schema
*   **Table Name:** `public.favorite_products`
*   **Columns:**
    *   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    *   `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
    *   `menu_item_id`: `UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE`
    *   `created_at`: `TIMESTAMPTZ DEFAULT now()`
*   **Constraints:**
    *   Unique constraint on `(user_id, menu_item_id)` to prevent duplicate entries.

### 2. Row-Level Security (RLS)
*   Direct client mutations are **disabled**.
*   `SELECT` policy restricts read access to the owner:
    ```sql
    CREATE POLICY "favorite_products_read" ON public.favorite_products
      FOR SELECT USING (user_id = auth.uid());
    ```
*   All insertions and deletions are restricted to the secure backend server client.

---

## Backend REST API Endpoints

All favorites endpoints require JWT authentication and are mounted under `/admin-api`:

*   **`POST /v1/customer/favorites/products/toggle`**
    *   Toggles the favorited state for a `menu_item_id`.
    *   *Controller:* `CustomerController.toggleFavoriteProduct`
    *   *Service:* `CustomerService.toggleFavoriteProduct`
*   **`GET /v1/customer/favorites/products`**
    *   Returns the list of products favorited by the authenticated user.
    *   *Controller:* `CustomerController.listFavoriteProducts`
*   **`GET /v1/customer/favorites/stores`**
    *   Returns the list of stores favorited by the authenticated user.
    *   *Controller:* `CustomerController.listFavoriteStores`

---

## User Mobile App UX Implementation

*   **Split UI Tabs:** The favorites screen ([favorites.tsx](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/app/(flows)/favorites.tsx)) renders a header tab switcher: **Stores** and **Products**.
*   **Reordering Path:** Tapping a favorited product immediately redirects the customer to that store's detail page (`/store/[id]`), allowing them to configure and add it to their cart.

---

## Risk & Validation Audit

### 1. Desync Risk (`DESYNC RISK`)
*   **Assessment:** If a menu item is deleted from the restaurant panel, does the favorite reference break?
*   **Status:** **CLEARED**. The database schema applies `ON DELETE CASCADE` constraints on the foreign key references, cleaning up favorite entries automatically.

### 2. Architecture Violation (`ARCHITECTURE VIOLATION`)
*   **Assessment:** Check if the React Native app performs direct Supabase inserts on favorites.
*   **Status:** **CLEARED**. The app uses `backendJson` POST calls to toggle and retrieve favorites, preserving the backend MVC boundary.

### 3. Security Violation (`SECURITY VIOLATION`)
*   **Assessment:** Ensure a client cannot view or toggle favorites belonging to another user.
*   **Status:** **CLEARED**. The backend service resolves the customer's identity directly from the verified JWT payload (`req.supabaseUser.id`).
