# 6. FORM AND VALIDATION SPEC — JAHEEZ

**Purpose:** Document every form and its validation rules | **Last Updated:** 2026-05-19

---

## FORM 1: Login Form

**Location:** `user-app/app/(auth)/login.tsx`  
**Submit button:** "LOGIN" (primary red, 52px height)

### Fields

| Field | Type | Label | Placeholder | Required | Validation | Error Message |
|---|---|---|---|---|---|---|
| **Phone or Email** | Text | "Phone or Email" | "+212 6 XX XXX XXXX" | Yes | Must be valid phone (+212XXXXXXXXX) OR valid email | "Invalid phone format or email" |
| **Password** | Password | "Password" | "••••••••••" | Yes | Min 8 chars | "Password required" |
| **Remember Me** | Checkbox | "Remember me" | - | No | - | - |

### Validation Rules
1. At least one field (phone OR email) must be filled and valid
2. Password must be exactly what was used at registration
3. Backend returns: "Incorrect credentials" if no match

### Submit Behavior
- Disabled until: phone/email valid AND password filled
- Loading state: Spinner in button, dim inputs
- Success: Navigate to OTP screen (if SMS required) or (tabs) home
- Error: Show inline red error below password field + shake animation

### Data Saved
- `localStorage`: "rememberMe" flag (if checkbox checked)
- `authStore`: setUser(), setAuthenticated(true)
- `AsyncStorage`: Zustand persist middleware saves auth state

### API Endpoint
- **POST** `/auth/login`  
- Payload: `{ phone?: string, email?: string, password: string }`
- Response: `{ user: User, session: AuthSession, otp_required?: boolean }`

---

## FORM 2: Registration Form

**Location:** `user-app/app/(auth)/register.tsx`  
**Submit button:** "CREATE ACCOUNT"

### Fields

| Field | Type | Label | Placeholder | Required | Validation | Error |
|---|---|---|---|---|---|---|
| **Full Name** | Text | "Full Name" | "John Doe" | Yes | Min 2 chars, max 100, reject pure numbers | "Invalid name" |
| **Phone** | Text | "Phone" | "+212 6 XX XXX XXXX" | Yes | Valid Moroccan +212 format | "Invalid phone format" |
| **Password** | Password | "Password" | "••••••••" | Yes | Min 8, 1 uppercase, 1 number | "8+ chars, uppercase, number" |
| **Confirm Password** | Password | "Confirm" | "••••••••" | Yes | Must match password | "Passwords don't match" |
| **City** | Select | "City" | "Select City" | Yes | One of: [Safi, Casablanca, Fes, Marrakech, Agadir] | "Please select a city" |
| **Terms Checkbox** | Checkbox | "I agree to Terms" | - | Yes | Must be checked | "You must agree to continue" |

### Validation Rules
1. Full name: 2-100 chars, no pure numbers/symbols
2. Phone: Moroccan format, not already registered
3. Password: 8+ chars, 1+ uppercase, 1+ number
4. Confirm: Exactly matches password
5. City: One of valid Moroccan cities
6. Terms: Must be checked (boolean true)

### Submit Behavior
- Disabled until: All fields valid AND terms checked
- Loading state: Spinner, disable all inputs
- Success: Show toast "Account created!", navigate to OTP screen
- Error: Inline errors below each field (red text)

### Data Saved
- Backend creates user account via Supabase Auth
- `users` table: inserts new record with phone, full_name, city
- Sets `pendingPhone` in auth store for OTP verification

### API Endpoint
- **POST** `/auth/register`  
- Payload: `{ full_name: string, phone: string, password: string, city: string, email?: string }`
- Response: `{ user: User, pending_otp: boolean, session?: AuthSession }`

---

## FORM 3: OTP Verification Form

**Location:** `user-app/app/(auth)/otp.tsx`  
**Submit button:** "VERIFY"

### Fields

| Field | Type | Label | Format | Required | Validation | Error |
|---|---|---|---|---|---|---|
| **OTP** | OTP Input (6 boxes) | "6-digit code" | `[D][D][D][D][D][D]` | Yes | Exactly 6 numeric digits | "Enter 6-digit code" |

### Validation Rules
1. All 6 boxes must be filled with digits (0-9)
2. Auto-advance to next box on digit entry
3. Backspace deletes digit and moves to previous box
4. Paste 6-digit string distributes across boxes

### Submit Behavior
- Disabled until: All 6 digits filled
- Loading state: Spinner in button
- Success: Show toast "Email verified!", navigate to (tabs) home
- Error: Shake animation, red error "Invalid or expired code"

### Resend Behavior
- Initially disabled for 60 seconds (countdown timer shown)
- After 60s: Button becomes enabled
- On click: Calls `supabase.auth.signInWithOtp({ email })`, disables for another 60s
- Max attempts: 5 (if exceeded, show "Too many attempts, try again later")

### Data Saved
- `authStore`: setUser(), setAuthenticated(true)
- `AsyncStorage`: Zustand persist saves state

