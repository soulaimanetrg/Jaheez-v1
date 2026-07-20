# JAHEEZ — Execution Playbook

> **Purpose**: Exact operational roadmap from zero to first working user-app prototype. What to do on each day, what "success" means at each step, which docs to use at each moment, and what to do after the first prototype works.

---

## How to Use This Playbook

This is your **day-by-day execution plan**. Follow it sequentially. Each day has:

- 🎯 **Goal**: What you accomplish today
- 📋 **Tasks**: Exact steps in order
- ✅ **Success Means**: How you know you're done
- 📖 **Docs to Reference**: Which documentation files to read
- ⚠️ **Watch Out For**: Common problems for this day

---

## Day 1: Environment Setup

### 🎯 Goal
Get all tools installed, accounts created, and Supabase project configured.

### 📋 Tasks

1. **Install Node.js** (LTS version from nodejs.org)
   - Verify: open terminal, run `node --version` → should show v18+ or v20+

2. **Install VS Code or Cursor** (your IDE with Antigravity)
   - Verify: IDE opens and Antigravity responds to prompts

3. **Install Expo Go** on your phone
   - iPhone: App Store → search "Expo Go"
   - Android: Play Store → search "Expo Go"

4. **Create Supabase account** at supabase.com
   - Create a new project (name it "jaheez" or "jaheez-dev")
   - Copy: Project URL and anon public key (Settings → API)
   - Save these somewhere safe — you'll need them tomorrow

5. **Verify Git is installed**
   - Terminal: `git --version` → should show a version number
   - If not installed: download from git-scm.com

6. **Initialize the project** (if not already done)
   - Tell Antigravity:
   > "Initialize a new Expo project in the user-app directory using Expo SDK 51 with TypeScript template. Set up NativeWind v4 for styling."

7. **Create `.env` file** in user-app/
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

8. **Test that Expo runs**
   - Terminal: `cd user-app && npx expo start`
   - Scan QR code with phone → default app should appear

### ✅ Success Means
- Phone shows the default Expo app
- Terminal has no errors
- Supabase Dashboard is accessible
- `.env` file has both values

### 📖 Docs to Reference
- `BEGINNER_GUIDE.md` → Section 2 (What You Need)
- `ANTIGRAVITY_WORKFLOW.md` → Section 2 (Initial Setup)

### ⚠️ Watch Out For
- Wi-Fi mismatch between phone and computer → use `--tunnel` flag
- Wrong Node.js version → need v18+
- Missing NativeWind setup → Antigravity should handle this

---

## Day 2: Foundation — Types & Tokens

### 🎯 Goal
Create all shared types, constants, and brand tokens. The design system is defined.

### 📋 Tasks

1. **Read the required docs first**:
   - `MASTER_INSTRUCTIONS.md` → Sections 3-5 (Stack, Rules)
   - `FOLDER_STRUCTURE.md` → Section 2 (What Belongs Where)

2. **Create shared types** (use PROMPT F-01 from PROMPT_LIBRARY.md)
   - Tell Antigravity to create `shared/types.ts` and `shared/constants.ts`
   - Verify: all interfaces from JAHEEZ_AGENTS.md Section 5 are present

3. **Create brand tokens** (use PROMPT F-02)
   - `user-app/constants/brand.ts`
   - `user-app/constants/animations.ts`
   - Verify: all BRAND colors and FONTS exported

4. **Create localized strings** (use PROMPT F-04)
   - `user-app/constants/strings.ts`
   - Verify: Arabic and French for all UI text

5. **Run TypeScript check**
   - Terminal: `npx tsc --noEmit`
   - Should have zero errors

6. **Git commit**
   ```
   git add .
   git commit -m "Phase 0: types, constants, brand tokens"
   ```

### ✅ Success Means
- `tsc --noEmit` passes with zero errors
- `brand.ts` exports BRAND with all colors
- `types.ts` exports all interfaces (User, Order, etc.)
- `constants.ts` exports ORDER_STATUSES, CATEGORIES, etc.
- No `any` types in any file

### 📖 Docs to Reference
- `CODING_RULES_FRONTEND.md` → Section 1 (TypeScript Rules)
- `DESIGN_SYSTEM_RULES.md` → Section 2 (Brand Tokens)
- `PROMPT_LIBRARY.md` → Phase 0 Prompts

### ⚠️ Watch Out For
- AI forgetting `as const` on BRAND object
- AI using `process.env` instead of `EXPO_PUBLIC_` prefix
- Missing `CreateOrderInput` interface

---

## Day 3: Foundation — Supabase & API

### 🎯 Goal
Connect to Supabase. Create all API query functions.

### 📋 Tasks

1. **Create Supabase client** (use PROMPT F-03)
   - `user-app/lib/supabase.ts`
   - Verify: imports from `@supabase/supabase-js`, uses env vars

2. **Create API layer** (use PROMPT F-03)
   - `user-app/lib/api.ts`
   - All 9 user-app functions with `ApiResponse<T>` wrappers
   - Verify: no `any` types, all try/catch, returns ApiResponse

