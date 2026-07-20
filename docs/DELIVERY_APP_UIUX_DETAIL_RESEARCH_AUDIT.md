# Delivery App UI/UX Detail Research Audit

Research date: 2026-07-08

Scope: Glovo, Uber Eats, DoorDash, Deliveroo, Talabat, Careem Food, Yassir Express/Food, and Bolt Food.

Purpose: extract small UI/UX decisions that make successful delivery apps feel understandable, simple, fast, trustworthy, and elegant. This is a research and planning artifact only. It does not design Jaheez screens, does not prescribe frontend business logic, and does not introduce production mock data.

## 1. Executive Findings

The strongest delivery apps succeed because the interface hides marketplace and logistics complexity behind a very small number of user questions:

- Where are you?
- What do you want?
- From where?
- How soon?
- What will it cost?
- Where is it now?
- What can I do if something goes wrong?

Their UI feels easy because the first screen is usually location-led, search-led, or service-led. The user is never asked to understand the operational model. They see familiar objects: restaurant cards, product cards, category chips, cart bars, checkout totals, order timelines, courier status, and support entry points.

The most important shared pattern is status visibility. Delivery creates anxiety because the user pays before receiving the item. Successful apps reduce that anxiety by constantly showing address, availability, ETA, price/fees, restaurant/store identity, courier/rider status, order progress, and support access. This maps directly to NN/g's usability heuristic that predictable status feedback builds trust.

The visual pattern is also clear: modern delivery apps are not successful because they use heavy shadows. They rely on hierarchy, white space, strong image areas, rounded components, thin borders, sticky controls, high-contrast CTAs, and restrained elevation. Shadows are usually reserved for floating controls, sticky bottom bars, bottom navigation, and active overlays.

## 2. Source Notes

Primary and supporting sources used:

- Glovo official site: https://glovoapp.com/en
- Uber Eats official site: https://www.ubereats.com/
- DoorDash official site: https://www.doordash.com/
- Deliveroo official site: https://deliveroo.co.uk/
- Deliveroo Design: https://deliveroo.design/
- Talabat official site: https://www.talabat.com/uae
- Careem official site: https://www.careem.com/
- Yassir official site: https://yassir.com/
- Bolt Food official site: https://food.bolt.eu/
- NN/g 10 Usability Heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- NN/g Response Time Limits: https://www.nngroup.com/articles/response-times-3-important-limits/
- NN/g Mobile Navigation Patterns: https://www.nngroup.com/articles/mobile-navigation-patterns/
- NN/g Skeleton Screens: https://www.nngroup.com/articles/skeleton-screens/

Important limitation: public websites expose more marketing and web entry patterns than full native-app internals. Native app micro-details below are therefore synthesized from official public positioning, visible web/app-store-style patterns, and common current delivery UX conventions. Any final visual implementation should still be validated against screenshots, device testing, and Jaheez's actual app constraints.

## 3. Competitor Audit Table

