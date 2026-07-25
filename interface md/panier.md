# JAHEEZ USER APP — PANIER SCREEN REDESIGN

You are working inside the existing Jaheez Expo React Native application.

Your task is to redesign and refactor the existing **Panier / Cart screen** into a clean, premium, production-ready interface matching the approved visual direction.

This is not a temporary mockup.

Implement it using the existing project architecture, existing navigation, existing stores, existing server quote system, existing cart API, existing theme tokens, and existing localization system.

Do not create duplicate state systems.

Do not move backend business logic into the frontend.

Do not hardcode user-facing content, prices, totals, product data, store data, quantities, discounts, or currency formatting.

---

# 1. PRIMARY OBJECTIVE

The Cart screen must become a focused cart-management interface.

It must allow the user to:

- See which store the cart belongs to.
- Return to the store.
- See every cart item clearly.
- Increase or decrease quantities.
- Remove an item.
- Edit item options.
- Switch between multiple active carts if the application supports multi-cart.
- See the latest server-confirmed cart total.
- Continue to Checkout.

The Cart screen must not contain:

- Promo-code input.
- Delivery instructions.
- Full price breakdown.
- Delivery fee details.
- Service fee details.
- Discount details.
- Payment methods.
- Final order confirmation.

These belong exclusively to Checkout.

---

# 2. REQUIRED SCREEN STRUCTURE

The Panier screen must follow this order:

1. Safe-area top spacing.
2. Header.
3. Multi-cart selector, only when relevant.
4. Store header card.
5. Article count label.
6. Cart item list.
7. Empty or unavailable states when needed.
8. Sticky cart bottom bar.
9. Existing application bottom navigation.

The scrollable cart content must never be hidden behind the sticky cart bottom bar or bottom navigation.

Add sufficient bottom content inset based on the real measured height of the sticky elements and device safe area.

Do not use arbitrary large padding values to hide layout problems.

---

# 3. PAGE BACKGROUND

Use the application’s warm neutral background token.

Preferred direction:

- Main background: warm white or very light neutral.
- No strong gradients.
- No decorative background graphics.
- No excessive shadows.
- No childish rounded containers.
- No unnecessary visual noise.

The cart must feel practical, premium, spacious, and easy to scan.

---

# 4. HEADER

## Layout

The header contains:

- Back action on the left in LTR.
- Screen title centered.
- Clear-cart action on the right in LTR.

For RTL, positions must mirror correctly using logical layout behavior.

Do not manually reverse individual icons using hardcoded language checks unless required by the existing icon system.

## Title

Use the localized Cart title from the existing copy system.

Example meaning:

- French: Panier
- Arabic: السلة
- English: Cart

Do not place these strings directly inside the component.

## Back action

Requirements:

- Minimum interactive area: 44 × 44.
- Use the existing navigation back behavior.
- Do not create a new navigation stack.
- Prevent accidental double navigation.
- Use the project’s approved icon package.
- Icon must be visually centered.

## Clear-cart action

The trash icon clears only the currently selected cart.

Before clearing a non-empty cart:

- Use the existing confirmation-dialog pattern.
- Use localized title, description, confirm label, and cancel label.
- Never clear the cart immediately from a single accidental tap.
- Disable repeated confirmation while the clear operation is processing.
- Restore the previous interface state when the request fails.
- Show a localized, user-friendly error.

The clear-cart action must not be rendered when there is no cart content to clear.

---

# 5. MULTI-CART SELECTOR

Preserve the existing multi-cart selector if multiple active carts are supported.

Display it only when there is more than one relevant cart.

Each selector pill may show:

- Store logo or compact icon.
- Store name.
- Item-count badge when useful.

Requirements:

- Selected cart is visually obvious.
- Unselected carts remain readable.
- Horizontal scrolling must be smooth.
- No hardcoded store names.
- Switching carts must not mix data from different stores.
- Switching carts must update the store header, cart items, item count, server quote, and bottom bar as one consistent state.
- Do not briefly show totals from the previously selected cart.
- Cancel or ignore stale quote responses from the previously selected cart.

Use stable cart and store IDs as keys.

Never use array indexes as permanent item or cart keys.

---

# 6. STORE HEADER CARD

Create or refactor a reusable component named according to the project conventions, conceptually:

`StoreHeaderCard`

## Visual structure

The card contains:

