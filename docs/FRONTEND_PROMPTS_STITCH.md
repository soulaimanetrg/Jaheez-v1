# FRONTEND_PROMPTS_STITCH.md
# JAHEEZ — Complete Frontend Build Prompts (A → Z)
# With Google Stitch Integration + Plain English Guidance

---

## HOW TO USE THIS FILE

This file contains every prompt you need to build the entire JAHEEZ frontend, in exact order.

**Before every session:**
1. Paste the full content of `AGENTS.md` into your AI tool (Claude, Antigravity, etc.)
2. Say: *"Read this completely before doing anything. These are the rules."*
3. Then paste ONE prompt from this file

**After every prompt:**
1. Review the code (5-point check — see REVIEW_CHECKLIST.md)
2. Test on your phone via Expo Go
3. Fix any issues before moving to the next prompt

**What Google Stitch is for:**
Before each prompt that has a `🎨 Search Stitch:` line, open Google Stitch in your IDE, type that search, look at 3-5 results, pick the layout you like most, then tell the AI to follow that layout with JAHEEZ brand colors.

**You are not technical. That's fine.**
These prompts are written so the AI does all the technical work. Your job is to paste the prompt and check if what appears on your phone looks right.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 0 — THE FOUNDATION
## (No visuals yet — just the data and rules the app needs)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🗒️ What this phase does (plain English)
Before the AI can build any screens, it needs to know the "vocabulary" of the app — what a User looks like, what an Order contains, what colors exist. Think of it like creating a dictionary before writing a book.

---

## PROMPT A — Data Types (The Dictionary)

**What this creates**: `shared/types.ts`
**Why**: Every other file in the project imports types from here. Must be first.
**Test**: No visual — just run `npx tsc --noEmit` in terminal and confirm zero errors.

```
MANDATORY CONTEXT — Read and obey these files before writing ANY code:
• docs/MASTER_INSTRUCTIONS.md
• docs/CODING_RULES_FRONTEND.md
• docs/FOLDER_STRUCTURE.md
• AGENTS.md

TASK: Create shared/types.ts

Include ALL of these TypeScript interfaces:
- User: id, phone, full_name, email?, avatar_url?, is_verified, is_banned, trust_score, locale, created_at, updated_at
- Driver: id, user_id, vehicle_type, license_plate?, is_approved, is_online, current_zone, rating_avg, total_deliveries, created_at
- Order: id, user_id, driver_id?, order_type, status, title, description?, category?, pickup_address?, pickup_lat?, pickup_lng?, dropoff_address, dropoff_lat, dropoff_lng, estimated_price?, final_price?, currency, moderation_status, scheduled_at?, completed_at?, cancelled_by?, cancel_reason?, created_at, updated_at
- OrderItem: id, order_id, name, quantity, unit_price, notes?
- OrderModeration: id, order_id, raw_text, detected_language?, keyword_flags, decision, reviewed_by?, review_notes?, reviewed_at?, created_at
- ChatMessage: id, order_id, sender_id, sender_role, content, message_type, media_url?, is_read, created_at
- DriverLocation: id, driver_id, lat, lng, speed_kmh?, heading?, recorded_at
- Review: id, order_id, reviewer_id, driver_id, rating, comment?, created_at
- Notification: id, user_id, type, title, body, is_read, order_id?, sent_at
- FraudFlag: id, user_id?, driver_id?, flag_type, severity, evidence, resolved, created_at
- ApiResponse<T>: { data: T | null; error: string | null }
- CreateOrderInput: all fields needed to create a new order (no id, no status, no timestamps)
- CartItem: id, name, quantity, unit_price, notes?, store_id

Type aliases (union types):
- UserRole = 'user' | 'driver' | 'admin'
- VehicleType = 'motorcycle' | 'car' | 'bicycle' | 'on_foot'
- OrderType = 'delivery' | 'errand'
- OrderStatus = 'pending_moderation' | 'moderation_rejected' | 'pending_driver' | 'driver_assigned' | 'in_progress' | 'picked_up' | 'delivered' | 'completed' | 'cancelled' | 'disputed'
- ModerationDecision = 'approved' | 'manual_review' | 'rejected'
- SenderRole = 'user' | 'driver' | 'system'
- MessageType = 'text' | 'image' | 'system'
- PaymentMethod = 'cash' | 'card' | 'wallet'

Rules:
- No any type
- Named exports only
- as const where applicable
- Nullable fields use Type | null (not optional ?)
- Optional fields (truly optional) use ?

Show the complete file.
```

---

## PROMPT B — Shared Constants

**What this creates**: `shared/constants.ts`
**Why**: Defines the rules for how orders move between statuses. Used everywhere.
**Test**: No visual — TypeScript check only.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md • AGENTS.md

PREVIOUS: shared/types.ts exists with all interfaces and type aliases.

TASK: Create shared/constants.ts

Export these (all as const):

ORDER_STATUSES: array of all 10 OrderStatus values in lifecycle order starting with pending_moderation

TERMINAL_STATUSES: ['completed', 'cancelled', 'moderation_rejected', 'disputed'] as OrderStatus[]

VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> — map every status to the array of statuses it can legally transition to:
- pending_moderation → ['moderation_rejected', 'pending_driver']
- moderation_rejected → [] (terminal)
- pending_driver → ['driver_assigned', 'cancelled']
- driver_assigned → ['in_progress', 'cancelled']
- in_progress → ['picked_up', 'cancelled']
- picked_up → ['delivered']
- delivered → ['completed', 'disputed']
- completed → [] (terminal)
- cancelled → [] (terminal)
- disputed → ['completed', 'cancelled']

CATEGORIES: ['food', 'grocery', 'pharmacy', 'custom_errand'] as const

ZONES: ['safi_centre', 'safi_nord', 'safi_sud', 'safi_est'] as const

LOCATION_UPDATE_INTERVAL_MS: 5000
DRIVER_SEARCH_RADIUS_KM: 5
MODERATION_POLL_INTERVAL_MS: 3000

Import OrderStatus from shared/types.ts. No any. Named exports. as const.
Show complete file.
```

---

## PROMPT C — Brand Colors and Visual Tokens

**What this creates**: `user-app/constants/brand.ts`
**Why**: Every color in the app comes from this file. Never use raw hex values anywhere else.
**Test**: No visual — just verify the file exists.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/DESIGN_SYSTEM_RULES.md (Section 2) • AGENTS.md

PREVIOUS: shared/types.ts, shared/constants.ts exist.

TASK: Create user-app/constants/brand.ts

Export BRAND object (as const) with ALL these values:

Primary brand colors:
YELLOW: '#F2C94C'        // brand yellow — backgrounds, warmth, accents
YELLOW_DARK: '#D4A82A'   // pressed yellow
YELLOW_LIGHT: '#FDF6E0'  // tinted yellow surfaces
RED: '#EF4444'           // PRIMARY button color, active states, brand accent
RED_DARK: '#D63031'      // pressed red
RED_LIGHT: '#FEE2E2'     // tinted red surfaces

UI surface colors:
SURFACE: '#FFFFFF'       // cards, modals, bottom sheets
BG: '#FEFCE8'            // ALL screen backgrounds (warm cream-yellow)
TEXT: '#1C1C1E'          // primary text
TEXT2: '#6B7280'         // subtitles, captions, timestamps
TEXT3: '#9CA3AF'         // placeholders, disabled text
BORDER: '#E5E7EB'        // input borders, dividers
INPUT_BG: '#F9FAFB'      // form field backgrounds

Semantic colors:
GREEN: '#22C55E'         // success, delivered, completed
ERROR_RED: '#DC2626'     // validation errors, error states (NOT brand red)
WARN: '#F59E0B'          // pending, delay, review states

Export FONTS object (as const):
DISPLAY: 'DMSans-Bold'
BODY: 'DMSans-Regular'
SEMIBOLD: 'DMSans-SemiBold'
MONO: 'JetBrainsMono-Regular'
MONO_BOLD: 'JetBrainsMono-Bold'

Export SIZES object (as const):
RADIUS_CARD: 16
RADIUS_INPUT: 12
RADIUS_PILL: 9999
BUTTON_HEIGHT: 52
INPUT_HEIGHT: 52
NAV_HEIGHT: 56
TAB_HEIGHT: 64
TOUCH_MIN: 44

Export SHADOW object (as const, for React Native shadow props):
shadowColor: '#000000'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.08
shadowRadius: 12
elevation: 4

Named exports only. as const. No any.
Show complete file.
```

