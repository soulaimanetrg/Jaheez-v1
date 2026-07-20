# Jaheez Home Experience — Glovo-Inspired UI/UX Design Brief for Antigravity

## 0. Goal

Create a **premium, modern, Moroccan delivery app home experience** inspired by the service-selection pattern used by apps like Glovo, but **do not copy Glovo directly**.

The app should feel familiar to users who understand delivery apps, but the visual identity must be original for **Jaheez**.

The main idea:

> The first screen is not a restaurant listing.  
> It is a **service launcher** where the user chooses what type of delivery they need.

Examples of services:
- Restaurants
- Courses / Groceries
- Boutiques / Shops
- Service Coursier / Courier
- Pharmacy
- Gifts / Surprise Delivery
- Anything / Custom Request

The interface should feel:
- Fast
- Friendly
- Moroccan
- Premium
- Smoothly animated
- Mobile-first
- Easy to understand in less than 3 seconds

---

# 1. Product Personality

Jaheez should feel like:

> “A smart local assistant that can bring you food, groceries, packages, gifts, or anything you need.”

The UI should not feel corporate or cold. It should feel warm, modern, and trustworthy.

## Visual personality

Use:
- Rounded cards
- Soft shadows
- Warm yellow/red identity
- Clean white areas
- Playful service icons
- Smooth animated transitions
- Clear typography
- Strong mobile spacing
- High readability

Avoid:
- Too many borders
- Heavy gradients everywhere
- Generic delivery app look
- Copying Glovo assets exactly
- Overcrowded cards
- Tiny text
- Confusing icons
- Random decorative elements with no function

---

# 2. Brand Design Tokens

Use these as the default Jaheez design system.

## Colors

```css
--jaheez-yellow: #F5CE2E;
--jaheez-yellow-soft: #FFF3B8;
--jaheez-red: #F03030;
--jaheez-red-dark: #C42020;
--jaheez-warm-white: #FEFDF8;
--jaheez-cream: #FFFBEE;
--jaheez-card-white: #FFFFFF;
--jaheez-charcoal: #1C1C1E;
--jaheez-gray-text: #6F6F76;
--jaheez-light-gray: #F5F4F0;
--jaheez-border: #E8E6DF;
--jaheez-success: #2DB87A;
--jaheez-info-blue: #3A8FE8;
--jaheez-warning-orange: #FF9F1C;
```

## Typography

Use:
- Primary font: **Plus Jakarta Sans**
- Arabic font: **Cairo**
- Fallback: system sans-serif

Typography scale:

```css
--font-display: 32px;
--font-page-title: 26px;
--font-section-title: 20px;
--font-card-title: 16px;
--font-body: 14px;
--font-caption: 12px;
--font-small: 11px;
```

Font weights:
- Page title: 800
- Section title: 700
- Card title: 700
- Body: 500
- Caption: 400

## Border radius

```css
--radius-xs: 8px;
--radius-sm: 12px;
--radius-md: 16px;
--radius-lg: 22px;
--radius-xl: 28px;
--radius-pill: 999px;
```

## Shadows

Use soft shadows only.

```css
--shadow-card: 0 8px 24px rgba(28, 28, 30, 0.08);
--shadow-floating: 0 14px 40px rgba(28, 28, 30, 0.14);
--shadow-soft: 0 4px 14px rgba(28, 28, 30, 0.06);
```

## Spacing