- Circular store logo on the left.
- Store information in the center.
- “Go to store” action on the right or lower-right depending on available width.

Recommended visual hierarchy:

- Small muted label: “Commandé chez”.
- Store name: bold and prominent.
- Store-navigation action: neutral grey pill button.

## Store logo

Requirements:

- Circular container.
- Approximate visual size: 52–60 px.
- Image must use `overflow: hidden`.
- Use a valid resize mode.
- Never allow image bleed outside the circle.
- Use an existing store-logo fallback when the URL is absent or invalid.
- Do not crash when the remote image fails.
- Do not display raw image URLs.
- Do not log signed or private URLs.

## Store information

Label meaning:

- FR: Commandé chez
- AR: طلب من
- EN: Ordered from

Store name:

- Comes from validated store data.
- Maximum one or two lines depending on width.
- Truncate safely.
- Never inject raw HTML.
- Handle long names without overlapping the action button.

## “Go to store” action

Label meaning:

- FR: Aller au magasin
- AR: الذهاب للمتجر
- EN: Go to store

Requirements:

- Minimum height: 44 px.
- Neutral grey background or subtle neutral border.
- No red fill because it is not the primary action.
- Navigate using the validated store identifier.
- Do not navigate when the store is unavailable.
- Do not trust an arbitrary route received from API data.
- Build navigation using the application’s known route definitions.
- Prevent multiple rapid navigations.

## Card styling

Recommended:

- Background: white or elevated surface token.
- Border radius: approximately 18–20 px.
- Border: optional subtle 1 px neutral border.
- Very soft elevation only if consistent with the existing design system.
- Internal spacing: approximately 16 px.
- No strong shadows.
- No oversized empty space.

---

# 7. ARTICLE COUNT

Below the store card, show the current item/article count.

This label must be localized and plural-aware.

Examples of meaning:

- 1 article
- 3 articles
- 1 item
- 3 items
- Arabic plural treatment through the localization system

Do not concatenate a raw number with a hardcoded word.

Use the i18n pluralization mechanism already available in the project.

Clarify whether the displayed number represents:

- Number of distinct cart rows, or
- Sum of all quantities.

Use the existing product requirement consistently.

For the approved design, the preferred meaning is the total quantity across cart lines unless the existing product behavior defines otherwise.

---

# 8. CART ITEM CARD

Fully refactor the item row into a reusable cart item card.

Conceptual component:

`CartItemRow`

Each cart item card contains:

1. Product image.
2. Product name.
3. Selected options or modifiers.
4. Server-provided unit price or line price.
5. Quantity stepper.
6. Remove action.
7. Edit action.

## Overall card

Recommended styling:

- White surface.
- Border radius: approximately 16–18 px.
- Optional subtle neutral border.
- Internal horizontal padding: 12–16 px.
- Internal vertical padding: 12–14 px.
- Space between content sections: 10–12 px.
- Soft elevation only if needed.
- No thick border.
- No orange price color.
- No decorative gradients.

The full card must support long content without overlap.

---

# 9. PRODUCT IMAGE

Recommended size:

- Approximately 68–76 px square.
- Border radius: 12 px.

Required behavior:

- Parent image container must use `overflow: hidden`.
- Use a suitable cover resize mode.
- Display an existing product-image placeholder on error.
- Avoid layout shift when the image loads.
- Do not let remote image dimensions control layout.
- Do not render unsafe URL schemes.
- Use only the image loading strategy already approved in the project.
- Avoid repeatedly retrying a broken image URL.

Image accessibility:

- Mark decorative product images appropriately if the product name already provides the information.
- Do not create redundant screen-reader announcements.

---

# 10. PRODUCT NAME

Requirements:

- Bold or semibold.
- Use the application heading/body typography.
- Maximum one or two lines.
- Safe truncation with ellipsis.
- No raw HTML.
- No untrusted markdown rendering.
- Preserve Arabic shaping.
- Respect RTL alignment.

The product name must come from the normalized cart response or validated cart store.

Do not fetch unrelated product details solely to display the cart row unless required by the current architecture.

---

# 11. PRODUCT OPTIONS

Display selected options, modifiers, add-ons, size, cooking preference, or variation summary.

Visual treatment:

- Muted grey.
- Smaller than product name.
- One line when possible.
- Prefix with a subtle bullet character or render a structured separator.
- Truncate safely.

