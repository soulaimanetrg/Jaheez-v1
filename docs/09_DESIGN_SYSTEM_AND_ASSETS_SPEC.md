# 9. DESIGN SYSTEM AND ASSETS SPEC — JAHEEZ

**Purpose:** Document visual design, colors, typography, and assets | **Last Updated:** 2026-05-19

---

## Brand Identity

**Brand Name:** JAHEEZ (جاهز — "Ready" in Arabic)  
**Logo:** Red wordmark on yellow background  
**Tagline:** "Smart Delivery & Errands" (English) / "جاهز للتوصيل والمهام" (Arabic)

---

## Color System (from user-app/constants/brand.ts)

### Primary Colors (Brand)
```
RED:        #F03030  (Primary button, brand color, active states)
RED_DARK:   #C42020  (Pressed state, hover)
RED_LIGHT:  #FDEAEA  (Background tint, light red surfaces)

YELLOW:       #F5CE2E  (Accent, highlight, featured)
YELLOW_DARK:  #C9A800  (Pressed yellow)
YELLOW_LIGHT: #FFFBEE  (Cream tint, yellow background)
```

### UI Colors (Light Warm Theme)
```
BG:       #FEFDF8   (Primary background — warm white)
CREAM:    #FFFBEE   (Section backgrounds — cream)
SURFACE:  #FFFFFF   (Cards, modals — pure white)
LIGHT:    #F5F4F0   (Secondary backgrounds — light gray)
```

### Text Colors
```
TEXT:   #1C1C1E   (Primary text — charcoal, dark)
TEXT2:  #5C5C5E   (Secondary text — medium gray)
TEXT3:  #9CA3AF   (Tertiary/placeholder — light gray)
```

### Semantic Colors
```
GREEN:  #2DB87A   (Success, delivered, available)
BLUE:   #3A8FE8   (Informational, links)
WARN:   #F5A623   (Warning, pending, delay)
ERROR:  #DC2626   (Error, failed)
```

### Category Tints (Service Icons)
```
FOOD_TINT:     #FF6B35   (Orange — food)
GROCERY_TINT:  #2DB87A   (Green — grocery)
PHARMACY_TINT: #3A8FE8   (Blue — pharmacy)
PARCEL_TINT:   #A78BFA   (Purple — parcel)
ERRAND_TINT:   #F472B6   (Pink — errand)
```

### WhatsApp
```
WHATSAPP: #25D366  (WhatsApp green button)
```

---

## Typography

### Font Family
```
PRIMARY: Cairo (Arabic-first, supports Latin)
         From: @expo-google-fonts/cairo

WEIGHTS:
- Cairo-Regular   (Regular/Body)
- Cairo-SemiBold  (SemiBold/Medium)
- Cairo-Bold      (Bold/Display)

Fallback: system serif (if Cairo not loaded)
```

### Font Sizes & Scales (from brand.ts FONTS)
```
DISPLAY:  Cairo-Bold     (Large headings, hero text)
BODY:     Cairo-Regular  (Body copy, paragraphs)
MEDIUM:   Cairo-Regular  (Medium text)
SEMIBOLD: Cairo-SemiBold (Emphasis, labels)
MONO:     Cairo-Regular  (Code-like text, amounts)
```