| App | Strongest UI/UX Pattern | Why It Works | Micro Details To Learn | Watchouts For Jaheez |
| --- | --- | --- | --- | --- |
| Glovo | "Anything delivered" service breadth, location-first discovery, real-time tracking. | Users quickly understand that the app is more than restaurants: food, groceries, shops, pharmacies, anything. The address gate turns a huge catalog into nearby choices. | Large service/category affordances, friendly tone, partner logo recognition, fast promise, real-time tracking reassurance. | Do not copy Glovo's exact service-card look or yellow-heavy identity. Jaheez should use its own Moroccan service language. |
| Uber Eats | Direct task model: enter address, browse nearby, order, track. | Uber's ride-hailing mental model transfers well: request, pay, watch progress. The user understands the state machine without reading instructions. | Clean search, strong restaurant/product imagery, delivery/pickup toggles, live map/status, minimal visual noise. | Avoid over-minimal UI that feels cold for Morocco. Preserve warmth and local tone. |
| DoorDash | Local commerce categories beyond food. | The app frames itself as neighborhood delivery: restaurants, grocery, convenience, flowers, pet, retail. The category system absorbs complexity. | Dense category taxonomy, offer-led entry points, saved-address prompts, subscription/value cues, broad retail cards. | Jaheez should not expose too many categories at once in Safi; show only city-available services. |
| Deliveroo | Post-order trust and operational clarity. | Deliveroo explicitly treats after-order experience as part of product design: rider location, correct response when things go wrong. | Clean content hierarchy, restrained brand color, strong order-status timeline, clear support paths, restaurant/grocery partner quality. | Do not make tracking decorative; it must be operationally truthful and backend-authorized. |
| Talabat | Regional multi-vertical clarity. | Food, groceries, flowers, medicine, donations, mart are framed in simple, MENA-friendly language. "Fast delivery" and "get what you need" are clear. | Location pin/locate me, service tiles, Arabic/English readiness, live chat/support visibility, deals/free delivery messaging. | Good model for regional adaptation, but Jaheez should be Morocco/Darija-first rather than Gulf-style. |
| Careem Food | Super-app grouping by verbs: Go, Eat, Get, Pay. | A large ecosystem feels manageable because services are grouped by intent, not company departments. | Top-level verbs, service clustering, membership benefit cards, wallet/payment trust cues, priority support promise. | Avoid super-app clutter. Jaheez can learn the grouping logic without adding unrelated services too early. |
| Yassir Express/Food | Simple promise: ride, eat, shop; safety and upfront price cues. | Users understand each service through task language and trust claims: quick/easy, secure, right price, no hidden fees. | Minimal input flows, delivery location field, driver verification, geolocation, upfront rates, partner onboarding clarity. | Useful for North African expectations. Jaheez should be very clear about pricing authority and courier verification. |
| Bolt Food | Mobility-to-food transfer and lightweight marketplace feel. | Existing trust in map-based transport makes food delivery feel fast and operational. Bolt Food/Bolt Market add groceries without changing mental model too much. | Green brand restraint, simple categories, nearby restaurants, fast checkout, low-friction courier/map expectations. | Jaheez should avoid becoming too sparse; delivery/errands need warmer explanation in early markets. |

## 4. Why Users Understand These Apps Quickly

### 4.1 Location Is The First Filter

Delivery apps are not global catalogs. They are "what is available to me now" systems. The best apps ask for location early and visibly:

- Glovo: "Enter your address to know what's near you."
- Uber Eats: asks for delivery address before food discovery.
- Deliveroo: asks for postcode to show available delivery.
- Talabat: leads with location pin and locate-me behavior.
- Yassir Food: asks for delivery location before showing nearby stores.

UX reason: location removes ambiguity. It also prevents users from browsing unavailable stores, prices, or delivery promises. For Jaheez, location should be present in the header and in checkout/tracking, but the frontend must not determine availability or pricing itself. It should call backend-approved endpoints.

### 4.2 Familiar Objects Reduce Learning

Users recognize:

- Search bar
- Service/category tiles
- Restaurant/store cards
- Product cards
- Add button / quantity stepper
- Cart bar
- Checkout summary
- Rider/courier status
- Timeline/map tracking
- Help/support entry

This is "recognition rather than recall." Users should not remember how the app works from a tutorial; the screen should show the next possible action.

### 4.3 Content Is Grouped By User Intent

Successful apps avoid internal labels like logistics, dispatch, partner catalog, reconciliation, and service zones. They group by user intent:

- Eat
- Get groceries
- Send package
- Buy medicine
- Send flowers/gift
- Reorder
- Track order
- Get help

For Jaheez, this means service names and tabs should be user-facing and local: Restaurants, Courses, Boutiques, Coursier, Pharmacy, Gifts, Anything. Backend/internal concepts must remain invisible.

## 5. Why Layout Feels Simple

### 5.1 Repeated Screen Grammar

Most delivery screens follow the same grammar:

1. Header with current context
2. Search or address input
3. Horizontal categories/filters
4. Promo/value cue
5. Main content list/cards
6. Persistent cart or primary CTA
7. Bottom navigation or order state

The value is predictability. Once users learn one service, they can use the next. Restaurants, groceries, shops, and pharmacy can share the same shell while changing content density and card type. Courier and Anything should use task/form flows instead of listing feeds.

### 5.2 Visual Hierarchy Beats Decoration

The simple feel comes from clear priority:

- Address and search are high priority.
- Service/category chips are second priority.
- Cards are visual and scannable.
- Promos are visible but not allowed to dominate every screen.
- Support is available but not screaming.