Requirements:

- Generate the options summary from structured cart data.
- Do not store display-ready option strings as the source of truth when structured values are available.
- Localize option labels.
- Do not reveal internal option IDs.
- Do not expose backend enum names directly to users.
- Never use unsanitized server text as markup.

When no options exist, do not reserve an empty row.

---

# 12. PRICE DISPLAY

Use the approved dark text color:

`BRAND.TEXT` or `#1C1C1E`

Do not use red or orange for normal product prices.

Price rules:

- Price must come from the latest server-authoritative cart or quote response.
- Do not calculate authoritative prices from local product data.
- Do not multiply floats manually and treat the result as final.
- Do not invent a fallback price.
- Do not show stale local totals as confirmed totals.
- Use the project’s money formatter.
- Use integer minor units if that is the backend contract.
- Respect locale-specific decimal formatting.
- Use the backend-provided currency code.
- Never hardcode “DH” directly in the item component.
- Do not combine currency and amount using unsafe string concatenation.

Clarify in the implementation whether this field displays:

- Unit price, or
- Current line total.

Follow the existing backend contract and label it consistently.

---

# 13. QUANTITY STEPPER

The quantity control contains:

- Minus button.
- Current quantity.
- Plus button.

## Minus button

Visual direction:

- Light neutral circular button.
- Dark minus icon.
- Minimum tap target: 44 × 44.

Behavior:

- Decrease by one.
- Respect backend minimum quantity.
- When quantity reaches the removal threshold, use the approved remove-item behavior.
- Do not silently allow zero or a negative quantity unless the backend explicitly defines zero as removal.
- Disable while that item’s mutation is being committed when required to prevent duplicate requests.

## Quantity value

Requirements:

- Centered.
- Stable width so the layout does not jump between one-digit and multi-digit values.
- Use tabular numeric alignment where supported.
- Display only a validated positive integer.
- Never accept direct arbitrary text input unless specifically required.

## Plus button

Visual direction:

- Jaheez red circular button.
- White plus icon.
- Minimum tap target: 44 × 44.

Behavior:

- Increase by one.
- Respect inventory, per-order, and backend quantity limits.
- Do not assume the stock limit from frontend constants.
- Handle server rejection gracefully.
- Restore or reconcile the displayed quantity when the request fails.

## Rapid taps and request safety

Prevent race conditions caused by rapid quantity taps.

Use the project’s approved mutation strategy.

The implementation must ensure:

- Responses cannot overwrite newer quantity choices.
- Requests for one item do not incorrectly lock the entire cart.
- The interface exposes a clear updating state.
- The cart is reconciled with the latest server response.
- Stale quote requests are cancelled or ignored.
- No duplicate mutation is generated from an accidental double tap.
- The final quantity always matches the server-authoritative cart.

Optimistic visual changes may be used only if the existing architecture supports safe rollback and reconciliation.

Never calculate the final payable total optimistically as authoritative.

---

# 14. REMOVE AND EDIT ACTION ROW

At the bottom of every cart item card, display two actions:

- Remove.
- Edit.

Use a subtle divider above this action row when appropriate.

## Remove action

Localized meaning:

- FR: Supprimer
- AR: حذف
- EN: Remove

Visual direction:

- Red trash icon.
- Red label.
- Large, clear tap target.
- Approximately half of the action-row width.

Behavior:

- Remove only the selected cart line.
- Use the cart line ID, not only the product ID.
- This is important because the same product may appear with different option combinations.
- Prevent repeated removal requests.
- Update the quote from the server after mutation.
- If removal fails, preserve or restore the item.
- Show a localized error message.
- Do not expose raw server errors.

A confirmation dialog is optional for individual item deletion depending on the existing product behavior. Avoid excessive confirmation friction unless already required.

## Edit action

Localized meaning:

- FR: Modifier
- AR: تعديل
- EN: Edit

Visual direction:

- Dark neutral edit icon.
- Dark neutral label.
- Approximately half of the action-row width.

Behavior:

- Open the existing `CartItemDetailsModal`.
- Do not create a second edit flow.
- Preload the item’s current options and quantity.
- Keep the cart line ID.
- Save through the existing validated cart mutation.
- Do not update the row using unvalidated modal-local calculations.
- Close only when appropriate.
- Show an in-progress state during submission.
- Prevent duplicate save operations.
- Reconcile with the latest server cart after save.

