# 10. ANIMATION AND MICROINTERACTION SPEC — JAHEEZ

**Purpose:** Document animations, transitions, and user feedback animations | **Last Updated:** 2026-05-19

---

## Splash Screen Animations

| Element | Animation | Duration | Easing | Trigger |
|---------|-----------|----------|--------|---------|
| **Image** | Fade in | 300ms | Linear | Screen load |
| **Image-to-video transition** | Cross-fade | 800ms | EaseInOut | After 2.5s delay |
| **Video** | Fade out | 600ms | EaseOut | On video end |

**Libraries:** React Native Animated API (native driver)

---

## Button & Pressable Animations

### Primary Button (Red)
- **Press:** Scale 0.98 (slight shrink)
- **Duration:** 100ms down, 100ms up
- **Ripple effect:** Android material ripple (native)
- **Loading state:** Replace text with spinner, maintain size

### Secondary Button (Gray)
- **Press:** Opacity 0.7
- **Duration:** 100ms

### Icon Button (Favorite Heart)
- **Press:** Scale 1.2 (grow slightly)
- **Duration:** 150ms
- **On toggle:** Fill icon with red

---

## Screen Transitions

| Transition | Type | Duration | Pattern |
|-----------|------|----------|---------|
| Auth → Tabs | Stack push + fade | 300ms | Standard navigation |
| Tab to tab | Fade only | 200ms | No slide (static content) |
| Modal open | Slide up + fade | 300ms | Bottom-up sheet effect |
| Modal close | Slide down + fade | 300ms | Bottom-down sheet effect |
| Navigate back | Fade | 200ms | Reverse animation |

---

## Form Interactions

### Input Focus Animation
```
Unfocused:
- Border color: #E8E6DF (gray)
- Background: #FFFFFF (white)
- Shadow: None

Focused:
- Border color: #F03030 (red)
- Background: #FFFFFF (white)
- Shadow: Subtle red glow
- Transition duration: 200ms
```

### Error Shake Animation
```
When validation fails:
- Horizontal shake: 8px left → 8px right → center
- Duration: 400ms
- Repeat: Once
- Easing: EaseInOut
- Opacity: Slide in red error text (opacity 0→1, 300ms)
```

### Success Checkmark
```
When form submits successfully:
- Green checkmark icon scales in (0→1.2→1)
- Duration: 500ms
- Trigger: Show success state for 2 seconds before navigate
```

---

## OTP Input Animation

### Digit Entry
```
Per digit box:
- On keystroke: Scale 1.1 then back to 1 (100ms)
- Border: Change to red on focus
- Auto-advance: Smooth focus transition to next box (100ms fade)
```

### Backspace Animation
```
- Current box clears (opacity 1→0, 100ms)
- Focus moves back to previous box (fade in, 100ms)
```

---

## Carousel & List Animations

### Category Service Cards
```
Press animation:
- Scale: 0.95 (slightly shrink)
- Shadow: Increase elevation
- Duration: 150ms
- On release: Return to normal (100ms spring)
```

### Store Card Scrolling
```
Horizontal scroll:
- Momentum scrolling (native FlatList)
- Pagination snap: Snap to center (500ms spring timing)
```

### Order Card (Orders Tab)
```
On mount:
- Fade in + slide from left (300ms)
- Stagger: Each card delayed by 50ms
```

---

## Status & Feedback Animations

### Toast Notification
```
Slide in:
- From bottom: Y: 200 → Y: 0
- Fade: 0 → 1
- Duration: 300ms
- Easing: EaseOut

Auto-dismiss:
- Show for 3-5 seconds
- Slide out (reverse), fade out
- Duration: 300ms
```

### Loading Skeleton
```
Shimmer effect:
- Gradient sweep left to right
- Duration: 1s (loop)
- Opacity: 50% → 100% → 50%
- Color: #E8E6DF shimmer
```

### Loading Spinner
```
Rotation:
- 360 degrees per second
- Loop indefinitely
- Color: Red (#F03030)
- Size: 36px (standard)
```

### Progress Timeline (Tracking)
```
Status icon animation:
- When status updates: Icon scales in (0→1.2→1, 300ms)
- Checkmark: Green fill animation (0→100%, 500ms)
- Line connecting dots: Animate stroke (0→100%, 400ms)
```

---

## Bottom Sheet Modal

### Open Animation
```
Slide up:
- From Y: 300 to Y: 0
- Fade: 0 → 1
- Duration: 300ms
- Easing: EaseOut spring
```

### Content Reveal
```
Handle (drag indicator):
- Show initially
- Slide down when content visible
- Opacity: 1 → 0.3
```

### Close Animation
```
Slide down:
- From Y: 0 to Y: 300
- Fade: 1 → 0
- Duration: 300ms
- Easing: EaseIn spring
```