### API Endpoints
- **POST** (client-side library call): `supabase.auth.verifyOtp({ email, token, type: 'signup' | 'recovery' })`
- **POST** (client-side library call): `supabase.auth.signInWithOtp({ email })` for resending OTP code.

---

## FORM 4: Edit Profile Form

**Location:** `user-app/app/(flows)/profile-edit.tsx`  
**Submit button:** "SAVE CHANGES"

### Fields

| Field | Type | Label | Current Value | Required | Editable | Validation |
|---|---|---|---|---|---|---|
| **Full Name** | Text | "Full Name" | Populated | Yes | Yes | Min 2 chars, max 100 |
| **Email** | Email | "Email" | Populated | No | Yes | Valid email or empty |
| **Phone** | Display | "Phone" | Populated | - | No | Read-only (can't change via UI) |
| **Avatar** | Image | "Profile Photo" | Current image | No | Yes | Image < 5MB, dimensions 300x300+ |
| **City** | Select | "City" | Populated | Yes | Yes | One of valid cities |
| **Language** | Radio | "Preferred Language" | Populated | Yes | Yes | AR / FR / EN |

### Validation Rules
1. Full name: 2-100 chars
2. Email: Valid format or empty (optional)
3. Avatar: JPEG/PNG, <5MB, square aspect ratio
4. City: Valid city from list
5. Language: One of three options

### Dirty State Detection
- Track initial values vs current values
- Show "Save Changes" only if changes exist
- Show "Cancel" button to discard changes
- Warn if back pressed with unsaved changes: "Discard unsaved changes?"

### Submit Behavior
- Disabled until: Changes made AND form valid
- Loading state: Spinner in button
- Success: Update `profileStore`, show toast "Profile updated!"
- Error: Show inline error for failing field

### Data Saved
- **UPDATE** `users` table (name, email, city, language)
- **UPLOAD** avatar image to Supabase Storage (`/avatars/[user_id].[ext]`)
- `profileStore`: updateProfile()

### API Endpoint
- **PATCH** `/users/profile`  
- Payload: `{ full_name?: string, email?: string, city?: string, language?: string, avatar_file?: File }`
- Response: `{ user: User }`

---

## FORM 5: Add/Edit Address Form

**Location:** `user-app/app/(flows)/addresses.tsx`  
**Submit button:** "SAVE ADDRESS"

### Fields

| Field | Type | Label | Placeholder | Required | Validation | Error |
|---|---|---|---|---|---|---|
| **Label** | Text | "Address Label" | "Home" | Yes | Min 2, max 30 chars | "Label required" |
| **Address** | Text | "Full Address" | "123 Main Street, near Cafe Paris, 2nd Floor, Safi" | Yes | Min 15, max 200 chars (Must include landmarks/building details for drivers) | "Address must be at least 15 characters and describe landmarks/building" |
| **Latitude** | Hidden | - | - | No | Valid decimal (-90 to 90) | - |
| **Longitude** | Hidden | - | - | No | Valid decimal (-180 to 180) | - |
| **Set as Default** | Checkbox | "Set as default delivery" | - | No | - | - |

### Validation Rules
1. Label: 2-30 chars (e.g., "Home", "Work", "Parents' House")
2. Address: **Strict min 15 chars** to force users to enter descriptive directions (landmarks, building number, apartment number, color of gate, etc.) since live maps are disabled in V1.
3. Geo coordinates: Optional/Deferred (stored as null or standard Safi default in V1).
4. One address can be default (toggle off previous default if checked).

### Map Integration (V1 Deferred)
- Mini-map and coordinate pinning are disabled/hidden for V1. Address relies fully on descriptive text.

### Submit Behavior
- Disabled until: Label + Address valid
- Loading state: Spinner in button
- Success: Show toast "Address saved!", navigate back or show in list
- Error: Inline error message

### Data Saved
- **INSERT** or **UPDATE** `user_addresses` table
- If "Set as default" checked: Clear previous default, set this as default

### API Endpoint
- **POST** `/addresses` (create) or **PATCH** `/addresses/[id]` (update)  
- Payload: `{ label: string, address: string, lat?: number, lng?: number, is_default?: boolean }`
- Response: `{ address: UserAddress }`

---

## FORM 6: Checkout Form

**Location:** `user-app/app/(flows)/checkout.tsx`  
**Submit button:** "CONFIRM ORDER"

### Fields

| Field | Type | Label | Required | Options | Validation |
|---|---|---|---|---|---|
| **Delivery Address** | Select | "Delivery To" | Yes | [Saved addresses] or "Add new" | Must select or create |
| **Special Instructions** | Textarea | "Delivery Notes" | No | 0-200 chars | Max 200 chars |
| **Payment Method** | Radio | "Payment Method" | Yes | Cash on Delivery (COD) (Card / Wallet disabled in V1) | Must select Cash |
| **Apply Wallet Balance** | Toggle | "Use wallet credit" | No | Disabled in V1 | - |
| **Promo Code** | Text | "Promo code" | No | Already applied OR new code | Valid code or empty |

### Validation Rules
1. Address: Must be selected (not empty)
2. Special instructions: Max 200 chars
3. Payment method: **Must be Cash (COD)** in V1.
4. Wallet / Card: Options are disabled and visually grayed out/hidden in V1 UI.
5. Promo: Code must not be expired or already used by user.

### Address Selection Behavior
- Show list of saved addresses (default highlighted).
- "Add new address" button opens address form.
- Tap address to select.
- Show selected address highlighted or checked.

### Payment Method Behavior
- **Cash on Delivery (COD) Only (V1)**: Order confirmation text displays: "Cash on Delivery: Pay [Total Amount] DH to the driver upon delivery."
- **Card (Stripe) (V2)**: Disabled for V1.
- **Wallet (V2)**: Disabled for V1.

### Special Instructions
- Free-form text for driver (e.g., "Ring doorbell twice", "Leave at gate").
- Show char count (0/200).
- Error if >200 chars.

### Submit Behavior
- Disabled until: Address + Payment method selected
- Loading state: Spinner, disable all inputs
- Success: **CREATE order in database**, show toast "Order confirmed!", navigate to confirmation screen
- Error: Show inline errors or toast

### Data Saved
- **INSERT** into `orders` table:
  - user_id, store_id, delivery_address, delivery_lat, delivery_lng
  - payment_method, status (pending), notes
  - subtotal, delivery_fee, discount, total_amount
- **DEDUCT from wallet** if payment_method === 'wallet'
- **UPDATE cart**: Clear items after order created

### API Endpoint
- **POST** `/orders`  
- Payload: `{ store_id: UUID, items: OrderItem[], address_id?: UUID, address_custom?: string, payment_method: PaymentMethod, notes?: string, promo_code?: string, use_wallet?: boolean }`
- Response: `{ order: Order }`

---

## FORM 7: Support Ticket Form (V1 Manual WhatsApp Link)

**Location:** `user-app/app/(flows)/support-ticket.tsx`  
**Submit button:** "CONTACT ON WHATSAPP"

### V1 Simplification
Instead of building a database-backed support ticket system with attachments, V1 redirects users directly to manual operator chat.

### Fields (Pre-compiled into WhatsApp Message template)
- **Category:** User selects the type of issue (Delivery delay, payment error, app bug).
- **Description:** Text area to describe the problem.
- **Order ID:** Input (optional) to link the active order.

### Submit Behavior
- **Action:** Clicking "CONTACT ON WHATSAPP" opens the WhatsApp app with a pre-filled text query.
- **Deep Link Format:** `https://wa.me/212xxxxxxxxx?text=Hello%20Jaheez,%20I%20have%20an%20issue%20with%20category:%20[Category]%20for%20order:%20[OrderID].%20Details:%20[Description]`
- **No Attachments support:** User can upload photos directly in the WhatsApp chat window once redirected.
- **No API Endpoint needed:** Fully handled by deep-linking.

---

---

## FORM 8: Delete Account Confirmation

**Location:** `user-app/app/(flows)/delete-account.tsx`  
**Submit button:** "PERMANENTLY DELETE"

### Fields

| Field | Type | Label | Required | Validation |
|---|---|---|---|---|
| **Password** | Password | "Confirm your password" | Yes | Must match user's password |
| **Acknowledge** | Checkbox | "I understand all data will be deleted" | Yes | Must be checked |

### Validation Rules
1. Password: Must match current user's password (backend verification)
2. Checkbox: Must be checked to proceed

### Modal/Dialog
- Show warning: "Are you sure? This cannot be undone."
- Highlight destructive action in red
- Show what will be deleted: "All orders, addresses, favorites, messages"

### Submit Behavior
- Disabled until: Both fields valid
- Loading state: Spinner
- Success: Delete user account (soft delete or hard delete per policy), logout user, show message "Account deleted", navigate to login
- Error: Show "Password incorrect" or other errors

### Data Deleted
- User account marked as deleted or soft-deleted
- Data retention: Check GDPR compliance (may need to keep for audit log)
- Email confirmation sent to user

### API Endpoint
- **POST** `/users/delete-account`  
- Payload: `{ password: string }`
- Response: `{ success: boolean }`

---

## Admin Forms (Brief Overview)

| Form | Fields | Submit Endpoint | Notes |
|---|---|---|---|---|
| **Admin Login** | Email, Password | POST /admin-api/auth/login | JWT-based |
| **Create Store** | Name (AR), Category, Address, Phone, Hours | POST /stores | Admin only |
| **Manage Order Status** | Status dropdown, Reason textarea | PATCH /orders/[id]/status | Admin only |
| **Create Promo** | Code, Discount %, Min order, Expiry | POST /promotions | Admin only |
| **Verify Driver** | ID verification docs, Approve/Reject | PATCH /drivers/[id] | Admin only |

---

**Created:** 2026-05-19 | **Method:** Form inspection + spec review | **Confidence:** High
