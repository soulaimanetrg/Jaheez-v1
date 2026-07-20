# JAHEEZ — AI Prompt Sequence
# These are the exact prompts you paste to the AI, in order.
# Each prompt builds on the previous one.
# Always paste JAHEEZ_AGENTS.md into context FIRST before any prompt below.

---

## HOW TO USE THIS FILE

1. Start every new session by saying:
   "Read this file completely before doing anything:
   [paste full content of JAHEEZ_AGENTS.md]"

2. Then use the prompts below in order, one at a time.

3. After each prompt, review the output before moving to the next.

4. If the AI drifts from the rules, say:
   "You violated a rule from the AGENTS file. Re-read section [X] and fix it."

---

## PHASE 0 — FOUNDATION
# Do ALL of these before building any screen.

---

### PROMPT 0-A — Project Setup

```
You have read JAHEEZ_AGENTS.md. Now execute Phase 0 Step 1.

Create the following foundation files. No screens yet.

FILES TO CREATE:

1. shared/types.ts
   Paste the complete TypeScript interfaces from Section 5 of the AGENTS file.
   Every interface, every type alias, exactly as specified.

2. shared/constants.ts
   Export these enums:
   - ORDER_STATUSES: array of all OrderStatus values in lifecycle order
   - VEHICLE_TYPES: array of VehicleType values
   - CATEGORIES: array of strings ['food','grocery','pharmacy','custom_errand']
   - ZONES: array of Safi zones ['safi_centre','safi_nord','safi_sud','safi_est']
   - RISK_THRESHOLDS: { AUTO_APPROVE: 30, MANUAL_REVIEW: 69, AUTO_REJECT: 70 }

3. constants/brand.ts (for user-app AND driver-app — same content)
   Paste the complete BRAND object from Section 2 of the AGENTS file.
   Add at the bottom:
   export const FONTS = {
     DISPLAY: 'DMSans-Bold',
     BODY: 'DMSans-Regular',
     SEMIBOLD: 'DMSans-SemiBold',
     MONO: 'JetBrainsMono-Regular',
     MONO_BOLD: 'JetBrainsMono-Bold',
   } as const;

4. user-app/lib/supabase.ts
   Create the Supabase client singleton.
   Use createClient from '@supabase/supabase-js'.
   Import URL and anon key from environment variables:
   EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
   Export a single `supabase` instance.
   Also export a typed Database type placeholder (empty for now, to be filled).

5. user-app/lib/api.ts
   Create all Supabase query functions from Section 14 of the AGENTS file.
   Each function must:
   - Accept typed parameters (no `any`)
   - Return ApiResponse<T> wrapper
   - Handle errors and return { data: null, error: message } on failure
   Functions to create:
   - getActiveOrder(userId: string): Promise<ApiResponse<Order>>
   - getOrderById(orderId: string): Promise<ApiResponse<Order>>
   - getOrderHistory(userId: string, page: number): Promise<ApiResponse<Order[]>>
   - createOrder(input: CreateOrderInput, userId: string): Promise<ApiResponse<Order>>
   - cancelOrder(orderId: string, reason: string): Promise<ApiResponse<void>>
   - confirmDelivery(orderId: string): Promise<ApiResponse<void>>
   - submitReview(orderId: string, rating: number, comment?: string): Promise<ApiResponse<void>>
   - sendChatMessage(orderId: string, content: string, senderId: string): Promise<ApiResponse<void>>
   - getChatMessages(orderId: string): Promise<ApiResponse<ChatMessage[]>>
   Also add to shared/types.ts if not already there:
   export interface CreateOrderInput { ... all fields from the orders insert in Section 14 }

Show all 5 files with complete code.
```

---

### PROMPT 0-B — UI Components

```
Foundation files are created. Now build all UI components.
You have read JAHEEZ_AGENTS.md. Follow Section 10 exactly.

Create these files in user-app/components/ui/:

1. Button.tsx — follow the ButtonProps interface from Section 10 exactly.
   Variants: primary (RED), secondary (YELLOW), ghost (outlined RED), danger (ERROR_RED).
   Use NativeWind classes. Import BRAND from constants/brand.ts for any values
   that cannot be expressed as static Tailwind classes.
   Show loading spinner when isLoading=true, disable press.

2. Input.tsx — follow the InputProps interface from Section 10 exactly.
   OTP type: large centered digits, JetBrains Mono font, 4-6 boxes side by side.
   Show error text below in ERROR_RED when error prop is set.
   Red border on focus, red border when error.

3. Card.tsx — white bg, 16px radius, shadow, 16px padding.
   If onPress provided: make it Pressable with subtle scale(0.98) on press.

4. Badge.tsx
   Props: { label: string, color: 'red' | 'yellow' | 'green' | 'gray' | 'purple' | 'warn' }
   Small pill shape, 10px text, correct bg+text color from BRAND tokens.

5. StatusBadge.tsx — follow spec from Section 10 exactly.
   Map every OrderStatus to correct label (Arabic) and color.

6. Avatar.tsx
   Props: { uri?: string, name: string, size?: 'sm' | 'md' | 'lg' }
   If uri: show image. If no uri: show initials circle.
   sm=32px, md=44px, lg=64px.

7. Loader.tsx
   Props: { fullScreen?: boolean, message?: string }
   fullScreen: centered in screen with BRAND.BG background.
   Inline: just the spinner. Color: BRAND.RED.

8. EmptyState.tsx — follow spec from Section 10 exactly.

9. BottomSheet.tsx
   Props: { isVisible: boolean, onClose: () => void, children: ReactNode, title?: string }
   Slide up from bottom, dark overlay behind, white sheet, rounded top corners.
   Drag handle bar at top. Close on overlay tap or drag down.

10. OrderCard.tsx — follow spec from Section 10.
    compact: single row — title + StatusBadge + price (JetBrains Mono) + date.
    full: title, StatusBadge, pickup/dropoff addresses, driver info if assigned,
    price, action buttons.

11. MapMarker.tsx
    Props: { type: 'driver' | 'pickup' | 'dropoff' | 'user', label?: string }
    Custom marker for react-native-maps.
    driver: RED circle with scooter icon.
    pickup: YELLOW circle with pin icon.
    dropoff: GREEN circle with flag icon.

12. RiskBadge.tsx (for admin panel)
    Props: { score: number }
    0-30: green "آمن". 31-69: WARN "مراجعة". 70-100: ERROR_RED "خطر".
    Shows score number inside the badge.

After creating all 12 components, create an index.ts barrel export file:
user-app/components/ui/index.ts — export all 12 components.

Show all files with complete code.
```