3. **Create maps helper** (placeholder)
   - `user-app/lib/maps.ts`
   - Just export empty functions for now

4. **Set up Supabase tables** (in Supabase Dashboard)
   - Go to SQL Editor in Supabase Dashboard
   - Run the CREATE TABLE statements from JAHEEZ_AGENTS.md Section 4
   - Start with: `users`, `orders`, `order_moderation`, `chat_messages`

5. **Test Supabase connection**
   - Create a simple test: call `supabase.from('users').select('count')`
   - If it works → connected!
   - If error → check `.env` values

6. **Git commit**
   ```
   git add .
   git commit -m "Phase 0: supabase client, API layer, database tables"
   ```

### ✅ Success Means
- Supabase connects (no auth errors)
- `api.ts` has all 9 functions with proper types
- Database has core tables created
- `tsc --noEmit` still passes

### 📖 Docs to Reference
- `CODING_RULES_BACKEND.md` → Section 2 (Database Access Patterns)
- `ARCHITECTURE_GUIDE.md` → Section 7 (Supabase Architecture)

### ⚠️ Watch Out For
- Wrong Supabase URL or key in `.env`
- Missing RLS policies (queries return empty)
- AI creating queries directly in components instead of `api.ts`

---

## Day 4-5: UI Component System

### 🎯 Goal
Build all 15+ UI components. The visual building blocks are complete.

### 📋 Tasks

**Day 4: Core Components (8 files)**

1. Search Google Stitch: `"premium mobile component library"`, `"delivery app UI kit"`
2. Build using PROMPT C-01: `Button.tsx`, `Input.tsx`
3. Build using PROMPT C-02: `Card.tsx`, `Badge.tsx`, `StatusBadge.tsx`, `Avatar.tsx`
4. Build using PROMPT C-03: `Loader.tsx`, `EmptyState.tsx`
5. Test each component visually (create a scratch screen)
6. Git commit after every 2-3 components

**Day 5: Remaining Components (7+ files)**

1. Build using PROMPT C-03 continued: `BottomSheet.tsx`, `ShimmerPlaceholder.tsx`
2. Build using PROMPT C-04: `OrderCard.tsx`, `MapMarker.tsx`, `AnimatedTransition.tsx`, `PulseIndicator.tsx`, `ProgressTimeline.tsx`
3. Create barrel export: `components/ui/index.ts`
4. Verify ALL animations work on real device
5. Git commit

### ✅ Success Means
- All 15 components exist in `components/ui/`
- Barrel export in `index.ts` exports all components
- Button shows press animation (scale 0.97)
- Card shows press animation (scale 0.98)
- Input shows focus border transition (BORDER → RED)
- ShimmerPlaceholder shows gradient sweep
- StatusBadge maps all 10 statuses to Arabic labels
- BottomSheet slides up and dismisses on overlay tap
- No business logic in any component

### 📖 Docs to Reference
- `DESIGN_SYSTEM_RULES.md` → Sections 5-6 (Component Specs, Animation System)
- `CODING_RULES_FRONTEND.md` → Section 6 (Component Rules)

---

## Day 6-7: Hooks & State Stores

### 🎯 Goal
Build all business logic hooks and Zustand stores.

### 📋 Tasks

**Day 6: Auth & Order Hooks**

1. Build using PROMPT H-01: `authStore.ts`, `useAuth.ts`
2. Build using PROMPT H-02: `orderStore.ts`, `useOrder.ts`
3. Test: `useAuth().signIn()` connects to Supabase
4. Git commit

**Day 7: Real-time & Remaining Stores**

1. Build using PROMPT H-03: `useTracking.ts`, `useChat.ts`, `useLocation.ts`
2. Build stores: `cartStore.ts`, `locationStore.ts`
3. Verify: Realtime subscriptions have cleanup code
4. Git commit

### ✅ Success Means
- `useAuth` can sign in, sign up, verify OTP, and sign out
- `useOrder` uses React Query for fetching and mutations
- `useTracking` subscribes and unsubscribes from Realtime channels
- `useChat` loads messages and subscribes to new ones
- `authStore` persists to AsyncStorage
- All hooks return typed objects with `isLoading` and `error`

### 📖 Docs to Reference
- `CODING_RULES_FRONTEND.md` → Section 5 (Hook Rules)
- `CODING_RULES_BACKEND.md` → Section 6 (Real-Time Patterns)

---

## Day 8-9: Auth Screens

### 🎯 Goal
Complete authentication flow. User can register, login, and verify OTP.

### 📋 Tasks

**Day 8:**
1. Search Google Stitch for auth screen references
2. Build using PROMPT A-01: auth `_layout.tsx`, `splash.tsx`, `onboarding.tsx`
3. Test: splash loads → checks session → navigates correctly
4. Test: onboarding slides work with dot indicators

**Day 9:**
1. Build using PROMPT A-02: `login.tsx`, `register.tsx`
2. Build using PROMPT A-03: `otp.tsx`
3. Test full flow: splash → onboarding → login → OTP → (redirect)
4. Git commit

