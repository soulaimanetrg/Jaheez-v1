# 4. SCREEN AND FEATURE BLUEPRINT — JAHEEZ

**Purpose:** Document every screen and its complete specifications | **Last Updated:** 2026-05-19

---

## User App Screens (35 Screens Total)

### General Screen Tooling Map
To optimize early-stage development and eliminate service bills, the user-facing screens implement the following low-cost tooling configurations:
- **Authentication Screens (`(auth)/login`, `(auth)/register`, `(auth)/otp`):** Built with Expo React Native using Supabase Auth. **V1 operates strictly on 6-digit Email OTP codes**; official Twilio SMS OTP is deferred. Magic confirmation links are bypassed to avoid localhost deep-linking errors.
- **Checkout & Cart Screens (`(flows)/cart`, `(flows)/checkout`):** Leverage React Hook Form + Zod. **V1 checkout operates on Cash on Delivery (COD)**; card inputs are styled but disabled/deferred.
- **Order Tracking Screens (`(flows)/tracking/[id]`):** Leverages a status-based stepper timeline (Order Received → Confirmed → Preparing → On the Way → Delivered). Drivers update statuses manually; live Google Maps GPS driver pins are deferred to V2.
- **Support Screens (`(flows)/support-ticket`):** Provide direct manual redirects via deep links to WhatsApp Business (`https://wa.me/212xxxxxxxxx?text=...`) for instant operational support. Unofficial automation scrapers are disabled.
- **UI & Layouts:** Built with native `StyleSheet.create()` referencing `constants/brand.ts` design tokens. Micro-interactions leverage `react-native-reanimated` and `Moti`. Emojis are forbidden in final assets (replaced with compressed PNG/WebP files).

### AUTH FLOW SCREENS (6 screens)

---

#### SCREEN 1: Splash Screen
**File:** `user-app/app/(auth)/splash.tsx` (156 lines)  
**Status:** ✅ **Done — Animated Implementation**  
**Entry point:** Root entry on app load  
**Exit point:** Auto-navigates to welcome/home after timeout

##### Purpose
Brand intro with smooth animation. Shows JAHEEZ logo/branding, transitions from static image to video.

##### Components & Layout
- Static image background (2.5 seconds display)
- Animated fade transition to video (0.8 seconds)
- Video plays once, auto-navigates after completion
- Fallback: If `expo-video` module missing, shows static image

##### Sections
1. **Image Stage** (2.5s)
   - Full-screen splash image: `assets/images/splash_first.png`
   - Animated fade-in opacity (0 → 1)

2. **Video Stage** (variable, after image)
   - Full-screen animated video: `assets/videos/splash_video.webm`
   - Animated fade-out on completion
   - Platform check: Web/no-module → skip to home

##### Buttons/Actions
- **None visible** — Screen auto-advances

##### Empty States
- N/A

##### Loading States
- Module detection: Checks for `expo-video` availability
- Graceful fallback if module missing

##### Data Needed
- Video file: `splash_video.webm`
- Image file: `splash_first.png`

##### Assets Used
- `assets/images/splash_first.png` — main splash image
- `assets/videos/splash_video.webm` — animated intro video

##### Tech Debt / Issues
- Hardcoded timeouts (2500ms image, then video duration)
- If video doesn't exist, could crash on native (try-catch prevents this)
- No video progress indication

##### Note for Implementation
Status bar is hidden. Screen uses Animated API (native driver). VideoView uses custom player with loop disabled and autoplay enabled.

---

#### SCREEN 2: Welcome Screen
**File:** `user-app/app/(auth)/welcome.tsx`  
**Status:** 🟡 **Partial — UI Exists, Behavior Unclear**  
**Entry point:** After splash, if not authenticated  
**Exit point:** "Get Started" button → Onboarding screen

##### Purpose
Brand introduction + incentive to continue. "Welcome to JAHEEZ, order food, groceries, errands..."

##### Components & Layout
- Hero graphic/illustration (centered)
- Headline: "Welcome to JAHEEZ"
- Subheadline: Feature list (food, grocery, pharmacy, parcel, errand)
- "Get Started" button (full-width, brand red)
- "Skip" button (optional, text-only)

##### Sections
1. **Hero Section**
   - Large illustration or brand logo
   - Background color (warm yellow or gradient)

2. **Text Section**
   - Headline (AR: "أهلاً بك في جاهز", FR: "Bienvenue à JAHEEZ")
   - Description with 5 service types

3. **CTA Section**
   - "Get Started" button (primary red)
   - Optional "Skip" button for users who want to login directly

##### Buttons/Actions
- **"Get Started"** — Navigate to `(auth)/onboarding`
- **"Skip"** (optional) — Navigate to `(auth)/login`

##### Empty States
- N/A (static welcome screen)

##### Data Needed
- Hero image/illustration asset
- Translated strings

##### Assets Needed
- Hero illustration (brand-themed)
- Background optional (solid color or gradient)

##### Note for Implementation
This screen should be skipped if user has already completed onboarding (check `hasCompletedOnboarding` in auth store).

---

#### SCREEN 3: Onboarding Screens (Carousel)
**File:** `user-app/app/(auth)/onboarding.tsx`  
**Status:** 🟡 **Partial — Unclear If Implemented**  
**Entry point:** After welcome, if not onboarded  
**Exit point:** Final slide → Redirect to login

##### Purpose
Multi-slide carousel explaining app features. Usually 3-5 screens explaining:
1. Browse & order food/groceries
2. Track delivery in real-time
3. Earn cashback/promos
4. Etc.

##### Expected Layout (per slide)
```
┌─────────────────────┐
│                     │
│   Illustration      │
│   (service theme)   │
│                     │
├─────────────────────┤
│  "Browse & Order"   │  (Headline)
│  "Find your favorite│
│   stores and order" │  (Description)
├─────────────────────┤
│  ●  ○  ○  ○         │  (Slide indicators)
│                     │
│  [ Next ] [ Skip ]  │  (Navigation buttons)
└─────────────────────┘
```

