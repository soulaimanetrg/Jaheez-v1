# JAHEEZ — Full Platform Workflow (Source of Truth)

> **Status:** Living document. Last revised **2026-05-03**.
> **Supersedes:** the legacy phase docs in `docs/BUILD_PHASES.md`, `docs/EXECUTION_PLAYBOOK.md`, `docs/CLAUDE_WORKFLOW.md`, `docs/ANTIGRAVITY_WORKFLOW.md` (kept for historical reference only).
> **Companion docs (still authoritative for their narrow scope):**
> - `JAHEEZ_FULL_SPEC.txt` — the original product specification (sections 1–13). Treat as the contract.
> - `GAP_ANALYSIS.md` — the live, per-feature audit grid against the spec.
> - `replit.md` — environment, secrets, workflows, and language/locale rules.
> - `JAHEEZ_ARCHITECTURE.md` — long-form architecture reference.
> - `supabase_schema.sql` + `supabase_migrations/*` — canonical DB schema.

---

## 1. Project Overview

JAHEEZ (جاهز) is a Morocco-first multi-service delivery & errand super-platform. The pilot city is **Safi**; the data model already supports multi-city expansion (`cities` table). The platform spans:

- **User App** (Expo / React Native, web preview on `:8081` via the proxy on `:5000`)
- **Driver App** (Expo / React Native, web preview on `:8000`, served via `/driver/` on the proxy)
- **Admin Panel** (Vite + React, served on `:3000`, exposed via `/admin/` on the proxy)
- **Admin API** (Express on `:3001`, exposed via `/admin-api/` on the proxy)
- **Backend** (Supabase Postgres for shared data; local Postgres for admin-only tables)
- **Wallet & Payment** (centimes-only ledger, COD + wallet today, gateway-ready)

UI primary language is **French** (FR-MA, MAD currency). Arabic and English are secondary. Money is **always integer centimes**. There are **no AI/ML features** anywhere (recommendation, scoring, moderation). ModernMT is allowed because it is pure machine translation, not recommendation/scoring.

---

## 2. Final Product Direction

| Pillar | Decision |
|---|---|
| Geography | Safi first, multi-city ready (`cities` table exists) |
| Brand | Red `#F03030 → #C42020 → #9A0000` gradient, Yellow `#FFD24A`, warm white surfaces, Cairo font |
| Inspiration | Glovo-class UX clarity for service discovery — **never copy assets or layout** |
| Languages | FR primary, AR secondary (RTL on AR fields only, never on the page chrome), EN tertiary |
| Money | Integer **centimes** end-to-end, double-entry ledger via `wallet_transactions` |
| Payments | COD + Wallet today; CMI / PayZone integration scheduled for Phase 6 |
| AI | None. ModernMT (translation only) is the single permitted exception |
| Icons | `lucide-react-native` / `lucide-react`. **No emoji** as final UI icons (admin labels can keep them) |
| Realtime | Supabase Realtime for orders/chat with a 30-second polling fallback |
| Notifications | Expo Push API; templates AR + FR per status |

---

## 3. Platform Apps & Modules

### 3.1 Included
- User App, Driver App, Admin Panel, Admin API, Supabase backend, local Postgres, proxy router.
- Wallet, COD ledger, refunds, payouts, audit log, support tickets, push, in-app inbox, FAQ.

### 3.2 Excluded (out of scope for now)
- AI/ML of any kind (scoring, moderation, recommendations, chatbots).
- Restaurant POS integration.
- Loyalty/points program (not in spec; revisit post-launch).
- Multi-currency.

---

## 4. Repository Layout (current, monorepo)

```
/                         pnpm/npm root, proxy lives here
├── user-app/             Expo 55 + Expo Router v3 (TypeScript)
├── driver-app/           Expo 55 + Expo Router v3 (TypeScript) — served at /driver/
├── admin/                Vite 5 + React 18 (TypeScript)
├── scripts/
│   ├── proxy.js          :5000 router → 8081 / 8000 / 3000 / 3001
│   ├── admin-api.js      Express API for admin and driver
│   └── seed-stores.js    Local seed
├── shared/               Cross-app TS types, constants, status enums
├── supabase_schema.sql   Canonical DDL (idempotent)
├── supabase_migrations/  Numbered migrations (012+ live here)
├── docs/                 This file + supporting docs
└── attached_assets/      Brand assets, icon set
```

