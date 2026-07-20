# APP STRUCTURE AUDIT — JAHEEZ

> **Generated:** 2026-05-05 | **Method:** Full directory tree inspection

---

## Root Folder Structure

```
jaheez/
├── .agent/                  # AI agent configs (skills, workflows, scripts)
├── .agents/                 # Duplicate/separate agent skills folder
├── .augment/                # Augment AI config
├── .config/                 # IDE/tool config
├── .env                     # Root environment variables (SECRETS EXPOSED)
├── .expo/                   # Expo cache (root level — unusual)
├── .git/                    # Git repository
├── .kluster/                # Kluster code review configs
├── .local/                  # Local config
├── .replit                  # Replit configuration (legacy)
├── .vscode/                 # VS Code settings
│
├── AGENTS.md                # Project intelligence file (AI coding rules)
├── DRIVER_ACQUISITION_DESIGN.md  # Driver onboarding strategy doc
├── GAP_ANALYSIS.md          # Feature gap analysis
├── JAHEEZ_*.md              # Multiple large planning/spec documents
├── LOCAL_JAHEEZ_WORKFLOW.md  # Local development workflow
├── README.md                # EMPTY (just "# Jaheez")
├── replit.md                # Replit-specific dev docs
│
├── user-app/                # ★ Customer mobile app (Expo/React Native)
├── driver-app/              # ★ Driver mobile app (Expo/React Native)
├── admin/                   # ★ Admin web panel (Vite + React)
├── shared/                  # Shared TypeScript types & constants
├── scripts/                 # Backend scripts (admin API, seeding)
├── supabase_migrations/     # SQL migration files (only 1 file)
├── supabase_schema.sql      # Complete DB schema (889 lines)
│
├── design/                  # ChatGPT-generated design mockup images (14 PNGs)
├── attached_assets/         # Pasted prompts, screenshots, and references
├── artifacts/               # Generated artifacts (mockup sandbox)
├── html-preview/            # HTML/CSS UI mockups (16 pages + styles)
├── jaheez icons/            # Icons and illustrations (separate from apps)
├── jaheez-temp/             # Abandoned Expo starter project
├── jaheez_workspace/        # HTML/CSS design system (theme.css, components.css)
│
├── server.js                # Simple HTTP server for html-preview
├── package.json             # Root deps (Express, Supabase, Stripe, etc.)
├── docs/                    # 23 documentation files
├── docs.rar                 # Compressed docs archive
├── soulaimanr.rar           # 26MB archive (unknown contents)
└── node_modules/            # Root node_modules
```

---

## User App Structure (`user-app/`)

