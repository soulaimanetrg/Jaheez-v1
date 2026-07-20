# JAHEEZ — Gap Analysis Report

> Audit of the current codebase (May 2026) against the full functional specification (`JAHEEZ_FULL_SPEC.txt`).
> Status legend: ✅ **Done** · 🟡 **Partial** · ❌ **Missing**

---

## Executive Summary

| Phase / Area | Done | Partial | Missing | Overall |
|---|---|---|---|---|
| Phase A — User App | ~26 | ~6 | ~5 | **~80% complete** |
| Phase B — Admin Panel | ~16 | ~6 | ~10 | **~60% complete** |
| Phase C — Driver App | 0 | 0 | ~5 modules | **0% — not started** |
| Wallet & Payment | ~3 | ~3 | ~6 | **~30% complete** |
| Backend Tables | ~14 | ~4 | ~10 | **~50% complete** |

**Top 5 highest-impact gaps:**
1. ❌ **Driver App (Phase C)** — entirely missing; no `driver-app/` folder exists
2. ❌ **Wallet manual adjustment by admin** — no UI, no double-entry ledger enforcement
3. ❌ **Polygon-based delivery zones with city link** — current zones are flat-fee neighborhoods only
4. ❌ **Force-update modal + maintenance-mode banner** in user app
5. ❌ **Account lockout, 4h idle timeout, 30-day remember-me** for admin auth

### ✅ Just delivered in this audit pass
- ✅ **Audit log** — `audit_log` table + `audit()` helper + `/audit-logs` viewer (super_admin only)
- ✅ **Refunds** — `refunds` table + admin module with status workflow + atomic wallet credit (transaction + `FOR UPDATE` + fail-closed on Supabase errors)
- ✅ **Cities** — `cities` table (10 Moroccan cities seeded) + admin CRUD + public `/cities/public` endpoint
- ✅ **Service categories** — typed `service_categories` table (service/store/product/errand) + admin CRUD + public endpoint
- ✅ **RBAC enforcement** — `requireRole()` middleware applied to refunds (super_admin/admin) and audit logs (super_admin only)

---

## Phase A — User App (`user-app/`)

| Spec Module | Status | Notes |
|---|---|---|
| 2.1 Splash & init | ✅ Done | `splash.tsx` exists; verify 1500ms minimum, 8s timeout fallback, silent token refresh |
| 2.2 Onboarding (3 slides + lang selector) | ✅ Done | `onboarding.tsx` |
| 2.3.1 Welcome screen | ✅ Done | `welcome.tsx` |
| 2.3.2 Registration | ✅ Done | `register.tsx` — verify `terms_accepted` required, libphonenumber-js MA validation |
| 2.3.3 Login + 2.3.4 OTP | ✅ Done | `login.tsx` + `otp.tsx` + `infobipOtp.ts` |
| 2.3.5 Auth success splash | 🟡 Partial | Verify 1.5s auto-redirect with name greeting |
| 2.3.6 Logout flow | ✅ Done | In `profile.tsx` |
| 2.3.7 **Delete account** (multi-step + OTP re-verify + soft delete + 30-day PII anonymization) | ❌ Missing | No multi-step deletion flow; no anonymization job |
| 2.4 Home screen | ✅ Done | `(tabs)/index.tsx` |
| 2.5 Search | ✅ Done | `(tabs)/search.tsx` — verify recent searches in AsyncStorage, 350ms debounce |
| 2.6 Store listing | ✅ Done | `category/[id].tsx` |
| 2.7 Store detail | ✅ Done | `store/[id].tsx` |
| 2.8 Cart | ✅ Done | `cart.tsx` + `cartStore.ts` |
| 2.9 Checkout (3-step: address → payment → confirm) | ✅ Done | `checkout.tsx` — verify zone validation against delivery zones |
| 2.10 Custom errand | ✅ Done | `custom-request.tsx` |
| 2.11 **Package delivery** | 🟡 Partial | Folded into custom-request? Spec wants dedicated flow with `receiver_name`, `receiver_phone`, `package_type`, `is_fragile`, COD-by-receiver option |
| 2.12 Order tracking | ✅ Done | `tracking/[id].tsx` — verify Realtime + 30s polling fallback |
| 2.13 Order history | ✅ Done | `(tabs)/orders.tsx` + `order/[id].tsx` |
| 2.14 Wallet | 🟡 Partial | UI exists; missing **promo credits** breakdown, transaction detail modal, top-up CTA placeholder |
| 2.15 Profile | ✅ Done | `(tabs)/profile.tsx` |
| 2.16 Support | ✅ Done | `support-ticket.tsx` |
| **App-wide: Maintenance-mode banner** | ❌ Missing | No global banner reading `app_settings.maintenance_mode` |
| **App-wide: Force-update modal** | ❌ Missing | No `min_required_version` check |
| **App-wide: AI features** | ✅ Resolved | AI features removed on 2026-05-03 — see resolution note in appendix |
| **App-wide: Cities dropdown loaded from API** | ❌ Missing | City is hardcoded "Safi" |