Heavy shadows are not needed. Use:

- Border: primary separation
- Background contrast: section separation
- Radius: touch-friendly grouping
- Typography weight: hierarchy
- Image ratio: visual appetite/trust
- One strong CTA at a time

### 5.3 Lists Stay Skimmable

Delivery app cards usually expose only the details needed for a decision:

- Name
- Image/logo
- Category/cuisine
- Rating
- ETA
- Delivery fee or offer
- Distance, where useful
- Open/closed state

Everything else belongs on details pages or bottom sheets. Long descriptions inside cards slow scanning.

## 6. Why Apps Feel Fast

### 6.1 Perceived Speed Is Feedback, Not Only Performance

NN/g's response-time guidance gives three useful thresholds:

- Around 0.1s feels immediate.
- Around 1s keeps flow mostly intact.
- Around 10s risks losing attention and needs clear progress feedback.

Delivery apps use this principle constantly:

- Button press states confirm taps instantly.
- Skeleton cards show that content is loading.
- ETA and order state keep waiting meaningful.
- Cart bar updates immediately after add/remove.
- Tracking map/timeline turns delay into progress.

### 6.2 Fast Patterns To Audit And Reuse Later

- Skeleton instead of blank screens.
- Optimistic UI for non-business local interactions only, such as opening sheets, active chip state, and local quantity UI before server validation.
- Saved addresses and recent orders.
- Persistent cart bar.
- Sticky checkout CTA.
- Search suggestions and recent searches.
- Reorder affordance.
- Step-by-step tracking instead of one generic "processing" state.

Jaheez constraint: perceived speed must not mean fake prices, fake availability, fake order states, or frontend-calculated totals. Those must come from backend API/socket contracts.

## 7. Why Apps Feel Trustworthy

Trust in delivery UI comes from visibility and reversibility:

- Current delivery address is visible.
- Store/restaurant identity is clear.
- Delivery time is shown early.
- Price/fee summary is clear before confirmation.
- Payment method is visible.
- Order progress is shown after payment.
- Courier identity/status is visible only when authorized.
- Help/support is available from order and profile.
- Error states explain what happened and what to do.

Deliveroo Design is especially useful here: it describes consumer product work not only as helping users find food, but also showing where the rider is and responding correctly when things go wrong.

Yassir is useful for trust cues in North Africa: verified drivers, geolocation, upfront price, and no hidden fees. Those cues are powerful because they answer local concerns directly.

## 8. What Makes The Experience Elegant

Elegance means the interface compresses complexity without hiding important truth.

The elegant delivery app:

- Uses one visible primary action per step.
- Lets images carry appetite and store recognition.
- Uses borders and spacing instead of noisy containers.
- Uses brand color in accents, active states, and CTAs, not everywhere.
- Gives every wait a state.
- Makes support visible but calm.
- Keeps the same component grammar across services.
- Uses motion to explain transitions, not to entertain.

For Jaheez, elegance should be warm, Moroccan, and operationally honest. Avoid overdesigned hero art on operational screens. Home can be expressive; checkout, tracking, driver, and admin should be calmer and more utilitarian.

## 9. Micro-Pattern Library

### 9.1 Buttons

Research pattern:

- Primary actions are tall, high-contrast, and visually stable.
- Secondary actions are often border or light-fill.
- Icon-only buttons are circular/square with clear tap area.
- Sticky bottom CTAs are common in checkout, cart, courier, and confirmation flows.

Jaheez direction:

- Primary customer CTA: red fill, white label, 52-56px height, pill or 16-18px radius depending on screen density.
- Secondary CTA: white or warm-white fill, 1px border, charcoal label.
- Ghost CTA: text/icon only, no container, for low-risk actions.
- Destructive CTA: error red, only for cancel/delete confirmations.
- Loading CTA: preserve width/height, show spinner or "Processing..." label; never collapse.
- Disabled CTA: light gray fill, muted text, no shadow.
- Icon-only button: 40-44px, circular or 12-14px radius, 1px border, no heavy shadow.

Avoid:

- Multiple competing red buttons on one screen.
- Hardcoded colors outside brand tokens.
- Heavy drop shadows on normal buttons.
- Button labels that wrap awkwardly on 360px screens.

### 9.2 Borders And Shadows

Research pattern:

- Modern delivery apps use subtle separation: borders, background differences, and rounded image containers.
- Shadows are functional, not decorative.

Jaheez direction:

- Default card separation: 1px border using brand border token.
- Default surface shadow: none.
- Soft elevation allowed for floating cart, bottom sheet, sticky header after scroll, active service card, and modal.
- Shadow opacity should stay low. Use blur more than darkness.
- Prefer `border + background` before adding shadow.

Shadow budget:

- None: list cards, product cards, inputs, chips, admin tables.
- Very soft: home service cards, sticky headers after scroll.
- Moderate: floating cart, bottom nav, modal/sheet, temporary transition overlay.
- Avoid: stacked shadows, dark shadows under every card, large blurred decorative glows.

### 9.3 Cards

Research pattern:

- Restaurant cards are image-led.
- Grocery/product cards are grid-led and price/add-led.
- Order cards are status-led.
- Admin/operator cards are data-led.

Jaheez direction:

- Service cards: large touch targets, icon/illustration, short title, one-line subtitle, optional status badge.
- Restaurant cards: image ratio about 16:9 or 1.9:1; metadata row with rating, ETA, fee; promo badge on image.
- Product cards: compact grid; image top, title, size, price, add/stepper.
- Shop cards: logo/image left for dense lists; larger image for featured.
- Order cards: status badge, ETA/time, store/service, CTA to track/support.
- Driver task cards: pickup/drop-off clarity, payout/ETA from backend, accept/decline prominence.
- Admin cards/tables: dense, border-led, no decorative shadow.

Avoid:

- Cards inside cards.
- Too much text in cards.
- Decorative cards for every section.
- Fake restaurant/product/order content in frontend production.

### 9.4 Inputs And Forms

Research pattern:

- Search bars are large, rounded, and icon-led.
- Address fields often use location pin/route visual metaphors.
- Checkout forms reduce typing through saved data and selectors.

Jaheez direction:

- Search input: 48-56px height, 16-18px radius or pill, search icon left, optional filter icon right.
- Phone input: country code visible, numeric keyboard, validation error below.
- OTP: separate boxes or grouped input with strong focus state; avoid tiny targets.
- Address input: location icon, title line, secondary address line, opens sheet/map.
- Courier pickup/dropoff: vertical route line with pickup/dropoff dots.
- Notes text area: clear optional label; do not overemphasize.
- Quantity stepper: stable size; plus/minus icons; no layout jump.

### 9.5 Chips, Tabs, And Filters

Research pattern:

- Horizontal chips allow quick narrowing without leaving the screen.
- Active state is high contrast or brand-tinted.

Jaheez direction:

- Category tile: 68-78px tall for visual categories.
- Filter chip: 34-38px tall, pill, border-led.
- Active category: soft yellow background, yellow border, bold label.
- Active filter: charcoal fill or red outline only when selection is high-impact.
- Sort/filter sheet: bottom sheet with sticky apply/clear actions.

### 9.6 Navigation

Research pattern:

- Bottom tabs work well for persistent app areas.
- Header/back behavior handles deep flows.
- Checkout and tracking use linear progress rather than exploratory navigation.

Jaheez direction:

- User app tabs: Home, Search, Orders, Cart, Profile.
- Driver app tabs: Dashboard/Offers, Active Delivery, Earnings/Payouts, Profile.
- Admin panel: sidebar/table-first navigation, not mobile-style cards.
- Top headers: back button, title, context subtitle, max two action icons.
- Deep flows: back returns to previous logical context; no timed navigation hacks.

### 9.7 Bottom Sheets And Modals

Research pattern:

- Delivery apps use bottom sheets for address, filters, substitutions, support actions, and confirmation.

Jaheez direction:

- Use shared BottomSheet component.
- Top radius 24-28px.
- Drag handle visible.
- Dimmed overlay.
- Sticky footer for Apply/Confirm where needed.
- Avoid full-screen modal unless task is complex or high-risk.

### 9.8 Loading, Empty, Error, Offline

Research pattern:

- Blank screens feel broken.
- Skeletons make waiting feel shorter because structure appears immediately.
- Errors should offer recovery.

Jaheez direction:

- Loading: skeletons that match final layout.
- Empty: illustration/icon, short explanation, one CTA.
- Error: plain-language reason, retry/contact action.
- Offline: persistent small banner + retry action on affected content.
- Tracking delay: show honest last update and next expected state.