---

## PROMPT D — Animation Configuration

**What this creates**: `user-app/constants/animations.ts`
**Why**: All animations in the app use these presets — buttons bounce, sheets slide up, items fade in.
**Test**: No visual — just verify the file exists.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/DESIGN_SYSTEM_RULES.md (Section 6) • AGENTS.md

PREVIOUS: brand.ts exists.

TASK: Create user-app/constants/animations.ts

Export spring configurations for react-native-reanimated v3 (WithSpringConfig type):

SPRING_DEFAULT: { damping: 15, stiffness: 150, mass: 1 }
SPRING_SNAPPY: { damping: 20, stiffness: 300, mass: 0.8 }      // for buttons — fast response
SPRING_GENTLE: { damping: 20, stiffness: 100, mass: 1.2 }      // for sheets — smooth entry
SPRING_BOUNCY: { damping: 10, stiffness: 180, mass: 0.9 }      // for confirmations — satisfying
SPRING_STIFF: { damping: 25, stiffness: 400, mass: 0.7 }       // for tab switches

Export interaction scale values:
SCALE_BUTTON_PRESS: 0.97    // Button press-down scale
SCALE_CARD_PRESS: 0.98      // Card press-down scale

Export timing constants (milliseconds):
TRANSITION_FAST: 150        // micro-interactions
TRANSITION_DEFAULT: 200     // standard transitions
TRANSITION_SLOW: 350        // page transitions
STAGGER_DELAY: 50           // delay between list items appearing
ICON_FLOAT_DURATION: 2000   // empty state icon oscillation cycle

Export entering animation delays (for staggered lists):
getStaggerDelay: (index: number) => index * STAGGER_DELAY    // utility function

Named exports. as const for objects. No any. No default exports.
Show complete file.
```

---

## PROMPT E — Arabic and French Strings

**What this creates**: `user-app/constants/strings.ts`
**Why**: Every text the user sees comes from this file. Never hardcode strings in screens.
**Test**: No visual.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md • AGENTS.md

PREVIOUS: brand.ts, animations.ts exist.

TASK: Create user-app/constants/strings.ts

Export STRINGS = { ar: {...}, fr: {...} }

Both languages must have ALL these keys:

nav: {
  home, search, orders, chat, profile
}

auth: {
  loginTitle, registerTitle, otpTitle,
  phone, password, confirmPassword, fullName,
  forgotPassword, createAccount, haveAccount,
  verify, next, skip, startNow,
  resendCode, resendIn, wrongCode,
  phonePlaceholder, passwordPlaceholder,
  namePlaceholder, otpSent, termsAgree
}

home: {
  greeting, greetingName, searchPlaceholder,
  newRequest, recentOrders, categories,
  activeOrder, trackOrder, noOrders, noActiveOrder,
  foodCategory, groceryCategory, pharmacyCategory, otherCategory
}

orders: {
  pageTitle, all, active, completed, cancelled,
  noOrders, noActiveOrders, noCompletedOrders, noCancelledOrders,
  orderRef, placedAt
}

request: {
  pageTitle, delivery, errand,
  whatDoYouNeed, titlePlaceholder,
  description, descriptionPlaceholder,
  category, pickupAddress, dropoffAddress,
  estimatedPrice, submit,
  underReview, underReviewDesc, rejected, rejectedDesc,
  validationTitleRequired, validationDropoffRequired
}

tracking: {
  pageTitle, searchingDriver, driverAssigned, inProgress,
  pickedUp, delivered, confirmDelivery, didNotArrive,
  cancel, cancelConfirm, cancelReason,
  eta, minutes, driverName, driverRating, driverVehicle,
  rateDriver, ratingSubmitted, leaveComment
}

chat: {
  typeMessage, chatClosed, chatClosedDesc,
  sendImage, noMessages, today, yesterday
}

profile: {
  pageTitle, editProfile, addresses, notifications,
  helpCenter, language, arabic, french,
  version, logout, logoutConfirm, logoutCancel,
  trustScore, trustScoreDesc, verifiedUser
}

common: {
  loading, error, errorDesc, retry, confirm, cancel,
  save, delete, yes, no, ok, back, close, empty,
  somethingWentWrong, tryAgain, required
}

moderation: {
  safe, review, rejected, pendingReview, pendingReviewDesc
}

Arabic text must be natural Moroccan Arabic, not formal MSA.
French text must be natural Moroccan French.
No English text in this file.
Named exports. as const.
Show complete file.
```

---

## PROMPT F — Supabase Connection (Stub for Now)

**What this creates**: `user-app/lib/supabase.ts`
**Why**: Even though we're building frontend only, all hooks need this to exist. It uses placeholder values from the .env file.
**Test**: No visual — just verify the file exists without TypeScript errors.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md • AGENTS.md

PREVIOUS: shared/types.ts, constants/brand.ts exist.

TASK: Create user-app/lib/supabase.ts

Requirements:
- Import 'react-native-url-polyfill/auto' as the VERY FIRST LINE (required for Supabase in React Native)
- Import createClient from '@supabase/supabase-js'
- Import AsyncStorage from '@react-native-async-storage/async-storage'
- Read the URL from process.env.EXPO_PUBLIC_SUPABASE_URL
- Read the anon key from process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
- Create and export a single supabase client with:
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }
- Add a comment: "THIS IS THE ONLY FILE that creates a Supabase client — never instantiate elsewhere"
- Add a console.warn if env vars are missing (not console.error — don't crash)

This is a named export: export const supabase = createClient(...)
No default export.
No any type.
Show complete file.
```

---

## PROMPT G — API Functions (Stub Version)

**What this creates**: `user-app/lib/api.ts`
**Why**: Hooks call these functions. For now they return placeholder data so screens can be built and tested.
**Test**: No visual — TypeScript check only.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md • AGENTS.md

PREVIOUS: shared/types.ts, lib/supabase.ts exist.

TASK: Create user-app/lib/api.ts

Import supabase from ./supabase.
Import all types from ../../shared/types.ts.

Create these 9 functions. Each must:
- Return Promise<ApiResponse<T>>
- Have a try/catch block
- Return { data: null, error: 'Error message' } on failure
- Return { data: result, error: null } on success

For the FRONTEND-ONLY phase, each function body should attempt the real Supabase query
BUT if EXPO_PUBLIC_SUPABASE_URL contains 'placeholder', return realistic MOCK data instead.

MOCK DATA to return when in placeholder mode:

getMockUser(): User — a realistic Moroccan user with trust_score 85, is_verified true

getMockOrder(): Order — a realistic order with title 'شراء أدوية من الصيدلية', status 'in_progress', estimated_price 25

getMockOrders(): Order[] — 5 orders in various statuses

getMockMessages(): ChatMessage[] — 4 realistic messages (2 user, 1 driver, 1 system)

Functions to create:
1. getActiveOrder(userId: string): Promise<ApiResponse<Order | null>>
2. getOrderById(orderId: string): Promise<ApiResponse<Order>>
3. getOrderHistory(userId: string, page: number): Promise<ApiResponse<Order[]>>
4. createOrder(input: CreateOrderInput, userId: string): Promise<ApiResponse<Order>>
5. cancelOrder(orderId: string, reason: string): Promise<ApiResponse<void>>
6. confirmDelivery(orderId: string): Promise<ApiResponse<void>>
7. submitReview(orderId: string, rating: number, comment?: string): Promise<ApiResponse<void>>
8. sendChatMessage(orderId: string, content: string, senderId: string): Promise<ApiResponse<void>>
9. getChatMessages(orderId: string): Promise<ApiResponse<ChatMessage[]>>

No any. Named exports. No default export.
Show complete file.
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 1 — UI COMPONENTS
## (Building blocks — buttons, cards, inputs)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🗒️ What this phase does (plain English)
Every visible element in the app is made from these components. Like LEGO bricks — once built, they get assembled into screens. Build each one, then test by looking at it in Expo Go.

---

## PROMPT H — Button Component

🎨 **Search Stitch**: `"premium mobile button component press animation"`

**What this creates**: `user-app/components/ui/Button.tsx`
**Test on phone**: You should see a red button that squishes slightly when you press it.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 5.1 — Buttons, Section 6 — Animations)
• AGENTS.md

Use Google Stitch reference: "premium mobile button component press animation"
Apply JAHEEZ brand: RED primary color, pill radius, DM Sans SemiBold font.

PREVIOUS: brand.ts, animations.ts exist.

TASK: Create user-app/components/ui/Button.tsx

Export ButtonProps interface:
- label: string
- onPress: () => void
- variant?: 'primary' | 'secondary' | 'ghost' | 'danger' (default: 'primary')
- isLoading?: boolean (default: false)
- isDisabled?: boolean (default: false)
- leftIcon?: React.ReactNode
- rightIcon?: React.ReactNode
- fullWidth?: boolean (default: true)
- size?: 'sm' | 'md' (default: 'md')
- accessibilityLabel: string (REQUIRED — never omit)

Visual specs (from DESIGN_SYSTEM_RULES.md):
- md size: 52px height, pill radius (SIZES.RADIUS_PILL)
- sm size: 36px height, 8px radius
- DM Sans SemiBold, 16px text for md, 13px for sm

Variants (all colors from BRAND import):
- primary: BRAND.RED background, white text
- secondary: BRAND.YELLOW background, BRAND.TEXT text
- ghost: transparent background, BRAND.RED text, 1.5px BRAND.RED border
- danger: BRAND.ERROR_RED background, white text

Press animation using react-native-reanimated v3:
- useSharedValue(1) for scale
- useAnimatedStyle returning scale transform
- handlePressIn: withSpring(SCALE_BUTTON_PRESS, SPRING_SNAPPY)
- handlePressOut: withSpring(1, SPRING_SNAPPY)
- Wrap Pressable in Animated.View with the animated style

Loading state: Replace label with ActivityIndicator (white for primary/danger, BRAND.RED for others)
Disabled: opacity 0.5, no press response

NativeWind classes for all layout. BRAND tokens for all colors (no raw hex).
Named export only.
Show complete file.
```

---

## PROMPT I — Input Component

🎨 **Search Stitch**: `"mobile input field focus animation premium clean"`

**What this creates**: `user-app/components/ui/Input.tsx`
**Test on phone**: Tap the input — the border should turn red. Wrong value — error text appears below.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 5.2 — Inputs, Section 6)
• AGENTS.md