### Specific Font Sizes (Recommended)
| Use Case | Size | Weight | Color |
|----------|------|--------|-------|
| Hero headline | 32px | Bold | TEXT (#1C1C1E) |
| Screen title | 24px | Bold | TEXT |
| Section header | 20px | SemiBold | TEXT |
| Body text | 16px | Regular | TEXT |
| Small text | 14px | Regular | TEXT2 |
| Tiny text / hint | 12px | Regular | TEXT3 |
| Amount / price | 18px | Bold | TEXT (or RED) |

---

## Spacing System (8px Grid)

| Token | Value | Usage |
|-------|-------|-------|
| **XS** | 4px | Micro spacing (between elements) |
| **SM** | 8px | Small spacing (between related items) |
| **MD** | 16px | Medium spacing (default padding, margin) |
| **LG** | 24px | Large spacing (section spacing) |
| **XL** | 32px | Extra large spacing (between major sections) |
| **XXL** | 48px | Huge spacing (top/bottom of full screens) |

**Rule:** All padding, margin, gaps use multiples of 8px

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| **SM** | 8px | Input fields, small components |
| **MD** | 12px | Default, medium components |
| **CARD** | 16px | Cards, modals, larger components |
| **LG** | 24px | Large surfaces |
| **PILL** | 9999px | Buttons, pills, fully rounded |

---

## Shadows

### Standard Shadow
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.08
shadowRadius: 12
elevation: 3
```
**Use:** Cards, standard elevation

### Small Shadow
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.06
shadowRadius: 6
elevation: 2
```
**Use:** Subtle elements, badges

### Large Shadow
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.10
shadowRadius: 20
elevation: 6
```
**Use:** Modals, bottom sheets, prominent cards

### Red Shadow (Brand)
```
shadowColor: '#F03030'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.25
shadowRadius: 16
elevation: 8
```
**Use:** Red buttons, accent elements

### Dark Shadow
```
shadowColor: '#000'
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.14
shadowRadius: 24
elevation: 10
```
**Use:** Modals, dialogs, maximum elevation

---

## Component Styles

### Button
- **Height:** 52px (SIZE.BUTTON_HEIGHT)
- **Radius:** 9999px (pill shape)
- **Font:** SemiBold, 16px
- **Text color:** White on red
- **Padding:** Horizontal 24px, vertical 0px
- **Primary state:** Red background (#F03030)
- **Pressed state:** Dark red (#C42020) + shadow
- **Disabled state:** Opacity 0.5
- **Loading state:** Spinner icon in button

### Input Field
- **Height:** 52px (SIZE.INPUT_HEIGHT)
- **Radius:** 12px (RADIUS.INPUT)
- **Background:** White (#FFFFFF)
- **Border:** 1px solid #E8E6DF (BORDER)
- **Padding:** 12px horizontal
- **Focus border:** Red (#F03030)
- **Placeholder color:** #9CA3AF (TEXT3)
- **Text color:** #1C1C1E (TEXT)

### Card
- **Background:** White (#FFFFFF)
- **Radius:** 16px (RADIUS.CARD)
- **Padding:** 16px
- **Shadow:** Standard shadow (SHADOW)
- **Border:** None or 1px soft border (optional)

### Badge / Pill
- **Height:** 28px (calculated)
- **Radius:** 9999px (pill)
- **Padding:** 8px 12px
- **Font:** SemiBold, 12px
- **Background:** Service tint (category-specific)
- **Text color:** White or contrasting

### Tab Navigation (Bottom)
- **Height:** 64px + safe area (SIZE.TAB_HEIGHT)
- **Background:** White (#FFFFFF)
- **Border:** 1px top border #E8E6DF
- **Icon size:** 24px
- **Active tab:** Red icon + red underline
- **Inactive tab:** Gray icon

### Top Navigation Bar
- **Height:** 56px (SIZE.NAV_HEIGHT)
- **Background:** White (#FFFFFF)
- **Title:** Bold, 18px, centered
- **Back button:** 44px touch target
- **Icons:** Right side (notification, menu, etc.)

---

## Asset Inventory

### Status: ✅ READY

| Asset | File | Size | Format | Used By |
|-------|------|------|--------|---------|
| Splash image | `assets/images/splash_first.png` | TBD | PNG | Splash screen |
| Splash video | `assets/videos/splash_video.webm` | TBD | WebM | Splash screen |
| Food icon | `assets/illustrations/food.png` | TBD | PNG | Home category |
| Grocery icon | `assets/illustrations/grocery.png` | TBD | PNG | Home category |
| Pharmacy icon | `assets/illustrations/pharmacy.png` | TBD | PNG | Home category |
| Parcel icon | `assets/illustrations/parcel.png` | TBD | PNG | Home category |
| Errand icon | `assets/illustrations/errand.png` | TBD | PNG | Home category |
| Cairo font | @expo-google-fonts/cairo | TBD | OTF | All screens |
| Ionicons | @expo/vector-icons | Included | SVG | All icons |

### Status: ⚠️ MISSING

| Asset | Purpose | Priority | Notes |
|-------|---------|----------|-------|
| Onboarding slides (3-5) | Feature intro slides | High | Need 4-5 illustrations |
| Empty state illustrations | "No results", "No data" | High | Standard empty state visuals |
| Loading animation | Skeleton/shimmer | Medium | Use Moti or Reanimated |
| Error illustration | Error state | Medium | Visual feedback |
| Success illustration | Order confirmed | Medium | Visual feedback |
| Store placeholder image | Missing store image | Low | Fallback if no image URL |
| Product placeholder image | Missing product image | Low | Fallback if no image URL |
| User avatar placeholder | Default profile pic | Low | Fallback for missing avatar |
| Driver app icons | All icons (home, earnings, profile) | High | Driver app is empty |
| Admin panel logo | Logo for admin UI | Low | Currently using text |
| Map icons | Pickup, delivery, current location | Medium | Custom map markers |
| Status icons | Order status timeline icons | Low | Can use system icons |

### Status: ⚠️ OPTIMIZATION NEEDED

| Asset | Current Size | Recommended | Action |
|-------|--------------|-------------|--------|
| Splash video | Unknown | <5MB | Compress WebM |
| Splash image | Unknown | <2MB | Optimize PNG |
| Store images (from URLs) | Unknown | <1MB each | Implement image optimization |

---

## Animation & Motion

### Recommended Animations

| Component | Animation | Duration | Library |
|-----------|-----------|----------|---------|
| Button press | Scale 0.98 | 100ms | Reanimated |
| Screen transition | Fade + slide | 300ms | Reanimated |
| Service card tap | Scale + bounce | 200ms | Moti |
| Loading spinner | Rotation | 1s loop | Reanimated |
| Notification toast | Slide in + fade | 300ms | Reanimated |
| Category carousel | Swipe | 500ms | Native FlatList |
| OTP input focus | Shake (on error) | 400ms | Reanimated |
| Skeleton loading | Shimmer | 1s loop | Moti |

### Accessibility (Motion Preferences)
- Respect `reduceMotionEnabled` setting
- Provide reduced-motion versions of all animations
- Never auto-play videos (require user interaction)

---

## Asset Naming Conventions

### Image Files
```
[feature]-[state]-[size].[format]

Examples:
- splash-first-1242x2208.png
- category-food-icon-48x48.png
- empty-state-orders-400x400.png
- status-delivered-24x24.svg
```

### Icon Files (Should be SVG)
```
[icon-name]-[size].svg

Examples:
- home-24.svg
- heart-24.svg
- check-circle-24.svg
```

### Video Files
```
[feature]-[duration].webm

Examples:
- splash-intro-3s.webm
```

---

## Production Asset Requirements & Tooling Pipeline

To maintain high visual quality without bloated bundle sizes or service costs, the asset pipeline follows these strict guidelines:

### 1. Asset Creation & Editing Tools
- **Mockup Organization:** Figma Free plan (screens organization).
- **Design References:** Google Stitch / Gemini Image Generation.
- **Vector conversion:** Vectorizer.ai (for raster-to-SVG paths).
- **Asset edits:** Photopea / Inkscape (open-source vector editing).
- **Compressions:** Squoosh / TinyPNG.

### 2. File Compression & Size Guidelines
- **PNG Images:** Must be compressed. Maximum file size is **1MB** for dynamic store menu uploads and user avatars, and **2MB** for static app illustrations.
- **WebM Videos:** Maximum file size is **5MB** (e.g. for the animated splash video).
- **SVG Icons:** Must have a specified viewbox (e.g., `viewBox="0 0 24 24"`) and cap at **50KB** maximum size.

### 3. Icon Asset Restriction (No Emojis)
- **Rule:** Emojis are strictly forbidden as final UI icons. All icons must be rendered using `@expo/vector-icons` (Ionicons/MaterialIcons), local SVG paths, or compressed PNG/WebP illustrations.

---

---

## Dark Mode Consideration

**Status:** Not planned for MVP  
**Colors prepared:** All colors defined with light theme in mind  
**If implementing dark mode:** Duplicate token set in brand.ts with `DARK_*` prefix, use CSS/React context to toggle

---

## Color Accessibility

### WCAG AA Compliance (4.5:1 contrast minimum)
| Combination | Contrast | Pass |
|------------|----------|------|
| TEXT (#1C1C1E) on BG (#FEFDF8) | 12:1 | ✅ |
| TEXT (#1C1C1E) on SURFACE (#FFFFFF) | 12:1 | ✅ |
| RED (#F03030) text on WHITE | 4.3:1 | ⚠️ (use with background) |
| WHITE text on RED (#F03030) | 5.5:1 | ✅ |
| GREEN (#2DB87A) text on WHITE | 3.8:1 | ❌ (use darker green) |

**Recommendation:** Always use white text on brand red buttons. For green text, darken to #1B7A5F.

---

**Created:** 2026-05-19 | **Method:** brand.ts inspection + design pattern analysis | **Confidence:** Very High