### 9.9 Motion

Research pattern:

- Motion is mainly feedback: press, sheet opening, cart appearing, page status progression.

Jaheez direction:

- Button press: scale 0.96-0.98.
- Card press: scale 0.97, no bouncing circus.
- Bottom sheet: slide up + overlay fade.
- Floating cart: slide/fade from bottom.
- Page entrance: subtle fade/translate.
- Tracking updates: timeline status change, not excessive animation.
- Avoid long transitions over 1.5s for normal navigation.

## 10. Flow Audit

### 10.1 Onboarding / First Launch

Competitor lesson:

- Apps avoid long education. They ask for location/account permissions only when useful.
- Successful onboarding explains value quickly, then gets to address/search.

Jaheez planning implication:

- Keep onboarding short.
- Ask for phone/auth and location at the right moment.
- Show clear loading/error states for OTP.
- Use Cairo/Arabic-friendly typography.

### 10.2 Home

Competitor lesson:

- Home must quickly answer "what can I get here?"
- Multi-service apps use service categories before detailed listings.

Jaheez planning implication:

- Home can remain a service launcher.
- Show location, search, service cards, order-again/recent sections if backend data exists.
- Do not expose unavailable services unless intentionally marked by backend/content config.

### 10.3 Service / Category Selection

Competitor lesson:

- Category systems work best when visually distinct but not overloaded.
- The first row should include frequent choices and offers.

Jaheez planning implication:

- Restaurants: cuisine categories.
- Groceries: product categories.
- Boutiques: retail/lifestyle categories.
- Courier/Anything: no browsing category grid; use task templates/chips.

### 10.4 Store List

Competitor lesson:

- Cards need image, name, type, rating, ETA, fee/offer.
- List density should match task: food discovery can be visual; groceries may be denser.

Jaheez planning implication:

- Use image-led cards for restaurants.
- Use compact store/product modules for grocery.
- Keep closed/unavailable states visible and honest.

### 10.5 Store Detail

Competitor lesson:

- Store detail needs sticky identity, menu/category navigation, item cards, and persistent cart.
- Product/item detail should open in a modal/sheet if customization is simple.

Jaheez planning implication:

- Store detail should keep store metadata from backend.
- Menu sections should be anchorable.
- Item customization and notes should never calculate totals locally.

### 10.6 Cart

Competitor lesson:

- Cart is a review/adjust screen, not a discovery screen.
- Users need item list, quantities, notes, address, delivery option, and clear next CTA.

Jaheez planning implication:

- Cart can hold draft UI state, but checkout preview/quote must come from backend.
- Show loading for quote refresh.
- Show clear error if item unavailable or price changed.

### 10.7 Checkout

Competitor lesson:

- Checkout succeeds when it is predictable: address, items, fees, payment, instructions, confirm.
- Sticky CTA helps users finish.

Jaheez planning implication:

- Backend owns totals, fees, promos, COD/online availability.
- UI should show server-provided quote and confirmation state.
- Avoid hidden fees and vague labels.

### 10.8 Tracking

Competitor lesson:

- Tracking is the trust center.
- Map plus timeline works because it shows both spatial and process status.

Jaheez planning implication:

- Show order status timeline, ETA, courier status, support/call/chat actions where authorized.
- Do not expose precise private locations beyond authorized tracking endpoints.
- Show "last updated" if realtime is delayed.

### 10.9 Orders

Competitor lesson:

- Order history supports reorder, receipt, support, and status lookup.

Jaheez planning implication:

- Separate active orders from past orders.
- Use status badges and service icons.
- Reorder only through backend-supported flow.

### 10.10 Profile / Account

Competitor lesson:

- Profile is trust infrastructure: addresses, payment, help, language, notifications, legal.

Jaheez planning implication:

- Keep profile list simple and scannable.
- Sensitive actions require confirmation.
- Avoid storing sensitive session/payment data in unsafe frontend storage.

### 10.11 Support

Competitor lesson:

- Help should be contextual: attached to active order, payment, delivery, refund, account.

Jaheez planning implication:

- "Get help" should appear in active order/tracking/order detail.
- Support forms should use backend ticket endpoints.
- Avoid generic dead-end FAQ for urgent order issues.

