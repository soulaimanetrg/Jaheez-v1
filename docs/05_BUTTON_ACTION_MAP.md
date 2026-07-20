# 5. BUTTON AND ACTION MAP — JAHEEZ

**Purpose:** Document every important button/action and its behavior | **Last Updated:** 2026-05-19

---

## Authentication Flow Actions

| Button Label | Screen | Icon | Visual Style | Enabled If | Disabled If | Press Behavior |
|---|---|---|---|---|---|---|
| **Get Started** | Welcome | Arrow right | Primary Red, 52px | Always | Never | → Onboarding |
| **Skip** | Welcome, Onboarding | - | Text link, blue | Always | Never | → Login |
| **Next** | Onboarding | Arrow right | Primary Red | Has next slide | Last slide | Advance carousel |
| **LOGIN** | Login | - | Primary Red, 52px | Form valid | Form invalid | Call `supabase.auth.signInWithOtp()` (sends email OTP), → OTP |
| **Google Sign In** | Login | Google logo | White border | Always | Network fail | Call `supabase.auth.signInWithOAuth()`, → Home |
| **Create account?** | Login | - | Text link, red | Always | Never | → Register |
| **Forgot password?** | Login | - | Text link, gray | Always | Never | → Forgot Password flow |
| **CREATE ACCOUNT** | Register | - | Primary Red, 52px | All fields valid | Invalid fields | Call `supabase.auth.signUp()`, then send OTP, → OTP |
| **Sign in?** | Register | - | Text link | Always | Never | → Login |
| **VERIFY** | OTP | - | Primary Red, 52px | 6 digits filled | <6 digits | Call `supabase.auth.verifyOtp()` (type: 'signup' or 'recovery'), → Home |
| **RESEND** | OTP | - | Gray text (enabled after 60s) | >60s elapsed | <60s elapsed | Call `supabase.auth.signInWithOtp()`, restart 60s timer |
| **BACK** | OTP, etc. | Back arrow | Text link | Always | Never | Go back to previous screen |

---

## Navigation & Browsing Actions

| Button Label | Screen | Icon | Behavior | Destination |
|---|---|---|---|---|
| **Search icon** | Home | 🔍 | Open search input | (tabs)/search |
| **Notifications bell** | Home | 🔔 | Show notification count | (flows)/notifications |
| **Service card (Food)** | Home | 🍕 | Filter stores by category | (flows)/category/food |
| **Service card (Grocery)** | Home | 🛒 | Filter stores by category | (flows)/category/grocery |
| **Service card (Pharmacy)** | Home | 💊 | Filter stores by category | (flows)/category/pharmacy |
| **Service card (Parcel)** | Home | 📦 | Filter stores by category | (flows)/category/parcel |
| **Service card (Errand)** | Home | 🎯 | Filter stores by category | (flows)/category/errand |
| **Store card** | Home, Search | Tap anywhere | Open store detail | (flows)/store/[id] |
| **Heart icon (Favorite)** | Home, Search, Store | ❤️ | Add/remove favorite | Toggle + local state save |
| **Promo banner** | Home | Tap | Show promo details | (flows)/promo/[id] or apply code |
| **Category filter** | Search | Tap | Toggle category filter | Re-filter results locally |
| **Rating filter** | Search | Tap | Select rating threshold | Re-filter results locally |
| **Sort dropdown** | Search | ▼ | Select sort order | Re-sort results locally |
| **Reset filters [X]** | Search | X | Clear all filters | Show all stores |
| **Tab: Active** | Orders | - | Show active orders | Switch tab |
| **Tab: Completed** | Orders | - | Show completed orders | Switch tab |
| **Tab: Cancelled** | Orders | - | Show cancelled orders | Switch tab |
| **Order card** | Orders | Tap | Open order detail | (flows)/order/[id] |
| **REORDER** | Orders | Button | Add items to new cart | → (flows)/cart |

---

## Store & Menu Actions

| Button | Screen | Behavior | Notes |
|---|---|---|---|
| **Back arrow** | Store detail | Navigate back | Preserve cart |
| **Heart (Favorite)** | Store detail | Toggle favorite | Save to `favoritesStore` |
| **CALL** | Store detail | Initiate phone call | Use `tel:` deep link |
| **WHATSAPP** | Store detail | Open WhatsApp chat | Use `whatsapp://` deep link |
| **Category tab** | Store detail | Switch menu category | Smooth horizontal scroll |
| **+ button (on item)** | Store detail, Menu | Add to cart | Show quantity picker or +1 |
| **"Add to Cart" button** | Store detail | Add item (qty > 0) | Close picker, show toast |
| **Item name** | Store detail | Show details | Expand description/options |

