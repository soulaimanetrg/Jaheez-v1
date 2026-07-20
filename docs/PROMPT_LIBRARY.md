# JAHEEZ — Prompt Library

> **Purpose**: Curated library of ready-to-use prompts for building JAHEEZ with any AI tool. Organized by build phase. Each prompt requests code generation — but this file itself is documentation only.  
> **Usage**: Copy-paste these prompts directly into Claude, Antigravity, or any AI coding tool.

---

## How to Use This Library

1. **Always paste `JAHEEZ_AGENTS.md` into context first** (see CLAUDE_WORKFLOW.md)
2. **Use prompts in order** — each prompt assumes the previous ones are complete
3. **Give one prompt at a time** — wait for output, review, then continue
4. **Adapt as needed** — adjust prompts if your context differs from the expected state
5. **After each prompt**: Run the 5-point verification from REVIEW_CHECKLIST.md

---

## Phase 0 — Foundation Prompts

### PROMPT F-01: Shared Types & Constants

```
You have read JAHEEZ_AGENTS.md. Create the foundation type system.

Create these files:

1. shared/types.ts
   - Paste ALL TypeScript interfaces from Section 5 of JAHEEZ_AGENTS.md
   - Include: User, Driver, Order, OrderItem, OrderModeration, KeywordFlag,
     ChatMessage, DriverLocation, FraudFlag, Review, ApiResponse, PaginatedResponse,
     AuthState, CartItem, CartState
   - Include all type aliases: UserRole, VehicleType, OrderType, PaymentMethod,
     ModerationDecision, FraudSeverity, OrderStatus
   - Add: CreateOrderInput interface with all order creation fields

2. shared/constants.ts
   - ORDER_STATUSES: all OrderStatus values in lifecycle order
   - VEHICLE_TYPES: all VehicleType values
   - CATEGORIES: ['food', 'grocery', 'pharmacy', 'custom_errand']
   - ZONES: ['safi_centre', 'safi_nord', 'safi_sud', 'safi_est']

Show complete code for both files.
```

### PROMPT F-02: Brand Tokens & Animation Config

```
Foundation types exist. Now create the design token system.

1. user-app/constants/brand.ts
   - Export BRAND object from Section 2 of JAHEEZ_AGENTS.md (all colors, spacing, radius)
   - Export FONTS object: DISPLAY, BODY, SEMIBOLD, MONO, MONO_BOLD
   - Use "as const" for full type safety

2. user-app/constants/animations.ts
   - Export spring configs: SPRING_DEFAULT, SPRING_SNAPPY, SPRING_GENTLE, SPRING_BOUNCY
   - Export timing presets: FADE_IN, FADE_OUT, SLIDE_UP, SLIDE_RIGHT
   - Export interaction presets: SCALE_PRESS, PULSE
   - Each config should have: type, damping, stiffness, mass (for springs)
     or duration, easing (for timing)
   - Export STAGGER_DELAY = 50 (ms between staggered items)
   - Use react-native-reanimated v3 compatible format

Show complete code for both files.
```

### PROMPT F-03: Supabase Client & API Layer

```
Tokens exist. Now create the Supabase infrastructure.

1. user-app/lib/supabase.ts
   - Import createClient from @supabase/supabase-js
   - Use EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
   - Export a single supabase instance
   - Configure with AsyncStorage for session persistence

2. user-app/lib/api.ts
   - Import supabase from ./supabase
   - Import types from shared/types.ts
   - Create all user-app API functions (see Section 14 of JAHEEZ_AGENTS.md):
     * getActiveOrder(userId) → ApiResponse<Order>
     * getOrderById(orderId) → ApiResponse<Order>
     * getOrderHistory(userId, page) → ApiResponse<Order[]>
     * createOrder(input, userId) → ApiResponse<Order>
     * cancelOrder(orderId, reason) → ApiResponse<void>
     * confirmDelivery(orderId) → ApiResponse<void>
     * submitReview(orderId, rating, comment?) → ApiResponse<void>
     * sendChatMessage(orderId, content, senderId) → ApiResponse<void>
     * getChatMessages(orderId) → ApiResponse<ChatMessage[]>
   - Every function: try/catch, return ApiResponse wrapper, no any types
   - Use exact Supabase query patterns from Section 14

Show complete code for both files.
```