---

### PROMPT 0-C — Hooks

```
UI components are built. Now build all hooks.
You have read JAHEEZ_AGENTS.md. Follow Section 11 exactly.

Create these files in user-app/hooks/:

1. useAuth.ts
   Follow the interface from Section 11 exactly.
   Use Zustand authStore for state persistence.
   signIn: call supabase.auth.signInWithPassword, then fetch user profile from users table.
   signUp: call Supabase Auth, then create user row in users table.
   verifyOTP: call supabase.auth.verifyOtp.
   signOut: call supabase.auth.signOut, clear Zustand store.
   On init: check supabase.auth.getSession() to restore session.

2. useOrder.ts
   Follow the interface from Section 11 exactly.
   Use React Query (useQuery, useMutation) for all server calls.
   createOrder: calls api.createOrder then api (ai-analyze Edge Function).
   After createOrder: poll order status every 3 seconds while status='pending_moderation'.
   Stop polling when status changes to pending_driver, moderation_rejected, or manual_review.
   Return isWaitingModeration: boolean separately.

3. useTracking.ts
   Follow the interface from Section 11 exactly.
   Subscribe to Supabase Realtime channels from Section 8.
   Unsubscribe on unmount (useEffect cleanup).
   Calculate ETA from driver distance and average speed assumption (25 km/h in city).
   Return isConnected: true when Realtime channel is active.

4. useChat.ts
   Follow the interface from Section 11 exactly.
   Load initial messages with React Query (getChatMessages).
   Subscribe to new messages with Supabase Realtime (Section 8).
   uploadImage: upload to Supabase Storage bucket 'chat-images', return public URL.

5. useLocation.ts
   Props: none for user (gets their own location). driverId for driver app.
   Returns: { coords: { lat, lng } | null, error: string | null, requestPermission: () => void }
   For driver app: also exposes startTracking() and stopTracking().
   startTracking: uses expo-location watchPositionAsync, updates driver_locations table every 5s.

Create these Zustand stores in user-app/store/:

6. authStore.ts
   State: { user: User | null, isLoading: boolean }
   Actions: { setUser, setLoading, clearUser }
   Persist with AsyncStorage (zustand/middleware/persist).

7. cartStore.ts
   State: { items: CartItem[], store_id?: string }
   Actions from CartState interface in shared/types.ts.
   total(): sum of (item.unit_price * item.quantity) for all items.
   Persist with AsyncStorage.

8. orderStore.ts
   State: { activeOrder: Order | null, isTracking: boolean }
   Actions: { setActiveOrder, clearActiveOrder, setTracking }
   No persistence (session-only).

Show all 8 files with complete code.
```

---

## PHASE 1 — USER AUTH SCREENS

---

### PROMPT 1-A — Splash + Onboarding

```
Foundation complete. Starting Phase 1: Auth screens.
AGENTS file is in context.

Create user-app/app/(auth)/_layout.tsx first:
- Stack navigator with no header
- BG (#FEFCE8) background
- Screens: splash, onboarding, login, register, otp

Then create:

1. user-app/app/(auth)/splash.tsx
   - Full screen, BG color background
   - Center: JAHEEZ logo (use an Image component, source: assets/images/logo.png)
   - Below logo: tagline "Smart Delivery & Errands" in BRAND.TEXT2, DM Sans
   - No user interaction needed
   - On mount: check useAuth().isAuthenticated
     - If authenticated: router.replace('/(tabs)/')
     - If not: wait 2 seconds then router.replace('/(auth)/onboarding')
   - Use ActivityIndicator (RED) at bottom while checking

2. user-app/app/(auth)/onboarding.tsx
   - 3-slide FlatList (horizontal paginated)
   - Each slide fills the screen:
     Slide 1: Illustration placeholder (140x140 yellow rounded square) +
       "طلب أي شيء" title + "توصيل سريع وآمن في سافي" subtitle
     Slide 2: Illustration + "سائقون موثوقون" + "نتحقق من كل سائق بعناية"
     Slide 3: Illustration + "تتبع طلبك مباشرة" + "اعرف مكان سائقك في كل لحظة"
   - Dot indicators at bottom (active: RED, inactive: BORDER)
   - "التالي" Button (primary, full width) advances to next slide
   - On last slide: "ابدأ الآن" Button → router.push('/(auth)/login')
   - Skip link top right: "تخطى" → router.push('/(auth)/login')
   - BRAND.BG background throughout

Show complete code for _layout.tsx, splash.tsx, onboarding.tsx.
```

