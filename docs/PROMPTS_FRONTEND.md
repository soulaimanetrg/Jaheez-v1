# JAHEEZ — Frontend Prompts (A to Z)

> **How to use**: Copy-paste each prompt in order. Wait for output, review, test, then move to the next letter. Every prompt references the instruction files so the AI never forgets the rules.

---

## PROMPT A — Shared Types

```
MANDATORY CONTEXT — Read and obey these files before writing ANY code:
• docs/MASTER_INSTRUCTIONS.md (non-negotiable rules)
• docs/CODING_RULES_FRONTEND.md (TypeScript, NativeWind, hooks)
• docs/DESIGN_SYSTEM_RULES.md (brand tokens, animations)
• docs/FOLDER_STRUCTURE.md (file placement)
• AGENTS.md (project intelligence)

TASK: Create shared/types.ts

Include ALL interfaces:
- User (id, phone, full_name, avatar_url, role, trust_score, is_banned, created_at, updated_at)
- Driver (id, user_id, vehicle_type, plate_number, is_online, is_approved, rating_avg, total_deliveries, current_zone, created_at)
- Order (id, user_id, driver_id, type, title, description, category, status, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, estimated_price, final_price, moderation_status, created_at, updated_at)
- OrderItem (id, order_id, name, quantity, unit_price, notes)
- OrderModeration (id, order_id, decision, keyword_flags, explanation, reviewed_by, created_at)
- ChatMessage (id, order_id, sender_id, sender_role, content, type, media_url, created_at)
- DriverLocation (id, driver_id, lat, lng, speed, heading, created_at)
- FraudFlag (id, user_id, driver_id, order_id, type, severity, evidence, resolved, created_at)
- Review (id, order_id, reviewer_id, driver_id, rating, comment, created_at)
- ApiResponse<T> { data: T | null; error: string | null }
- PaginatedResponse<T> { data: T[]; count: number; page: number; pageSize: number }
- CreateOrderInput (type, title, description, category, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, estimated_price)
- CartItem (id, name, quantity, unit_price, notes, store_id)
- CartState (items, store_id)
- AuthState (user, isLoading)

Type aliases:
- UserRole = 'user' | 'driver' | 'admin'
- VehicleType = 'motorcycle' | 'car' | 'bicycle' | 'on_foot'
- OrderType = 'delivery' | 'errand'
- OrderStatus = 'pending_moderation' | 'pending_driver' | 'driver_assigned' | 'in_progress' | 'picked_up' | 'delivered' | 'completed' | 'cancelled' | 'disputed' | 'moderation_rejected'
- PaymentMethod = 'cash' | 'card' | 'wallet'
- ModerationDecision = 'approved' | 'manual_review' | 'rejected'
- FraudSeverity = 'low' | 'medium' | 'high' | 'critical'

Rules: No any. Named exports only. as const where applicable.
Show complete file.
```

---

## PROMPT B — Shared Constants

```
MANDATORY CONTEXT — Read and obey these files before writing ANY code:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/FOLDER_STRUCTURE.md • AGENTS.md

PREVIOUS WORK: shared/types.ts exists with all interfaces and type aliases.

TASK: Create shared/constants.ts

Export these constants (all as const):

ORDER_STATUSES: array of all OrderStatus values in lifecycle order
TERMINAL_STATUSES: ['completed', 'cancelled', 'moderation_rejected']
VEHICLE_TYPES: all VehicleType values
CATEGORIES: ['food', 'grocery', 'pharmacy', 'custom_errand']  
ZONES: ['safi_centre', 'safi_nord', 'safi_sud', 'safi_est']
LOCATION_UPDATE_INTERVAL_MS: 5000
VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> mapping every valid state transition
MAX_DESCRIPTION_LENGTH: 500
MAX_TITLE_LENGTH: 200
DRIVER_SEARCH_RADIUS_KM: 5
DRIVER_EXPANDED_RADIUS_KM: 8
DRIVER_MATCH_TIMEOUT_MS: 30000
LOCATION_UPDATE_INTERVAL_MS: 5000

Import types from shared/types.ts. No any. Named exports. as const.
Show complete file.
```

---

## PROMPT C — Brand Tokens