### PROMPT F-04: Localized Strings

```
Create user-app/constants/strings.ts with all user-facing text.

Structure:
export const STRINGS = {
  ar: { ... },  // Arabic (primary)
  fr: { ... },  // French (secondary)
};

Include strings for:
- Navigation: home, search, orders, chat, profile tab labels
- Auth: login, register, OTP screen titles and form labels
- Home: section headers, search placeholder, new request button
- Orders: filter tabs, empty states
- Profile: settings labels, logout
- Custom request: form labels, moderation states, error messages
- Tracking: status labels, ETA format, cancel reasons
- Chat: input placeholder, closed chat banner
- Common: loading, error, empty state messages, confirm/cancel

Every string in Arabic and French. No English strings in the app.
Show complete file.
```

---

## Phase 1 — UI Component Prompts

### PROMPT C-01: Button & Input Components

```
Foundation files exist. Now build the first two UI components.
Follow JAHEEZ_AGENTS.md Section 10 exactly.
Use Google Stitch reference: "premium mobile button component design".

1. user-app/components/ui/Button.tsx
   - ButtonProps interface: label, onPress, variant, size, isLoading,
     isDisabled, leftIcon, rightIcon, fullWidth, accessibilityLabel (REQUIRED)
   - 4 variants: primary (RED), secondary (YELLOW), ghost (RED border), danger (ERROR_RED)
   - 52px height, pill radius (9999), DM Sans SemiBold 16px
   - Press animation: scale(0.97) with SPRING_SNAPPY from animations.ts
   - Loading state: replace label with ActivityIndicator
   - All colors from BRAND tokens, no hardcoded values
   - Use NativeWind classes + Animated from react-native-reanimated

2. user-app/components/ui/Input.tsx
   - InputProps interface: label, placeholder, value, onChangeText, type,
     error, hint, leftIcon, rightIcon, isDisabled, accessibilityLabel (REQUIRED)
   - Types: text, phone, password, otp, number, multiline
   - 52px height, 12px radius, INPUT_BG fill
   - Animated focus border: BORDER → RED transition (200ms ease-out)
   - Error state: RED border + error text below in ERROR_RED
   - OTP type: 6 separate boxes, JetBrains Mono 32px, auto-advance
   - Password type: toggle eye icon for show/hide

Show complete code for both files.
```

### PROMPT C-02: Card, Badge & Status Components

```
Button and Input exist. Continue with display components.

1. user-app/components/ui/Card.tsx
   - White bg, 16px radius, shadow, 16px padding
   - If onPress: Pressable with scale(0.98) spring animation
   - testID prop for testing

2. user-app/components/ui/Badge.tsx
   - Props: label, color ('red'|'yellow'|'green'|'gray'|'warn')
   - Small pill shape, micro text (10px SemiBold)
   - Colors mapped from BRAND tokens

3. user-app/components/ui/StatusBadge.tsx
   - Props: status (OrderStatus), size ('sm'|'md')
   - Map ALL 10 OrderStatus values to Arabic labels and colors
   - See exact mapping in JAHEEZ_AGENTS.md Section 10

4. user-app/components/ui/Avatar.tsx
   - Props: uri, name, size ('sm'|'md'|'lg')
   - If uri: show Image. If no uri: show initials circle
   - Sizes: sm=32px, md=44px, lg=64px

Show complete code for all 4 files.
```

### PROMPT C-03: Loading, Empty & Sheet Components

```
Continue with state display and modal components.

1. user-app/components/ui/Loader.tsx
   - Props: fullScreen, message
   - fullScreen: centered in screen, BRAND.BG background
   - Inline: just the ActivityIndicator
   - Color: BRAND.RED
   - Optional message text below spinner

2. user-app/components/ui/EmptyState.tsx
   - Props: icon (emoji), title, subtitle, actionLabel, onAction
   - Centered layout: icon (64px), title (bold 18px), subtitle (14px TEXT2)
   - If actionLabel: show primary Button below
   - Gentle float animation on the icon (translateY oscillation)

3. user-app/components/ui/BottomSheet.tsx
   - Props: isVisible, onClose, children, title
   - Slide up from bottom with SPRING_GENTLE animation
   - Dark overlay (40% black), tap to dismiss
   - White sheet with 24px top corner radius
   - Drag handle bar: 40×4px, centered, BORDER color
   - Drag-to-dismiss when dragged below 30% threshold

4. user-app/components/ui/ShimmerPlaceholder.tsx
   - Props: width, height, radius
   - Animated gradient sweep (left to right, continuous loop)
   - Use for skeleton loading screens
   - Colors: INPUT_BG → BORDER → INPUT_BG

Show complete code for all 4 files.
```

