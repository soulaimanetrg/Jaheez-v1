# Jaheez UI Redesign Implementation Plan

Created: 2026-07-08

Purpose: convert `docs/DELIVERY_APP_UIUX_DETAIL_RESEARCH_AUDIT.md` into an implementation-ready plan for the whole Jaheez interface: User App, Driver App, and Admin Panel.

This is still a planning artifact. It does not implement screens. It defines the safest build order, component decisions, acceptance gates, and security boundaries for later code work.

## 1. Current UI Inventory Findings

### 1.1 Global Repo Shape

The current frontend surface is split across:

- `frontend/user-app`: Expo customer app with auth, home tabs, service/category flows, cart, checkout, tracking, profile, support, notifications, wallet, and settings.
- `frontend/driver-app`: Expo driver app with auth, dashboard, active delivery, profile, payout service, realtime/heartbeat hooks.
- `frontend/admin`: Vite/React admin panel with dashboard, orders, stores, users, support, settings, finance, payouts, COD, refunds, and auth.

The codebase already has reusable UI layers:

- User App: `frontend/user-app/components/ui/*`
- Driver App: `frontend/driver-app/components/ui/*`
- Admin: `frontend/admin/src/components/ui/*`

### 1.2 Security Boundary

The redesign must follow `docs/JAHEEZ_STRICT_AI_SECURITY_RULES.md`:

- Frontend renders UI, collects input, calls backend APIs, and subscribes to authorized socket events.
- Frontend must not calculate pricing, promos, delivery fees, finance, fraud, dispatch, payout, reliability, roles, permissions, or order state transitions.
- Frontend must not query Supabase business tables directly.
- Production UI must not contain mock/fallback stores, products, prices, orders, roles, users, or status transitions.

### 1.3 Brand Token Gap

Important foundation issue:

- `frontend/driver-app/constants/brand.ts` matches the warm Jaheez token direction more closely: `RED #F03030`, `YELLOW #F5CE2E`, `BG #FEFDF8`, `BORDER #E8E6DF`.
- `frontend/user-app/constants/brand.ts` currently uses a cooler/alternate palette in several core values: `RED #E8202A`, `YELLOW #F5C518`, `BG #FFFFFF`, slate text, rgba borders.

Decision:

- Before redesigning screens, align User App tokens with the project rulebook and Driver App warm tokens.
- Keep backward-compatible aliases only if needed, but route all new UI through canonical tokens.
- Admin theme already uses CSS variables for Jaheez red/yellow/warm backgrounds and can be tuned without changing architecture.

## 2. Component Inventory And Decisions

### 2.1 User App Components

Current strengths:

- `Button` already has variants, loading, disabled state, accessibility role/state, icon slot, and press feedback.
- `Input` already supports label, error, country code, password toggle, icons, RTL text direction, and focus state.
- `BottomSheet` exists and has overlay, drag handle, pan gesture, title, and keyboard avoiding wrapper.
- `StoreListCard` is image-led, animated, accessible, and already close to the restaurant-card pattern.
- `OrderCard` provides status badge, date, price display, and compact/full variants.

Needed changes:

- Standardize colors to canonical brand tokens; remove new hardcoded `#FFFFFF` and raw rgba values except tokenized aliases.
- Make `Card` border-first by default: white surface, 1px border, no default shadow.
- Add intentional shadow variants only for floating/active surfaces.
- Add `SearchBar`, `CategoryChip`, `FilterChip`, `SectionHeader`, `FloatingCartBar`, `ServiceCard`, and `ServiceDestinationLayout`.
- Review `OrderCard` for backend-safe money display and avoid showing internal/unsafe fields.
- Add explicit empty/loading/error/offline patterns to all screens using existing `EmptyState`, `SkeletonBox`, `Shimmer`, `OfflineBanner`.

### 2.2 Driver App Components

Current strengths:

- `Button` is closer to spec height/radius and has variants/loading/accessibility.
- Brand tokens match the project rulebook better than User App tokens.
- Core components mirror User App, which helps maintain consistency.