```
MANDATORY CONTEXT — Read and obey ALL of these before writing code:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 2 — Brand Tokens)
• docs/FOLDER_STRUCTURE.md • AGENTS.md

PREVIOUS: shared/types.ts and shared/constants.ts exist.

TASK: Create user-app/constants/brand.ts

Export BRAND object with ALL colors from DESIGN_SYSTEM_RULES.md Section 2.1:
Primary: YELLOW, YELLOW_DARK, YELLOW_LIGHT, RED, RED_DARK, RED_LIGHT
UI: SURFACE, BG, TEXT, TEXT2, TEXT3, BORDER, INPUT_BG
Semantic: GREEN, ERROR_RED, WARN

Export FONTS object:
DISPLAY: 'DMSans-Bold'
BODY: 'DMSans-Regular'
SEMIBOLD: 'DMSans-SemiBold'
MONO: 'JetBrainsMono-Regular'
MONO_BOLD: 'JetBrainsMono-Bold'

Export dimension constants:
RADIUS_CARD: 16, RADIUS_INPUT: 12, RADIUS_PILL: 9999
BUTTON_HEIGHT: 52, INPUT_HEIGHT: 52, NAV_HEIGHT: 56, TAB_HEIGHT: 64
TOUCH_MIN: 44
SHADOW: { shadowColor: '#000', shadowOffset: {width:0,height:4}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }

Use "as const" on everything. Named exports only.
Show complete file.
```

---

## PROMPT D — Animation Config

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 6 — Premium Animation System)
• AGENTS.md

PREVIOUS: brand.ts exists.

TASK: Create user-app/constants/animations.ts

Export spring configs (react-native-reanimated v3 compatible):
SPRING_DEFAULT: { damping: 15, stiffness: 150, mass: 1 }
SPRING_SNAPPY: { damping: 20, stiffness: 300, mass: 0.8 }
SPRING_GENTLE: { damping: 20, stiffness: 100, mass: 1.2 }
SPRING_BOUNCY: { damping: 10, stiffness: 180, mass: 0.9 }

Export timing presets:
FADE_IN: { duration: 200 }
FADE_OUT: { duration: 150 }
SLIDE_UP: { damping: 20, stiffness: 100, mass: 1.2 }

Export interaction presets:
SCALE_PRESS: 0.97
SCALE_CARD_PRESS: 0.98
TAB_BOUNCE: { from: 0.8, overshoot: 1.1, to: 1 }

Export timing constants:
STAGGER_DELAY: 50
TRANSITION_FAST: 150
TRANSITION_DEFAULT: 200
TRANSITION_SLOW: 350

All as const. Named exports.
Show complete file.
```

---

## PROMPT E — Localized Strings

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md

PREVIOUS: brand.ts, animations.ts exist.

TASK: Create user-app/constants/strings.ts

Export STRINGS = { ar: {...}, fr: {...} }

Keys for BOTH languages:
nav: { home, search, orders, chat, profile }
auth: { login, register, otp, loginTitle, registerTitle, otpTitle, phone, password, confirmPassword, fullName, forgotPassword, createAccount, verify, next, skip, startNow, termsAgree, resendCode, wrongCode, phonePlaceholder, passwordPlaceholder }
home: { greeting, searchPlaceholder, newRequest, recentOrders, categories, activeOrder, track, noOrders, locationLabel }
orders: { all, active, completed, cancelled, noOrders, noActiveOrders, noCompletedOrders }
request: { newRequest, delivery, errand, whatDoYouNeed, description, descriptionPlaceholder, category, pickupAddress, dropoffAddress, estimatedPrice, submit, underReview, rejected, rejectedExplanation }
tracking: { tracking, pending, searchingDriver, driverAssigned, inProgress, pickedUp, delivered, confirmDelivery, didNotArrive, cancel, cancelReason, eta, minutes }
chat: { typeMessage, chatClosed, sendImage, noMessages }
profile: { profile, addresses, notifications, helpCenter, language, version, logout, logoutConfirm, trustScore }
common: { loading, error, retry, confirm, cancel, save, delete, yes, no, ok, back, close, empty }
moderation: { safe, review, rejected, pendingReview }

All strings in Arabic (ar) and French (fr). No English in the app.
Show complete file.
```

---

## PROMPT F — Supabase Client

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/CODING_RULES_BACKEND.md (Section 2 — Database Access)
• docs/ARCHITECTURE_GUIDE.md (Section 2 — Why Supabase)
• AGENTS.md

PREVIOUS: shared/types.ts, shared/constants.ts, brand.ts exist.

TASK: Create user-app/lib/supabase.ts

- Import createClient from @supabase/supabase-js
- Read EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
- Configure with AsyncStorage for session persistence (expo-secure-store or @react-native-async-storage/async-storage)
- Export single supabase client instance
- THIS IS THE ONLY FILE that creates a Supabase client — never instantiate elsewhere
- Handle missing env vars with clear error message