---

### PROMPT 1-B — Login + Register

```
Splash and onboarding done. Now auth forms.

1. user-app/app/(auth)/login.tsx
   Header: Back arrow + "تسجيل الدخول" title centered
   Form (use Input component from components/ui/):
   - Phone Input: label "رقم الهاتف", placeholder "+212612345678"
     type="phone", keyboardType numeric, leftIcon phone icon
   - Password Input: label "كلمة المرور", type="password",
     rightIcon eye toggle (show/hide password)
   - "نسيت كلمة المرور؟" link (gray, small, right-aligned)
   - Login Button: "دخول", primary, full width, isLoading from useAuth
   - Divider: "أو" with lines on both sides
   - "إنشاء حساب جديد" Button: ghost variant, full width
     → router.push('/(auth)/register')
   
   Logic:
   - Validate: phone not empty, password >= 8 chars
   - Call useAuth().signIn(phone, password)
   - On success: router.replace('/(tabs)/')
   - On error: show error text in ERROR_RED below the form
   - Keyboard avoiding behavior (KeyboardAvoidingView)

2. user-app/app/(auth)/register.tsx
   Header: Back arrow + "إنشاء حساب" title centered
   Form:
   - Full Name Input: label "الاسم الكامل", required
   - Phone Input: label "رقم الهاتف", placeholder "+212612345678", required
   - Password Input: label "كلمة المرور", type="password",
     hint "8 أحرف على الأقل"
   - Confirm Password Input: type="password"
   - Terms checkbox: "أوافق على شروط الاستخدام" (required to enable button)
   - Register Button: "إنشاء الحساب", primary, full width
   - "لديك حساب؟ تسجيل الدخول" link → router.back()

   Logic:
   - Validate: all fields, passwords match, phone format +212XXXXXXXXX
   - Call useAuth().signUp(phone, fullName, password)
   - On success: router.push('/(auth)/otp') passing verificationId
   - On error: show field-level errors

Show complete code for login.tsx and register.tsx.
```

---

### PROMPT 1-C — OTP Screen

```
Login and register done. Now OTP verification.

Create user-app/app/(auth)/otp.tsx

This screen receives { verificationId: string, phone: string } via router params.

Layout:
- Header: back arrow
- Top section (center):
  - Lock icon or phone icon (large, RED color, 64px)
  - "تحقق من رقمك" title, 22px, bold
  - "أرسلنا رمزاً إلى {phone}" subtitle, BRAND.TEXT2
    (mask phone: show only last 4 digits: +212 6** *** **78)
- OTP Input: use Input component with type="otp"
  6 boxes, JetBrains Mono, large digits (32px)
  Auto-advance to next box on digit entry
  Auto-submit when 6th digit is entered
- "لم تستلم الرمز؟" + countdown timer "إعادة الإرسال بعد 01:23"
  After countdown: tappable "إعادة إرسال الرمز" link (RED)
- Confirm Button: "تأكيد", primary, full width (show only if auto-submit fails)

Logic:
- 90 second countdown timer using setInterval
- Auto-submit: when all 6 digits entered, call useAuth().verifyOTP(verificationId, otp)
- On success: router.replace('/(tabs)/')
- On error: clear OTP boxes, show "رمز غير صحيح" error, shake animation on boxes
- Resend: call signUp again with same phone, reset countdown

Show complete code for otp.tsx.
```

---

## PHASE 2 — USER APP CORE

---

### PROMPT 2-A — Bottom Navigation + Home Screen

```
Auth screens done. Starting Phase 2: Core user app screens.

1. Create user-app/app/(tabs)/_layout.tsx
   Bottom tab navigator with 5 tabs:
   Tab 1: "الرئيسية" (home icon) → index.tsx
   Tab 2: "البحث" (search icon) → search.tsx
   Tab 3: "طلباتي" (receipt icon) → orders.tsx
   Tab 4: "الرسائل" (chat bubble icon) → chat.tsx
   Tab 5: "حسابي" (person icon) → profile.tsx
   
   Style:
   - Bar height: 64px + safe area bottom inset
   - Background: SURFACE (#FFFFFF)
   - Top border: 1px BRAND.BORDER
   - Active: BRAND.RED icon + RED label
   - Inactive: BRAND.TEXT3 icon, no label shown
   - Active indicator: small RED dot above icon (not underline)

2. Create user-app/app/(tabs)/index.tsx (Home Screen)
   
   Follow the Home Screen specification from Section 13 of AGENTS.
   
   Layout (ScrollView, BG background):
   
   A. Header (YELLOW #F2C94C background, not white):
      - Left: JAHEEZ wordmark (Image, assets/images/logo.png, 80px wide)
      - Right: notification bell IconButton
        Show a red dot badge on bell if user has unread notifications
      - Below header row: location chip "📍 سافي، المغرب" 
        (small, SURFACE bg, BORDER border, TEXT2 text)
   
   B. Active order banner (show only if user has active order from useOrder):
      Full width card, YELLOW_LIGHT bg, YELLOW_DARK border left 4px:
      Row: status icon + order title (truncated) + StatusBadge + "تتبع ←" RED link
      Tap entire banner: router.push('/(flows)/tracking/' + order.id)
   
   C. Search bar (Pressable, not real input — navigates to search screen):
      Height 52px, INPUT_BG, 12px radius, search icon left, "ابحث عن أي شيء..." placeholder gray
      Tap: router.push('/(tabs)/search')
   
   D. Category pills (horizontal ScrollView, no scrollbar):
      Pills: "الكل" | "طعام" | "بقالة" | "صيدلية" | "مهام" | "أخرى"
      Selected: RED bg, white text. Unselected: SURFACE bg, TEXT2, BORDER.
      Tapping filters the sections below.
   
   E. "طلب جديد" Button: primary, full width, 52px, pill:
      → router.push('/(flows)/custom-request')
   
   F. "آخر طلباتك" section header + "الكل" link:
      - 3 OrderCard (compact variant) from useOrder().orders (last 3)
      - If no orders: EmptyState icon="📦" title="لا توجد طلبات بعد"
        subtitle="اضغط على طلب جديد لتبدأ" actionLabel="طلب جديد"
      - If loading: 3 Loader skeleton placeholders (gray animated rectangles)

Show complete code for _layout.tsx and index.tsx.
```