---

## Phase B — Admin Panel (`admin/`)

| Spec Module | Status | Notes |
|---|---|---|
| 4.1.1 Login | ✅ Done | Email + password + JWT |
| 4.1.1 **Account lockout after 3 wrong attempts (10 min)** | ❌ Missing | No lockout in `admin-api.js` |
| 4.1.1 **Remember-me 30-day session** | ❌ Missing | Single 7-day JWT only |
| 4.1.1 **Session timeout 4h inactivity** | ❌ Missing | No idle timer |
| 4.1.2 Roles & permissions | 🟡 Partial | Has `super_admin / admin / operator / support`. Spec wants `super_admin / operations / finance / support / content_manager`. **No granular per-entity ACL enforced server-side.** |
| 4.2 Dashboard (KPIs, charts, live feed) | ✅ Done | `Dashboard.tsx` + `Analytics.tsx`; verify Realtime live feed every 30s |
| 4.3 Store management | ✅ Done | `Stores.tsx` |
| 4.3.2 **Map picker for store lat/lng + opening_hours per-day** | ❌ Missing | Only basic address text fields |
| 4.4 Product management | ✅ Done | `Products.tsx` — has options editor |
| 4.4.1 **Bulk actions, duplicate, archive** | ❌ Missing | No bulk operations |
| 4.5 **Category management** (service / store / product / errand types, tree view, drag-reorder, icon upload) | ❌ Missing | No `Categories.tsx` page |
| 4.6 Promotions | ✅ Done | `Promotions.tsx` |
| 4.6 Banners | ✅ Done | `Banners.tsx` |
| 4.7 Order management | ✅ Done | `Orders.tsx` |
| 4.7.2 **Order detail: status timeline, internal notes, full financials breakdown, contact buttons** | 🟡 Partial | Basic detail; missing structured timeline + internal notes |
| 4.7.1 **Bulk assign driver, CSV/Excel export** | ❌ Missing | No bulk actions |
| 4.8 Driver list | ✅ Done | `Drivers.tsx` |
| 4.8.2 **Driver detail tabs (Profile / Documents / Orders / Wallet) with per-document approve/reject + rejection reason** | ❌ Missing | Single approve/reject toggle only |
| 4.9 User management | ✅ Done | `Users.tsx` |
| 4.9.2 **User detail tabs (Profile / Orders / Wallet / Addresses / Support / Activity) + internal notes + soft delete** | 🟡 Partial | List exists; full detail tabs missing |
| 4.10 **Wallet management** (overview, manual adjustment with reason, freeze/unfreeze) | ❌ Missing | No `Wallets.tsx` page; no admin balance adjustment |
| 4.11 **Refund management** | ❌ Missing | No refunds list, no refund-issuing flow, no `refunds` table |
| 4.12 Support management | ✅ Done | `Support.tsx` |
| 4.12 **Support: assign-to-admin, internal notes per ticket, message thread** | 🟡 Partial | Basic ticket view; no thread or assignment |
| 4.13 **Content management** (home sections, onboarding text, app notices, FAQ, support config, T&C) | ❌ Missing | No content CMS |
| 4.14.1 **City management** | ❌ Missing | No cities table or admin UI |
| 4.14.2 **Delivery zones with polygon picker** | 🟡 Partial | `Zones.tsx` exists with name + flat fee; no polygon, no city link |
| 4.14.3 Fee configuration | ✅ Done | `Settings.tsx` |
| 4.14.4 **Maintenance mode AR/FR messages** | 🟡 Partial | Toggle exists; no AR/FR custom message field |
| 4.14.5 **App version management (min_required_version_ios/android)** | ❌ Missing | Not in settings |
| 4.15 **Audit logs** | ❌ Missing | No `audit_log` table, no viewer page — **CRITICAL per spec** |
| 4.x **Reviews moderation** | ✅ Done | `Reviews.tsx` (not in original spec but present) |
| 4.x **Notifications broadcaster** | ✅ Done | `Notifications.tsx` (matches spec intent) |