---

# 15. ITEM-LEVEL LOADING STATE

When one item is updating:

- Keep the item visible.
- Do not replace the whole page with a loader.
- Disable only conflicting actions.
- Preserve readable product information.
- Use a subtle progress indicator or opacity change.
- Maintain layout dimensions to prevent jumping.

Do not block unrelated cart items unless the current backend requires serialized cart mutations.

---

# 16. ITEM ERROR STATE

When a quantity, edit, or remove mutation fails:

- Keep the user on the Cart screen.
- Restore the server-confirmed state.
- Show a localized user-safe error.
- Provide a retry path when helpful.
- Do not show stack traces.
- Do not show SQL errors.
- Do not show API route names.
- Do not show internal status text.
- Do not reveal inventory implementation details.
- Log only sanitized diagnostics through the approved logging layer.

---

# 17. UNAVAILABLE OR CHANGED ITEM STATE

The backend may indicate that an item is:

- Unavailable.
- Out of stock.
- Quantity-limited.
- Price-changed.
- Option-invalid.
- Store-unavailable.

The UI must represent these states clearly.

Requirements:

- Do not silently remove affected items.
- Do not continue checkout with an invalid cart.
- Use server-provided reason codes mapped to localized copy.
- Do not display internal reason-code strings.
- Disable confirmation when the server says the cart is not confirmable.
- Give the user a clear action such as edit or remove.
- Refresh the quote after resolution.

---

# 18. STICKY CART BOTTOM BAR

Create a sticky component conceptually named:

`CartBottomBar`

This bar must stay above the existing application bottom navigation.

It contains:

1. Thin update progress bar.
2. Item count and total summary.
3. Primary Checkout button.

## Container

Recommended styling:

- White or elevated-surface background.
- Top border or very soft shadow.
- Safe-area aware.
- Horizontal padding: approximately 16 px.
- Vertical padding: approximately 10–12 px.
- Stable height.
- Must not jump during loading.

## Update progress bar

Place a thin progress indicator at the top edge of the cart bottom bar.

Recommended:

- Height: approximately 3 px.
- Jaheez red.
- Visible only while cart or quote data is updating.
- Use a subtle sliding or indeterminate motion.
- Respect reduced-motion accessibility preferences.
- Do not show multiple overlapping loaders.

## Summary text

Example meaning:

`6 articles · 287,00 DH`

Requirements:

- Article count must be localized and plural-aware.
- Total comes exclusively from the latest valid server quote.
- Currency comes from the backend quote.
- Do not calculate this total in the component.
- Do not hardcode currency.
- Use the shared money formatter.
- Keep the summary readable on smaller devices.
- Avoid wrapping into three lines.
- Use stronger weight for the amount than the item label.

When the quote is updating:

- Keep the previous confirmed amount only if the design system defines it as stale-but-visible.
- Indicate updating visually.
- A subtle shimmer may be applied only to the amount area.
- Do not display a fake temporary total.

When no valid quote exists:

- Show a localized unavailable/loading state.
- Do not show `0 DH` unless the real confirmed total is zero.

## Primary button

Label meaning:

- FR: Valider mon panier
- AR: تأكيد السلة
- EN: Review checkout or Confirm cart, according to existing product copy

Approved French label:

`Valider mon panier`

Visual direction:

- Jaheez red background.
- White text.
- Fully rounded or approximately 14–16 px radius.
- Optional arrow icon aligned logically.
- Minimum height: 52 px.
- Strong visual hierarchy.
- No gradient unless already part of the design system.

Enabled only when:

- Cart is non-empty.
- Cart data is loaded.
- The server quote is valid.
- The cart is confirmable.
- No blocking cart mutation is active.
- Store is available.
- No item requires resolution.
- Authentication/session state is valid.

On press:

- Navigate to the existing Checkout route.
- Do not create the order on the Cart screen.
- Do not process payment on the Cart screen.
- Do not pass prices as trusted navigation parameters.
- Checkout must retrieve or validate the authoritative cart and quote.
- Prevent repeated navigation from double taps.

Disabled state:

- Clearly distinct.
- Still readable.
- Correct accessibility state.
- Do not rely only on opacity to explain a serious cart problem.
- Show contextual information elsewhere for blocked carts.

