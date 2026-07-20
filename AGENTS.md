# JAHEEZ — Project Intelligence File
# Read this before every task. This is the single source of truth.

## STRICT SECURITY RULEBOOK — READ FIRST

Before modifying code, read:

- `docs/JAHEEZ_STRICT_AI_SECURITY_RULES.md`

That file supersedes older documentation when there is any conflict.

Current non-negotiable architecture:

`Frontend UI -> Backend API/Socket contract -> Routes -> Middleware/Validators -> Controllers -> Services -> Repositories -> Supabase/PostgreSQL`

Frontend apps are display clients only. Do not put pricing, promos, permissions, fraud, finance, dispatch, payout, delay, reliability, direct Supabase business queries, or production mock/fallback data in frontend code.

## WHAT IS JAHEEZ
Smart delivery + errand platform. Morocco market (Safi region).
Users order food/groceries/anything legal. Drivers accept tasks.
Admins monitor, detect risky requests, manage platform.
Three separate apps: User App · Driver App · Admin Panel (web).

## TECH STACK
- Mobile (iOS + Android): Expo SDK 55 + React Native 0.83 + Expo Router v3
- Styling: StyleSheet.create() + brand.ts tokens (NativeWind v4 is configured but not actively used)
- State: Zustand (local/realtime) + React Query (server/cache)
- Backend: Node/Express MVC service layer over Supabase/PostgreSQL/Auth/Storage
- Maps: react-native-maps + Google Maps API
- AI: Gemini API via Supabase Edge Functions (planned)
- Admin Panel: Vite + React 18 + Tailwind CSS
- Language: TypeScript strict mode everywhere
- Build: EAS (Expo Application Services) for iOS + Android

## BRAND IDENTITY
Name: JAHEEZ (جاهز — means "Ready" in Arabic)
Logo: Red wordmark on yellow background
Tagline: "Smart Delivery & Errands"

## BRAND TOKENS (constants/brand.ts — NEVER hardcode these values)
### Primary Colors (from logo)
YELLOW = "#F5CE2E"           // brand yellow — backgrounds, accents
YELLOW_DARK = "#C9A800"      // pressed yellow
YELLOW_LIGHT = "#FFFBEE"     // tinted yellow surfaces
RED = "#F03030"              // brand red — logo, primary CTA, active states
RED_DARK = "#C42020"         // pressed red
RED_LIGHT = "#FDEAEA"        // tinted red surfaces

### UI Colors
SURFACE = "#FFFFFF"          // cards, modals
BG = "#FEFDF8"               // screen backgrounds (warm white)
CREAM = "#FFFBEE"            // cream — section backgrounds
LIGHT = "#F5F4F0"            // light gray — secondary backgrounds
TEXT = "#1C1C1E"             // primary text (charcoal)
TEXT2 = "#5C5C5E"            // medium gray — secondary text
TEXT3 = "#9CA3AF"            // light gray — tertiary/placeholder text
BORDER = "#E8E6DF"           // borders, dividers
INPUT_BG = "#FFFFFF"         // form fields
GREEN = "#2DB87A"            // success, delivered
ERROR = "#DC2626"            // error states (distinct from brand red)
WARN = "#F5A623"             // pending, delay
BLUE = "#3A8FE8"             // informational

### Spacing & Radius
RADIUS_CARD = 16
RADIUS_INPUT = 12
RADIUS_PILL = 9999
SHADOW = "0 2px 12px rgba(0,0,0,0.08)"

## FOLDER STRUCTURE
jaheez/
  assets/             — Logo, fonts, shared images
  user-app/           — Expo app for customers
    app/
      (auth)/          — splash, onboarding, login, register, otp
      (tabs)/          — home, search, orders, chat, profile
      (flows)/         — store, cart, checkout, custom-request, ai-suggestion, tracking, confirmation
    components/ui/     — Button, Input, Card, Badge, Avatar, BottomSheet, Loader, MapMarker
    store/             — Zustand slices
    hooks/             — useAuth, useOrder, useLocation, useTracking, useChat
    constants/         — brand.ts (ALL tokens here, nowhere else)
    lib/               — supabase.ts, api.ts, maps.ts
  driver-app/          — Expo app for drivers (same structure as user-app)
  admin/               — Next.js web admin panel
    app/               — dashboard, requests, risk, users, drivers, payments, settings
    components/        — sidebar, data-table, charts, modals
  supabase/
    migrations/        — SQL migration files
    functions/         — Edge Functions (ai-analyze, match-driver, send-notification)
  shared/
    types.ts           — ALL TypeScript interfaces shared across apps
    constants.ts       — shared enums and constants

## CODING RULES (NEVER break these)
- NEVER hardcode colors — always import from constants/brand.ts
- NEVER use inline styles in React Native — always use StyleSheet.create() with brand.ts tokens
- ALWAYS add accessibilityLabel to every Pressable and Image
- ALWAYS use TypeScript — no `any` type allowed
- ALWAYS use named exports — no default exports except screen files
- NEVER put business logic in UI components or hooks — call backend API/services only
- NEVER query Supabase business tables from frontend production code
- NEVER add production mock/fallback stores, products, orders, prices, roles, users, or status transitions
- ALWAYS handle loading + error states in every screen
- NEVER duplicate code — if used twice, it goes in components/ui/
- ALWAYS use React Query for server data fetching
- ALWAYS use Zustand for state that is shared between screens
- File names: PascalCase for components, camelCase for hooks/utils
- Use RED as primary button color everywhere (matches brand)
- YELLOW for backgrounds and accent elements
- Bottom sheets: always use the shared BottomSheet component
- Navigation: always use Expo Router's router.push(), router.replace()

## UI STYLE
- Buttons: 52px height, pill radius, Cairo semibold
- Cards: white bg, 16px radius, SHADOW, 16px padding
- Inputs: 52px height, 12px radius, INPUT_BG fill, RED focus border
- Bottom nav: 64px + safe area, white bg, 1px top border
- Top nav: 56px, white, title bold center, back arrow 44px touch
- Fonts: Cairo (display/body — Arabic-first font family)
- Spacing: 8px grid — all padding/margin multiples of 8

## SUPABASE TABLES
users, drivers, orders, order_moderation, chat_messages, payments,
driver_locations, fraud_flags, reviews, order_status_log, order_items,
moderation_rules, banned_keywords, notifications, user_verifications,
driver_verifications

## DO NOT DO THESE
- Do NOT install new packages without asking me first
- Do NOT modify supabase/migrations/ files that already exist
- Do NOT change the folder structure without approval
- Do NOT use class components — functional only
- Do NOT commit .env files or secrets
- Do NOT use setTimeout for navigation — use proper routing

## IMAGE REFERENCES
When I attach an image, it is a UI design.
Match the layout, colors, and component positions EXACTLY.
Use brand tokens from constants/brand.ts for all colors.
If something in the image doesn't match the rules above, follow the rules.