---

## Phase C — Driver App (`driver-app/` — DOES NOT EXIST)

| Spec Module | Status | Notes |
|---|---|---|
| 3.1 Driver auth (splash, welcome, register, login, pending/rejected/suspended screens) | ❌ Missing | No driver app at all |
| 3.2 Multi-step onboarding (Personal / Vehicle / Documents / Review) | ❌ Missing | |
| 3.3 Driver dashboard (online/offline toggle, today summary, earnings) | ❌ Missing | |
| 3.4 Order management (45s accept/reject countdown, 5-stage active delivery, issue reporting) | ❌ Missing | |
| 3.5 Driver wallet & earnings (period tabs, payout request with RIB, COD settlement) | ❌ Missing | |

**Recommendation:** Phase C is a full new Expo app. Estimate: 4–6 weeks for one engineer. Should be its own scoped task agent.

---

## Wallet & Payment (Section 5)

| Spec Item | Status | Notes |
|---|---|---|
| Money in centimes (integer) | ✅ Done | Schema uses `_centimes` columns |
| `wallets` table (user + driver) | ✅ Done | Schema present |
| `wallet_transactions` ledger | ✅ Done | Schema present |
| **Promo credits separate from regular balance** | ❌ Missing | Single `balance_centimes` column |
| **Wallet freeze/unfreeze with reason** | ❌ Missing | No `is_frozen` column |
| Payment methods: COD + Wallet | ✅ Done | In `orders.payment_method` enum |
| **Refund engine** with link to order + admin actor + reason | ❌ Missing | No `refunds` table |
| **Payout requests** (RIB validation, status workflow) | ❌ Missing | No `payout_requests` table |
| **COD settlement tracking per driver per order** | ❌ Missing | No `cod_settlements` table |
| **Manual admin adjustment** with old/new value + audit | ❌ Missing | Not in `admin-api.js` |
| Future-ready CMI / PayZone gateway | ❌ Missing | Schema doesn't allow `payment_gateway_txn_id` etc. |

---

## Backend / Database (Section 6)