Folder rules:
- Each Expo app keeps its own `node_modules` (driver-app must keep React deduplicated against root via the metro `blockList` in `driver-app/metro.config.js`; **must not** drop the `zustand → CJS` web resolver — see lessons learned §17).
- `shared/` may only export pure TypeScript (types, constants, status enums, money helpers). No React, no Expo.

---

## 5. Design System

- Source: `design/`, `attached_assets/`, `jaheez icons/`.
- Components in user app: `user-app/components/ui/*` (`TText`, `MapMarker`, `StatusBadge`, etc.). Mirror in `driver-app/components/`.
- Colors via `BRAND.*` constants — never hardcode hex outside the tokens file.
- Shadows: `SHADOW`, `SHADOW_SM`, `SHADOW_LG`, `SHADOW_RED`.
- Hero: `LinearGradient colors={['#F03030', '#C42020', '#9A0000']}`.
- Animations: `moti` + `react-native-reanimated` (worklets v0.5 — version-pin stays).
- Empty / loading / error states are **mandatory** for every screen with data.

---

## 6. User App — Screen Inventory & Status

Routes live under `user-app/app/*` (Expo Router). Status reflects what is currently in the tree.

| Group | Route | Status | Notes |
|---|---|---|---|
| auth | `(auth)/splash.tsx` | ✅ | Verify 1.5 s minimum, 8 s timeout, silent token refresh |
| auth | `(auth)/onboarding.tsx` | ✅ | 3 slides + language picker |
| auth | `(auth)/welcome.tsx` | ✅ | |
| auth | `(auth)/register.tsx` | ✅ | Verify libphonenumber-js MA + `terms_accepted` required |
| auth | `(auth)/login.tsx` | ✅ | |
| auth | `(auth)/otp.tsx` | ✅ | Infobip backed |
| flows | `(flows)/delete-account.tsx` | ✅ | Spec 2.3.7 — multi-step with OTP re-verify and 30-day purge |
| tabs | `(tabs)/index.tsx` | ✅ | Home — AI banner removed 2026-05-03 |
| tabs | `(tabs)/search.tsx` | ✅ | Verify recent searches in AsyncStorage, 350 ms debounce |
| tabs | `(tabs)/orders.tsx` | ✅ | |
| tabs | `(tabs)/chat.tsx` | ✅ | |
| tabs | `(tabs)/wallet.tsx` | 🟡 | Add promo-credit breakdown, transaction-detail modal, top-up CTA placeholder |
| tabs | `(tabs)/profile.tsx` | ✅ | |
| flows | `(flows)/category/[id].tsx` | ✅ | Store list by category |
| flows | `(flows)/store/[id].tsx` | ✅ | |
| flows | `(flows)/cart.tsx` | ✅ | |
| flows | `(flows)/checkout.tsx` | ✅ | Verify zone validation against `delivery_zones` |
| flows | `(flows)/custom-request.tsx` | ✅ | Errand flow |
| flows | `(flows)/package-delivery.tsx` | ❌ | **Missing** — split from custom-request, fields: receiver_name/phone, package_type, is_fragile, COD-by-receiver |
| flows | `(flows)/order/[id].tsx` | ✅ | |
| flows | `(flows)/tracking/[id].tsx` | ✅ | Realtime + 30 s polling fallback |
| flows | `(flows)/confirmation.tsx` | ✅ | |
| flows | `(flows)/payment-success.tsx` | ✅ | |
| flows | `(flows)/notifications.tsx` | ✅ | In-app inbox |
| flows | `(flows)/chat/[id].tsx` | ✅ | |
| flows | `(flows)/addresses.tsx` | ✅ | |
| flows | `(flows)/favorites.tsx` | ✅ | |
| flows | `(flows)/settings.tsx` | ✅ | |
| flows | `(flows)/profile-edit.tsx` | ✅ | |
| flows | `(flows)/payment-methods.tsx` | ✅ | |
| flows | `(flows)/support-ticket.tsx` | ✅ | |
| flows | `(flows)/faq.tsx` | ✅ | Static curated Q&A (replaces former AI screen) |
| flows | `(flows)/terms.tsx` | ✅ | T&C + Privacy |
| app-wide | `MaintenanceBanner` | ✅ | Mounted in `_layout.tsx`; reads `app_settings` |
| app-wide | `ForceUpdateModal` | ✅ | semver compared against `Constants.expoConfig.version` |
| app-wide | Cities dropdown | ❌ | Currently hardcoded "Safi" — must read `/admin-api/cities/public` |

