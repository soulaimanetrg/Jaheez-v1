# Uber Eats UI Research Deep Dive

Date: 2026-07-08  
Purpose: Build a strict Uber Eats-inspired UI/UX reference for Jaheez without copying Uber Eats branding, visual identity, proprietary layouts, or business logic.

## Sources Reviewed

- Uber Eats iOS App Store listing: https://apps.apple.com/us/app/uber-eats-food-groceries/id1058959277
- Uber Eats Google Play listing: https://play.google.com/store/apps/details?id=com.ubercab.eats&hl=en_US
- Uber Eats web entry screen: https://www.ubereats.com/
- Uber delivery driver official page: https://www.uber.com/us/en/deliver/
- Uber Eats standalone app launch/design simplicity article: https://www.wired.com/2015/12/ubereats-is-ubers-first-app-thats-not-about-rides/
- Uber Eats AI menus/photos/reviews/live order chat coverage: https://www.theverge.com/news/716578/uber-eats-ai-menu-photo-description-features
- Uber Eats short-form food video discovery coverage: https://www.businessinsider.com/uber-eats-testing-new-tiktok-like-feature-2024-4
- Uber Eats Lists feature coverage: https://www.phonearena.com/news/uber-eats-adds-social-flavor-with-new-lists-feature-for-food-recommendations_id163847
- Public UI examples surfaced in image search: App Store/Google Play screenshots, Uber One home screenshot, checkout screenshot, cart screenshot, order tracking screenshot, Lists/order-again screenshot.

## Important Research Boundary

We should be inspired by Uber Eats at the level of product thinking, hierarchy, speed, trust, and interaction patterns.

We should not copy:

- Uber Eats logo, typography identity, green/black brand system, icon art, exact copy, exact screen composition, proprietary promotional modules, or exact layout measurements.
- Uber Eats business policies, fees, subscription model, cancellation rules, dispatch logic, pricing logic, or ranking logic.

Jaheez should translate the principles into its own brand: Moroccan, warm, red/yellow, Arabic/French-first, simple, trustworthy, and backend-owned.

## Executive Summary

Uber Eats succeeds because it does not ask the user to understand a complex marketplace. It makes the first screen answer five questions quickly:

- Where am I ordering to?
- Do I want delivery now, pickup, grocery, restaurant, or another service?
- What can I search?
- What can I order again or discover quickly?
- Which stores are trustworthy, fast, and available?

The UI feels simple because the app uses a small number of repeated patterns:

- Address at the top.
- Search immediately under address.
- Horizontal chips for modes and filters.
- Image-led restaurant/product rows.
- Bold section titles.
- Minimal dividers.
- Low-shadow or no-shadow surfaces.
- Sticky checkout actions.
- Map + progress model during tracking.

The app feels fast because it reduces decision cost:

- Search is always prominent.
- Recent/order-again patterns avoid browsing.
- Category icons provide instant entry points.
- ETA and delivery fee are visible before entering deep flows.
- Checkout uses editable rows rather than long forms.
- Tracking gives a single clear state and live map.

The app feels trustworthy because it constantly exposes status, cost, timing, and next action:

- Store ratings and review counts.
- Open/closed status.
- ETA windows.
- Delivery fee.
- Cart total and fee breakdown.
- Delivery address and instructions with edit actions.
- Progress bars and latest-arrival time.
- Help/support access in active order states.

The app feels elegant because the UI avoids decorative complexity. It lets content carry the experience: food photos, store names, tight typography, white background, clean rows, and strong black/green CTA contrast.

For Jaheez: we should use Uber Eats as the main inspiration for structure and calmness, but keep Jaheez brand colors and avoid over-carded, over-shadowed UI.

## Uber Eats Core UI Philosophy

### 1. The App Solves Decision Fatigue

The historical design insight from Uber Eats is that choosing dinner is hard. Public reporting on the standalone app launch says Uber found users sometimes felt ordering was slower than not ordering because they had too many options. The product response was not "show everything"; it was "show the right few things first."

UI implication:

- Home should not be a giant dashboard.
- The first viewport should guide, not impress.
- Search, category icons, order again, and nearby stores are more important than banners.
- Promotions should not dominate the entire mental model.

Jaheez rule:

- Use a calm first screen with address, search, service shortcuts, and a small number of high-confidence sections.
- Avoid turning home into a marketing page.

### 2. Simple Does Not Mean Empty

Uber Eats home screens often look visually light, but they are information-dense:

- Address.
- Time/mode control.
- Search.
- Category row.
- Utility chips.
- Featured stores.
- Order again.
- Offers.
- Ratings.
- ETA.
- Delivery fee.

The trick is that every piece is in a predictable place and uses compact typography. The interface is not empty; it is well-prioritized.

Jaheez rule:

- Keep the UI simple, but do not remove useful delivery information.
- Show only the top 2-3 decision signals per item: name, ETA, rating/open state, fee/offer if relevant.

### 3. Content Leads, UI Supports

Uber Eats depends heavily on food/store imagery. Cards and rows are mostly containers for photos and metadata. The UI itself stays restrained.

UI implication:

- Big visual interest comes from store/product images.
- Borders and spacing do more work than shadows.
- Text hierarchy is strong but not decorative.
- Icons are practical and familiar.

Jaheez rule:

- If a screen feels boring, improve imagery, hierarchy, and spacing first.
- Do not add heavy shadows, gradients, or decorative cards to compensate.

## Home Screen Research

### Observed Structure

Common Uber Eats home structure:

1. Top address selector.
2. Optional delivery/pickup segmented control or mode chips.
3. Search bar.
4. Category/cuisine icon row.
5. Utility chips: Uber One, pickup, offers, delivery fee, etc.
6. Featured restaurant/store sections.
7. Order again or recent favorites.
8. Grocery/retail/service sections.
9. Bottom navigation.

### Why Users Understand It Quickly

The top of the screen maps to the user's mental order:

1. "Where should it arrive?"
2. "What am I looking for?"
3. "What type of thing do I want?"
4. "What are good options nearby?"

There is little onboarding needed because the layout matches the task.

### Why It Feels Simple

- The address is text-first, not a large map.
- Search is a large, obvious pill.
- Categories are visual shortcuts, usually horizontal.
- Section headers are bold and direct.
- Store cards repeat the same metadata pattern.
- The bottom navigation is small and predictable.

### Micro UI Pattern

Address:

- Compact top label: "Deliver now" / address.
- Address row uses a location/pin cue and chevron.
- The address can be changed, but it is not over-designed.

Search:

- Large pill.
- Light gray fill.
- Search icon on left.
- Placeholder names the app or search scope.
- Minimal border/shadow.

Category icons:

- Food/service imagery above short labels.
- Horizontal scroll.
- Labels are short.
- Categories are not boxed heavily.

Utility chips:

- Rounded pills.
- Icon + short text.
- Light gray background for inactive.
- Strong filled state only when selected.

Sections:

- Bold title.
- Optional circular arrow button on right.
- Horizontal content below.
- Minimal dividers between large sections.

### Jaheez Translation

Recommended Jaheez home hierarchy:

1. Address selector, calm and compact.
2. Search bar.
3. Service shortcuts: Food, Grocery, Pharmacy, Parcel, Errands.
4. Simple filter chips: Offers, Open now, Fast delivery, Pickup if supported.
5. Order again / recent stores if backend provides it.
6. Nearby stores.
7. Offers.

Avoid:

- Giant hero banner as the first meaningful element.
- Too many card surfaces.
- Large shadows.
- Overly colorful category blocks.
- Marketing copy explaining the app.

## Address Interface Research

Uber Eats treats address as infrastructure, not decoration.

### Successful Patterns

- Address is always accessible near the top of home.
- Checkout repeats the delivery address with an edit action.
- Delivery instructions are their own row.
- Address and delivery method are visible before payment.
- Edit actions are small and contextual.

### Why It Works

Address mistakes are expensive in delivery apps. Uber Eats reduces risk by surfacing address repeatedly at the exact points where it matters:

- Home: before browsing.
- Checkout: before payment.
- Tracking: while waiting.

### Jaheez Translation

Keep Jaheez address UI simple and elegant:

- No heavy cards unless needed.
- Use clean rows.
- Use a location icon, label, address text, default badge, edit/delete actions.
- Default address should be visible but not loud.
- Bottom sheet for add/edit is fine.
- Inputs can use light fill instead of bordered card-heavy styling.

Do not over-redesign addresses. The current simple Jaheez direction is closer to Uber Eats than a heavy card layout.

## Search Research

### Observed Structure

Uber Eats search is central:

- Search bar is always easy to find.
- Search scope includes restaurant, cuisine, dish, product, grocery item.
- Categories and trending/recent concepts reduce typing.
- Results combine stores, products, and categories.

### Why It Feels Fast

Users do not need to browse a hierarchy first. Search is available immediately.

The best search UI does three jobs:

- Allows direct intent: "pizza".
- Supports fuzzy intent: "something fast".
- Provides recovery: recent searches, categories, suggestions.

### Micro UI Pattern

Search field:

- Pill shape.
- Light fill.
- No thick border.
- Search icon.
- Clear button when text exists.
- Submit action through keyboard and small icon/button.

Results:

- Row-based.
- Product/store image on one side.
- Name bold.
- Store/category/details beneath.
- Price/ETA/rating as compact metadata.
- No heavy shadows.

Filters:

- Horizontal chips.
- Filled active state.
- Inactive light gray.
- Short labels.

### Jaheez Translation

Search should be Uber Eats-inspired:

- Search first, filters second.
- Recent and popular searches in simple rows/chips.
- Results should be list-like, not too card-heavy.
- Store/product/category results can be separated by section headers.
- Keep images consistent and compact.

## Store List / Store Card Research

### Observed Uber Eats Store Card Pattern

Restaurant/store card usually shows:

- Large image.
- Store name.
- Rating and count.
- ETA.
- Delivery fee.
- Offer badge if relevant.
- Favorite icon.
- Open/availability state.

### Why It Works

Users need to compare options fast. Uber Eats makes comparison possible by stabilizing metadata:

- Same image position.
- Same name style.
- Same ETA/rating location.
- Same offer placement.

### Layout Feel

Uber Eats often avoids boxed "cards" in the traditional sense. A store item may look like:

- Image with rounded corners.
- Text below or beside it.
- Light spacing.
- Very subtle surface separation.

The card is recognized by content grouping, not by shadow.

### Jaheez Translation

For Jaheez store cards:

- Use image-led cards for home horizontal sections.
- Use row cards for search/list pages.
- Show only essential metadata.
- Avoid dark overlays except small badges.
- Use border/spacing, not heavy elevation.
- Use brand red only for active actions and key badges.

## Store Detail Research

### Likely Uber Eats Structure

Typical delivery app store detail inspired by Uber Eats:

1. Cover image.
2. Back/favorite/share controls.
3. Store name.
4. Rating, ETA, fee, distance/open status.
5. Offer/membership info if applicable.
6. Search within menu.
7. Horizontal category tabs.
8. Menu sections.
9. Product rows/cards.
10. Sticky cart CTA when items are added.

### Why It Works

The store detail page acts like a restaurant menu, not a marketing page. The user sees:

- Identity.
- Trust.
- Speed.
- Menu.
- Cart progress.

### Micro UI Pattern

Menu section:

- Bold section heading.
- Product rows.
- Product name and description.
- Price.
- Optional image thumbnail.
- Add button/icon.

Product row:

- No complicated card chrome.
- Text left, image/right add control.
- Description muted and truncated.

Sticky cart:

- Bottom bar.
- Strong CTA.
- Item count and total.
- Always visible after adding items.

### Jaheez Translation

Jaheez store details should:

- Keep menu browsing calm.
- Use sticky bottom cart only after item selection.
- Keep product rows readable.
- Avoid grid overload for food menu items.
- Use backend-supplied prices and availability only.

## Product Customization / Add Item Research

### Uber Eats-Inspired Pattern

Product details usually use:

- Large food image if available.
- Name and description.
- Required options clearly marked.
- Optional add-ons below.
- Quantity stepper.
- Notes field.
- Sticky add-to-cart button.

### Why It Works

Customization can become complex. Uber Eats keeps it linear:

- Read product.
- Choose required options.
- Add optional options.
- Adjust quantity.
- Add to cart.

### UI Rules

- Required selections need strong labels.
- Option rows should be tappable and full-width.
- Quantity controls should be obvious.
- Add-to-cart should remain sticky.
- Disabled add button should clearly indicate incomplete required choices.

### Jaheez Translation

Use simple rows and bottom CTA. Do not create complicated option cards unless needed.

## Cart Research

### Observed Pattern

Uber Eats cart examples show:

- Clear title.
- Items grouped by store.
- Each item has name, price, quantity/edit controls.
- Tip options can appear as segmented choices.
- Promotion/subtotal/taxes/fees/delivery/tip/total breakdown.
- Payment method row.
- Strong place order button.

### Why It Builds Trust

Cart is where hidden-cost anxiety appears. Uber Eats reduces anxiety by listing line items and keeping the order action visually separate.

### Micro UI Pattern

Line items:

- Label left.
- Amount right.
- Muted explanatory text if needed.
- Dividers between groups.

CTA:

- Full-width sticky button.
- Strong brand/action color.
- Plain label.

### Jaheez Translation

Important security rule: Jaheez frontend must not calculate totals. The backend must return a checkout preview.

UI should:

- Display backend-owned totals.
- Show transparent fee rows.
- Show payment method.
- Show delivery address.
- Show support/cancellation rules only from backend content.

## Checkout Research

### Observed Uber Eats Checkout Pattern

Public checkout examples show:

- Page title with restaurant/store name.
- Delivery/Pickup segmented control.
- Address row with edit button.
- Delivery instruction row with edit button.
- Delivery estimate options.
- Next/place-order sticky button.

### Why Users Understand It Quickly

Checkout is organized by decisions:

1. Delivery mode.
2. Address.
3. Handoff instructions.
4. Timing.
5. Payment/confirmation.

Each decision has an edit action beside it. This is faster than a giant form.

### Layout Rules

- Use rows, not many nested cards.
- Edit buttons are compact gray pills.
- Section headings are bold.
- Important options use radio rows or segmented controls.
- Sticky CTA at bottom.

### Jaheez Translation

Jaheez checkout should feel like:

- Review screen, not form screen.
- Every critical thing visible before placing order.
- Address/instructions/payment/timing editable in place.
- Backend owns totals and rules.

## Order Tracking Research

### Observed Pattern

Uber Eats order tracking examples show:

- Status headline: "Picking up your order..."
- Estimated arrival time.
- Progress indicator.
- Latest arrival time.
- Help access.
- Live map.
- Delivery instruction prompt.

### Why It Feels Trustworthy

Tracking reduces uncertainty with three layers:

- Plain language status.
- Time estimate.
- Spatial proof through map.

The progress bar gives a non-map understanding for users who do not read maps easily.

### UI Details

- Large status text.
- ETA directly below status.
- Progress bar made of simple segments.
- Map occupies significant area.
- Help is visible but not dominant.
- Instruction/support prompts appear below map or as cards.

### Jaheez Translation

Jaheez tracking should:

- Keep one clear status headline.
- Show ETA and latest arrival only if backend provides them.
- Use a simple progress model.
- Keep map clean.
- Give contact/help actions without crowding.
- Avoid playful animation if order is delayed or uncertain.

## Orders / Activity Research

### Observed Pattern

Uber Eats bottom navigation commonly includes Orders/Activity. The orders area supports:

- Active order status.
- Past order history.
- Reorder.
- Help/report issue.
- Receipt/details.

### Why It Works

Orders is a recovery screen. Users go there to answer:

- Where is my order?
- What did I order?
- Can I repeat it?
- Can I get help?

### Jaheez Translation

Orders should be quiet and list-based:

- Filter chips at top.
- Active orders first.
- Past orders as rows.
- Store image/logo, name, date, status, total.
- Track button only for active orders.
- Reorder only when backend supports it safely.