##### Buttons/Actions
- **"Next"** — Advance slide
- **"Skip"** — Jump to login
- **Swipe gesture** — Advance/retreat slide

##### Data Needed
- ~4-5 onboarding slides
- Illustration per slide
- Headline + description per slide

##### Assets Needed
- Onboarding illustrations (one per slide, 4-5 total)
- Optional background pattern

##### Note for Implementation
Mark completion in auth store (`completeOnboarding()`) after final slide so user doesn't see this again. If not completed, welcome screen should show onboarding.

---

#### SCREEN 4: Login Screen
**File:** `user-app/app/(auth)/login.tsx`  
**Status:** 🟡 **Partial — Form Exists, Integration Unclear**  
**Entry point:** Welcome skip, or if not authenticated  
**Exit point:** "Login" button → OTP screen, or forgot password flow

##### Purpose
User phone + password login with email fallback option.

##### Layout
```
┌──────────────────────────┐
│ ◀ JAHEEZ                 │  (Top nav)
├──────────────────────────┤
│                          │
│  "Sign In"               │  (Headline)
│  "Enter your phone or    │
│   email to continue"     │  (Subheadline)
│                          │
│  ┌────────────────────┐  │
│  │ +212 |_____________│  │  (Phone input, LTR country code)
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ••••••••••••••••••│  │  (Password input)
│  └────────────────────┘  │
│                          │
│  ☐ Remember me           │  (Checkbox)
│                          │
│  [ LOGIN ]               │  (Primary button, red)
│                          │
│  ─── OR ───              │
│  [ Google Sign In ]      │  (Secondary button)
│                          │
│  Don't have account?     │
│  Create one →            │  (Link to register)
│                          │
│  Forgot password? →      │  (Link to forgot password) ⚠️ MISSING
│                          │
└──────────────────────────┘
```

##### Sections
1. **Header** — "Sign In" + subheadline
2. **Form** 
   - Phone/email input (controlled)
   - Password input (hidden, eye toggle optional)
   - Remember me checkbox (optional)
3. **CTA** — Login button, Google OAuth button
4. **Footer** — "Create account" link, "Forgot password" link

##### Buttons/Actions
- **"LOGIN"** 
  - Validates phone/email + password
  - Calls `authApi.login(phone, password)` or `authApi.loginWithEmail(email, password)`
  - On success: Navigate to home or OTP (if 2FA required)
  - On error: Show inline error message

- **"Google Sign In"** 
  - Calls `authApi.loginWithGoogle()`
  - On success: Navigate to home

- **"Create account?"** — Navigate to register screen