---

## Map Animations

### Driver Location Marker
```
Pulse effect:
- Marker pulses every 3 seconds
- Scale: 1 → 1.3 → 1
- Duration: 500ms
- Opacity: 1 → 0.5 → 1
- Animation repeats while driver is active
```

### Delivery Location Pin
```
Bounce animation:
- Starts at Y: -100 (off-screen)
- Animates to Y: 0 (onscreen)
- Bounce: Y: 0 → Y: -10 → Y: 0
- Duration: 400ms
- Easing: EaseOut bounce
```

---

## Refresh Animation (Pull-to-Refresh)

```
Pull down gesture:
- Arrow icon rotates as user pulls
- Rotation: 0° → 180° (while pulling)
- Release: Arrow stays rotated

Refresh in progress:
- Arrow becomes spinner
- Spinner rotates while loading
- Duration: Until data loads

Refresh complete:
- Checkmark briefly shows (200ms)
- Then fades to normal state
- Bounce list back up
```

---

## Favorite Heart Animation

### Add to Favorites
```
Press heart icon:
- Icon scales up 1 → 1.3
- Fill animates in (duration: 200ms)
- Color changes to red (#F03030)
- Scale returns to 1 (100ms spring)
```

### Remove from Favorites
```
Press filled heart:
- Icon pulses smaller 1 → 0.8 → 1
- Fill animates out
- Color fades to gray
- Duration: 200ms
```

---

## Promo Code Application

### Apply Animation
```
Input field:
- Border flashes green (#2DB87A) for 300ms
- Success checkmark appears and fades in

Discount update:
- Price changes animate:
  - Old price: Fade out, scale 0.8
  - New price: Fade in, scale 1.2 then 1
  - Duration: 300ms
- Green "+Discount" label slides in
```

---

## Confirmation Dialog

### Modal Appear
```
Dim background:
- Opacity: 0 → 0.4
- Duration: 200ms

Dialog card:
- Scale: 0.7 → 1
- Opacity: 0 → 1
- Duration: 300ms
- Easing: EaseOut spring
```

### Button Press
```
Confirm button:
- Disable and show spinner
- Text opacity: 1 → 0
- Spinner appears (fade in)
- On success: Green checkmark appears
```

---

## Accessibility: Motion Preferences

### Implementation
```typescript
import { useWindowDimensions, useAccessibilityInfo } from 'react-native';

const { reduceMotionEnabled } = useAccessibilityInfo();

// Conditional animation duration
const animDuration = reduceMotionEnabled ? 0 : 300;
```

### Disabled Animations
When `reduceMotionEnabled = true`:
- Disable all decorative animations
- Keep functional feedback (color changes, state updates)
- Instant transitions instead of timed
- No auto-play videos
- No parallax scrolling

---

## Performance Optimization

### Use Native Driver
```typescript
Animated.timing(anim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Offload to native thread
}).start();
```

### Animation & Visual Tooling Stack

To deliver a premium, responsive feel, JAHEEZ utilizes a curated set of layout and animation helpers:
- **`react-native-reanimated`:** For gesture-based UI changes (such as sliding sheets, swipes, and custom spring transitions) offloaded to the native thread.
- **`Moti`:** Built on top of Reanimated, used for declarative entry/exit component animations (cards mounting, error shake triggers).
- **`lottie-react-native`:** For rendering smooth vector animations (like the loading spinner, success check, scooter courier progress tracker). Emojis are never used for visual cues.
- **`expo-linear-gradient`:** For sleek, branded background fade designs.
- **`react-native-svg`:** For crisp vector rendering of custom icons and category tags.
- **`expo-image`:** Handles high-performance image caching, placeholder transitions, and memory management.
- **`React Native Skia` (Deferred):** Reserved for V2 maps and complex analytics charts; bypassed in V1 to reduce build size.

### Avoid JavaScript Thread Blocking
- Use useCallback for animation triggers.
- Debounce frequent animations.
- Avoid heavy computations during active transitions.

---

## Testing Animations

### Manual Testing Checklist
- [ ] Animation runs at 60fps (no jank)
- [ ] Animations complete in specified duration
- [ ] Easing curves look smooth
- [ ] Motion preferences respected (reduce motion enabled)
- [ ] On slow device (>30fps) still looks acceptable
- [ ] Animations don't block user input

### Performance Metrics
- **Target:** 60 FPS (16.67ms per frame)
- **Acceptable:** >30 FPS on slow devices
- **Max animation duration:** 500ms (anything longer feels sluggish)

---

**Created:** 2026-05-19 | **Method:** Codebase animation pattern analysis | **Confidence:** Medium (animations partially implemented)