---

# 19. EMPTY CART STATE

When the selected cart contains no items:

Display a purposeful empty state containing:

- Existing approved cart illustration or icon.
- Localized empty-cart title.
- Localized supporting message.
- Primary action to return to available stores or home.
- No sticky checkout button.
- No fake total.
- No store header if there is no active store context.
- No clear-cart action.

Do not hardcode the destination route.

Use existing navigation helpers.

---

# 20. INITIAL LOADING STATE

During first load:

- Use skeleton placeholders matching the real store header and cart item card geometry.
- Avoid a full-screen spinner when structured loading can be shown.
- Do not show stale data belonging to another account.
- Do not briefly show an empty state before loading finishes.
- Do not display checkout controls until eligibility is known.

Skeletons must:

- Preserve the final layout.
- Respect reduced motion.
- Avoid excessive animation.
- Use neutral theme tokens.

---

# 21. FULL-SCREEN ERROR STATE

When the cart cannot be loaded:

Display:

- Localized error title.
- Short safe explanation.
- Retry action.
- Optional navigation back to home.

Do not display:

- Raw HTTP status.
- Endpoint URL.
- Authentication token.
- Request body.
- Internal exception text.
- Database information.

Retry must be controlled and must not create a request loop.

---

# 22. OFFLINE BEHAVIOR

Use the application’s existing offline/network handling.

Requirements:

- Do not claim that cart changes succeeded before server confirmation unless safe queued mutations are already implemented.
- Show a localized offline message.
- Prevent confirmation when the authoritative quote cannot be validated.
- Avoid continuously retrying mutations in a tight loop.
- Preserve readable cached cart information only when the existing architecture allows it.
- Mark stale data appropriately.
- Revalidate after connectivity returns.

Do not invent a new offline queue only for this screen.

---

# 23. INTERNATIONALIZATION

All user-facing strings must come from localized copy modules.

No inline strings inside screen or component render logic.

Add or reuse copy keys for at least:

- Cart title.
- Ordered from.
- Go to store.
- Remove.
- Edit.
- Article count.
- Clear cart.
- Clear-cart confirmation title.
- Clear-cart confirmation message.
- Confirm.
- Cancel.
- Empty-cart title.
- Empty-cart description.
- Continue shopping.
- Updating cart.
- Cart unavailable.
- Retry.
- Quantity update failed.
- Item remove failed.
- Item unavailable.
- Price changed.
- Out of stock.
- Checkout button label.

Required keys from the approved plan:

## `cartCopy`

- `orderedFrom`
- `goToStore`
- `remove`
- `edit`
- `articlesLabel`

Suggested localized meanings:

### French

- orderedFrom: Commandé chez
- goToStore: Aller au magasin
- remove: Supprimer
- edit: Modifier
- articlesLabel: articles

### Arabic

- orderedFrom: طلب من
- goToStore: الذهاب للمتجر
- remove: حذف
- edit: تعديل
- articlesLabel: منتجات

### English

- orderedFrom: Ordered from
- goToStore: Go to store
- remove: Remove
- edit: Edit
- articlesLabel: items

Use pluralization rather than treating `articlesLabel` as a simple concatenated suffix when the i18n library supports plural rules.

---

# 24. RTL SUPPORT

Arabic must be treated as a first-class layout direction.

Requirements:

- Correct text alignment.
- Correct icon direction.
- Correct action order.
- Correct padding using start/end semantics.
- Correct store-card arrangement.
- Correct arrow direction.
- Correct quantity-control appearance.
- Correct mixed Arabic and numeric rendering.
- Currency must remain readable.
- Product names containing Latin text must not break layout.
- Avoid hardcoded `left` and `right` where logical start/end behavior is appropriate.

Test French, English, and Arabic individually.

Do not infer RTL solely from device locale if the app has its own selected-language setting.

---

# 25. ACCESSIBILITY

Every interactive element must have:

- Accessible role.
- Localized accessibility label.
- Localized accessibility hint where useful.
- Accurate enabled/disabled state.
- Minimum 44 × 44 tap target.

Examples:

- Increase quantity for product name.
- Decrease quantity for product name.
- Remove product name from cart.
- Edit product name.
- Go to store name.
- Clear current cart.
- Continue to checkout.

Additional requirements:

- Support dynamic text scaling without destructive overlap.
- Avoid using color alone to convey errors or selection.
- Maintain WCAG AA contrast for normal text.
- Use dark text `#1C1C1E` for prices.
- Respect reduced-motion preferences.
- Ensure screen-reader focus follows modal opening and closing.
- Announce meaningful quantity changes without excessive repeated announcements.

---

# 26. DESIGN TOKENS

Use existing design tokens.

Do not scatter raw colors, radii, spacing, font sizes, or shadows throughout components.

Approved brand direction:

- Primary red: existing Jaheez red token.
- Primary yellow: existing Jaheez yellow token.
- Main text: `BRAND.TEXT` / `#1C1C1E`.
- Secondary text: existing muted text token.
- Background: existing warm white token.
- Surface: existing white/elevated token.
- Border: existing light neutral border token.
- Error: existing semantic error token.
- Disabled: existing disabled-state tokens.

If a missing token is genuinely required:

- Add it to the centralized theme.
- Use a semantic name.
- Do not create duplicate values with different names.

---

# 27. COMPONENT RESPONSIBILITIES

Keep responsibilities separated.

Suggested structure, adjusted to the actual repository conventions:

## CartScreen

Responsible for:

- Screen composition.
- Selected-cart coordination.
- Navigation orchestration.
- Loading/error/empty state selection.
- Passing normalized props to child components.

Must not contain:

- Currency calculations.
- Price derivation.
- Product-option business rules.
- Raw API parsing inside JSX.
- Security-sensitive token logic.
- Large duplicated style objects.

## StoreHeaderCard

Responsible for:

- Store identity presentation.
- Safe store navigation action.
- Store-logo fallback presentation.

## CartItemRow

Responsible for:

- Cart-line presentation.
- Calling provided quantity/edit/remove handlers.
- Item-level loading and disabled states.

It must not:

- Directly calculate totals.
- Directly call unrelated APIs.
- Own duplicated global cart state.
- Trust product-level IDs as cart-line IDs.

## CartBottomBar

Responsible for:

- Presenting confirmed item count.
- Presenting confirmed server quote total.
- Presenting updating state.
- Exposing the Checkout action.

It must not:

- Calculate totals.
- Create an order.
- Apply promo codes.
- Manage payment.

## CartItemDetailsModal

Preserve the existing component and existing validated edit flow unless an actual defect requires a minimal refactor.

Do not duplicate it.

---

# 28. STATE MANAGEMENT

Reuse the current cart store and server quote hooks.

Keep:

- Existing cart identity.
- Existing cart lines.
- Existing active-store logic.
- Existing multi-cart selection.
- Existing `useCheckoutQuote`.
- Existing `CartItemDetailsModal`.
- Existing authenticated API client.

Remove Cart-screen dependencies that are no longer used:

- Promo input state.
- Promo open/closed state.
- Promo validation state.
- Promo apply/clear handlers.
- Delivery-note local or cart-screen controls.
- Full quote labels rendered in the Cart screen.
- Discount presentation in the Cart screen.
- Inline non-sticky confirmation button.
- Old store subtitle row.

Do not remove promo or delivery-note capabilities from the global checkout flow if Checkout depends on them.

Only remove their Cart-screen UI and unused Cart-screen bindings.

---

# 29. SERVER-AUTHORITATIVE BUSINESS RULES

The frontend must never be the source of truth for:

- Product price.
- Modifier price.
- Discount.
- Delivery fee.
- Service fee.
- Tax.
- Minimum order.
- Store availability.
- Product availability.
- Stock quantity.
- Order eligibility.
- Currency.
- Final total.
- User entitlement.
- Promo eligibility.
- Delivery coverage.

The frontend only presents validated server responses.

Every cart mutation must be validated again by the backend.

Navigation to Checkout does not imply the cart is valid.

Checkout and order creation must revalidate all critical cart data.

---

# 30. SECURITY REQUIREMENTS

Implement the UI in a way that does not weaken the application’s existing security.

## Authentication

- Use the existing authenticated API layer.
- Never manually construct authentication headers inside UI components.
- Never place tokens in logs.
- Never store auth tokens in component state.
- Never pass auth tokens through route parameters.
- Handle expired sessions through the centralized authentication flow.

## Input and server data

- Treat all remote strings as untrusted data.
- Render plain text, not raw HTML.
- Do not use dynamic code execution.
- Do not interpolate server values into executable routes.
- Validate identifiers before using them.
- Use typed API models.
- Normalize nullable fields.
- Do not trust client-submitted price or total values.

## Mutation integrity

- Use cart-line identifiers for item mutations.
- Include the active cart identifier in mutations.
- Ensure the backend verifies cart ownership.
- Ensure the backend verifies the cart belongs to the authenticated user.
- Prevent cross-cart and cross-store mutations.
- Protect against duplicate mutation submission.
- Use idempotency support for sensitive downstream operations where available.
- Do not create orders directly from the Cart screen.

## Error handling

- Map server errors to approved safe UI messages.
- Never expose raw backend messages when they may contain internal information.
- Sanitize analytics and diagnostic events.
- Do not record private delivery information on this screen.
- Avoid logging full cart payloads in production.

## Rate and abuse resilience

The frontend is not a security boundary.

Do not rely on disabled buttons as the only protection.

The backend must remain responsible for:

- Rate limiting.
- Authentication.
- Authorization.
- Ownership checks.
- Quantity constraints.
- Inventory checks.
- Price validation.
- Store validation.
- Quote validation.
- Replay prevention where applicable.

Do not add fake frontend-only “security” that can be bypassed by a modified client.

---

# 31. PERFORMANCE

Requirements:

- Use stable item keys.
- Memoize item rows only where it provides measurable benefit.
- Avoid rerendering every cart row when one quantity changes.
- Avoid recreating large inline callbacks unnecessarily.
- Use the project’s optimized list component.
- Configure list padding for the sticky bottom bar.
- Avoid nested vertical scroll views.
- Avoid repeated store-logo fetching.
- Avoid fetching the same quote multiple times for one mutation.
- Debounce only where appropriate.
- Do not debounce user actions so aggressively that taps feel ignored.
- Cancel or ignore stale requests.
- Avoid expensive calculations during render.
- Avoid parsing large payloads in JSX.

Do not sacrifice correctness for premature optimization.

---

# 32. VISUAL MEASUREMENTS

Use the existing responsive spacing system first.

Approximate visual targets:

- Screen horizontal padding: 16 px.
- Header action tap area: minimum 44 px.
- Store card radius: 18–20 px.
- Store card internal padding: 16 px.
- Store logo: 52–60 px.
- Cart card radius: 16–18 px.
- Cart card padding: 12–16 px.
- Product image: 68–76 px.
- Product image radius: 12 px.
- Quantity button tap area: minimum 44 px.
- Cart action-row height: minimum 48 px.
- Sticky primary button height: approximately 52–56 px.
- Sticky progress line: approximately 3 px.
- Bottom-bar content gap: approximately 12 px.

Adapt cleanly to compact widths.

Do not force the mockup’s exact pixel layout when it would cause clipping on real devices.

---

# 33. RESPONSIVE BEHAVIOR

Test at least:

- Small Android width.
- Standard 390 px mobile width.
- Larger mobile width.
- Devices with gesture navigation.
- Devices with bottom navigation buttons.
- Devices with display cutouts.
- French.
- Arabic RTL.
- English.
- Increased font size.

On narrow devices:

- Keep product image fixed within reasonable limits.
- Let the content column flex.
- Keep quantity controls usable.
- Allow the bottom bar summary to shrink before the main button becomes unusable.
- Do not let text overlap buttons.
- Do not hide essential prices.

---

# 34. CART-TO-CHECKOUT BOUNDARY

The Cart screen should show only the latest server-confirmed total summary.

The detailed breakdown remains in Checkout.

Cart contains:

- Store.
- Items.
- Options.
- Quantities.
- Item actions.
- Item count.
- Confirmed total summary.
- Continue-to-checkout action.

Checkout contains:

- Full price breakdown.
- Promo-code entry.
- Applied discount details.
- Delivery instructions.
- Address confirmation.
- Payment method.
- Final total.
- Final order submission.

Do not duplicate these sections across both screens.

---

# 35. REQUIRED CART COPY FILE CHANGES

Extend the current cart localization copy object rather than creating disconnected string constants.

Add:

- `orderedFrom`
- `goToStore`
- `remove`
- `edit`
- `articlesLabel`

Also add any missing empty, loading, error, clear-cart, and accessibility keys required by the finished interface.