---

### PROMPT 2-B — Order History Screen

```
Home screen done. Now order history.

Create user-app/app/(tabs)/orders.tsx

Header: "طلباتي" title, no back arrow (tab screen)

Filter tabs (horizontal, custom — not TabBar):
"الكل" | "نشط" | "مكتمل" | "ملغي"
Selected tab: RED underline 2px, RED text bold. Unselected: TEXT2.
Store selected filter in useState.

Body (FlatList):
Each item: OrderCard component (compact variant)
Show: title, StatusBadge, price (JetBrains Mono), formatted date
Filter orders by selectedFilter:
- "نشط": statuses in [pending_moderation, pending_driver, driver_assigned, in_progress, picked_up, delivered]
- "مكتمل": status = completed
- "ملغي": statuses in [cancelled, moderation_rejected]

Tap card: router.push('/(flows)/tracking/' + order.id)

Pull to refresh: RefreshControl, RED tint

Empty state per filter:
"الكل" empty: EmptyState icon="📋" title="لا توجد طلبات"
"نشط" empty: EmptyState icon="🔄" title="لا توجد طلبات نشطة"
"مكتمل" empty: EmptyState icon="✅" title="لا توجد طلبات مكتملة"

Loading: 4 skeleton cards (gray animated placeholders)

Data: useOrder().orders with React Query
When refetching: show RefreshControl spinner, not full screen loader

Show complete code.
```

---

### PROMPT 2-C — Profile Screen

```
Order history done. Now profile.

Create user-app/app/(tabs)/profile.tsx

Header: "حسابي" title, no back arrow

Top section (Card component):
- Avatar component (lg size, 64px) left
- Name (bold, 18px) + phone (TEXT2, 14px) right
- Trust score bar:
  Label: "مستوى الثقة" (12px gray) + score number right (12px, colored)
  Progress bar: 0-100, color:
    70-100: GREEN, 40-69: WARN, 0-39: ERROR_RED
  Below bar: tiny note "كلما زاد الرقم كلما أسرع معالجة طلباتك"
- "تعديل الملف الشخصي" link → stub screen

Settings sections (list rows, each with icon + label + chevron):

Section "حسابي":
- شخصي: الاسم والهاتف والصورة
- العناوين المحفوظة: (stub)
- الإشعارات: toggle switch

Section "الدعم":
- مركز المساعدة (external link stub)
- الإبلاغ عن مشكلة (stub)
- شروط الاستخدام (stub)
- سياسة الخصوصية (stub)

Section "التطبيق":
- اللغة: "العربية" with chevron → language selector bottom sheet
  Options: العربية | Français — tap changes locale
- الإصدار: "1.0.0" (no chevron, grayed)

Logout button (at bottom):
- ghost variant, full width, ERROR_RED color
- "تسجيل الخروج"
- On press: confirm dialog → useAuth().signOut() → router.replace('/(auth)/splash')

Show complete code.
```

---

## PHASE 3 — ORDER FLOW SCREENS

---

### PROMPT 3-A — Custom Request Screen

```
Tab screens done. Now the main order creation flow.
AGENTS Section 13 has the full spec for this screen.

Create user-app/app/(flows)/custom-request.tsx

Follow Section 13 "Custom Request Screen" exactly.
Also follow the createOrder flow from Section 14:
- Insert order → call ai-analyze Edge Function → poll for result

Additional details:

Order Type selector (first thing on screen):
Two cards side by side (equal width):
Card "توصيل" (Delivery): truck icon, "توصيل منتج أو طرد"
Card "مهمة" (Errand): list icon, "أي مهمة أخرى"
Selected card: YELLOW_LIGHT bg, RED border 2px, RED icon
Unselected: SURFACE bg, BORDER

Moderation states after submit:
State 1 — Analyzing (while waiting for ai-analyze result):
  Replace submit button with Loader + "جاري التحقق من طلبك..." gray text
  Do not show any error yet.

State 2 — Manual review needed (decision = manual_review):
  Show a BottomSheet (not full page):
  Icon: ⏳ + "طلبك قيد المراجعة" title
  Body: "سيراجع فريقنا طلبك ويرد خلال 5 دقائق."
  Subscribe to order realtime channel (Section 8)
  When status changes to pending_driver: dismiss sheet, go to confirmation
  When status changes to moderation_rejected: dismiss sheet, show error

State 3 — Auto-rejected (decision = auto_reject):
  Show error inline (not bottom sheet):
  ERROR_RED card: "عذراً، لا يمكننا معالجة هذا الطلب."
  "يبدو أن طلبك يخالف شروط الاستخدام."
  Clear form button.

State 4 — Approved:
  router.push('/(flows)/confirmation') passing orderId

Show complete code.
```