Named export. No any. No default export.
Show complete file.
```

---

## PROMPT G — API Layer

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/CODING_RULES_BACKEND.md (Section 2.1 — API Layer, Section 2.2 — Query Patterns)
• docs/ARCHITECTURE_GUIDE.md (Section 4 — Data Flow)
• AGENTS.md

PREVIOUS: shared/types.ts, lib/supabase.ts exist.

TASK: Create user-app/lib/api.ts

Import supabase from ./supabase. Import ALL types from shared/types.ts.

Create these 9 functions — EVERY function: try/catch, return ApiResponse<T>, no any:

1. getActiveOrder(userId: string): ApiResponse<Order>
   → orders where user_id = userId AND status NOT IN terminal states, limit 1

2. getOrderById(orderId: string): ApiResponse<Order>
   → full order with driver (joined: drivers → users), order_items, order_moderation

3. getOrderHistory(userId: string, page: number, pageSize?: number): ApiResponse<Order[]>
   → paginated, descending by created_at, default pageSize 10

4. createOrder(input: CreateOrderInput, userId: string): ApiResponse<Order>
    → INSERT into orders, then trigger moderation workflow, return order with moderation result

5. cancelOrder(orderId: string, reason: string): ApiResponse<void>
   → validate transition, UPDATE status to cancelled, log in order_status_log

6. confirmDelivery(orderId: string): ApiResponse<void>
   → validate transition, UPDATE status to completed

7. submitReview(orderId: string, rating: number, comment?: string): ApiResponse<void>
   → INSERT into reviews

8. sendChatMessage(orderId: string, content: string, senderId: string): ApiResponse<void>
   → INSERT into chat_messages

9. getChatMessages(orderId: string): ApiResponse<ChatMessage[]>
   → SELECT from chat_messages WHERE order_id, ascending by created_at

Use exact Supabase query patterns from CODING_RULES_BACKEND.md Section 2.2.
Show complete file.
```

---

## PROMPT H — Button Component

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md (Section 6 — Component Rules)
• docs/DESIGN_SYSTEM_RULES.md (Section 5.1 — Buttons, Section 6 — Animations)
• AGENTS.md

PREVIOUS: brand.ts, animations.ts exist. Use Google Stitch: "premium mobile button component".

TASK: Create user-app/components/ui/Button.tsx

Props interface (export it):
label: string, onPress: () => void
variant?: 'primary' | 'secondary' | 'ghost' | 'danger' (default: 'primary')
isLoading?: boolean, isDisabled?: boolean
leftIcon?: React.ReactNode, rightIcon?: React.ReactNode
fullWidth?: boolean (default: true)
accessibilityLabel: string (REQUIRED)

Specs:
- 52px height, pill radius (9999), DM Sans SemiBold 16px
- primary: RED bg, white text. secondary: YELLOW bg, TEXT color
- ghost: transparent bg, RED text, 1.5px RED border. danger: ERROR_RED bg, white text
- Press animation: scale(0.97) with SPRING_SNAPPY (react-native-reanimated useSharedValue + useAnimatedStyle)
- Loading: replace label with ActivityIndicator (white for primary/danger, RED for others)
- Disabled: 50% opacity, no press response
- ALL colors from BRAND import. NativeWind classes. Named export.
Show complete file.
```

---

## PROMPT I — Input Component

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 5.2 — Inputs, Section 6 — Animations)
• AGENTS.md

PREVIOUS: brand.ts, animations.ts exist.

TASK: Create user-app/components/ui/Input.tsx

Props (export interface):
label?: string, placeholder: string, value: string, onChangeText: (text: string) => void
type?: 'text' | 'phone' | 'password' | 'otp' | 'number' | 'multiline' (default: 'text')
error?: string, hint?: string
leftIcon?: React.ReactNode, rightIcon?: React.ReactNode
isDisabled?: boolean, accessibilityLabel: string (REQUIRED)

Specs:
- 52px height, 12px radius, INPUT_BG fill
- Focus animation: border transitions from BORDER to RED over 200ms (useSharedValue + interpolateColor)
- Error state: ERROR_RED border + error text below
- Password: toggle eye icon to show/hide
- Phone: numeric keyboard, +212 hint
- OTP: 6 separate boxes, JetBrains Mono 32px, auto-advance on input, auto-submit on 6th digit
- Multiline: expandable, min 4 lines
- All colors from BRAND. NativeWind. Named export.
Show complete file.
```

---

## PROMPT J — Card, Badge, StatusBadge, Avatar

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 5.3-5.4)
• AGENTS.md

PREVIOUS: brand.ts, animations.ts, shared/types.ts exist.

TASK: Create 4 files:

1. user-app/components/ui/Card.tsx
   - Props: children, onPress?, className?. White bg, 16px radius, SHADOW, 16px padding
   - If onPress: Pressable + scale(0.98) spring animation

