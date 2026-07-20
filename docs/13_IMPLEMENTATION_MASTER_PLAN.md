# 13. IMPLEMENTATION MASTER PLAN — JAHEEZ

**Purpose:** Phased implementation roadmap | **Last Updated:** 2026-05-19

---

## Phase 0: Foundation (Completed ✅ — Phase 0 Stabilization Report)

**Goal:** Establish project structure, fix critical foundation issues  
**Status:** ✅ COMPLETE (2026-05-05)

**What's fixed (Phase 0 Stabilization Report):**
- ✅ Color system conflict — All files unified to brand.ts (#F03030)
- ✅ Hardcoded Supabase credentials — Now requires env vars (supabase.ts updated)
- ✅ Duplicate splash screens — Single splash at (auth)/splash.tsx
- ✅ NativeWind unused code — Removed from babel/metro build pipeline
- ✅ Missing .env.example files — Created for root, user-app, admin
- ✅ AGENTS.md outdated — Updated with SDK 55, correct colors, correct tech stack
- ✅ Missing .gitignore — Created to protect .env files
- ✅ Accidental `i` package — Removed from package.json

**DO NOT TOUCH:** Phase 0 changes are locked; refer to PHASE_0_STABILIZATION_REPORT.md for details

---

## Phase 1: Design System & Assets Alignment (Next Active Phase)

**Goal:** Align design system, components, and assets for production quality  
**Duration:** 2-3 weeks  
**Owner:** Design Team + Frontend AI

### Deliverables
- [x] Complete project documentation (15 markdown files)
- [ ] Verify Supabase schema deployed to live instance
- [ ] Verify admin API deployment status
- [ ] Fix color system conflicts (tailwind.config.js ← brand.ts)
- [ ] Remove dead code (NativeWind if unused, @expo/ngrok if unused)
- [ ] Create .env.example files for all apps
- [ ] Document all external service keys needed

### Acceptance Criteria
- [ ] All docs reviewed and approved
- [ ] Color system unified (one source of truth)
- [ ] Deployment status clear (Supabase, admin API)
- [ ] Environment setup documented

---

## Phase 2: Design System & Components (1-2 weeks)

**Goal:** Ensure all UI components match brand specification  
**Files to review:** `user-app/components/ui/`, `admin/src/components/ui/`

### Deliverables
- [ ] Audit all 26 UI components for brand.ts compliance
- [ ] Create missing onboarding slide illustrations (4-5 needed)
- [ ] Create empty state illustrations (5+ needed)
- [ ] Create error state illustrations  
- [ ] Create driver app assets (icons, illustrations, images) — currently empty
- [ ] Verify all icons (Ionicons) match specs
- [ ] Optimize image assets (resize oversize illustrations from 1.7MB to < 500KB each)
- [ ] Test component responsiveness on multiple device sizes
- [ ] Document component props and variants

### Acceptance Criteria
- [ ] All components use brand.ts colors (zero hardcodes)
- [ ] All buttons are 52px height with pill radius
- [ ] All inputs are 52px height with 12px radius
- [ ] All cards have 16px radius and SHADOW
- [ ] All text color matches TEXT, TEXT2, TEXT3 hierarchy
- [ ] Driver app assets folder populated with required files
- [ ] All illustration assets optimized to mobile-friendly sizes

---

## Phase 2: UI Component Audit & Improvement (1-2 weeks)

**Goal:** Review all screens for layout, spacing, and usability improvements  
**Files to review:** All screens across user-app, driver-app, admin

### Deliverables
- [ ] Audit layout consistency across all 35+ screens
- [ ] Fix spacing/padding to 8px grid multiples
- [ ] Verify accessibility labels on all interactive elements
- [ ] Test loading states on all data-fetching screens
- [ ] Test error states and empty states
- [ ] Review RTL support for Arabic
- [ ] Document any layout issues for Phase 3-6

### Acceptance Criteria
- [ ] No visual inconsistencies between similar screens
- [ ] All interactive elements have accessibilityLabel
- [ ] All screens handle loading/error/empty gracefully

---

## Phase 3: Authentication Flow Polish (1-2 weeks) [V1 Focus]

**Goal:** Polish and test authentication screens using Supabase Email OTP  
**Files:** `user-app/app/(auth)/*`, `user-app/lib/authApi.ts`

### Deliverables
- [ ] Test splash screen animation (image + video).
- [ ] Test welcome screen and onboarding carousel.
- [ ] Verify Login screen uses email + password.
- [ ] Implement Sign-Up screen for email, password, full name, and city.
- [ ] Create `user-app/app/(auth)/forgot.tsx` and reset flow using Supabase email reset.
- [ ] Polish `otp.tsx` (60-second countdown timer, error banners, 6-digit auto-advancing boxes).
- [ ] Verify auth state persists to AsyncStorage via Zustand.

### Acceptance Criteria
- [ ] Authentication screens load without crash.
- [ ] Sign-up / Login connects to Supabase Auth.
- [ ] OTP verification uses `supabase.auth.verifyOtp` and functions correctly.
- [ ] OTP countdown timer locks button for 60s.
- [ ] Form input validation works (standard errors/banners).
- [ ] Forgot password link navigates to forgot screen.

---

## Phase 4: Home & Services Polish (2-3 weeks) [V1 Focus]

**Goal:** Polish home screen, search, and category browsing screens  
**Files:** `user-app/app/(tabs)/index.tsx`, `search.tsx`, `category/[id].tsx`

### Deliverables
- [ ] Home screen: Polish featured stores list UI.
- [ ] Home screen: Verify service category cards rendering (5 types).
- [ ] Home screen: Active promotions banner display.
- [ ] Search screen: Polish real-time search with debounce.
- [ ] Search screen: Filter by category and rating (distance-based maps filtered out in V1).
- [ ] Search screen: Test infinite scroll pagination.
- [ ] Category screen: Verify stores filtered by service type.
- [ ] Favorite toggle: Verify store bookmarking state.

### Acceptance Criteria
- [ ] Screens load dynamic data from Supabase.
- [ ] Category cards display correctly without emoji placeholders.
- [ ] Search works with debounce.
- [ ] Scroll is performance-optimized.

---

## Phase 5: Ordering & Checkout Polish (2-3 weeks) [V1 Focus]

**Goal:** Polish store menu, cart, and checkout screens with COD  
**Files:** `user-app/app/(flows)/store/[id].tsx`, `cart.tsx`, `checkout.tsx`

### Deliverables
- [ ] Store detail screen: Polish store info display.
- [ ] Store detail: Menu categories and items.
- [ ] Menu item customization: Size and extras selectors.
- [ ] Cart screen: Quantity adjustments and item removal.
- [ ] Cart screen: Promo code input and validation.
- [ ] Checkout screen: Address text field (strict validation: min 15 chars requiring descriptive landmark directions).
- [ ] Checkout screen: Payment method radio options (Cash on Delivery default, Card and Wallet disabled/grayed out in V1).
- [ ] Order creation: Verify order saving to Supabase `orders` and `order_items` tables.

### Acceptance Criteria
- [ ] Cart calculations are correct.
- [ ] Address field rejects inputs under 15 characters to ensure details.
- [ ] Payment is restricted to COD.
- [ ] Order creation succeeds and reduces inventory/creates status log.

---

## Phase 6: Backend & Data Connection (1-2 weeks) [V1 Focus]

**Goal:** Verify Supabase connection and deprecate complex V2 APIs  
**Focus:** Supabase deployment, API integration, real data flow

### Deliverables
- [ ] Verify Supabase schema is deployed to live instance.
- [ ] Verify Supabase Realtime is wired for order status log listening.
- [ ] Verify admin API deployment location (Vercel/Render).
- [ ] **Bypass/Disable:** Infobip OTP, Stripe SDK, Google Maps SDK, ModernMT, FCM push setup.
- [ ] Setup fallback local translations to handle multi-language without ModernMT API.
- [ ] Document all environment variables.

### Acceptance Criteria
- [ ] Supabase connection is secure and functional.
- [ ] App uses Supabase Auth + Database.
- [ ] Offline translations render correctly.
- [ ] Deferrals are successfully disabled in client app.

---

## Phase 7: Tracking & Orders (2 weeks) [V1 Focus]

**Goal:** Status stepper order tracking  
**Files:** `user-app/app/(tabs)/orders.tsx`, `tracking/[id].tsx`, `order/[id].tsx`

### Deliverables
- [ ] Orders tab: Polish active/completed/cancelled order list.
- [ ] Order detail screen: Display order items, total, status timeline.
- [ ] Order detail screen: Support button redirects via deep-link to WhatsApp Business support chat.
- [ ] Tracking screen: **Bypass live GPS tracking**. Replace map view with a visually polished status timeline stepper.
- [ ] Tracking screen: Timeline displays status changes retrieved via Supabase Realtime subscription.
- [ ] Tracking screen: Driver phone/contact details are visible once driver is assigned.

### Acceptance Criteria
- [ ] Order details are accurate.
- [ ] Status timeline stepper transitions color-coded as status changes.
- [ ] WhatsApp contact deep link pre-fills correct order details.
- [ ] Live map is hidden, stepper loads instantly.

---

## Phase 8: Profile & Settings (1-2 weeks) [V1 Focus]

**Goal:** Polish user profile, settings, and addresses  
**Files:** `user-app/app/(tabs)/profile.tsx`, `profile-edit.tsx`, `addresses.tsx`, `settings.tsx`

### Deliverables
- [ ] Profile screen: Display user info (name, email, phone, avatar).
- [ ] Profile edit: Edit full name.
- [ ] Profile edit: Change avatar (image picker + upload to Supabase Storage `/avatars/`).
- [ ] Profile edit: Select city.
- [ ] Profile edit: Select language (AR/FR/EN) - uses local files.
- [ ] Addresses screen: List all saved addresses.
- [ ] Addresses screen: Add/Edit address using descriptive text fields (**no map picker** in V1).
- [ ] Settings screen: FAQ list, terms of service.
- [ ] Settings screen: Logout button.
- [ ] Account deletion: Confirm and delete.

### Acceptance Criteria
- [ ] Profile data updates save to database.
- [ ] Address CRUD works without map API errors.
- [ ] Language toggle works instantly.

---

## Phase 9: Wallet & Payments (Deferred to V2)

**Goal:** Implement digital wallet and card payments  
**V1 Strategy:** **Deferred.** Users see static wallet balance of 0 DH, with "Wallet top-up is temporarily disabled" alert message. Stripe card checkout is hidden.

### V2 Deliverables
- [ ] Create wallet.tsx screen.
- [ ] Wallet screen: Display balance and transaction history.
- [ ] Stripe integration: Card verification and topping up.
- [ ] Checkout integration: Split payments (wallet + card).

---

## Phase 10: Driver App Polish (2-3 weeks)

**Goal:** Complete driver app implementation  
**Files:** `driver-app/app/`, `driver-app/assets/`

### Deliverables
- [ ] Add driver app assets (icons, illustrations, images) — currently empty folder
- [ ] Driver registration: Verification flow
- [ ] Driver authentication: Login/register/OTP
- [ ] Driver home: Show available orders (delivery queue)
- [ ] Driver home: Accept/reject order
- [ ] Active delivery: Show order details and map
- [ ] Active delivery: GPS tracking (send location to backend)
- [ ] Earnings tab: Show daily/weekly earnings
- [ ] Earnings tab: Show trip history
- [ ] Profile tab: Edit driver info (vehicle, documents)
- [ ] Payout request: Request withdrawal

### Acceptance Criteria
- [ ] Driver can register and login
- [ ] Orders appear in real-time for drivers
- [ ] GPS location updates every 10-30 seconds
- [ ] Order status updates trigger notifications
- [ ] Earnings calculated correctly
- [ ] Payouts can be requested

---

## Phase 11: Admin Panel (2-3 weeks)

**Goal:** Complete admin dashboard functionality  
**Files:** `admin/src/pages/*`, `admin/src/components/`

### Deliverables
- [ ] Verify admin login works
- [ ] Dashboard: Display key metrics (orders today, revenue, active drivers)
- [ ] Orders page: Filter and search orders
- [ ] Orders page: Change order status
- [ ] Orders page: Refund order
- [ ] Stores page: Create/edit stores
- [ ] Stores page: Toggle store online/offline
- [ ] Drivers page: List drivers, verify/reject
- [ ] Support page: View tickets, reply to users
- [ ] Analytics page: Charts and reports
- [ ] Payouts page: Approve/reject driver payouts
- [ ] Promotions page: Create and manage promo codes
- [ ] Users page: Manage user accounts and trust scores

### Acceptance Criteria
- [ ] All pages load data from backend
- [ ] CRUD operations work correctly
- [ ] Role-based access control enforced
- [ ] Audit logs track admin actions
- [ ] Charts and reports display correctly

---

## Phase 12: Testing & QA (2-3 weeks)

**Goal:** Comprehensive testing before production  
**Files:** New test files (Jest + Detox)

### Deliverables
- [ ] Unit tests: 80% code coverage on shared modules
- [ ] Integration tests: Auth flow, order creation, payment
- [ ] E2E tests: Critical user journeys (order from start to finish)
- [ ] Performance testing: App load time < 3s
- [ ] Manual QA: Test all screens on iOS and Android
- [ ] Security audit: Check for exposed secrets, SQL injection, etc.
- [ ] Accessibility audit: Screen reader testing, color contrast

### Acceptance Criteria
- [ ] All critical paths tested
- [ ] No regressions in existing features
- [ ] Performance meets targets
- [ ] Security vulnerabilities addressed
- [ ] App passes manual QA

---

## Phase 13: Production Build & Deployment (1-2 weeks)

**Goal:** Prepare for App Store and Play Store  
**Files:** `eas.json`, `.env.production`, CI/CD configs

### Deliverables
- [ ] Configure EAS for iOS build
- [ ] Configure EAS for Android build
- [ ] Set up app signing certificates
- [ ] Create App Store listing (metadata, screenshots)
- [ ] Create Play Store listing
- [ ] Configure GitHub Actions for CI/CD
- [ ] Set up error reporting (Sentry or similar)
- [ ] Set up analytics (Firebase or similar)
- [ ] Prepare production Supabase instance
- [ ] Deploy admin API to production

### Acceptance Criteria
- [ ] EAS builds succeed
- [ ] App submits to App Store
- [ ] App submits to Play Store
- [ ] CI/CD pipeline working
- [ ] Error reporting functional
- [ ] Production database ready

---

## Phase 14: Soft Launch (1 week)

**Goal:** Internal testing before public launch  
**Deliverables:**
- [ ] Deploy to TestFlight (iOS)
- [ ] Deploy to Google Play Internal Testing (Android)
- [ ] Internal team testing (all features)
- [ ] Gather feedback and fix critical bugs
- [ ] Monitor error logs and performance

---

## Phase 15: Public Launch 🚀

**Goal:** Release to production  
**Deliverables:**
- [ ] Release to App Store
- [ ] Release to Google Play
- [ ] Monitor metrics and user feedback
- [ ] Prepare support team
- [ ] Marketing announcement

---

## NOT RECOMMENDED (Avoid These)

| Task | Reason |
|------|--------|
| Refactoring folder structure | Too risky, breaks imports |
| Adding new UI frameworks | Too late, maintain consistency |
| Major dependency upgrades | Test burden, compatibility issues |
| Rewriting existing screens | Unnecessary, maintain what works |
| Changing brand colors | Design lock-in |

---

**Created:** 2026-05-19 | **Method:** Feature-based phasing + risk assessment | **Confidence:** High