---

### PROMPT 3-B — Tracking Screen

```
Order creation done. Now the tracking screen.
AGENTS Section 13 has the spec for this screen.

Create user-app/app/(flows)/tracking/[id].tsx

id = orderId from route params.

Follow Section 13 "Live Tracking Screen" exactly.

Additional implementation details:

Map setup:
- Use MapView from react-native-maps, style: flex 1
- Region: start at dropoff coordinates, zoom to show both pins
- MapMarker (pickup): YELLOW, type="pickup"
- MapMarker (dropoff): GREEN, type="dropoff"
- MapMarker (driver): RED, type="driver", animates to new position smoothly
  Use Animated.Value for lat/lng, animate over 1 second on each new location

Bottom sheet implementation:
- Use BottomSheet component from components/ui/
- Not draggable on tracking — fixed at 35% height
- Show different content based on order.status (from useOrder + useTracking)

Status content rendering:
pending_moderation: "جاري التحقق من طلبك..." + Loader
pending_driver: animated searching dots + "نبحث عن سائق قريب منك"
driver_assigned: driver card + ETA + status timeline
in_progress: driver card + "السائق في الطريق" + ETA + status timeline
picked_up: driver card + "تم الاستلام، في الطريق إليك" + ETA
delivered: "هل وصل طلبك؟" + two buttons: "نعم، استلمته" + "لم يصل"
completed: success animation + review prompt (1-5 stars)
cancelled: error state with cancel reason + "طلب جديد" button

Status timeline component (horizontal, 5 steps):
"تأكيد" → "سائق" → "استلام" → "في الطريق" → "تسليم"
Completed step: GREEN circle with check. Current: RED circle pulsing. Future: gray.

Cancel button logic:
Show ONLY when status is in [pending_driver, driver_assigned]
Tap → BottomSheet with cancel reasons list → confirm → useOrder().cancelOrder()

Show complete code.
```

---

### PROMPT 3-C — Confirmation + Chat Screens

```
Tracking screen done. Now confirmation and chat.

1. user-app/app/(flows)/confirmation.tsx
   Receives: orderId from router params
   
   Full screen, centered content:
   - Animated checkmark circle (GREEN, scale from 0 to 1 on mount, 600ms spring)
   - "تم إرسال طلبك!" title, 24px bold
   - Order reference in JetBrains Mono: "#JHZ-{first 8 chars of orderId}"
   - Price: "{estimated_price} MAD" in JetBrains Mono, RED, 28px
   - Info row: "سيتم تعيين سائق خلال دقائق" with clock icon
   - "تتبع طلبك" Button: primary, full width
     → router.replace('/(flows)/tracking/' + orderId)
   - "العودة للرئيسية" Button: ghost, full width
     → router.replace('/(tabs)/')
   - Do not show a back arrow (replace, no going back to checkout)

2. user-app/app/(tabs)/chat.tsx (Chat List)
   Shows list of all user's orders that have active chat (have a driver assigned).
   
   Header: "الرسائل"
   
   FlatList of chat conversation rows:
   Each row (Pressable → router.push to individual chat):
   - Avatar of driver (Avatar component, sm size)
   - Driver name + order title (truncated)
   - Last message preview (truncated 1 line) + timestamp
   - Unread count badge (RED circle, white number) if unread > 0
   - Gray divider between rows
   
   Empty state: EmptyState icon="💬" title="لا توجد محادثات"
     subtitle="ستظهر محادثاتك مع السائقين هنا"
   
3. Create user-app/app/(flows)/chat/[id].tsx (Individual Chat Screen)
   id = orderId
   
   Header: driver name + online status dot + phone call icon button
   
   Messages list (FlatList inverted, newest at bottom):
   - User messages: right-aligned, RED bg, white text
   - Driver messages: left-aligned, SURFACE bg, TEXT color
   - System messages: centered, gray bg, small text, italic (status updates)
     e.g. "🚗 السائق في الطريق" — auto-generated by system
   - Timestamp below each message in TEXT3, tiny
   
   Input bar at bottom (above keyboard):
   - Text Input + send button (RED circle, arrow icon)
   - Image picker button (gray, left of text input)
   - Keyboard avoiding behavior
   
   Real-time: useChat(orderId) subscribes to new messages via Section 8 channel
   Send: useChat().sendMessage(content)
   
   If order is completed or cancelled: show "تم إغلاق هذه المحادثة" banner, disable input.

Show complete code for all 3 files.
```

---

## PHASE 4 — DRIVER APP

---

### PROMPT 4-A — Driver Home + Available Orders