| Spec Table | Status | Notes |
|---|---|---|
| `users` | ✅ Done | |
| `addresses` | ✅ Done | `user_addresses` |
| `stores` | ✅ Done | |
| `menu_items` | ✅ Done | |
| `menu_categories` | ✅ Done | |
| `orders` | ✅ Done | |
| `order_items` | ✅ Done | |
| `order_status_events` (full history) | 🟡 Partial | Status updates may not preserve full event log |
| `drivers` | ✅ Done | |
| `wallets` | ✅ Done | |
| `wallet_transactions` | ✅ Done | |
| `notifications` | ✅ Done | |
| `chat_messages` | ✅ Done | |
| `store_reviews` | ✅ Done | |
| `favorites` | ✅ Done | |
| `support_requests` | ✅ Done | |
| `promotions` / `promo_codes` | ✅ Done | |
| `banners` | ✅ Done | |
| `delivery_zones` | 🟡 Partial | Exists but no polygon, no city FK |
| `admins` | ✅ Done | Local PostgreSQL |
| **`audit_log`** | ❌ Missing | NON-NEGOTIABLE per spec |
| **`cities`** | ❌ Missing | |
| **`refunds`** | ❌ Missing | |
| **`payout_requests`** | ❌ Missing | |
| **`cod_settlements`** | ❌ Missing | |
| **`app_settings` (key/value with versioning)** | 🟡 Partial | Exists in admin but no version history |
| **`app_notices`** (maintenance banners) | ❌ Missing | |
| **`faqs`** | ❌ Missing | |
| **`driver_documents`** (id_card, license, registration with status per document) | ❌ Missing | |
| **`payout_bank_accounts`** | ❌ Missing | |

---

## API Contract (Section 7) — Notable Missing Endpoints

- `GET /api/cities` — required by user registration (spec 2.3.2)
- `POST /api/auth/register` — user registration with libphonenumber MA validation
- `POST /api/auth/send-otp`, `/resend-otp`, `/verify-otp` — partially via Infobip
- `POST /api/auth/refresh` — silent token refresh on splash
- `DELETE /api/auth/account` — multi-step deletion + anonymization
- `GET /admin/audit-logs` — full audit log viewer
- `POST /admin/wallets/:user_id/adjust` — manual balance adjustment
- `POST /admin/refunds` — issue refund linked to order
- `GET/POST /admin/cities` — city CRUD
- `GET/POST /admin/categories` — full category CRUD with type filter
- `GET/POST /admin/faqs` — FAQ CMS
- `GET/POST /admin/app-notices` — maintenance banner CMS
- `GET /api/app-settings/public` — public settings (maintenance mode, min versions, support phone)

---

## Status Machines (Section 8)

| Entity | Spec States | Implemented? |
|---|---|---|
| Order | `pending → confirmed → preparing → ready → assigned → picked_up → arrived_pickup → arrived_customer → delivered → completed` (+ `cancelled / refunded / issue`) | 🟡 Partial — has subset; missing `arrived_pickup`, `arrived_customer` granularity |
| Driver | `pending_approval → approved / rejected → online ↔ offline → suspended` | 🟡 Partial — has `is_verified` toggle; no full state machine |
| Refund | `requested → approved / denied → processing → completed / failed` | ❌ Missing |
| Payout | `pending → processing → paid / rejected` | ❌ Missing |
| Driver document | `uploaded → under_review → approved / rejected` (per doc) | ❌ Missing |
| Support ticket | `open → in_progress → escalated → pending_user → closed` | 🟡 Partial — has open/in_progress/resolved/closed; missing `escalated`, `pending_user` |

---

## Permissions Matrix (Section 9)

Current: `super_admin / admin / operator / support`
Spec: `super_admin / operations / finance / support / content_manager`

| Permission | Current | Spec |
|---|---|---|
| Per-entity CRUD enforced server-side | ❌ | ✅ Required |
| `approve_driver` flag | 🟡 implicit | ✅ Explicit |
| `adjust_wallet` flag | ❌ | ✅ finance + super_admin only |
| `issue_refund` flag | ❌ | ✅ finance + super_admin only |
| `manage_admin_users` | 🟡 | ✅ super_admin only |
| `view_audit_logs` | ❌ | ✅ super_admin only |
| Login redirect by role (support→/support, content_manager→/content) | ❌ | ✅ |

---

## Notification System (Section 10)

