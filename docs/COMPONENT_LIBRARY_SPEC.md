# COMPONENT LIBRARY SPEC

> Generated: 2026-05-19 | Source: `user-app/components/ui/` inspection

---

## Component Inventory (26 files)

### Layout & Navigation
| Component | File | Props | Usage |
|-----------|------|-------|-------|
| **ScreenWrapper** | `ScreenWrapper.tsx` | `scrollable`, `bg`, `safeArea`, `refreshing`, `onRefresh` | Wraps every screen — SafeAreaView + ScrollView + pull-to-refresh |
| **TopNav** | `TopNav.tsx` | `title`, `onBack`, `rightAction`, `transparent` | Top navigation bar (56px, white, centered title, back arrow) |
| **BottomSheet** | `BottomSheet.tsx` | `visible`, `onClose`, `title`, `snapPoints` | Modal bottom sheet with drag handle |

### Form Elements
| Component | File | Props | Usage |
|-----------|------|-------|-------|
| **Input** | `Input.tsx` | `label`, `error`, `icon`, `secureTextEntry`, `keyboardType`, `accessibilityLabel` | 52px height, 12px radius, RED focus border |
| **Button** | `Button.tsx` | `title`, `onPress`, `variant` (solid/outline/ghost/text), `color`, `loading`, `disabled`, `icon`, `size`, `accessibilityLabel` | 52px height, pill radius, Cairo semibold |
| **OTPInput** | `OTPInput.tsx` | `length`, `value`, `onChange` | Individual digit boxes for OTP entry |

### Display
| Component | File | Props | Usage |
|-----------|------|-------|-------|
| **Card** | `Card.tsx` | `children`, `padding`, `shadow`, `onPress` | White bg, 16px radius, SHADOW, 16px padding |
| **Badge** | `Badge.tsx` | `text`, `color`, `variant`, `size` | Pill-shaped status/count badge |
| **StatusBadge** | `StatusBadge.tsx` | `status` (OrderStatus) | Auto-colored badge based on order status |
| **Avatar** | `Avatar.tsx` | `uri`, `name`, `size`, `fallbackIcon` | Circular avatar with image or initials fallback |
| **TText** | `TText.tsx` | `variant`, `color`, `weight`, `align` | Typography component using Cairo font |

### Feedback & Loading
| Component | File | Props | Usage |
|-----------|------|-------|-------|
| **Loader** | `Loader.tsx` | `size`, `color`, `fullScreen` | Spinning loader indicator |
| **SkeletonBox** | `SkeletonBox.tsx` | `width`, `height`, `radius`, `style` | Rectangle skeleton placeholder with shimmer |
| **ShimmerPlaceholder** | `ShimmerPlaceholder.tsx` | `width`, `height`, `style` | Linear gradient shimmer animation |
| **EmptyState** | `EmptyState.tsx` | `icon`, `title`, `subtitle`, `action`, `onAction` | Empty list placeholder with optional CTA |
| **PulseIndicator** | `PulseIndicator.tsx` | `color`, `size` | Pulsing animated dot |

### Animation
| Component | File | Props | Usage |
|-----------|------|-------|-------|
| **AnimatedPressable** | `AnimatedPressable.tsx` | `onPress`, `scale`, `children`, `style`, `accessibilityLabel` | Pressable with spring scale animation |
| **AnimatedTransition** | `AnimatedTransition.tsx` | `children`, `delay` | Fade-in + slide-up on mount |
| **FadeInView** | `FadeInView.tsx` | `children`, `delay`, `duration` | Simple opacity fade-in |

### Data Display
| Component | File | Props | Usage |
|-----------|------|-------|-------|
| **OrderCard** | `OrderCard.tsx` | `order`, `onPress`, `onTrack`, `onReorder` | Order summary card with status, items, total |
| **ProgressTimeline** | `ProgressTimeline.tsx` | `steps`, `currentStep` | Vertical/horizontal step progress indicator |
| **MapMarker** | `MapMarker.tsx` | `type` (driver/store/user), `color`, `pulse` | Custom map marker with optional pulse |

### Platform
| Component | File | Props | Usage |
|-----------|------|-------|-------|
| **OfflineBanner** | `OfflineBanner.tsx` | None (uses `useNetworkStatus` hook) | Slide-down banner when offline |
| **ForceUpdateModal** | `ForceUpdateModal.tsx` | `visible`, `storeUrl` | Full-screen modal for mandatory app update |
| **MaintenanceBanner** | `MaintenanceBanner.tsx` | None (uses `platformStore`) | Banner when platform is under maintenance |

### Barrel Export
| File | Purpose |
|------|---------|
| **index.ts** | Re-exports all components: `export * from './Button'` etc. |

---

## Component Design Rules (from AGENTS.md)

| Rule | Spec |
|------|------|
| Button height | 52px |
| Button radius | `RADIUS.PILL` (9999px) |
| Button font | Cairo SemiBold |
| Button primary color | RED (#F03030) |
| Card background | SURFACE (#FFFFFF) |
| Card radius | `RADIUS.CARD` (16px) |
| Card shadow | `SHADOW` (0 2px 12px rgba(0,0,0,0.08)) |
| Card padding | 16px |
| Input height | 52px |
| Input radius | `RADIUS.INPUT` (12px) |
| Input bg | INPUT_BG (#FFFFFF) |
| Input focus border | RED (#F03030) |
| Top nav height | 56px, white bg, title bold center |
| Bottom tab height | 64px + safe area, white bg, 1px top border |
| Touch target | Minimum 44px |
| Spacing grid | 8px multiples |
| Font family | Cairo (all text) |
| Accessibility | Every Pressable + Image MUST have `accessibilityLabel` |

---

## Missing Components (recommended)

| Component | Purpose | Priority |
|-----------|---------|----------|
| SearchInput | Dedicated search bar with clear button | 🟡 Medium |
| TabBar (custom) | Exists in `_layout.tsx` but not extracted as reusable | 🟢 Low |
| PromoCard | Promotional banner card | 🟢 Low |
| QuantitySelector | +/- with number display | 🟡 Medium |
| Rating | Star display/input component | 🟡 Medium |
| PriceTag | Formatted price display with currency | 🟢 Low |
| Separator | Horizontal line divider | 🟢 Low |
| Chip | Filter/tag chip | 🟡 Medium |
| Toast | Toast notification system | 🟡 Medium |
| ConfirmDialog | Reusable confirmation modal | 🟡 Medium |