```
User app core done. Now driver app.
The driver app uses the same foundation (types, components, hooks — mirror from user-app).

First: copy lib/supabase.ts, lib/api.ts, constants/brand.ts, components/ui/ to driver-app/
Add driver-specific API functions to driver-app/lib/api.ts:
- getAvailableOrders(): Promise<ApiResponse<Order[]>>
- acceptOrder(orderId: string, driverId: string): Promise<ApiResponse<void>>
- declineOrder(orderId: string, driverId: string): Promise<ApiResponse<void>>
- updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<void>>
- updateDriverStatus(isOnline: boolean, lat: number, lng: number): Promise<ApiResponse<void>>

Create driver-app/app/(tabs)/_layout.tsx:
3 tabs: "الطلبات" (orders) | "أرباحي" (earnings) | "حسابي" (profile)
Same style as user-app bottom nav.

Create driver-app/app/(tabs)/index.tsx (Driver Home — Available Orders):

Header:
- "JAHEEZ" logo left
- Online/Offline toggle switch right:
  OFF: gray "غير متاح". ON: GREEN "متاح".
  Toggling: calls updateDriverStatus(), requests location permission on first ON.

Online status banner (full width, below header):
ONLINE: GREEN bg — "أنت متاح — تنتظر الطلبات"
OFFLINE: gray bg — "أنت غير متاح — لن تتلقى طلبات"

Available orders list (only show when online):
FlatList of Order cards for available orders.
Each card (Card component, full width):
- Category badge (Badge component) + order type
- Title (bold, 2 lines max)
- Row: pickup address (gray, 1 line) + distance "1.2 كم" (RED, right)
- Row: estimated price (JetBrains Mono, RED, 20px bold) + "~25 دقيقة" (gray)
- Risk level (use RiskBadge component — show only if score > 0)
- "قبول الطلب" Button: primary, full width below card content
  → router.push('/(flows)/offer/' + order.id)

Offline state: EmptyState icon="💤" title="أنت غير متاح حالياً"
  subtitle="فعّل التوفر للبدء في استقبال الطلبات" actionLabel="تفعيل"

Loading: 3 skeleton cards

Realtime: subscribe to new orders channel (Section 8 driver_offers channel)
When new order arrives while screen is open: add to top of list with slide animation.

Show complete code.
```

---

### PROMPT 4-B — Offer + Active Trip Screens

```
Driver home done. Now the offer and trip screens.
Follow Section 13 from AGENTS for both screens.

1. driver-app/app/(flows)/offer/[id].tsx
   Follow Section 13 "Driver Offer Screen" exactly.
   
   Additional details:
   - Countdown timer: useEffect setInterval, decrement every second
   - When timer = 0: call declineOrder automatically, router.back()
   - Map preview: MapView with 2 markers (pickup + dropoff), disabled interaction
     (scrollEnabled=false, zoomEnabled=false)
   - Earnings: fetch from order.estimated_price, show in JetBrains Mono, 36px, RED
   - Accept: call acceptOrder(orderId, driverId)
     On success: router.replace('/(flows)/active-trip') passing order data
     On error (already taken): show BottomSheet "تم قبول هذا الطلب من سائق آخر"
       then router.back()

2. driver-app/app/(flows)/active-trip.tsx
   Follow Section 13 "Active Trip Screen" exactly.
   
   Phase detection: useState('pickup' | 'dropoff')
   Start in 'pickup' phase.
   
   Phase 'pickup':
   - Map shows driver position → pickup location route
   - Bottom content: pickup address + order items list (if delivery type)
   - Button: "وصلت لنقطة الاستلام" → call updateOrderStatus('picked_up')
     → setPhase('dropoff')
   
   Phase 'dropoff':
   - Map shows driver position → dropoff location route
   - Bottom content: dropoff address + customer note + call customer button
   - Button: "تم التسليم" → call updateOrderStatus('delivered')
     → router.push('/(flows)/delivery-confirmed')
   
   GPS tracking (useLocation hook startTracking):
   - Insert to driver_locations table every 5 seconds
   - Only track while this screen is mounted
   - Stop on unmount
   
   Create driver-app/app/(flows)/delivery-confirmed.tsx:
   - Simple success screen: checkmark + "تم التسليم بنجاح!"
   - Show earnings for this trip: "+{price} MAD" GREEN, JetBrains Mono
   - "العودة للطلبات" Button → router.replace('/(tabs)/')

Show complete code for all 3 files.
```

---

### PROMPT 4-C — Driver Earnings Screen

```
Trip screens done. Now driver earnings.

Create driver-app/app/(tabs)/earnings.tsx

Header: "أرباحي"

Stats cards row (3 equal cards):
- "اليوم": today's total earnings (GREEN, JetBrains Mono)
- "هذا الأسبوع": weekly total
- "عدد الطلبات": completed deliveries count today

Earnings timeline (FlatList of completed orders):
Header: "آخر التسليمات"
Each row (compact, no Card — just a list row with divider):
- Left: order title (14px) + date/time (TEXT3, 11px below)
- Right: "+{price} MAD" GREEN, JetBrains Mono, bold

Empty state: "لا توجد توصيلات اليوم"
Loading: skeleton rows

Data: query orders where driver_id = currentDriver.id AND status='completed'
Group and sum by day for the stats cards.
Use React Query with 30-second refetch interval.

At bottom: 
Information card (YELLOW_LIGHT bg):
"كيف تُحسب أرباحك؟"
Brief explanation of pricing model
"اعرف المزيد" link (stub)

Show complete code.
```

---

## PHASE 5 — ADMIN PANEL

---

### PROMPT 5-A — Admin Layout + Dashboard