### PROMPT C-04: OrderCard, MapMarker & Animation Components

```
Continue with the remaining components.

1. user-app/components/ui/OrderCard.tsx
   - Props: order (Order), onPress, variant ('compact'|'full')
   - Compact: title + StatusBadge + price (JetBrains Mono) + formatted date
   - Full: all details + driver info + action buttons
   - Press animation: scale(0.98) spring

2. user-app/components/ui/MapMarker.tsx
   - Props: type ('driver'|'pickup'|'dropoff'|'user'), label
   - Custom markers for react-native-maps
   - driver: RED circle with scooter icon
   - pickup: YELLOW circle with pin icon
   - dropoff: GREEN circle with flag icon
   - user: YELLOW circle

3. user-app/components/ui/AnimatedTransition.tsx
   - Wrapper component for shared enter/exit animations
   - Props: type ('fade'|'slide-up'|'slide-right'|'scale'), children, delay
   - Uses animation presets from constants/animations.ts

4. user-app/components/ui/PulseIndicator.tsx
   - Props: color, size
   - Continuous scale pulse animation (1 → 1.3 → 1)
   - Used for live/online status dots

5. user-app/components/ui/ProgressTimeline.tsx
   - Props: steps (string[]), currentStep (number), completedColor, activeColor
   - Horizontal step progress: completed=GREEN check, current=RED pulse, future=gray
   - Used on tracking screen for order status timeline

6. user-app/components/ui/index.ts
   - Barrel export ALL components (15 total)

Show complete code for all 6 files.
```

---

## Phase 2 — Hooks & State Prompts

### PROMPT H-01: Auth Hook & Store

```
All UI components exist. Now build the auth system.

1. user-app/store/authStore.ts
   - Zustand store with persist middleware (AsyncStorage)
   - State: user (User|null), isLoading (boolean)
   - Actions: setUser, setLoading, clearUser

2. user-app/hooks/useAuth.ts
   - Uses authStore for state
   - signIn(phone, password): calls supabase.auth.signInWithPassword,
     then fetches user profile from users table
   - signUp(phone, fullName, password): creates Supabase Auth user,
     then inserts row in users table
   - verifyOTP(verificationId, otp): calls supabase.auth.verifyOtp
   - signOut(): calls supabase.auth.signOut, clears Zustand store
   - updateProfile(updates): updates users table row
   - On init: checks supabase.auth.getSession() to restore session
   - Returns: { user, isLoading, isAuthenticated, signIn, signUp, verifyOTP, signOut, updateProfile }

Show complete code for both files.
```

### PROMPT H-02: Order Hook & Store

```
Auth hook exists. Now build order management.

1. user-app/store/orderStore.ts
   - Zustand store (no persistence — session only)
   - State: activeOrder (Order|null), isTracking (boolean)
   - Actions: setActiveOrder, clearActiveOrder, setTracking

2. user-app/hooks/useOrder.ts
   - Uses React Query for all data fetching
   - Uses orderStore for active order state
   - createOrder(data): calls api.createOrder, returns moderation result
   - cancelOrder(orderId, reason): calls api.cancelOrder, invalidates query cache
   - confirmDelivery(orderId): calls api.confirmDelivery
   - submitReview(orderId, rating, comment): calls api.submitReview
   - Query keys: ['orders', userId], ['order', orderId]
   - Returns: { order, orders, isLoading, error, createOrder, cancelOrder, confirmDelivery, submitReview }

Show complete code for both files.
```

### PROMPT H-03: Tracking, Chat & Location Hooks

