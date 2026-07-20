# ANIMATION AND MICROINTERACTION SPEC

> Generated: 2026-05-19 | Source: `constants/animations.ts`, component inspection

---

## Current Animation Infrastructure

### Libraries Installed
- `react-native-reanimated` 4.2.1 — Primary animation engine
- `moti` 0.28.1 — Declarative animations for Reanimated
- `expo-linear-gradient` — Gradient backgrounds
- `framer-motion` 11.15.0 — Admin panel only (web)

### Animation Constants (`constants/animations.ts`, 869 bytes)
Contains spring and timing configuration presets for consistent motion.

### Existing Animated Components
| Component | File | Animation |
|-----------|------|-----------|
| AnimatedPressable | `components/ui/AnimatedPressable.tsx` | Scale-down on press (spring) |
| AnimatedTransition | `components/ui/AnimatedTransition.tsx` | Fade-in + slide-up on mount |
| FadeInView | `components/ui/FadeInView.tsx` | Opacity 0→1 on mount |
| PulseIndicator | `components/ui/PulseIndicator.tsx` | Pulsing dot (scale + opacity loop) |
| ShimmerPlaceholder | `components/ui/ShimmerPlaceholder.tsx` | Loading shimmer effect |
| SkeletonBox | `components/ui/SkeletonBox.tsx` | Skeleton loading placeholder |

---

## Required Animations

### 1. Splash Animation — ✅ Implemented (Partial)
- Image display → video playback → fade to app
- ⚠️ Video `.webm` format may not play on iOS

### 2. Onboarding Transitions — ✅ Implemented
- Horizontal swipe between slides
- Animated dots indicator (scale + color transition)

### 3. Button Press — ✅ Implemented
- `AnimatedPressable`: spring scale to 0.95 on press down, spring back on release
- Shadow reduction on press

### 4. Input Focus — ⚠️ Partial
- Border color change (gray → RED) on focus
- No animated border transition detected

### 5. OTP Box Animation — ⚠️ Partial
- `OTPInput` component exists but unclear if individual boxes animate on fill

### 6. Bottom Tab Active — ⚠️ Unclear
- Custom tab bar in `(tabs)/_layout.tsx` — needs inspection for active state animation
- Tab icons are PNGs — no color-change animation possible without separate active/inactive variants

### 7. Loading Skeleton — ✅ Implemented
- `SkeletonBox` with shimmer animation for content loading
- `ShimmerPlaceholder` for inline shimmer

### 8. Order Status Progress — ✅ Implemented
- `ProgressTimeline` component with step indicators
- Active step highlighted, completed steps checked

### 9. Tracking Marker Pulse — ✅ Implemented
- `PulseIndicator` for driver location on map
- `MapMarker` component for custom map markers

### 10. Bottom Sheet — ✅ Implemented
- `BottomSheet` component with slide-up animation

### 11. Service Card Press — ✅ Implemented
- Uses `AnimatedPressable` wrapper

---

## Missing / Recommended Animations

| Animation | Priority | Library | Notes |
|-----------|----------|---------|-------|
| Splash image → video crossfade | 🟡 Medium | Reanimated | Smooth opacity transition |
| Tab bar icon bounce on active | 🟡 Medium | Reanimated | Scale spring on tap |
| Center tab button pulse | 🟡 Medium | Reanimated | Subtle breathing animation when no active order |
| Cart badge bounce | 🟡 Medium | Reanimated | Badge scale-up when count changes |
| Add-to-cart item fly | 🟢 Low | Reanimated | Item image flies to cart icon |
| Success checkmark | 🟡 Medium | Lottie or Reanimated | Animated checkmark on confirmation |
| Error shake | 🟡 Medium | Reanimated | Horizontal shake on form validation error |
| Pull-to-refresh | ✅ Native | React Native | Built-in FlatList pull-to-refresh |
| No Internet banner slide | ✅ Implemented | `OfflineBanner` | Slide down from top |
| Page transitions | ✅ Implemented | `animation: 'fade'` in Stack | Fade transition between screens |
| Quantity +/- bounce | 🟢 Low | Reanimated | Number scale animation on change |
| Promo banner auto-scroll | 🟢 Low | FlatList | Auto-advancing carousel |
| Store card hover/press | ✅ Implemented | AnimatedPressable | Scale animation |

---

## Accessibility / Reduce Motion
- **Not detected:** No `useReducedMotion()` hook usage found
- **Recommendation:** Add `AccessibilityInfo.isReduceMotionEnabled` check, disable spring animations when enabled
- **All Pressable components** should have `accessibilityLabel` (rule in AGENTS.md but compliance not verified)