Use Google Stitch: "mobile input field focus animation premium clean"
Apply JAHEEZ: INPUT_BG fill, RED focus border, 12px radius.

PREVIOUS: brand.ts, animations.ts exist.

TASK: Create user-app/components/ui/Input.tsx

Export InputProps interface:
- label?: string
- placeholder: string
- value: string
- onChangeText: (text: string) => void
- type?: 'text' | 'phone' | 'password' | 'otp' | 'number' | 'multiline' (default: 'text')
- error?: string
- hint?: string
- leftIcon?: React.ReactNode
- rightIcon?: React.ReactNode
- isDisabled?: boolean
- autoFocus?: boolean
- onSubmitEditing?: () => void
- accessibilityLabel: string (REQUIRED)

Visual specs:
- Height 52px (except multiline), radius 12px (SIZES.RADIUS_INPUT), INPUT_BG fill
- Label above: 13px SemiBold, BRAND.TEXT2
- Placeholder: BRAND.TEXT3
- Error text below: 12px Regular, BRAND.ERROR_RED, with a warning icon

Focus animation (react-native-reanimated v3):
- Animated border color: useSharedValue for border color interpolation
- On focus: interpolateColor to BRAND.RED over 200ms
- On blur: interpolateColor back to BRAND.BORDER over 200ms

type='password': right toggle icon (eye open/closed) to show/hide text
type='phone': numeric keyboard, shows "+212" prefix text in gray before the input
type='number': numeric keyboard only
type='multiline': minHeight 100px, expandable, textAlignVertical top
type='otp': Special render — 6 separate TextInput boxes side by side:
  - Each box: 48px × 60px, BRAND.RADIUS_INPUT radius, centered
  - JetBrains Mono Bold 32px for the digit
  - BRAND.RED border on focused box, BRAND.BORDER on others
  - Auto-advance to next box when a digit is entered
  - Auto-backspace to previous box when empty and backspace pressed
  - Call onSubmitEditing when all 6 filled

NativeWind classes. BRAND tokens. accessibilityLabel on every TextInput.
Named export only.
Show complete file.
```

---

## PROMPT J — Card, Badge, StatusBadge, Avatar

🎨 **Search Stitch**: `"mobile card component shadow press premium"`

**What this creates**: 4 files in `user-app/components/ui/`
**Test on phone**: White card with shadow, colored badge pills, status labels, avatar circles.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Sections 5.3–5.4)
• AGENTS.md

Use Google Stitch: "mobile card component shadow press premium"
Apply JAHEEZ brand tokens to all colors.

PREVIOUS: brand.ts, animations.ts, Button.tsx exist.

TASK: Create 4 files:

━━━ File 1: user-app/components/ui/Card.tsx
Export CardProps: children, onPress?, style?, className?
Visual: BRAND.SURFACE bg, SIZES.RADIUS_CARD (16px) radius, BRAND.SHADOW, 16px padding
If onPress provided:
  - Wrap in Pressable inside Animated.View
  - Press animation: scale from 1.0 to SCALE_CARD_PRESS with SPRING_SNAPPY
  - accessibilityLabel required when onPress is provided
Named export.

━━━ File 2: user-app/components/ui/Badge.tsx
Export BadgeProps: label, color ('red'|'yellow'|'green'|'gray'|'purple'|'warn'), accessibilityLabel?
Visual: Pill shape, 10px SemiBold text, 4px vertical + 10px horizontal padding
Color mapping (all from BRAND):
  red: bg=BRAND.RED_LIGHT, text=BRAND.RED
  yellow: bg=BRAND.YELLOW_LIGHT, text=BRAND.YELLOW_DARK
  green: bg='#DCFCE7', text='#16A34A'
  gray: bg=BRAND.BORDER, text=BRAND.TEXT2
  purple: bg='#EDE9FE', text='#7C3AED'
  warn: bg='#FEF3C7', text='#92400E'
Named export.

━━━ File 3: user-app/components/ui/StatusBadge.tsx
Export StatusBadgeProps: status (OrderStatus from shared/types.ts), size? ('sm'|'md')
Map ALL 10 statuses to Arabic label + Badge color:
  pending_moderation → 'قيد المراجعة' → warn
  moderation_rejected → 'مرفوض' → red
  pending_driver → 'بحث عن سائق' → yellow
  driver_assigned → 'تم التعيين' → yellow
  in_progress → 'في الطريق' → red
  picked_up → 'تم الاستلام' → red
  delivered → 'تم التسليم' → green
  completed → 'مكتمل' → green
  cancelled → 'ملغي' → gray
  disputed → 'متنازع عليه' → red
Import Badge from ./Badge. Named export.

━━━ File 4: user-app/components/ui/Avatar.tsx
Export AvatarProps: uri?, name, size ('sm'|'md'|'lg'), accessibilityLabel
sm=32px circle, md=44px circle, lg=64px circle
If uri: expo-image Image with resizeMode cover, rounded circle, accessibilityLabel
If no uri: View circle with BRAND.YELLOW bg, initials (first letter of each word in name), BRAND.TEXT color, DM Sans Bold
Named export.

Show complete code for all 4 files.
```

---

## PROMPT K — Loader, EmptyState, BottomSheet, Shimmer

🎨 **Search Stitch**: `"mobile loading skeleton shimmer animation"` and `"mobile bottom sheet slide up premium"`

**What this creates**: 4 more component files
**Test on phone**: Loading spinner in red, empty states with floating emoji, sheet sliding up from bottom.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Sections 5.5, 6)
• AGENTS.md

Stitch references:
- Loader/Shimmer: "mobile loading skeleton shimmer animation"
- BottomSheet: "mobile bottom sheet slide up gesture dismiss"
- EmptyState: "mobile empty state illustration minimal"

PREVIOUS: brand.ts, animations.ts, Button.tsx exist.