---

## Cart Actions

| Button | Screen | Behavior | Impact |
|---|---|---|---|
| **- (decrease qty)** | Cart | Decrease quantity by 1 | Minimum 1, then show remove |
| **+ (increase qty)** | Cart | Increase quantity by 1 | Update subtotal in real-time |
| **Remove** | Cart | Delete item from cart | Recalculate totals |
| **ADD MORE ITEMS** | Cart | Return to store menu | Keep cart, navigate back |
| **APPLY (promo)** | Cart | Validate code, apply discount | Call backend, show error/success |
| **PROCEED TO CHECKOUT** | Cart | Go to address + payment | Pass cart data via route params |
| **CONTINUE SHOPPING** | Cart | Go back to store | Preserve cart |

---

## Checkout Actions

| Button | Screen | Behavior | Backend Impact |
|---|---|---|---|
| **Address selector** | Checkout | Open saved addresses or create new | SELECT address |
| **Add address** | Checkout | Navigate to new address form | INSERT INTO user_addresses |
| **Edit address** | Checkout | Modify existing address | UPDATE user_addresses |
| **Payment method radio** | Checkout | Select cash / card / wallet | UPDATE checkout state |
| **Special instructions input** | Checkout | Add delivery notes | Store in order notes |
| **Apply wallet balance** | Checkout | Use wallet credit | Deduct from total |
| **CONFIRM ORDER** | Checkout | Submit order to backend (status 'order_received') | INSERT INTO orders with payment_method='COD' |

---

## Order Tracking Actions

| Button | Screen | Behavior | Result |
|---|---|---|---|
| **Live map** | Tracking | Show status timeline stepper (V1) | Pull/subscribe order status from Supabase (Live Map deferred) |
| **CALL driver** | Tracking | Initiate call | `tel:` link to driver phone |
| **MESSAGE driver** | Tracking | Open in-order chat | Navigate to (flows)/chat/[id] |
| **CONTACT SUPPORT** | Tracking | Open WhatsApp Business link manually | Open `https://wa.me/212xxxxxxxxx` (V1 Manual ops) |
| **RATE ORDER** | Tracking (post-delivery) | Open rating form | INSERT INTO reviews |

---

## Profile & Settings Actions

| Button | Screen | Behavior | Action |
|---|---|---|---|
| **EDIT PROFILE** | Profile | Go to edit form | Navigate to (flows)/profile-edit |
| **Edit name** | Edit Profile | Modify full name | UPDATE users.full_name |
| **Change avatar** | Edit Profile | Upload new profile pic | Call image picker, upload to Supabase Storage |
| **Change city** | Edit Profile | Select new city | UPDATE users.city |
| **Change language** | Profile | Select AR/FR/EN | UPDATE `languageStore`, refresh UI |
| **VIEW ALL addresses** | Profile | Show all saved addresses | Navigate to (flows)/addresses |
| **ADD NEW ADDRESS** | Profile, Addresses | Create new delivery address | Navigate to (flows)/addresses in "add mode" |
| **Edit address** | Addresses | Modify saved address | Open form with pre-filled data |
| **Delete address** | Addresses | Remove address | Confirm dialog, DELETE FROM user_addresses |
| **Set as default** | Addresses | Make default delivery | UPDATE user_addresses.is_default |
| **Notifications toggle** | Settings | Enable/disable push | UPDATE users.notification_enabled |
| **Notifications detail** | Settings | Configure push types | UPDATE users.notif_orders, notif_promos, etc. |
| **VIEW FAVORITES** | Profile | Show all saved stores | Navigate to (flows)/favorites |
| **Remove favorite** | Favorites | Unsave store | DELETE FROM user_favorites |
| **SUPPORT & FAQ** | Settings | Open WhatsApp Business link manually | Open `https://wa.me/212xxxxxxxxx` (V1 manual help) |
| **TERMS & PRIVACY** | Settings | View legal docs | Navigate to (flows)/terms |
| **DELETE ACCOUNT** | Profile | Permanently delete account | Show 2-step confirmation, call `authApi.deleteAccount()` |
| **LOGOUT** | Profile | Sign out | Show confirmation, call `authApi.logout()`, clear auth store, → Login |

---

## Admin Panel Actions

