# JAHEEZ — Full Platform Architecture Document

> Morocco-first, Arabic-first multi-service delivery super-platform for Safi.
> Last updated: May 2026

---

## Table of Contents

- [A. Workflow Weaknesses Found](#a-workflow-weaknesses-found)
- [B. Complete Platform Architecture](#b-complete-platform-architecture)
- [C. Complete Role List](#c-complete-role-list)
- [D. Admin Hierarchy & Responsibilities](#d-admin-hierarchy--responsibilities)
- [E. Permission Matrix](#e-permission-matrix)
- [F. Full Admin Workflows](#f-full-admin-workflows)
- [G. Interface Specification](#g-interface-specification)
- [H. Hidden Edge Cases](#h-hidden-edge-cases)
- [I. Security Architecture](#i-security-architecture)
- [J. Audit Log Specification](#j-audit-log-specification)
- [K. Notification System](#k-notification-system)
- [L. Data Model](#l-data-model)
- [M. Error & Failure Handling](#m-error--failure-handling)
- [N. Production-Ready End-to-End Flow](#n-production-ready-end-to-end-flow)
- [O. Implementation Phases](#o-implementation-phases)
- [P. First Coding Batch Recommendation](#p-first-coding-batch-recommendation)

---

## A. Workflow Weaknesses Found

### User App (Phase A — ~85% complete)

1. **No phone/OTP auth** — Auth uses email+password only. Morocco-first platforms must support phone number + SMS OTP as the primary authentication method.
2. **No offline/no-internet banner** — If Supabase is unreachable, the user sees a blank screen with no feedback.
3. **No push notification infrastructure** — Expo Push Notifications and backend trigger system are not wired up.
4. **No real-time order tracking** — `subscribeToOrder` exists in `orderApi.ts` but is not connected to the tracking screen. Status changes require manual refresh.
5. **Silent cart clear on store switch** — The cart clears silently when a user adds a product from a different store. No confirmation dialog.
6. **No guest mode** — Every action requires login, increasing abandonment rate for first-time users.
7. **No wallet top-up path** — Wallet balance can only be adjusted by an admin. No payment gateway for customer self top-up.
8. **Dual API layer conflict** — `hooks/useOrder.ts` imports from `lib/api.ts`, while all other hooks use `lib/orderApi.ts`. Two competing API layers exist simultaneously. This is a ticking bomb that will cause confusion and divergent behavior.
9. **No Terms / Privacy screen** — Legally required by Moroccan law and both Apple App Store and Google Play.
10. **No delete account flow** — Required by Apple App Store guidelines (mandatory since 2022) and Google Play.
11. **No language switcher** — Arabic is hardcoded. Darija and French support are planned but no i18n infrastructure exists.

### Admin Panel (Phase B — not started)

12. **No admin auth isolation** — There is no `admin_users` table. A regular user JWT can theoretically access admin routes if RLS is misconfigured.
13. **No RBAC in database** — No `roles` or `role_permissions` tables exist yet.
14. **No audit log table** — Every admin action is currently untracked and unrecoverable.
15. **No soft-delete pattern** — All deletions are hard deletes with no recovery path.
16. **No driver document verification workflow** — The `drivers` table exists but the approval/rejection/document-review pipeline is undefined.
17. **No promotions/banners table** — Featured stores are currently hardcoded in the app.

### Backend / Database

18. **No `OrderStatusEvent` history** — The `orders.status` column is overwritten on each transition. There is no immutable status trail.
19. **No `notifications` table** — No infrastructure for in-app notifications.
20. **No payment gateway abstraction** — Payment is cash-only. No gateway-agnostic architecture for future CMI/PayZone/Stripe integration.
21. **`menu_items.options` is free-form JSON** — No DB-level validation of option structure. Malformed data from the admin panel will silently break the product detail sheet in the user app.
22. **No idempotency keys** — Order creation and payment processing have no duplicate-prevention mechanism.

---

## B. Complete Platform Architecture

```
jaheez/
├── user-app/                    ← Expo 55 / React Native 0.83.6 / TypeScript
│   ├── app/                     ← Expo Router v3 (file-based routing)
│   │   ├── (auth)/              ← welcome, onboarding, login, register, otp
│   │   ├── (tabs)/              ← home, orders, search, chat, wallet, profile
│   │   └── (flows)/             ← all secondary screens
│   ├── components/              ← UI primitives (AnimatedPressable, SkeletonBox, etc.)
│   ├── constants/               ← brand.ts (all design tokens)
│   ├── hooks/                   ← queries/ + mutations/ (React Query)
│   ├── lib/                     ← Supabase API wrappers
│   ├── store/                   ← Zustand stores (authStore, cartStore, orderStore)
│   └── assets/                  ← fonts, images, animations
│
├── admin/                       ← Next.js 14 App Router / TypeScript (Phase B)
│   ├── app/
│   │   ├── (auth)/login/        ← admin login (isolated from user auth)
│   │   └── (dashboard)/         ← protected admin routes
│   │       ├── dashboard/       ← KPI overview
│   │       ├── orders/          ← order management + driver assignment
│   │       ├── stores/          ← store CRUD
│   │       ├── products/        ← product + options CRUD
│   │       ├── categories/      ← category management
│   │       ├── promotions/      ← banners + promo codes
│   │       ├── users/           ← user management + suspension
│   │       ├── drivers/         ← driver management + document review
│   │       ├── wallets/         ← wallet overview + adjustments
│   │       ├── payments/        ← payment transactions + reconciliation
│   │       ├── refunds/         ← refund approval workflow
│   │       ├── support/         ← support ticket management
│   │       ├── audit-logs/      ← append-only action history
│   │       ├── roles/           ← RBAC configuration
│   │       ├── settings/        ← app configuration
│   │       └── security/        ← sessions, failed logins, alerts
│   ├── components/              ← shadcn/ui + custom table components
│   ├── lib/                     ← Supabase server client (service role — server only)
│   ├── hooks/                   ← React Query hooks
│   └── middleware.ts            ← Route protection (redirect if no valid admin session)
│
├── driver-app/                  ← Expo / React Native / TypeScript (Phase C)
│   ├── app/
│   │   ├── (auth)/              ← login, register, pending-approval, document-upload
│   │   └── (main)/              ← dashboard, assigned-orders, active-delivery, earnings
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── store/
│
├── shared/                      ← shared across all three apps
│   ├── types/                   ← Order, User, Driver, Store, Wallet, etc.
│   ├── constants/               ← order statuses, category keys, currencies
│   ├── validation/              ← Zod schemas (reused on client + server)
│   ├── money/                   ← centimes math utilities (add, subtract, format)
│   └── permissions/             ← RBAC role definitions and permission constants
│
├── supabase_schema.sql          ← Migrations 001 + 002 (run in Supabase SQL Editor)
├── replit.md                    ← Replit agent memory (current stack, screen inventory)
└── JAHEEZ_ARCHITECTURE.md       ← This document
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Supabase as backend | Auth (JWT), Postgres, S3-compatible storage, realtime — all in one, no custom server needed for Phase A/B |
| Service role key server-side only | Admin panel uses Next.js Server Components/Actions. Service role key **never** reaches the browser |
| Admin auth = separate `admin_users` table | A regular user JWT cannot grant admin access even if RLS is misconfigured |
| Integer centimes everywhere | No floating point. `balance_centimes INTEGER CHECK (balance_centimes >= 0)`. Displayed as `/100` |
| Soft deletes on critical entities | `deleted_at TIMESTAMPTZ NULL` — never hard DELETE users, orders, wallets, or drivers |
| `OrderStatusEvent` append-only log | Status history is immutable. Every transition creates a new row. No overwrites |
| Zod schemas in `shared/validation/` | Same schema runs on mobile client, Next.js server, and Supabase Edge Functions |
| Centimes math in `shared/money/` | `addCentimes`, `subtractCentimes`, `formatMAD` — never replicated in app code |

---

## C. Complete Role List

| Role | Type | Why It Exists |
|---|---|---|
| **Customer** | User | Browses, orders, pays, tracks, contacts support |
| **Guest** | User | Browses only — must register to place an order |
| **Suspended Customer** | User | Banned from ordering; can view past history |
| **Unverified Driver** | Driver | Registered but documents not submitted |
| **Pending Driver** | Driver | Documents submitted, awaiting admin review |
| **Active Driver** | Driver | Approved; can receive and fulfill orders |
| **Suspended Driver** | Driver | Temporarily banned; cannot receive orders |
| **Super Admin** | Admin | Full system access; manages all other admins; can destroy data |
| **Operations Admin** | Admin | Day-to-day order management, driver assignment, escalation handling |
| **Store / Catalog Admin** | Admin | Manages stores, products, categories — no financial access |
| **Promotions Admin** | Admin | Creates banners, promo codes, scheduled campaigns |
| **Support Agent** | Admin | Handles support tickets only; cannot issue refunds independently |
| **Finance Admin** | Admin | Wallet adjustments, refund approval, payment reconciliation |
| **Driver Manager** | Admin | Approves/rejects drivers, reviews documents, handles driver issues |
| **Security Admin** | Admin | Audit logs, session management, suspicious activity review |
| **Viewer (Read-only)** | Admin | Can see everything, change nothing — for investors / observers |
| **System Bot** | Service | Automated service account for cron jobs, webhooks, triggers |

---

## D. Admin Hierarchy & Responsibilities

### Super Admin
- **Daily:** Monitor dashboard KPIs, review high-risk audit events
- **Weekly:** Audit role assignments, review system health, check storage usage
- **Rare but critical:** Hard-delete data, change platform settings, grant Super Admin to another user, revoke all sessions
- **Dashboard needs:** All KPIs, recent audit events, security alerts, system health
- **Requires:** MFA mandatory. Re-authentication required before destructive actions (5-minute grace window)
- **Risk if too permissive:** Accidental production data deletion, exposed service keys
- **Risk if too restricted:** Platform cannot be managed during incidents

### Operations Admin
- **Daily:** Assign drivers to pending orders, update order statuses, monitor active orders, handle escalations from Support
- **Weekly:** Review unassigned order backlog, check driver-to-order availability ratios by zone
- **Rare:** Cancel orders in bulk, override order status after verified complaint
- **Dashboard needs:** Active orders map, unassigned orders count, driver availability, avg. assignment time
- **Cannot:** Access wallets, financial data, user passwords, audit logs, system settings

### Store / Catalog Admin
- **Daily:** Add/edit products, update prices, toggle item availability, upload images
- **Weekly:** Audit menu completeness, flag out-of-stock items, review category structure
- **Rare:** Archive stores, bulk-update pricing for seasonal promotions
- **Cannot:** Touch orders, wallets, users, drivers, or any financial record
- **Risk if too permissive:** Could set fraudulent prices or archive active stores

### Promotions Admin
- **Daily:** Monitor live banner performance, schedule upcoming promotions
- **Weekly:** Review conversion rates from banners to orders
- **Rare:** Emergency-disable a live promotion (e.g. pricing error, expired campaign)
- **Cannot:** Edit actual product base prices — only promotion discount values
- **Risk if too permissive:** Could push misleading banners or create loss-making promotions

### Support Agent
- **Daily:** Triage new tickets, reply via WhatsApp deep-link, close resolved tickets, add internal notes
- **Weekly:** Identify recurring issue patterns, flag for Operations or Finance
- **Cannot:** Modify orders, issue refunds independently, access wallet or financial data
- **Can:** Add internal notes, escalate to Finance Admin for refund approval
- **Risk if too limited:** Slow resolution, frustrated customers

### Finance Admin
- **Daily:** Reconcile COD collections, review failed payment logs
- **Weekly:** Process approved refunds, prepare driver payout batches
- **Rare:** Manual wallet adjustment (requires mandatory reason field + re-authentication)
- **Requires:** Re-authentication before any wallet debit/credit. All actions logged
- **Risk if too permissive:** Fraudulent wallet top-ups, unauthorized refunds

### Driver Manager
- **Daily:** Review pending driver document submissions, approve/reject drivers
- **Weekly:** Check driver performance metrics, handle reported driver issues
- **Rare:** Suspend driver after incident report
- **Cannot:** Access user wallets, financial reconciliation, system settings
- **Risk if too limited:** Driver verification backlog slows platform supply

### Security Admin
- **Daily:** Review failed login attempts, check suspicious activity flags
- **Weekly:** Audit permission changes, review data export logs
- **View-only across all data** — cannot create, edit, or delete anything
- **Can:** Revoke admin sessions, flag accounts for review
- **Risk if too limited:** Security incidents go undetected

---

## E. Permission Matrix

| Module | Super | Ops | Store/Cat | Promos | Support | Finance | Driver Mgr | Security | Viewer | Bot |
|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | Full | View | Store only | Promos only | Tickets only | Finance only | Drivers only | View | View | — |
| Users | Full | View+Edit | None | None | View | View | None | View | View | View |
| User Suspension | Full | Approve | None | None | None | None | None | None | None | None |
| Drivers | Full | View+Edit | None | None | None | None | Full | View | View | View |
| Driver Documents | Full | View | None | None | None | None | Approve/Reject | View | View | None |
| Stores | Full | View+Edit | Full | View | None | None | None | View | View | Create+Edit |
| Products | Full | View | Full | View | None | None | None | None | View | Create+Edit |
| Categories | Full | View | Create+Edit | View | None | None | None | None | View | None |
| Promotions/Banners | Full | View | None | Full | None | None | None | None | View | None |
| Orders | Full | Full | View (own) | None | View | View | View | View | View | Assign |
| Order Assignment | Full | Assign | None | None | None | None | Assign | None | None | Assign |
| Support Tickets | Full | View | None | None | Full | View | None | View | View | None |
| Wallets | Full | View | None | None | None | Full | None | View | View | None |
| Wallet Adjustment | Full | None | None | None | None | Approve+reason | None | None | None | None |
| Payments | Full | View | None | None | None | Full | None | View | View | View |
| Refunds | Full | None | None | None | Request only | Approve/Reject | None | View | View | None |
| Reports / Export | Full | Orders | Catalog | None | None | Finance | Drivers | Full | View | None |
| App Content | Full | None | None | Edit | None | None | None | None | View | None |
| Notifications | Full | Send | None | Send | None | None | None | None | View | Send |
| Roles & Permissions | Full | None | None | None | None | None | None | None | None | None |
| Audit Logs | Full | None | None | None | None | None | None | Full | View | None |
| Security Alerts | Full | None | None | None | None | None | None | Full | View | None |
| Settings | Full | None | None | None | None | None | None | None | None | None |
| File Uploads | Full | Upload | Upload | Upload | None | None | Upload | View | View | Upload |
| Data Export | Full | Orders | Catalog | None | None | Finance | Drivers | Full | None | None |
| API Keys / Integrations | Full | None | None | None | None | None | None | View | None | None |
| System Health | Full | View | None | None | None | None | None | Full | View | None |

---

## F. Full Admin Workflows

### F1. Order Lifecycle (most critical daily workflow)

**Trigger:** Customer places order in user app
**Entry:** Operations Admin → Orders → filter `status = pending`

1. New order badge appears on sidebar Orders link
2. Admin sees table row: order ID, customer name, store name, item count, total (MAD), delivery address, time placed
3. Admin clicks row → Order Detail drawer slides open from right
4. Drawer shows: full item list with images and options, customer name+phone, store name+phone, delivery address with map pin, payment method, customer notes, order timeline
5. Admin clicks "تعيين سائق" → modal opens with list of active drivers sorted by proximity/zone
6. If no driver available → system shows yellow warning banner: "لا يوجد سائق متاح في المنطقة". Admin can set status to "Manual Pending" and notify a driver via WhatsApp deep-link
7. Admin selects driver → confirmation modal: "سيتم إخطار [Driver Name] فورًا. هل تؤكد؟"
8. On confirm:
   - `orders.driver_id` = selected driver ID
   - `orders.status` = `'confirmed'`
   - `orders.assigned_at` = now()
   - New `order_status_events` row: `{status: 'confirmed', actor_id: admin_id, actor_type: 'admin'}`
9. Push notification → Customer: "تم تعيين السائق الخاص بك"
10. Push notification → Driver app: new order alert
11. Audit log: `{action: 'order.driver_assigned', actor: admin_id, target_type: 'order', target_id: order_id, metadata: {driver_id}}`

**Edge cases:**
- Driver already has an active undelivered order → warning: "هذا السائق لديه توصيل نشط بالفعل". Admin must confirm override or pick another driver
- Customer cancels while admin is assigning → system detects stale status, blocks assignment: "تم إلغاء هذا الطلب من قبل العميل"
- Two admins try to assign the same order simultaneously → second admin sees: "تم تعيين سائق لهذا الطلب بواسطة مشرف آخر"

**Full status flow:**
```
pending → confirmed → picked_up → on_the_way → delivered
         ↓                                      ↓
      cancelled (admin/customer)            completed
```
Every transition creates a new `order_status_events` row. The `orders.status` column reflects the current state only.

---

### F2. Driver Approval Workflow

**Trigger:** Driver submits documents in driver app
**Entry:** Driver Manager → Drivers → filter `status = pending_verification`

1. Driver row shows: photo, name, phone, submission date, document count badge
2. Admin clicks row → Driver Detail page
3. "وثائق التحقق" tab shows document list:
   - بطاقة الهوية (وجه أمامي)
   - بطاقة الهوية (وجه خلفي)
   - رخصة السياقة
   - رخصة تسجيل السيارة
   - صورة السيارة
4. Admin clicks each document → full-screen modal with zoom
5. Admin marks each: ✓ مقبول | ✗ مرفوض | ⟳ إعادة تقديم مطلوبة
6. Comment field available for each rejection
7. "الموافقة على السائق" button only activates when all documents are marked ✓
8. Admin clicks Approve → modal: "سيتمكن هذا السائق من استلام الطلبات فورًا. هل تؤكد الموافقة؟"
9. On confirm:
   - `drivers.status` = `'active'`
   - `drivers.verified_at` = now()
   - `drivers.verified_by` = admin_id
   - All documents: `status = 'approved'`
   - Push + email notification to driver: "تم قبول حسابك! يمكنك البدء الآن"
   - Audit log entry
10. If rejection → modal with reason field (required, min 20 chars) → driver notified with specific reasons

**Edge cases:**
- Driver resubmits a document while review is open → "تم تحديث" badge on document, admin must re-review
- Admin tries to approve with one rejected document → button stays disabled, red indicator on rejected doc
- Driver account suspended after approval (complaint received) → separate Suspend flow, requires reason

---

### F3. Refund Workflow

**Trigger:** Support agent opens a ticket with refund request
**Entry:** Support Agent → Support Tickets → ticket detail

1. Support Agent reviews ticket, verifies: order exists, is not older than 14 days, not already refunded
2. Agent clicks "طلب استرداد" → form opens:
   - Amount (pre-filled with order total in MAD, editable)
   - Reason (dropdown: خطأ في الطلب | مشكلة في التوصيل | جودة سيئة | إلغاء | أخرى)
   - Internal note (free text, required min 10 chars)
3. Agent submits → `refunds.status` = `'pending_approval'`
4. Finance Admin receives notification badge + email: "طلب استرداد جديد #XXXXX"
5. Finance Admin → Payments → Refunds → filter `status = pending_approval`
6. Finance Admin reviews: customer name, order ID, original amount, refund amount, support agent note, original payment method
7. If cash order → refund destination: wallet only (no other option in v1)
8. If wallet order → refund back to wallet automatically
9. Finance Admin clicks Approve → **re-authentication required** (confirm password prompt, valid for 5 minutes)
10. On success:
    - `wallet_transactions` INSERT: `{type: 'credit', amount_centimes: X, description: 'استرداد الطلب #Y', metadata: {order_id, refund_id}}`
    - `wallets.balance_centimes` += X
    - `refunds.status` = `'approved'`, `approved_by` = finance_admin_id
    - `orders.refund_status` = `'refunded'`
    - Push + in-app notification → Customer: "تم استرداد X د.م إلى محفظتك"
    - Audit log: `{action: 'refund.approved', actor: finance_admin_id, amount: X, order_id, refund_id}`
11. If rejected → support agent notified, ticket re-opened for escalation, mandatory reason stored

**Edge cases:**
- Refund amount > original payment → Finance Admin form hard-blocks: "مبلغ الاسترداد أكبر من المبلغ المدفوع الأصلي"
- Order already partially refunded → system shows remaining refundable amount
- Finance Admin submits twice (double-click) → idempotency key on refund prevents duplicate

---

### F4. Store Creation Workflow

1. Store/Catalog Admin → Stores → "+ إضافة متجر"
2. Multi-step form:
   - **الخطوة 1 — المعلومات الأساسية:** name_ar (required), name_fr (optional), category (required dropdown), city (required), phone, description_ar
   - **الخطوة 2 — الصور:** logo upload (1:1 ratio, max 2MB, JPEG/PNG/WebP), cover upload (16:9, max 5MB)
   - **الخطوة 3 — التوصيل:** delivery_fee_centimes, min_order_centimes, delivery_time_min, delivery_time_max
   - **الخطوة 4 — أوقات العمل:** per-day toggles (السبت→الجمعة), from/to time pickers per day
   - **الخطوة 5 — الإعدادات:** cuisine_tags (multi-select chips), is_featured (Super Admin / Ops Admin only), sort_order
3. Client-side validation (Zod) before each step
4. Image uploads: validated MIME type + dimensions client-side, re-validated server-side via Supabase Storage policy
5. On final Submit → store created with `status: 'inactive'` (draft state)
6. Separate "تفعيل المتجر" button with confirmation: "سيظهر المتجر للمستخدمين فورًا. هل تريد المتابعة؟"
7. Audit log: `{action: 'store.created', actor, store_id, metadata: {name_ar, category}}`

**Edge cases:**
- Duplicate store name in same city → warning shown (not blocking — may be a branch)
- Image upload fails → step 2 shows retry, can skip and upload later
- Admin navigates away mid-form → unsaved changes dialog: "لديك تغييرات غير محفوظة"

---

### F5. Wallet Adjustment Workflow

1. Finance Admin → Wallets → search customer by name/phone → open Wallet Detail
2. Wallet Detail shows: current balance, all transactions with filter (all/credit/debit), linked orders
3. "تعديل الرصيد" button (Finance Admin only)
4. Modal:
   - Type: إضافة رصيد | خصم رصيد
   - Amount in MAD (converted to centimes on save)
   - Reason (required, min 10 chars, saved in `metadata`)
   - Internal reference (optional)
5. Finance Admin clicks Submit → **re-authentication required**
6. On success:
   - `wallet_transactions` INSERT: `{type: 'credit'|'debit', amount_centimes, description: 'تعديل يدوي: [reason]', metadata: {adjusted_by: admin_id, reason}}`
   - `wallets.balance_centimes` updated (trigger-based double-entry)
   - Audit log: `{action: 'wallet.manually_adjusted', actor, wallet_id, delta_centimes, reason}`
7. Customer receives in-app notification: "تم تعديل رصيد محفظتك"

**Edge cases:**
- Debit would make balance negative → blocked: "الرصيد المتبقي سيصبح سالبًا بعد هذا الخصم"
- Same admin adjusts same wallet twice within 60 seconds → rate-limit warning + confirmation required
- Finance Admin has open re-auth window (5 min grace) → no second prompt needed

---

## G. Interface Specification

### G1. Admin Dashboard

**Page Title:** لوحة التحكم — JAHEEZ
**Refresh:** Auto-refresh every 60 seconds

**Top KPI Row (4 cards):**
| Card | Value | Color | Click action |
|---|---|---|---|
| طلبات اليوم | count | Blue | → Orders filtered to today |
| الطلبات النشطة | count | Orange | → Orders filtered to active |
| إيرادات اليوم | MAD amount | Green | → Payments report |
| سائقون في انتظار الموافقة | count | Red | → Drivers filtered to pending |

**Charts Row:**
- Chart 1: Bar chart — orders by hour (today vs yesterday overlay)
- Chart 2: Line chart — revenue trend (last 7 days)

**Recent Orders Table (last 10):**
Columns: ID | العميل | المتجر | الأصناف | المجموع | الحالة | السائق | الوقت
Click row → Order Detail drawer

**Pending Tickets Table (last 5):**
Columns: الرقم المرجعي | العميل | الفئة | الأولوية | منذ
Click → Ticket detail

**Alert Banner (conditional):**
Shown if: failed payments > 0, OR pending driver verifications > 0, OR unassigned orders > 5 mins old

---

### G2. Orders Screen

**Filters:** الحالة | المتجر | السائق | طريقة الدفع | المدينة | نطاق التاريخ | نوع الطلب
**Search:** by order ID, customer name, customer phone

**Table Columns:**
| Column | Type | Sortable |
|---|---|---|
| # | ID truncated | No |
| العميل | name + phone | Yes |
| المتجر | name | Yes |
| الأصناف | count | Yes |
| المجموع | MAD | Yes |
| الحالة | colored badge | Yes |
| السائق | name or "غير معين" | Yes |
| الوقت | relative time | Yes |
| الإجراءات | icon buttons | No |

**Status Badges:**
- `pending` → 🟡 في الانتظار
- `confirmed` → 🔵 مؤكد
- `picked_up` → 🟣 تم الاستلام
- `on_the_way` → 🟠 في الطريق
- `delivered` → 🟢 تم التوصيل
- `cancelled` → 🔴 ملغى

**Row Actions (icon buttons):**
عرض | تعيين سائق | إلغاء | ملاحظة داخلية

**Bulk Actions (select multiple):**
تصدير CSV | تعيين دفعي لسائق | إلغاء دفعي

**Order Detail Drawer:**
- Header: order ID + status badge + time
- Tabs: التفاصيل | المخطط الزمني | الملاحظات الداخلية
- التفاصيل tab: item list with images + options, customer info, store info, delivery address, payment breakdown
- المخطط الزمني tab: `OrderStatusEvent` list (who changed what when)
- الملاحظات tab: internal notes thread (admin-only, never shown to customer)
- Footer: primary action button (context-sensitive: "تعيين سائق" if pending, "تحديث الحالة" if active, "استرداد" if delivered)

---

### G3. Users Screen

**Filters:** الحالة | المدينة | تاريخ التسجيل | لديه طلبات | محفظة > 0
**Search:** by name, phone, email

**Table Columns:** الصورة | الاسم | الهاتف | المدينة | الطلبات | رصيد المحفظة | الحالة | تاريخ الانضمام | إجراءات

**Row Actions:** عرض | تعديل | تعليق | عرض الطلبات | عرض المحفظة

**User Detail Page (full page, not drawer):**
- Tabs: الملف الشخصي | سجل الطلبات | المحفظة | تذاكر الدعم | العناوين | سجل النشاط
- الملف الشخصي: edit form for name/phone/city, account status badge, suspend/restore button
- سجل الطلبات: orders table with same columns as main orders screen, filtered to this user
- المحفظة: balance display + full transaction history + "تعديل الرصيد" button (Finance Admin only)
- تذاكر الدعم: tickets linked to this user
- سجل النشاط: last login, device, IP (Security Admin only)

---

### G4. Drivers Screen

**Filters:** الحالة | المدينة | حالة الوثائق | تاريخ الانضمام
**Search:** by name, phone

**Table Columns:** الصورة | الاسم | الهاتف | الحالة | الوثائق | الطلبات المنجزة | التقييم | تاريخ الانضمام | إجراءات

**Driver Detail Page:**
- Tabs: الملف الشخصي | الوثائق | سجل الطلبات | الأرباح | المشاكل المُبلَّغة
- الوثائق tab: each document with preview modal, status badge, review action buttons (Driver Manager only)
- سجل الطلبات: deliveries with status, rating, time
- الأرباح: earnings per order, weekly totals, payout requests

---

### G5. Support Tickets Screen

**Filters:** الحالة | الأولوية | الفئة | الوكيل المسؤول | نطاق التاريخ
**Search:** by ref number, customer name

**Table Columns:** # المرجع | العميل | الفئة | الأولوية | الحالة | الوكيل | تاريخ الإنشاء | آخر تحديث

**Ticket Detail Drawer:**
- Header: ref number, status badge, urgency badge
- Customer section: name, phone, WhatsApp deep-link button
- Linked order section (if any): order ID, status, total
- Message thread: customer message + admin replies
- Internal notes section (admin-only)
- Footer actions: رد عبر واتساب | إضافة ملاحظة | طلب استرداد | إغلاق التذكرة | تصعيد

---

### G6. Roles & Permissions Screen (Super Admin only)

- **Left panel:** list of all roles with description and user count
- **Right panel:** permission matrix for selected role — checkboxes per module per action
- Changes require confirmation modal with impact summary: "هذا التغيير سيؤثر على X مستخدم"
- All permission changes are immediately reflected (no "save draft")
- Audit log entry on every change

---

### G7. Audit Logs Screen

- **Filters:** الفاعل | نوع الإجراء | نوع الهدف | المدة | النتيجة (نجاح/فشل)
- **Search:** full-text across action + metadata JSON
- **Table:** التاريخ | الفاعل | الإجراء | الهدف | عنوان IP | النتيجة
- **Row click → Detail drawer:**
  - JSON diff viewer: القيمة السابقة / القيمة الجديدة side by side
  - Full metadata JSON (raw view toggle)
  - Actor session info
- **Export button:** CSV/JSON (action itself logged as `data.exported`)
- **No edit, no delete buttons anywhere on this screen** — append-only enforced

---

## H. Hidden Edge Cases

| Scenario | System Response |
|---|---|
| Super Admin tries to delete their own account | Blocked: "لا يمكن حذف الحساب الوحيد بصلاحيات Super Admin. أضف مشرفاً آخر أولاً" |
| Admin removes their own role/permission | Blocked server-side: cannot modify your own role assignment |
| Role deleted while assigned to users | Role soft-deleted only; affected admin accounts flagged as "دور غير محدد" and locked until Super Admin reassigns |
| Two admins edit the same order simultaneously | Last-write wins with `updated_at` stale-check; second admin sees: "تم تعديل هذا الطلب بواسطة [Name] منذ X ثوانٍ. هل تريد الاستمرار؟" |
| Unauthorized export attempt | Blocked. Logged as security event `{action: 'security.unauthorized_export_attempt'}`. Security Admin alerted |
| Admin tries to refund without Finance permission | 403 response. Logged. UI button is hidden but server-side check is the real enforcement |
| Delete store with active orders | Blocked: "يوجد X طلب نشط مرتبط بهذا المتجر. لا يمكن أرشفة المتجر حتى تنتهي جميع الطلبات النشطة" |
| Delete category used by products | Blocked: "هذه الفئة مستخدمة في X منتج. أعد تصنيف المنتجات أولاً" |
| Product becomes unavailable after added to cart | At checkout validation: item highlighted red, "هذا الصنف لم يعد متاحاً". Must be removed before proceeding |
| Store closes during active checkout | Checkout validation checks `stores.is_open` at confirm time. If closed: "هذا المتجر أغلق للتو. يمكنك المحاولة لاحقاً أو اختيار متجر آخر" |
| Promo expires during checkout | Discount removed, total recalculated, user sees: "انتهت صلاحية كود الخصم. تم تحديث المجموع" before final confirm |
| Price changed during checkout (increased >5%) | Alert shown to user before confirm: "تغير سعر [item] من X إلى Y". User must re-confirm |
| Order cancelled after payment (wallet) | Auto-trigger `wallet_transactions` credit immediately on cancellation — no manual step |
| Driver assigned twice | Second assignment blocked: "هذا السائق لديه توصيل نشط بالفعل" |
| No driver available after 10 minutes | Dashboard alarm badge. Ops Admin notified. Order flagged "⚠️ لم يُعيَّن سائق" |
| Double payment attempt (user taps confirm twice) | Client: button disabled after first tap. Server: idempotency key (`user_id + store_id + timestamp rounded to 30s`) prevents duplicate order creation |
| Refund > paid amount | Finance Admin form blocked: "مبلغ الاسترداد (X د.م) يتجاوز المبلغ المدفوع الأصلي (Y د.م)" |
| Gateway webhook replay / duplicate callback | Idempotency: `payment_transactions.gateway_ref` has UNIQUE constraint. Duplicate webhooks return 200 silently |
| Payment success but order creation fails | Compensating transaction logged. Customer never charged. Auto-retry order creation 2x, then manual recovery queue |
| Support ticket for a deleted order | Ticket shows: "تم حذف الطلب المرتبط بهذه التذكرة". Ticket remains fully functional. Order data preserved as soft-deleted |
| File upload: malicious MIME type | Client: MIME check before upload. Server: Supabase Storage policy rejects non-image MIME types. Attempt logged with actor IP |
| Audit log deletion attempt | `DELETE` permission removed from `audit_logs` table via Postgres policy. Even Super Admin cannot delete log rows |
| Admin brute force login | 5 failed attempts in 5 minutes → 15-minute account lockout → Security Admin notified via email |
| Customer opens multiple tickets for same order | Allowed, but system shows warning: "لديك تذكرة مفتوحة مسبقاً لهذا الطلب (#XXXX). هل تريد فتح تذكرة جديدة؟" |
| Driver owes platform money (negative earnings after deduction) | Payout blocked. Driver Manager notified. Driver dashboard shows: "رصيدك غير كافٍ لطلب صرف" |

---

## I. Security Architecture

### Authentication

| Layer | Mechanism |
|---|---|
| User app | Supabase Auth (JWT) — email/password + planned phone/OTP |
| Admin panel | Supabase Auth + mandatory `admin_users` table lookup — JWT alone is not sufficient |
| Driver app | Supabase Auth (JWT) — phone/OTP primary |
| Sensitive actions | Re-authentication prompt (password confirm) — 5-minute grace window before re-prompting |
| MFA | TOTP mandatory for: Super Admin, Finance Admin, Security Admin. Strongly recommended for all admins |
| Session timeout | 8 hours idle in admin panel → force re-login |
| Session revocation | Security Admin can revoke all active sessions for any admin account |

### Authorization (RBAC)

- All server-side routes (Next.js API routes + Server Components) check `admin_users.role` from database
- **Never trust role claims from the JWT payload** — always re-verify against `admin_users` table
- Supabase RLS: users can only read/write their own data in `public.*` tables
- Admin panel uses Supabase **service role key** — only in Next.js server-side code, never in browser bundle
- `middleware.ts` in Next.js admin app: every request to `/dashboard/*` verifies admin session before rendering

### File Upload Security

| Check | Where |
|---|---|
| MIME type validation | Client-side before upload + Supabase Storage policy |
| File size limit | Client: reject before upload. Storage: bucket max file size policy |
| Driver documents | **Private bucket** — no public URL. Served via signed URLs (1 hour expiry) |
| Store images | Public bucket with CDN. No executable MIME types allowed |
| Upload logs | Every upload creates a `file_uploads` record with actor, MIME type, size, entity |

### API Security

- **Rate limits:**
  - Login attempts: 5 per IP per 5 minutes
  - Order creation: 3 per user per minute
  - Wallet adjustments: 1 per admin per minute
  - Support ticket creation: 5 per user per hour
- Input validation: Zod on all forms. Supabase type constraints as second layer
- No Supabase service role key in any client bundle — admin operations proxied through Next.js Server Actions
- All Supabase queries use parameterized queries (no raw SQL interpolation in app code)

### Wallet / Payment Security

- All wallet mutations use database transactions (all-or-nothing)
- Double-entry bookkeeping: every `wallet_transactions` row has `type (credit|debit)`, never signed amount
- Idempotency keys on all payment attempts
- Refunds require Finance Admin approval + mandatory re-authentication
- `wallet_transactions.amount_centimes CHECK (amount_centimes > 0)` — direction determined by `type`
- Anti-duplicate: `payment_transactions.gateway_ref UNIQUE` constraint

### OWASP Top 10 Mitigations

| Risk | Mitigation |
|---|---|
| A01 Broken Access Control | RBAC on every route, server-side role check, RLS on all tables |
| A02 Cryptographic Failures | No sensitive data in JWT claims, signed URLs for private files, secrets in Replit env only |
| A03 Injection | Supabase parameterized queries only. No string interpolation in SQL |
| A05 Security Misconfiguration | Storage bucket policies reviewed at migration time. Private buckets for sensitive docs |
| A07 Identification & Auth Failures | Rate limiting, session timeout, MFA for admins, brute-force lockout |
| A09 Security Logging & Monitoring | Comprehensive audit log on all admin actions. Security Admin alerted on anomalies |

---

## J. Audit Log Specification

### Database Table

```sql
CREATE TABLE public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID,                          -- admin user who performed the action
  actor_role    TEXT,                          -- role at the exact time of action
  action        TEXT NOT NULL,                 -- e.g. 'order.driver_assigned'
  target_type   TEXT,                          -- 'order' | 'user' | 'wallet' | 'driver' | etc.
  target_id     UUID,
  previous_value JSONB,                        -- state before the change
  new_value      JSONB,                        -- state after the change
  ip_address    INET,
  user_agent    TEXT,
  session_id    TEXT,
  result        TEXT DEFAULT 'success',        -- 'success' | 'failure'
  failure_reason TEXT,
  metadata      JSONB,                         -- any additional context
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- No UPDATE or DELETE ever allowed on this table
-- RLS: SELECT only for Security Admin and Super Admin roles
-- No RLS UPDATE or DELETE policies — enforced at Postgres level
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_users WHERE role IN ('super_admin', 'security_admin')));
-- No INSERT policy needed (service role inserts from server)
```

### Actions That Must Be Logged

```
auth.login                   auth.logout                  auth.failed_login
auth.mfa_enabled             auth.mfa_disabled            auth.session_revoked
auth.brute_force_lockout

role.changed                 permission.changed           admin_user.invited
admin_user.deactivated

user.suspended               user.restored                user.deleted
driver.approved              driver.rejected              driver.suspended
driver.document_reviewed

store.created                store.updated                store.archived
product.created              product.updated              product.archived
category.created             category.updated             category.disabled

promotion.created            promotion.updated            promotion.disabled

order.status_changed         order.driver_assigned        order.driver_reassigned
order.cancelled              order.refunded               order.internal_note_added

wallet.manually_adjusted     wallet.refund_issued
payment.reconciled           payment.failed_payment_reviewed

data.exported                support.ticket_closed        support.ticket_escalated

settings.changed             security.unauthorized_access_attempt
```

### Admin UI Features

- **Full-text search** across `action`, `metadata::text`
- **Filters:** actor (admin name), role, action type, target type, result (success/failure), date range
- **Detail drawer:** JSON diff viewer (القيمة السابقة vs القيمة الجديدة, syntax highlighted), raw JSON toggle, session info
- **Export:** CSV or JSON — export itself logged as `data.exported`
- **Retention:** Configurable by Super Admin (minimum 12 months enforced at app level)
- **No edit or delete buttons** visible anywhere on this screen

---

## K. Notification System

### User Notifications

| Trigger | Channel | Priority | Message (Arabic) |
|---|---|---|---|
| Order created | Push + In-app | High | "تم استلام طلبك رقم #XXXX! سنبدأ التحضير قريباً" |
| Driver assigned | Push + In-app | High | "تم تعيين السائق — سيصل إليك قريباً" |
| Order picked up | Push | High | "السائق في طريقه إليك الآن" |
| Order delivered | Push + In-app | High | "تم التوصيل بنجاح! كيف كانت تجربتك؟" |
| Order cancelled | Push + In-app | High | "تم إلغاء طلبك" + reason |
| Refund processed | Push + In-app | High | "تم استرداد X د.م إلى محفظتك" |
| Support ticket reply | Push | Medium | "رد جديد على تذكرتك رقم #XXXX" |
| Promotion targeted | Push | Low | Campaign-specific message |

### Driver Notifications

| Trigger | Channel | Priority | Message (Arabic) |
|---|---|---|---|
| New order assigned | Push | Critical | "طلب جديد! — اقبل خلال 60 ثانية" |
| Order cancelled (after assignment) | Push | High | "تم إلغاء الطلب رقم #XXXX من قبل العميل" |
| Driver approved | Push + Email | High | "تهانينا! تم قبول حسابك. يمكنك البدء الآن" |
| Driver rejected | Push + Email | High | "نحتاج مراجعة وثائقك. الأسباب: [...]" |
| Payout processed | Push + In-app | Medium | "تم معالجة طلب الصرف الخاص بك" |

### Admin Notifications

| Trigger | Channel | Priority | Recipient |
|---|---|---|---|
| New order (unassigned > 5min) | In-admin badge | High | Ops Admin |
| Failed payment | In-admin + Email | High | Finance Admin |
| New support ticket | In-admin badge | Medium | Support Agent |
| Pending driver verification | In-admin badge | Medium | Driver Manager |
| Refund request pending | In-admin + Email | High | Finance Admin |
| Suspicious activity detected | In-admin + Email | Critical | Security Admin |
| Brute force lockout triggered | Email | Critical | Security Admin |
| System error (unhandled exception) | In-admin | High | Super Admin |
| Promotion expiring in 24h | In-admin | Low | Promotions Admin |

### Implementation Order

1. **Phase B:** In-app notifications (Supabase `notifications` table + realtime subscription)
2. **Phase B:** Push notifications (Expo Push Notifications + Supabase Edge Function trigger)
3. **Phase B:** Email notifications (Supabase Edge Function → Resend)
4. **Phase C+:** WhatsApp automated (Twilio WhatsApp Business API — manual deep-link for now)

---

## L. Data Model

### Migration 003 — New Tables Required

```sql
-- ─────────────────────────────────────────
-- ADMIN USERS & RBAC
-- ─────────────────────────────────────────
CREATE TABLE public.admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'viewer',
  is_active   BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  invited_by  UUID REFERENCES public.admin_users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  is_system   BOOLEAN DEFAULT false,  -- system roles cannot be deleted
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- ORDER STATUS HISTORY (APPEND-ONLY)
-- ─────────────────────────────────────────
CREATE TABLE public.order_status_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id),
  status      TEXT NOT NULL,
  actor_id    UUID,
  actor_type  TEXT,  -- 'customer' | 'driver' | 'admin' | 'system'
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- PROMOTIONS & BANNERS
-- ─────────────────────────────────────────
CREATE TABLE public.promotions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar        TEXT NOT NULL,
  type            TEXT NOT NULL,  -- 'banner' | 'promo_code' | 'discount'
  target_type     TEXT,           -- 'store' | 'category' | 'product' | 'global'
  target_id       UUID,
  discount_type   TEXT,           -- 'percent' | 'fixed_centimes'
  discount_value  INTEGER,        -- percent (0-100) or centimes
  promo_code      TEXT UNIQUE,
  max_uses        INTEGER,
  used_count      INTEGER DEFAULT 0,
  image_url       TEXT,
  placement       TEXT,           -- 'home_hero' | 'home_grid' | 'category_top'
  start_at        TIMESTAMPTZ,
  end_at          TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT false,
  created_by      UUID REFERENCES public.admin_users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title_ar    TEXT NOT NULL,
  body_ar     TEXT,
  data        JSONB,         -- navigation params, order_id, etc.
  is_read     BOOLEAN DEFAULT false,
  read_at     TIMESTAMPTZ,
  channel     TEXT,         -- 'push' | 'in_app' | 'email'
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- Realtime enabled on notifications

-- ─────────────────────────────────────────
-- REFUNDS
-- ─────────────────────────────────────────
CREATE TABLE public.refunds (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES public.orders(id),
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id),
  amount_centimes       INTEGER NOT NULL CHECK (amount_centimes > 0),
  reason                TEXT NOT NULL,
  status                TEXT DEFAULT 'pending_approval',
  requested_by          UUID REFERENCES public.admin_users(id),
  approved_by           UUID REFERENCES public.admin_users(id),
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- DRIVER DOCUMENTS
-- ─────────────────────────────────────────
CREATE TABLE public.driver_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id   UUID NOT NULL REFERENCES public.drivers(id),
  doc_type    TEXT NOT NULL,  -- 'national_id_front' | 'national_id_back' | 'license' | 'vehicle_reg' | 'vehicle_photo'
  file_url    TEXT NOT NULL,
  status      TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'resubmit_required'
  reviewed_by UUID REFERENCES public.admin_users(id),
  review_note TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- DRIVER EARNINGS
-- ─────────────────────────────────────────
CREATE TABLE public.driver_earnings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id           UUID NOT NULL REFERENCES public.drivers(id),
  order_id            UUID NOT NULL REFERENCES public.orders(id),
  gross_centimes      INTEGER NOT NULL CHECK (gross_centimes > 0),
  platform_fee_centimes INTEGER NOT NULL DEFAULT 0,
  net_centimes        INTEGER GENERATED ALWAYS AS (gross_centimes - platform_fee_centimes) STORED,
  status              TEXT DEFAULT 'pending',  -- 'pending' | 'paid'
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- PAYOUT REQUESTS
-- ─────────────────────────────────────────
CREATE TABLE public.payout_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       UUID NOT NULL REFERENCES public.drivers(id),
  amount_centimes INTEGER NOT NULL CHECK (amount_centimes > 0),
  bank_details    JSONB,  -- {bank_name, rib, account_holder}
  status          TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'paid'
  reviewed_by     UUID REFERENCES public.admin_users(id),
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- APP SETTINGS
-- ─────────────────────────────────────────
CREATE TABLE public.app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES public.admin_users(id),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- FILE UPLOADS LOG
-- ─────────────────────────────────────────
CREATE TABLE public.file_uploads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID,
  file_url    TEXT NOT NULL,
  bucket      TEXT NOT NULL,
  size_bytes  INTEGER,
  mime_type   TEXT,
  entity_type TEXT,
  entity_id   UUID,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- AUDIT LOGS (APPEND-ONLY — NO UPDATE/DELETE)
-- ─────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID,
  actor_role      TEXT,
  action          TEXT NOT NULL,
  target_type     TEXT,
  target_id       UUID,
  previous_value  JSONB,
  new_value       JSONB,
  ip_address      INET,
  user_agent      TEXT,
  session_id      TEXT,
  result          TEXT DEFAULT 'success',
  failure_reason  TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### Existing Tables — Required Patches

```sql
-- orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS internal_notes JSONB DEFAULT '[]';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;  -- soft delete

-- menu_items
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS operating_hours JSONB;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- drivers
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS current_lat DECIMAL(10,7);
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS current_lng DECIMAL(10,7);
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
```

---

## M. Error & Failure Handling

| Error Type | User-Facing Message (Arabic) | Admin Visibility | Retry | Logged |
|---|---|---|---|---|
| No internet | "تحقق من اتصالك بالإنترنت" + زر إعادة المحاولة | — | Auto 3x exponential backoff | No |
| Auth failure (wrong password) | "بيانات الدخول غير صحيحة" | Failed login in audit log | Manual | Yes |
| Auth failure (account locked) | "تم تعليق حسابك مؤقتاً. حاول بعد X دقيقة" | Security Admin alert | After lockout expires | Yes |
| Payment gateway failure | "فشلت عملية الدفع. حاول مرة أخرى أو استخدم طريقة دفع أخرى" | Finance Admin alert + log | Manual button shown | Yes |
| Order creation failure (DB) | "تعذّر إنشاء الطلب. تواصل مع الدعم إذا تكررت المشكلة" | Sentry + admin log | Manual (retry button) | Yes |
| Product unavailable | "هذا الصنف لم يعد متاحاً" — item highlighted in cart | Catalog Admin notified | No retry | No |
| Store closed | "هذا المتجر مغلق حالياً" — checkout blocked | — | No | No |
| Wallet insufficient | "رصيد المحفظة غير كافٍ (X د.م). أضف رصيداً أو ادفع نقداً" | — | No | No |
| Image upload failure | "فشل رفع الصورة. تحقق من الحجم والصيغة وأعد المحاولة" | Upload failure log | Auto 2x then manual | Yes |
| Permission denied (admin) | "ليس لديك صلاحية لهذا الإجراء" | Security event in audit log | No | Yes |
| Duplicate order | Confirmation dialog: "هل تريد إنشاء طلب مكرر؟ آخر طلبك كان منذ X دقائق" | — | Manual confirm | Yes |
| Gateway webhook replay | Silent dedup (idempotency key) — no user impact | Logged as duplicate | No | Yes |
| API timeout (>10s) | "الطلب يستغرق وقتاً أطول من المعتاد. حاول مرة أخرى" | Timeout logged | Auto 1x then manual | Yes |
| DB constraint violation | Generic: "حدث خطأ غير متوقع. فريق الدعم أُخطر تلقائياً" | Full error in Sentry | Manual | Yes |
| Payment success, order fails | Compensation transaction inserted, customer never charged | Recovery queue in admin | Auto 3x then manual | Yes |

---

## N. Production-Ready End-to-End Flow

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 1: CONTENT SETUP (Admin Panel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Store/Catalog Admin:
  → Creates store (name, category, logo, cover, hours, delivery fee)
  → Creates menu categories (e.g. بيتزا, برغر, مشروبات)
  → Creates products (name, price in centimes, image, options: size/extra)
  → Sets products is_available = true
  → Activates store (status = 'active')

Promotions Admin:
  → Creates banner (image, placement: home_hero, linked store/category)
  → Sets start_at / end_at schedule
  → Activates banner

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 2: USER DISCOVERY (User App)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User opens app → onboarding (first time) → login/register
Home screen:
  → Promotions/banners loaded from `promotions` table (real data)
  → Category grid loaded from `categories` table
  → Featured stores loaded from `stores WHERE is_featured = true`
User taps category → Store list filtered by category
User taps store → Store detail + menu loaded from Supabase

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 3: ORDERING (User App)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User taps product → bottom sheet opens (options: size/supplements)
User selects options + qty → "إضافة للسلة"
Cart validates: same store only (cross-store = confirm clear)
User proceeds to checkout:
  → Real default address auto-loaded from user_addresses
  → Time slot selected
  → Payment: cash | wallet
  → Promo code applied (validated against promotions table)
User confirms → createOrder():
  → INSERT INTO orders (user_id, store_id, delivery_address, subtotal, total, status='pending')
  → INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
  → INSERT INTO order_status_events (order_id, status='pending', actor_type='customer')
  → If wallet payment: wallet_transactions debit
Cart cleared → Confirmation screen shown

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 4: OPERATIONS (Admin Panel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ops Admin receives real-time notification: new order badge
Opens Orders → filters pending → selects order
Reviews order detail → clicks "تعيين سائق"
Selects driver from available list (sorted by proximity)
Confirms assignment:
  → orders.status = 'confirmed', orders.driver_id = X, orders.assigned_at = now()
  → INSERT INTO order_status_events (status='confirmed', actor_type='admin')
  → Push notification → customer
  → Push notification → driver app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 5: DELIVERY (Driver App)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Driver receives push → opens driver app → accepts order
Driver drives to store → marks "تم الاستلام":
  → orders.status = 'picked_up', orders.picked_up_at = now()
  → order_status_events row
  → Push → customer: "السائق في طريقه إليك"
Driver arrives at customer → marks "تم التوصيل":
  → orders.status = 'delivered', orders.delivered_at = now()
  → order_status_events row
  → Push → customer: "تم التوصيل! كيف كانت تجربتك؟"
  → driver_earnings row created: gross = delivery fee

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 6: PAYMENT SETTLEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cash order:
  Ops Admin → Orders → marks payment_status = 'collected' after COD confirmed
  Audit log entry

Wallet order:
  Already deducted at order creation (Step 3)
  Settlement on delivery confirmation (automatic trigger)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 STEP 7: POST-DELIVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Customer optionally rates order (1-5 stars + comment)
If issue: customer opens support ticket
  → Support Agent handles → may escalate to Finance for refund
  → Finance Admin approves refund → wallet credit
If driver payout:
  → Finance Admin reviews driver_earnings batch
  → Creates payout_request (or bulk processes)
  → Marks driver_earnings.status = 'paid'
```

---

## O. Implementation Phases

### Phase A — User App (Current Status: ~85% complete)

**Remaining before Phase A is truly production-ready:**

| Task | Priority | Notes |
|---|---|---|
| Fix dual API conflict (`lib/api.ts` vs `lib/orderApi.ts`) | Critical | `hooks/useOrder.ts` must be updated to use `lib/orderApi.ts` |
| Real-time order status tracking | High | Wire `subscribeToOrder` to tracking screen |
| Offline/no-internet banner | High | `@react-native-community/netinfo` |
| Push notification setup | High | `expo-notifications` + Supabase Edge Function trigger |
| Terms/Privacy static screen | Medium | Required by App Store + Moroccan law |
| Delete account flow | Medium | Required by Apple App Store (mandatory) |
| Cart clear confirmation dialog | Medium | Currently silent |
| Promotions table wired to home banners | Medium | Currently hardcoded |
| Language switcher (Arabic/Français/Darija) | Low | i18n infrastructure (i18n-js or i18next) |
| Avatar upload (expo-image-picker + Storage) | Low | Nice-to-have for Phase A close-out |

### Phase B — Admin Panel (Not started)

**Build order (each step shippable independently):**

1. **B1 — Project Setup:** Next.js 14 + shadcn/ui + TanStack Table + React Query + Supabase SSR client
2. **B2 — Admin Auth:** Login page + middleware protection + `admin_users` table check
3. **B3 — Dashboard:** KPI cards + real-time order count + charts (Recharts)
4. **B4 — Orders:** Table + filters + detail drawer + driver assignment modal
5. **B5 — Stores + Products + Categories:** CRUD forms + image upload + availability toggles
6. **B6 — Users + Drivers:** Management tables + driver document review workflow
7. **B7 — Wallets + Payments + Refunds:** Finance workflows + re-authentication
8. **B8 — Support Tickets:** Ticket management + WhatsApp deep-link
9. **B9 — Promotions/Banners:** Banner creator + scheduling + app placement configuration
10. **B10 — Roles & Permissions:** RBAC management UI
11. **B11 — Audit Logs:** Append-only log viewer + JSON diff
12. **B12 — Settings + Security:** App configuration + session management

### Phase C — Driver App (Not started)

**Build order:**

1. New Expo project in `driver-app/`
2. Auth (phone/OTP) + pending approval screen
3. Document upload (camera + gallery picker + Supabase Storage)
4. Dashboard: online/offline toggle + assigned orders list
5. Active delivery: step-by-step status updates (accepted → at store → picked up → delivered)
6. Order detail: customer address on map, contact buttons
7. Earnings dashboard + payout request form
8. Profile + settings + support

### Phase D — DB Migrations (Alongside each phase)

- **Migration 003:** Run at start of Phase B — adds all new tables from Section L
- **Migration 004:** Run at start of Phase C — adds driver location tracking, push token storage
- **Migration 005:** Payment gateway integration tables (when CMI/PayZone/Stripe is selected)

---

## P. First Coding Batch Recommendation

The single safest and highest-value first step for Phase B:

### Step 1: Admin Project Bootstrap
```bash
# In repo root
npx create-next-app@latest admin --typescript --tailwind --app --no-src-dir
cd admin
npx shadcn@latest init
npx shadcn@latest add button card table badge input label form toast dialog
pnpm add @supabase/supabase-js @supabase/ssr @tanstack/react-query @tanstack/react-table
pnpm add react-hook-form @hookform/resolvers zod recharts
```

### Step 2: Admin Auth (before any other screen)
- `/app/(auth)/login/page.tsx` — email + password form
- `/lib/supabase/server.ts` — Supabase server client with service role key
- `/lib/supabase/client.ts` — browser client (anon key only)
- `/middleware.ts` — protect all `/dashboard/*` routes, check `admin_users` table
- Run Migration 003 (admin_users table) in Supabase SQL Editor

### Step 3: Dashboard
- KPI cards: Today orders, Active orders, Revenue, Pending drivers — all real Supabase queries
- Recent orders table with real data

### Step 4: Orders
- Full orders table with filters and status badges
- Order detail drawer with driver assignment modal
- Wire to existing `orders` + `order_items` tables

**Why this order:**
- Auth + middleware first → impossible to accidentally ship an unprotected admin page
- Real data from Day 1 → no fake data to clean up later
- Orders is the highest daily-value screen → proves the system works end-to-end immediately

**What NOT to do first:**
- Do not start with settings or roles — no value until basic CRUD works
- Do not build the promotions screen before orders — wrong priority
- Do not skip the middleware step — security first, always

---

*End of JAHEEZ Architecture Document*
*For current user app screen inventory and design tokens, see `replit.md`*
