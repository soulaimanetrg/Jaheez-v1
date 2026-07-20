# 🔍 PHASE 1 — Design Assets Audit and Organization Report

## 1. Complete Asset Inventory Table

Below is the complete inventory of all files present in `user-app/assets/` recursively, including their type, size, import references in code, and current usage status.

| Asset Path | Type | Size | Used By | Status |
| :--- | :--- | :--- | :--- | :--- |
| `user-app/assets/branding/bg_splash.png` | branding | 1.15 MB | (None - `constants/assets.ts` only) | **Orphaned (Duplicate of splash_first.png)** |
| `user-app/assets/branding/logo_concept_red.png` | branding | 1.58 MB | (None - `constants/assets.ts` only) | **Orphaned (Redundant Concept)** |
| `user-app/assets/branding/logo_concept_yellow.png` | branding | 1.56 MB | (None - `constants/assets.ts` only) | **Orphaned (Redundant Concept)** |
| `user-app/assets/icons/cart.png` | ui-icon | 297.3 KB | (None) | **Orphaned (Duplicate of icon_cart.png)** |
| `user-app/assets/icons/chat.png` | ui-icon | 374.1 KB | (None) | **Orphaned (Duplicate of icon_chat.png)** |
| `user-app/assets/icons/favorites.png` | ui-icon | 345.8 KB | (None) | **Orphaned (Duplicate of icon_favorites.png)** |
| `user-app/assets/icons/home.png` | ui-icon | 328.4 KB | (None) | **Orphaned (Duplicate of icon_home.png)** |
| `user-app/assets/icons/icon_cart.png` | ui-icon | 297.3 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_chat.png` | ui-icon | 374.1 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_delete.png` | ui-icon | 386.0 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_discount.png` | ui-icon | 525.8 KB | (None - `constants/assets.ts` only) | **Orphaned (Oversized)** |
| `user-app/assets/icons/icon_faq.png` | ui-icon | 330.7 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_favorites.png` | ui-icon | 345.8 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_free.png` | ui-icon | 430.2 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_history.png` | ui-icon | 379.8 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_home.png` | ui-icon | 328.4 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_like.png` | ui-icon | 335.3 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_logout.png` | ui-icon | 262.8 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_message.png` | ui-icon | 369.0 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_middle.png` | ui-icon | 66.1 KB | (None - `constants/assets.ts` only) | **Orphaned (Duplicate of middle.png)** |
| `user-app/assets/icons/icon_middle_alt.png` | ui-icon | 64.8 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_order.png` | ui-icon | 290.5 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/icons/icon_orders.png` | ui-icon | 382.6 KB | (None - `constants/assets.ts` only) | **Orphaned (Duplicate of orders.png)** |
| `user-app/assets/icons/middle.png` | ui-icon | 66.1 KB | `app/(tabs)/_layout.tsx:L82` | **Active** |
| `user-app/assets/icons/orders.png` | ui-icon | 382.6 KB | (None) | **Orphaned** |
| `user-app/assets/illustrations/bag_hero.png` | illustration | 1.62 MB | `app/(tabs)/index.tsx:L300`, `app/(auth)/welcome.tsx:L48` | **Active (Oversized)** |
| `user-app/assets/illustrations/discount.png` | illustration | 54.7 KB | (None) | **Orphaned (Duplicate of illus_discount.png)** |
| `user-app/assets/illustrations/errand.png` | illustration | 48.8 KB | `app/(tabs)/index.tsx:L25`, `app/(auth)/onboarding.tsx:L43` | **Active (Category Errand)** |
| `user-app/assets/illustrations/food.png` | illustration | 92.9 KB | `app/(tabs)/index.tsx:L21` | **Active (Category Food)** |
| `user-app/assets/illustrations/grocery.png` | illustration | 57.3 KB | `app/(tabs)/index.tsx:L22` | **Active (Category Grocery)** |
| `user-app/assets/illustrations/illus_bag_hero.png` | illustration | 1.62 MB | (None - `constants/assets.ts` only) | **Orphaned (Duplicate of bag_hero.png)** |
| `user-app/assets/illustrations/illus_discount.png` | illustration | 54.7 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/illustrations/illus_errand.png` | illustration | 48.8 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/illustrations/illus_food.png` | illustration | 92.9 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/illustrations/illus_grocery.png` | illustration | 57.3 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/illustrations/illus_parcel.png` | illustration | 40.2 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/illustrations/illus_pharmacy.png` | illustration | 45.7 KB | (None - `constants/assets.ts` only) | **Orphaned** |
| `user-app/assets/illustrations/illus_scooter.png` | illustration | 1.26 MB | (None - `constants/assets.ts` only) | **Orphaned (Duplicate of scooter.png)** |
| `user-app/assets/illustrations/illus_scooter_secondary.png` | illustration | 1.63 MB | (None - `constants/assets.ts` only) | **Orphaned (Duplicate of scooter2.png)** |
| `user-app/assets/illustrations/illus_support.png` | illustration | 1.51 MB | (None - `constants/assets.ts` only) | **Orphaned (Duplicate of support.png)** |
| `user-app/assets/illustrations/parcel.png` | illustration | 40.2 KB | `app/(tabs)/index.tsx:L24`, `app/(auth)/onboarding.tsx:L35` | **Active (Category Parcel)** |
| `user-app/assets/illustrations/pharmacy.png` | illustration | 45.7 KB | `app/(tabs)/index.tsx:L23` | **Active (Category Pharmacy)** |
| `user-app/assets/illustrations/scooter.png` | illustration | 1.26 MB | `app/(tabs)/index.tsx:L163`, `app/(auth)/onboarding.tsx:L27` | **Active (Oversized)** |
| `user-app/assets/illustrations/scooter2.png` | illustration | 1.63 MB | `app/(tabs)/profile.tsx:L147` | **Active (Oversized)** |
| `user-app/assets/illustrations/support.png` | illustration | 1.51 MB | (None) | **Orphaned** |
| `user-app/assets/images/splash_first.png` | splash | 1.15 MB | `app/(auth)/splash.tsx:L104, L127` | **Active (Oversized)** |
| `user-app/assets/videos/splash_video.webm` | video | 249.2 KB | `app/(auth)/splash.tsx:L43` | **Active (Splash Intro)** |
| `user-app/assets/videos/video_splash.webm` | video | 249.2 KB | (None - `constants/assets.ts` only) | **Orphaned (Duplicate of splash_video.webm)** |