Avoid making orders into large decorative cards. The old simple address style is closer to the right direction.

## Bottom Navigation Research

### Observed Pattern

Uber Eats bottom nav is compact and task-based:

- Home.
- Grocery or services/browse.
- Orders/activity.
- Account.

### Why It Works

The bottom nav does not expose every feature. It exposes the user's recurring jobs:

- Start an order.
- Browse/search services.
- Track/check orders.
- Manage account.

### Jaheez Translation

Jaheez bottom nav should stay stable:

- Home.
- Search/Browse.
- Orders.
- Chat/Support if core to errands.
- Profile.

Do not add too many tabs. Use secondary screens for advanced tools.

## Buttons Research

### Uber Eats Button Feel

Uber Eats buttons often feel:

- Bold but plain.
- High contrast.
- Rounded, but not childish.
- Text-first.
- Minimal icon use except utility actions.

### Types

Primary CTA:

- Full-width.
- Sticky when important.
- High contrast.
- Clear verb.

Secondary action:

- Light gray pill.
- Compact.
- Often used for Edit, filters, Pickup, Offers.

Ghost/icon action:

- Back, favorite, close, share.
- Circular or invisible hit area.

Disabled:

- Lower opacity.
- Still same layout size.

### Jaheez Button Rules

- Primary: brand red.
- Secondary: light neutral or red-light tint.
- Keep 52px-ish height for main CTAs.
- Use pill radius for main actions.
- Use compact gray pills for edit/filter.
- Avoid big shadows.
- Avoid decorative gradients.

## Cards / Rows Research

### Key Insight

Uber Eats is not "card-heavy" in the way many clone apps are. It often uses rows, image groups, horizontal carousels, and simple grouping. The experience feels elegant because the UI has restraint.

### When To Use Cards

Use visible card containers for:

- Promotional banners.
- Horizontal store cards.
- Curated lists.
- Empty states.
- Modal/bottom-sheet content.

Use rows/dividers for:

- Address list.
- Search results.
- Cart lines.
- Checkout address/payment/instruction rows.
- Orders list.
- Support options.

### Jaheez Rule

If the screen is functional, prefer rows. If the screen is discovery/content, use image-led cards.

## Borders, Shadows, Radius

### Observed Direction

Uber Eats-inspired UI uses:

- White background.
- Light gray surfaces.
- Minimal dividers.
- Rounded search/chips/images.
- Very low or invisible shadow.
- Strong content hierarchy.

### Recommendations for Jaheez

Use:

- Background: `BRAND.SURFACE` or `BRAND.BG`.
- Inactive chip/input surface: `BRAND.LIGHT`.
- Dividers: `BRAND.BORDER`.
- Primary action: `BRAND.RED`.
- Soft active surfaces: `BRAND.RED_LIGHT`, `BRAND.YELLOW_LIGHT` carefully.

Avoid:

- Multiple nested cards.
- Strong drop shadows.
- Large colorful panels unless promotional.
- Thick borders everywhere.
- Red on every control.

Radius direction:

- Search: pill or 18-24.
- Main CTA: pill.
- Small chips: pill or 18.
- Images: 12-16.
- Banners/cards: 16-24 depending on size.
- Functional rows: no card or very subtle separation.

## Typography Research

### Uber Eats Feel

Uber Eats uses confident typography:

- Bold section titles.
- Compact body metadata.
- Strong store names.
- Muted secondary text.
- Minimal long explanations.

### Jaheez Translation

Use:

- Section title: bold, 18-22 depending screen.
- Row title: semibold, 15-17.
- Metadata: 12-14.
- Secondary text: muted.
- Avoid oversized hero text in operational screens.
- Arabic/French strings must fit compact components.

## Motion / Perceived Speed

Uber Eats perceived speed comes less from flashy animation and more from continuity:

- Search is always available.
- Cart persists.
- Sticky CTAs reduce scrolling.
- Loading states are predictable.
- Tracking updates are visible.
- Reorder/recent patterns avoid repeated work.