Keep the copy structure consistent with the existing codebase.

Do not add language-condition ternaries throughout components.

---

# 36. ANALYTICS AND LOGGING

Use only the existing analytics abstraction if the project has one.

Potential safe events:

- Cart viewed.
- Store opened from cart.
- Quantity update requested.
- Cart item removed.
- Cart item edit opened.
- Checkout pressed.
- Cart clear confirmed.

Do not include:

- Authentication tokens.
- Full API payloads.
- Delivery address.
- Private notes.
- Raw user identifiers when not required.
- Product option free text that may contain user data.
- Internal server error details.

Do not block the UI waiting for analytics.

---

# 37. TESTING REQUIREMENTS

Add or update tests according to the project’s existing test setup.

Verify:

- Correct loading state.
- Correct empty state.
- Correct loaded state.
- Correct full-screen error state.
- Store navigation uses the correct store.
- Multi-cart switching does not leak previous-cart data.
- Plus quantity action.
- Minus quantity action.
- Quantity rollback after failed mutation.
- Item removal.
- Item edit modal opening.
- Clear-cart confirmation.
- Checkout disabled while quote is invalid.
- Checkout enabled when cart is valid.
- Double-tap protection.
- Server quote total displayed without frontend recomputation.
- Currency localization.
- Article pluralization.
- Arabic RTL layout.
- Long store name.
- Long product name.
- Missing image.
- Broken image.
- Unavailable item.
- Price-changed item.
- Out-of-stock response.
- Expired session handling.
- Offline mutation behavior.
- Accessibility labels.
- Minimum tap targets.

Do not snapshot only the entire page and consider the task tested.

Test meaningful behavior.

---

# 38. TYPE SAFETY

Run:

`npx tsc --noEmit`

Expected result:

- Zero TypeScript errors.

Requirements:

- No new `any` used to bypass typing.
- No unsafe non-null assertions without a proven invariant.
- No ignored TypeScript errors.
- No blanket eslint disable.
- No duplicated API interfaces when generated or shared types already exist.
- Handle optional store, image, option, price, and quote values explicitly.

---

# 39. CODE QUALITY

The final implementation must:

- Follow the current repository’s naming conventions.
- Use small focused components.
- Use centralized design tokens.
- Use centralized localization.
- Use existing navigation helpers.
- Use the existing API client.
- Use the existing cart store.
- Avoid duplicated business logic.
- Avoid large render functions.
- Avoid dead imports.
- Remove obsolete Cart-screen state and handlers.
- Avoid commented-out old implementations.
- Avoid placeholder TODO behavior.
- Avoid temporary fake data.
- Avoid console logging in production paths.
- Avoid route strings scattered across components.

Do not rewrite unrelated Checkout, Home, Store, or navigation code.

Make only the changes needed to deliver the complete Cart redesign safely.

---

# 40. REQUIRED FINAL VERIFICATION

Before declaring the task complete, verify all of the following:

- Cart screen visually matches the approved redesign.
- Promo code is absent from Cart.
- Delivery note is absent from Cart.
- Detailed totals are absent from Cart.
- Store header card is present.
- Store navigation works.
- Product images cannot bleed outside their containers.
- Product prices use dark text.
- Plus button is red with a white icon.
- Minus button is neutral grey.
- Remove and Edit actions have large tap targets.
- Sticky cart bar stays above bottom navigation.
- Sticky bar displays server-confirmed total only.
- Update progress state is visible and stable.
- Checkout action uses the existing route.
- No inline user-facing strings.
- No frontend-authoritative price calculation.
- No hardcoded currency.
- No unsafe raw backend errors.
- No stale response can overwrite a newer cart state.
- No cross-cart item mutation is possible through incorrect identifiers.
- No duplicate order is created from the Cart screen.
- Arabic RTL works correctly.
- Tap targets are at least 44 px.
- `npx tsc --noEmit` returns zero errors.
- Existing lint and tests pass.

---

# 41. DELIVERY FORMAT

After implementation, provide:

1. A concise summary of what changed.
2. Exact files created.
3. Exact files modified.
4. State and handlers removed from the old Cart screen.
5. Existing logic reused.
6. Security protections preserved or improved.
7. Type-check result.
8. Test result.
9. Any unresolved issue, without hiding it.

Do not claim that a test passed unless it was actually executed.

Do not modify unrelated features.