2. user-app/components/ui/Badge.tsx
   - Props: label, color ('red'|'yellow'|'green'|'gray'|'purple'|'warn'), accessibilityLabel
   - Small pill, micro text (10px SemiBold), colors from BRAND

3. user-app/components/ui/StatusBadge.tsx
   - Props: status (OrderStatus from shared/types.ts), size ('sm'|'md')
   - Map ALL 10 statuses to Arabic labels and colors:
     pending_moderation→WARN/قيد المراجعة, pending_driver→YELLOW/بحث عن سائق,
      driver_assigned→YELLOW/تم التعيين, in_progress→RED/في الطريق,
      picked_up→RED/تم الاستلام, delivered→GREEN/تم التسليم,
      completed→GREEN/مكتمل, cancelled→BORDER+TEXT2/ملغي,
      disputed→ERROR_RED/متنازع عليه, moderation_rejected→ERROR_RED/مرفوض

4. user-app/components/ui/Avatar.tsx
   - Props: uri?, name, size ('sm'|'md'|'lg'), accessibilityLabel
   - sm=32px, md=44px, lg=64px. If uri: Image. If no uri: initials circle

All: BRAND colors, NativeWind, named exports, accessibilityLabel.
Show complete code for all 4.
```

---

## PROMPT K — Loader, EmptyState, BottomSheet, Shimmer

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Sections 5.5, 6)
• AGENTS.md

PREVIOUS: brand.ts, animations.ts, Button.tsx exist.

TASK: Create 4 files:

1. components/ui/Loader.tsx — Props: fullScreen?, message?. RED ActivityIndicator. fullScreen=centered on BG.

2. components/ui/EmptyState.tsx — Props: icon (emoji string), title, subtitle?, actionLabel?, onAction?. Centered layout. Gentle float animation on icon (translateY oscillation). If actionLabel: show Button.

3. components/ui/BottomSheet.tsx — Props: isVisible, onClose, children, title?. Slide up SPRING_GENTLE. Dark overlay 40% black tap-dismiss. White sheet 24px top radius. Drag handle 40×4px. Drag-below-30% dismisses.

4. components/ui/ShimmerPlaceholder.tsx — Props: width, height, radius?. Animated gradient sweep left-to-right loop. Colors: INPUT_BG → BORDER → INPUT_BG.

All: BRAND colors, NativeWind, named exports, react-native-reanimated animations.
Show complete code for all 4.
```

---

## PROMPT L — OrderCard, MapMarker, Animation Components

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 6 — Animations)
• AGENTS.md

PREVIOUS: All previous components exist. shared/types.ts exists.

TASK: Create 6 files:

1. components/ui/OrderCard.tsx — Props: order (Order), onPress, variant ('compact'|'full'). Compact: title + StatusBadge + price (JetBrains Mono) + date. Full: all details + driver. Press scale(0.98).

2. components/ui/MapMarker.tsx — Props: type ('driver'|'pickup'|'dropoff'|'user'), label?. Custom colors: driver=RED, pickup=YELLOW, dropoff=GREEN, user=YELLOW.

3. components/ui/AnimatedTransition.tsx — Wrapper. Props: type ('fade'|'slide-up'|'scale'), children, delay?. Uses presets from animations.ts.

4. components/ui/PulseIndicator.tsx — Props: color, size. Continuous scale pulse 1→1.3→1, looping.

5. components/ui/ProgressTimeline.tsx — Props: steps (string[]), currentStep (number). Horizontal: completed=GREEN check, current=RED pulse, future=gray circle.

6. components/ui/index.ts — Barrel export ALL 15 components.

All: BRAND, NativeWind, named exports, animations from constants/animations.ts.
Show complete code for all 6.
```

---

## PROMPT M — Auth Store & Auth Hook

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md (Sections 4-5)
• docs/CODING_RULES_BACKEND.md (RLS, auth patterns)
• docs/ARCHITECTURE_GUIDE.md (Section 3 — Frontend Architecture)
• AGENTS.md

PREVIOUS: shared/types.ts, lib/supabase.ts, lib/api.ts all exist.

TASK: Create 2 files:

1. user-app/store/authStore.ts
   - Zustand + persist (AsyncStorage). State: user (User|null), isLoading (boolean)
   - Actions: setUser, setLoading, clearUser

2. user-app/hooks/useAuth.ts
   - Uses authStore. Returns typed object.
   - signIn(phone, password): supabase.auth.signInWithPassword → fetch user profile from users table → setUser
   - signUp(phone, fullName, password): supabase.auth.signUp → insert users table row
   - verifyOTP(phone, otp): supabase.auth.verifyOtp
   - signOut(): supabase.auth.signOut → clearUser
   - updateProfile(updates): update users table
   - On init: check supabase.auth.getSession() → restore session
   - Returns: { user, isLoading, isAuthenticated, signIn, signUp, verifyOTP, signOut, updateProfile, error }
   - All errors caught, returned as strings, never thrown

Named exports, no any, typed returns.
Show complete code for both.
```