---

## 2. Emoji Usage Report

The codebase uses emoji characters inside user-facing UI elements instead of graphic assets or vector icons in multiple locations. Below is a comprehensive audit of emoji usages in `.tsx` files:

| File Path | Line | Emoji | Context | Recommended Vector/Asset Replacement |
| :--- | :--- | :--- | :--- | :--- |
| `user-app/app/(flows)/category/[id].tsx` | 26 | `🍔` | Food category identifier | Local SVG path or `Ionicons` (e.g. `fast-food-outline`) |
| `user-app/app/(flows)/category/[id].tsx` | 33 | `🛒` | Grocery category identifier | `Ionicons` (e.g. `cart-outline`) |
| `user-app/app/(flows)/category/[id].tsx` | 40 | `💊` | Pharmacy category identifier | `MaterialCommunityIcons` (e.g. `pill`) |
| `user-app/app/(flows)/category/[id].tsx` | 47 | `📦` | Parcel category identifier | `Ionicons` (e.g. `cube-outline`) |
| `user-app/app/(flows)/category/[id].tsx` | 54 | `⚡` | Errand category identifier | `Ionicons` (e.g. `flash-outline`) |
| `user-app/app/(flows)/category/[id].tsx` | 256 | `⚡` | "Plus ⚡" membership text badge | Styled label with small vector flash icon |
| `user-app/app/(flows)/custom-request.tsx` | 18 | `📦` | Parcel service type selector | `Ionicons` (e.g. `cube-outline`) |
| `user-app/app/(flows)/custom-request.tsx` | 19 | `🛒` | Grocery service type selector | `Ionicons` (e.g. `cart-outline`) |
| `user-app/app/(flows)/custom-request.tsx` | 20 | `⚡` | Errand service type selector | `Ionicons` (e.g. `flash-outline`) |
| `user-app/app/(flows)/custom-request.tsx` | 126 | `⚡` | "Plus" pulse text/emoji element | Styled badge with a micro SVG or vector icon |
| `user-app/app/(flows)/custom-request.tsx` | 145 | `🎉` | Success celebration in text | Dynamic Lottie animation checkmark (remove emoji from text) |
| `user-app/app/(tabs)/search.tsx` | 21 | `🍔` | Search food category quick-filter | `Ionicons` (e.g. `fast-food-outline`) |
| `user-app/app/(tabs)/search.tsx` | 22 | `🛒` | Search grocery quick-filter | `Ionicons` (e.g. `cart-outline`) |
| `user-app/app/(tabs)/search.tsx` | 23 | `💊` | Search pharmacy quick-filter | `MaterialCommunityIcons` (e.g. `pill`) |
| `user-app/app/(flows)/notifications.tsx` | 19 | `🎉`, `✓`, `⭐` | Check for emojis in notification titles | Remove string matching on emojis, match on backend notification types |
| `user-app/app/(flows)/notifications.tsx` | 28 | `🍳`, `📦`, `✅` | Check for emojis in notification titles | Remove string matching on emojis, match on backend notification types |
| `user-app/app/(flows)/tracking/[id].tsx` | 145 | `📦` | Delivery status bag indicator | Vector icon wrapper or custom mini SVG marker |
| `user-app/components/ui/EmptyState.tsx` | 12 | `📦` | Fallback component icon | Scalable vector icon wrapper using `@expo/vector-icons` |
| `user-app/app/(tabs)/profile.tsx` | 100 | `⚡` | "Plus ⚡" membership text label | Styled label with small vector flash icon |
| `user-app/lib/mockData.ts` | 33 | `🛒` | Mock category icon | N/A (Mock data helper) |
| `user-app/lib/mockData.ts` | 41 | `💊` | Mock category icon | N/A (Mock data helper) |
| `user-app/lib/mockData.ts` | 49 | `📦` | Mock category icon | N/A (Mock data helper) |
| `user-app/lib/mockData.ts` | 57 | `⚡` | Mock category icon | N/A (Mock data helper) |
| `user-app/lib/mockData.ts` | 529 | `🎉` | Mock promo title | N/A (Mock data helper) |
| `user-app/lib/mockData.ts` | 538 | `✅` | Mock status title | N/A (Mock data helper) |
| `user-app/store/languageStore.ts` | 182 | `⭐` | Featured dishes label (Arabic) | Render vector rating star next to text in view layer |
| `user-app/store/languageStore.ts` | 232 | `⭐` | Featured dishes label (French) | Render vector rating star next to text in view layer |
| `user-app/store/languageStore.ts` | 282 | `⭐` | Featured dishes label (English) | Render vector rating star next to text in view layer |
| `user-app/app/(flows)/cart.tsx` | 145 | `✓` | Success text indicator | Render styled green border or `Ionicons` `checkmark-circle` |
| `user-app/app/(flows)/confirmation.tsx` | 58 | `✓` | Order confirmation success badge | Scalable checkmark icon via `@expo/vector-icons` (completed in prompt 1B) |