Jaheez should use:

- Skeletons for store rows/cards.
- Button loading states.
- Pull-to-refresh where expected.
- Sticky cart and checkout actions.
- Subtle press feedback.
- No slow decorative intros on core flows.

## Trust Research

Uber Eats trust signals:

- Ratings and review counts.
- ETA.
- Delivery fee.
- Open/closed state.
- Address visibility.
- Order progress.
- Help access.
- Payment visibility.
- Store photos.
- Customer photos/reviews.
- Live order chat for issue resolution.

Jaheez trust rules:

- Always show address before checkout.
- Always show server-owned total preview.
- Always show order status clearly.
- Always make help accessible in active order.
- Do not hide fees.
- Do not show fake/mock trust data.
- Do not use frontend-generated ratings, ETAs, or totals.

## Modern Uber Eats Product Direction

### 1. Multi-Vertical Marketplace

Uber Eats is no longer only restaurants. Store listings describe food, groceries, pharmacy, convenience, retail, pet supplies, flowers, and more.

Jaheez implication:

- Home should make multi-service access obvious.
- Food should be strong, but errands/grocery/pharmacy should not feel bolted on.

### 2. Social Discovery

Lists let users create/share curated food recommendations, and public lists can surface in the home feed.

Jaheez implication:

- Not a phase-one requirement.
- Later, Jaheez can support local Safi collections: "Best late-night", "Family meals", "Fast errands", "Popular near you".
- Keep this backend-owned and moderation-aware.

### 3. Video/Food Confidence

Uber Eats tested short-form videos to help users see dish texture, portion, and preparation, increasing confidence in trying new dishes.

Jaheez implication:

- Do not add video now.
- But prioritize clear food/store imagery and realistic thumbnails.
- Later, allow merchants to upload short clips only after backend moderation/storage rules exist.

### 4. AI-Assisted Content

Uber Eats is using AI for menu descriptions, food photo enhancement, review summaries, and live order chat.

Jaheez implication:

- AI can be useful later for merchant content quality and support summaries.
- Do not fake AI content in frontend.
- AI-generated content must be labeled/controlled if used.
- Backend must own AI workflows.

## Screen-By-Screen Uber Eats Inspiration Rules For Jaheez

### Home

Must feel:

- Immediate.
- Search-first.
- Address-aware.
- Service-aware.
- Content-led.

Use:

- Address selector at top.
- Large light search bar.
- Simple service icons/chips.
- Order again if backend has it.
- Nearby stores with image-led cards.

Avoid:

- Oversized hero.
- Too many promotional banners.
- Heavy shadows.
- Big explanation text.

### Addresses

Must feel:

- Quiet.
- Practical.
- Safe.

Use:

- Simple list rows.
- Location icon.
- Label/address/default state.
- Add/edit/delete actions.
- Bottom sheet for forms.

Avoid:

- Thick bordered cards for every address.
- Loud default highlight.
- Complex map-first UI unless needed.

### Search

Must feel:

- Fast.
- Intent-driven.
- Recoverable.

Use:

- Search field on top.
- Horizontal filter chips.
- Recent searches.
- Popular/trending chips.
- Row results.

Avoid:

- Large cards for every result.
- Too many result types mixed without headers.
- Overdesigned empty states.

### Store Detail

Must feel:

- Like a menu.
- Trustworthy.
- Easy to scan.

Use:

- Cover image.
- Store trust metadata.
- Menu category tabs.
- Product rows.
- Sticky cart CTA.

Avoid:

- Marketing page layout.
- Oversized text.
- Too many boxed sections.

### Product Detail

Must feel:

- Linear.
- Clear.
- Add-to-cart focused.

Use:

- Image, name, description.
- Required/optional option groups.
- Quantity stepper.
- Notes.
- Sticky add button.

Avoid:

- Hidden required fields.
- Long forms without sectioning.
- Frontend price calculations.

### Cart

Must feel:

- Transparent.
- Editable.
- Ready to confirm.

Use:

- Items.
- Quantity/edit.
- Fee breakdown from backend.
- Address/payment row.
- Sticky checkout CTA.