TASK: Create 4 files:

━━━ File 1: user-app/components/ui/Loader.tsx
Export LoaderProps: fullScreen?, message?, color?
If fullScreen: fills entire screen, BG background, RED ActivityIndicator centered, optional message below in TEXT2
If not fullScreen: just the ActivityIndicator (size large, BRAND.RED)
Named export.

━━━ File 2: user-app/components/ui/EmptyState.tsx
Export EmptyStateProps: icon (emoji string), title, subtitle?, actionLabel?, onAction?
Layout: Centered vertically and horizontally
Icon: 64px emoji Text, gentle float animation using:
  - useSharedValue for translateY
  - withRepeat(withSequence(withTiming(-8, {duration:1000}), withTiming(0, {duration:1000})), -1, true)
Title: 18px Bold, BRAND.TEXT, margin top 16px
Subtitle: 14px Regular, BRAND.TEXT2, margin top 8px, centered, max 80% width
If actionLabel + onAction: Button (primary, fullWidth false) below with margin top 24px
Named export.

━━━ File 3: user-app/components/ui/BottomSheet.tsx
Export BottomSheetProps: isVisible, onClose, children, title?, snapPoints? (default ['50%'])
Implementation:
- Dark overlay: absolute fill, rgba(0,0,0,0.4), tap to call onClose
- Animated sheet: starts at height 0 (off screen), animates up with SPRING_GENTLE
- White sheet, 24px top-left and top-right radius
- Drag handle: 40px wide, 4px tall, BRAND.BORDER color, centered at top with 8px margin
- Title: if provided, 18px Bold, centered, BRAND.TEXT, 16px padding sides
- Scrollable children inside
- Use react-native-reanimated for the animation
Named export.

━━━ File 4: user-app/components/ui/ShimmerPlaceholder.tsx
Export ShimmerProps: width, height, radius?, style?
Animated gradient shimmer effect:
- LinearGradient from 'expo-linear-gradient' (install if needed: npx expo install expo-linear-gradient)
- Colors: [BRAND.INPUT_BG, BRAND.BORDER, BRAND.INPUT_BG]
- Animated translateX from -width to +width with withRepeat, duration 1000ms, linear
Named export.

Show complete code for all 4 files.
```

---

## PROMPT L — OrderCard, MapMarker, AnimatedTransition, Pulse, Timeline

🎨 **Search Stitch**: `"delivery order card mobile list premium"` and `"live tracking progress timeline mobile"`

**What this creates**: 5 more component files + the barrel export
**Test on phone**: Order cards with status badges, progress timeline with dots.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md
• AGENTS.md

Stitch references:
- Order card: "delivery order card mobile list premium"
- Map marker: "custom map marker delivery"
- Timeline: "progress timeline steps delivery tracking mobile"

PREVIOUS: All previous components exist. shared/types.ts exists.

TASK: Create 5 files + 1 barrel:

━━━ File 1: user-app/components/ui/OrderCard.tsx
Export OrderCardProps: order (Order type), variant ('compact'|'full'), onPress?

compact variant (for lists):
  Card with onPress → press animation
  Row: StatusBadge + title (truncated 1 line) + price (JetBrains Mono, BRAND.RED) + date (TEXT3, caption)

full variant (for detail views):
  Title 18px Bold
  StatusBadge below title
  Divider
  Row: pickup icon (circle yellow) + pickup address (truncated 1 line)
  Row: dropoff icon (circle green) + dropoff address (truncated 1 line)
  If driver assigned: Avatar + driver name + rating stars
  Footer: price large (JetBrains Mono 22px BRAND.RED) + date TEXT3

All money values use JetBrains Mono. All colors from BRAND. accessibilityLabel on pressable.
Named export.

━━━ File 2: user-app/components/ui/MapMarker.tsx
For use with react-native-maps Marker's children prop
Export MapMarkerProps: type ('driver'|'pickup'|'dropoff'|'user'), label?

driver: 44px circle, BRAND.RED bg, white scooter emoji "🛵" centered
pickup: 44px circle, BRAND.YELLOW bg, white pin emoji "📍" centered
dropoff: 44px circle, BRAND.GREEN bg, white flag emoji "🚩" centered
user: 44px circle, BRAND.YELLOW bg, white person emoji "👤" centered
If label: small text below circle in BRAND.TEXT2 caption size

Named export.

━━━ File 3: user-app/components/ui/AnimatedTransition.tsx
Wrapper that adds entering animation to its children
Export AnimatedTransitionProps: children, delay? (default 0), type? ('fadeUp'|'fadeIn', default 'fadeUp')
fadeUp: FadeInDown from react-native-reanimated (or manual: opacity 0→1 + translateY 8→0)
fadeIn: opacity 0→1
Delay applied via entering.delay(delay)
Named export.

━━━ File 4: user-app/components/ui/PulseIndicator.tsx
A pulsing animated circle for "searching" states
Export PulseProps: size? (default 12), color? (default BRAND.RED), label?
Two concentric circles — inner solid, outer scales from 1 to 2 and fades out, repeat indefinitely
If label: small text to the right
Named export.

━━━ File 5: user-app/components/ui/ProgressTimeline.tsx
Export ProgressTimelineProps: steps (string[]), currentStep (number 0-based), orientation? ('vertical'|'horizontal')
Each step: circle dot (filled=BRAND.RED, upcoming=BRAND.BORDER) + label below/beside
Line connecting dots: BRAND.RED for passed, BRAND.BORDER for upcoming
Current step: larger circle, pulsing animation
Named export.

━━━ File 6: user-app/components/ui/index.ts
Barrel export for all 15 components:
Button, Input, Card, Badge, StatusBadge, Avatar,
Loader, EmptyState, BottomSheet, ShimmerPlaceholder,
OrderCard, MapMarker, AnimatedTransition, PulseIndicator, ProgressTimeline

Show complete code for all 6 files.
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 2 — STORES AND HOOKS (The Brain)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🗒️ What this phase does (plain English)
Stores remember things between screens (like who is logged in). Hooks are the "brain" that fetch data and handle actions. Screens just display what hooks give them.

---

## PROMPT M — Zustand Stores

**What this creates**: 4 store files
**Test**: No visual — these are invisible memory systems.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md • AGENTS.md

PREVIOUS: shared/types.ts exists. All components built.

TASK: Create 4 Zustand store files:

━━━ File 1: user-app/store/authStore.ts
State: { user: User | null; isLoading: boolean }
Actions: { setUser: (user: User | null) => void; setLoading: (v: boolean) => void; clearUser: () => void }
Use zustand with persist middleware + AsyncStorage:
  import AsyncStorage from '@react-native-async-storage/async-storage'
  import { create } from 'zustand'
  import { persist, createJSONStorage } from 'zustand/middleware'
Persist key: 'jaheez-auth'
Named export: export const useAuthStore = create<AuthState>()(persist(...))

━━━ File 2: user-app/store/orderStore.ts
State: { activeOrder: Order | null }
Actions: { setActiveOrder: (order: Order | null) => void; clearActiveOrder: () => void }
No persistence needed.
Named export: export const useOrderStore = create<OrderStore>()(...)

━━━ File 3: user-app/store/cartStore.ts
State: { items: CartItem[]; storeId: string | null }
Actions: {
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}
Persist key: 'jaheez-cart'
Named export: export const useCartStore = create<CartStore>()(persist(...))

━━━ File 4: user-app/store/locationStore.ts
State: { userCoords: {lat: number; lng: number} | null; driverCoords: {lat: number; lng: number} | null }
Actions: { setUserCoords, setDriverCoords, clearDriverCoords }
No persistence.
Named export: export const useLocationStore = create<LocationStore>()(...)

All types imported from shared/types.ts. No any. Named exports.
Show complete code for all 4 files.
```

---

## PROMPT N — Hooks

**What this creates**: 5 hook files
**Test**: No visual — hooks are called from screens.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md • AGENTS.md

PREVIOUS: All stores, lib/api.ts, lib/supabase.ts exist.

TASK: Create 5 hook files:

━━━ File 1: user-app/hooks/useAuth.ts
Import: lib/api.ts functions, store/authStore.ts, lib/supabase.ts
Return interface:
  currentUser: User | null
  isLoading: boolean
  signIn: (phone: string, password: string) => Promise<{error: string | null}>
  signUp: (phone: string, password: string, fullName: string) => Promise<{error: string | null}>
  verifyOTP: (phone: string, token: string) => Promise<{error: string | null}>
  signOut: () => Promise<void>
On init: call supabase.auth.getSession() to restore session, fetch user profile if session exists
signOut: call supabase.auth.signOut(), call clearUser() on store

━━━ File 2: user-app/hooks/useOrder.ts
Import: lib/api.ts, store/orderStore.ts, @tanstack/react-query
Return:
  activeOrder: Order | null
  orderHistory: Order[]
  isLoadingActive: boolean
  isLoadingHistory: boolean
  error: string | null
  createOrder: (input: CreateOrderInput) => Promise<ApiResponse<Order>>
  cancelOrder: (orderId: string, reason: string) => Promise<ApiResponse<void>>
  confirmDelivery: (orderId: string) => Promise<ApiResponse<void>>
  submitReview: (orderId: string, rating: number, comment?: string) => Promise<ApiResponse<void>>
Use useQuery for fetching, useMutation for mutations
After createOrder: poll order status every MODERATION_POLL_INTERVAL_MS until status leaves 'pending_moderation'

━━━ File 3: user-app/hooks/useTracking.ts
Import: lib/supabase.ts, store/locationStore.ts
Params: orderId: string
Return:
  driverLocation: {lat: number; lng: number} | null
  eta: number | null (minutes)
  isConnected: boolean
Subscribe to driver_locations changes via Supabase Realtime channel
Update locationStore.driverCoords on each update
Calculate ETA: (distance in km / 25 km/h) * 60 minutes — use haversine formula
Cleanup subscription on unmount (useEffect return)

━━━ File 4: user-app/hooks/useChat.ts
Import: lib/api.ts, lib/supabase.ts
Params: orderId: string
Return:
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
Load initial messages with React Query
Subscribe to new messages via Supabase Realtime INSERT on chat_messages
Append new messages without refetching all
Cleanup subscription on unmount

━━━ File 5: user-app/hooks/useLocation.ts
Import: expo-location, store/locationStore.ts
Return:
  coords: {lat: number; lng: number} | null
  error: string | null
  permissionStatus: string
  requestPermission: () => Promise<void>
Use Location.requestForegroundPermissionsAsync
Use Location.getCurrentPositionAsync on permission grant
Update locationStore.userCoords

All hooks: named exports, typed return interfaces, no any, proper error handling.
Show complete code for all 5 files.
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 3 — AUTH SCREENS
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🗒️ What this phase does (plain English)
These are the first screens any user sees: the logo splash, the onboarding explanation, and the login/register/OTP forms. After this phase, you can open the app and go through a full sign-up flow.

---

## PROMPT O — Auth Layout + Splash Screen

🎨 **Search Stitch**: `"mobile app splash screen logo animation premium"`

**Test on phone**: You should see the JAHEEZ logo appear with a fade animation on a yellow background.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md

Stitch reference: "mobile app splash screen logo animation premium"
Brand: BRAND.YELLOW background, BRAND.RED wordmark, centered logo

PREVIOUS: All components, hooks, stores exist.

TASK: Create 2 files:

━━━ File 1: user-app/app/(auth)/_layout.tsx
Stack navigator for auth screens.
screenOptions: headerShown false, BG background.
No bottom tab bar visible here.
Default export.

━━━ File 2: user-app/app/(auth)/splash.tsx
Background: full screen BRAND.YELLOW
Center: JAHEEZ logo (use Text "JAHEEZ" in BRAND.RED, FONTS.DISPLAY, 48px as placeholder if no image asset yet)
Below logo: tagline text from STRINGS.auth (use ar locale) in BRAND.RED_DARK 16px
Entering animation: logo fades in with opacity 0→1 over 800ms using react-native-reanimated

Logic on mount (useEffect):
1. Check if session exists via useAuth().currentUser
   - If user exists → router.replace('/(tabs)/')
   - If no user → wait 1500ms then router.replace('/(auth)/onboarding')
2. Show splash for minimum 1500ms regardless (use Promise.all)

accessibilityLabel on the logo: "شعار جاهز"
Default export.
Show complete code for both files.
```

---

## PROMPT P — Onboarding Screen

🎨 **Search Stitch**: `"mobile onboarding carousel slides dots premium arabic"`

**Test on phone**: 3 slides you can swipe through, with dot indicators and a skip button.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 6 — Animations) • AGENTS.md

Stitch reference: "mobile onboarding carousel slides dots premium arabic"
Brand: BG background, RED buttons, YELLOW accents for illustration placeholders

PREVIOUS: Auth layout, splash exist. Button, AnimatedTransition components exist.

TASK: Create user-app/app/(auth)/onboarding.tsx

3 slides (use STRINGS object for text, Arabic locale):
  Slide 1: Emoji placeholder "🚀" (large, 80px), title about fast delivery, subtitle about service
  Slide 2: Emoji "🛵" + title about verified drivers + subtitle about trust
  Slide 3: Emoji "🔒" + title about Safety + YELLOW_LIGHT tint on emoji bg circle

Layout:
- Horizontal FlatList (pagingEnabled, scrollEnabled true, showsHorizontalScrollIndicator false)
- Each slide: full width, centered content, BG background
- Illustration area: 60% of screen height, centered emoji in colored circle (YELLOW_LIGHT bg)
- Text area: title 24px Bold BRAND.TEXT, subtitle 16px Regular BRAND.TEXT2, both centered, px-8

Bottom controls:
- Dot indicators: row of 3 dots, active=BRAND.RED 10px, inactive=BRAND.BORDER 8px, animated width transition
- On last slide: "ابدأ الآن" primary Button → router.replace('/(auth)/login')
- On other slides: "التالي" primary Button → scroll to next slide
- "تخطى" ghost text link top-right → router.replace('/(auth)/login')

Animate slide content: each slide's text fades in from below using AnimatedTransition with delay 200ms
Default export. accessibilityLabel on all Pressables.
Show complete file.
```

---

## PROMPT Q — Login and Register Screens

🎨 **Search Stitch**: `"mobile login screen phone number arabic premium"` and `"mobile register form clean minimal"`

**Test on phone**: A clean form with phone input, password, a red button, and error messages below invalid fields.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md

Stitch references:
- Login: "mobile login screen phone number arabic premium"
- Register: "mobile register form clean minimal"
Brand: BG background, RED primary buttons, INPUT_BG inputs, 12px radius

PREVIOUS: All components and hooks exist.

TASK: Create 2 files:

━━━ File 1: user-app/app/(auth)/login.tsx

Layout (KeyboardAvoidingView + ScrollView):
- Back arrow (chevron) top left, 44px touch target → router.back()
- Title: STRINGS.auth.loginTitle, 28px Bold, BRAND.TEXT
- Subtitle: 14px Regular, BRAND.TEXT2
- Phone Input (type='phone'): label, +212 prefix, validation
- Password Input (type='password'): label, show/hide toggle
- Error message below password if signIn fails: BRAND.ERROR_RED 13px
- "تسجيل الدخول" primary Button (fullWidth): calls useAuth().signIn
  - isLoading=true during request
  - On success → router.replace('/(auth)/otp') with phone param
  - On error → show error below password field
- Divider with "أو" text centered (BRAND.TEXT3, lines either side)
- "إنشاء حساب جديد" ghost Button → router.push('/(auth)/register')

Validation before submit: phone must be 9 digits after +212 prefix, password minimum 6 chars
Default export. accessibilityLabel on all interactive elements.

━━━ File 2: user-app/app/(auth)/register.tsx

Layout (KeyboardAvoidingView + ScrollView):
- Back arrow top left → router.back()
- Title: STRINGS.auth.registerTitle, 28px Bold
- Full Name Input (type='text')
- Phone Input (type='phone')
- Password Input (type='password')
- Confirm Password Input (type='password')
- Terms text: 12px BRAND.TEXT2, centered, "بالتسجيل، أنت توافق على الشروط والأحكام"
- "إنشاء حساب" primary Button: calls useAuth().signUp
  - Validation: name not empty, phone 9 digits, passwords match, password ≥ 6 chars
  - Show inline error below each invalid field
  - isLoading=true during request
  - On success → router.replace('/(auth)/otp') with phone param