```
Order hook exists. Now build real-time hooks.

1. user-app/hooks/useTracking.ts
   - Subscribes to Supabase Realtime: order status changes + driver location
   - Uses channel patterns from JAHEEZ_AGENTS.md Section 8
   - Calculates ETA: distance / 25 km/h (city average)
   - Cleans up subscriptions on unmount
   - Returns: { driverLocation, orderStatus, etaMinutes, isConnected }

2. user-app/hooks/useChat.ts
   - Loads initial messages with React Query (getChatMessages)
   - Subscribes to new messages with Realtime
   - sendMessage(content, type): calls api.sendChatMessage
   - uploadImage(uri): uploads to Supabase Storage 'chat-images', returns URL
   - Returns: { messages, isLoading, sendMessage, uploadImage }

3. user-app/hooks/useLocation.ts
   - Uses expo-location for device GPS
   - requestPermission(): asks for foreground location permission
   - Returns: { coords: {lat, lng} | null, error, requestPermission }

4. user-app/store/cartStore.ts
   - Zustand with persist (AsyncStorage)
   - State: items (CartItem[]), store_id (string|undefined)
   - Actions: addItem, removeItem, updateQuantity, clearCart
   - total(): computed sum of item.unit_price * item.quantity

5. user-app/store/locationStore.ts
   - Zustand (no persistence)
   - State: coords ({lat, lng} | null), lastUpdated (string|null)
   - Actions: setCoords, clearCoords

Show complete code for all 5 files.
```

---

## Phase 3 — Auth Screen Prompts

### PROMPT A-01: Splash & Onboarding

```
All hooks and stores exist. Starting auth screens.
Use Google Stitch reference: "premium mobile splash screen delivery app"
and "mobile onboarding carousel premium animation".

1. user-app/app/(auth)/_layout.tsx
   - Stack navigator, no header, BG (#FEFCE8) background

2. user-app/app/(auth)/splash.tsx
   - Full screen, YELLOW gradient background (YELLOW → YELLOW_LIGHT)
   - Center: JAHEEZ logo with animated entrance (scale 0→1 spring, 800ms)
   - Below: tagline "Smart Delivery & Errands" in TEXT2, fade in 200ms delay
   - On mount: check useAuth().isAuthenticated
   - If yes: router.replace('/(tabs)/')
   - If no: wait 2s then router.replace('/(auth)/onboarding')
   - RED ActivityIndicator at bottom while checking

3. user-app/app/(auth)/onboarding.tsx
   - 3-slide horizontal FlatList with Lottie animations
   - Slide data: title (Arabic), subtitle (Arabic), animation file reference
   - Dot indicators: active=RED, inactive=BORDER
   - "التالي" primary Button advances slides
   - On last slide: "ابدأ الآن" → router.push('/(auth)/login')
   - "تخطى" link top-right → router.push('/(auth)/login')
   - Spring transitions between slides

Show complete code for all 3 files.
```

### PROMPT A-02: Login & Register

```
Splash and onboarding done. Now auth forms.
Use Google Stitch: "premium mobile login form modern" and "register screen mobile premium".

1. user-app/app/(auth)/login.tsx
   - Header: back arrow + "تسجيل الدخول" centered
   - Phone Input (type="phone"), Password Input (type="password" with eye toggle)
   - "نسيت كلمة المرور؟" link (gray, right-aligned)
   - "دخول" primary Button (full width, shows loading state)
   - Divider "أو" with lines
   - "إنشاء حساب جديد" ghost Button → register
   - Validation: phone not empty, password >= 8 chars
   - KeyboardAvoidingView wrapper
   - Animated input focus transitions

2. user-app/app/(auth)/register.tsx
   - Header: back arrow + "إنشاء حساب" centered
   - Full Name, Phone, Password, Confirm Password inputs
   - Terms checkbox (required to enable button)
   - "إنشاء الحساب" primary Button
   - Validates: all fields, passwords match, phone format +212XXXXXXXXX
   - On success: router.push('/(auth)/otp')
   - Field-level error display

Show complete code for both files.
```

### PROMPT A-03: OTP Verification

```
Login and register done. Now OTP.
Use Google Stitch: "OTP verification screen premium animation mobile".

user-app/app/(auth)/otp.tsx
- Receives { verificationId, phone } via router params
- Lock icon (64px, RED), animated scale entrance
- "تحقق من رقمك" title (22px bold)
- Masked phone: "+212 6** *** **78"
- 6 OTP boxes: JetBrains Mono 32px, auto-advance, auto-submit on 6th digit
- 90-second countdown timer with "إعادة إرسال الرمز" link after countdown
- Error: shake animation on boxes + "رمز غير صحيح" text
- On success: router.replace('/(tabs)/')
- Stagger animation on the 6 boxes appearing (50ms delay each)

Show complete code.
```