Avoid:

- Hidden fees.
- Surprise totals.
- Client-side computed totals.

### Checkout

Must feel:

- Reviewable.
- Safe.
- Editable.

Use:

- Address row.
- Instructions row.
- Timing row.
- Payment row.
- Server preview totals.
- Sticky place-order CTA.

Avoid:

- One giant form.
- Missing edit access.
- Overly decorative cards.

### Tracking

Must feel:

- Alive.
- Reassuring.
- Clear.

Use:

- Status headline.
- ETA.
- Progress segments.
- Map.
- Driver/help/contact actions where backend allows.

Avoid:

- Confusing multiple statuses.
- Hidden support.
- Decorative animation over clarity.

### Orders

Must feel:

- Calm.
- Historical.
- Useful.

Use:

- Filter chips.
- Active order first.
- Simple order rows.
- Status badge.
- Track/reorder/help actions.

Avoid:

- Large card pile.
- Huge images.
- Overly strong borders.

## Practical Component Rules

### Search Bar

- Height: around 52-56.
- Shape: pill or soft rounded.
- Background: light neutral.
- Border: none or very subtle.
- Icon: search left.
- Text: 14-16.

### Chips

- Height: 34-40.
- Inactive: light neutral.
- Active: brand red for Jaheez.
- Shape: pill.
- Text: 12-14 semibold/medium.
- Icon optional.

### Rows

- Height: content-driven, usually 64-108.
- Divider: 0.5-1px.
- Image: 56-88 depending flow.
- Title: semibold.
- Metadata: muted.
- CTA/action: right side or bottom row.

### Image Cards

- Use on discovery/home.
- Rounded image corners.
- Minimal container chrome.
- Metadata below image.
- Offer badge only if real backend data exists.

### Bottom Sheets

- Used for edit address, delivery instructions, filters, item customization.
- Handle at top.
- Rounded top corners.
- Form controls simple.
- Sticky save/add button.

### Sticky CTAs

- Use on cart/checkout/product detail.
- Full width.
- Brand red.
- No shadow or very subtle top border.
- Include total/item count only if backend-owned.

## What Jaheez Should Do Next

### Phase 1: Stop Over-Designing Functional Screens

Screens:

- Addresses.
- Search.
- Orders.
- Checkout.
- Support.
- Profile settings.

Direction:

- Simple rows.
- Light surfaces.
- Minimal borders.
- Strong typography.
- Small contextual buttons.

### Phase 2: Make Home Uber Eats-Inspired

Direction:

- Address first.
- Search second.
- Service shortcuts third.
- Order again/nearby/offers below.
- Fewer banners.
- More image-led discovery.

### Phase 3: Improve Store/Menu Flow

Direction:

- Store identity and trust metadata.
- Menu category tabs.
- Product rows.
- Sticky cart.

### Phase 4: Improve Checkout/Tracking Trust

Direction:

- Address/instructions/timing/payment rows.
- Backend-owned totals.
- Clear ETA/status.
- Map + progress.
- Help visible.

## Red Flags From Uber Eats Reviews To Avoid

Public app reviews show repeated trust pain around:

- Surprise fees.
- Subscription confusion.
- Difficult refund/support loops.
- Address mistakes/cancellation penalties.
- Delays without clear driver assignment.

Jaheez should avoid these with UI and backend rules:

- Pricing must be transparent before order placement.
- No subscription/promo ambiguity.
- Support should be accessible from active orders.
- Address should be editable before final order.
- Cancellation rules must be explicit and backend-owned.
- Driver assignment delays should show honest status instead of pretending progress.

## Final Design Principle

Uber Eats is successful because it feels like a fast utility wrapped in appetizing content.

For Jaheez, the best inspiration is:

- Simple address.
- Big search.
- Clear services.
- Quiet rows.
- Image-led discovery.
- Sticky CTAs.
- Visible ETA/status.
- Transparent checkout.
- Minimal shadows.
- No fake frontend logic.

Do not make Jaheez look like Uber Eats. Make Jaheez behave with the same clarity.