| Button | Screen | Behavior | API Call |
|---|---|---|---|
| **LOGIN (admin)** | Admin login | Sign in as admin | POST /admin-api/auth/login |
| **View Orders** | Admin dashboard | Navigate to orders page | GET /orders (with filters) |
| **Order status dropdown** | Admin orders | Change order status | PATCH /orders/[id]/status |
| **Refund order** | Admin orders | Initiate refund | POST /orders/[id]/refund |
| **Cancel order** | Admin orders | Cancel delivery | PATCH /orders/[id]/cancel |
| **View Stores** | Admin dashboard | Navigate to stores | GET /stores |
| **Create store** | Admin stores | Add new store | POST /stores |
| **Edit store** | Admin stores | Modify store details | PATCH /stores/[id] |
| **Toggle store online** | Admin stores | Open/close store | PATCH /stores/[id]/is_open |
| **View Drivers** | Admin dashboard | Navigate to drivers | GET /drivers |
| **Verify driver** | Admin drivers | Approve driver onboarding | PATCH /drivers/[id]/is_verified |
| **View Payouts** | Admin dashboard | Navigate to payout requests | GET /payout_requests |
| **Approve payout** | Admin payouts | Process withdrawal | POST /payout_requests/[id]/approve |
| **Reject payout** | Admin payouts | Decline withdrawal | POST /payout_requests/[id]/reject |
| **View Support** | Admin dashboard | Navigate to support tickets | GET /support_requests |
| **Reply to ticket** | Admin support | Send response | POST /support_requests/[id]/reply |
| **Close ticket** | Admin support | Mark resolved | PATCH /support_requests/[id]/status |
| **View Analytics** | Admin dashboard | Show charts | GET /analytics (various metrics) |
| **Download report** | Admin analytics | Export data | GET /analytics/export?format=csv |

---

## Loading & Error Behaviors

### Loading States (When Button is Pressed)
- **Button appearance:** Opacity 0.6, cursor: not-allowed
- **Visual indicator:** Spinner icon or animated dots
- **Disabled input:** Inputs become read-only
- **Timeout:** Show error if >30 seconds

### Success States
- **Toast message:** Position bottom-center, auto-dismiss (3-5s)
- **Visual feedback:** Success icon, green text color
- **Navigation:** Auto-navigate if applicable
- **Data refresh:** Reload affected data

### Error States
- **Toast message:** Red text, error icon, dismissible
- **Inline error:** Field-specific errors below input
- **Retry button:** Allow retrying failed action
- **Details:** Show error message if < 100 chars

---

## Accessibility Requirements for All Buttons

| Requirement | Implementation |
|---|---|
| **accessibilityLabel** | Every Pressable must have semantic label |
| **accessibilityRole** | "button" for buttons, "link" for navigation |
| **accessibilityState** | disabled: true when disabled |
| **Min tap target** | 44x44 pixels (JAHEEZ SIZE.TOUCH_MIN) |
| **Color contrast** | WCAG AA minimum (4.5:1 for text) |
| **Focus indicator** | Visible focus ring on web (CSS :focus) |

---

## Gesture Actions

| Gesture | Screen | Action | Result |
|---|---|---|---|
| **Swipe left** | Onboarding | Next slide | Advance carousel |
| **Swipe right** | Onboarding | Previous slide | Go back slide |
| **Pull to refresh** | Home, Search, Orders | Reload data | Fetch fresh data from API |
| **Scroll down** | Any scrollable | Load more | Infinite scroll pagination |
| **Long press (on store)** | Home, Search | Show menu | Quick preview or options |
| **Double tap (heart)** | Store list | Like/unlike | Add/remove favorite |

---

## Validation Rules

### Phone Field
- Format: +2126XXXXXXXX (9 digits after +212)
- Error: "Invalid phone format. Use +212..."
- Duplicate check: "This phone is already registered"

### Email Field
- Format: standard email regex
- Error: "Please enter a valid email address"
- Duplicate check: "Email already in use"

### Password Field
- Min 8 characters
- Must include 1 uppercase letter
- Must include 1 number
- Error: "Password must be 8+ chars with uppercase and number"

### Full Name Field
- Min 2 characters, max 100
- Reject pure numbers/symbols
- Error: "Please enter a valid name"

### OTP Field
- Must be exactly 6 digits
- Auto-advance to next box on digit entry
- Auto-focus first box on screen load

### Promo Code Field
- Alphanumeric, max 20 chars
- Case-insensitive (normalize to uppercase)
- Backend validation required
- Error: "Invalid code", "Expired", "Already used", etc.

### Address Field
- Min 5 characters
- Max 200 characters
- Required field

---

**Created:** 2026-05-19 | **Method:** Code inspection + design specification review | **Confidence:** High
