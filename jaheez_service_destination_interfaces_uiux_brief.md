# Jaheez Service Destination Interfaces — Full UI/UX Design Brief for Antigravity

## 0. Scope

This document describes the **interfaces that appear after the user selects a service from the Jaheez Service Selection Screen**.

Example:

> User taps **Restaurants** on the selection screen → the **Restaurants Interface** appears.

The same logic applies to:
- Restaurants
- Courses / Groceries
- Boutiques / Shops
- Service Coursier
- Pharmacy
- Gifts
- Anything / Custom Request

The goal is to design the destination interfaces **from header to footer**, with every important UI/UX detail included.

Do not copy any app directly.  
Use the general multi-service delivery app pattern, but make the result feel original, premium, Moroccan-friendly, and branded for Jaheez.

---

# 1. Global Destination Screen Philosophy

Each service should feel like entering a different “world” inside Jaheez.

The user should understand:

1. Which service they selected.
2. What they can do inside this service.
3. How to search.
4. How to filter.
5. What options are available.
6. How to add/order/request.
7. How to return to the selection screen.
8. How to access cart, orders, and profile.

Every destination interface should share the same base structure, but each service must have its own content logic.

---

# 2. Shared Destination Screen Structure

All service destination pages should follow this high-level layout:

```text
[ Status Bar / Safe Area ]

[ Sticky Header ]
- Back button
- Service title
- Location or delivery context
- Action icons

[ Context Search Bar ]
- Search specific to this service

[ Category Navigation ]
- Horizontal chips or cards

[ Quick Filters / Sort Row ]
- Delivery time
- Offers
- Rating
- Distance
- Open now
- Price

[ Hero Promo / Featured Banner ]
- Service-specific offer or highlight

[ Main Content Feed ]
- Sections
- Cards
- Lists
- Product/store/restaurant results

[ Floating Cart / Request Bar ]
- Appears when user adds items or starts a request

[ Bottom Navigation ]
- Home
- Search
- Orders
- Cart
- Profile
```

---

# 3. Transition From Selection Screen to Destination Interface

The screen should not appear abruptly.

## 3.1 Animation sequence

When a user taps a service card:

1. Selected service card scales down slightly.
2. A circular color overlay expands from the tapped card.
3. Jaheez logo/icon appears centered.
4. Logo does a small bounce/pulse.
5. Destination screen loads behind the overlay.
6. Overlay fades away or slides upward.
7. Destination header appears first.
8. Search bar appears second.
9. Categories and content cards appear with stagger animation.

## 3.2 Timing

```text
Card press: 80ms
Color overlay expansion: 350–500ms
Jaheez icon appearance: 160ms
Logo hold: 250–400ms
Destination reveal: 300–450ms
Total: around 1.1–1.5s
```

## 3.3 Service transition colors

```text
Restaurants: #F5CE2E
Courses: #DFF7E9
Boutiques: #FFE0E0
Coursier: #DDEEFF
Pharmacy: #E6F8EF
Gifts: #FFE3EC
Anything: #1C1C1E
```

---

# 4. Shared Header Design

The destination header must feel clean and functional.

## 4.1 Header layout

```text
[Back Button] [Title + small delivery context]              [Action Icons]
```

Example:

```text
←  Restaurants
   Safi, Plateau                                   Filter  Cart/Profile
```

## 4.2 Header dimensions

```css
height: 96px to 118px including safe area;
padding-horizontal: 20px;
padding-top: safe-area + 8px;
background: #FEFDF8 or #FFFFFF;
```

## 4.3 Back button

Style:
```css
width: 40px;
height: 40px;
border-radius: 999px;
background: #FFFFFF;
border: 1px solid #E8E6DF;
box-shadow: 0 4px 14px rgba(28,28,30,0.06);
```

Icon:
- Left arrow
- Charcoal color
- Size 20–22px

Behavior:
- Tapping goes back to service selection screen
- Use reverse transition if possible
- Do not instantly cut the animation

## 4.4 Title

Typography:
```css
font-size: 24px;
font-weight: 800;
color: #1C1C1E;
letter-spacing: -0.4px;
```

Subtitle:
```css
font-size: 12.5px;
font-weight: 500;
color: #6F6F76;
```

Subtitle examples:
```text
Safi • Delivering now
35 places available
Open restaurants near you
```