---

## 3. Missing Assets Checklist

Comparing the project's physical folders with the spec (`docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md`):

- [ ] **Onboarding Illustrations (Slides 3-5):** No dedicated onboarding files exist. Currently, onboarding slides 1-3 reuse general category illustrations (`scooter.png`, `parcel.png`, `errand.png`). Slides 4 and 5 do not exist visually.
- [ ] **Empty State Illustrations:** The `EmptyState` component fallback uses a raw text emoji `📦` instead of dynamic, branded empty-state PNG/SVG graphics (e.g. `empty_cart.png`, `empty_history.png`).
- [ ] **Error & Success Illustrations:** No designated files exist for generic network/validation error screens or payment success screens.
- [ ] **Map Markers:** The `user-app/assets/map` directory is completely empty. We are missing custom markers for:
  - Pickup Location (Store marker pin)
  - Delivery Destination (Customer marker pin)
  - Driver Vehicle (Scooter/Car dynamic indicator pin)
- [ ] **Driver App Assets:** The `driver-app` directory contains no assets folder at all. It requires all visual indicators, identity badges, and branding files.
- [ ] **Admin Panel Assets:** The admin panel uses plain text for logos and placeholders instead of compressed vector branding.
- [ ] **Store/Product Placeholders:** No generic fallback images exist in assets when remote image links fail to load or are empty.

---

## 4. Oversized Assets List

The following static asset files in the project exceed **500KB**. These should be targeted for optimization (e.g., SVG path extraction, PNG quantization, WebP conversion, or Lottie animation replacement):