- "لديك حساب؟ سجل الدخول" ghost → router.replace('/(auth)/login')

Default export. accessibilityLabel on all elements.
Show complete code for both files.
```

---

## PROMPT R — OTP Verification Screen

🎨 **Search Stitch**: `"OTP verification 6 digit code mobile premium"`

**Test on phone**: 6 boxes that auto-advance as you type digits, with a countdown timer.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md

Stitch reference: "OTP verification 6 digit code mobile premium"
Brand: BRAND.RED focused box border, JetBrains Mono digits, BG background

PREVIOUS: All components, hooks exist.

TASK: Create user-app/app/(auth)/otp.tsx

Receive phone number from route params: useLocalSearchParams()

Layout:
- Back arrow top left → router.back()
- Title: STRINGS.auth.otpTitle, 28px Bold, centered
- Subtitle: "أدخل الكود المرسل إلى {phone}" — phone formatted as +212 6** *** **3 (masked)
- OTP Input (type='otp' from Input component, or build inline here if cleaner)
  If building inline: 6 TextInput boxes with refs array, auto-advance logic
- Error message below boxes if verifyOTP fails
- "تحقق" primary Button: calls useAuth().verifyOTP(phone, code)
  - Disabled until all 6 digits entered
  - isLoading during request
  - On success → router.replace('/(tabs)/')
  - On error → clear boxes, show error message
- Countdown timer: 60 seconds initially
  - Shows: "إعادة الإرسال خلال 0:{seconds}" in BRAND.TEXT3
  - When countdown reaches 0: shows "إعادة الإرسال" Pressable in BRAND.RED
  - Tap resend: restart countdown, call resend (stub for now: just restart timer)

Default export. accessibilityLabel on all elements.
Show complete file.
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 4 — MAIN APP SCREENS (TABS)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🗒️ What this phase does (plain English)
After login, the user sees the main app with a bottom navigation bar and 5 tabs. This is the core of the app. After this phase, you can navigate between Home, Orders, Chat, and Profile.

---

## PROMPT S — Tab Layout + Home Screen

🎨 **Search Stitch**: `"delivery app home screen premium arabic"` and `"mobile bottom navigation tab bar premium"`

**Test on phone**: Bottom nav with 5 icons, home screen with a map section, category pills, and a big red button.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md

Stitch references:
- Home: "delivery app home screen premium arabic map"
- Tab bar: "mobile bottom navigation tab bar premium"
Brand: RED active icons, TEXT3 inactive icons, SURFACE tab bar, BG screen bg

PREVIOUS: All components, hooks, and all auth screens exist.

TASK: Create 2 files:

━━━ File 1: user-app/app/(tabs)/_layout.tsx
Tabs layout with 5 tabs in this order:
1. index (Home): icon home (Feather), label from STRINGS.nav.home
2. search: icon search (Feather), label from STRINGS.nav.search
3. orders: icon package (Feather), label from STRINGS.nav.orders
4. chat: icon message-circle (Feather), label from STRINGS.nav.chat
5. profile: icon user (Feather), label from STRINGS.nav.profile

Tab bar style:
- height: SIZES.TAB_HEIGHT (64px) + safe area bottom inset
- BRAND.SURFACE background
- 1px BRAND.BORDER top border
- Active icon + label: BRAND.RED
- Inactive icon + label: BRAND.TEXT3
- Icon size: 24px
- Label: 11px Regular
- No default tab bar animation — custom scale animation on tab press (scale 0.8 → 1.1 → 1.0)

screenOptions: headerShown false
Default export.

━━━ File 2: user-app/app/(tabs)/index.tsx (Home Screen)
Layout (ScrollView, BG background):

Section 1 — Header (SURFACE bg, px-4, pt safe area + 16px, pb-4):
  Row: "مرحباً، {name} 👋" Text (18px Bold BRAND.TEXT) + notification bell icon right (44px touch)
  SubRow: current date in Arabic locale (14px TEXT2)

Section 2 — Active Order Banner (if activeOrder exists from useOrder):
  Card with BRAND.RED_LIGHT bg, 12px radius, px-4 py-3
  Row: "طلبك النشط" (13px SemiBold RED) + StatusBadge + "تتبع" ghost mini button → tracking
  Order title truncated 1 line

Section 3 — Search Bar:
  Input type='text' placeholder from STRINGS.home.searchPlaceholder
  Left icon: search Feather icon
  Disabled for now (stub — "قريباً" bottom sheet on press)

Section 4 — Categories (horizontal ScrollView, no scroll indicator):
  Pills: 4 categories from CATEGORIES constant
  Each: Pressable, 36px height, 16px radius, 12px horizontal padding
  Text from STRINGS.home category keys
  Active: BRAND.RED bg, white text
  Inactive: SURFACE bg, BRAND.BORDER border, BRAND.TEXT2 text
  Emoji per category: طعام🍔 بقالة🛒 صيدلية💊 أخرى✨

Section 5 — New Request Button:
  Large PRIMARY Button: "طلب جديد" + leftIcon ✨
  onPress → router.push('/(flows)/custom-request')
  mx-4

Section 6 — Recent Orders (title + list):
  "طلباتك الأخيرة" 18px Bold + "عرض الكل" ghost right link → orders tab
  useOrder() orderHistory first 3 items as OrderCard variant='compact'
  Each OrderCard onPress → router.push(`/(flows)/order-detail/${order.id}`)
  If loading: 3 ShimmerPlaceholder cards
  If empty: EmptyState icon="📭" title from STRINGS.home.noOrders

All states handled: isLoading, error, empty.
Default export.
Show complete code for both files.
```

---

## PROMPT T — Search, Orders, Chat, Profile Screens

🎨 **Search Stitch**: `"mobile order history list premium"` and `"mobile profile screen settings premium arabic"`

**Test on phone**: Orders list with filter tabs, profile page with user info.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md

Stitch references:
- Orders: "mobile order history list filter tabs premium"
- Profile: "mobile profile screen settings menu premium"
Brand: BG background, SURFACE cards, RED accents

PREVIOUS: All components, hooks, tab layout + home exist.

TASK: Create 4 files:

━━━ File 1: user-app/app/(tabs)/search.tsx
Header: "بحث" 24px Bold + search Input pinned at top
Body: EmptyState icon="🔍" title="ابحث عن مطاعم، متاجر، خدمات" subtitle="قريباً"
BG background.
Default export.

━━━ File 2: user-app/app/(tabs)/orders.tsx
Header: "طلباتي" 24px Bold (SURFACE bg, 56px height)
Filter tabs row (SURFACE bg below header):
  4 tabs: الكل | نشطة | مكتملة | ملغاة
  Active tab: BRAND.RED bottom border (2px) + BRAND.RED text
  Inactive: BRAND.TEXT2
  Animated underline moves horizontally to active tab

Body: FlatList of filtered orders
  useOrder() orderHistory — filter by tab selection
  Each item: OrderCard variant='compact' with AnimatedTransition delay per index
  keyExtractor: order.id
  Loading: 5 ShimmerPlaceholder items
  Empty: EmptyState per tab type

Default export.

━━━ File 3: user-app/app/(tabs)/chat.tsx
Header: "الدردشة" 24px Bold
If no active orders with chat: EmptyState icon="💬" title="لا توجد محادثات"
If active orders: FlatList of order cards that have chat
  Each item: Card with Avatar (driver) + order title + last message preview + timestamp
  Tap → router.push(`/(flows)/chat/${order.id}`)
Loading and empty states handled.
Default export.

━━━ File 4: user-app/app/(tabs)/profile.tsx
Header: "ملفي" 24px Bold

Top section (Card, mx-4 mt-4):
  Avatar (size='lg') + name (20px Bold) + phone (TEXT2) + trust score badge
  Trust score: progress bar (BRAND.RED fill, BRAND.BORDER bg) + "النقاط: {score}/100" JetBrains Mono