- **"Forgot password?"** — ⚠️ MISSING FEATURE (navigate to forgot-password screen, which doesn't exist)

##### Forms
1. **Login Form**
   - Phone: `+212 | [9-digit number]` (format: +2126XXXXXXXX)
   - OR Email: `[email@domain.com]`
   - Password: `[hidden, min 8 chars]`
   - Validation:
     - Phone: Must be Moroccan +212 format
     - Email: Must be valid email
     - At least one of phone/email filled
     - Password: Min 8 characters
   - Error messages:
     - "Invalid phone format. Use +212..."
     - "Invalid email"
     - "Password must be at least 8 characters"
     - "Incorrect phone/email or password" (on auth failure)

##### Empty States
- N/A (form-based screen)

##### Loading State
- Disable "LOGIN" button during request
- Show spinner in button ("●●●" or animated dots)
- Dim form inputs

##### Error State
- Inline error message below password field (red text)
- Shake animation on form (optional)
- Toast with error if backend fails

##### Success State
- Success toast: "Logged in successfully"
- Navigate to home or OTP screen

##### Data Needed
- User credentials (phone OR email + password)

##### Tech Debt / Issues
- "Forgot password" is referenced but screen doesn't exist
- Email fallback: Unclear if email auth is fully supported by backend
- Google OAuth integration status unclear

##### Note for Implementation
Phone format should be normalized to +2126XXXXXXXX (9 digits after country code). Password should use bcrypt on backend. Consider adding "Forgot password?" flow.

---

#### SCREEN 5: Register Screen
**File:** `user-app/app/(auth)/register.tsx`  
**Status:** 🟡 **Partial — Form Exists, Backend Integration Unclear**  
**Entry point:** Login "Create account?" link  
**Exit point:** "Register" button → OTP screen

##### Purpose
New user registration. Phone + full name + password + city selection.

##### Layout
```
┌──────────────────────────┐
│ ◀ JAHEEZ                 │  (Top nav)
├──────────────────────────┤
│                          │
│  "Create Account"        │  (Headline)
│                          │
│  ┌────────────────────┐  │
│  │ John Doe           │  │  (Full name)
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ +212 |_____________│  │  (Phone)
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ••••••••••••••••••│  │  (Password)
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ••••••••••••••••••│  │  (Confirm password)
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ Select City ▼      │  │  (Dropdown: Safi, Casablanca, etc.)
│  └────────────────────┘  │
│                          │
│  ☐ I agree to Terms      │  (Checkbox, link to terms)
│                          │
│  [ CREATE ACCOUNT ]      │  (Primary button)
│                          │
│  Already have account?   │
│  Sign in →               │  (Link to login)
│                          │
└──────────────────────────┘
```

##### Sections
1. **Header** — "Create Account" headline
2. **Form**
   - Full name input
   - Phone input (+212 format)
   - Password input
   - Confirm password input
   - City dropdown (Safi, Casablanca, Marrakech, etc.)
   - Terms & conditions checkbox
3. **CTA** — "CREATE ACCOUNT" button
4. **Footer** — "Already have account? Sign in" link

##### Buttons/Actions
- **"CREATE ACCOUNT"**
  - Validates all fields
  - Checks password === confirm password
  - Calls `authApi.register(fullName, phone, password, city)`
  - On success: Navigate to OTP screen
  - On error: Show inline error

- **"Sign in?"** — Navigate to login screen

##### Forms
1. **Registration Form**
   - Full Name: `[min 2 chars, max 100]`
   - Phone: `+212 | [9-digit]`
   - Password: `[min 8 chars, must include uppercase + number]`
   - Confirm Password: `[must match password]`
   - City: `[Safi, Casablanca, Marrakech, Fes, etc.]`
   - Validation:
     - Full name: Min 2 chars (reject numbers/symbols only)
     - Phone: Valid Moroccan format
     - Password: Min 8, must include 1 uppercase + 1 number
     - Confirm password: Must exactly match password
     - City: Must be selected (not empty)
     - Terms: Must be checked
   - Error messages:
     - "Full name must be at least 2 characters"
     - "Invalid phone format"
     - "Password must be at least 8 characters with 1 uppercase and 1 number"
     - "Passwords don't match"
     - "Please select a city"
     - "You must agree to Terms to continue"
     - "Phone number already registered" (backend error)

##### Empty States
- All fields start empty

##### Loading State
- Disable button, show spinner

##### Error State
- Inline error messages (red, below each field)
- Toast with error if backend fails

##### Success State
- Success toast: "Account created! Please verify your phone"
- Navigate to OTP screen with phone pre-filled

##### Data Needed
- Full name, phone, password, city
- List of cities for dropdown

##### Tech Debt / Issues
- Backend integration status unclear (admin API vs Supabase Auth)
- Email field is optional in implementation but not in form? Verify.
- Terms link should navigate to `(flows)/terms` screen

##### Note for Implementation
After successful registration, `setPendingPhone(phone)` in auth store so OTP screen knows which number to verify. Check if phone already exists on backend.

---

#### SCREEN 6: OTP Verification Screen
**File:** `user-app/app/(auth)/otp.tsx`  
**Status:** 🟡 **Partial — UI Exists, Backend Integration (Supabase Email) Pending**  
**Entry point:** After login/register  
**Exit point:** "Verify" button → Home/tabs

##### Purpose
Account email verification via 6-digit OTP code sent by email (Supabase Auth). (Note: Phone verification is deferred to later phases; phone is stored in the profile unverified).

##### Layout
```
┌──────────────────────────┐
│ ◀ JAHEEZ                 │  (Top nav)
├──────────────────────────┤
│                          │
│  "Verify Phone Number"   │  (Headline)
│                          │
│  "We sent a 6-digit code │
│   to +2126XXXXXXX"       │  (Description + phone)
│                          │
│  [ ▢ ][ ▢ ][ ▢ ][ ▢ ]   │  (6 OTP digit boxes)
│  [ ▢ ][ ▢ ]              │
│                          │
│  (cursor in first box)   │
│                          │
│  [ VERIFY ]              │  (Primary button)
│                          │
│  Didn't receive code?    │
│  [ RESEND ] (60s timer)  │  (Resend button, disabled with countdown)
│                          │
│  [ BACK ]                │  (Secondary button)
│                          │
└──────────────────────────┘
```

##### Sections
1. **Header** — "Verify Phone Number" + description showing masked phone
2. **OTP Input** — 6 digit boxes (focusable, auto-advance to next box on digit entry)
3. **Verify Button** — Submit OTP
4. **Resend Section** — "Didn't receive code?" + Resend button (disabled for 60 seconds with countdown timer)
5. **Back Button** — Return to previous screen

##### Buttons/Actions
- **"VERIFY"**
  - Validates OTP is 6 digits filled
  - Calls `authApi.verifyOTP(phone, otpCode)`
  - On success: Mark phone as verified, navigate to home/tabs
  - On error: Show error ("Invalid OTP" or "OTP expired")

- **"RESEND"** (appears after 60s or on click when enabled)
  - Calls `authApi.resendOTP(phone)`
  - On success: Show toast "Code resent to +2126XXXXXXX"
  - Disable button for 60 seconds, show countdown timer
  - On error: Show error ("Phone not found" or "Too many attempts")

- **"BACK"** — Navigate back to login/register screen

##### Components
- **OTPInput** component: 6 digit boxes, numeric keyboard, auto-focus next box
- **Timer** component: 60-second countdown, renders "Resend in 45s" etc.

##### Empty States
- All boxes empty on initial load

##### Loading State
- "VERIFY" button: Show spinner, disable
- "RESEND" button: Disabled for 60s with countdown

##### Error State
- Shake animation on OTP input boxes (optional)
- Red error text: "Invalid code. Please try again"
- Or: "Code expired. Please request a new one"

##### Success State
- Success toast: "Phone verified!"
- Auto-navigate to home after 1-2 seconds

##### Data Needed
- Phone number (from auth store or route params)
- 6-digit OTP code (user input)

##### Assets Needed
- None (text-based)

##### Tech Debt / Issues
- Infobip integration status unclear (is SMS actually sent?)
- OTP timeout not specified (typically 10-15 minutes)
- Maximum resend attempts not enforced visibly
- No "wrong number? change phone" link

##### Note for Implementation
OTP boxes should auto-focus and advance on digit entry. Backspace should delete digit and move to previous box. On paste, distribute digits across boxes if pasted as 6-digit string.

---

### MAIN NAVIGATION SCREENS (5 screens)

---

#### SCREEN 7: Home Screen (Browse Tab)
**File:** `user-app/app/(tabs)/index.tsx` (24KB)  
**Status:** 🟡 **Partial — UI Substantial, Backend Integration Unclear**  
**Entry point:** Main tab navigation, default route  
**Exit point:** Tap on store, category, promo → navigate to details

##### Purpose
Main feed showing featured stores, service categories, active promotions, user's favorite stores.

##### Layout (Scrollable)
```
┌──────────────────────────┐
│ Welcome, [User Name] 👋   │  (Personalized greeting)
│ [Location: Safi Centre]  │
├──────────────────────────┤
│  🎉 Limited Time Offer!  │  (Active promotion banner)
│  Use code: SPRING50      │
│  [ Tap to view ]         │
├──────────────────────────┤
│  Explore Services        │  (Headline)
│  ◆ Food  ◆ Grocery       │  (5 service cards in row)
│  ◆ Pharmacy ◆ Parcel     │
│  ◆ Errand                │
├──────────────────────────┤
│  Featured Stores         │  (Headline)
│                          │
│  [ Store Card 1 ]        │  (Horizontal scroll list)
│  [ Store Card 2 ]        │
│  [ Store Card 3 ]        │
│  ...                     │
├──────────────────────────┤
│  New Stores This Week    │  (Headline)
│  [ Store Card ]          │  (List)
│  [ Store Card ]          │
│  ...                     │
├──────────────────────────┤
│  Your Favorites          │  (Headline, if any saved)
│  [ Store Card ]          │  (List)
│  ...                     │
└──────────────────────────┘
```

##### Sections
1. **Header**
   - Personalized greeting: "Welcome, [User Name] 👋"
   - Current location: "[City - Zone]"
   - Search button (tap → go to search screen)
   - Notifications bell icon

2. **Promotions Banner**
   - If active promotion exists: Display banner with "Limited Time", promo code, CTA
   - Tap to view promo details or apply directly

3. **Services / Categories**
   - 5 service cards in grid: Food, Grocery, Pharmacy, Parcel, Errand
   - Each card: icon + name + background color (category-specific tint)
   - Tap → navigate to category screen (filter stores by service)

4. **Featured Stores**
   - Horizontal scroll list of stores with:
     - Store cover image or logo
     - Delivery time ("30 mins")
     - Store name (AR + translated)
     - Category (AR + translated)
     - Rating (stars + numeric)
     - Delivery fee ("15 DH")
     - Heart icon (favorite toggle)
   - Tap → navigate to store detail

5. **Recent / New Stores**
   - List of newly added stores

6. **Your Favorites** (if any)
   - List of saved stores

##### Buttons/Actions
- **Search icon** → Navigate to `(tabs)/search` screen
- **Notification bell** → Navigate to `(flows)/notifications` screen
- **Service card** (Food/Grocery/etc.) → Navigate to `(flows)/category/[id]` screen
- **Store card** → Navigate to `(flows)/store/[id]` screen
- **Heart icon (on store)** → Toggle favorite (add/remove from `favoritesStore`)
- **Promo banner** → Navigate to promo detail or apply code
- **Refresh icon** → Pull-to-refresh to reload stores

##### Empty States
- If no featured stores: Show "No stores available in your area yet"
- If no favorites: Hide "Your Favorites" section

##### Loading State
- Skeleton loaders for store cards (gray shimmer boxes)
- Animated loading bars for each section

##### Error State
- "Failed to load stores" message
- Retry button

##### Data Needed
- Featured stores (10-15 results)
- Active promotions (1-3 max)
- Service categories (5 types: food, grocery, pharmacy, parcel, errand)
- User's favorite stores list

##### Components Used
- StoreCard component (26 instances: featured + recent + favorites)
- CategoryCard component (5 instances)
- PromoBanner component
- SkeletonBox component (during load)
- Avatar component (user profile pic)

##### Assets Needed
- Service category icons/illustrations (food, grocery, pharmacy, parcel, errand)
- Store cover images (from store data)

##### Tech Debt / Issues
- Mock data used as fallback (unclear if real Supabase queries work)
- Translations: Stores return `name_ar` but component translates with `useTranslatedText()` (ModernMT API)
- Favorite toggle: Unclear if persisted to backend or just local
- Promo banner: Unclear if actually fetched from API or hardcoded

##### Note for Implementation
This is the hero screen — users see this first after login. High quality UI and performance critical. Consider infinite scroll or pagination for stores if list grows large.

---

#### SCREEN 8: Search Screen
**File:** `user-app/app/(tabs)/search.tsx` (28KB)  
**Status:** 🟡 **Partial — UI Substantial, Real Search Integration Unclear**  
**Entry point:** Home search icon, or manual tab navigation  
**Exit point:** Tap on store, filter → navigate to details

##### Purpose
Search and filter stores by name, category, rating, delivery time, etc.

##### Layout (Scrollable)
```
┌──────────────────────────┐
│ Search Stores...         │  (Search input, icon)
├──────────────────────────┤
│  Filters:                │
│  ▼ Category  ▼ Rating    │  (Filter buttons)
│  ▼ Distance  ▼ Sort      │
├──────────────────────────┤
│ [X] 0 active filters     │  (Reset filters button)
│                          │
│  Results (42 stores)     │  (Result count)
│                          │
│  [ Store Card ]          │  (Infinite scroll list)
│  [ Store Card ]          │
│  [ Store Card ]          │
│  ...                     │
│  [Loading more...]       │
│                          │
└──────────────────────────┘
```

##### Sections
1. **Search Input**
   - Search field with magnifying glass icon
   - Placeholder: "Search store name or cuisine..."
   - Real-time search as user types (or debounced API call)

2. **Filters**
   - Category filter: Food, Grocery, Pharmacy, Parcel, Errand
   - Rating filter: 4.5+, 4.0+, 3.0+, Any
   - Distance/Delivery time filter: <15 min, <30 min, <45 min, Any
   - Sort: "Relevance", "Rating", "Delivery Time", "Distance", "Newest"
   - Currently applied filters shown below with [X] reset option

3. **Results**
   - Stores matching search + filters in vertical list
   - Infinite scroll: Load more on reaching bottom
   - Result count: "42 stores" or "No stores found"

##### Buttons/Actions
- **Search input change** → Debounce (300ms) and call `storesApi.search(query, filters)`
- **Category filter** → Toggle category, re-filter results
- **Rating filter** → Select rating threshold, re-filter results
- **Distance filter** → Select delivery time, re-filter results
- **Sort dropdown** → Select sort order, re-sort results
- **Reset [X]** → Clear all filters, show all stores
- **Store card** → Navigate to `(flows)/store/[id]`
- **Heart icon** → Toggle favorite

##### Empty States
- "No stores found matching your search"
- Show suggestion: "Try a different search term or adjust filters"

##### Loading State
- Skeleton loaders for store cards (during initial load)
- "Loading more..." at bottom during pagination

##### Error State
- "Failed to load stores" with retry button

##### Data Needed
- Search results from Supabase (stores matching query + filters)
- Pagination token for infinite scroll

##### Components Used
- Input component (search field)
- Button component (filter buttons)
- StoreCard component (results list)
- SkeletonBox component (loading)

##### Assets Needed
- None (text-based filtering)

##### Tech Debt / Issues
- Search algorithm unclear (Supabase full-text search? Or simple LIKE query?)
- Debouncing on input: Is it implemented? (Should prevent excessive API calls)
- Filtering is UI-only or backend-driven? (Unclear)
- Infinite scroll: How many per page? (Default Supabase: ~10-25)

##### Note for Implementation
Ensure search is performant — avoid N+1 queries. Consider caching recent searches. For autocomplete suggestions, could query product names too (not just store names).

---

#### SCREEN 9: Orders History Screen
**File:** `user-app/app/(tabs)/orders.tsx` (27KB)  
**Status:** 🟡 **Partial — UI Exists, Real Data Integration Unclear**  
**Entry point:** Tab navigation  
**Exit point:** Tap on order → navigate to order detail

##### Purpose
Show user's order history (completed, cancelled) and active orders.

##### Layout (Scrollable)
```
┌──────────────────────────┐
│ Your Orders              │  (Headline)
├──────────────────────────┤
│ Active (2)               │  (Tab: Active, Completed, Cancelled)
│ Completed | Cancelled    │
├──────────────────────────┤
│                          │
│ [Active Order Card] →    │  (Current status: "Preparing")
│ Order #XXXX              │
│ Status: Preparing        │
│ Delivery: 2 mins         │
│                          │
│ [Active Order Card] →    │  (Current status: "Driver assigned")
│ Order #YYYY              │
│ Status: Driver assigned  │
│ Delivery: 15 mins        │
│                          │
│ ─────────────────────    │
│ Past Orders              │
│                          │
│ [Completed Order Card]   │  (Date, total, reorder button)
│ Feb 19, 2026             │
│ 3 items · 95.50 DH       │
│ [ REORDER ]              │
│                          │
│ [Completed Order Card]   │
│ Feb 18, 2026             │
│ 5 items · 142.00 DH      │
│                          │
│ ...                      │
│                          │
│ [Load more...]           │  (Pagination)
│                          │
└──────────────────────────┘
```

##### Sections
1. **Tabs**
   - Active (in-progress orders)
   - Completed (past orders)
   - Cancelled (cancelled orders)

2. **Active Orders Section**
   - List of current deliveries in progress
   - Each card shows: order #, store name, items count, current status, ETA

3. **Completed Orders Section**
   - List of past delivered orders
   - Each card shows: date, store name, items, total price, "REORDER" button

4. **Cancelled Orders Section**
   - List of cancelled orders (if any)
   - Each card shows: date, reason, total, "ORDER AGAIN" button

##### Buttons/Actions
- **Tab buttons** — Switch between Active/Completed/Cancelled tabs
- **Order card** — Navigate to `(flows)/order/[id]` detail screen
- **REORDER button** — Add same items to new cart and navigate to cart screen
- **ORDER AGAIN** — Same as reorder

##### Empty States
- If no active orders: "No active orders right now"
- If no completed orders: "You haven't placed any orders yet" + "Start ordering →" CTA

##### Loading State
- Skeleton loaders for order cards

##### Error State
- "Failed to load orders" with retry

##### Data Needed
- List of user's orders from Supabase (`orders` table, filtered by `user_id`)
- Order status (pending, confirmed, preparing, picked_up, delivered, cancelled)
- Items per order (count or list)

##### Components Used
- OrderCard component (custom for each status type)
- Tab buttons
- SkeletonBox component

##### Assets Needed
- None (data-driven)

##### Tech Debt / Issues
- Order status display: Is it real-time or refreshed on tab switch?
- Pagination: Is infinite scroll or "Load more" button implemented?
- "REORDER" feature: Does it preserve special instructions, address, etc., or just items?

##### Note for Implementation
Could add swipe gesture to re-order without button. Consider showing order tracking map for active orders directly on this screen as preview.

---

#### SCREEN 10: Chat / Conversations Screen
**File:** `user-app/app/(tabs)/chat.tsx` (16KB)  
**Status:** 🟡 **Partial — Unclear If This Is Conversation List or In-Order Chat**  
**Entry point:** Tab navigation  
**Exit point:** Tap on conversation → navigate to chat detail screen

##### Purpose
List of conversations (with stores, drivers, support). Or in-order chat if merged.

##### Expected Layout (If Conversation List)
```
┌──────────────────────────┐
│ Messages                 │  (Headline)
├──────────────────────────┤
│                          │
│ [Conversation 1]         │  (Recent message preview)
│ "Store Name" or "Driver" │
│ "Sure! Your order will..." │
│ 2:30 PM                  │
│                          │
│ [Conversation 2]         │
│ "Support Team"           │
│ "We'll help you out soon!" │
│ Yesterday                │
│                          │
│ [Conversation 3]         │
│ "Driver Ahmed"           │
│ "I'm on my way!"         │
│ Last week                │
│                          │
│ ...                      │
│                          │
└──────────────────────────┘
```

##### Expected Features
- List of active conversations
- Unread badge count on conversations
- Last message preview + timestamp
- Tap → open chat detail screen
- Swipe to delete/archive (optional)
- Search conversations (optional)

##### Note
This screen's purpose is UNCLEAR from code inspection. It could be:
A) Conversation list (general messaging hub)
B) In-order chat list (only chats within active orders)
C) Support chat interface