### 10.12 Driver Flow

Competitor lesson:

- Driver apps are not consumer apps. They prioritize current task, route, time, earnings, accept/decline, pickup/dropoff, proof, and support.

Jaheez planning implication:

- Driver dashboard should be operational, calm, and high-contrast.
- Cards should show pickup/dropoff, distance/ETA, service type, payout/fee if backend-authorized, and clear accept/decline.
- Active delivery should be step-based with large CTAs and safe support access.

### 10.13 Admin / Operator Flow

Competitor lesson:

- Admin/operator tools need density, filtering, auditability, and exception handling, not consumer-style decorative cards.

Jaheez planning implication:

- Admin panel should use tables, filters, status badges, sidebars, and detail drawers.
- Minimal shadows. Use borders, row density, tabs, and clear bulk/action controls.
- Sensitive actions need role-based backend authorization and audit.

## 11. Whole-App Jaheez Flow Map

### 11.1 User App

Core navigation:

- Splash / maintenance / force update
- Auth: welcome, login, register, OTP, forgot password
- Home service launcher
- Search
- Service destinations: restaurants, groceries/courses, boutiques, courier, pharmacy, gifts, anything
- Store/shop detail
- Item/product detail or customization sheet
- Cart
- Checkout
- Confirmation
- Tracking
- Order detail
- Chat/support
- Wallet/payment methods, if backend-supported
- Addresses
- Notifications
- Profile/settings

User app priority:

1. Location/address clarity
2. Service launcher clarity
3. Store/product discovery
4. Cart/checkout trust
5. Tracking/support trust

### 11.2 Driver App

Core navigation:

- Auth/welcome/login
- Driver dashboard
- Available offers/task queue
- Active delivery
- Route/stop guidance
- Pickup confirmation
- Dropoff confirmation
- Earnings/payout summary
- Support/issues
- Profile/vehicle/settings

Driver app priority:

1. Current task clarity
2. Large safe CTAs
3. Pickup/dropoff route visibility
4. Status confirmation
5. Earnings/support transparency

### 11.3 Admin Panel

Core navigation:

- Admin login
- Dashboard/stats
- Orders/requests
- Stores/products/categories
- Drivers/users
- Risk/fraud/moderation
- Payments/COD/refunds/payouts
- Support tickets
- Settings/cities/services/commission
- Audit logs

Admin priority:

1. Data density and scanning
2. Filters/search/status tabs
3. Detail drawers/modals for action
4. Clear role permissions
5. Audit and error visibility

## 12. Prioritized Redesign Roadmap

### Phase 1: Research Consolidation And Design Rules

- Finalize this audit with any additional screenshot/manual app observations.
- Convert patterns into a Jaheez UI rulebook.
- Decide the minimal component tokens: spacing, radius, borders, typography, shadow budget, motion durations.
- Align with `frontend/user-app/constants/brand.ts`, `frontend/driver-app/constants/brand.ts`, and admin Tailwind/theme tokens.

Acceptance:

- No screen implementation yet.
- Clear agreement on "minimal shadows, border-led UI."
- Clear frontend boundary: display/client only.

### Phase 2: Foundation Components

- Standardize Button, Card, Input, Badge, BottomSheet, Loader/Skeleton, EmptyState, TopNav, ScreenWrapper, OfflineBanner.
- Add component variants needed by all apps.
- Establish shadow budget in shared UI components.

Acceptance:

- Components use brand tokens only.
- No hardcoded colors.
- Accessibility labels for interactive elements.
- No business logic inside UI components.

### Phase 3: User App Core Shell

- Home service launcher shell.
- Bottom navigation.
- Location/address selector UI.
- Search shell.
- Loading/empty/error/offline states.

Acceptance:

- No production mock business data.
- Services/data come from backend/content endpoint or safe static labels only.
- Responsive 360-430px.

### Phase 4: User App Commerce Flows

- Restaurant/store list cards.
- Store detail shell.
- Cart and checkout review.
- Confirmation and tracking.
- Orders and order detail.

Acceptance:

- Totals, fees, promos, status, availability, and order transitions are backend-owned.
- Quote refresh handles loading/error.
- Tracking uses authorized backend/socket events.

### Phase 5: Courier / Anything / Support Flows