---

## PROMPT N — Order Store & Order Hook

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md (Sections 4-5)
• docs/CODING_RULES_BACKEND.md (Section 5 — State Machine)
• AGENTS.md

PREVIOUS: shared/types.ts, lib/api.ts, shared/constants.ts (VALID_TRANSITIONS) exist.

TASK: Create 2 files:

1. user-app/store/orderStore.ts
   - Zustand (NO persistence — session only). State: activeOrder (Order|null), isTracking (boolean)
   - Actions: setActiveOrder, clearActiveOrder, setTracking

2. user-app/hooks/useOrder.ts
   - Uses React Query for fetching + mutations. Uses orderStore for active order.
   - Queries: useQuery(['orders', userId]) for history, useQuery(['order', orderId]) for detail
   - createOrder(data): calls api.createOrder, returns moderation result, invalidates cache
   - cancelOrder(orderId, reason): validates transition via VALID_TRANSITIONS, calls api.cancelOrder
   - confirmDelivery(orderId): validates transition, calls api.confirmDelivery
   - submitReview(orderId, rating, comment): calls api.submitReview
   - staleTime: 30_000 for order history
   - Returns: { orders, order, isLoading, error, createOrder, cancelOrder, confirmDelivery, submitReview }

Named exports. Transitions validated. No any.
Show complete code for both.
```

---

## PROMPT O — Tracking, Chat, Location Hooks + Remaining Stores

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/CODING_RULES_BACKEND.md (Section 6 — Real-Time Patterns)
• AGENTS.md

PREVIOUS: lib/supabase.ts, lib/api.ts, shared/types.ts exist.

TASK: Create 5 files:

1. hooks/useTracking.ts — Subscribe to: order:{orderId} (UPDATE) + driver_location:{driverId} (INSERT). Calculate ETA = distance/25kmh. Clean up on unmount. Returns: { driverLocation, orderStatus, etaMinutes, isConnected }

2. hooks/useChat.ts — Load initial via React Query getChatMessages. Subscribe to chat:{orderId} (INSERT). sendMessage(content, type). Returns: { messages, isLoading, sendMessage, isSending }

3. hooks/useLocation.ts — expo-location. requestPermission(). getCurrentPositionAsync(). Returns: { coords, error, requestPermission, isLoading }

4. store/cartStore.ts — Zustand + persist. items: CartItem[], store_id?. Actions: addItem, removeItem, updateQuantity, clearCart. Computed total().

5. store/locationStore.ts — Zustand (no persist). coords: {lat,lng}|null, lastUpdated. Actions: setCoords, clearCoords.

ALL Realtime subscriptions MUST have useEffect cleanup (supabase.removeChannel).
Named exports. No any.
Show complete code for all 5.
```

---

## PROMPT P — Auth Layout, Splash, Onboarding

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Sections 2, 5, 6)
• docs/FOLDER_STRUCTURE.md • AGENTS.md
Use Google Stitch: "premium mobile splash screen", "onboarding carousel animation"

PREVIOUS: ALL components (A-L), hooks (M-O), stores exist.

TASK: Create 3 files:

1. app/(auth)/_layout.tsx — Stack navigator. No header. BG background.

2. app/(auth)/splash.tsx — Full screen YELLOW gradient (YELLOW→YELLOW_LIGHT). Logo centered, scale 0→1 spring 800ms. Tagline fade-in 200ms delay. Check useAuth().isAuthenticated. If yes: router.replace('/(tabs)/'). If no: wait 2s then router.replace('/(auth)/onboarding'). RED ActivityIndicator at bottom.

3. app/(auth)/onboarding.tsx — 3-slide horizontal FlatList. Each slide: Lottie animation ref + Arabic title + Arabic subtitle. Dot indicators: active=RED, inactive=BORDER. "التالي" Button advances. Last slide: "ابدأ الآن" → router.push('/(auth)/login'). "تخطى" link top-right. Spring transitions.