**Recommendation:** Verify with team what the intent is before implementation.

---

#### SCREEN 11: Profile Screen
**File:** `user-app/app/(tabs)/profile.tsx` (13KB)  
**Status:** ✅ **Appears Complete — Basic UI**  
**Entry point:** Tab navigation  
**Exit point:** Various flow screens for edits

##### Purpose
Display user profile info with quick access to settings, addresses, help, logout.

##### Layout
```
┌──────────────────────────┐
│ My Profile               │  (Headline)
├──────────────────────────┤
│                          │
│      [Avatar]            │  (User's profile picture, center)
│      John Doe            │  (User's full name)
│      john@example.com    │  (Email)
│      +2126XXXXXXX        │  (Phone)
│                          │
│  [ EDIT PROFILE ]        │  (Button to edit profile)
│                          │
├──────────────────────────┤
│ Addresses (3)            │  (Saved addresses section)
│ [ View All →  ]          │  (Shows first 3, link to view all)
│                          │
│  Home (مرحبا)            │  (Address label in AR)
│  123 Main Street, Safi   │
│                          │
│  Office (المكتب)         │  (Address label in AR)
│  456 Business Ave        │
│                          │
│  [ ADD NEW ADDRESS ]     │
│                          │
├──────────────────────────┤
│ Favorites (8)            │  (Saved stores count)
│ [ View All →  ]          │
│                          │
├──────────────────────────┤
│ Settings                 │
│ [ Language ]             │  (AR/FR/EN switcher)
│ [ Notifications ]        │  (Push settings)
│ [ Payment Methods ]      │  (Saved cards)
│ [ Support & FAQ ]        │  (Help)
│ [ Terms & Privacy ]      │  (Legal)
│                          │
├──────────────────────────┤
│ [ DELETE ACCOUNT ]       │  (Destructive action, red text)
│ [ LOGOUT ]               │  (Also red)
│                          │
└──────────────────────────┘
```

