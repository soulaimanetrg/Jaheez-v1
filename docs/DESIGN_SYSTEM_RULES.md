# JAHEEZ — Design System Rules (Frontend)
# Stitch "Kinetic Curator" Edition

> **Purpose**: JAHEEZ visual identity, brand tokens, premium animation system, typography, colors, component specifications, accessibility, and consistency rules.  
> **Design Source**: Aligned with **Google Stitch "Kinetic Curator"** design system. All colors, surfaces, and layout principles are derived from the Stitch project `7735348206415805658`.

---

## 1. Design Philosophy

JAHEEZ must feel **premium, alive, and trustworthy**. Every screen should look like it belongs to a top-tier delivery platform — not a student project.

### Core Principles

1. **Premium First** — Every interaction should feel polished and intentional. No raw defaults.
2. **Motion is Meaning** — Animations are not decoration; they communicate state, confirm actions, and guide attention.
3. **Arabic-Native** — RTL is the default. Arabic typography must feel native, not forced into a Latin layout.
4. **Brand Consistency** — Red for action, yellow for warmth, white for clarity. Always.
5. **Stitch-Driven** — Use Google Stitch to search for reference designs before building any screen. Keywords: `delivery app premium UI`, `food delivery dark`, `errand app arabic`, `mobile tracking screen`, `order confirmation animation`.

### Google Stitch Workflow

Before designing any screen:
1. Open Google Stitch in the IDE
2. Search for the screen type (e.g., "premium order tracking mobile" or "arabic login screen mobile")
3. Study 3-5 reference results for layout patterns, animation ideas, and visual hierarchy
4. Apply JAHEEZ brand tokens to the best patterns found
5. Document which Stitch results inspired each screen in comments

> **Rule**: Every screen must have a Stitch-inspired layout rationale. Never design from scratch without reference.

---

## 2. Brand Tokens

### 2.1 Color Palette

All colors are defined in `constants/brand.ts`. **Never hardcode hex values anywhere else.**

#### Primary Brand Colors (Stitch "Kinetic Curator" palette)

| Token | Hex | Usage |
|---|---|---|
| `RED` | `#AB3500` | Primary action — all CTAs, active nav, focused input, gradient start |
| `RED_DARK` | `#832600` | Pressed/active primary states |
| `RED_LIGHT` | `#FFDBD0` | Tinted primary surface, icon backgrounds, error tints |
| `YELLOW` | `#FF6B35` | Kinetic accent — vibrant warm orange, gradient end |
| `YELLOW_DARK` | `#E5592A` | Pressed accent states |
| `YELLOW_LIGHT` | `#FFF3ED` | Tinted accent surface, warm chip fills |

#### Surface Hierarchy (Tonal Layering)

| Token | Hex | Role |
|---|---|---|
| `BG` | `#FCF8FB` | Base canvas — all screen backgrounds |
| `SURFACE_LOW` | `#F6F3F5` | Section blocks — grouped content areas |
| `SURFACE` | `#FFFFFF` | Cards, modals — elevated above SURFACE_LOW |
| `SURFACE_HIGH` | `#EAE7EA` | Chips, input fills, tonal dividers, toggle tracks |
| `INPUT_BG` | `#F0EDEF` | Borderless input field fill |
| `BORDER` | `#E1BFB5` | Warm tonal — ONLY for ghost button outlines |

#### UI Text Colors

| Token | Hex | Usage |
|---|---|---|
| `TEXT` | `#1B1B1D` | Primary text — headings, body, labels |
| `TEXT2` | `#594139` | Secondary text — warm subtitles, captions, timestamps |
| `TEXT3` | `#9CA3AF` | Tertiary — placeholders, disabled labels |

#### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `GREEN` | `#22C55E` | Success, delivered, completed, earnings |
| `ERROR_RED` | `#BA1A1A` | Error states only (distinct from brand `RED`) |
| `WARN` | `#F59E0B` | Pending, delay, moderation review, amber alerts |

### 🚫 No-Line Rule (MANDATORY)

> **Never use 1px solid borders for sectioning UI elements.**

Boundaries between sections, cards, and list items must be defined by **background color shifts** only:
- `BG` canvas → `SURFACE_LOW` sections → `SURFACE` cards → `SURFACE_HIGH` chips
- Exceptions: 
  - Ghost button outlines: `1.5px BORDER` is allowed
  - Error state inputs: `2px ERROR_RED` is allowed
  - Never as a divider between content rows