Menu list (mx-4 mt-4):
  Each row: Pressable, 56px height, SURFACE bg, BRAND.BORDER bottom border
  Row content: left icon (Feather 20px TEXT2) + label (16px TEXT) + chevron right (TEXT3)
  Rows:
    - 🔔 الإشعارات (notifications) → stub toast "قريباً"
    - 📍 عناوين محفوظة → stub
    - 🌐 اللغة (language) → BottomSheet with Arabic/French toggle
    - ❓ مركز المساعدة → stub
    - ℹ️ عن التطبيق → stub showing version "1.0.0" in JetBrains Mono

Logout button at bottom (danger variant, mx-4 mb-safe):
  onPress: Alert.alert confirm → useAuth().signOut() → router.replace('/(auth)/splash')

Default export.
Show complete code for all 4 files.
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 5 — FLOW SCREENS
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🗒️ What this phase does (plain English)
These are the screens users navigate to for specific actions — creating a request, seeing the confirmation, tracking delivery, and chatting with the driver.

---

## PROMPT U — Flows Layout + Custom Request Screen

🎨 **Search Stitch**: `"mobile order creation form steps premium delivery"`

**Test on phone**: A form with a title, description, category buttons, address inputs, and a submit button. After submit, a moderation animation appears.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md

Stitch reference: "mobile order creation form steps premium delivery"
Brand: BG background, RED submit button, YELLOW category highlights

PREVIOUS: All components, hooks, tab screens exist.

TASK: Create 2 files:

━━━ File 1: user-app/app/(flows)/_layout.tsx
Stack navigator, headerShown false, BG background.
No bottom tabs visible.
Default export.

━━━ File 2: user-app/app/(flows)/custom-request.tsx

This is the CORE screen. It has two visual states managed by a local useState:

STATE 1 — "form" (default):
  Header (SURFACE bg, 56px): back chevron left + "طلب جديد" centered Bold
  ScrollView + KeyboardAvoidingView:
    Input: "عنوان الطلب" (required, 200 char max)
    Input: "تفاصيل إضافية" (type='multiline', optional, 500 char max)
    Category row (label + 4 pills: طعام | بقالة | صيدلية | أخرى):
      Active: BRAND.RED bg + white text + scale(1.05) animation
      Inactive: SURFACE + BORDER
    Input: "موقع الاستلام" with pin icon (optional)
    Input: "موقع التوصيل ✱" with flag icon (required)
    Estimated price row (if both addresses filled): show "التكلفة المقدرة: {price} MAD" JetBrains Mono
    Submit Button: "إرسال الطلب" primary fullWidth
      - Validate: title required, dropoff required
      - Show inline errors if validation fails
      - On valid submit: call useOrder().createOrder(input) → set state to 'processing'

STATE 2 — "processing" (after submit):
  Remove form. Show centered content:
  PulseIndicator (BRAND.RED, size=20) + AnimatedTransition fadeUp:
    "جاري معالجة طلبك..." 20px Bold TEXT
    "نقوم بمراجعة طلبك للتأكد من توافقه مع القوانين" 14px TEXT2 centered
  Poll order status every 3000ms (useEffect interval):
    approved → STATE 3 'approved'
    manual_review → STATE 4 'review'
    rejected → STATE 5 'rejected'

STATE 3 — "approved":
  → router.replace({ pathname: '/(flows)/confirmation', params: { orderId } })

STATE 4 — "review":
  BottomSheet (cannot dismiss):
    WARN color icon "⚠️" 48px
    "طلبك قيد المراجعة" 18px Bold
    "سيتم مراجعة طلبك خلال بضع دقائق. نبحث في أمان الطلب." 14px TEXT2
    PulseIndicator still visible
    Continue polling...

STATE 5 — "rejected":
  Card with BRAND.ERROR_RED left border:
    "❌" icon + "تم رفض الطلب" 18px Bold ERROR_RED
    Rejection explanation from moderation data (14px TEXT2)
    "حاول مرة أخرى" ghost Button → reset to STATE 1

Default export.
Show complete code for both files.
```

---

## PROMPT V — Confirmation Screen

🎨 **Search Stitch**: `"order confirmation success animation mobile checkmark"`

**Test on phone**: A green checkmark animation, order reference number, price count-up, and navigation buttons.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 6 — Animations) • AGENTS.md

Stitch reference: "order confirmation success animation mobile checkmark"
Brand: BRAND.GREEN for success, BG background, JetBrains Mono for order ref and price

PREVIOUS: All components exist.

TASK: Create user-app/app/(flows)/confirmation.tsx

Receive orderId via useLocalSearchParams(). Fetch order via useOrder hook.
Use router.replace to reach this screen (no back navigation to order form).

Layout (BG background, no header):
- Top spacer (safeArea top + 24px)
- Animated success circle (react-native-reanimated):
    80px circle, BRAND.GREEN bg
    Scale animation: 0 → 1.2 → 1.0 with SPRING_BOUNCY on mount
    "✓" checkmark in white, 40px Bold
- "تم إرسال طلبك!" 24px Bold BRAND.TEXT, margin top 24px, fadeIn 300ms delay
- Order reference: "#JHZ-{first 8 chars of orderId}" JetBrains Mono 16px BRAND.TEXT2
- Price display: "{estimated_price} MAD" JetBrains Mono 32px BRAND.RED
    Animate count-up from 0 to final value over 800ms
- Info card (SURFACE bg, 16px radius, mx-4, mt-24px):
    Row: 🕐 emoji + "سيتم تعيين سائق خلال دقائق" 14px TEXT2
    Row: 📍 emoji + dropoff_address 14px TEXT (truncated)
- "تتبع طلبك" primary Button (mx-4 mt-24px) → router.push(`/(flows)/tracking/${orderId}`)
- "العودة للرئيسية" ghost Button → router.replace('/(tabs)/')

Handle: isLoading (Loader), error (EmptyState with back button), no data (EmptyState).
Default export. accessibilityLabel on buttons.
Show complete file.
```

---

## PROMPT W — Live Tracking Screen

🎨 **Search Stitch**: `"live delivery tracking map mobile premium driver location"`

**Test on phone**: A full-screen map with colored markers and a bottom sheet that shows driver info and status.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/CODING_RULES_BACKEND.md (Section 6 — Real-Time) • AGENTS.md

Stitch reference: "live delivery tracking map mobile premium driver location"
Brand: RED driver marker, YELLOW pickup, GREEN dropoff, SURFACE bottom sheet

PREVIOUS: useTracking, useOrder, MapMarker, ProgressTimeline, BottomSheet, PulseIndicator exist.

TASK: Create user-app/app/(flows)/tracking/[id].tsx

Receive id via useLocalSearchParams(). Use useTracking(id) + useOrder(id).

Full screen layout (no scroll, no normal header):
  Back button absolute top-left (SURFACE circle 44px, shadow) → router.back()
  MapView (react-native-maps) fills entire screen:
    Provider: Google Maps
    showsUserLocation: false (we show custom marker)
    If driverLocation: Marker with MapMarker type='driver'
    If order.pickup_lat: Marker with MapMarker type='pickup'
    Marker at dropoff: MapMarker type='dropoff'
    Polyline from driver to dropoff: BRAND.RED, strokeWidth 3 (only if driver assigned)
    Camera: fitToCoordinates on all markers with 100px padding

Bottom BottomSheet (non-dismissible, always visible, snapPoint ~40% height):
  Content changes by order.status:

  pending_moderation | pending_driver:
    PulseIndicator RED + "نبحث عن سائق مناسب..." 16px Bold + STRINGS context
    ProgressTimeline: steps=5, currentStep=0

  driver_assigned:
    Row: Avatar (driver) + name Bold + rating + vehicle emoji
    "تم تعيين السائق" GREEN badge
    ETA row: "⏱ الوصول خلال {eta} دقيقة" JetBrains Mono RED
    ProgressTimeline currentStep=1
    Phone icon button (44px touch, SURFACE circle, Feather phone icon) right side

  in_progress | picked_up:
    Same driver info row
    Status: picked_up → "تم استلام الطلب 📦", in_progress → "في الطريق 🛵"
    ETA countdown
    ProgressTimeline currentStep=2 or 3

  delivered:
    GREEN circle checkmark
    "هل استلمت طلبك؟" 18px Bold
    "نعم، استلمته" primary Button → confirmDelivery() → router.replace to confirmation
    "لم يصل" ghost Button (shows dispute info)

  completed:
    Star rating: 5 Pressable stars (☆ → ★ on select), BRAND.WARN color
    Comment Input optional
    "إرسال التقييم" primary Button → submitReview()
    "تخطى" ghost

  cancelled | moderation_rejected:
    ERROR_RED icon + reason text + "طلب جديد" Button → custom-request