Use an 8px spacing system.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
```

---

# 3. App Structure

The app should contain these main areas:

1. Splash screen
2. Home service selection screen
3. Restaurants screen
4. Courses / Groceries screen
5. Boutiques / Shops screen
6. Service Coursier / Courier screen
7. Search screen
8. Cart screen
9. Orders screen
10. Profile screen

The most important focus for this task is:

- Home screen
- Service buttons
- Service transition animation
- Destination screen layouts

---

# 4. Splash Experience

## Splash screen 1

The first splash screen should be simple and branded.

Layout:
- Full screen background using `--jaheez-yellow`
- Jaheez logo centered
- No extra text
- No clutter
- Duration: 1.5–2.5 seconds
- Logo should slightly scale from 0.92 to 1.00
- Subtle opacity fade-in

Animation:
- Logo fade in
- Logo small bounce
- Transition to second splash/home

## Splash screen 2

The second splash can be more expressive.

Layout:
- Warm white background
- Jaheez logo centered
- Small delivery illustration below logo
- Subtle yellow/red floating blobs in background
- No heavy decorations

Animation:
- Logo letters reveal one by one
- Small scooter/package icon slides gently from left to right
- Background blobs move slowly

After this, navigate to Home.

---

# 5. Home Screen Concept

The home screen is a **service launcher**.

It should answer one question:

> “What do you want Jaheez to do for you?”

The user should not immediately see a long restaurant list.  
They should first choose a delivery mission.

---

# 6. Home Screen Full Layout

## Screen size target

Design first for:
- 390 × 844 mobile viewport
- iPhone 14 / modern Android equivalent

The design must also adapt to:
- 360 × 800
- 393 × 873
- 430 × 932

Use safe areas.

---

## 6.1 Background

The home screen has two visual zones:

### Top branded zone

- Background: `--jaheez-yellow`
- Height: around 42–50% of screen
- Contains:
  - Location header
  - Search bar
  - Welcome text
  - Service buttons

### Bottom content zone

- Background: `--jaheez-warm-white`
- Starts with a large soft curved wave
- Contains:
  - Promotions
  - Recommended stores
  - Recent orders
  - Popular near you

The transition between yellow and white should use a large curved shape, not a hard straight line.

---

## 6.2 Header

The header appears inside the yellow zone.

### Header layout

Top padding:
- Use safe area top + 12px

Horizontal padding:
- 20px

Left side:
- Small location pin icon
- Delivery location text

Example:
```text
Delivering to
Safi, Quartier Plateau
```

The first line is small and semi-transparent.  
The second line is bold and dark.

Right side:
- Circular profile/avatar button
- Or notification bell
- Or small wallet/rewards icon

### Header visual style

Location chip:
- Semi-transparent white background: `rgba(255,255,255,0.45)`
- Border: `1px solid rgba(255,255,255,0.45)`
- Radius: 999px
- Height: 44px
- Padding horizontal: 12–14px

Avatar button:
- Size: 42×42
- Background: white
- Radius: circle
- Shadow: soft
- Icon color: charcoal

### UX behavior

When tapping location:
- Open address selector bottom sheet
- Show saved addresses
- Allow current location
- Allow manual address entry

When tapping profile:
- Open profile screen or account menu

---

## 6.3 Welcome Text

Place below header.

Example:
```text
شنو محتاج دابا؟
Ready when you are.
```

Or in French/English:
```text
What do you need today?
Food, groceries, packages — Jaheez brings it.
```

Typography:
- Main title: 26–30px, weight 800
- Subtitle: 14px, weight 500
- Color: charcoal
- Max width: 300px
- Line height: comfortable

Creative option:
- Use Darija-friendly tone:
```text
آش خاصك اليوم؟
Jaheez yjib lik kolchi.
```

Do not overload the header with long text.

---

## 6.4 Search Bar

The search bar should be highly visible.

Position:
- Below welcome text
- Before service cards

Size:
- Height: 50–56px
- Width: full minus 40px
- Radius: 18–999px

Style:
- Background: white
- Shadow: `0 8px 24px rgba(28,28,30,0.08)`
- Left icon: search
- Placeholder text: gray

Placeholder examples:
```text
Search restaurants, shops, products...
```

or:
```text
What can we bring you?
```

Interaction:
- Tapping search opens full search screen
- Search screen includes:
  - Recent searches
  - Popular searches
  - Service filters
  - Suggested stores/products

---

# 7. Service Selection Buttons

This is the heart of the home screen.

## 7.1 General concept

The service buttons represent different “worlds” inside the app.

Each service button should feel like a small illustrated card.

Main services:

1. Restaurants
2. Courses / Groceries
3. Boutiques / Shops
4. Service Coursier
5. Pharmacy
6. Gifts
7. Anything

Depending on city availability, show only available services.

For example:
- Small city: Restaurants, Courses, Service Coursier, Boutiques
- Bigger city: Restaurants, Courses, Boutiques, Pharmacy, Gifts, Anything

---

## 7.2 Layout options

### Option A — 2×2 grid

Best for 4 services.

```text
[ Restaurants ] [ Courses  ]
[ Boutiques   ] [ Coursier ]
```

Card size:
- Width: 48% of content width
- Height: 112–130px
- Gap: 12px

### Option B — horizontal carousel

Best for 5+ services.

```text
[Restaurants] [Courses] [Boutiques] [Coursier] [Pharmacy]
```

Card size:
- Width: 128–148px
- Height: 120px
- Gap: 12px
- Horizontal scroll with snap effect

### Option C — creative mixed hero

Recommended creative version:

- Restaurants is the largest card
- Other services are smaller cards

```text
[      Restaurants large card       ]
[ Courses ] [ Boutiques ] [ Coursier ]
```

This is great if restaurants are the main business driver.

---

## 7.3 Service card anatomy

Each service card contains:

1. Icon/illustration
2. Service name
3. Optional subtitle
4. Optional small badge

Example card:

```text
[ food illustration ]
Restaurants
Order meals nearby
```

### Card style

```css
background: #FFFFFF;
border-radius: 24px;
box-shadow: 0 8px 24px rgba(28,28,30,0.08);
border: 1px solid rgba(255,255,255,0.65);
padding: 14px;
```

### Icon

- Size: 44–64px
- Style: colorful 3D/soft illustration
- Rounded, playful, not too childish
- Use Jaheez yellow/red accents
- Avoid thin line-only icons for main service cards

### Text

Service name:
- 15–17px
- Weight 700/800
- Charcoal

Subtitle:
- 11–12px
- Weight 500
- Gray
- Max one line if possible

Badge:
- Example: “Popular”, “Fast”, “New”
- Position: top-right
- Radius: pill
- Background: soft yellow/red
- Font: 10–11px, weight 700

---

## 7.4 Service card examples

### Restaurants

Label:
```text
Restaurants
```

Subtitle:
```text
Meals near you
```

Icon:
- Burger, tajine, pizza, or delivery bag
- Moroccan option: small tajine + fork

Accent:
- Red/yellow

Badge:
```text
Popular
```

---

### Courses / Groceries

Label:
```text
Courses
```

Subtitle:
```text
Daily essentials
```

Icon:
- Grocery basket
- Milk, bread, vegetables

Accent:
- Green/yellow

---

### Boutiques

Label:
```text
Boutiques
```

Subtitle:
```text
Local shops
```

Icon:
- Shopping bag
- Gift bag
- Storefront

Accent:
- Purple/yellow or red/yellow

---

### Service Coursier

Label:
```text
Coursier
```

Subtitle:
```text
Send anything
```

Icon:
- Package
- Scooter
- Map pin

Accent:
- Blue/yellow

---

### Pharmacy

Label:
```text
Pharmacy
```

Subtitle:
```text
Health items
```

Icon:
- Medicine box
- Cross icon

Accent:
- Green/white/yellow

---

### Gifts

Label:
```text
Gifts
```

Subtitle:
```text
Surprise someone
```

Icon:
- Gift box
- Flowers

Accent:
- Pink/red/yellow

---

# 8. Service Tap Animation

This is one of the most important parts.

When the user taps any service card, the navigation should feel special.

## 8.1 Interaction sequence

Example: user taps “Restaurants”.

1. Card press feedback
2. Card scales down from 1.00 to 0.96
3. Card shadow becomes slightly smaller
4. A colored circular overlay expands from the tapped card
5. Overlay covers the full screen
6. Jaheez icon appears centered
7. Jaheez icon performs a small bounce/pulse
8. Destination screen loads behind overlay
9. Overlay fades or slides away
10. Destination screen appears with staggered animation

## 8.2 Timing

Recommended timings:

```text
Card press: 80ms
Overlay expansion: 350–500ms
Logo appear: 150ms
Logo hold: 300–500ms
Logo fade: 150ms
Destination reveal: 350ms
Total: around 1.1–1.6 seconds
```

Do not make it too slow.

## 8.3 Overlay colors per service

Use different transition colors per service:

```text
Restaurants: Jaheez Yellow → Warm White
Courses: Soft Green/Yellow → Warm White
Boutiques: Soft Red/Pink → Warm White
Coursier: Blue/Yellow → Warm White
Pharmacy: Green/White → Warm White
Gifts: Pink/Yellow → Warm White
```

But keep Jaheez brand visible.

## 8.4 Jaheez icon transition

During the overlay:

- Center the Jaheez logo/icon
- Size: 72–96px
- Start opacity: 0
- Scale: 0.82
- Animate to opacity 1 and scale 1
- Add tiny bounce to 1.06 then back to 1
- Fade out before page appears

The logo must not feel like a loading spinner.  
It should feel like a branded “door opening” animation.

---

# 9. Destination Screen Shared Structure

All service destination screens should share a common structure.

Example screens:
- Restaurants
- Courses
- Boutiques
- Courier

Common layout:

```text
[ Status bar ]

[ Header ]
Back button | Page title | Optional action icon

[ Search bar ]

[ Horizontal category chips ]

[ Optional promo banner ]

[ Content feed ]

[ Bottom navigation ]
```

---

# 10. Restaurants Screen

## 10.1 Purpose

The Restaurants screen helps users discover food options near their location.

It should show:
- Restaurant search
- Cuisine categories
- Promotions
- Recommended restaurants
- Popular near you
- Recently ordered
- Fast delivery restaurants

---

## 10.2 Header

Background:
- White or warm white

Height:
- 92–118px including safe area

Left:
- Back button
- Circular or transparent

Center/left:
```text
Restaurants
```

Subtitle optional:
```text
Safi • 35 places available
```

Right:
- Filter icon
- Or offers icon
- Or profile/cart shortcut

Header style:
- Sticky while scrolling
- Slight shadow after user scrolls down
- Transparent/flat at top

---

## 10.3 Search bar

Placeholder:
```text
Search restaurants or dishes
```

Style:
- Light gray background
- Radius: 16–999px
- Height: 48px
- Horizontal padding: 16px
- Search icon left
- Optional filter/sliders icon right

Behavior:
- Tapping opens restaurant search
- Show recent searches
- Show popular dishes
- Show restaurants matching query

---

## 10.4 Cuisine categories

Horizontal row.

Examples:
- All
- Burgers
- Pizza
- Tacos
- Moroccan
- Chicken
- Sushi
- Sandwiches
- Desserts
- Coffee

Each chip/card:
- Icon above or inside
- Label below or beside
- Rounded shape
- Active state uses yellow background
- Inactive uses white/light gray

Recommended style:

```css
height: 74px;
min-width: 72px;
border-radius: 18px;
background: #FFFFFF;
border: 1px solid #E8E6DF;
```

Active style:
```css
background: #FFF3B8;
border-color: #F5CE2E;
```

---

## 10.5 Promo banner

Place after categories.

Example:
```text
Free delivery on selected restaurants
Up to 30% off today
```

Style:
- Full-width card
- Height: 96–120px
- Radius: 22px
- Background: yellow/red gradient
- Food illustration on right
- Text on left
- CTA chip: “Explore”

Make it feel premium, not too noisy.

---

## 10.6 Restaurant feed

Sections:

1. Featured near you
2. Fast delivery
3. Promotions
4. Popular restaurants
5. Recently ordered
6. Moroccan favorites
7. New on Jaheez

Each section has:
- Title
- Optional “See all”
- Cards

---

## 10.7 Restaurant card

### Card layout

Two recommended variants:

#### Variant A — vertical image card

```text
[ large restaurant/food image ]
Restaurant Name
Rating • Delivery fee • Time
Promo badge
```

Card size:
- Width: full
- Image height: 150–180px
- Radius: 22px
- Margin bottom: 18px

#### Variant B — compact horizontal card

```text
[ image ]  Restaurant Name
           Rating • Time
           Free delivery / Promo
```

Card size:
- Height: 104–124px
- Image: 92×92
- Radius: 18px

Use vertical cards for premium discovery.  
Use compact cards for dense lists.

### Card visual details

Image:
- Rounded corners
- Object cover
- Food photo should dominate
- If restaurant closed, overlay gray/blur

Badges:
- Top-left over image
- Examples:
  - `-30%`
  - `Free delivery`
  - `Sponsored`
  - `New`

Rating:
- Small star icon
- Text like `4.7`
- Use charcoal/gray
- Avoid too many colors

Delivery time:
- Clock icon
- Example: `20–35 min`

Delivery fee:
- Scooter icon
- Example: `Free` or `8 MAD`

---

## 10.8 Empty state

If no restaurants are available:

Show:
- Friendly illustration
- Text:
```text
No restaurants available right now
Try another address or check again later.
```

CTA:
```text
Change address
```

---

## 10.9 Loading state

Use skeleton loading:
- Header remains visible
- Search bar skeleton
- Category chips skeleton
- Restaurant card skeletons

Do not show blank white screen.

---

# 11. Courses / Groceries Screen

## 11.1 Purpose

The groceries screen helps users buy daily essentials.

The UX should focus more on products than restaurants.

---

## 11.2 Header

Title:
```text
Courses
```

Subtitle:
```text
Groceries delivered fast
```

Right icon:
- Cart
- Filter
- Offers

---

## 11.3 Search bar

Placeholder:
```text
Search milk, bread, water...
```

This is important because grocery users often search specific products.

---

## 11.4 Categories

Examples:
- Fruits & vegetables
- Drinks
- Bread & bakery
- Dairy
- Snacks
- Cleaning
- Hygiene
- Baby
- Meat
- Frozen

Use illustrated category tiles.

Tile style:
- Square or rounded rectangle
- Soft pastel background
- Product image/icon
- Short label
- 2-row horizontal carousel or grid

---

## 11.5 Store/product sections

Sections:

1. Supermarkets near you
2. Essentials
3. Promotions
4. Top products
5. Drinks
6. Cleaning items
7. Reorder again

---

## 11.6 Product card

Product cards should include:

- Product image
- Product name
- Size/weight
- Price
- Old price if discount
- Add button
- Quantity stepper after adding

Example:
```text
Sidi Ali Water 1.5L
6 MAD
[ + ]
```

Style:
- White card
- Radius: 18px
- Padding: 12px
- Product image centered
- Add button bottom-right
- Price bold

Add button:
- Circle
- Red or yellow background
- Plus icon
- Haptic-like press animation

When item is added:
- Floating cart bar appears at bottom

---

# 12. Boutiques / Shops Screen

## 12.1 Purpose

The boutiques screen helps users discover local shops and products.

---

## 12.2 Header

Title:
```text
Boutiques
```

Subtitle:
```text
Local shops delivered
```

---

## 12.3 Search bar

Placeholder:
```text
Search shops or products
```

---

## 12.4 Categories

Examples:
- Beauty
- Electronics
- Home
- Gifts
- Flowers
- Pets
- Fashion
- Books
- Toys

---

## 12.5 Content

Sections:

1. Featured shops
2. Gift ideas
3. Beauty & care
4. Shops near you
5. New shops
6. Popular today

Shop cards should show:
- Shop image or logo
- Shop name
- Category
- Delivery time
- Distance
- Promo badge

---

# 13. Service Coursier Screen

## 13.1 Purpose

Courier is not a browsing screen.  
It is a task creation flow.

The user wants to send something from point A to point B.

---

## 13.2 Layout

Header:
```text
Service Coursier
```

Subtitle:
```text
Send packages across the city
```

Main body:
- Pickup address
- Drop-off address
- Package details
- Recipient phone
- Notes
- Price estimation
- Confirm button

---

## 13.3 Address input component

Use a visual path style:

```text
● Pickup location
│
● Drop-off location
```

Pickup icon:
- Green or yellow dot

Drop-off icon:
- Red dot

Fields:
- Large rounded inputs
- Clear placeholder
- Tappable row opens map/address selector

---

## 13.4 Package details

Fields:
- Package size
- Package type
- Is it fragile?
- Notes for courier
- Recipient phone number

Use chips for package size:
- Small
- Medium
- Large

---

## 13.5 Bottom CTA

Sticky bottom button:

```text
Get price
```

Disabled until required fields are complete.

After fields are complete:
- Show estimated price
- CTA changes to:
```text
Confirm delivery
```

---

# 14. Bottom Navigation

The bottom navigation should be fixed on most main screens.

Tabs:

1. Home
2. Search
3. Orders
4. Cart
5. Profile

Alternative smaller version:
1. Home
2. Search
3. Cart
4. Profile

## Visual style

Background:
- White
- Slight top border or shadow

Height:
- 72–86px including safe area

Active tab:
- Yellow circular/pill background behind icon
- Label bold
- Icon charcoal/red

Inactive tab:
- Gray icon
- Gray label

Example:
```text
Home | Search | Orders | Cart | Profile
```

Cart tab:
- Show badge with item count
- Badge color: red
- Badge text: white

---

# 15. Floating Cart Bar

When user adds items, show a floating cart bar.

Position:
- Bottom above navigation bar

Style:
```css
background: #1C1C1E;
color: white;
border-radius: 18px;
padding: 14px 16px;
box-shadow: 0 14px 40px rgba(28,28,30,0.20);
```

Content:
```text
3 items • 64 MAD
View cart
```

CTA:
- Right side
- Yellow or white text

Animation:
- Slide up from bottom
- Fade in
- Scale from 0.98 to 1

---

# 16. Search Screen

Search should work across:
- Restaurants
- Products
- Shops
- Categories

Layout:
- Header with back button
- Search input focused automatically
- Recent searches
- Popular searches
- Service filters

Service filters:
```text
All | Restaurants | Courses | Shops | Courier
```

Search result card types:
- Restaurant card
- Product card
- Shop card
- Category card

Empty state:
```text
No results found
Try another word or choose a service.
```

---

# 17. Address Selector Bottom Sheet

When tapping location, open a bottom sheet.

Content:
- Current location
- Saved addresses
- Add new address
- Use GPS
- Search manually

Style:
- Rounded top corners: 28px
- Drag handle
- White background
- Smooth slide up
- Dimmed overlay

Address card:
- Icon
- Label: Home / Work / Other
- Address line
- Edit button

---

# 18. Microinteractions

Use subtle animations everywhere.

## Buttons

On press:
- Scale to 0.96–0.98
- Slight opacity reduction
- Restore with spring

## Cards

On mount:
- Fade in
- TranslateY from 12px to 0
- Stagger delay between cards: 40–80ms

## Category chips

On active:
- Background changes to yellow soft
- Border becomes yellow
- Icon scales slightly
- Text becomes bold

## Bottom sheet

- Slide up with spring
- Overlay fades in
- Drag handle visible

## Loading

Use skeletons:
- Rounded gray blocks
- Shimmer optional
- Do not show blank pages

---

# 19. Creative Additions for Jaheez

These are extra creative ideas to make Jaheez feel more original.

## 19.1 “Jaheez Pulse” transition

Every service opens with a branded pulse.

Animation:
- Tapped card emits a circular pulse
- Pulse expands full screen
- Jaheez icon appears
- Icon turns into destination header icon
- Page reveals

This makes the app feel smooth and memorable.

---

## 19.2 Dynamic greeting

Use time-based greeting:

Morning:
```text
صباح الخير، شنو بغيت تفطر؟
```

Afternoon:
```text
آش خاصك اليوم؟
```

Evening:
```text
جوعان؟ Jaheez قريب منك.
```

French option:
```text
Bonjour, qu’est-ce qu’on vous apporte ?
```

English option:
```text
What can we bring you today?
```

---

## 19.3 City-aware services

Services should be configurable by city.

Example data:

```json
{
  "city": "Safi",
  "services": ["restaurants", "courses", "boutiques", "courier"]
}
```

If a service is unavailable:
- Do not show it
- Or show it as disabled with “Coming soon”
- Prefer not showing unavailable services for cleaner UX

---

## 19.4 Moroccan local feel

Add subtle local touches without making the design old-fashioned.

Ideas:
- Tajine icon for Moroccan food category
- Moroccan bakery category
- Local store labels
- Darija microcopy
- Warm colors
- Friendly tone

Avoid:
- Heavy mosque patterns
- Overused traditional ornaments
- Too many Moroccan motifs
- Visual clichés

---

## 19.5 Smart reorder section

On home lower content zone:

```text
Order again
```

Show last restaurants/products ordered.

Card:
- Small image
- Store name
- Last order summary
- “Reorder” button

This increases retention.

---

## 19.6 “Anything” custom request

Creative service for Jaheez:

Label:
```text
Anything
```

Subtitle:
```text
Tell us what you need
```

Flow:
- User writes request
- Adds pickup/dropoff if needed
- Adds photo optional
- Gets estimated price or manual confirmation

This can make Jaheez feel more powerful than a normal delivery app.

---

# 20. Component Library Required

Create reusable components:

## Core components

- `AppHeader`
- `LocationChip`
- `SearchBar`
- `ServiceCard`
- `ServiceGrid`
- `CategoryChip`
- `PromoBanner`
- `RestaurantCard`
- `ProductCard`
- `ShopCard`
- `FloatingCartBar`
- `BottomNavigation`
- `AddressBottomSheet`
- `LoadingSkeleton`
- `EmptyState`
- `AnimatedTransitionOverlay`

---

# 21. Suggested File Structure

Use a clean architecture.

```text
src/
  app/
    index.tsx
    restaurants.tsx
    groceries.tsx
    shops.tsx
    courier.tsx
    search.tsx
    cart.tsx
    orders.tsx
    profile.tsx

  components/
    layout/
      AppHeader.tsx
      BottomNavigation.tsx
      ScreenContainer.tsx

    home/
      ServiceCard.tsx
      ServiceGrid.tsx
      HomeHero.tsx
      HomePromoSection.tsx

    common/
      SearchBar.tsx
      CategoryChip.tsx
      PromoBanner.tsx
      FloatingCartBar.tsx
      EmptyState.tsx
      LoadingSkeleton.tsx

    cards/
      RestaurantCard.tsx
      ProductCard.tsx
      ShopCard.tsx

    sheets/
      AddressBottomSheet.tsx

    animations/
      AnimatedTransitionOverlay.tsx

  constants/
    colors.ts
    spacing.ts
    typography.ts
    services.ts
    mockData.ts

  hooks/
    useServiceTransition.ts
    useCityServices.ts
    useCart.ts

  types/
    service.ts
    restaurant.ts
    product.ts
    shop.ts