Default exports (screen files only). All BRAND colors. accessibilityLabel on all Pressables.
Show complete code for all 3.
```

---

## PROMPT Q — Login & Register Screens

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md
Use Google Stitch: "premium mobile login form", "register screen premium"

PREVIOUS: All components, useAuth hook, strings.ts exist.

TASK: Create 2 files:

1. app/(auth)/login.tsx
   - Header: back chevron + "تسجيل الدخول" centered
   - Phone Input (type="phone"), Password Input (type="password" with eye toggle)
   - "نسيت كلمة المرور؟" link right-aligned TEXT2
   - "دخول" primary Button full-width, shows loading during signIn
   - Divider "أو" with lines
   - "إنشاء حساب جديد" ghost Button → router.push('/(auth)/register')
   - Validate: phone not empty, password ≥ 8 chars
   - KeyboardAvoidingView. Animated input focus.
   - On success: router.replace('/(tabs)/')

2. app/(auth)/register.tsx
   - Header: back chevron + "إنشاء حساب" centered
   - Full Name, Phone, Password, Confirm Password Inputs
   - Terms checkbox (must be checked to enable button)
   - "إنشاء الحساب" primary Button
   - Validate: all fields filled, passwords match, phone +212XXXXXXXXX format
   - On success: router.push({ pathname: '/(auth)/otp', params: { phone } })
   - Field-level inline error display in ERROR_RED

Default exports. BRAND colors. accessibilityLabel everywhere.
Show complete code for both.
```

---

## PROMPT R — OTP Screen

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 6 — Animations)
• AGENTS.md
Use Google Stitch: "OTP verification screen premium animation"

PREVIOUS: useAuth hook, Input component (OTP type), Button exist.

TASK: Create app/(auth)/otp.tsx

- Receive phone param via useLocalSearchParams
- Lock icon (64px) with scale entrance animation (0→1 spring)
- "تحقق من رقمك" title 22px bold
- Masked phone: show only first 4 and last 2 digits
- 6 OTP boxes: Input type="otp" variant OR custom 6-box implementation
  - JetBrains Mono 32px, auto-advance between boxes, auto-submit on 6th digit
- 90-second countdown timer: shows "إعادة إرسال الرمز بعد {seconds} ثانية"
  - After countdown: "إعادة إرسال الرمز" pressable link in RED
- Error: shake animation on all boxes + "رمز غير صحيح" text in ERROR_RED
- On success: router.replace('/(tabs)/')
- Stagger animation on 6 boxes appearing (50ms delay each)

Default export. BRAND colors. accessibilityLabel.
Show complete file.
```

---

## PROMPT S — Tab Layout & Home Screen

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Sections 5.6, 6)
• AGENTS.md
Use Google Stitch: "premium delivery app home screen", "bottom navigation modern"

PREVIOUS: All components, hooks, stores exist.

TASK: Create 2 files:

1. app/(tabs)/_layout.tsx
   - 5 tabs: الرئيسية (home), البحث (search), طلباتي (receipt), الرسائل (message-circle), حسابي (user)
   - 64px + safe area, SURFACE bg, 1px BORDER top
   - Active: RED icon + label. Inactive: TEXT3 icon only
   - Tab switch: cross-fade. Small RED dot above active icon.

2. app/(tabs)/index.tsx (Home)
   - Yellow gradient header: logo left 80px + notification bell right with badge count
   - Location chip: "📍 سافي، المغرب"
   - Active order banner (conditional): YELLOW_LIGHT bg, StatusBadge, "تتبع" link → tracking
   - Search bar: PRESSABLE (not input), 52px INPUT_BG → navigates to search tab
   - Category pills: horizontal ScrollView (طعام|بقالة|صيدلية|أخرى), selected=RED, unselected=SURFACE
   - "طلب جديد" primary Button full-width → router.push('/(flows)/custom-request')
   - "آخر طلباتك" section: 3 OrderCard compact with stagger animation, or EmptyState
   - Loading: 3 ShimmerPlaceholder cards

Default exports. BRAND colors. accessibilityLabel.
Show complete code for both.
```

---

## PROMPT T — Orders, Chat List, Profile Tabs

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md

PREVIOUS: All components, useOrder, useChat, useAuth hooks exist.

TASK: Create 3 files:

1. app/(tabs)/orders.tsx
   - Horizontal filter tabs: الكل | نشط | مكتمل | ملغي — RED underline on selected
   - FlatList of OrderCard compact. Pull-to-refresh (RED tint). keyExtractor={item.id}
   - Per-filter EmptyState. Loading: ShimmerPlaceholder × 4. Error: EmptyState with retry.

2. app/(tabs)/chat.tsx
   - FlatList of conversation rows
   - Row: Avatar(sm) + driver name + last message preview + timestamp + unread count Badge
   - Tap → router.push(`/(flows)/chat/${orderId}`)
   - Empty: EmptyState icon="💬" title="لا توجد محادثات"