Cancel button (only when status in [pending_driver, driver_assigned]):
  Ghost danger button at bottom: "إلغاء الطلب"
  Alert confirm before calling cancelOrder()

Cleanup Realtime subscription on unmount.
Default export. accessibilityLabel on all interactive elements.
Show complete file.
```

---

## PROMPT X — Chat Screen

🎨 **Search Stitch**: `"mobile chat messaging bubbles premium modern"`

**Test on phone**: Message bubbles (red for you, white for driver), input bar at bottom, disabled state when order is closed.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/CODING_RULES_BACKEND.md (Section 6 — Real-Time) • AGENTS.md

Stitch reference: "mobile chat messaging bubbles premium modern"
Brand: RED user bubbles, SURFACE driver bubbles, SURFACE input bar

PREVIOUS: useChat hook, Avatar, Input, Button exist.

TASK: Create user-app/app/(flows)/chat/[id].tsx

Receive id (orderId) via useLocalSearchParams(). Use useChat(id).

Layout:
  Header (SURFACE, 56px, safe area top):
    Back chevron + driver Avatar (size=sm) + driver name Bold + PulseIndicator (GREEN, online) | (GRAY, offline)
    Phone icon right (44px touch, Feather phone, BRAND.TEXT2)

  FlatList (flex-1):
    inverted={true} so newest message at bottom
    keyExtractor: item.id
    Each message by sender_role:
      'user': right-aligned bubble, BRAND.RED bg, white text, rounded-2xl no bottom-right
      'driver': left-aligned bubble, SURFACE bg, BRAND.BORDER border, BRAND.TEXT, rounded-2xl no bottom-left
      'system': centered, BRAND.BORDER bg, BRAND.TEXT2, italic 12px, mx-8
    Bubble content: message text 15px + timestamp 11px TEXT3 below
    Entering animation: AnimatedTransition fadeUp per message
    If isLoading: 4 ShimmerPlaceholder rows (alternating left/right)
    If empty: EmptyState icon="💬" title=STRINGS.chat.noMessages

  Input bar (SURFACE bg, 1px BRAND.BORDER top border, 8px padding, safe area bottom):
    Row: expandable TextInput (flex-1, max 4 lines) + image-picker Pressable + red circle send Pressable
    Send button: 44px circle, BRAND.RED bg, white arrow-up icon, disabled when empty
    Image picker: Feather image icon, BRAND.TEXT2, 44px touch
    KeyboardAvoidingView wrapping entire screen

  Terminal state banner (when order.status in TERMINAL_STATUSES):
    Fixed bar above input bar: BRAND.BORDER bg, centered TEXT2: STRINGS.chat.chatClosed
    Input bar disabled

Cleanup Realtime on unmount.
Default export. accessibilityLabel on all interactive elements.
Show complete file.
```

---

## PROMPT Y — Root Layout + App Entry

**What this creates**: The app's root `_layout.tsx` — this wraps everything and loads fonts.
**Test on phone**: Fonts should load correctly and the app should start without errors.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md

PREVIOUS: All screens and components exist.

TASK: Create/update user-app/app/_layout.tsx

Requirements:
1. Import global.css as very first import: import '../global.css'
2. Import 'react-native-gesture-handler' immediately after
3. Load custom fonts using expo-font useFonts:
   {
     'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
     'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
     'DMSans-SemiBold': require('../assets/fonts/DMSans-SemiBold.ttf'),
     'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
     'JetBrainsMono-Regular': require('../assets/fonts/JetBrainsMono-Regular.ttf'),
     'JetBrainsMono-Bold': require('../assets/fonts/JetBrainsMono-Bold.ttf'),
   }
    NOTE: Use @expo-google-fonts/dm-sans and @expo-google-fonts/jetbrains-mono if available, otherwise fallback to system fonts.

4. Keep SplashScreen visible until fonts loaded: SplashScreen.preventAutoHideAsync()
   After fonts loaded: SplashScreen.hideAsync()

5. If fonts fail to load: show a fallback View (just BG background) and log the error

6. Wrap app in QueryClientProvider with new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 30000 } } })

7. StatusBar: style="dark" for iOS, barStyle="dark-content" for Android

8. Stack navigator root: screenOptions { headerShown: false, contentStyle: { backgroundColor: BRAND.BG } }
   Routes: (auth), (tabs), (flows) all as stack groups

Default export.
Show complete file.
```

---

## PROMPT Z — Stub Screens + Final Barrel Check

**What this creates**: 4 simple stub screens for features not yet built.
**Test on phone**: All stub screens should show a "Coming Soon" message — no crashes.

```
MANDATORY CONTEXT:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md • AGENTS.md

PREVIOUS: All core screens exist.

TASK: Create 4 stub files + verify barrel export:

━━━ File 1: user-app/app/(flows)/store/[id].tsx
Header: back chevron + "تفاصيل المتجر" Bold
Body: EmptyState icon="🏪" title="المتجر قريباً" subtitle="سيتم إضافة تصفح المتاجر قريباً"
BG background. Default export.

━━━ File 2: user-app/app/(flows)/cart.tsx
Header: back chevron + "السلة" Bold
Body: EmptyState icon="🛒" title="السلة فارغة" subtitle="أضف منتجات للبدء"
BG background. Default export.

━━━ File 3: user-app/app/(flows)/checkout.tsx
Header: back chevron + "الدفع" Bold
Body: EmptyState icon="💳" title="الدفع قريباً" subtitle="الدفع النقدي عند التسليم متاح حالياً"
BG background. Default export.

━━━ File 4: user-app/app/(flows)/ai-suggestion.tsx
Header: back chevron + "اقتراح ذكي ✨" Bold (BRAND.AI_PURPLE on sparkle)
Body: EmptyState icon="🤖" title="المساعد الذكي قريباً" subtitle="سيساعدك الذكاء الاصطناعي في صياغة طلبك"
AI_PURPLE accent color on the EmptyState icon background.
BG background. Default export.

━━━ Verify barrel export:
Confirm user-app/components/ui/index.ts exports ALL of these:
Button, Input, Card, Badge, StatusBadge, Avatar,
Loader, EmptyState, BottomSheet, ShimmerPlaceholder,
OrderCard, MapMarker, AnimatedTransition, PulseIndicator, ProgressTimeline

If any are missing, add them.

Show complete code for all 4 stub files + the final index.ts.
```

---

## FINAL CHECK PROMPT

After ALL prompts A–Z are complete, run this:

```
MANDATORY CONTEXT:
• docs/REVIEW_CHECKLIST.md (all 116 items)
• docs/MASTER_INSTRUCTIONS.md • AGENTS.md

TASK: Final Frontend Review

Audit EVERY file in user-app/ against:
1. No hardcoded hex colors outside brand.ts
2. No 'any' type anywhere
3. No unnecessary inline styles — only dynamic/animated values allowed in style={{}}
4. Every Pressable has accessibilityLabel
5. Every Image has accessibilityLabel
6. Every screen handles loading, error, AND empty states
7. All Realtime subscriptions have cleanup in useEffect return
8. All components use NativeWind classes
9. Barrel export in components/ui/index.ts includes all 15 components
10. No business logic in any component file
11. No Supabase calls in any screen file
12. All money values use JetBrains Mono font

List any violations with exact file:line.

Then verify these user journeys work end-to-end:
Journey 1: splash → onboarding → register → OTP → home tabs
Journey 2: home → new request → submit → analyzing → confirmation → tracking
Journey 3: tracking screen → all status states render correctly
Journey 4: chat screen → messages visible → disabled when order closed
Journey 5: profile → language toggle → logout → splash

Report any gap or broken link in each journey.
```

---

*All prompts A–Z complete. This is your entire JAHEEZ frontend.*
*After these are built and working in Expo Go, proceed to connect the backend.*
*Reference: FRONTEND_ONLY_SETUP.md for installation, this file for prompts.*