- **RED is for action**: buttons, links, active tab indicators, CTAs, focus rings
- **YELLOW/ORANGE is for accent**: kinetic moments, gradient ends, warm highlights
- **WHITE/WARM SURFACES are for content**: tonal hierarchy without borders

### 2.2 Gradients

Gradients are used for CTAs, hero headers, and navigation bars. Always use `expo-linear-gradient`.

| Gradient | Colors | Angle | Usage |
|---|---|---|---|
| `GRADIENTS.PRIMARY` | `#AB3500 → #FF6B35` | 0° (left→right) | All primary buttons, top nav bars |
| `GRADIENTS.HERO` | `#AB3500 → #CC4010 → #FCF8FB` | 135° | Screen hero bands (header sections) |
| `GRADIENTS.WARM` | `#FFF3ED → #FCF8FB` | 180° | Warm section tints |
| `GRADIENTS.SUCCESS` | `#22C55E → #16A34A` | 135° | Success checkmarks, earnings |

> **Rule**: Gradients only on hero bands (header), CTAs (buttons), and nav bars. Never on small inline elements.

---

### 2.3 Glassmorphism

Used for floating elements that overlay content (nav bar, bottom tray, pill banners):

```
background: rgba(255, 255, 255, 0.85)
blur: 20px (expo-blur BlurView or BlurView from @react-native-community/blur)
border: none (No-Line Rule applies)
borderRadius: 24px minimum
```

---

## 3. Typography

### Font Families

| Font | Weight | Token | Usage |
|---|---|---|---|
| DM Sans | Regular (400) | `FONTS.BODY` | Body text, descriptions, captions |
| DM Sans | SemiBold (600) | `FONTS.SEMIBOLD` | Buttons, labels, sub-headings |
| DM Sans | Bold (700) | `FONTS.DISPLAY` | Headings, titles, emphasis |
| JetBrains Mono | Regular (400) | `FONTS.MONO` | Prices, OTP digits, order IDs, reference codes |
| JetBrains Mono | Bold (700) | `FONTS.MONO_BOLD` | Large prices, earnings display |

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| Display | 28px | Bold | 36px | Screen titles, hero text |
| Heading 1 | 24px | Bold | 32px | Section headers |
| Heading 2 | 20px | SemiBold | 28px | Card titles, modal titles |
| Heading 3 | 18px | SemiBold | 24px | Sub-section headers |
| Body Large | 16px | Regular | 24px | Primary body text |
| Body | 14px | Regular | 20px | Standard text, descriptions |
| Caption | 12px | Regular | 16px | Timestamps, helper text, footnotes |
| Micro | 10px | SemiBold | 14px | Badge labels, tiny indicators |

### Typography Rules

1. **Never use system fonts** — Always specify DM Sans or JetBrains Mono
2. **All prices in JetBrains Mono** — "25.00 MAD" must always be monospaced
3. **Arabic text**: DM Sans supports Arabic well; ensure RTL alignment
4. **Numbers**: Always use Western Arabic numerals (1, 2, 3) not Eastern (١, ٢, ٣)
5. **Currency format**: `{amount} MAD` with space, JetBrains Mono, no currency symbol
6. **Truncation**: Use ellipsis (...) after 2 lines for card titles, 1 line for list items

---

## 4. Spacing System

All spacing values are multiples of **8px**. No exceptions.

| Token | Value | Usage |
|---|---|---|
| `xs` | 4px | Icon padding, badge internal spacing (only exception) |
| `sm` | 8px | Between related elements, icon-to-text gap |
| `md` | 16px | Card padding, section spacing, input padding |
| `lg` | 24px | Between sections, modal padding |
| `xl` | 32px | Screen edge padding, large section gaps |
| `2xl` | 48px | Hero spacing, illustration gaps |
| `3xl` | 64px | Screen section separators |

### Spacing Rules

1. **Screen horizontal padding**: 16px (md) on all screens
2. **Card internal padding**: 16px (md) on all sides
3. **Space between cards**: 12px (1.5× sm)
4. **Space between sections**: 24px (lg)
5. **Bottom safe area**: Always respect device safe area insets
6. **Thumb zone**: Keep primary actions in the bottom 40% of the screen

---

## 5. Component Specifications

### 5.1 Buttons