---

## Phase 4 — Tab Screen Prompts

### PROMPT T-01: Bottom Navigation & Home

```
Auth done. Now tabs.
Use Google Stitch: "premium delivery app home screen" and "bottom navigation mobile modern".

1. user-app/app/(tabs)/_layout.tsx
   - 5 tabs: الرئيسية, البحث, طلباتي, الرسائل, حسابي
   - 64px + safe area height, SURFACE bg, 1px BORDER top
   - Active: RED icon + label, inactive: TEXT3 icon
   - Tab switch: cross-fade 150ms
   - Small RED dot above active icon

2. user-app/app/(tabs)/index.tsx (Home)
   - Header: YELLOW background (gradient YELLOW → YELLOW_LIGHT)
     Left: JAHEEZ logo (80px), Right: notification bell with badge
     Below: location chip "📍 سافي، المغرب"
   - Active order banner (if exists): YELLOW_LIGHT bg, live StatusBadge, "تتبع" link
   - Search bar: Pressable (not input), 52px, INPUT_BG, → search tab
   - Category pills: horizontal ScrollView, selected=RED, unselected=SURFACE
   - "طلب جديد" Button: primary, full width
   - "آخر طلباتك" section: 3 OrderCard (compact) with stagger animation
   - Empty state if no orders
   - Loading: 3 ShimmerPlaceholder cards

Show complete code for both files.
```

### PROMPT T-02: Orders, Chat & Profile

```
Home screen done. Now remaining tab screens.

1. user-app/app/(tabs)/orders.tsx
   - Filter tabs: الكل | نشط | مكتمل | ملغي (RED underline on selected)
   - FlatList of OrderCard (compact)
   - Pull-to-refresh (RED tint)
   - Empty states per filter
   - Loading: ShimmerPlaceholder cards

2. user-app/app/(tabs)/chat.tsx
   - FlatList of chat conversation rows
   - Row: driver Avatar (sm) + name + last message + timestamp + unread badge
   - Empty state: 💬 "لا توجد محادثات"
   - Tap row → router.push to individual chat

3. user-app/app/(tabs)/profile.tsx
   - Avatar (lg) + name + phone + trust score bar
   - Settings rows: العناوين, الإشعارات (toggle), مركز المساعدة, اللغة, الإصدار
   - Logout button: ghost variant, ERROR_RED color, confirm dialog

Show complete code for all 3 files.
```

---

## Phase 5 — Request Flow Prompts

### PROMPT R-01: Custom Request

```
All tab screens done. Now the main order flow.
Use Google Stitch: "order creation form mobile premium" and "delivery request form design".

user-app/app/(flows)/custom-request.tsx
- Header: "طلب جديد", back arrow
- Order type selector: 2 cards — "توصيل" and "مهمة"
- Title Input: "ماذا تريد؟", required, max 200 chars
- Description Input: multiline, 4 lines, optional
- Category pills: طعام | بقالة | صيدلية | أخرى
- Pickup address Input with map pin icon (optional)
- Dropoff address Input with map pin icon (REQUIRED)
- Estimated price Input (JetBrains Mono, optional)
- "إرسال الطلب" RED Button

Moderation states after submit:
- Processing: Loader + "جاري معالجة طلبك..."
- Manual review: BottomSheet "طلبك قيد المراجعة" + realtime subscription
- Rejected: inline ERROR_RED card with explanation
- Approved: router.push('/(flows)/confirmation')

Show complete code.
```

### PROMPT R-02: Confirmation

```
Request screen done. Now confirmation.
Use Google Stitch: "order confirmation success animation mobile".

user-app/app/(flows)/confirmation.tsx
- Receives orderId via router params
- Animated green checkmark (Lottie success-checkmark.json, scale 0→1, 600ms spring)
- "تم إرسال طلبك!" title (24px bold)
- Order ref: "#JHZ-{first 8 chars}" JetBrains Mono
- Price: "{estimated_price} MAD" JetBrains Mono RED 28px (count-up animation)
- "سيتم تعيين سائق خلال دقائق" info row
- "تتبع طلبك" primary Button → tracking
- "العودة للرئيسية" ghost Button → home
- No back arrow (router.replace, not push)

Show complete code.
```