3. app/(tabs)/profile.tsx
   - Avatar(lg) + full name + phone + trust score progress bar (GREEN fill)
   - Settings rows with chevron: العناوين, الإشعارات (toggle), مركز المساعدة, اللغة, الإصدار
   - Logout button: ghost variant, ERROR_RED text, confirm Alert before executing signOut
   - On logout success: router.replace('/(auth)/splash')

4. app/(tabs)/search.tsx (simple stub)
   - Input autofocus + cancel button. Results placeholder. EmptyState for no results.

Default exports. BRAND colors. Handle loading/error/empty states on EVERY screen.
Show complete code for all 4.
```

---

## PROMPT U — Custom Request Screen

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/CODING_RULES_BACKEND.md (Section 4 — Edge Functions — moderation pipeline)
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md
Use Google Stitch: "order creation form premium mobile"

PREVIOUS: useOrder hook, all components exist.

TASK: Create app/(flows)/custom-request.tsx

- Header: back chevron + "طلب جديد"
- Order type: 2 Card selectors — "توصيل" (delivery) and "مهمة" (errand), selected has RED border
- Title Input: "ماذا تريد؟", required, max 200 chars
- Description Input: multiline 4 lines, optional, max 500 chars
- Category pills: طعام | بقالة | صيدلية | أخرى
- Pickup address Input with map-pin icon (optional for errands, required for delivery)
- Dropoff address Input with map-pin icon (REQUIRED)
- Estimated price Input (JetBrains Mono, optional)
- "إرسال الطلب" primary Button

After submit — handle 3 moderation outcomes:
1. approved → router.replace({ pathname:'/(flows)/confirmation', params:{orderId} })
2. manual_review → BottomSheet "طلبك قيد المراجعة، سنخبرك خلال دقائق" + subscribe to order realtime for status change
3. rejected → inline Card with ERROR_RED border showing explanation from moderation

KeyboardAvoidingView. ScrollView. Validate required fields. Loading state on submit.
Show complete file.
```

---

## PROMPT V — Confirmation Screen

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md (Section 6 — Animations)
• AGENTS.md
Use Google Stitch: "order confirmation success animation mobile"

PREVIOUS: All components exist.

TASK: Create app/(flows)/confirmation.tsx

- Receive orderId via useLocalSearchParams. Fetch order via useOrder.
- Animated green checkmark (Lottie success-checkmark.json reference, or animated View with scale 0→1 SPRING_BOUNCY)
- "تم إرسال طلبك!" title 24px bold, fade-in
- Order ref: "#JHZ-{first 8 chars of orderId}" in JetBrains Mono 18px TEXT2
- Price: "{estimated_price} MAD" JetBrains Mono RED 28px with count-up animation (0 → final value)
- Info row: clock icon + "سيتم تعيين سائق خلال دقائق" TEXT2
- "تتبع طلبك" primary Button → router.push(`/(flows)/tracking/${orderId}`)
- "العودة للرئيسية" ghost Button → router.replace('/(tabs)/')
- Use router.replace to get here (no back to form)
- BG background. Centered content.

Default export. BRAND colors. accessibilityLabel.
Show complete file.
```

---

## PROMPT W — Live Tracking Screen

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/CODING_RULES_BACKEND.md (Section 6 — Real-Time)
• docs/DESIGN_SYSTEM_RULES.md (Section 6 — Animations)
• AGENTS.md
Use Google Stitch: "live delivery tracking map mobile premium"

PREVIOUS: useTracking, useOrder hooks, MapMarker, ProgressTimeline, BottomSheet, PulseIndicator exist.

TASK: Create app/(flows)/tracking/[id].tsx

- Receive id via useLocalSearchParams. Use useTracking(id) + useOrder(id).
- Full screen MapView (react-native-maps)
- MapMarker: driver=RED, pickup=YELLOW, dropoff=GREEN
- Driver marker animates position smoothly (interpolate lat/lng over 1s)
- Bottom BottomSheet fixed at ~35% height, content per status:
  • pending_moderation: Loader + "جاري معالجة طلبك..."
  • pending_driver: PulseIndicator + "نبحث عن سائق..." + searching animation
  • driver_assigned: driver Avatar+name+vehicle + ETA + phone icon + ProgressTimeline
  • in_progress: "في الطريق" + ETA countdown + ProgressTimeline
  • picked_up: "تم الاستلام" + ETA + ProgressTimeline
  • delivered: "هل استلمت طلبك؟" + "نعم، استلمته" Button + "لم يصل" ghost
  • completed: GREEN check + star rating (1-5 stars pressable) + comment Input + submit
  • cancelled: ERROR_RED icon + reason + "طلب جديد" Button
- Cancel button only in [pending_driver, driver_assigned] — confirm Alert before cancelling
- ProgressTimeline steps: ["التحقق","السائق","في الطريق","الاستلام","التسليم"]

Default export. All BRAND colors. accessibilityLabel. Cleanup Realtime on unmount.
Show complete file.
```