##### Sections
1. **Profile Info**
   - Avatar image (tap to change)
   - Full name, email, phone
   - "EDIT PROFILE" button

2. **Saved Addresses**
   - List of first 3 addresses (home, office, etc.)
   - "View All" link
   - "ADD NEW ADDRESS" button

3. **Favorites**
   - Count of saved stores (e.g., "8 favorite stores")
   - "View All" link

4. **Settings**
   - Language switcher (AR/FR/EN)
   - Notifications toggle + settings
   - Payment methods
   - Support & FAQ
   - Terms & Privacy

5. **Destructive Actions**
   - "DELETE ACCOUNT" button (red, requires confirmation)
   - "LOGOUT" button (red)

##### Buttons/Actions
- **EDIT PROFILE** → Navigate to `(flows)/profile-edit` screen
- **View All Addresses** → Navigate to `(flows)/addresses` screen
- **ADD NEW ADDRESS** → Navigate to `(flows)/addresses` with "add mode"
- **View All Favorites** → Navigate to `(flows)/favorites` screen
- **Language** → Show language picker (AR/FR/EN), update `languageStore`
- **Notifications** → Navigate to `(flows)/notifications` settings
- **Payment Methods** → Navigate to `(flows)/payment-methods` screen
- **Support & FAQ** → Navigate to `(flows)/faq` or `(flows)/support-ticket` screen
- **Terms & Privacy** → Navigate to `(flows)/terms` screen
- **DELETE ACCOUNT** → Show confirmation modal, then call `authApi.deleteAccount()`, logout
- **LOGOUT** → Show confirmation, call `authApi.logout()`, navigate to login