Needed changes:

- Reduce default elevation in `Card`; driver cards should be border-first except active offer/critical task cards.
- Keep primary driver CTAs large and unambiguous: accept, arrived, picked up, delivered, issue/support.
- Add operational card variants: `TaskOfferCard`, `RouteStopCard`, `ActiveDeliveryStatus`, `DriverActionFooter`.
- Add stronger offline/reconnecting state for active delivery and heartbeat/realtime issues.

### 2.3 Admin Components

Current strengths:

- Uses shadcn-like primitives: buttons, cards, table, tabs, sheet, dialog, badge, input, select, skeleton, tooltip.
- Theme variables already encode Jaheez red/yellow and warm background.
- Good base for dense operational UI.

Needed changes:

- Reduce default card shadow from `shadow` to border-only or `shadow-none` for operational pages.
- Prefer tables, filters, tabs, drawers, and badges over consumer-style cards.
- Add/reuse status badge system for orders, finance, drivers, risk, support, and stores.
- Standardize destructive/admin-sensitive action styling and confirmation dialogs.
- Keep admin layout utilitarian: compact spacing, high scanability, no marketing-style sections.

## 3. Canonical UI Rules To Implement

### 3.1 Shadow Budget

Default:

- No shadow on normal cards, inputs, list rows, product cards, admin tables, and filter chips.

Allowed soft elevation:

- Floating cart/request bar.
- Bottom navigation.
- Sticky header after scroll.
- Bottom sheet/modal.
- Active service card press/transition.
- Critical active driver task card.

Forbidden direction:

- Heavy shadow on every card.
- Nested shadowed cards.
- Decorative glows/orbs.
- Shadow as the only separator.

### 3.2 Surface System

Use these roles consistently:

- App background: warm white.
- Primary surface: white.
- Secondary surface: cream/light neutral.
- Border: warm divider.
- Primary CTA: Jaheez red.
- Active/selected accent: Jaheez yellow.
- Success: green.
- Courier/info: blue.
- Warning: orange.

### 3.3 Type And Density

User App:

- Friendly, mobile-first, medium density.
- Large service cards and visual discovery.
- Short, warm copy.

Driver App:

- Operational, high clarity, large CTAs.
- Less decorative.
- Bigger status and route/action hierarchy.

Admin:

- Dense, scannable, table-first.
- Small, precise labels.
- Strong filters and status badges.

## 4. Whole-App Build Sequence

### Phase 1: Token And Primitive Alignment

Goal: make the design system stable before screen polish.

Tasks:

- Align User App `brand.ts` canonical color values with the rulebook.
- Keep Driver App tokens as the baseline, reducing shadow intensity where needed.
- Tune Admin CSS variables and primitives for border-first surfaces.
- Update Button/Card/Input/BottomSheet shared behavior across apps.
- Add missing primitive variants without changing business behavior.

Acceptance:

- No hardcoded new color values in changed UI files.
- Mobile cards are border-first by default.
- Primary buttons are red, selected states can use yellow.
- Accessibility labels/roles remain present.

### Phase 2: State Components And Layout Shells

Goal: all screens can show loading, empty, error, retry, and offline states consistently.

Tasks:

- Standardize `EmptyState`, `Loader`, `SkeletonBox/Shimmer`, `OfflineBanner`, `MaintenanceBanner`, and `ForceUpdateModal`.
- Add/reuse `ScreenWrapper` and `TopNav` variants.
- Add User App `ServiceDestinationLayout`.
- Add Driver App `OperationalScreenWrapper`.
- Add Admin `PageHeader`, `FilterToolbar`, `StatusBadge`, `DataState`.

Acceptance:

- No blank loading screens.
- Every major screen has a defined empty/error state.
- Offline state is visible and recoverable.

### Phase 3: User App Home And Discovery

Goal: make customer entry understandable in seconds.

Tasks:

- Polish service launcher with location, search, service cards, and backend/content-driven availability.
- Add `ServiceCard`, `ServiceGrid`, `SearchBar`, `CategoryChip`, `FilterChip`, `SectionHeader`.
- Make search and category entry points consistent.
- Keep service cards large enough for 360px screens.

