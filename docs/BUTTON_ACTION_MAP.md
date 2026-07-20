# BUTTON ACTION MAP

> Generated: 2026-05-19 | Core buttons/actions with behavior specs

---

## Auth Buttons

| Button | Screen | Behavior | Navigation | API/DB |
|--------|--------|----------|------------|--------|
| **Start Now** | Onboarding | Sets `hasCompletedOnboarding=true` in authStore | → welcome | None (local state only) |
| **Skip Onboarding** | Onboarding | Same as Start Now | → welcome | None |
| **Login** | Welcome | Navigate to login screen | → login | None |
| **Create Account** | Welcome | Navigate to register screen | → register | None |
| **Continue as Guest** | Welcome | Creates anonymous Supabase session, sets demo user | → (tabs) | Supabase auth.signInAnonymously() |
| **Sign In (تسجيل الدخول)** | Login | Disabled until phone+password valid. Shows spinner. Calls `authApi.login()` | Success → OTP or (tabs) | Supabase auth.signInWithPassword(); DB: auth.users |
| **Demo Login** | Login | Bypasses auth, creates mock user in authStore | → (tabs) | No real API call |
| **Forgot Password** | Login | ⚠️ Link exists but no target screen found | → ? | ❌ Not implemented |
| **Create Account (إنشاء الحساب)** | Register | Disabled until all fields valid. Spinner on submit. | Success → OTP | Supabase auth.signUp(); DB: auth.users, users |
| **Verify OTP (تحقق)** | OTP | Disabled until 4+ digits. Calls Infobip verify. | Success → (tabs) | Infobip SMS verify; DB: auth.users verification |
| **Resend Code** | OTP | Appears after 60s timer. Re-sends SMS. | Stays on OTP | Infobip send OTP |

## Home Buttons

| Button | Screen | Behavior | Navigation | API/DB |
|--------|--------|----------|------------|--------|
| **Service Tile (Food)** | Home | Navigates to food category listing | → category/food | None |
| **Service Tile (Grocery)** | Home | Navigates to grocery category | → category/grocery | None |
| **Service Tile (Pharmacy)** | Home | Navigates to pharmacy category | → category/pharmacy | None |
| **Service Tile (Parcel)** | Home | Navigates to parcel category | → category/parcel | None |
| **Service Tile (Errand)** | Home | Navigates to custom errand form | → custom-request | None |
| **Store Card** | Home | Opens store details | → store/[id] | None |
| **See All** | Home | Shows full store listing | → category or search | None |
| **Promo Banner** | Home | Action depends on banner config (store/category/external) | Variable | None |
| **Track Order** | Home (active card) | Opens tracking for current order | → tracking/[id] | None |
| **Search Bar** | Home | Focuses search on search tab | → search | None |

## Store & Cart Buttons

| Button | Screen | Behavior | Navigation | API/DB |
|--------|--------|----------|------------|--------|
| **Add to Cart** | Store Details | Adds item to cartStore. If different store, clears cart first (with confirmation). | Stays on store | cartStore.addItem(); No API |
| **Favorite Toggle** | Store Details | Toggles store favorite. Heart icon fills/unfills. | Stays | Supabase favorites table |
| **Cart FAB** | Store Details | Shows item count badge. Navigates to cart. | → cart | None |
| **+ Quantity** | Cart | Increments item quantity by 1 | Stays | cartStore.updateQuantity() |
| **- Quantity** | Cart | Decrements. If reaches 0, removes item. | Stays | cartStore.updateQuantity() |
| **Remove Item** | Cart | Removes item from cart | Stays | cartStore.removeItem() |
| **Apply Promo** | Cart/Checkout | Validates promo code via API, applies discount | Stays | promoApi; DB: promo_codes |
| **Clear Cart** | Cart | Confirmation dialog → clears all items | Stays (empty state) | cartStore.clearCart() |
| **Proceed to Checkout** | Cart | Disabled if cart empty | → checkout | None |
| **Place Order** | Checkout | Disabled until address+payment valid. Spinner. Creates order. | → confirmation | orderApi.createOrder(); DB: orders, order_items |
| **Cancel Order** | Tracking/Order Details | Confirmation dialog with reason input. Only if status allows. | Stays or → orders | api.cancelOrder(); DB: orders.status→cancelled |
| **Confirm Delivery** | Tracking | Marks order as completed | Stays → success state | api.confirmDelivery(); DB: orders.status→completed |

## Profile & Settings Buttons

| Button | Screen | Behavior | Navigation | API/DB |
|--------|--------|----------|------------|--------|
| **Edit Profile** | Profile | Opens profile editor | → profile-edit | None |
| **Save Profile** | Profile Edit | Disabled until changes exist. Updates profile. | ← profile | Supabase users.update() |
| **Change Avatar** | Profile Edit | Opens image picker, uploads to Supabase Storage | Stays | expo-image-picker; Supabase storage |
| **Add Address** | Addresses | Opens address form | Stays (modal/form) | Supabase user_addresses.insert() |
| **Edit Address** | Addresses | Pre-fills form with existing data | Stays | Supabase user_addresses.update() |
| **Delete Address** | Addresses | Confirmation dialog then deletes | Stays | Supabase user_addresses.delete() |
| **Set Default Address** | Addresses | Toggles default flag | Stays | Supabase user_addresses.update() |
| **Change Language** | Settings | Opens language picker (ar/fr/en) | Stays | languageStore.setLang(); AsyncStorage persist |
| **Toggle Push Notifications** | Settings | Enables/disables push | Stays | Supabase users.update(notification_enabled) |
| **Toggle Order Updates** | Settings | Enables/disables order-specific notifs | Stays | Supabase users.update(notif_orders) |
| **Toggle Promo Notifications** | Settings | Enables/disables promo notifs | Stays | Supabase users.update(notif_promos) |
| **Toggle Location Sharing** | Settings | Enables/disables location | Stays | Supabase users.update(location_share) |
| **Open FAQ** | Settings/Profile | Opens FAQ accordion | → faq | None |
| **Open Terms** | Settings | Opens terms page | → terms | None |
| **Submit Support Ticket** | Support Ticket | Validates form, submits to API | Success: toast + ← | Supabase support_requests.insert() |
| **Logout** | Settings/Profile | Confirmation dialog. Clears auth state, signs out Supabase. | → welcome | Supabase auth.signOut(); authStore.logout() |
| **Delete Account** | Settings→Delete Account | Multi-step confirmation, requires typing "حذف". Soft-deletes account. | → welcome | API soft-delete; DB: users.deleted_at |
| **Contact WhatsApp** | Various | Opens WhatsApp with pre-filled message | External: WhatsApp app | None |
| **Call Support** | Various | Opens phone dialer | External: Phone app | None |
