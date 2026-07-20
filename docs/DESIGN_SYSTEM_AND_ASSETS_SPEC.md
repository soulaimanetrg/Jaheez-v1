# DESIGN SYSTEM AND ASSETS SPEC

> Generated: 2026-05-19 | Source: `user-app/constants/brand.ts`, asset directories

---

## Brand Colors (from `brand.ts`)

| Token | Hex | Usage |
|-------|-----|-------|
| RED | #F03030 | Primary CTA, logo, active states |
| RED_DARK | #C42020 | Pressed red |
| RED_LIGHT | #FDEAEA | Tinted red surfaces |
| YELLOW | #F5CE2E | Brand yellow, backgrounds, accents |
| YELLOW_DARK | #C9A800 | Pressed yellow |
| YELLOW_LIGHT / CREAM | #FFFBEE | Cream surfaces |
| BG | #FEFDF8 | Warm white screen background |
| SURFACE | #FFFFFF | Cards, modals |
| LIGHT | #F5F4F0 | Secondary backgrounds |
| TEXT | #1C1C1E | Primary text (charcoal) |
| TEXT2 | #5C5C5E | Secondary text |
| TEXT3 | #9CA3AF | Tertiary/placeholder |
| BORDER | #E8E6DF | Borders, dividers |
| GREEN | #2DB87A | Success, delivered |
| BLUE | #3A8FE8 | Informational |
| WARN | #F5A623 | Pending, delay |
| ERROR | #DC2626 | Error states |
| WHATSAPP | #25D366 | WhatsApp buttons |

### Category Tints
FOOD_TINT (#FF6B35), GROCERY_TINT (#2DB87A), PHARMACY_TINT (#3A8FE8), PARCEL_TINT (#A78BFA), ERRAND_TINT (#F472B6)

---

## Typography
- **Font Family:** Cairo (Google Fonts — Arabic-first)
- **Weights:** Regular (400), SemiBold (600), Bold (700)
- **Loading:** `@expo-google-fonts/cairo` via `useFonts` in root layout

---

## Spacing & Sizing (8px grid)
| Token | Value | Usage |
|-------|-------|-------|
| SPACE.XS | 4px | Tiny gaps |
| SPACE.SM | 8px | Small gaps |
| SPACE.MD | 16px | Standard padding |
| SPACE.LG | 24px | Section gaps |
| SPACE.XL | 32px | Large gaps |
| SPACE.XXL | 48px | Hero spacing |
| BUTTON_HEIGHT | 52px | All buttons |
| INPUT_HEIGHT | 52px | All inputs |
| NAV_HEIGHT | 56px | Top navigation |
| TAB_HEIGHT | 64px | Bottom tab bar |
| TOUCH_MIN | 44px | Minimum touch target |

---

## Radius
| Token | Value |
|-------|-------|
| RADIUS.SM | 8px |
| RADIUS.INPUT / MD | 12px |
| RADIUS.CARD / LG | 16px |
| RADIUS.XL | 24px |
| RADIUS.XXL | 32px |
| RADIUS.PILL | 9999px |

---

## Shadows
| Shadow | Spec |
|--------|------|
| SHADOW | 0 2px 12px rgba(0,0,0,0.08) / elevation 3 |
| SHADOW_SM | 0 1px 6px rgba(0,0,0,0.06) / elevation 2 |
| SHADOW_LG | 0 4px 20px rgba(0,0,0,0.10) / elevation 6 |
| SHADOW_RED | 0 4px 16px rgba(240,48,48,0.25) / elevation 8 |
| SHADOW_YELLOW | 0 4px 14px rgba(245,206,46,0.25) / elevation 6 |

---

## Assets Inventory

### Tab Bar Icons (`user-app/assets/icons/`)
| File | Size | Status | Issue |
|------|------|--------|-------|
| home.png | 336KB | ✅ Exists | ⚠️ Too large for icon (should be <10KB) |
| cart.png | 304KB | ✅ Exists | ⚠️ Same |
| chat.png | 383KB | ✅ Exists | ⚠️ Same |
| orders.png | 392KB | ✅ Exists | ⚠️ Same |
| favorites.png | 354KB | ✅ Exists | ⚠️ Same |
| middle.png | 68KB | ✅ Exists | Center action button icon |

**Recommendation:** Replace all tab icons with SVG or vector icons (<5KB each). Current PNGs are likely full-resolution illustrations being used as icons.

### Illustrations (`user-app/assets/illustrations/`)
| File | Size | Status | Issue |
|------|------|--------|-------|
| bag_hero.png | 1.7MB | ✅ Exists | ⚠️ Extremely large |
| scooter.png | 1.3MB | ✅ Exists | ⚠️ Extremely large |
| scooter2.png | 1.7MB | ✅ Exists | ⚠️ Extremely large |
| support.png | 1.6MB | ✅ Exists | ⚠️ Extremely large |
| food.png | 95KB | ✅ Exists | OK |
| grocery.png | 59KB | ✅ Exists | OK |
| pharmacy.png | 47KB | ✅ Exists | OK |
| parcel.png | 41KB | ✅ Exists | OK |
| errand.png | 50KB | ✅ Exists | OK |
| discount.png | 56KB | ✅ Exists | OK |

**Recommendation:** Compress hero illustrations to <200KB each. Use WebP format.

### Splash Assets
| File | Size | Status |
|------|------|--------|
| splash_first.png | 1.2MB | ✅ Exists |
| splash_video.webm | 255KB | ⚠️ iOS compatibility risk |

### Missing Assets
| Asset | Needed For | Priority |
|-------|-----------|----------|
| App icon (iOS) | App Store submission | 🔴 High |
| Adaptive icon (Android) | Play Store submission | 🔴 High |
| Active/inactive tab icon variants | Tab bar states | 🟡 Medium |
| Empty state illustrations | Empty orders, no results, no internet | 🟡 Medium |
| Loading/skeleton animation | Lottie or animated placeholder | 🟢 Low |
| Error state illustration | Error screens | 🟢 Low |
| Onboarding-specific illustrations | Better than reusing hero images | 🟢 Low |
| Service category icons (vector) | Home screen service grid | 🟡 Medium |
| Store placeholder image | When store has no cover | 🟡 Medium |
| Driver avatar placeholder | Tracking/chat screens | 🟡 Medium |

### Design Reference Images (`design/`)
14 ChatGPT-generated UI mockup images (500KB-1.2MB each) — showing desired UI designs for various screens. These are reference images, not production assets.

### External Icon Set (`jaheez icons/`)
Contains additional icon files and illustrations in subdirectories. Needs audit for which are actually used.