```
Mobile apps done. Now admin web panel (Next.js 14).
The admin panel is built with Next.js 14 App Router + Tailwind CSS.
No React Native here — regular HTML/CSS/React for web.
Use the same BRAND colors (import from a shared CSS variables file).

Create admin/app/layout.tsx:
Sidebar navigation (fixed left, 240px wide):
- Top: JAHEEZ logo
- Nav items: Dashboard | Moderation Queue | Fraud Flags | Users | Drivers | Settings
  Active: RED bg left border, RED text. Hover: gray bg.
- Bottom: current admin user name + logout button
Main content area: margin-left 240px, padding 24px, BG (#FEFCE8) background.

Create admin/app/dashboard/page.tsx:
Title: "لوحة التحكم"

KPI cards row (4 cards):
- Active orders: count of orders in [pending_driver, driver_assigned, in_progress]
- Moderation queue: count of order_moderation where decision=manual_review AND reviewed_at IS NULL
- Online drivers: count of drivers where is_online=true
- Today's revenue: sum of payments.amount where date=today AND status=captured
Each card: white bg, border, 16px radius, metric number (24px bold) + label (12px gray).

Moderation queue preview (first 5 unreviewed flagged orders):
Table: order title | user | risk score (RiskBadge) | time waiting | "مراجعة" link
→ "مراجعة" links to /requests/{id}

Recent fraud flags (first 5):
Table: type | severity | user/driver | created_at | status (resolved/open)

Auto-refresh: use SWR or React Query with 15-second revalidation.

Show complete code.
```

---

### PROMPT 5-B — Moderation Queue

```
Dashboard done. Most important admin screen: moderation queue.
Follow Section 13 "Admin Moderation Queue" from AGENTS exactly.

Create admin/app/requests/page.tsx (list view)
Create admin/app/requests/[id]/page.tsx (detail + decision view)

List page:
Table with columns: # | العنوان | المستخدم | المخاطرة | نوع المهمة | انتظر منذ | إجراء
Sort by created_at ASC (oldest first — first in, first out)
Each row: tap → /requests/{moderation.id}
Risk column: use RiskBadge component (web version)
Row highlight: score > 69 → light red row bg. score 31-69 → light amber.

Detail page (split layout — list of fields left, decision panel right):

Left panel:
- Order title (large, bold)
- Raw text (full, in a bordered code block, RTL if Arabic)
- Detected language badge
- Keyword flags: each keyword highlighted in the text + listed below with severity
- AI analysis: intent label + confidence percentage + AI explanation text
- Risk score breakdown:
  - AI base score
  - Context modifiers (list each modifier that applied)
  - Final score (large, colored)

Right panel:
- User card: name, phone (masked), trust score bar, join date, total orders
- Previous flags (list from fraud_flags where user_id = this user)
- Previous rejected orders count (last 30 days)
- Decision section:
  - Textarea: "ملاحظات المراجعة" (review_notes — required for reject)
  - "موافقة ✓" Button: GREEN → update decision, order moves to pending_driver
  - "رفض ✗" Button: ERROR_RED → update decision, order rejected, user notified
  - "طلب توضيح" Button: WARN → send message to user asking for clarification (stub)

After decision: redirect back to list, row disappears.

Show complete code for both pages.
```

---

### PROMPT 5-C — Driver Management + Settings

```
Moderation queue done. Final admin screens.

1. admin/app/drivers/page.tsx
   Table: drivers list with columns:
   الاسم | الهاتف | المركبة | المنطقة | حالة الموافقة | التقييم | التوصيلات | الإجراء
   
   Filter row above table:
   - Status filter: الكل | معلق | موافق | مرفوض
   - Zone filter: الكل | سافي المركز | سافي الشمال | etc.
   - Search: by name or phone
   
   Each row action:
   - Pending: "موافقة" (green) + "رفض" (red) buttons
   - Approved: "تعليق" (yellow) + "تفاصيل" link
   
   Clicking "تفاصيل": opens a side panel (not a new page):
   - Driver photos: id card front/back, selfie (click to enlarge)
   - All driver info fields
   - Approval/rejection form with notes

2. admin/app/settings/page.tsx (Keyword Rules Management)
   Title: "قواعد الإشراف"
   
   Tab 1: "الكلمات المحظورة" (Banned Keywords)
   Table: الكلمة | اللغة | الخطورة | الفئة | الحالة | إجراء
   - Each row: edit inline, toggle active/inactive, delete button
   - "إضافة كلمة جديدة" Button: opens modal form
     Fields: word, language (ar/fr/darija/en), severity (LOW/MEDIUM/HIGH/CRITICAL), category
   - On save: insert to banned_keywords table
   
   Tab 2: "حدود النقاط" (Risk Thresholds)
   Three sliders (or number inputs):
   - Auto-approve if score ≤: default 30
   - Manual review if score ≤: default 69
   - Auto-reject if score ≥: default 70
   Show live preview: "طلب بنقاط 45 → مراجعة يدوية"
   Save button: updates a settings table (or environment config)

Show complete code for both pages.
```

---

## PHASE 6 — SUPABASE EDGE FUNCTIONS

---

### PROMPT 6-A — AI Analyze Edge Function