| File Path | Raw Size | Severity | Recommendation |
| :--- | :--- | :--- | :--- |
| `user-app/assets/illustrations/bag_hero.png` | 1.62 MB | **Critical** | Dynamic hero image. Compress to PNG-8 or WebP (<150KB). |
| `user-app/assets/illustrations/illus_bag_hero.png` | 1.62 MB | **Critical** | Duplicate of `bag_hero.png`. Remove. |
| `user-app/assets/illustrations/illus_scooter_secondary.png`| 1.63 MB | **Critical** | Duplicate of `scooter2.png`. Remove. |
| `user-app/assets/illustrations/scooter2.png` | 1.63 MB | **Critical** | Profile page footer visual. Compress to WebP (<100KB). |
| `user-app/assets/illustrations/illus_support.png` | 1.51 MB | **Critical** | Duplicate of `support.png`. Remove. |
| `user-app/assets/illustrations/support.png` | 1.51 MB | **Critical** | Contact Support visual. Compress to WebP (<100KB). |
| `user-app/assets/illustrations/illus_scooter.png` | 1.26 MB | **Critical** | Duplicate of `scooter.png`. Remove. |
| `user-app/assets/illustrations/scooter.png` | 1.26 MB | **Critical** | Home banner visual. Compress to WebP (<100KB). |
| `user-app/assets/branding/logo_concept_red.png` | 1.58 MB | **High** | Unused large concept logo. Compress to SVG or transparent PNG (<50KB). |
| `user-app/assets/branding/logo_concept_yellow.png` | 1.56 MB | **High** | Unused large concept logo. Compress to SVG or transparent PNG (<50KB). |
| `user-app/assets/branding/bg_splash.png` | 1.15 MB | **High** | Duplicate of `splash_first.png`. Remove. |
| `user-app/assets/images/splash_first.png` | 1.15 MB | **High** | Static splash background. Compress to optimized JPEG/PNG (<200KB). |
| `user-app/assets/icons/icon_discount.png` | 525.8 KB | **Medium** | Small UI badge icon. Must be SVG (<20KB) or highly compressed PNG. |

---

## 5. Duplicate and Redundant Files

The assets folders contain multiple identical files under different names, creating bloat and confusion:

1. **Branding & Splash Duplication:**
   - `user-app/assets/branding/bg_splash.png` (1.15 MB) and `user-app/assets/images/splash_first.png` (1.15 MB) are binary identical.
   - `user-app/assets/videos/video_splash.webm` (249.2 KB) and `user-app/assets/videos/splash_video.webm` (249.2 KB) are binary identical.
2. **Double Illustration Index:**
   - For every illustration file in `user-app/assets/illustrations/`, there is a duplicate file prefixed with `illus_`:
     - `bag_hero.png` / `illus_bag_hero.png`
     - `discount.png` / `illus_discount.png`
     - `errand.png` / `illus_errand.png`
     - `food.png` / `illus_food.png`
     - `grocery.png` / `illus_grocery.png`
     - `parcel.png` / `illus_parcel.png`
     - `pharmacy.png` / `illus_pharmacy.png`
     - `scooter.png` / `illus_scooter.png`
     - `scooter2.png` / `illus_scooter_secondary.png`
     - `support.png` / `illus_support.png`
3. **Double Icon Index:**
   - Similar to illustrations, most icons exist in duplicate form:
     - `cart.png` / `icon_cart.png`
     - `chat.png` / `icon_chat.png`
     - `favorites.png` / `icon_favorites.png`
     - `home.png` / `icon_home.png`
     - `middle.png` / `icon_middle.png`
     - `orders.png` / `icon_orders.png`

---

## 6. Organization Recommendations

To optimize file size, clean up imports, and establish a single source of truth without breaking existing layouts, we recommend:

1. **Deduplicate Assets:**
   - Keep only the clean prefixed versions (e.g. `icon_*`, `illus_*`, `video_*`) because they map to the typed `ASSETS` dictionary in `user-app/constants/assets.ts`.
   - Remove all non-prefixed files after adjusting import statements in the screen files.
2. **Convert UI Icons to Vector Components:**
   - The custom PNG icons under `assets/icons/` (e.g. `icon_cart.png` at 297KB) should be converted to clean inline SVGs or loaded from `@expo/vector-icons` (Ionicons / Feather). This will reduce the icon weight to practically 0 KB.
3. **Adopt WebP/SVG for Illustrations:**
   - Convert all dynamic illustrations (`scooter.png`, `bag_hero.png`, etc.) to WebP format. TinyPNG / Squoosh compression can easily reduce the 1.6MB files to less than 120KB each.
4. **Unify Constants:**
   - Refactor codebase references to use `ASSETS` from `user-app/constants/assets.ts` instead of hardcoding relative paths (`require('../../assets/illustrations/food.png')`). This provides autocomplete support and single-point mapping.
5. **Establish Shared Asset Configuration for driver-app:**
   - Create a symlink or configure Expo/Metro config in `driver-app` to compile assets from a shared root directory (`shared/assets/` or sharing `user-app/assets/`) to prevent file duplication.