| Property | Value |
|---|---|
| Height | 52px |
| Border radius | 9999px (pill / fully rounded) |
| Font | DM Sans SemiBold, 16px |
| Min touch target | 44px × 44px |
| Press animation | `scale(0.97)` with spring (damping: 15, stiffness: 150) |

| Variant | Background | Text | Border |
|---|---|---|---|
| `primary` | RED (`#EF4444`) | White | None |
| `secondary` | YELLOW (`#F2C94C`) | TEXT (`#1C1C1E`) | None |
| `ghost` | Transparent | RED | 1.5px RED |
| `danger` | ERROR_RED (`#DC2626`) | White | None |

#### Button States

| State | Visual Change | Animation |
|---|---|---|
| Default | As variant | — |
| Pressed | Darker variant + `scale(0.97)` | Spring 120ms |
| Loading | Replace label with spinner | Fade transition 200ms |
| Disabled | 50% opacity | No press response |

> **Premium touch**: On press, buttons should have a subtle haptic feedback (light impact) on iOS.

### 5.2 Inputs

| Property | Value |
|---|---|
| Height | 52px |
| Border radius | 12px |
| Background | INPUT_BG (`#F9FAFB`) |
| Font | DM Sans Regular, 16px |
| Placeholder color | TEXT3 (`#9CA3AF`) |
| Focus border | 2px RED (`#EF4444`) with animated transition |
| Error border | 2px ERROR_RED with shake animation |

#### Input Types

| Type | Behavior |
|---|---|
| `text` | Standard text input, RTL support |
| `phone` | Numeric keyboard, `+212` prefix hint |
| `password` | Secure entry, toggle eye icon |
| `otp` | 6 separate boxes, JetBrains Mono 32px, auto-advance, auto-submit |
| `number` | Numeric keyboard, right-aligned for prices |
| `multiline` | Expandable textarea, min 4 lines |

#### Focus Animation
When an input receives focus, animate the border from `BORDER` to `RED` over 200ms with an ease-out curve. The label (if floating) should translate up and scale down simultaneously.

### 5.3 Cards

| Property | Value |
|---|---|
| Background | SURFACE (`#FFFFFF`) |
| Border radius | 16px |
| Shadow | `0 4px 12px rgba(0,0,0,0.08)` |
| Padding | 16px |
| Margin bottom | 12px (default between cards) |

#### Interactive Cards
If a card is pressable:
- Add `scale(0.98)` on press with spring animation
- Add `opacity(0.95)` transition on press
- Ensure entire card surface is tappable (not just content)

### 5.4 Status Badges

| Status | Background | Text | Arabic Label |
|---|---|---|---|
| `pending_moderation` | `WARN` tint | `WARN` | قيد المراجعة |
| `pending_driver` | `YELLOW` tint | `TEXT` | بحث عن سائق |
| `driver_assigned` | `RED_LIGHT` | `RED_DARK` | تم التعيين |
| `in_progress` | `RED` | White | في الطريق |
| `picked_up` | `RED` | White | تم الاستلام |
| `delivered` | `GREEN` | White | تم التسليم |
| `completed` | `GREEN` | White | مكتمل |
| `cancelled` | `BORDER` | `TEXT2` | ملغي |
| `disputed` | `ERROR_RED` | White | متنازع عليه |
| `moderation_rejected` | `ERROR_RED` | White | مرفوض |

### 5.5 Bottom Sheet

| Property | Value |
|---|---|
| Background | SURFACE white |
| Top corners radius | 24px |
| Drag handle | 40px × 4px, `BORDER` color, centered, 8px from top |
| Overlay | Black at 40% opacity |
| Entry animation | Slide up with spring (damping: 20, stiffness: 200) |
| Exit animation | Slide down 250ms ease-in |
| Dismiss | Tap overlay or drag below threshold (30% of height) |

### 5.6 Navigation Bars

#### Bottom Tab Bar
| Property | Value |
|---|---|
| Height | 64px + safe area inset |
| Background | SURFACE white |
| Top border | 1px `BORDER` |
| Active icon | RED with label below |
| Inactive icon | TEXT3, no label |
| Active indicator | Small RED dot (6px) above icon |
| Tab switch | Cross-fade 150ms |

#### Top Navigation Bar
| Property | Value |
|---|---|
| Height | 56px |
| Background | SURFACE white |
| Title | DM Sans Bold, 18px, centered |
| Back button | 44px × 44px touch target, chevron-left icon |
| Shadow | Subtle 2px blur on scroll |

---