---

## PROMPT X — Chat Screen

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/CODING_RULES_BACKEND.md (Section 6 — Real-Time)
• docs/DESIGN_SYSTEM_RULES.md • AGENTS.md
Use Google Stitch: "premium mobile chat interface messaging"

PREVIOUS: useChat hook, Avatar, Input, Button exist.

TASK: Create app/(flows)/chat/[id].tsx

- Receive id (orderId) via useLocalSearchParams. Use useChat(id).
- Header: driver name + PulseIndicator (green=online) + phone-call icon pressable
- FlatList inverted (newest at bottom). keyExtractor={item.id}
- User messages: right-aligned, RED bg, white text, rounded-2xl (no bottom-right radius)
- Driver messages: left-aligned, SURFACE bg border BORDER, TEXT color, rounded-2xl (no bottom-left radius)
- System messages: centered, gray bg, small italic TEXT2
- Timestamps below each message cluster in TEXT3 caption size
- New message animation: slide-up + fade from AnimatedTransition
- Input bar at bottom: TextInput expanding + RED circle send button (arrow icon) + image-picker icon
- KeyboardAvoidingView wrapping entire screen
- Disabled state when order in terminal status: gray banner "تم إغلاق هذه المحادثة"
- Send button disabled when input empty

Default export. BRAND colors. accessibilityLabel. Realtime cleanup on unmount.
Show complete file.
```

---

## PROMPT Y — Root Layout & App Entry

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • docs/FOLDER_STRUCTURE.md • AGENTS.md

PREVIOUS: All screens, hooks, components, stores exist.

TASK: Create/update app/_layout.tsx (Root Layout)

  Load DMSans and JetBrainsMono fonts from @expo-google-fonts or assets/fonts/ directory. Handle fallback to system fonts if assets are missing.
- Show splash screen (SplashScreen.preventAutoHideAsync) until fonts loaded
- Wrap app in React Query provider (QueryClientProvider with new QueryClient)
- Export default Stack navigator with screenOptions: headerShown false, BG background
- Handle font loading error gracefully
- StatusBar: dark-content style

Default export. Named font mapping matches FONTS constants from brand.ts.
Show complete file.
```

---

## PROMPT Z — Stub Screens & Final Barrel

```
MANDATORY CONTEXT — Read and obey:
• docs/MASTER_INSTRUCTIONS.md • docs/CODING_RULES_FRONTEND.md
• docs/DESIGN_SYSTEM_RULES.md • docs/FOLDER_STRUCTURE.md • AGENTS.md

PREVIOUS: All core screens done.

TASK: Create stub screens + final connections:

1. app/(flows)/store/[id].tsx — Stub: Header "تفاصيل المتجر" + EmptyState "قريباً" message

2. app/(flows)/cart.tsx — Stub: Header "السلة" + EmptyState "السلة فارغة"

3. app/(flows)/checkout.tsx — Stub: Header "الدفع" + EmptyState "قريباً"

4. hooks/useAnimations.ts — Export preset helper functions:
   usePressAnimation() → returns { animatedStyle, handlePressIn, handlePressOut }
   useStaggerAnimation(index) → returns entering animation with delay
   useFadeIn(delay?) → returns entering animation

All stubs: BG background, back chevron, proper header, EmptyState with relevant icon.
Default exports for screens. Named exports for hook.
Show complete code for all 4 files.
```

---

## AFTER ALL PROMPTS

Once Prompts A through Z are complete, run this final verification:

```
MANDATORY CONTEXT — Read and obey:
• docs/REVIEW_CHECKLIST.md (all 116 items)
• docs/MASTER_INSTRUCTIONS.md • AGENTS.md

TASK: Final Frontend Review

Verify EVERY file in user-app/ against these criteria:
1. No hardcoded hex colors outside brand.ts
2. No 'any' type anywhere
3. No unnecessary inline styles (style={{...}}) — only dynamic/animated values
4. Every Pressable has accessibilityLabel
5. Every screen handles loading, error, AND empty states
6. All hooks clean up Realtime subscriptions
7. All status transitions use VALID_TRANSITIONS validation
8. All components use NativeWind classes
9. Barrel export includes all 15 components
10. No business logic in any component file

List any violations with exact file:line.
Then verify these user journeys work end-to-end:
• Journey 1: splash → onboarding → register → OTP → home
• Journey 2: home → custom request → approved → confirmation → tracking
• Journey 3: home → custom request → rejected → error display → back to home

Report gaps.
```