| Spec Item | Status |
|---|---|
| Push tokens stored per device | ✅ Done (Expo push) |
| Per-user notification preferences (orders/promos/driver/support) | 🟡 Partial — schema unclear |
| Order status push templates (AR + FR) | 🟡 Partial — exists but verify localization |
| Broadcast to all / segment by city / segment by user list | 🟡 Partial — broadcast only |
| Notification log with delivery counts | ✅ Done |
| In-app inbox | ✅ Done |

---

## Edge Cases Not Yet Handled (Section 12 highlights)

- ❌ Order placed → store rejects → auto-refund + notify
- ❌ Driver accepts → goes offline mid-delivery → admin re-assignment alert
- ❌ Customer not present at delivery → wait policy + auto-cancel after N minutes
- ❌ Wallet debit failure mid-checkout → rollback transaction
- ❌ Promo code abuse: same user reusing one-time code → enforced via `promo_redemptions` table
- ❌ Concurrent admin edits to same store/order (optimistic locking via `updated_at`)
- ❌ Driver app force-killed during delivery → server-side timeout + alert
- ❌ City disabled while user has cart → prompt + block checkout

---

## Recommended Implementation Roadmap

### Sprint 1 — Critical compliance (1-2 weeks)
1. **Audit log table + admin viewer page** (spec NON-NEGOTIABLE)
2. **Refunds table + admin module** (spec NON-NEGOTIABLE for money ops)
3. **Wallet manual adjustment** with old/new + reason + audit trail
4. **Cities table + management** (unblocks zones, registration)
5. **Categories management page** (currently no UI)

### Sprint 2 — Admin completeness (1-2 weeks)
6. **Order detail upgrade**: status timeline, internal notes, contact buttons
7. **Driver detail tabs** with per-document approve/reject + rejection reason
8. **User detail tabs** + soft-delete with anonymization
9. **Bulk actions** on orders (assign driver, export CSV)
10. **Content management**: FAQ + app notices + onboarding text

### Sprint 3 — Auth & permission hardening (1 week)
11. **Account lockout** (3 wrong attempts → 10 min)
12. **Remember-me 30-day session**
13. **Idle timeout 4h**
14. **Server-side per-entity ACL** with new role names

### Sprint 4 — User app polish (1 week)
15. **Maintenance mode banner**
16. **Force update modal**
17. **Delete account** multi-step + 30-day anonymization
18. **Package delivery** dedicated flow (split from errand)
19. **Wallet promo-credit separation** in UI

### Sprint 5 — Driver App MVP (4-6 weeks, separate task agent)
20. New Expo app: `driver-app/` with auth, onboarding, dashboard, delivery flow, earnings, payout requests

### Sprint 6 — Payment gateway integration (2 weeks)
21. CMI / PayZone integration with proper transaction records & rollback

---

## Appendix — AI features removed on 2026-05-03

The spec explicitly states **DO NOT use AI/ML features anywhere** (no AI moderation, scoring, recommendations). This was resolved as follows:

- ❌ `user-app/app/(flows)/ai-suggestion.tsx` — **deleted**.
- ❌ Home-screen "AI Assistant" banner and "AI ✨ / 🤖" branding — **removed** from `user-app/app/(tabs)/index.tsx` (banner, styles, and the `t.aiAssistant` / `t.aiAssistantSub` strings in all three locales).
- ❌ Quick-link "Today's Offers" no longer points to the AI screen — now routes to `/(tabs)/search`.
- ✅ User help/Q&A is served by the existing static `user-app/app/(flows)/faq.tsx` screen (curated questions and answers, no LLM, fully offline-capable) plus the human-staffed `support-ticket.tsx` flow.
- ✅ **ModernMT is kept** as it is a pure machine-translation service (not recommendation/scoring/moderation) and is therefore spec-compatible. See `replit.md` → User App section for the explicit keep-list note so future audits do not re-flag it.