```
user-app/
├── app/
│   ├── _layout.tsx          # Root layout (providers, error boundary)
│   ├── index.tsx            # Entry point (splash → auth/tabs redirect)
│   ├── (auth)/
│   │   ├── _layout.tsx      # Auth stack layout
│   │   ├── splash.tsx       # Branded splash screen
│   │   ├── welcome.tsx      # Welcome/landing screen
│   │   ├── onboarding.tsx   # Onboarding slides
│   │   ├── login.tsx        # Phone+password login (21KB)
│   │   ├── register.tsx     # Registration (27KB)
│   │   └── otp.tsx          # OTP verification (10KB)
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Custom tab bar with FAB
│   │   ├── index.tsx        # Home screen (24KB)
│   │   ├── search.tsx       # Search (28KB)
│   │   ├── orders.tsx       # Orders list (27KB)
│   │   ├── chat.tsx         # Chat conversations (16KB)
│   │   ├── profile.tsx      # Profile (13KB)
│   │   └── wallet.tsx       # Redirect stub (6 lines)
│   └── (flows)/
│       ├── store/[id].tsx   # Store detail + menu (29KB)
│       ├── category/[id].tsx # Category listing (16KB)
│       ├── cart.tsx          # Shopping cart (20KB)
│       ├── checkout.tsx      # Checkout flow (29KB)
│       ├── order/[id].tsx    # Order detail (29KB)
│       ├── tracking/[id].tsx # Live order tracking (20KB)
│       ├── chat/[id].tsx     # In-order chat (10KB)
│       ├── custom-request.tsx # Errand creation (25KB)
│       ├── confirmation.tsx  # Order confirmation (8KB)
│       ├── payment-success.tsx # Payment success (3KB)
│       ├── notifications.tsx # Notification list (9KB)
│       ├── favorites.tsx     # Favorites list (12KB)
│       ├── addresses.tsx     # Saved addresses (20KB)
│       ├── payment-methods.tsx # Payment methods (20KB)
│       ├── settings.tsx      # Settings (22KB)
│       ├── profile-edit.tsx  # Edit profile (14KB)
│       ├── support-ticket.tsx # Support ticket (15KB)
│       ├── faq.tsx           # FAQ screen (13KB)
│       ├── terms.tsx         # Terms & conditions (9KB)
│       └── delete-account.tsx # Account deletion (16KB)
├── components/ui/           # 26 reusable components (see below)
├── constants/
│   ├── brand.ts             # Design tokens (179 lines)
│   ├── strings.ts           # AR/FR string tables (247 lines)
│   └── animations.ts        # Animation presets (18 lines)
├── hooks/
│   ├── useAuth.ts           # Auth hook (7KB)
│   ├── useAnimations.ts     # Animation utilities (1.6KB)
│   ├── useLocation.ts       # Location hook (1.5KB)
│   ├── useNetworkStatus.ts  # Network status (1.2KB)
│   ├── usePushNotifications.ts # Push notifications (3.7KB)
│   ├── useTracking.ts       # Order tracking (3KB)
│   ├── useTranslatedText.ts # Translation hook (2KB)
│   ├── mutations/           # 3 mutation hooks
│   └── queries/             # 6 query hooks
├── store/
│   ├── authStore.ts         # Auth state (Zustand)
│   ├── cartStore.ts         # Cart state (Zustand)
│   ├── languageStore.ts     # Language state + ModernMT (Zustand)
│   ├── locationStore.ts     # Location state (minimal)
│   ├── orderStore.ts        # Order state (minimal)
│   └── platformStore.ts     # Platform config state
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── authApi.ts           # Auth API (416 lines)
│   ├── api.ts               # General API helpers
│   ├── fallbackApi.ts       # Mock data fallback API (16KB)
│   ├── mockData.ts          # Mock data (559 lines)
│   ├── storeApi.ts          # Store/menu API
│   ├── orderApi.ts          # Order API
│   ├── placesApi.ts         # Google Places API
│   ├── walletApi.ts         # Wallet API
│   ├── supportApi.ts        # Support ticket API
│   ├── infobipOtp.ts        # Infobip SMS OTP
│   ├── stripeClient.ts      # Stripe client setup
│   ├── modernmt.ts          # ModernMT translation API
│   ├── maps.ts              # Map utilities
│   ├── schemas.ts           # Zod validation schemas
│   ├── adminApi.ts          # Admin API URL helper
│   └── notificationInbox.ts # Notification inbox helpers
├── assets/
│   ├── icons/               # 6 PNG tab bar icons (custom)
│   └── illustrations/       # 10 PNG illustrations (3D-style, AI-generated)
├── web/                     # Web-specific files (Expo web support)
├── expo-new/                # Abandoned Expo starter project
├── android/                 # Android native project (auto-generated)
├── package.json             # Expo SDK 55, React 19.2, NativeWind 4
├── app.json                 # Expo config
├── babel.config.js          # Babel with NativeWind + Reanimated
├── metro.config.js          # Metro with NativeWind, monorepo support
├── tailwind.config.js       # Tailwind (CONFLICTING color palette)
├── tsconfig.json            # TypeScript config
└── global.css               # Tailwind base directives only
```

---

## Driver App Structure (`driver-app/`)

```
driver-app/
├── app/
│   ├── _layout.tsx          # Root layout (simpler than user-app)
│   ├── index.tsx            # Entry redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx      # Driver welcome
│   │   ├── login.tsx        # Driver login (3KB)
│   │   ├── register.tsx     # Driver register (5KB)
│   │   ├── otp.tsx          # OTP verify (3.9KB)
│   │   └── pending.tsx      # KYC pending screen (7KB)
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab layout (3 tabs)
│   │   ├── index.tsx        # Delivery queue/home (15KB)
│   │   ├── earnings.tsx     # Earnings dashboard (6.6KB)
│   │   └── profile.tsx      # Driver profile (10KB)
│   └── (flows)/
│       ├── _layout.tsx
│       ├── active-delivery.tsx # Active delivery flow (13KB)
│       └── payout-request.tsx  # Payout request (4.6KB)
├── constants/brand.ts       # Driver brand tokens (minimal, mirrors user-app)
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── api.ts               # Driver API functions
│   └── i18n.ts              # AR/FR translations (9KB)
├── store/driverStore.ts     # Driver state (minimal)
├── assets/                  # EMPTY — no icons or images
├── package.json             # Expo SDK 55, React 19.2
└── [config files]
```

**Assessment:** Driver app has a reasonable structure but is **significantly less developed** than the user app. No shared component library, no assets, smaller API layer.

---

## Admin Panel Structure (`admin/`)

```
admin/
├── src/
│   ├── App.tsx              # Router with 22 page routes + auth guard
│   ├── main.tsx             # Entry point (React Router + QueryClient)
│   ├── index.css            # Tailwind CSS import
│   ├── pages/               # 22 admin pages (see SCREEN_AND_FEATURE_STATUS.md)
│   ├── components/
│   │   ├── layout/          # AdminLayout, Header, Sidebar (3 files)
│   │   └── ui/              # Badge, FormField, Modal, StatCard (4 files)
│   ├── hooks/               # Empty directory
│   ├── store/authStore.ts   # Admin auth store (1.9KB)
│   ├── lib/
│   │   ├── api.ts           # Admin API client (18KB)
│   │   └── supabase.ts      # Supabase client
│   └── types/index.ts       # Admin-specific types
├── .env                     # Supabase URL + anon key
├── package.json             # Vite + React 18, Tailwind, Lucide icons
└── [config files]
```