```
All screens done. Now the backend logic.

Create supabase/functions/ai-analyze/index.ts

This is a Supabase Edge Function (Deno runtime).
It is called after every new order is created.

Input (POST body): { order_id: string, title: string, description: string }

Implementation:

Step 1 — Load banned keywords from database:
Query the banned_keywords table where is_active = true.
Build a lookup structure for fast matching.

Step 2 — Normalize input text:
- Lowercase all Latin characters
- Remove Arabic diacritics (tashkeel) using regex: /[\u0610-\u061A\u064B-\u065F]/g
- Basic Arabizi transliteration map (7→ح, 3→ع, 9→ق, 8→ه, 2→ء, 4→ش)
  Apply character substitutions before matching.
- Decode basic leetspeak (0→o, 1→i, 3→e, 4→a)
Normalize both title and description.

Step 3 — Keyword matching:
Check normalized text against each keyword in banned_keywords.
Build keyword_flags array: [{ word, severity, category }]
If ANY keyword has severity = 'CRITICAL': 
  Set decision = 'auto_reject', risk_score = 95, skip Step 4.
If HIGH keywords found: add +20 to base score.
If MEDIUM keywords found: add +10 to base score.

Step 4 — Gemini AI classification (skip if hard blocked):
Call Gemini API using the exact prompt template from Section 7 of AGENTS.
Use GEMINI_API_KEY from environment variables.
Parse the JSON response.
Get base_risk from the intent categories table in Section 7.

Step 5 — Context modifiers:
Query users table for this order's user_id:
- created_at within 30 days → +5
- trust_score < 50 → +10
- Count of rejected orders in last 24h → +15 if >= 3
- description length < 20 chars → +8
- trust_score > 80 AND total orders > 20 → -5

Step 6 — Final decision:
final_score = base_score + modifiers (clamped 0-100)
0-30 → decision = 'auto_approve'
31-69 → decision = 'manual_review'
70-100 → decision = 'auto_reject'
Also: if AI confidence < 0.60 → force 'manual_review' regardless of score.

Step 7 — Write results:
Insert into order_moderation table.
Update orders table: risk_score, moderation_status.
If auto_approve: update orders.status = 'pending_driver', call match-driver function.
If auto_reject: update orders.status = 'moderation_rejected'.
  Call send-notification: notify user their order was rejected.
If manual_review: update orders.status stays 'pending_moderation'.
  Call send-notification: notify admins of new item in queue.

Return JSON response with decision, risk_score, ai_intent, explanation.

Show complete Deno TypeScript code.
```

---

### PROMPT 6-B — Match Driver + Send Notification

```
AI analyze function done.

1. Create supabase/functions/match-driver/index.ts

Input: { order_id: string }

Implementation:
Step 1: Fetch the order to get pickup_lat, pickup_lng.
Step 2: Query available drivers:
  is_online = true AND is_approved = true
  No currently assigned active order (no row in orders where driver_id=id AND status IN active statuses)
  Filter by distance: use Supabase's PostGIS function or manual Haversine calculation
  Start with 5km radius.

Step 3: Score each driver:
  proximity_score = (1 - distance_km / max_radius) * 0.40
  rating_score = (driver.rating_avg / 5) * 0.30
  experience_score = Math.min(driver.total_deliveries / 100, 1) * 0.20
  idle_score = 0.10 (simplified — always give 0.10 for now)
  composite = sum of all 4

Step 4: Sort by composite DESC, take top 5.

Step 5: Broadcast new order offer to each driver via Supabase Realtime broadcast:
  channel: driver_offers:{driver_id}
  event: 'new_order'
  payload: { order_id, title, distance_km, estimated_price, category, pickup_address }

Step 6: Wait 30 seconds (using a scheduled check, not blocking sleep).
  Check if orders.status changed to 'driver_assigned'.
  If yes: done.
  If no: expand radius to 8km, repeat from Step 2.
  After 3 rounds with no acceptance: update orders.status = 'cancelled',
    cancel_reason = 'no_drivers_available'. Notify user.

Return: { matched: boolean, driver_id?: string, rounds: number }

2. Create supabase/functions/send-notification/index.ts

Input: { user_id: string, title: string, body: string, type: string, order_id?: string }

Implementation:
Step 1: Insert into notifications table.
Step 2: Fetch the user's push token (stored in users table or a separate device_tokens table).
Step 3: Call Expo Push Notifications API:
  POST to https://exp.host/--/api/v2/push/send
  Body: { to: expoPushToken, title, body, data: { type, order_id } }
Step 4: Log success/failure.

Return: { success: boolean, notification_id: string }

Show complete Deno TypeScript code for both functions.
```

---

## FINAL PROMPT — Review & Polish

```
All screens and functions are built.
Do a final review pass. Check every file against these criteria:

1. NEVER hardcoded colors — grep for any hex values outside brand.ts
2. NEVER missing loading state — every useQuery call has isLoading handled
3. NEVER missing error state — every useQuery call has error handled
4. NEVER missing empty state — every list screen has empty state
5. NEVER missing accessibilityLabel — every Pressable and Image has it
6. NEVER any `any` type — check all TypeScript files
7. NEVER inline styles in React Native files — check for style={{ }} props

List every violation you find, with the file name and line number.
Then fix each violation.

After fixing: confirm the following key user journeys work end-to-end:

Journey 1 — User places a safe errand:
splash → login → otp → home → custom-request → (ai approves) → confirmation → tracking → delivered → rating

Journey 2 — User places a flagged errand:
custom-request → (ai flags) → waiting screen → (admin approves) → confirmation → tracking

Journey 3 — Driver accepts and completes:
driver home (online) → offer screen → accept → active trip → pickup → dropoff → confirmed → earnings updated

Journey 4 — Admin reviews flagged order:
moderation queue list → detail view → review notes → approve → order moves to pending_driver

For each journey, confirm: which files are involved, which hooks are called, which Supabase tables are read/written.

Report any gap or missing link in each journey.
```

---

*End of JAHEEZ Prompt Sequence*
*Total prompts: 17 (0-A through 6-B + Final)*
*Estimated build time: 8-12 sessions with an AI agent*