---

## Phase 6 — Tracking & Chat Prompts

### PROMPT TC-01: Live Tracking

```
Confirmation done. Now tracking screen.
Use Google Stitch: "live delivery tracking map mobile premium" and "order status timeline".

user-app/app/(flows)/tracking/[id].tsx
- Full screen MapView with custom markers
- MapMarker: driver (RED), pickup (YELLOW), dropoff (GREEN)
- Driver marker animates smoothly (Animated.Value for lat/lng, 1s transition)
- BottomSheet fixed at 35% height, content changes by status:
  * pending_moderation: Loader + "جاري معالجة طلبك..."
  * pending_driver: PulseIndicator + searching animation
  * driver_assigned: driver card + ETA + ProgressTimeline
  * in_progress: driver card + "في الطريق" + ETA
  * picked_up: "تم الاستلام" + ETA
  * delivered: confirm buttons ("نعم، استلمته" + "لم يصل")
  * completed: success + star rating (1-5)
  * cancelled: error + reason + "طلب جديد" button
- Cancel button: only in [pending_driver, driver_assigned]
- Uses useTracking(orderId) + useOrder(orderId) hooks

Show complete code.
```

### PROMPT TC-02: Chat Screen

```
Tracking done. Now individual chat.
Use Google Stitch: "premium mobile chat interface" and "messaging screen design".

user-app/app/(flows)/chat/[id].tsx
- Header: driver name + online dot + phone call icon
- FlatList inverted (newest at bottom)
- User messages: right-aligned, RED bg, white text, rounded corners
- Driver messages: left-aligned, SURFACE bg, TEXT color
- System messages: centered, gray bg, small italic
- Timestamps below in TEXT3
- Input bar: TextInput + send button (RED circle, arrow) + image picker
- KeyboardAvoidingView
- Disabled state when order completed/cancelled: "تم إغلاق هذه المحادثة"
- New messages: slide-up + fade animation
- Uses useChat(orderId) hook

Show complete code.
```

---

## Phase 7 — Backend Prompts

### PROMPT B-01: Moderation Edge Function

```
All screens done. Now backend logic.

Create supabase/functions/moderate/index.ts (Deno runtime)

Follow the moderation workflow:
Step 1: Load banned keywords from DB
Step 2: Normalize text (diacritics, etc.)
Step 3: Keyword matching
Step 4: If keywords found, set decision='manual_review', else 'approved'
Step 5: Write results to order_moderation + update orders table

Environment vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Show complete Deno TypeScript code.
```

### PROMPT B-02: Match Driver & Notification Functions

```
Moderation function done. Now driver matching and notifications.

1. supabase/functions/match-driver/index.ts
   - Input: { order_id }
   - Algorithm: query nearby drivers, score by proximity/rating/experience,
     broadcast to top 5, 30s acceptance window, expand radius on no accept,
     cancel after 3 rounds
   - See JAHEEZ_AGENTS.md Section 9

2. supabase/functions/send-notification/index.ts
   - Input: { user_id, title, body, type, order_id? }
   - Insert to notifications table + send Expo Push API

Show complete Deno TypeScript code for both.
```

---

## Final — Review Prompt

### PROMPT FINAL: Full Review

```
All code is built. Do a final review.

Check every file against these criteria:
1. No hardcoded colors (grep for hex values outside brand.ts)
2. No missing loading states
3. No missing error states
4. No missing empty states
5. No missing accessibilityLabel
6. No any types
7. No inline styles (except allowed exceptions)

List every violation with file name and line number.
Fix each violation.

Then confirm these user journeys work:
Journey 1: register → login → home → create request → approved → confirmation → tracking
Journey 2: create request → flagged → waiting → admin approves → confirmation
Journey 3: create request → rejected → error displayed

For each journey: list files involved, hooks called, Supabase tables accessed.
Report any gaps.
```

---

*Every prompt here is battle-tested against the JAHEEZ specification. Use them in order.*