Acceptance:

- User can identify available Jaheez services immediately.
- No unavailable services are implied unless backend/content config marks them.
- No mock stores/products/prices are introduced.

### Phase 4: User App Commerce Flows

Goal: make restaurants, stores, cart, checkout, and tracking feel fast and trustworthy.

Tasks:

- Refine store/restaurant list cards using `StoreListCard` as base.
- Add product cards and quantity stepper variants for grocery/shop contexts.
- Standardize floating cart bar.
- Improve cart and checkout review with backend quote states.
- Improve order confirmation and tracking timeline.
- Improve order history and order detail.

Acceptance:

- Store/product/order data comes from backend APIs.
- Totals, promos, delivery fees, status, availability, and payment state are server-owned.
- Tracking shows backend/socket-authorized states only.

### Phase 5: User App Courier, Anything, Support

Goal: support non-restaurant tasks safely and clearly.

Tasks:

- Courier flow: pickup/dropoff visual route, package details, recipient phone, notes, sticky CTA.
- Anything flow: request text area, suggested templates, optional photo, address/budget fields if backend supports them.
- Support flow: order-context help, ticket creation, issue categories, retry/error states.

Acceptance:

- Courier/Anything frontend submits DTOs only.
- Pricing, moderation, assignment, fraud/risk, and order/request state remain backend-owned.
- Support avoids sensitive logging and exposes only safe DTOs.

### Phase 6: Driver App Operational Redesign

Goal: make the driver app task-first and safe under pressure.

Tasks:

- Redesign driver dashboard around available offers/current assignment.
- Standardize task cards: pickup, dropoff, ETA/distance, service type, backend-provided payout/fee if allowed.
- Redesign active delivery screen as a stepper: accept, go to pickup, arrived, picked up, go to dropoff, delivered, issue.
- Add realtime/heartbeat/offline states.
- Add support/issue reporting from active delivery.

Acceptance:

- Driver cannot set unauthorized order/assignment states from UI.
- Large CTAs use clear labels and accessibility labels.
- Active delivery remains usable with degraded network.

### Phase 7: Admin Panel Operational Redesign

Goal: make admin faster to scan, filter, and act.

Tasks:

- Reduce decorative card usage and default shadows.
- Standardize page headers, filter toolbars, status tabs, tables, drawers.
- Apply status badges consistently across orders, stores, drivers, users, support, finance, and risk.
- Sensitive actions use dialogs/sheets with reason fields where required.
- Add visible loading/error/empty states for every admin table.

Acceptance:

- Admin UI is table-first and dense.
- Actions are role/backend-authorized.
- Sensitive mutations preserve audit expectations.

### Phase 8: Motion, Accessibility, Verification

Goal: polish without breaking stability.

Tasks:

- Tune press, bottom sheet, floating bar, category active, page entry, and transition animations.
- Verify text fitting at 360px, 390px, 430px widths.
- Check all Pressable/Image accessibility labels in touched files.
- Run local gates before final handoff.

Acceptance:

- No overlapping text.
- No layout shift from loading/buttons/steppers.
- Required local gates pass or failures are documented.

## 5. Screen Priority Order

### User App Priority

1. Shared primitives: Button, Card, Input, BottomSheet, TopNav, ScreenWrapper.
2. Auth: welcome, login, register, OTP, forgot password.
3. Home/service launcher.
4. Search and category/store list.
5. Store detail and cart.
6. Checkout and confirmation.
7. Tracking and order detail.
8. Orders, profile, addresses, support, notifications/settings.
9. Courier/custom request.

### Driver App Priority

1. Shared primitives: Button, Card, Input, TopNav, ScreenWrapper.
2. Auth/login.
3. Dashboard/current offer.
4. Active delivery.
5. Profile/settings.
6. Payout/earnings/support.

### Admin Priority