---

## 7. Driver App — Screen Inventory & Status

Routes live under `driver-app/app/*`.

| Group | Route | Status | Notes |
|---|---|---|---|
| root | `index.tsx` | ✅ | Splash / route-guard |
| auth | `(auth)/welcome.tsx` | ✅ | |
| auth | `(auth)/login.tsx` | ✅ | Phone + OTP |
| auth | `(auth)/register.tsx` | 🟡 | Single-step today; spec wants Personal → Vehicle → Documents → Review wizard |
| auth | `(auth)/otp.tsx` | ✅ | |
| auth | `(auth)/pending.tsx` | ✅ | Full-screen KYC status gate (pending / partial / rejected). Route gate redirects rejected drivers here automatically. |
| tabs | `(tabs)/index.tsx` | ✅ | Dashboard: online/offline, today summary, available/mine/history sections |
| tabs | `(tabs)/earnings.tsx` | ✅ | Period tabs, COD, payout history |
| tabs | `(tabs)/profile.tsx` | ✅ | KYC docs, RIB, bank |
| flows | `(flows)/active-delivery.tsx` | 🟡 | 5-stage flow ✅ ; 45 s accept countdown ✅ (in dashboard) ; issue reporting ✅ (modal + `/driver/orders/:id/issue` endpoint). Remaining: real-time chat handoff to support. |
| flows | `(flows)/payout-request.tsx` | ✅ | RIB validation pending |
| flows | `(flows)/document-upload.tsx` | ❌ | **Missing** — per-document upload + status (id_card / license / vehicle reg) |

---

## 8. Admin Panel — Module Inventory & Status

Pages live under `admin/src/pages/*`.

| Module | File | Status |
|---|---|---|
| Login | `Login.tsx` | ✅ Hardened — lockout, remember-me 30 d, 4 h idle, error_code |
| Dashboard | `Dashboard.tsx` | ✅ |
| Analytics | `Analytics.tsx` | ✅ |
| Orders | `Orders.tsx` | 🟡 add bulk assign + CSV export, structured timeline, internal notes |
| Stores | `Stores.tsx` | 🟡 add lat/lng map picker, opening_hours per day |
| Products | `Products.tsx` | 🟡 add bulk actions, duplicate, archive |
| Categories | `Categories.tsx` | ✅ tree view with type filter |
| Promotions | `Promotions.tsx` | ✅ |
| Banners | `Banners.tsx` | ✅ |
| Users | `Users.tsx` | 🟡 detail tabs (Profile / Orders / Wallet / Addresses / Support / Activity) + soft-delete UI |
| Drivers | `Drivers.tsx` | 🟡 per-document approve/reject with reason |
| Wallets | `Wallets.tsx` | ✅ atomic admin adjust + freeze (RPC `admin_wallet_adjust`) |
| Refunds | `Refunds.tsx` | ✅ status workflow + atomic wallet credit |
| Payouts | `Payouts.tsx` | 🟡 finalise statuses pending → processing → paid/rejected |
| Cities | `Cities.tsx` | ✅ |
| Zones | `Zones.tsx` | 🟡 add polygon picker + city FK |
| Reviews | `Reviews.tsx` | ✅ |
| Notifications | `Notifications.tsx` | ✅ broadcast + segment by city |
| Support | `Support.tsx` | 🟡 add assign-to-admin + thread + internal notes |
| Settings | `Settings.tsx` | 🟡 add `min_required_version_*`, AR/FR maintenance message fields |
| Admins | `Admins.tsx` | ✅ super_admin / operations / finance / support / content_manager |
| AuditLogs | `AuditLogs.tsx` | ✅ super_admin only |
| Content CMS | _missing_ | ❌ home sections, onboarding text, app notices, FAQ admin, T&C |

### 8.1 Standard fields for every admin CRUD screen
1. List view: search, filter chips, sort, pagination, row actions menu, bulk-action bar.
2. Detail/Edit: tabbed layout when > 6 fields, validation via zod, optimistic UI with rollback.
3. Confirm dialogs for destructive actions and any money move.
4. Every mutation calls `auditStrict()` — failure surfaces a manual-reconciliation banner.
5. RBAC enforced **server-side** via `requireRole()` middleware in `scripts/admin-api.js`.

---

## 9. Wallet & Payment System

- All money in **integer centimes**. Helpers in `shared/`.
- Tables: `wallets`, `wallet_transactions` (ledger), `refunds`, `payout_requests`, `cod_settlements`.
- Atomic admin adjust: Postgres RPC `admin_wallet_adjust(p_user_id, p_delta, p_tx_type, p_label, p_sublabel, p_ref_id)` — locks the wallet `FOR UPDATE`, updates balance, writes ledger row in one transaction. `SECURITY DEFINER`, callable only by `service_role`. Wallet RLS is read-only for end users.
- **Promo credits separation:** add `wallets.promo_balance_centimes` + dedicated ledger `direction='promo'`. UI must show two pots.
- **Refund status machine:** `requested → approved → processing → completed | failed` (or `denied` from `requested`).
- **Payout status machine:** `pending → processing → paid | rejected`.
- **COD settlement:** per driver per order; admin marks settled with timestamp + notes.
- **Future gateways:** add nullable columns `payment_gateway`, `payment_gateway_txn_id`, `payment_gateway_status` on `orders`. Implementation deferred.

---

## 10. Backend / Database Status

| Table | Status |
|---|---|
| users, user_addresses, stores, menu_items, menu_categories | ✅ |
| orders, order_items | ✅ |
| order_status_events | 🟡 enforce a row per status change |
| drivers, driver_documents | ✅ |
| wallets, wallet_transactions | ✅ |
| refunds, payout_requests, cod_settlements | ✅ |
| notifications, chat_messages | ✅ |
| store_reviews, favorites, support_requests | ✅ |
| promotions, banners | ✅ |
| delivery_zones | 🟡 add `polygon GEOGRAPHY(POLYGON,4326)` + `city_id` FK |
| cities, service_categories | ✅ |
| admins, audit_log, app_settings | ✅ |
| app_notices, faqs | ❌ for content CMS |
| promo_redemptions | ❌ to enforce one-time codes per user |

Status machines (single source of truth):

| Entity | States |
|---|---|
| Order | `pending → confirmed → preparing → ready → assigned → picked_up → arrived_pickup → arrived_customer → delivered → completed` (+ `cancelled / refunded / issue`) |
| Driver | `pending_approval → approved | rejected → online ↔ offline → suspended` |
| Refund | `requested → approved | denied → processing → completed | failed` |
| Payout | `pending → processing → paid | rejected` |
| Driver document | `uploaded → under_review → approved | rejected` |
| Support ticket | `open → in_progress → escalated → pending_user → closed` |

---

## 11. Roles & Permissions

Roles: `super_admin`, `operations`, `finance`, `support`, `content_manager` (legacy `admin`/`operator`/`manager` map to `operations`).

| Permission | super_admin | operations | finance | support | content_manager |
|---|---|---|---|---|---|
| Manage admin users | ✅ | | | | |
| View audit logs | ✅ | | | | |
| Adjust wallet | ✅ | | ✅ | | |
| Issue refund | ✅ | | ✅ | | |
| Approve driver / docs | ✅ | ✅ | | | |
| Orders / stores / products / users / zones | ✅ | ✅ | | | |
| Support tickets / reviews | ✅ | | | ✅ | |
| Banners / categories / promos / notifications / FAQ | ✅ | | | | ✅ |

Login redirects by role: `defaultPathForRole(role)` already in `admin/src/store/authStore.ts`.

---

## 12. Notifications

- Push via Expo Push API.
- Per-user prefs: orders / promos / driver / support (add to `users.notification_prefs JSONB`).
- Templates stored AR + FR per status; verify rendering for every order transition.
- Broadcaster: all / segment by city / segment by user list.
- In-app inbox: `notifications` table + `(flows)/notifications.tsx`.
- Delivery counts logged to `notifications_log`.

---

## 13. UI Components Required

Reusable components shared across user app and driver app (`*/components/ui/`):
`TText`, `Button`, `IconButton`, `Input`, `PhoneInput`, `Select`, `Chip`, `Card`, `EmptyState`, `LoadingState`, `ErrorState`, `Toast`, `Sheet`, `Modal`, `OtpInput`, `MapMarker`, `StatusBadge`, `Money` (centimes → MAD formatter), `Avatar`, `Tabs`, `SegmentedControl`, `RTLContainer`.

Animation rules:
- Page transitions ≤ 300 ms.
- List entry: `moti` stagger 40 ms, fade + 8 px y-translate.
- Buttons: pressed scale 0.97, 120 ms.
- Skeletons for any list with > 200 ms of expected wait.

---

## 14. Dependencies (locked categories)

- Expo 55, React Native 0.83.6, React 19.
- Expo Router v3.
- Zustand for stores; **on web, force CJS for `zustand` via metro `resolveRequest`** in both `user-app/metro.config.js` and `driver-app/metro.config.js` (see §17 lesson learned).
- TanStack Query for server state.
- `react-hook-form` + `zod` + `@hookform/resolvers`.
- `moti` + `react-native-reanimated`.
- `lucide-react-native` (mobile), `lucide-react` (admin).
- `date-fns` with `fr` locale.
- `libphonenumber-js` (MA).
- Stripe SDK present (`stripeClient.ts`) but disabled in production until CMI/PayZone path is decided.
- Admin: Vite 5, Tailwind 3, React Router v6, Zustand persisted in `localStorage`.

---

## 15. Implementation Phases

> The phases below are the **remaining** work. Phases 0–4 (audit, monorepo, shared utils, design system, schema) are already done.

| # | Sprint | Outcome | Estimate |
|---|---|---|---|
| 5.1 | Driver app completion | document-upload, pending/rejected/suspended screens, multi-step register wizard, wire 5-stage active-delivery + 45 s countdown | 1.5 wk |
| 5.2 | Admin completeness | Order timeline + internal notes + bulk assign + CSV; per-doc driver review with reasons; user detail tabs; store map picker + opening hours; zone polygon picker | 2 wk |
| 5.3 | Content CMS | `app_notices`, `faqs`, home sections, onboarding text, T&C in admin | 1 wk |
| 5.4 | Wallet promo split | `promo_balance_centimes` + ledger `direction` + UI breakdown in user app + admin | 0.5 wk |
| 5.5 | User app polish | dedicated package-delivery flow; cities dropdown from API; wallet promo UI; transaction detail modal | 1 wk |
| 5.6 | Notifications | per-user prefs, AR/FR template verification, segmentation by user list | 0.5 wk |
| 5.7 | Edge cases (spec §12) | auto-refund on store reject, mid-delivery offline alert, customer-not-present timer, promo abuse via `promo_redemptions`, optimistic locking via `updated_at` | 1 wk |
| 6 | Payment gateway | CMI / PayZone integration with proper txn records and rollback | 2 wk |
| 7 | Hardening & launch | E2E, load test, security review, store submission | 2 wk |

Each sprint is gated by the testing checklist below.

---

## 16. Testing & Acceptance Gates

### 16.1 Per-feature checklist
- Empty state, loading state, error state visible.
- French strings validated; AR/EN keys present.
- RTL only on AR input fields, never on chrome.
- All money via the centimes formatter — no string concat.
- Mutations write `audit_log`; failure surfaces banner.
- Server-side RBAC verified with a non-privileged token.

### 16.2 Expo preview checklist (user-app & driver-app)
- Boots on `:5000/` and `:5000/driver/` via the proxy.
- Splash → first interactive screen ≤ 3 s on warm start.
- No `import.meta` SyntaxError in the bundle (zustand CJS guard, see §17).
- React deduplicated against root (`metro.config.js` blockList).
- AR toggle round-trips and persists.
- Push permission prompt fires once, token saved to `users.push_token`.

### 16.3 Admin testing checklist
- Login → role-correct redirect.
- Lockout after 3 wrong attempts (10 min).
- Idle timeout 4 h; remember-me 30 d.
- Every CRUD: create, edit, delete (or archive), filter, paginate, RBAC denial path.
- Money moves write a `wallet_transactions` row + `audit_log` row; failure surfaces a manual-reconciliation message.
- CSV exports open cleanly in Excel-fr.

### 16.4 Backend / API testing
- Migrations apply on a clean DB (idempotent).
- `service_role` key only used server-side; never shipped to a client.
- RPCs callable only by `service_role`; defence-in-depth assertion in body.
- Realtime channel for `orders` updates within 1 s on staging.
- Public endpoints: `/cities/public`, `/app-settings/public` reachable without auth.

### 16.5 Acceptance criteria for v1 launch
- All Phase 5 sprints green on the checklists above.
- GAP_ANALYSIS.md shows zero ❌ in Wallet & Payment, Audit log, Driver app MVP.
- 30-day PII purge cron registered on staging Supabase.
- One full happy-path order delivered end-to-end on staging (place → assign → pick up → deliver → wallet/COD reconcile).
- One refund happy path executed by `finance` role.

---

## 17. Lessons Learned (do-not-repeat list)

1. **Driver-app `zustand` web bundle.** Zustand 4.x ships an ESM build that uses `import.meta.env`. Browsers reject `import.meta` in non-module script tags, so the bundle silently fails and the page is blank. The user-app has a metro `resolveRequest` that pins `zustand` and `zustand/*` to the local CJS files; the driver-app must keep the same guard but pointing at its **own** `node_modules/zustand` (so React deduplication still holds).
2. **React duplication on driver-app.** Driver-app must keep the metro `blockList` for `monorepoRoot/node_modules/react(-dom)` and `user-app/node_modules/react(-dom)`, plus `nodeModulesPaths = [driver-app/node_modules]`.
3. **expo-router stripBaseUrl patch** — driver-app uses `experiments.baseUrl="/driver"`; the patched `getStateFromPath-forks.js` is required and is gitignored in node_modules.
4. **Admin role names.** Use `super_admin / operations / finance / support / content_manager`. Map legacy `admin / operator / manager` → `operations`.
5. **Money never in floats.** Always centimes integers, formatted at the edge.
6. **No RTL on page chrome** — only on AR input fields. `dir="rtl"` on a layout breaks tooltips and modal positioning.
7. **No emoji as final UI icons.** Use Lucide.

---

## 18. AI / Replit Agent Coding Rules

- Never introduce AI/ML dependencies. ModernMT (translation) is the single allowed exception.
- Never write money logic outside the centimes ledger; never short-circuit `auditStrict`.
- Never edit env vars inline — use the environment-secrets skill.
- Never duplicate schema between `supabase_schema.sql` and `supabase_migrations/*` without mirroring both.
- Never run destructive git commands directly — delegate per the project_tasks skill.
- Always test affected user flows after a code change (the testing skill).
- Always update `replit.md` and this file when architectural decisions change.
- Always prefer editing existing files; never create new docs unless explicitly asked.

---

## 19. Source-of-Truth Map

| Question | Answer lives in |
|---|---|
| What is the product spec? | `JAHEEZ_FULL_SPEC.txt` |
| What is built today, what is missing? | `GAP_ANALYSIS.md` |
| How do I build it / in what order? | **this file** |
| Architecture deep-dive | `JAHEEZ_ARCHITECTURE.md` |
| Schema | `supabase_schema.sql` + `supabase_migrations/*` |
| Env, secrets, workflows, locale rules | `replit.md` |