**Assessment:** Admin panel is the **most functionally complete** part of the project. It has 22 fully coded pages, a working auth system, and covers a wide range of operations.

---

## Component Library Status (`user-app/components/ui/`)

| Component | Size | Purpose |
|-----------|------|---------|
| AnimatedPressable | 1.2KB | Pressable with scale animation |
| AnimatedTransition | 1.2KB | Fade/slide transition wrapper |
| Avatar | 1.3KB | User avatar display |
| Badge | 2.6KB | Status/label badge |
| BottomSheet | 3.1KB | Modal bottom sheet |
| Button | 2.8KB | Primary button component |
| Card | 1.1KB | Card container |
| EmptyState | 1KB | Empty state placeholder |
| FadeInView | 0.7KB | Fade-in animation wrapper |
| ForceUpdateModal | 3.3KB | Force app update modal |
| Input | 3.9KB | Form input field |
| Loader | 0.8KB | Loading spinner |
| MaintenanceBanner | 1.3KB | Maintenance mode banner |
| MapMarker | 0.9KB | Map marker component |
| OTPInput | 3KB | OTP digit input |
| OfflineBanner | 1.5KB | Offline status banner |
| OrderCard | 3.1KB | Order summary card |
| ProgressTimeline | 2.4KB | Order status timeline |
| PulseIndicator | 1.6KB | Pulsing activity indicator |
| ScreenWrapper | 1.3KB | Safe area screen wrapper |
| ShimmerPlaceholder | 1KB | Loading shimmer effect |
| SkeletonBox | 2.9KB | Skeleton loading placeholder |
| StatusBadge | 2.2KB | Order status badge |
| TText | 0.5KB | Translated text component |
| TopNav | 2.5KB | Top navigation bar |
| index.ts | 0.5KB | Barrel export file |

**Assessment:** Good component library foundation. Components follow the brand token system. Missing: StoreCard, MenuItemCard, ProductCard, SearchBar, ReviewCard, PromoCard, AddressCard, and similar domain-specific components.

---

## Routing Structure

### User App Routes
```
/                        → Splash → redirect to auth or tabs
/(auth)/splash           → Branded splash animation
/(auth)/welcome          → Welcome screen
/(auth)/onboarding       → Onboarding slides
/(auth)/login            → Phone + password login
/(auth)/register         → Registration
/(auth)/otp              → OTP verification
/(tabs)/index            → Home screen
/(tabs)/search           → Search
/(tabs)/orders           → Orders list
/(tabs)/chat             → Chat conversations
/(tabs)/profile          → Profile
/(tabs)/wallet           → Redirect to home (stub)
/(flows)/store/[id]      → Store detail + menu
/(flows)/category/[id]   → Category listing
/(flows)/cart             → Cart
/(flows)/checkout         → Checkout
/(flows)/order/[id]       → Order detail
/(flows)/tracking/[id]    → Live tracking
/(flows)/chat/[id]        → Order chat
/(flows)/custom-request   → Custom errand
/(flows)/confirmation     → Order confirmation
/(flows)/payment-success  → Payment success
/(flows)/notifications    → Notifications
/(flows)/favorites        → Favorites
/(flows)/addresses        → Saved addresses
/(flows)/payment-methods  → Payment methods
/(flows)/settings         → Settings
/(flows)/profile-edit     → Edit profile
/(flows)/support-ticket   → Support
/(flows)/faq              → FAQ
/(flows)/terms            → Terms
/(flows)/delete-account   → Delete account
```

### Admin Routes
```
/login                    → Admin login
/dashboard                → Main dashboard
/orders                   → Order management
/stores                   → Store management
/products                 → Product management
/users                    → User management
/drivers                  → Driver management
/payouts                  → Driver payouts
/support                  → Support tickets
/promotions               → Promo management
/notifications            → Notification management
/settings                 → Platform settings
/analytics                → Analytics dashboard
/admins                   → Admin user management
/banners                  → Banner management
/zones                    → Delivery zone management
/reviews                  → Review management
/categories               → Category management
/cities                   → City management
/refunds                  → Refund management
/wallets                  → Wallet management
/audit-logs               → Audit log viewer
```

---

## Organization Assessment

### ✅ Well Organized
- Clear app separation (user/driver/admin)
- Shared types centralized
- Component library exists
- Hooks are properly separated from components
- Store files are organized by domain

### ⚠️ Needs Improvement
- Root directory is cluttered with ~10 large markdown planning docs
- Multiple abandoned/temp directories (`expo-new`, `jaheez-temp`, `jaheez_workspace`)
- Design assets scattered across `design/`, `jaheez icons/`, `attached_assets/`
- Root `package.json` has backend deps mixed with root-level config
- `.env` files with real secrets in 3 locations
- HTML mockup files in `html-preview/` serve no current purpose
- `docs/` has 23 files but many overlap or contradict each other
- RAR archives in root (`docs.rar`, `soulaimanr.rar`) add clutter