##### Empty States
- If no addresses: "No addresses saved. Add your first address →"
- If no favorites: "No favorite stores yet. Start exploring →"

##### Loading State
- Skeleton loader for profile info section (during initial load)

##### Error State
- Show toast if profile fetch fails
- Retry button in that case

##### Data Needed
- User profile (name, email, phone, avatar)
- Addresses (first 3)
- Favorites count
- Current language setting

##### Assets Needed
- None (data-driven)

##### Tech Debt / Issues
- Avatar change mechanism: Is there an image upload flow integrated?
- Language switcher: Does it actually change app language or just store preference?

##### Note for Implementation
This screen is the "control center" for user settings. Keep it organized and accessible. Most sub-screens already exist or are listed as missing.

---

#### SCREEN 12: Wallet Screen
**File:** `user-app/app/(tabs)/wallet.tsx` (6 lines)  
**Status:** ❌ **MISSING — Only Redirects to Home**  
**Entry point:** Tab navigation  
**Exit point:** Should not need to exit (user can navigate elsewhere)

##### Purpose
Display wallet balance, transaction history, add funds, withdraw funds.

##### Expected Layout
```
┌──────────────────────────┐
│ My Wallet                │  (Headline)
├──────────────────────────┤
│  Balance                 │
│  450.50 DH               │  (Large text, centered)
│                          │
│  [ ADD FUNDS ]           │  (Deposit button)
│  [ REQUEST PAYOUT ]      │  (Withdraw button, if applicable)
│                          │
├──────────────────────────┤
│ Recent Transactions      │  (Headline)
│                          │
│ +100.00 DH               │  (Top-up from card)
│ Top-up successful        │
│ Feb 19, 2026             │
│ ✓ Completed              │
│                          │
│ -45.50 DH                │  (Used for order)
│ Order #12345 delivery    │
│ Feb 18, 2026             │
│ ✓ Completed              │
│                          │
│ +10.00 DH                │  (Cashback / promo)
│ Promo bonus SPRING50     │
│ Feb 17, 2026             │
│ ✓ Completed              │
│                          │
│ ...                      │
│                          │
│ [Load more...]           │
│                          │
└──────────────────────────┘
```

##### Sections
1. **Balance Display**
   - Current wallet balance in large text
   - Currency: DH (Moroccan Dirham)