## 4.5 Header action icons

Possible icons:
- Filter
- Cart
- Offers
- Notifications
- Profile
- Help

Style:
```css
width: 40px;
height: 40px;
border-radius: 999px;
background: #FFFFFF;
border: 1px solid #E8E6DF;
```

Use maximum 2 action icons.  
Do not overload the header.

## 4.6 Sticky behavior

At top:
- Header is flat and clean.

When scrolling:
- Header becomes sticky.
- Add subtle shadow:
```css
box-shadow: 0 8px 22px rgba(28,28,30,0.06);
```
- Search bar may become compact or stay pinned below header.

---

# 5. Shared Search Bar

Each service has a search bar, but placeholder text changes.

## 5.1 Style

```css
height: 48px;
border-radius: 18px;
background: #F5F4F0;
border: 1px solid #E8E6DF;
padding-horizontal: 14px;
```

## 5.2 Content

Left:
- Search icon

Middle:
- Placeholder

Right:
- Optional filter icon or microphone icon

## 5.3 Behavior

On tap:
- Navigate to service-specific search page
- Auto focus input
- Show recent searches
- Show trending suggestions
- Keep user inside selected service context

---

# 6. Shared Category Navigation

Categories help the user quickly narrow the content.

## 6.1 Style

Use horizontal scroll.

Each category item:
```css
min-width: 72px;
height: 72px;
border-radius: 18px;
background: #FFFFFF;
border: 1px solid #E8E6DF;
padding: 8px;
```

Active state:
```css
background: #FFF3B8;
border-color: #F5CE2E;
```

## 6.2 Category item anatomy

```text
[Small icon / illustration]
[Label]
```

Label:
```css
font-size: 11.5px;
font-weight: 700;
color: #1C1C1E;
```

## 6.3 Interaction

On tap:
- Category becomes selected.
- Feed updates.
- Category chip gently scales to 1.04 then returns to 1.
- Active category scrolls into view if necessary.

---

# 7. Shared Filter Row

Place below categories or below search depending on screen.

## 7.1 Filter examples

```text
Offers
Fast delivery
Top rated
Open now
Free delivery
Near me
Sort
```

## 7.2 Style

Chips:
```css
height: 34px;
border-radius: 999px;
background: #FFFFFF;
border: 1px solid #E8E6DF;
padding: 0 12px;
font-size: 12px;
font-weight: 600;
```

Active chip:
```css
background: #1C1C1E;
color: white;
border-color: #1C1C1E;
```

Use horizontal scroll.

---

# 8. Shared Promo Banner

Each destination page should have one service-specific promo banner.

## 8.1 Style

```css
height: 104px to 128px;
border-radius: 24px;
padding: 18px;
background: service-specific gradient;
overflow: hidden;
```

## 8.2 Content

Left:
- Promo title
- Promo subtitle
- Small CTA pill

Right:
- Illustration/image

## 8.3 Example

```text
Free delivery today
On selected restaurants near you
[Explore]
```

## 8.4 Rule

Do not make the banner too loud.  
It should feel premium, not like a cheap ad.

---

# 9. Restaurants Interface — Full Detailed Description

This is the most important destination interface.

The Restaurants interface appears when the user taps the **Restaurants** button from the service selection screen.

---

## 9.1 Purpose

The screen helps the user find food quickly.

It should support:
- Browsing restaurants
- Searching restaurants or dishes
- Filtering by cuisine
- Seeing promotions
- Checking rating, delivery fee, and delivery time
- Opening restaurant detail pages
- Adding food to cart later

The screen should feel tasty, visual, and fast.

---

## 9.2 Restaurants Screen Visual Personality

The restaurant interface should be:

- White and clean
- Food-photo focused
- Fast to scan
- Rich in images
- Minimal in text
- Yellow/red used only as accents
- Premium, not crowded

The home selection screen can be colorful.  
The restaurants screen should be cleaner so food images stand out.

---

## 9.3 Restaurants Header

### Header layout

```text
←  Restaurants                         [Offers] [Filter]
   Safi • 35 places available
```

### Background

```css
background: #FEFDF8;
```

or:
```css
background: #FFFFFF;
```

### Header title

```text
Restaurants
```

Typography:
```css
font-size: 24px;
font-weight: 800;
color: #1C1C1E;
```

### Header subtitle

Examples:
```text
Safi • 35 places available
```

```text
Delivering to Plateau
```

```text
Open restaurants near you
```

Typography:
```css
font-size: 12.5px;
font-weight: 500;
color: #6F6F76;
```

### Header actions

Action 1:
- Offers icon or small ticket icon

Action 2:
- Filter sliders icon

Each action:
```css
width: 40px;
height: 40px;
border-radius: 999px;
background: white;
border: 1px solid #E8E6DF;
```

### Behavior

Back button:
- Returns to selection screen.

Offers icon:
- Scrolls to promotion section or opens offer filter.

Filter icon:
- Opens restaurant filters bottom sheet.

---

## 9.4 Restaurants Search Bar

Position:
- Immediately below header title area

Placeholder:
```text
Search restaurants or dishes
```

Alternative:
```text
Craving pizza, tacos, burgers...?
```

Style:
```css
height: 50px;
border-radius: 18px;
background: #F5F4F0;
border: 1px solid #E8E6DF;
```

Inside:
```text
[Search icon] Search restaurants or dishes       [Sliders optional]
```

Behavior:
- Tap opens search interface.
- Search is scoped to Restaurants.
- Suggestions:
  - Pizza
  - Tacos
  - Burger
  - Poulet
  - Sushi
  - Tajine
  - Coffee
  - Desserts

---

## 9.5 Cuisine Category Row

This row is horizontal and appears below the search bar.

### Categories

Use city-specific categories.

Recommended categories:
```text
All
Offers
Burgers
Pizza
Tacos
Moroccan
Chicken
Sandwiches
Sushi
Desserts
Coffee
Healthy
Fast food
```

### Category design

Each item:
```css
height: 76px;
min-width: 76px;
border-radius: 20px;
background: #FFFFFF;
border: 1px solid #E8E6DF;
box-shadow: 0 4px 14px rgba(28,28,30,0.04);
```

Icon:
- 28–34px
- Soft illustrated icon
- Not too detailed

Label:
```css
font-size: 11px;
font-weight: 700;
```

Active:
```css
background: #FFF3B8;
border-color: #F5CE2E;
```

### UX detail

The first item “All” is active by default.  
When selecting a cuisine, update the feed without full page reload.

---

## 9.6 Quick Filters Row

Below categories.

Filters:
```text
Free delivery
Under 30 min
Top rated
Open now
Promos
Sort
```

### Filter chip style

```css
height: 34px;
border-radius: 999px;
background: #FFFFFF;
border: 1px solid #E8E6DF;
padding-horizontal: 12px;
```

If selected:
```css
background: #1C1C1E;
color: #FFFFFF;
```

### Sort behavior

Tapping “Sort” opens bottom sheet:

Sort options:
```text
Recommended
Fastest delivery
Top rated
Lowest delivery fee
Nearest
Newest
```

---

## 9.7 Restaurants Promo Banner

Place after filters.

### Layout

```text
[Text content]                         [Food illustration/image]
```

### Example content

```text
Free delivery today
On selected restaurants near you
[Explore offers]
```

Alternative:
```text
Hungry now?
Fast restaurants under 30 min
[See fast options]
```

### Style

```css
height: 116px;
border-radius: 24px;
background:
  radial-gradient(circle at 90% 15%, rgba(255,255,255,0.35), transparent 30%),
  linear-gradient(135deg, #F5CE2E 0%, #FFDA55 55%, #F03030 140%);
box-shadow: 0 10px 28px rgba(245,206,46,0.20);
```

Text:
- Title: 18px, 800
- Subtitle: 12.5px, 500
- CTA pill: white background, charcoal text

Image:
- Food bowl/burger/tajine illustration on right
- Slightly overlapping card edge
- Not too big

---

## 9.8 Main Restaurant Feed

The restaurant feed should be vertically scrollable.

Recommended sections:

1. **Featured near you**
2. **Fast delivery**
3. **Promotions**
4. **Popular in Safi**
5. **Moroccan favorites**
6. **New on Jaheez**
7. **Order again**
8. **All restaurants**

Do not show all sections at once if no data.  
Use only relevant sections.

---

## 9.9 Section Header

Each section has:

```text
Featured near you                       See all
```

Style:
```css
font-size: 18px;
font-weight: 800;
color: #1C1C1E;
```

“See all”:
```css
font-size: 12px;
font-weight: 700;
color: #F03030;
```

Spacing:
```text
margin-top: 24px
margin-bottom: 12px
```

---

## 9.10 Restaurant Card — Full Anatomy

Use large vertical restaurant cards for premium browsing.

### Card layout

```text
┌──────────────────────────────────┐
│ Restaurant image                 │
│ [Promo badge]        [Favorite]  │
│                                  │
└──────────────────────────────────┘
Restaurant Name
Cuisine type • Distance
⭐ 4.7   🛵 Free   🕒 20–35 min
```

### Card container

```css
background: transparent;
margin-bottom: 22px;
```

### Image container

```css
height: 164px;
border-radius: 24px;
overflow: hidden;
background: #F5F4F0;
```

Image:
```css
width: 100%;
height: 100%;
object-fit: cover;
```

### Overlay badges

Top-left badge:
```text
-30%
Free delivery
Sponsored
New
```

Style:
```css
height: 26px;
padding: 0 10px;
border-radius: 999px;
background: #FFFFFF;
font-size: 11px;
font-weight: 800;
```

Top-right favorite button:
```css
width: 34px;
height: 34px;
border-radius: 999px;
background: rgba(255,255,255,0.92);
```

Icon:
- Heart outline
- If favorite: red filled heart

### Restaurant name

```css
font-size: 16px;
font-weight: 800;
color: #1C1C1E;
margin-top: 10px;
```

### Cuisine line

Example:
```text
Tacos • Fast food • 1.2 km
```

Style:
```css
font-size: 12.5px;
font-weight: 500;
color: #6F6F76;
```

### Metadata row

Example:
```text
⭐ 4.7   🛵 Free   🕒 20–35 min
```

Style:
```css
font-size: 12px;
font-weight: 700;
color: #1C1C1E;
```

Use small separators:
```text
•
```

### Delivery fee

If free:
- Use green or charcoal text
- Optional soft green badge

Example:
```text
Free delivery
```

### Closed state

If restaurant closed:

Image overlay:
```css
background: rgba(28,28,30,0.45);
```

Badge:
```text
Closed
Opens at 12:00
```

Card opacity:
- Do not hide completely
- Make it visibly disabled

### Sponsored state

If sponsored:
- Small `Sponsored` label
- Use subtle gray
- Do not make it look like fake organic result

---

## 9.11 Compact Restaurant Card Variant

Use compact horizontal cards for “Order again” or dense lists.

Layout:

```text
[Image 92×92]  Restaurant Name
               Last order / cuisine
               ⭐ 4.6 • 20–30 min
               [Reorder]
```

Container:
```css
height: 112px;
border-radius: 22px;
background: white;
border: 1px solid #E8E6DF;
padding: 10px;
```

---

## 9.12 Restaurant Filter Bottom Sheet

When tapping filter icon:

### Sheet title

```text
Filter restaurants
```

### Sections

```text
Delivery
- Free delivery
- Under 30 min
- Open now

Rating
- 4.5+
- 4.0+

Offers
- Promotions
- New restaurants

Cuisine
- Burger
- Pizza
- Moroccan
- Tacos
```

### Footer

Sticky buttons:
```text
Clear all              Apply filters
```

Apply button:
- Full/half width
- Red or charcoal
- Rounded 18px

---

## 9.13 Restaurants Empty State

If no restaurants match:

```text
No restaurants found
Try another cuisine or remove filters.
```

Illustration:
- Empty plate or delivery bag

CTA:
```text
Clear filters
```

---

## 9.14 Restaurants Loading State

Use skeletons:
- Header remains visible
- Search bar skeleton
- Category skeleton chips
- Promo banner skeleton
- Restaurant card skeletons

Do not show a blank screen.

---

## 9.15 Restaurants Footer

At the bottom of the screen:

### Bottom navigation

Fixed:
```text
Home | Search | Orders | Cart | Profile
```

Home or Search active depending on navigation logic.  
Since user came from Home selection, keep **Home active** or use service-specific active state.

### Floating cart bar

If cart has items:

```text
2 items • 84 MAD                  View cart
```

Style:
```css
position: fixed;
bottom: bottomNavHeight + 10px;
left: 20px;
right: 20px;
height: 56px;
border-radius: 18px;
background: #1C1C1E;
color: white;
box-shadow: 0 14px 40px rgba(28,28,30,0.20);
```

CTA text:
- Yellow or white
- Bold

Animation:
- Slide up
- Fade in
- Small bounce

---

# 10. Courses / Groceries Interface

The Courses screen appears when user taps **Courses**.

Unlike Restaurants, this screen is more product-focused.

---

## 10.1 Purpose

Help users buy daily essentials quickly.

The user may want:
- Milk
- Bread
- Water
- Eggs
- Vegetables
- Cleaning products
- Snacks
- Baby items
- Hygiene products

---

## 10.2 Header

```text
←  Courses                            [Cart] [Filter]
   Daily essentials near you
```

Subtitle examples:
```text
Supermarkets and essentials
```

```text
Delivered to Safi, Plateau
```

---

## 10.3 Search Bar

Placeholder:
```text
Search milk, bread, water...
```

This should be more product-oriented than restaurant search.

---

## 10.4 Grocery Categories

Horizontal or 2-row scroll.

Categories:
```text
All
Fruits
Vegetables
Drinks
Bakery
Dairy
Snacks
Cleaning
Hygiene
Baby
Frozen
Meat
```

Cards:
- Slightly square
- Product illustration centered
- Label below
- Soft pastel backgrounds

---

## 10.5 Grocery Promo Banner

Example:

```text
Daily essentials
Save on water, milk and bread today
[Shop now]
```

Color:
- Soft green/yellow
- Clean and fresh

---

## 10.6 Grocery Content Sections

Recommended sections:

1. Supermarkets near you
2. Essentials for today
3. Promotions
4. Popular products
5. Drinks
6. Cleaning products
7. Reorder again

---

## 10.7 Product Card

### Card anatomy

```text
[Product image]
Product name
Size / weight
Price
[+]
```

### Style

```css
width: 148px;
min-height: 218px;
border-radius: 22px;
background: white;
border: 1px solid #E8E6DF;
padding: 12px;
```

Image container:
```css
height: 96px;
background: #F5F4F0;
border-radius: 16px;
```

Name:
```css
font-size: 13px;
font-weight: 700;
```

Size:
```css
font-size: 11px;
color: #6F6F76;
```

Price:
```css
font-size: 15px;
font-weight: 800;
```

Add button:
```css
width: 34px;
height: 34px;
border-radius: 999px;
background: #F03030;
color: white;
```

After adding:
- Button becomes quantity stepper:
```text
[-] 1 [+]
```

---

## 10.8 Grocery Footer Behavior

If items are added:
- Floating cart bar appears.
- User can continue browsing.
- Cart bar updates live.

Example:
```text
5 items • 112 MAD                 View cart
```

---

# 11. Boutiques / Shops Interface

The Boutiques screen appears when the user taps **Boutiques**.

---

## 11.1 Purpose

Help users discover local shops and non-food items.

Examples:
- Beauty products
- Electronics
- Gifts
- Flowers
- Home items
- Fashion
- Pet items
- Accessories

---

## 11.2 Header

```text
←  Boutiques                         [Filter]
   Local shops delivered
```

---

## 11.3 Search Bar

Placeholder:
```text
Search shops or products
```

---

## 11.4 Shop Categories

Categories:
```text
All
Beauty
Electronics
Gifts
Flowers
Home
Fashion
Pets
Books
Toys
Accessories
```

Icon style:
- Elegant shopping-related icons
- Slightly more lifestyle/premium than groceries

---

## 11.5 Boutique Promo Banner

Example:

```text
Local shops, delivered
Discover stores around you
[Explore]
```

Color:
- Soft red/pink/yellow
- Elegant, not childish

---

## 11.6 Shop Card

### Card layout

```text
[Shop image or logo]
Shop name
Category • Distance
Delivery 25–45 min
Promo badge optional
```

### Visual style

Shop cards can be vertical or horizontal.

Recommended:
- Horizontal for local shops
- Vertical for featured shops

Horizontal card:
```css
height: 112px;
border-radius: 22px;
background: white;
border: 1px solid #E8E6DF;
padding: 10px;
```

Image:
```css
width: 92px;
height: 92px;
border-radius: 18px;
```

---

## 11.7 Sections

Recommended sections:

1. Featured shops
2. Popular today
3. Gift ideas
4. Beauty & care
5. Shops near you
6. New shops

---

# 12. Service Coursier Interface

The Coursier screen appears when user taps **Service Coursier**.

This is different from Restaurants, Courses, and Boutiques.

It is not a listing page.  
It is a **task creation interface**.

---

## 12.1 Purpose

The user wants to send something from one place to another.

Examples:
- Documents
- Keys
- Small package
- Clothes
- Gift
- Item from home to friend
- Pickup from store

---

## 12.2 Header

```text
←  Service Coursier                  [Help]
   Send packages across the city
```

Use a calm blue/yellow accent.

---

## 12.3 Hero Explanation Card

At the top below header:

```text
Send anything safely
Choose pickup and drop-off locations. We’ll estimate the price.
```

Style:
```css
border-radius: 24px;
background: linear-gradient(135deg, #DDEEFF, #FFF3B8);
padding: 18px;
```

Right side:
- Package/scooter illustration

---

## 12.4 Address Flow Component

This is the core of the courier screen.

Layout:

```text
● Pickup location
│
● Drop-off location
```

### Pickup field

```text
Pickup location
Where should the courier pick up?
```

### Drop-off field

```text
Drop-off location
Where should we deliver?
```

Style:
```css
background: white;
border-radius: 22px;
border: 1px solid #E8E6DF;
padding: 16px;
```

Dots:
- Pickup: yellow or green
- Drop-off: red
- Connecting line: dashed gray

Behavior:
- Tapping each field opens address search/map
- Selected address appears with title and street line
- User can edit

---

## 12.5 Package Details

Below addresses.

Fields:
```text
Package size
Small / Medium / Large

Package type
Documents / Food / Clothes / Other

Fragile?
Yes / No

Recipient phone
Input field

Notes
Optional text area
```

Use chips instead of dropdowns where possible.

### Package size chips

```text
Small
Medium
Large
```

Selected:
```css
background: #1C1C1E;
color: white;
```

---

## 12.6 Price Estimate Box

After required fields are filled:

```text
Estimated price
18–25 MAD
```

Also show:
```text
Final price may change depending on distance and package details.
```

---

## 12.7 Sticky Bottom CTA

Bottom button:

Disabled:
```text
Add pickup and drop-off
```

Enabled:
```text
Get price
```

After price:
```text
Confirm courier request
```

Style:
```css
height: 56px;
border-radius: 18px;
background: #F03030;
color: white;
font-weight: 800;
```

---

# 13. Pharmacy Interface

The Pharmacy screen appears when user taps **Pharmacy**.

---

## 13.1 Purpose

Help users find pharmacy/health items safely.

This screen should feel:
- Clean
- Trustworthy
- Calm
- Less playful than restaurants
- Clear about availability

---

## 13.2 Header

```text
←  Pharmacy                           [Help]
   Health essentials near you
```

---

## 13.3 Search Bar

Placeholder:
```text
Search health items
```

Avoid implying medical diagnosis.  
Keep it as shopping/discovery.

---

## 13.4 Categories

```text
All
First aid
Baby care
Vitamins
Personal care
Hygiene
Masks
Thermometers
Skin care
```

---

## 13.5 Warning / Safety Notice

Add a small notice card:

```text
For urgent medical needs, contact emergency services or a professional.
```

Style:
- Light green/cream
- Small icon
- Not alarming

---

## 13.6 Product Card

Similar to grocery product card, but cleaner:
- Product image
- Name
- Category
- Price if available
- Add button

If restricted/unavailable:
```text
Ask pharmacy
```

---

# 14. Gifts Interface

The Gifts screen appears when user taps **Gifts**.

---

## 14.1 Purpose

Help users send gifts or surprises.

The screen should feel emotional and elegant.

---

## 14.2 Header

```text
←  Gifts                              [Occasions]
   Surprise someone today
```

---

## 14.3 Search Bar

Placeholder:
```text
Search flowers, chocolate, gifts...
```

---

## 14.4 Occasion Categories

```text
Birthday
Flowers
Chocolate
Love
Thank you
New baby
Apology
Graduation
Custom
```

Use elegant icons.

---

## 14.5 Gift Promo Banner

Example:

```text
Send a surprise
Flowers, sweets and gifts delivered today
[Choose gift]
```

Use soft pink/yellow gradient.

---

## 14.6 Gift Card

```text
[Gift image]
Gift title
Short description
Price
[Add]
```

Add optional:
- Gift message
- Recipient phone
- Delivery date/time

Footer:
- Floating gift cart/request bar

---

# 15. Anything / Custom Request Interface

The Anything screen appears when user taps **Anything**.

This can be a signature Jaheez feature.

---

## 15.1 Purpose

The user describes something custom they need.

Examples:
```text
Buy me a charger from a nearby shop.
Pick up my documents from home.
Bring me something from the market.
Find this item and deliver it.
```

---

## 15.2 Header

```text
←  Anything                           [Help]
   Tell us what you need
```

Use a darker premium feel.

---

## 15.3 Main Input Card

Large text area:

```text
Describe what you need...
```

Style:
```css
min-height: 140px;
border-radius: 24px;
background: white;
border: 1px solid #E8E6DF;
padding: 16px;
```

Optional:
- Add photo
- Add pickup address
- Add delivery address
- Add budget
- Add notes

---

## 15.4 Suggestion Chips

Below input:

```text
Buy an item
Pick up package
Send documents
Find a product
Custom errand
```

Tap chip fills starter text.

---

## 15.5 Photo Upload

Card:

```text
Add photo
Show us the item if you have a picture.
```

Useful for custom requests.

---

## 15.6 Bottom CTA

Disabled:
```text
Describe your request
```

Enabled:
```text
Continue
```

Next step:
- Confirm address
- Estimate price
- Send request to admin/courier

---

# 16. Bottom Navigation — Destination Pages

Bottom nav should stay consistent.

Tabs:
```text
Home
Search
Orders
Cart
Profile
```

## Recommended behavior

- Home remains active if user entered service from home.
- Search active only on full search screen.
- Cart badge updates globally.
- Orders opens order history.
- Profile opens account.

Style:
```css
height: 78–88px;
background: rgba(255,255,255,0.94);
border-top: 1px solid rgba(232,230,223,0.7);
box-shadow: 0 -8px 24px rgba(28,28,30,0.05);
backdrop-filter: blur(16px);
```

---

# 17. Common Loading States

Every service screen must handle loading.

Loading should show:
- Header visible
- Search skeleton
- Category skeletons
- Card skeletons

Skeleton style:
```css
background: linear-gradient(90deg, #F1F0EC, #FAF9F5, #F1F0EC);
border-radius: 18px;
```

---

# 18. Common Empty States

## No service available

```text
This service is not available in your area yet.
```

CTA:
```text
Notify me
```

## No results found

```text
No results found
Try another search or remove filters.
```

CTA:
```text
Clear filters
```

## Offline

```text
You’re offline
Check your connection and try again.
```

CTA:
```text
Retry
```

---

# 19. Motion Details

## Page entrance

```text
Header: fade + translateY(-8)
Search: fade + translateY(8)
Categories: fade + translateX(12)
Cards: stagger fade + translateY(14)
```

## Card press

```text
scale: 0.97
shadow: reduced
image: slight zoom 1.02
```

## Filter bottom sheet

```text
overlay fade
sheet slide up
spring easing
```

## Floating cart bar

```text
slide from bottom
fade in
small bounce
```

---

# 20. Component Library

Create reusable components:

```text
ServiceDestinationLayout
ServiceHeader
BackButton
HeaderActionButton
ContextSearchBar
CategoryCarousel
FilterChipRow
PromoBanner
SectionHeader
RestaurantCard
CompactRestaurantCard
ProductCard
ShopCard
CourierAddressFlow
CourierPackageForm
FloatingCartBar
BottomNavigation
FilterBottomSheet
AddressSearchSheet
LoadingSkeleton
EmptyState
```

---

# 21. Antigravity Master Prompt

Use this prompt inside Antigravity:

```text
You are a senior mobile UI/UX designer and frontend engineer.

Create the Jaheez service destination interfaces that appear after a user selects a service from the main selection screen.

Focus especially on the Restaurants interface, but also create adaptable layouts for Courses/Groceries, Boutiques/Shops, Service Coursier, Pharmacy, Gifts, and Anything/Custom Request.

Do not copy Glovo or any existing app directly. Use the general multi-service delivery UX pattern, but create a premium, elegant, original Jaheez design for Morocco.

Global requirements:
- Mobile-first design for 390×844.
- Responsive for 360–430px widths.
- Use Jaheez colors: yellow #F5CE2E, red #F03030, warm white #FEFDF8, cream #FFFBEE, charcoal #1C1C1E, light gray #F5F4F0, border #E8E6DF.
- Use Plus Jakarta Sans for Latin and Cairo for Arabic/Darija.
- Use rounded cards, 18–28px radii, soft shadows, clean spacing.
- Every destination page must include a sticky header, back button, service title, service-specific search bar, category row, filter row, promo/banner area, content feed, bottom navigation, and empty/loading states.
- When a service opens from the selection screen, use a smooth transition overlay with Jaheez icon.

Restaurants interface:
- Header with back button, title “Restaurants”, subtitle with city/address or available restaurants, offers icon, filter icon.
- Search bar placeholder “Search restaurants or dishes”.
- Horizontal cuisine categories: All, Offers, Burgers, Pizza, Tacos, Moroccan, Chicken, Sandwiches, Sushi, Desserts, Coffee.
- Filter chips: Free delivery, Under 30 min, Top rated, Open now, Promos, Sort.
- Promo banner: “Free delivery today” or “Hungry now?” with food illustration.
- Sections: Featured near you, Fast delivery, Promotions, Popular in Safi, Moroccan favorites, New on Jaheez, Order again, All restaurants.
- Restaurant cards with large rounded image, promo badge, favorite button, restaurant name, cuisine line, rating, delivery fee, delivery time, closed state, sponsored state.
- Add a filter bottom sheet with delivery, rating, offers, and cuisine filters.
- Add skeleton loading and empty states.

Courses/Groceries interface:
- Header title “Courses”.
- Search placeholder “Search milk, bread, water...”.
- Product-focused categories: Fruits, Vegetables, Drinks, Bakery, Dairy, Snacks, Cleaning, Hygiene, Baby, Frozen.
- Product cards with image, name, size, price, add button, quantity stepper.
- Floating cart bar when products are added.

Boutiques/Shops interface:
- Header title “Boutiques”.
- Search placeholder “Search shops or products”.
- Categories: Beauty, Electronics, Gifts, Flowers, Home, Fashion, Pets, Books, Toys.
- Shop cards with shop image/logo, name, category, distance, delivery time, promo badge.

Service Coursier interface:
- Header title “Service Coursier”.
- This is a task creation screen, not a listing page.
- Include pickup location, drop-off location, package size, package type, fragile toggle, recipient phone, notes, price estimate, sticky CTA.
- Use a visual pickup/drop-off vertical route line.

Pharmacy interface:
- Header title “Pharmacy”.
- Search health items.
- Categories for first aid, baby care, vitamins, hygiene, personal care.
- Add a small safety notice card.
- Product cards should feel clean and trustworthy.

Gifts interface:
- Header title “Gifts”.
- Search flowers, chocolate, gifts.
- Occasion categories: Birthday, Flowers, Chocolate, Love, Thank you, New baby, Apology, Graduation.
- Gift cards with image, title, description, price, add button.
- Emotional soft pink/yellow visual style.

Anything interface:
- Header title “Anything”.
- Large text area where user describes a custom request.
- Suggestion chips like Buy an item, Pick up package, Send documents, Find a product.
- Add photo option.
- Address/budget/notes options.
- CTA to continue.

Animations:
- Page entrance stagger.
- Card press scale.
- Category active animation.
- Filter bottom sheet slide-up.
- Floating cart bar slide-up.
- Smooth service transition from selection screen.

Final result must feel production-ready, premium, clean, smooth, Moroccan-friendly, and original to Jaheez.
```

---

# 22. Acceptance Criteria

The design is correct only if:

- It clearly represents the screen after selecting a service.
- Restaurants screen is fully detailed from header to footer.
- Other service screens have service-specific layouts.
- Header, search, categories, filters, content feed, bottom nav, loading, empty states are included.
- Restaurant cards include image, badge, favorite, name, cuisine, rating, fee, time, open/closed state.
- Groceries has product cards and add-to-cart behavior.
- Courier has pickup/drop-off and form flow.
- Anything has a custom request flow.
- UI uses Jaheez brand colors.
- Design is mobile-first.
- Animations are smooth.
- The experience feels like Jaheez, not a direct clone.
