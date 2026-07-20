# JAHEEZ — AI Agent Master Instruction File
# Version: 1.0 — Production
# Read this entire file before writing a single line of code.
# This is the single source of truth for every decision you make.

---

## 0. WHAT YOU ARE DOING

You are building JAHEEZ — a production-grade smart delivery and errand platform
for the Safi region of Morocco. The platform has three actors: Users who place
requests, Drivers who fulfill them, and Admins who operate and moderate the system.

There are three applications:
- user-app/ — Expo React Native app for customers (iOS + Android)
- driver-app/ — Expo React Native app for drivers (iOS + Android)
- admin/ — Next.js 14 web panel for operations team

The backend is Supabase: Postgres database, Auth, Realtime, Storage, and
Edge Functions. No custom backend server. Supabase IS the backend.

---

## 1. NON-NEGOTIABLE RULES
# Break any of these and the entire output is rejected. No exceptions.

### 1.1 Code Rules
- NEVER use inline styles in React Native — use NativeWind classes only
- NEVER hardcode any color value — always import from constants/brand.ts
- NEVER use `any` TypeScript type — use proper types from shared/types.ts
- NEVER use default exports except for screen files (files inside app/ folders)
- NEVER put business logic inside UI components — logic lives in hooks/
- NEVER install a new package without explicitly stating it and why
- NEVER use setTimeout for navigation — use Expo Router router.push/replace
- NEVER duplicate code — if a pattern appears twice, extract it to components/ui/
- ALWAYS handle loading state, error state, AND empty state in every screen
- ALWAYS add accessibilityLabel to every Pressable and Image element
- ALWAYS use TypeScript strict mode — tsconfig has strict: true
- ALWAYS use named exports for everything except screen files
- ALWAYS use React Query for any data that comes from Supabase
- ALWAYS use Zustand for state shared between multiple screens
- ALWAYS wrap money/price values in JetBrains Mono font class

### 1.2 Architecture Rules
- Screens only import from: hooks/, components/ui/, constants/, lib/
- Hooks handle all Supabase calls, business logic, and state
- components/ui/ contains only pure presentational widgets
- No screen imports another screen directly
- Supabase client is instantiated ONCE in lib/supabase.ts — never elsewhere
- All TypeScript interfaces live in shared/types.ts — never define types inline
- All API calls go through lib/api.ts — never call supabase directly from screens

### 1.3 Design Rules
- Primary button: RED (#EF4444), 52px height, pill radius (border-radius: 9999)
- Input fields: 52px height, 12px radius, INPUT_BG fill, RED focus border
- Cards: white background, 16px radius, shadow, 16px padding
- Screen background: BG (#FEFCE8) — warm cream-yellow
- All spacing must be multiples of 8px
- Font: DM Sans for all text, JetBrains Mono for prices/OTP/IDs/references
- Bottom nav bar: 64px height + safe area, white background, 1px top border
- Top nav bar: 56px height, white, title bold centered, back arrow 44px touch target
- Status colors: GREEN (#22C55E) delivered/success, WARN (#F59E0B) pending,
  ERROR_RED (#DC2626) errors, AI_PURPLE (#8B5CF6) AI-related features

---

## 2. BRAND TOKENS
# Import ALL of these from constants/brand.ts — never use raw hex values

```typescript
// constants/brand.ts — this file already exists, never recreate it
export const BRAND = {
  // Primary brand colors (from JAHEEZ logo)
  YELLOW: "#F2C94C",
  YELLOW_DARK: "#D4A82A",
  YELLOW_LIGHT: "#FDF6E0",
  RED: "#EF4444",         // PRIMARY BUTTON COLOR
  RED_DARK: "#D63031",
  RED_LIGHT: "#FEE2E2",

  // UI surface colors
  SURFACE: "#FFFFFF",
  BG: "#FEFCE8",          // SCREEN BACKGROUND
  TEXT: "#1C1C1E",
  TEXT2: "#6B7280",
  TEXT3: "#9CA3AF",
  BORDER: "#E5E7EB",
  INPUT_BG: "#F9FAFB",

  // Semantic colors
  GREEN: "#22C55E",
  ERROR_RED: "#DC2626",
  WARN: "#F59E0B",
  AI_PURPLE: "#8B5CF6",

  // Dimensions
  RADIUS_CARD: 16,
  RADIUS_INPUT: 12,
  RADIUS_PILL: 9999,
  SHADOW: "0 4px 12px rgba(0,0,0,0.08)",
} as const;
```

---

## 3. FOLDER STRUCTURE
# Every file you create must go in exactly the right place.

```
jaheez/
├── assets/
│   ├── fonts/               DM Sans + JetBrains Mono font files
│   ├── images/              Logo, illustrations, icons
│   └── sounds/              Notification sounds for driver app
│
├── shared/
│   ├── types.ts             ALL TypeScript interfaces — only place to define types
│   └── constants.ts         Shared enums (OrderStatus, UserRole, etc.)
│
├── user-app/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── splash.tsx
│   │   │   ├── onboarding.tsx
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── otp.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       Bottom navigation shell
│   │   │   ├── index.tsx         Home screen
│   │   │   ├── search.tsx        Search screen
│   │   │   ├── orders.tsx        Order history
│   │   │   ├── chat.tsx          Chat list
│   │   │   └── profile.tsx       Profile & settings
│   │   └── (flows)/
│   │       ├── store/[id].tsx     Store detail
│   │       ├── cart.tsx           Cart screen
│   │       ├── checkout.tsx       Checkout
│   │       ├── custom-request.tsx New custom errand
│   │       ├── ai-suggestion.tsx  AI-assisted errand form
│   │       ├── tracking/[id].tsx  Live order tracking
│   │       └── confirmation.tsx   Order placed confirmation
│   ├── components/ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Loader.tsx
│   │   ├── MapMarker.tsx
│   │   ├── OrderCard.tsx
│   │   ├── EmptyState.tsx
│   │   └── StatusBadge.tsx
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   ├── orderStore.ts
│   │   └── locationStore.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOrder.ts
│   │   ├── useLocation.ts
│   │   ├── useTracking.ts
│   │   └── useChat.ts
│   ├── constants/
│   │   └── brand.ts             (re-exports from ../../shared + app-specific tokens)
│   └── lib/
│       ├── supabase.ts
│       ├── api.ts
│       └── maps.ts
│
├── driver-app/                  (mirrors user-app structure exactly)
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (tabs)/
│   │   └── (flows)/
│   │       ├── offer/[id].tsx   Incoming order offer screen
│   │       ├── active-trip.tsx  Active trip navigation
│   │       ├── documents.tsx    Document upload
│   │       └── earnings.tsx     Earnings dashboard
│   ├── components/ui/
│   ├── store/
│   ├── hooks/
│   ├── constants/
│   └── lib/
│
├── admin/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── requests/            Moderation queue
│   │   ├── risk/                Fraud flags
│   │   ├── users/
│   │   ├── drivers/
│   │   ├── payments/
│   │   └── settings/            Keyword rules, moderation config
│   └── components/
│       ├── Sidebar.tsx
│       ├── DataTable.tsx
│       ├── RiskBadge.tsx
│       └── ModerationCard.tsx
│
└── supabase/
    ├── migrations/              SQL files — NEVER edit existing ones
    └── functions/
        ├── ai-analyze/          Gemini API integration
        ├── match-driver/        Driver matching algorithm
        └── send-notification/   Push notifications
```

---

## 4. SUPABASE DATABASE SCHEMA
# These tables already exist. Query them exactly as specified.

### Core Tables

**users**
- id: uuid (PK)
- phone: varchar(20) unique — format +212XXXXXXXXX
- full_name: varchar(120)
- email: varchar(255) nullable
- password_hash: text
- avatar_url: text nullable
- is_verified: boolean default false
- is_banned: boolean default false
- ban_reason: text nullable
- trust_score: smallint (0-100) default 70
- locale: varchar(5) default 'ar-MA'
- created_at: timestamptz
- updated_at: timestamptz

**drivers**
- id: uuid (PK)
- user_id: uuid FK → users.id
- vehicle_type: enum ('motorcycle','car','bicycle','on_foot')
- license_plate: varchar(20) nullable
- id_card_front_url: text
- id_card_back_url: text
- selfie_url: text
- is_approved: boolean default false
- is_online: boolean default false
- current_zone: varchar(50) — e.g. 'safi_centre', 'safi_nord'
- rating_avg: numeric(3,2) default 5.00
- total_deliveries: int default 0
- created_at: timestamptz

**orders**
- id: uuid (PK)
- user_id: uuid FK → users.id
- driver_id: uuid FK → drivers.id nullable
- order_type: enum ('delivery','errand')
- status: enum ('pending_moderation','moderation_rejected','pending_driver',
          'driver_assigned','in_progress','picked_up','delivered',
          'completed','cancelled','disputed')
- title: varchar(200)
- description: text nullable
- category: varchar(50) — 'food','grocery','pharmacy','custom_errand'
- pickup_address: text nullable
- pickup_lat: double precision nullable
- pickup_lng: double precision nullable
- dropoff_address: text
- dropoff_lat: double precision
- dropoff_lng: double precision
- estimated_price: numeric(10,2) nullable
- final_price: numeric(10,2) nullable
- currency: varchar(3) default 'MAD'
- risk_score: smallint (0-100) default 0
- moderation_status: enum ('pending','approved','flagged','rejected','manual_review')
- scheduled_at: timestamptz nullable
- completed_at: timestamptz nullable
- cancelled_by: enum ('user','driver','system') nullable
- cancel_reason: text nullable
- created_at: timestamptz
- updated_at: timestamptz

**order_moderation**
- id: uuid (PK)
- order_id: uuid FK → orders.id
- raw_text: text
- detected_language: varchar(5) — 'ar','fr','darija','en'
- keyword_flags: jsonb — [{"word":"xxx","severity":"HIGH"}]
- ai_intent: varchar(50)
- ai_confidence: numeric(4,3)
- risk_score: smallint
- decision: enum ('auto_approve','auto_reject','manual_review')
- reviewed_by: uuid FK → users.id nullable
- review_notes: text nullable
- reviewed_at: timestamptz nullable
- rules_triggered: jsonb

**chat_messages**
- id: uuid (PK)
- order_id: uuid FK → orders.id
- sender_id: uuid FK → users.id
- sender_role: enum ('user','driver','system')
- content: text
- message_type: enum ('text','image','system')
- is_flagged: boolean default false
- flag_reason: text nullable
- created_at: timestamptz

**payments**
- id: uuid (PK)
- order_id: uuid FK → orders.id
- user_id: uuid FK → users.id
- amount: numeric(10,2)
- currency: varchar(3) default 'MAD'
- method: enum ('cash','card','wallet')
- status: enum ('pending','authorized','captured','refunded','failed')
- provider_ref: varchar(255) nullable
- created_at: timestamptz
- updated_at: timestamptz

**driver_locations**
- id: bigserial (PK)
- driver_id: uuid FK → drivers.id
- lat: double precision
- lng: double precision
- speed_kmh: smallint nullable
- heading: smallint nullable
- recorded_at: timestamptz

**fraud_flags**
- id: uuid (PK)
- user_id: uuid FK → users.id nullable
- driver_id: uuid FK → drivers.id nullable
- flag_type: varchar(30) — 'velocity_abuse','fake_gps','multi_account','payment_fraud'
- severity: enum ('LOW','MEDIUM','HIGH','CRITICAL')
- evidence: jsonb
- resolved: boolean default false
- resolved_by: uuid nullable
- created_at: timestamptz

**Supporting tables** (query-only, do not modify schema):
- user_verifications: (user_id, doc_type, doc_url, status, verified_at)
- driver_verifications: (driver_id, doc_type, doc_url, status, reviewed_at)
- reviews: (order_id, reviewer_id, target_id, rating 1-5, comment)
- order_status_log: (order_id, from_status, to_status, changed_by, timestamp)
- order_items: (order_id, name, quantity, unit_price)
- moderation_rules: (id, name, type, pattern, severity, is_active)
- banned_keywords: (word, language, severity, category)
- notifications: (user_id, type, title, body, is_read, sent_at)

---

## 5. TYPESCRIPT TYPES
# All interfaces live in shared/types.ts. Import from there. Never redefine.

```typescript
// shared/types.ts

export type UserRole = 'user' | 'driver' | 'admin' | 'super_admin';
export type VehicleType = 'motorcycle' | 'car' | 'bicycle' | 'on_foot';
export type OrderType = 'delivery' | 'errand';
export type PaymentMethod = 'cash' | 'card' | 'wallet';
export type ModerationDecision = 'auto_approve' | 'auto_reject' | 'manual_review';
export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type OrderStatus =
  | 'pending_moderation'
  | 'moderation_rejected'
  | 'pending_driver'
  | 'driver_assigned'
  | 'in_progress'
  | 'picked_up'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface User {
  id: string;
  phone: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  is_verified: boolean;
  is_banned: boolean;
  trust_score: number;
  locale: string;
  created_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  license_plate?: string;
  is_approved: boolean;
  is_online: boolean;
  current_zone?: string;
  rating_avg: number;
  total_deliveries: number;
  // joined from users table:
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface Order {
  id: string;
  user_id: string;
  driver_id?: string;
  order_type: OrderType;
  status: OrderStatus;
  title: string;
  description?: string;
  category?: string;
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_price?: number;
  final_price?: number;
  currency: string;
  risk_score: number;
  moderation_status: string;
  created_at: string;
  updated_at: string;
  // joined relations:
  driver?: Driver;
  items?: OrderItem[];
  moderation?: OrderModeration;
}

export interface OrderItem {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface OrderModeration {
  id: string;
  order_id: string;
  raw_text: string;
  detected_language?: string;
  keyword_flags: KeywordFlag[];
  ai_intent?: string;
  ai_confidence?: number;
  risk_score: number;
  decision: ModerationDecision;
  reviewed_by?: string;
  review_notes?: string;
  reviewed_at?: string;
}

export interface KeywordFlag {
  word: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
}

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: 'user' | 'driver' | 'system';
  content: string;
  message_type: 'text' | 'image' | 'system';
  is_flagged: boolean;
  flag_reason?: string;
  created_at: string;
}

export interface DriverLocation {
  driver_id: string;
  lat: number;
  lng: number;
  speed_kmh?: number;
  heading?: number;
  recorded_at: string;
}

export interface FraudFlag {
  id: string;
  user_id?: string;
  driver_id?: string;
  flag_type: string;
  severity: FraudSeverity;
  evidence: Record<string, unknown>;
  resolved: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  target_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// API response wrappers
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

// Zustand store shapes
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface CartState {
  items: CartItem[];
  store_id?: string;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
}
```

---

## 6. ORDER STATE MACHINE
# Never allow a status transition that is not in this table.
# Validate status transitions in hooks, not in UI components.

```
VALID TRANSITIONS:

pending_moderation  → pending_driver       (auto or manual APPROVE)
pending_moderation  → moderation_rejected  (auto or manual REJECT)
pending_driver      → driver_assigned      (driver accepts)
pending_driver      → cancelled            (user cancels or no drivers found)
driver_assigned     → in_progress          (driver starts moving)
driver_assigned     → pending_driver       (driver cancels — re-broadcasts)
driver_assigned     → cancelled            (user cancels before driver moves)
in_progress         → picked_up            (driver marks item collected)
in_progress         → cancelled            (emergency only — admin action)
picked_up           → delivered            (driver arrives at dropoff)
delivered           → completed            (user confirms receipt)
delivered           → disputed             (user disputes)
disputed            → completed            (admin resolves)
cancelled           → [terminal]
completed           → [terminal]
moderation_rejected → [terminal]

ANY OTHER TRANSITION IS ILLEGAL. Throw an error if attempted.
```

---

## 7. AI MODERATION SYSTEM
# This is the most critical safety layer. Understand it before touching any order flow.

### How it works:
Every order goes through a 2-stage pipeline before a driver sees it.

Stage 1 — Rule-based (fast, < 20ms):
- Text is normalized: remove Arabic diacritics, decode Arabizi (7 → ح, 3 → ع),
  decode leetspeak (dr0gu3 → drogue), lowercase Latin text
- Normalized text is matched against the banned_keywords table
- If any CRITICAL keyword found → HARD BLOCK, auto_reject, risk_score = 95
- This happens in the Supabase Edge Function: supabase/functions/ai-analyze/

Stage 2 — AI classification (Gemini API, < 200ms):
- Gemini analyzes the full text and returns an intent + confidence score
- Intent categories and their base risk scores:
  food_delivery: 0 | grocery_shopping: 0 | pharmacy_errand: 5
  document_delivery: 10 | personal_item_delivery: 15 | gift_delivery: 10
  bill_payment: 10 | queue_waiting: 5 | ambiguous_errand: 40
  suspicious_errand: 65 | illegal_activity: 90 | exploitation_risk: 85

Decision thresholds:
- risk_score 0–30 → auto_approve → order moves to pending_driver
- risk_score 31–69 → manual_review → order stays pending_moderation, admin notified
- risk_score 70–100 → auto_reject → order rejected, user notified

Context modifiers added to base score:
- New user (< 3 orders): +5
- Low trust_score (< 50): +10
- Vague description (< 20 chars): +8
- Repeated rejection pattern: +15
- Verified user with 20+ orders: -5

### The Gemini prompt template (used in ai-analyze Edge Function):
```
You are a content moderator for JAHEEZ, a delivery platform in Safi, Morocco.
The platform serves ordinary people who need errands and deliveries.
Analyze the following order request and respond with ONLY a JSON object.

Request title: {title}
Request description: {description}
Language detected: {language}

Respond with exactly this JSON structure:
{
  "intent": "<one of the intent categories>",
  "confidence": <0.000 to 1.000>,
  "risk_base_score": <integer 0-100>,
  "flags": ["<reason if any>"],
  "explanation": "<one sentence in the same language as the request>"
}

Be conservative. When in doubt, use "ambiguous_errand" rather than approving.
Common legitimate Moroccan errands: pharmacy runs, grocery shopping, food delivery,
document pickup, bill payment at agencies, waiting in queues.
Flag any request involving: substances, weapons, counterfeit items, exploitation.
```

---

## 8. REAL-TIME SYSTEM
# Supabase Realtime replaces WebSockets for this implementation.

### Channels to subscribe to:

**Order tracking** (user watches their active order):
```typescript
supabase.channel(`order:${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => handleOrderUpdate(payload.new as Order))
  .subscribe();
```

**Driver location** (user watches driver moving):
```typescript
supabase.channel(`driver_location:${driverId}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'driver_locations',
    filter: `driver_id=eq.${driverId}`
  }, (payload) => handleLocationUpdate(payload.new as DriverLocation))
  .subscribe();
```

**New order offers** (driver receives new orders):
```typescript
supabase.channel(`driver_offers:${driverId}`)
  .on('broadcast', { event: 'new_order' }, (payload) => handleNewOffer(payload))
  .subscribe();
```

**Chat messages** (both user and driver):
```typescript
supabase.channel(`chat:${orderId}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'chat_messages',
    filter: `order_id=eq.${orderId}`
  }, (payload) => handleNewMessage(payload.new as ChatMessage))
  .subscribe();
```

**Admin moderation queue** (admin watches for new flagged orders):
```typescript
supabase.channel('moderation_queue')
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'order_moderation',
    filter: `decision=eq.manual_review`
  }, (payload) => handleNewFlaggedOrder(payload.new))
  .subscribe();
```

---

## 9. SUPABASE EDGE FUNCTIONS
# These functions already exist or must be created exactly as specified.

### ai-analyze (POST /functions/v1/ai-analyze)
Input: { order_id: string, title: string, description: string }
- Stage 1: Query banned_keywords table, normalize text, check matches
- Stage 2: Call Gemini API with the template from Section 7
- Calculate final risk_score with context modifiers
- Write result to order_moderation table
- Update orders.moderation_status and orders.risk_score
- If auto_approve: update orders.status to 'pending_driver'
- If auto_reject: update orders.status to 'moderation_rejected'
- If manual_review: send notification to admins, keep status as 'pending_moderation'
- Return: { decision, risk_score, ai_intent, explanation }

### match-driver (POST /functions/v1/match-driver)
Input: { order_id: string }
- Query drivers where is_online=true, is_approved=true, no active assigned order
- Filter by distance from order pickup (use PostGIS ST_Distance)
- Score candidates: proximity 40% + rating 30% + experience 20% + idle time 10%
- Broadcast to top 5 drivers via Supabase Realtime broadcast
- Create offer record in order_status_log
- Set 30-second acceptance window
- If no acceptance: expand radius to 8km, retry
- After 3 rounds: update order status to cancelled, notify user

### send-notification (POST /functions/v1/send-notification)
Input: { user_id: string, title: string, body: string, type: string, order_id?: string }
- Write to notifications table
- Send push notification via Expo Push API
- Return: { success: boolean }

---

## 10. COMPONENT SPECIFICATIONS
# Build these exactly as specified. Do not improvise component APIs.

### Button.tsx
```typescript
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  accessibilityLabel: string; // REQUIRED
}
// primary: RED bg, white text, pill radius, 52px height
// secondary: YELLOW bg, TEXT color, pill radius, 52px height
// ghost: transparent bg, RED border, RED text
// danger: ERROR_RED bg, white text
```

### Input.tsx
```typescript
interface InputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: 'text' | 'phone' | 'password' | 'otp' | 'number';
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isDisabled?: boolean;
  accessibilityLabel: string; // REQUIRED
}
// height: 52px, radius: 12px, bg: INPUT_BG, focus border: RED
// OTP type: JetBrains Mono font, large centered digits
// error: shows error text below in ERROR_RED, red border
```

### StatusBadge.tsx
```typescript
interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}
// pending_moderation: WARN bg+text "قيد المراجعة"
// pending_driver: YELLOW bg + TEXT "بحث عن سائق"
// driver_assigned: AI_PURPLE bg+text "تم التعيين"
// in_progress: BRAND.RED bg + white "في الطريق"
// picked_up: BRAND.RED bg + white "تم الاستلام"
// delivered: GREEN bg + white "تم التسليم"
// completed: GREEN bg + white "مكتمل"
// cancelled: BORDER bg + TEXT2 "ملغي"
// disputed: ERROR_RED bg + white "متنازع عليه"
// moderation_rejected: ERROR_RED bg + white "مرفوض"
```

### Card.tsx
```typescript
interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: object; // only for layout overrides, not colors
  testID?: string;
}
// bg: SURFACE (#FFFFFF), radius: RADIUS_CARD (16), shadow: SHADOW
// padding: 16px, marginBottom: 12px default
```

### EmptyState.tsx
```typescript
interface EmptyStateProps {
  icon: string; // emoji or icon name
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

### OrderCard.tsx
```typescript
interface OrderCardProps {
  order: Order;
  onPress: () => void;
  variant?: 'compact' | 'full';
}
// compact: title + status badge + price + date — for history list
// full: all details + driver info + action buttons — for active order
```

---

## 11. HOOKS SPECIFICATIONS

### useAuth.ts
```typescript
export function useAuth() {
  return {
    user: User | null,
    isLoading: boolean,
    isAuthenticated: boolean,
    signIn: (phone: string, password: string) => Promise<void>,
    signUp: (phone: string, fullName: string, password: string) => Promise<void>,
    verifyOTP: (verificationId: string, otp: string) => Promise<void>,
    signOut: () => Promise<void>,
    updateProfile: (updates: Partial<User>) => Promise<void>,
  }
}
```

### useOrder.ts
```typescript
export function useOrder(orderId?: string) {
  return {
    order: Order | null,
    orders: Order[],             // list of user's orders
    isLoading: boolean,
    error: string | null,
    createOrder: (data: CreateOrderInput) => Promise<Order>,
    cancelOrder: (orderId: string, reason: string) => Promise<void>,
    confirmDelivery: (orderId: string) => Promise<void>,
    submitReview: (orderId: string, rating: number, comment?: string) => Promise<void>,
  }
}
```

### useTracking.ts
```typescript
export function useTracking(orderId: string) {
  return {
    driverLocation: DriverLocation | null,
    orderStatus: OrderStatus | null,
    etaMinutes: number | null,
    isConnected: boolean,
  }
}
// Uses Supabase Realtime from Section 8
// Automatically cleans up subscription on unmount
```

### useChat.ts
```typescript
export function useChat(orderId: string) {
  return {
    messages: ChatMessage[],
    isLoading: boolean,
    sendMessage: (content: string, type?: 'text' | 'image') => Promise<void>,
    uploadImage: (uri: string) => Promise<string>, // returns URL
  }
}
```

---

## 12. SCREEN BUILD ORDER
# Build in this exact order. Each screen depends on the ones before it.

### Phase 0 — Foundation (do this before any screen)
1. Set up lib/supabase.ts — Supabase client singleton
2. Set up lib/api.ts — all API functions
3. Set up shared/types.ts — all TypeScript interfaces
4. Set up constants/brand.ts — all tokens
5. Build ALL components/ui/ components
6. Build ALL hooks/

### Phase 1 — User App Authentication
7. app/(auth)/splash.tsx
8. app/(auth)/onboarding.tsx
9. app/(auth)/login.tsx
10. app/(auth)/register.tsx
11. app/(auth)/otp.tsx

### Phase 2 — User App Core
12. app/(tabs)/_layout.tsx — bottom navigation
13. app/(tabs)/index.tsx — home screen
14. app/(tabs)/orders.tsx — order history
15. app/(tabs)/profile.tsx — profile & settings

### Phase 3 — User App Order Flow
16. app/(flows)/custom-request.tsx — create errand
17. app/(flows)/confirmation.tsx — order placed
18. app/(flows)/tracking/[id].tsx — live tracking
19. app/(tabs)/chat.tsx — chat list
20. app/(flows)/store/[id].tsx — store detail
21. app/(flows)/cart.tsx — cart
22. app/(flows)/checkout.tsx — checkout
23. app/(tabs)/search.tsx — search

### Phase 4 — Driver App
24. Driver auth screens (same as user auth)
25. Driver home — available orders list
26. app/(flows)/offer/[id].tsx — incoming order offer
27. app/(flows)/active-trip.tsx — navigation during trip
28. app/(flows)/documents.tsx — document upload
29. app/(flows)/earnings.tsx — earnings dashboard

### Phase 5 — Admin Panel
30. admin/app/layout.tsx — sidebar layout
31. admin/app/dashboard/ — KPI overview
32. admin/app/requests/ — moderation queue
33. admin/app/drivers/ — driver management
34. admin/app/users/ — user management
35. admin/app/risk/ — fraud flags
36. admin/app/settings/ — keyword rules

---

## 13. SCREEN SPECIFICATIONS

### Home Screen — app/(tabs)/index.tsx
Purpose: User's main screen. Shows categories, recent orders, and quick request button.

Layout:
- Header: YELLOW (#F2C94C) background, JAHEEZ logo left, notification bell right
- Search bar: INPUT_BG, placeholder "ابحث عن أي شيء..." (Arabic first)
- Category pills: horizontal scroll
  Food | Grocery | Pharmacy | Errand | Other
  Selected: RED bg, white text. Unselected: SURFACE bg, TEXT2 text.
- "طلب جديد" (New Request) button: RED, full width, 52px, pill, bottom of categories
- Active order banner (show only if user has active order):
  YELLOW_LIGHT bg, order title + StatusBadge + "تتبع" link
- Recent orders section: last 3 orders as OrderCard (compact variant)
- Empty state if no orders: EmptyState component

Data: useOrder() hook for orders list. React Query for categories.

### Custom Request Screen — app/(flows)/custom-request.tsx
Purpose: User creates a new errand/delivery request.

Layout:
- Header: "طلب جديد" title, back arrow
- Order type selector: 2 cards — "توصيل" (Delivery) and "مهمة" (Errand)
  Selected card: RED border 2px, YELLOW_LIGHT bg. Unselected: BORDER.
- Title Input: "ماذا تريد؟" label, required, max 200 chars, Arabic RTL support
- Description Input: multiline, 4 lines min, optional, "وصف تفصيلي..."
- Category selector: pill list — Food / Grocery / Pharmacy / Custom
- Pickup address: Input with map pin icon. Optional.
- Dropoff address: Input with map pin icon. REQUIRED.
- Estimated price: Input with "MAD" suffix, JetBrains Mono, optional
- Submit button: "إرسال الطلب" RED, full width
- After submit: show Loader while moderation runs
- If auto_approve: navigate to confirmation.tsx
- If manual_review: show "طلبك قيد المراجعة. سنرد خلال 5 دقائق." and wait
- If auto_reject: show error with reason, stay on screen

Hook used: useOrder().createOrder()
Edge Function called: ai-analyze (called by the API layer, not directly from screen)

### Live Tracking Screen — app/(flows)/tracking/[id].tsx
Purpose: User watches their order being fulfilled in real time.

Layout:
- Full screen map (react-native-maps)
- Driver location marker: custom RED pin with scooter icon
- Pickup location: YELLOW pin
- Dropoff location: GREEN pin
- Route polyline: RED dashed line from driver to next destination
- Bottom sheet (always visible, draggable):
  - Order title and StatusBadge
  - Driver card (when assigned): avatar, name, rating, vehicle, call button
  - ETA: "يصل في ~12 دقيقة" with clock icon
  - Status timeline: horizontal steps matching OrderStatus
  - Chat button → navigate to chat screen
  - Cancel button (only in pending_driver/driver_assigned states)
- "تم الاستلام؟" confirm button appears when status = delivered

Hook used: useTracking(orderId) for real-time location + status
Hook used: useOrder(orderId) for order details

### Driver Offer Screen — app/(flows)/offer/[id].tsx
Purpose: Driver sees incoming order and decides to accept or decline.

Layout:
- Full screen, dark overlay feel (this appears as a modal)
- Order title — large, bold
- Category badge
- Map preview: small map showing pickup and dropoff pins
- Distance: "1.2 كم" prominent
- Estimated earnings: price in JetBrains Mono, RED color, very large
- Time estimate: "~25 دقيقة"
- Countdown timer: 30 seconds, RED, ticking
  When reaches 0: auto-decline, navigate back
- Two buttons: "قبول" (GREEN, large) and "رفض" (ghost, smaller)
- On accept: call acceptOrder API, navigate to active-trip.tsx
- On decline: log decline, navigate back

### Active Trip Screen — app/(flows)/active-trip.tsx
Purpose: Driver navigates to pickup then to dropoff.

Two phases:
Phase 1 — Go to pickup:
  - "توجه إلى نقطة الاستلام" header
  - Pickup address prominent
  - Navigation map (full screen with directions)
  - "وصلت للاستلام" button at bottom → updates status to picked_up

Phase 2 — Go to dropoff:
  - "توجه إلى نقطة التسليم" header
  - Dropoff address prominent
  - Customer name + phone (call button)
  - "تم التسليم" button → updates status to delivered → triggers payment flow

GPS location update: every 5 seconds to driver_locations table while on trip.

### Admin Moderation Queue — admin/app/requests/
Purpose: Admin reviews manually flagged orders.

Layout (desktop web — Next.js):
- Split panel: list on left, detail on right
- List: flagged orders sorted by created_at ASC (oldest first)
  Each row: order title | user name | risk_score (colored) | time waiting | intent
- Detail panel:
  - Original request text (full, in detected language)
  - Keyword flags highlighted in the text
  - AI intent + confidence score
  - User profile: name, trust_score, order history, fraud_flags
  - Risk score breakdown (keyword + AI + context modifiers)
  - Two action buttons: "موافقة" (APPROVE, green) and "رفض" (REJECT, red)
  - Notes field for admin review_notes
  - Previous decisions for this user

On APPROVE: updates order.status to 'pending_driver', triggers match-driver function
On REJECT: updates order.status to 'moderation_rejected', sends notification to user

---

## 14. SUPABASE QUERIES
# Use these exact query patterns. Never write raw SQL in screens or hooks.

### Get user's active order
```typescript
const { data } = await supabase
  .from('orders')
  .select(`*, driver:drivers(*, users!inner(full_name, phone, avatar_url)), order_items(*)`)
  .eq('user_id', userId)
  .not('status', 'in', '("completed","cancelled","moderation_rejected")')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

### Get driver's available orders (pending_driver in their zone)
```typescript
const { data } = await supabase
  .from('orders')
  .select('*, order_moderation!inner(risk_score, ai_intent)')
  .eq('status', 'pending_driver')
  .eq('order_moderation.decision', 'auto_approve')
  .order('created_at', { ascending: true });
```

### Get order with full timeline
```typescript
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    driver:drivers(id, rating_avg, vehicle_type, users!inner(full_name, phone, avatar_url)),
    order_items(*),
    order_moderation(decision, risk_score, ai_intent),
    order_status_log(from_status, to_status, changed_by, timestamp)
  `)
  .eq('id', orderId)
  .single();
```

### Admin moderation queue
```typescript
const { data } = await supabase
  .from('order_moderation')
  .select(`
    *,
    order:orders!inner(
      id, title, description, category, status, created_at,
      user:users!inner(id, full_name, phone, trust_score)
    )
  `)
  .eq('decision', 'manual_review')
  .is('reviewed_at', null)
  .order('created_at', { ascending: true });
```

### Create order (triggers moderation via Edge Function)
```typescript
// Step 1: Insert order
const { data: order } = await supabase
  .from('orders')
  .insert({
    user_id: userId,
    order_type: input.order_type,
    title: input.title,
    description: input.description,
    category: input.category,
    pickup_address: input.pickup_address,
    pickup_lat: input.pickup_lat,
    pickup_lng: input.pickup_lng,
    dropoff_address: input.dropoff_address,
    dropoff_lat: input.dropoff_lat,
    dropoff_lng: input.dropoff_lng,
    status: 'pending_moderation',
  })
  .select()
  .single();

// Step 2: Call ai-analyze Edge Function
const { data: moderation } = await supabase.functions.invoke('ai-analyze', {
  body: { order_id: order.id, title: input.title, description: input.description ?? '' }
});

return { order, moderation };
```

---

## 15. ERROR HANDLING STANDARDS
# Every async operation must follow this exact pattern.

```typescript
// In hooks — always return structured error
async function createOrder(input: CreateOrderInput): Promise<ApiResponse<Order>> {
  try {
    // ... logic
    return { data: order, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
    return { data: null, error: message };
  }
}

// In screens — always handle all three states
const { data: order, isLoading, error } = useQuery(...)

if (isLoading) return <Loader fullScreen />;
if (error) return <EmptyState icon="⚠️" title="حدث خطأ" subtitle={error} />;
if (!order) return <EmptyState icon="📭" title="لا يوجد طلب" />;
```

---

## 16. LOCALIZATION RULES
# JAHEEZ serves a Moroccan audience. Text rules:

- Primary language: Arabic (RTL)
- Secondary language: French (LTR)
- Do NOT hardcode any user-facing string in component files
- All strings go in constants/strings.ts in both languages:
  ```typescript
  export const STRINGS = {
    ar: { home_title: "الرئيسية", new_request: "طلب جديد", ... },
    fr: { home_title: "Accueil", new_request: "Nouvelle demande", ... },
  }
  ```
- Use the useLocale() hook to get current language
- RTL: wrap root in <I18nManager.isRTL ? RTLView : LTRView>
- Numbers: always use Western Arabic numerals (1,2,3 not ١,٢,٣)
- Currency: "25.00 MAD" format, JetBrains Mono font

---

## 17. SECURITY RULES FOR THE CODEBASE
# Every API call must respect these rules.

- Never expose Supabase service role key in mobile apps
- Always use Supabase Row Level Security (RLS) — assume it is enabled
- User can only read/write their own rows (enforced by RLS)
- Driver can only read orders where status='pending_driver' or driver_id=their_id
- Admin endpoints: only accessible when auth.jwt()->>'role' = 'admin'
- Never log phone numbers in full — mask as +212 6** *** **3
- Never log passwords, tokens, or card data
- Sanitize all user text inputs before sending to AI: strip HTML, limit length

---

## 18. TESTING REQUIREMENTS
# Every hook and Edge Function needs tests. Screens need key interaction tests.

For each hook, test:
- Happy path (successful API call)
- Error state (Supabase returns error)
- Loading state transitions

For Edge Functions, test:
- ai-analyze: known good request → auto_approve
- ai-analyze: critical keyword → auto_reject
- ai-analyze: ambiguous request → manual_review
- match-driver: drivers available → assigns closest
- match-driver: no drivers → returns no_drivers_available

---

## 19. WHAT TO SAY WHEN STARTING A NEW TASK

When I give you a task, your response must ALWAYS start with:
1. Which file(s) you will create or modify
2. Which types from shared/types.ts you will use
3. Which hooks you will call
4. Which Supabase tables you will query
5. Whether any new component is needed in components/ui/

Then write the code. Do not start with explanations. Start with the checklist then the code.

---

## 20. FORBIDDEN PATTERNS
# If you write any of these, the output is wrong.

```typescript
// FORBIDDEN: hardcoded color
style={{ backgroundColor: '#EF4444' }}
// CORRECT:
className="bg-[#EF4444]"  // still wrong — use brand token
// CORRECT:
import { BRAND } from '@/constants/brand';
style={{ backgroundColor: BRAND.RED }}

// FORBIDDEN: inline style instead of NativeWind
<View style={{ padding: 16, flexDirection: 'row' }}>
// CORRECT:
<View className="p-4 flex-row">

// FORBIDDEN: any type
const handleData = (data: any) => { ... }
// CORRECT:
const handleData = (data: Order) => { ... }

// FORBIDDEN: business logic in component
export default function OrderCard({ order }: { order: Order }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient(...); // WRONG — never here
  const handleCancel = async () => { // WRONG — belongs in useOrder hook
    await supabase.from('orders').update(...)
  }
}

// FORBIDDEN: direct supabase call in screen
const { data } = await supabase.from('orders').select('*'); // WRONG in screen
// CORRECT: call through hook
const { orders } = useOrder();

// FORBIDDEN: no error/loading state
return <OrderCard order={order} />; // what if order is null? loading?
// CORRECT:
if (isLoading) return <Loader />;
if (!order) return <EmptyState ... />;
return <OrderCard order={order} />;

// FORBIDDEN: setTimeout for navigation
setTimeout(() => router.push('/home'), 2000); // WRONG
// CORRECT:
router.push('/home'); // navigate immediately, use animations for delay

// FORBIDDEN: missing accessibilityLabel
<Pressable onPress={handlePress}> // WRONG
// CORRECT:
<Pressable onPress={handlePress} accessibilityLabel="إلغاء الطلب">
```

---

*End of JAHEEZ Agent Instruction File*
*Version 1.0 — Built from system design documents and AGENTS.md*
*Total tables: 16 | Total screens: 35 | Total hooks: 10 | Total components: 12*
