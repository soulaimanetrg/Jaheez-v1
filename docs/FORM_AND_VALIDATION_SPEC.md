# FORM AND VALIDATION SPEC

> Generated: 2026-05-19 | Source: `user-app/lib/schemas.ts` + screen inspection

---

## 1. Login Form (`loginSchema`)
| Field | Label | Placeholder | KB Type | Required | Validation | Error Message |
|-------|-------|-------------|---------|----------|------------|---------------|
| phone | رقم الهاتف | +212 600 000 000 | phone-pad | Yes | Regex: `(06|07)\d{8}` or `+212(6|7)\d{8}` | "رقم هاتف غير صحيح" |
| password | كلمة المرور | أدخل كلمة المرور | default (secure) | Yes | min 6 chars | "كلمة المرور يجب أن تكون 6 أحرف" |
- **Submit:** "تسجيل الدخول" RED button, disabled until both fields valid
- **Loading:** Button spinner
- **Success:** `authApi.login()` → auth state set → redirect to OTP or tabs
- **Failure:** Inline error text below form
- **API:** Supabase `auth.signInWithPassword({ phone, password })`
- **DB:** `auth.users`

## 2. Register Form (`registerSchema`)
| Field | Label | Placeholder | KB Type | Required | Validation | Error Message |
|-------|-------|-------------|---------|----------|------------|---------------|
| full_name | الاسم الكامل | — | default | Yes | min 2 chars | "الاسم يجب أن يكون حرفين" |
| phone | رقم الهاتف | +212 600 000 000 | phone-pad | Yes | Same as login | "رقم هاتف غير صحيح" |
| password | كلمة المرور | — | default (secure) | Yes | min 6 chars | "يجب أن تكون 6 أحرف" |
| confirmPassword | تأكيد كلمة المرور | — | default (secure) | Yes | Must match password | "كلمات المرور غير متطابقة" |
| city | المدينة | — | default | Optional | — | — |
- **Submit:** "إنشاء الحساب" RED button
- **Success:** `authApi.register()` → stores `pendingPhone` → navigates to OTP
- **API:** Supabase `auth.signUp()` with user_metadata `{ full_name, city }`
- **DB:** `auth.users` + trigger → `public.users` + trigger → `public.wallets`

## 3. OTP Form (`otpSchema`)
| Field | Label | Placeholder | KB Type | Required | Validation | Error Message |
|-------|-------|-------------|---------|----------|------------|---------------|
| code | رمز التحقق | — | number-pad | Yes | 4-6 digits, numbers only | "الرمز يجب أن يكون 4-6 أرقام" |
- **Submit:** "تحقق" RED button, disabled until 4+ digits
- **Timer:** 60s countdown, "إعادة إرسال الرمز" appears after
- **API:** `infobipOtp.verifyOtp({ phone, code })`

## 4. Profile Edit Form (`profileSchema`)
| Field | Label | Required | Validation | Error Message |
|-------|-------|----------|------------|---------------|
| full_name | الاسم الكامل | Yes | min 2 chars | "الاسم يجب أن يكون حرفين" |
| city | المدينة | Optional | — | — |
| avatar | (image) | Optional | Image picker → upload | — |
- **Submit:** "حفظ" RED button, disabled until changes detected (dirty state)
- **Back:** Confirmation if unsaved changes exist
- **API:** Supabase `users.update({ full_name, city })`, Storage upload for avatar
- **DB:** `public.users` (full_name, city, avatar_url)

## 5. Address Form (`addressSchema`)
| Field | Label | Required | Validation | Error Message |
|-------|-------|----------|------------|---------------|
| label | اسم العنوان | Yes | min 1 char | "اسم العنوان مطلوب" |
| address | العنوان | Yes | min 5 chars | "العنوان يجب أن يكون 5 أحرف" |
| notes | ملاحظات | Optional | — | — |
| lat/lng | (from map) | Implicit | Via map picker | — |
- **API:** Supabase `user_addresses.insert/update/delete()`
- **DB:** `public.user_addresses`

## 6. Checkout Form (`checkoutSchema`)
| Field | Label | Required | Validation | Error Message |
|-------|-------|----------|------------|---------------|
| delivery_address | عنوان التوصيل | Yes | min 3 chars | "عنوان التوصيل مطلوب" |
| notes | ملاحظات | Optional | max 200 chars | "200 حرف كحد أقصى" |
| promo_code | رمز الخصم | Optional | — | — |
| payment_method | طريقة الدفع | Yes | "cash" or "card" | — |
| time_slot | وقت التوصيل | Yes | default "في أقرب وقت" | — |
- **Submit:** "إرسال الطلب" RED button
- **API:** `orderApi.createOrder()`
- **DB:** `public.orders`, `public.order_items`

## 7. Support Ticket Form (`supportSchema`)
| Field | Label | Required | Validation | Error Message |
|-------|-------|----------|------------|---------------|
| subject | الموضوع | Yes | min 3 chars | "الموضوع مطلوب" |
| message | الرسالة | Yes | min 10, max 500 chars | "الرسالة يجب أن تكون 10 أحرف" |
| category | الفئة | Yes | enum: order/payment/driver/app/other | — |
| urgency | الأولوية | Yes | normal/high/urgent | — |
- **API:** Supabase `support_requests.insert()`
- **DB:** `public.support_requests`

## 8. Custom Errand Form (no Zod schema found — validation likely inline)
| Field | Label | Required | Notes |
|-------|-------|----------|-------|
| title | عنوان الطلب | Yes | Max 200 chars (from constants) |
| description | الوصف | Optional | Max 500 chars |
| category | الفئة | Yes | food/grocery/pharmacy/custom_errand |
| pickup_address | عنوان الاستلام | Optional | With map picker |
| dropoff_address | عنوان التسليم | Yes | With map picker |
| estimated_price | السعر التقديري | Optional | Number in MAD |
- **API:** `orderApi.createErrand()`
- **DB:** `public.orders` (type='errand')

## 9. Delete Account Confirmation (no Zod schema — custom validation)
- User must type "حذف" to confirm
- Confirmation dialog with warning message
- **API:** Soft-delete via `authApi.deleteAccount()` → sets `users.deleted_at`
- **DB:** `public.users.deleted_at`; PII purge after 30 days via `purge_deleted_users()`