### ✅ Success Means
- Splash shows logo and redirects within 2 seconds
- Onboarding slides with dot indicators and skip link
- Login validates phone/password, shows errors, connects to Supabase
- Register validates all fields including phone format
- OTP auto-advances, auto-submits, shows countdown
- All screens have loading and error states
- Keyboard doesn't cover inputs

---

## Day 10-11: Tabs & Home Screen

### 🎯 Goal
Bottom navigation works. Home screen displays all sections.

### 📋 Tasks

**Day 10:**
1. Search Google Stitch for home screen and tab bar references
2. Build using PROMPT T-01: tab `_layout.tsx`, `index.tsx` (Home)
3. Test: 5 tabs visible, home screen loads with all sections

**Day 11:**
1. Build using PROMPT T-02: `orders.tsx`, `chat.tsx`, `profile.tsx`
2. Build stub for `search.tsx`
3. Test: all tabs navigate correctly, profile shows user info
4. Test: logout works (profile → confirm → splash)
5. Git commit

### ✅ Success Means
- Bottom tab bar shows 5 tabs with correct icons
- Tab switch has smooth animation
- Home screen shows: header, search bar, categories, new request button, recent orders
- Orders screen filters between all/active/completed/cancelled
- Profile shows user info and trust score
- Logout confirms and redirects to splash

---

## Day 12-13: Order Creation Flow

### 🎯 Goal
User can create a request that goes through AI moderation.

### 📋 Tasks

**Day 12:**
1. Search Google Stitch for order creation form references
2. Build using PROMPT R-01: `custom-request.tsx`
3. Test: form fills correctly, validation works, submit triggers loading state

**Day 13:**
1. Build using PROMPT R-02: `confirmation.tsx`
2. Test all three moderation outcomes:
   - Auto-approve → confirmation screen
   - Manual review → bottom sheet with "under review" message
   - Auto-reject → error card display
3. Git commit

### ✅ Success Means
- Custom request form has all fields with validation
- AI moderation runs after submission
- All three moderation paths display correctly
- Confirmation shows animated checkmark and order reference
- Navigation uses `router.replace` (no back to form)

---

## Day 14-15: Tracking & Chat

### 🎯 Goal
User can track orders on a map and chat with drivers.

### 📋 Tasks

**Day 14:**
1. Search Google Stitch for tracking and map UI references
2. Build using PROMPT TC-01: `tracking/[id].tsx`
3. Test: map loads, markers display, status timeline shows

**Day 15:**
1. Build using PROMPT TC-02: `chat/[id].tsx`
2. Test: messages display, input sends messages, disabled when order closed
3. Run REVIEW_CHECKLIST.md against ALL files
4. Fix any violations
5. Final git commit

### ✅ Success Means
- Tracking map shows all markers
- Bottom sheet shows correct content per status
- Chat messages display (user/driver/system styles)
- Chat input disabled when order completed
- REVIEW_CHECKLIST passes with zero violations

---

## After the Prototype

### 🎯 Your first working prototype is done. Now what?

### Immediate Next Steps

1. **Test all user journeys** (see REVIEW_CHECKLIST.md Section 9)
   - Journey 1: Register → Login → Home → Create request → Track
   - Journey 2: Create request → AI flags → Manual review waiting
   - Journey 3: Create request → AI rejects → Error display

2. **Polish animations** — verify all animations work at 60fps on real device

3. **Set up the Edge Functions** on Supabase
   - Create `ai-analyze` Edge Function (PROMPT B-01)
   - Create `match-driver` and `send-notification` (PROMPT B-02)

4. **Start Driver App** (Phase 4 of BUILD_PHASES.md)
   - Mirror foundation from user-app
   - Build driver-specific screens

5. **Start Admin Panel** (Phase 5)
   - Next.js 14 project
   - Moderation queue is the priority

### Medium-Term

| Priority | Task |
|---|---|
| 1 | Real AI moderation with Gemini API |
| 2 | Driver app (available orders, active trip) |
| 3 | Admin moderation queue |
| 4 | Push notifications via Expo |
| 5 | Payment integration (card payments) |
| 6 | Store browsing / menu ordering |

---

## Playbook Summary

| Day | Phase | Files Created | Success Indicator |
|---|---|---|---|
| 1 | Setup | Project scaffold, .env | Expo Go shows app |
| 2 | Foundation | types.ts, constants.ts, brand.ts | tsc passes |
| 3 | Foundation | supabase.ts, api.ts | Supabase connects |
| 4-5 | UI System | 15+ components | All animated correctly |
| 6-7 | Hooks/State | 6 hooks, 4 stores | Auth connects |
| 8-9 | Auth | 6 auth screens | Full auth flow works |
| 10-11 | Tabs | 6 tab screens | All tabs navigate |
| 12-13 | Request | Request + confirmation | AI moderation works |
| 14-15 | Tracking/Chat | Tracking + chat | Map + messages work |

**Total: 15 working days to a functional user-app MVP.**

---

*Follow this playbook step by step. Don't skip days. Don't rush ahead. Building correctly is faster than rebuilding incorrectly.*