1. Layout, sidebar, page header, button/card/table primitives.
2. Login.
3. Orders and support.
4. Stores/products/categories.
5. Users/drivers/reliability.
6. Finance/refunds/COD/payouts.
7. Settings/cities/services/commission/notifications.
8. Dashboard/analytics polish.

## 6. Component Backlog

### User App

- `AppHeader`
- `LocationChip`
- `SearchBar`
- `ServiceCard`
- `ServiceGrid`
- `CategoryChip`
- `FilterChip`
- `FilterChipRow`
- `SectionHeader`
- `PromoBanner`
- `StoreListCard` refinement
- `ProductCard`
- `ShopCard`
- `FloatingCartBar`
- `AddressBottomSheet`
- `FilterBottomSheet`
- `ServiceDestinationLayout`
- `CourierAddressFlow`
- `PackageDetailsForm`
- `RequestTextCard`

### Driver App

- `DriverStatusHeader`
- `TaskOfferCard`
- `RouteStopCard`
- `ActiveDeliveryStepper`
- `DriverActionFooter`
- `RealtimeStatusBanner`
- `IssueReportSheet`

### Admin

- `AdminPageHeader`
- `FilterToolbar`
- `StatusTabs`
- `DataState`
- `AdminStatusBadge`
- `ActionDrawer`
- `SensitiveActionDialog`
- `MetricTile` with border-first styling

## 7. Backend/API Contract Questions Before Coding

These must be answered before implementation of affected screens:

- Which backend endpoint returns city-available services for the customer home?
- Which endpoint returns service categories/subcategories?
- Which endpoint returns store lists, product lists, promotions, and availability?
- Which checkout quote endpoint is canonical for cart preview?
- Which socket events are authoritative for customer tracking?
- Which socket/API events are authoritative for driver offer and active delivery states?
- Which admin endpoints support filtering, pagination, status updates, and audit reasons?

Default assumption until confirmed:

- If there is no backend endpoint for a screen, implement only safe static labels/layout shell or create a backend endpoint first. Do not add frontend production mock data.

## 8. Testing And Verification Plan

### Static Checks

- `npm run verify:local`
- `npm test --prefix backend`
- `npm run build --prefix backend`
- `npm run build --prefix frontend/admin`
- `cd frontend/user-app && npx tsc --noEmit`
- `cd frontend/driver-app && npx tsc --noEmit`

### UI Checks

- User App mobile widths: 360, 390, 430.
- Driver App mobile widths: 360, 390, 430.
- Admin desktop/tablet breakpoints.
- Loading, empty, error, offline, retry for every major screen.
- RTL/Arabic text direction checks where applicable.
- Accessibility labels on Pressable and Image in touched React Native screens.

### Security Checks

- No direct frontend business `supabase.from(...)`.
- No frontend pricing/promo/fee/order-state calculation.
- No mock production stores/products/orders/prices/users/status transitions.
- No sensitive logs: token, OTP, password, bank/payment, phone, precise location, idempotency keys.
- Mass-assignment-sensitive mutations validated backend-side.

## 9. Implementation Acceptance Criteria

The redesign implementation is acceptable only if:

- It respects the strict backend-only business architecture.
- It uses brand tokens, not hardcoded colors.
- It uses border-first surfaces and minimal shadows.
- It keeps User, Driver, and Admin experiences distinct.
- It adds no production mock data or frontend business authority.
- It improves loading/error/offline states.
- It remains responsive on target viewports.
- It passes TypeScript/build/security gates or documents exact blockers.

## 10. Recommended Next Coding Step

Start with Phase 1 only:

1. Align User App brand tokens to the canonical Jaheez rulebook.
2. Make `Card` border-first in User and Driver apps.
3. Remove default heavy shadow from Driver `Card` and Admin `Card`.
4. Add explicit `elevated`/`floating` variants only where needed.
5. Verify no screens break visually or type-wise.

Why this first:

- It gives every later screen the right visual foundation.
- It reduces shadow usage globally.
- It prevents redesign drift caused by inconsistent tokens.
- It is low-risk compared with changing checkout/tracking/order logic.