- Courier task form.
- Anything/custom request form.
- Support ticket and order-help flows.

Acceptance:

- User inputs only collect and submit DTOs.
- Backend handles pricing, moderation, assignment, fraud, and status.

### Phase 6: Driver App Operational Redesign

- Driver dashboard.
- Offer/task cards.
- Active delivery flow.
- Support/issues.
- Profile/earnings views.

Acceptance:

- Large safe CTAs.
- No frontend assignment/state authority.
- Socket/API contract controls driver state.

### Phase 7: Admin Panel Operational Polish

- Dashboard information hierarchy.
- Tables, filters, badges, drawers.
- Risk/support/order action flows.
- Settings screens.

Acceptance:

- Dense, calm, border-led UI.
- Role/permission decisions remain backend-owned.
- Sensitive mutations require backend validation/audit.

### Phase 8: Polish And Verification

- Motion tuning.
- Accessibility audit.
- Screenshot/device checks.
- TypeScript/build/local gates.
- Security boundary checks.

Acceptance:

- No direct frontend Supabase business queries.
- No mock production data.
- No old migrations modified.
- Required local gates run before handoff.

## 13. Design Rule Document For Jaheez

### 13.1 Non-Negotiable Product Rules

- The frontend is display and input collection only.
- No frontend business calculations for pricing, promos, fees, finance, dispatch, payout, fraud, reliability, permissions, or order state.
- No direct frontend Supabase business table queries.
- No production mock/fallback stores, products, orders, prices, roles, users, or status transitions.
- All business data shown in production screens must come from backend API/socket contracts.

### 13.2 Visual Rules

- Use Jaheez brand tokens only.
- Prefer border and background contrast over shadows.
- Use red for primary CTA and active urgency.
- Use yellow for brand energy, active/selected states, and warm surfaces.
- Keep destination screens cleaner than home.
- Keep admin screens denser and more utilitarian than consumer screens.
- Avoid one-note yellow/red saturation; use warm white, charcoal, border, green, blue, and warning sparingly.

### 13.3 Component Rules

- Buttons: 52-56px for primary mobile actions; icon buttons 40-44px.
- Cards: border-led by default; radius 12-22px depending density.
- Inputs: 48-56px, clear label/placeholder, error below.
- Bottom sheets: shared component, 24-28px top radius, sticky footer where needed.
- Skeletons: shape-match final layout.
- Empty states: short text + one recovery action.
- Bottom nav: stable height, cart badge, no layout shift.

### 13.4 Shadow Rules

- Default: no shadow.
- Allowed soft elevation: home service cards, sticky header after scroll, bottom nav, floating cart/request bar, bottom sheet/modal, active transition overlay.
- Avoid maximum shadows, decorative glows, nested-card shadows, and shadow-only hierarchy.

### 13.5 Motion Rules

- Motion must explain state change.
- Press feedback under 100ms.
- Bottom sheet 250-350ms.
- Page/service transition target 700-1200ms, maximum about 1500ms.
- Respect reduced motion where platform supports it.

### 13.6 Copy Rules

- Short, local, task-first.
- Arabic/Darija/French/English should be planned intentionally; do not mix randomly.
- Error copy should explain what happened and what to do.
- Avoid internal system terms.

## 14. Acceptance Criteria For Future Design Work

The next design phase is ready only when:

- Each core flow has a known primary user action.
- Every screen has loading, empty, error, and offline behavior.
- Every sensitive value/status comes from backend contract.
- Every repeated pattern maps to a reusable component.
- The shadow budget is respected.
- Designs are validated at 360px, 390px, and 430px mobile widths.
- Admin, user, and driver apps are treated as different products with shared brand grammar, not the same layout.

## 15. Immediate Next Work Plan

Recommended next artifacts, in order:

1. Jaheez component inventory: compare current Button/Card/Input/BottomSheet/TopNav/etc. against the rules above.
2. User app flow inventory: list existing screens, missing states, and duplicated patterns.
3. Driver app operational UX audit: task clarity, CTA safety, tracking/route states.
4. Admin panel UX audit: density, table/filter/action consistency, status badge system.
5. Final redesign implementation plan: file-level work plan, tests, and acceptance gates.

This keeps the redesign grounded in research, then in the existing codebase, then in safe implementation.