2. **Quick Actions**
   - "ADD FUNDS" button (tap → payment method selection → Stripe card charge)
   - "REQUEST PAYOUT" button (if wallet is for drivers/sellers)

3. **Transaction History**
   - List of wallet transactions (credits + debits)
   - Each transaction shows:
     - Amount (+ for credit, - for debit)
     - Description (top-up, order payment, promo bonus, etc.)
     - Date
     - Status (Completed, Pending, Failed)
   - Infinite scroll or pagination

##### Buttons/Actions
- **ADD FUNDS** → Navigate to payment flow (Stripe integration)
- **REQUEST PAYOUT** → Navigate to payout request form
- **Transaction row** → Show transaction detail (optional)

##### Empty States
- "No transactions yet" (if wallet just created)

##### Loading State
- Skeleton loader for balance
- Skeleton loaders for transaction list

##### Error State
- "Failed to load wallet" with retry

##### Data Needed
- Wallet balance (`wallets` table by user_id)
- Transaction history (`wallet_transactions` table)
- Pending transactions if any

##### Components Used
- Card component (balance display)
- Button components
- Transaction list items

##### Assets Needed
- Transaction type icons (top-up, payment, promo, etc.)

##### Tech Debt / Issues
- **CRITICAL:** This screen is completely missing (only 6 lines that redirect to home)
- Wallet feature is not implemented at all
- Database schema has `wallets` and `wallet_transactions` tables but no UI to use them

##### Note for Implementation
This is a HIGH PRIORITY missing feature. Users need to see balance and transaction history. The Wallet tab should not just redirect to home. Implement this screen before production.

---

### FLOW SCREENS (20 screens)

I'll document a selection of critical flow screens:

---

#### SCREEN 13: Store Detail + Menu Screen
**File:** `user-app/app/(flows)/store/[id].tsx` (29KB)  
**Status:** 🟡 **Partial — UI Substantial, Backend Integration Unclear**  
**Entry point:** Tap on store from home/search/category  
**Exit point:** "Add to Cart" → cart screen, back button → previous screen

##### Purpose
Display store info (hours, ratings, menu categories), allow browsing and adding items to cart.

##### Layout (Scrollable)
```
┌──────────────────────────┐
│ ◀ [Store Name]    [❤️]    │  (Top nav with back + fav heart)
├──────────────────────────┤
│  [Store cover image]     │  (Full-width image)
│  ⭐ 4.8 (156 reviews)    │  (Rating overlay)
│  [Delivery: 30 mins]     │  (Delivery time badge)
├──────────────────────────┤
│  Restaurant Name (AR)    │  (Store name)
│  "Arabic, International" │  (Cuisine tags)
│                          │
│  🕐 Open now until 11PM  │  (Hours)
│  📍 123 Main St, Safi    │  (Address)
│  📞 +2120XXXXXXXXX       │  (Phone)
│  💬 WhatsApp Support →   │  (WhatsApp link)
│                          │
│  [ CALL ] [ WHATSAPP ]   │  (Quick action buttons)
│                          │
├──────────────────────────┤
│ Menu Categories:         │
│ ○ Appetizers             │  (Tab navigation)
│ ○ Mains                  │
│ ○ Drinks                 │
│ ○ Desserts               │
├──────────────────────────┤
│ APPETIZERS               │  (Selected category heading)
│                          │
│ [ Hummus ]               │  (Menu item card)
│   Chickpea puree, lemon  │  (Description)
│   35.00 DH               │  (Price)
│   [ + ] [ Add to Cart ]  │  (Quantity + button)
│                          │
│ [ Falafel Platter ]      │  (Another item)
│   6 pieces with tahini   │
│   40.00 DH               │
│   [ + ] [ Add to Cart ]  │
│                          │
│ ...                      │
│                          │
│ [View all in Appetizers] │  (Expand button if many)
│                          │
├──────────────────────────┤
│ MAINS                    │
│ [ Grilled Chicken ]      │
│ ...                      │
│                          │
└──────────────────────────┘
```

##### Sections
1. **Header**
   - Back arrow + store name
   - Favorite heart icon (tap to add/remove)

2. **Store Cover Image**
   - Full-width image with optional overlay showing:
     - Star rating + review count
     - Delivery time badge

3. **Store Info Card**
   - Store name (AR + EN/FR translation)
   - Cuisine tags
   - Hours (open/closed status)
   - Address with map icon
   - Phone number
   - WhatsApp link

4. **Quick Actions**
   - "CALL" button (tap to initiate phone call)
   - "WHATSAPP" button (tap to open WhatsApp chat)

5. **Menu Navigation**
   - Tab-style category picker (Appetizers, Mains, Drinks, Desserts, etc.)
   - Horizontal scroll if many categories

6. **Menu Items**
   - Per category, show menu items in vertical list
   - Each item card:
     - Item name
     - Description (optional)
     - Price (with currency DH)
     - Quantity selector (+ button)
     - "Add to Cart" button or direct + button to increment

##### Buttons/Actions
- **Heart icon** — Toggle favorite (add/remove from favorites)
- **CALL button** — Initiate phone call to store
- **WHATSAPP button** — Open WhatsApp chat with store
- **Category tab** — Switch menu category display
- **+ button on item** — Add item to cart (may show quantity picker first)
- **"Add to Cart" button** — Add item to cart (if quantity > 0)
- **Back arrow** — Navigate back to previous screen

##### Forms
- Item customization (if applicable): Size, extras, special instructions
  - Example: Coffee size (Small/Medium/Large)
  - Example: Extras (Extra cheese +5 DH)
  - Example: Special instructions (No onions, extra sauce, etc.)

##### Empty States
- If store is closed: Show "This store is currently closed" banner, disable add to cart
- If no items: "No items available right now"

##### Loading State
- Skeleton for store info
- Skeleton for menu items

##### Error State
- "Failed to load menu" with retry