```

---

# 22. Data Model for Services

Create service configuration like this:

```ts
export type ServiceType =
  | "restaurants"
  | "groceries"
  | "shops"
  | "courier"
  | "pharmacy"
  | "gifts"
  | "anything";

export const SERVICES = [
  {
    id: "restaurants",
    label: "Restaurants",
    subtitle: "Meals near you",
    icon: "restaurant",
    accentColor: "#F03030",
    transitionColor: "#F5CE2E",
    route: "/restaurants",
    badge: "Popular",
  },
  {
    id: "groceries",
    label: "Courses",
    subtitle: "Daily essentials",
    icon: "basket",
    accentColor: "#2DB87A",
    transitionColor: "#FFF3B8",
    route: "/groceries",
  },
  {
    id: "shops",
    label: "Boutiques",
    subtitle: "Local shops",
    icon: "shopping-bag",
    accentColor: "#C42020",
    transitionColor: "#FFE0DE",
    route: "/shops",
  },
  {
    id: "courier",
    label: "Coursier",
    subtitle: "Send anything",
    icon: "package",
    accentColor: "#3A8FE8",
    transitionColor: "#DDEEFF",
    route: "/courier",
  }
];
```

---

# 23. Animation Implementation Notes

Use:
- React Native Reanimated if available
- Or CSS/Framer Motion if building web
- Or native transition APIs depending on the stack

Important animation principles:
- Use spring easing for physical interactions
- Keep navigation under 1.6s
- Avoid blocking user too long
- Use the same transition style across services
- Change color per service for freshness

Recommended easing:
```text
spring: damping 16–20, stiffness 160–220
timing: 250–450ms ease-out
```

---

# 24. Accessibility

Make sure:
- Buttons are at least 44×44px
- Text contrast is readable
- Icons have labels
- Tap targets are large
- Navigation is predictable
- Disabled services are clearly marked
- Loading states are visible
- Error states are friendly

---

# 25. Empty, Error, and Offline States

## Offline state

Show:
```text
You’re offline
Check your connection and try again.
```

CTA:
```text
Retry
```

## Service unavailable

Show:
```text
This service is not available in your area yet.
```

CTA:
```text
Notify me
```

## Restaurant closed

Show on card:
```text
Closed
Opens at 12:00
```

Card should be dimmed.

---

# 26. Final Design Direction

The final app should feel like this:

- Home is colorful and emotional
- Destination screens are clean and content-focused
- Service transitions are smooth and branded
- Cards are rounded and premium
- Yellow/red identity is strong but not aggressive
- Jaheez has its own Moroccan-friendly personality
- The UI is not a direct Glovo clone, but users instantly understand how to use it

---

# 27. Antigravity Master Prompt

Use this prompt inside Antigravity:

```text
You are a senior mobile UI/UX designer and frontend engineer.

Build a modern mobile-first delivery app interface for a Moroccan app called Jaheez.

The goal is to create a Glovo-inspired service launcher experience, but do not copy Glovo directly. Create an original premium Jaheez identity.

The home screen should show a branded yellow hero area with location selector, greeting text, search bar, and large rounded service cards. Services include Restaurants, Courses/Groceries, Boutiques/Shops, Service Coursier, Pharmacy, Gifts, and Anything. The visible services should be configurable by city.

When the user taps a service card, create a smooth branded transition: the card presses, a colored overlay expands from the tapped card, the Jaheez logo appears centered with a small bounce, then the selected destination screen appears with a fade/slide animation.

Create destination screens for Restaurants, Courses/Groceries, Boutiques/Shops, and Service Coursier.

Restaurants screen:
- Header with back button, title, optional filter icon
- Search bar
- Horizontal cuisine categories
- Promo banner
- Restaurant feed sections
- Restaurant cards with image, name, rating, delivery time, delivery fee, and promo badges

Courses screen:
- Header
- Product-focused search
- Grocery categories
- Store/product sections
- Product cards with image, name, size, price, add button, and quantity stepper

Boutiques screen:
- Header
- Search
- Shop categories
- Featured shops
- Shop cards with image/logo, name, category, delivery time, distance, and promos

Service Coursier screen:
- Form-based flow
- Pickup address
- Drop-off address
- Package details
- Recipient phone
- Notes
- Sticky bottom CTA to get price or confirm delivery

Use this design system:
- Yellow #F5CE2E
- Red #F03030
- Red dark #C42020
- Warm white #FEFDF8
- Cream #FFFBEE
- Charcoal #1C1C1E
- Light gray #F5F4F0
- Border #E8E6DF
- Success #2DB87A
- Info blue #3A8FE8

Use rounded cards, 16–28px border radius, soft shadows, generous spacing, premium mobile layout, and clean typography. Use Plus Jakarta Sans for Latin text and Cairo for Arabic text.

Create reusable components:
AppHeader, LocationChip, SearchBar, ServiceCard, ServiceGrid, CategoryChip, PromoBanner, RestaurantCard, ProductCard, ShopCard, FloatingCartBar, BottomNavigation, AddressBottomSheet, LoadingSkeleton, EmptyState, AnimatedTransitionOverlay.

Make the UI responsive for 360–430px mobile widths.

Do not create a boring static screen. Add microinteractions:
- Button press scale
- Service transition overlay
- Staggered card fade-in
- Category selected animation
- Floating cart bar slide-up
- Bottom sheet slide-up

The result should look production-ready, premium, smooth, and suitable for a real delivery startup in Morocco.
```

---

# 28. Implementation Acceptance Criteria

The result is acceptable only if:

- Home screen clearly shows service selection
- Services are large and easy to tap
- Header includes location selector
- Search bar is visible
- Bottom navigation exists
- Tapping each service opens the correct interface
- Service transition includes Jaheez logo/icon
- Restaurants screen has categories and restaurant cards
- Groceries screen has product cards
- Shops screen has shop cards
- Courier screen has form flow
- UI uses Jaheez colors
- Design is responsive
- Animations are smooth
- No direct Glovo assets are copied
- The interface feels original, premium, and complete

---

# 29. Extra Polish Ideas

Add these if possible:

1. Dynamic home greeting based on time of day
2. “Order again” section
3. “Popular in Safi” section
4. Moroccan food category
5. Floating cart bar
6. Animated address selector
7. Service availability by city
8. Coming soon badge for unavailable services
9. Skeleton loaders
10. Empty states
11. Offline state
12. Promo banners
13. Reorder button
14. Delivery time badges
15. Smooth page transitions

---

# 30. Final Note

Do not treat this as a simple clone.

Treat this as:

> A premium Moroccan delivery app home system inspired by the best multi-service delivery apps, redesigned with Jaheez identity, smoother transitions, better microinteractions, and stronger local personality.
```