## 6. Premium Animation System

> **Philosophy**: Animations should be purposeful, fast, and delightful. Every transition should have a reason. Use Google Stitch to find reference animations for each interaction type.

### 6.1 Animation Config (defined in `constants/animations.ts`)

| Preset | Type | Config | Usage |
|---|---|---|---|
| `SPRING_DEFAULT` | Spring | damping: 15, stiffness: 150, mass: 1 | General component transitions |
| `SPRING_SNAPPY` | Spring | damping: 20, stiffness: 300, mass: 0.8 | Button presses, toggles |
| `SPRING_GENTLE` | Spring | damping: 20, stiffness: 100, mass: 1.2 | Bottom sheets, modals |
| `SPRING_BOUNCY` | Spring | damping: 10, stiffness: 180, mass: 0.9 | Success animations, badges |
| `FADE_IN` | Timing | duration: 200ms, easing: ease-out | Content appearance |
| `FADE_OUT` | Timing | duration: 150ms, easing: ease-in | Content disappearance |
| `SLIDE_UP` | Spring | translateY from 100% to 0, SPRING_GENTLE | Bottom sheets, toasts |
| `SLIDE_RIGHT` | Spring | translateX from -100% to 0, SPRING_DEFAULT | Screen transitions (RTL) |
| `SCALE_PRESS` | Spring | scale 1 → 0.97, SPRING_SNAPPY | Pressable elements |
| `PULSE` | Loop | scale 1 → 1.1 → 1, 1500ms, ease-in-out | Live/online indicators |

### 6.2 Screen Transition Animations

| Transition | Animation | Duration |
|---|---|---|
| Push (navigate forward) | Slide from left (RTL) + fade in | 300ms spring |
| Pop (go back) | Slide to left (RTL) + fade out | 250ms ease-in |
| Tab switch | Cross-fade | 150ms ease-out |
| Modal present | Slide up from bottom + overlay fade | 350ms spring |
| Modal dismiss | Slide down + overlay fade | 250ms ease-in |

### 6.3 Micro-Animations (Premium Details)

These are the animations that make JAHEEZ feel premium. **Every one is mandatory.**

| Element | Animation | Trigger |
|---|---|---|
| **Button press** | `scale(0.97)` spring + haptic | On press in/out |
| **Card press** | `scale(0.98)` + slight shadow reduction | On press in/out |
| **Tab icon** | Bounce (scale 0.8 → 1.1 → 1) | On tab selected |
| **Status badge** | Fade in with slight slide up (8px) | On data load |
| **Order card** | Stagger fade-in (each card 50ms delay) | On list render |
| **Price text** | Count-up animation (0 → final value) | On mount |
| **Loading skeleton** | Shimmer gradient sweep left-to-right | While loading |
| **Success checkmark** | Scale from 0 + Lottie animation | On confirmation |
| **Driver search** | Pulse rings expanding outward | While searching |
| **Map marker** | Drop-in bounce from top | On map load |
| **Chat message** | Slide up + fade | On new message |
| **Input focus** | Border color transition + label float up | On focus |
| **Notification badge** | Scale bounce (0 → 1.3 → 1) | On count update |
| **Pull to refresh** | Custom branded spinner (red) | On pull gesture |
| **Empty state** | Gentle float animation (translateY oscillation) | Continuous |

### 6.4 Lottie Animations (Pre-built)

Store in `assets/animations/` as JSON files:

| File | Description | Used In |
|---|---|---|
| `success-checkmark.json` | Green checkmark with burst particles | Confirmation screen |
| `searching-driver.json` | Expanding radar pulses (red to yellow) | Tracking — pending_driver |
| `delivery-scooter.json` | Scooter driving with motion lines | Tracking — in_progress |
| `loading-shimmer.json` | Skeleton card shimmer effect | All list loading states |
| `onboarding-delivery.json` | Package flying to destination | Onboarding slide 1 |
| `onboarding-driver.json` | Driver on scooter with verification badge | Onboarding slide 2 |
| `onboarding-tracking.json` | Map pin with live tracking trail | Onboarding slide 3 |
| `empty-box.json` | Empty box opening and closing | Empty order history |

> **Stitch Integration**: Search Google Stitch for "lottie delivery animation", "order success animation mobile", and "loading skeleton animation" to find premium references.

### 6.5 Animation Rules

1. **Never exceed 350ms** for UI feedback animations
2. **Always use spring physics** for interactive elements (not linear timing)
3. **Stagger list items** at 50ms intervals for premium feel
4. **No animation on error states** — errors should appear instantly
5. **Reduce motion**: Respect system accessibility setting `prefers-reduced-motion`
6. **No janky animations**: If an animation can't run at 60fps, remove it
7. **Test on real devices**: Animations that work in simulators may lag on budget phones

---

## 7. Iconography

### Icon System
- Use **Lucide React Native** icons for consistency
- Size: 24px default, 20px for compact, 28px for prominent
- Color: Inherits from parent or uses brand tokens
- Stroke width: 1.5px default

### Key Icons

| Context | Icon | Size |
|---|---|---|
| Back navigation | `chevron-right` (RTL) | 24px |
| Home tab | `home` | 24px |
| Search tab | `search` | 24px |
| Orders tab | `receipt` | 24px |
| Chat tab | `message-circle` | 24px |
| Profile tab | `user` | 24px |
| Notification bell | `bell` | 24px |
| Location pin | `map-pin` | 20px |
| Phone call | `phone` | 20px |
| Send message | `send` | 20px |
| Camera/image | `image` | 20px |
| Close/dismiss | `x` | 24px |
| Success | `check-circle` | 28px |
| Error | `alert-circle` | 28px |
| Clock/timer | `clock` | 20px |

---

## 8. Accessibility Rules

1. **`accessibilityLabel`** on every `Pressable`, `Image`, and custom interactive element
2. **Minimum touch target**: 44px × 44px for all interactive elements
3. **Color contrast**: Text must have at least 4.5:1 contrast ratio against background
4. **Focus indicators**: Visible focus ring on all focusable elements
5. **Screen reader support**: Meaningful labels in Arabic, not just icon names
6. **RTL support**: All layouts must work correctly in RTL mode
7. **Dynamic text**: Support system font size scaling up to 200%
8. **No color-only indicators**: Always combine color with text or icon

---

## 9. Logo Usage Rules

| Context | Logo Variant | Dimensions |
|---|---|---|
| Splash screen | Full logo (red wordmark on yellow BG) | 160px wide, centered |
| Header (home screen) | Wordmark only (on yellow header) | 80px wide, left-aligned |
| Bottom sheet / modals | Small wordmark | 48px wide |
| App icon | Simplified mark on yellow background | Per platform guidelines |

### Logo Restrictions
- Never distort, rotate, or recolor the logo
- Minimum clear space: 16px around all sides
- Never place on patterned or busy backgrounds
- On dark backgrounds, use the white variant

---

## 10. Screen Layout Patterns

### Standard Screen Layout

```
┌─────────────────────────────┐
│   Top Navigation Bar (56px) │ ← White, title centered
├─────────────────────────────┤
│                             │
│   ScrollView Content        │ ← BG (#FEFCE8) background
│   padding: 16px horizontal  │
│                             │
│   [Section Title]           │
│   [Content Cards]           │
│   [Content Cards]           │
│                             │
│                             │
├─────────────────────────────┤
│   Bottom Tab Bar (64px+sa)  │ ← White, fixed
└─────────────────────────────┘
```

### Flow Screen Layout (tracking, checkout)

```
┌─────────────────────────────┐
│   Top Nav (56px)            │ ← Optional back button
├─────────────────────────────┤
│                             │
│   Full-height Content       │ ← Map or form
│   (no tabs visible)         │
│                             │
├─────────────────────────────┤
│   Bottom Sheet / CTA area   │ ← Fixed bottom action
└─────────────────────────────┘
```

---

## 11. Consistency Checklist

Before submitting any screen design:

- [ ] All colors from `constants/brand.ts`?
- [ ] All text in DM Sans or JetBrains Mono?
- [ ] Spacing uses 8px grid?
- [ ] Buttons are 52px height with pill radius?
- [ ] Inputs are 52px height with 12px radius?
- [ ] Cards have 16px radius and shadow?
- [ ] Status badges use correct colors and Arabic labels?
- [ ] Loading state uses shimmer skeleton (not just a spinner)?
- [ ] Press animations on all interactive elements?
- [ ] `accessibilityLabel` on every interactive element?
- [ ] Screen background is BG (#FEFCE8)?
- [ ] Prices in JetBrains Mono?
- [ ] Google Stitch referenced for layout inspiration?

---

*Premium is in the details. Every pixel, every animation, every transition matters.*