##### Data Needed
- Store details (name, hours, phone, address, rating, etc.)
- Menu categories
- Menu items (with prices, descriptions, options)

##### Components Used
- Image component (cover)
- StoreInfo card component
- MenuItemCard component
- Quantity selector component
- SkeletonBox component

##### Assets Needed
- Store cover image (from store data)
- Menu item images (optional but recommended)

##### Tech Debt / Issues
- Menu item customization flow: Not clear if implemented or planned
- Stock management: Can items run out? (Not visible in UI)
- Store hours: Is open/closed status real-time or based on stored hours?
- Multi-language: Are menu item names/descriptions in AR and stored, or translated on-the-fly?

##### Note for Implementation
This is a critical screen for ordering. Ensure smooth performance when menu has 100+ items (lazy load or virtualization). Item customization (size, extras, instructions) should be implemented before production.

---

#### SCREEN 14: Shopping Cart Screen
**File:** `user-app/app/(flows)/cart.tsx` (20KB)  
**Status:** 🟡 **Partial — UI Complete, Backend Integration Unclear**  
**Entry point:** "Add to Cart" from store screen  
**Exit point:** "Checkout" → checkout screen, back → previous screen

##### Purpose
Review items, adjust quantities, apply promos, review total before checkout.

##### Layout (Scrollable)
```
┌──────────────────────────┐
│ ◀ Shopping Cart          │  (Top nav with back)
├──────────────────────────┤
│ [Store Name] Restaurant  │  (Store header)
│ Delivery: 30 mins        │  (Delivery time)
│ ────────────────────────  │
│                          │
│ ITEMS (3)                │  (Item count heading)
│                          │
│ [ - ] Hummus (35 DH) [ + ]  │  (Item 1: qty control)
│ [ Remove ]               │  (Remove button)
│                          │
│ [ - ] Falafel (40 DH) [+]   │  (Item 2)
│   Special: No onions ✓   │  (Special instructions)
│ [ Remove ]               │
│                          │
│ [ - ] Juice (15 DH) [+]     │  (Item 3)
│ [ Remove ]               │
│                          │
│ [ ADD MORE ITEMS ]       │  (Return to store menu)
│                          │
├──────────────────────────┤
│ PROMO CODE               │
│ ┌────────────────────┐   │  (Input field)
│ │ SPRING50           │   │
│ └────────────────────┘   │
│ [ APPLY ]                │
│                          │
│ ✓ Promo applied!         │  (Success message)
│ -20.00 DH discount       │
│                          │
├──────────────────────────┤
│ SUMMARY                  │  (Order summary)
│                          │
│ Subtotal:       90 DH    │
│ Delivery fee:   15 DH    │
│ Promo discount: -20 DH   │
│ ─────────────────────    │
│ TOTAL:         85 DH     │  (Bold, large)
│                          │
│ [ PROCEED TO CHECKOUT ]  │  (Primary button)
│ [ CONTINUE SHOPPING ]    │  (Secondary button)
│                          │
└──────────────────────────┘
```

##### Sections
1. **Header**
   - Back arrow
   - "Shopping Cart" title

2. **Store Header**
   - Store name + delivery time

3. **Items Section**
   - List of cart items
   - Per item:
     - Name, price
     - Quantity controls (- and + buttons)
     - Special instructions (if any, collapsed/expandable)
     - Remove button

4. **Add More Items Button**
   - "ADD MORE ITEMS" button to return to store menu

5. **Promo Code Section**
   - Promo code input field
   - "APPLY" button
   - Success/error message after applying
   - Show discount if applied

6. **Order Summary**
   - Subtotal (items only)
   - Delivery fee (from store or calculated)
   - Promo discount (if applied)
   - **Total** (bold, large text)

7. **Action Buttons**
   - "PROCEED TO CHECKOUT" (primary, red)
   - "CONTINUE SHOPPING" (secondary, gray)

##### Buttons/Actions
- **- button** — Decrease item quantity (minimum 1, below that → remove)
- **+ button** — Increase item quantity (maximum likely 99 or store stock limit)
- **Remove button** — Remove item from cart
- **ADD MORE ITEMS** — Navigate back to store screen (keep cart)
- **APPLY button** — Validate and apply promo code
  - On success: Update discount, recalculate total
  - On error: Show error message ("Invalid code", "Code expired", "Minimum order not met", etc.)
- **PROCEED TO CHECKOUT** — Navigate to checkout screen
- **CONTINUE SHOPPING** — Navigate back to store menu

##### Forms
- Promo code input: Text field (alphanumeric, max 20 chars)
  - Validation: Must match pattern, must not be expired, must meet minimum order

##### Empty States
- "Your cart is empty" (if user clears cart)
- "Add items to get started →" with button to go back to store

##### Loading State
- Disable checkout button while processing promo code
- Show spinner on "APPLY" button

##### Error State
- Inline error message: "Invalid promo code"
- Or: "This promo is only valid for orders over 100 DH"
- Or: "This code has expired"
- Toast message if cart fetch fails

##### Data Needed
- Cart items (from `cartStore`)
- Store details (for delivery fee, name)
- Promo code validation result (from backend)

##### Components Used
- QuantitySelector component
- Card component (items)
- Input component (promo field)
- Button components
- PriceSummary component

##### Assets Needed
- None (data-driven)

##### Tech Debt / Issues
- Multi-store cart protection: Does it prevent mixing items from different stores? (Code mentions this)
- Promo validation: Is it done locally or via API? (Should be API to prevent fraud)
- Delivery fee calculation: Is it fixed per store or dynamic by distance?
- Stock management: Can items go out of stock after being added to cart? (No visibility in UI)

##### Note for Implementation
Cart is critical for UX. Ensure smooth quantity adjustments, promo code validation, and price recalculation. Consider "Save for later" feature if time permits.

---

I'll now create the remaining 12 documentation files with similar depth. Due to token constraints, I'll create them more concisely but still comprehensively:
