# ANTIGRAVITY PROMPT SEQUENCE — JAHEEZ (جاهز)

**Purpose:** Step-by-step prompt playbook for implementing JAHEEZ inside Antigravity  
**Created:** 2026-05-20  
**Author:** Planning Agent  
**Total Prompts:** 22 (Prompt 0 through Prompt 21)

---

> [!CAUTION]
> **RUN ONE PROMPT AT A TIME.** Do not paste multiple prompts in one session. Wait for the AI to finish and produce its report file before moving to the next prompt. If a prompt produces errors or blockers, fix them before advancing.

> [!IMPORTANT]
> **Each prompt is self-contained.** You can start a new Antigravity session for each prompt. The docs and report files carry context between sessions.

---

## How to Use This File

1. **Copy** the entire text inside the prompt box (between the `---START---` and `---END---` markers).
2. **Paste** it into a new Antigravity chat.
3. **Wait** for the AI to complete all steps and produce its report file.
4. **Review** the report file in `docs/`.
5. **Only then** move to the next prompt.

If the AI asks a question, answer it. If it says something is blocked, fix the blocker before continuing.

---

# TABLE OF CONTENTS

| # | Prompt | Purpose | Report File |
|---|--------|---------|-------------|
| 0 | Session Start / Read Docs | Load all docs, summarize state, wait for task | (none — session setup) |
| 1 | Verify Current State | Confirm app starts, identify blockers | `docs/PHASE_0_VERIFICATION_REPORT.md` |
| 2 | Design Assets Audit | Inspect and organize all assets | `docs/PHASE_1_ASSET_ALIGNMENT_REPORT.md` |
| 3 | Image Optimization | Compress oversized images safely | `docs/PHASE_1B_IMAGE_OPTIMIZATION_REPORT.md` |
| 4 | UI Component Audit | Improve reusable UI components | `docs/PHASE_2_COMPONENT_AUDIT_REPORT.md` |
| 5 | Animation Foundation | Audit and improve animation components | `docs/PHASE_2B_ANIMATION_FOUNDATION_REPORT.md` |
| 6 | Auth Flow Polish | Polish splash → login → register → OTP → forgot | `docs/PHASE_3_AUTH_POLISH_REPORT.md` |
| 7 | Home & Services Polish | Home screen, categories, promos, search | `docs/PHASE_4_HOME_SERVICES_REPORT.md` |
| 8 | Store/List/Product Polish | Store listing, detail, menu, product sheet | `docs/PHASE_5_STORE_LIST_PRODUCT_REPORT.md` |
| 9 | Cart & Checkout Polish | Cart, promo, address, COD, order confirm | `docs/PHASE_6_CART_CHECKOUT_REPORT.md` |
| 10 | Order Status & Tracking | Orders list, detail, timeline stepper, support | `docs/PHASE_7_ORDERS_TRACKING_REPORT.md` |
| 11 | Profile, Settings, Support | Profile, addresses, language, FAQ, logout | `docs/PHASE_8_PROFILE_SUPPORT_REPORT.md` |
| 12 | Backend/Data Verification | Verify Supabase tables vs docs, no new UI | `docs/PHASE_9_BACKEND_DATA_VERIFICATION.md` |
| 13 | Auth/OTP Backend Integration | Implement Supabase Email OTP strategy | `docs/PHASE_10_AUTH_INTEGRATION_REPORT.md` |
| 14 | Orders/Stores Real Data | Connect screens to Supabase real data | `docs/PHASE_11_DATA_INTEGRATION_REPORT.md` |
| 15 | Admin API Verification | Inspect admin API, document endpoints | `docs/PHASE_12_ADMIN_API_REPORT.md` |
| 16 | Driver App Stabilization | Fix driver app basics after user app is stable | `docs/PHASE_13_DRIVER_APP_REPORT.md` |
| 17 | Wallet & Payments Verification | Inspect wallet/payment code, document readiness | `docs/PHASE_14_WALLET_PAYMENTS_REPORT.md` |
| 18 | Notifications & Support | Expo notifications, support flow, WhatsApp | `docs/PHASE_15_NOTIFICATIONS_REPORT.md` |
| 19 | Testing & QA | Tests, type checks, manual QA checklist | `docs/PHASE_16_QA_REPORT.md` |
| 20 | Production Build Preparation | EAS config, icons, splash, env, deploy checklist | `docs/PHASE_17_PRODUCTION_PREP_REPORT.md` |
| 21 | Final Full Audit | Full project QA, MVP readiness, remaining risks | `docs/PHASE_18_FINAL_AUDIT_REPORT.md` |

---
---

# PROMPT 0 — SESSION START / READ DOCS

`---START PROMPT 0---`

```
You are working inside the JAHEEZ project workspace.

Before doing ANY coding, you MUST read these documentation files:

- docs/01_PROJECT_MASTER_OVERVIEW.md
- docs/02_PROJECT_CURRENT_STATE.md
- docs/03_PROJECT_STRUCTURE_MAP.md
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md
- docs/05_BUTTON_ACTION_MAP.md
- docs/06_FORM_AND_VALIDATION_SPEC.md
- docs/07_DATA_AND_SQL_MODEL.md
- docs/08_ORDER_STATUS_AND_STATE_MACHINE.md
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md
- docs/10_ANIMATION_AND_MICROINTERACTION_SPEC.md
- docs/11_API_AND_BACKEND_REQUIREMENTS.md
- docs/12_DEPENDENCY_AND_TOOLING_PLAN.md
- docs/13_IMPLEMENTATION_MASTER_PLAN.md
- docs/14_FINAL_EXPECTED_DELIVERABLE.md
- docs/15_AI_WORKING_RULES.md
- docs/TOOLS_AND_SERVICES_STRATEGY.md
- docs/PHASE_0_STABILIZATION_REPORT.md

Also read any existing PHASE_*_REPORT.md files in docs/ to understand what work has already been completed.

Do not assume anything from previous chats.
Use the current workspace files as your single source of truth.

==================================================
RULES (Apply to ALL prompts in this session)
==================================================

1. Work in small batches. Never change more than 3 files at once without explaining.
2. Read a file COMPLETELY before editing it.
3. Do NOT overwrite working code. Preserve existing functionality.
4. Do NOT install new npm packages unless I explicitly approve.
5. Use StyleSheet.create() + constants/brand.ts tokens for all styling.
6. Do NOT re-enable NativeWind or Tailwind in React Native code.
7. Do NOT hardcode colors. Always import from constants/brand.ts.
8. Do NOT use emojis as final production icons. Use @expo/vector-icons or SVG assets.
9. Respect Arabic RTL text direction where applicable.
10. After every change, explain WHAT changed and WHAT to test.
11. Do NOT touch backend/Supabase unless the task explicitly says so.
12. Do NOT touch driver-app or admin unless the task explicitly says so.
13. Do NOT delete or move existing screen files.
14. Do NOT modify shared/types.ts without asking me first.
15. Verify that `npx expo start` still works after your changes.

==================================================
YOUR TASK RIGHT NOW
==================================================

1. Read ALL the docs listed above.
2. Summarize the current project state in 10 bullet points or fewer.
3. Identify which implementation phase we are currently in.
4. List what has been completed so far (from existing report files).
5. DO NOT WRITE ANY CODE YET.
6. Tell me: "Ready for your next instruction." and wait.
```

`---END PROMPT 0---`

### Prompt 0 Details

| Item | Value |
|------|-------|
| **Role** | Project context loader and state summarizer |
| **Context files to read** | All 15 numbered docs + TOOLS_AND_SERVICES_STRATEGY + PHASE_0_STABILIZATION_REPORT + any existing PHASE_*_REPORT files |
| **What to do** | Read docs, summarize state, identify current phase, wait for instructions |
| **What NOT to do** | Do not write code, do not modify files, do not install packages |
| **Files/folders to inspect** | `docs/` directory |
| **Files allowed to modify** | None |
| **Files NOT allowed to modify** | Everything |
| **Required output format** | Bullet-point summary + current phase identification |
| **Required report file** | None (this is a setup prompt) |
| **Verification checklist** | ✅ All docs read ✅ Summary provided ✅ No code written ✅ Waiting for instruction |

---
---

# PROMPT 1 — VERIFY CURRENT STATE

`---START PROMPT 1---`

```
You are inside the JAHEEZ project. You have already read all docs (Prompt 0).

Your task is to VERIFY the current state of the project. Do NOT redesign or rebuild anything.

==================================================
ROLE
==================================================
Project health inspector. Read and verify. Report findings. No coding unless explicitly approved.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/PHASE_0_STABILIZATION_REPORT.md
- docs/02_PROJECT_CURRENT_STATE.md
- docs/13_IMPLEMENTATION_MASTER_PLAN.md
- user-app/package.json
- user-app/app/_layout.tsx
- user-app/constants/brand.ts
- user-app/lib/supabase.ts

==================================================
WHAT TO DO
==================================================
1. Confirm that Phase 0 stabilization is complete by checking each item in PHASE_0_STABILIZATION_REPORT.md.
2. Try to verify that the app starts: check for obvious import errors, missing dependencies, broken config.
3. List every screen file in user-app/app/ (auth, tabs, flows) with a one-line status.
4. Check that brand.ts exists and contains the expected color tokens.
5. Check that supabase.ts does NOT contain hardcoded credentials.
6. List any startup blockers you find.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT write or modify any code.
- Do NOT install packages.
- Do NOT touch driver-app or admin.
- Do NOT change any config files.
- Only fix startup blockers IF I explicitly say "fix it".

==================================================
FILES/FOLDERS TO INSPECT
==================================================
- user-app/app/(auth)/ — all files
- user-app/app/(tabs)/ — all files
- user-app/app/(flows)/ — all files if exists
- user-app/app/_layout.tsx
- user-app/constants/brand.ts
- user-app/lib/supabase.ts
- user-app/package.json
- user-app/tsconfig.json

==================================================
FILES ALLOWED TO MODIFY
==================================================
- NONE (read-only audit)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- Everything

==================================================
REQUIRED OUTPUT FORMAT
==================================================
Create a structured report with:
1. Phase 0 Verification Checklist (pass/fail for each item)
2. App Startup Status (can it start? list blockers if any)
3. Screen File Inventory (file path + status)
4. Brand Token Verification (all expected tokens present?)
5. Security Check (no hardcoded secrets?)
6. Blockers List (things that must be fixed before continuing)
7. Recommendation (which prompt to run next)

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_0_VERIFICATION_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Phase 0 items all confirmed
- [ ] All screen files listed
- [ ] brand.ts verified
- [ ] supabase.ts checked for secrets
- [ ] No code was modified
- [ ] Report file created
```

`---END PROMPT 1---`

---
---

# PROMPT 2 — DESIGN ASSETS AUDIT AND ORGANIZATION

`---START PROMPT 2---`

```
You are inside the JAHEEZ project. You have read all docs.

Your task is to AUDIT and ORGANIZE the design assets. Do NOT redesign any screens yet.

==================================================
ROLE
==================================================
Asset inspector and organizer. Catalog what exists, what is missing, what needs fixing.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 13: Design/Asset Tooling)
- docs/03_PROJECT_STRUCTURE_MAP.md

==================================================
WHAT TO DO
==================================================
1. List ALL files in user-app/assets/ (recursively, include file sizes).
2. List ALL files in assets/ (root level, if exists).
3. Categorize each asset: icon, illustration, background, splash, font, video, unknown.
4. Identify assets used by screens vs orphaned/unused assets.
5. Check for emoji usage in screen files that should use real icons.
6. Create a "missing assets" checklist from the design spec.
7. Verify that all 5 service category icons exist (food, grocery, pharmacy, parcel, errand).
8. Verify that splash image and video files exist and are reasonably sized.
9. Suggest an organized folder structure if assets are disorganized.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT delete any asset files.
- Do NOT redesign screens.
- Do NOT modify screen files.
- Do NOT install packages.
- Do NOT create new illustration files (just document what is needed).

==================================================
FILES/FOLDERS TO INSPECT
==================================================
- user-app/assets/ (all subdirectories)
- assets/ (root)
- user-app/app/ (scan for emoji usage and asset references)
- user-app/components/ui/ (scan for asset references)

==================================================
FILES ALLOWED TO MODIFY
==================================================
- NONE (audit only, create report only)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- All source files
- All asset files (do not move, delete, or rename)

==================================================
REQUIRED OUTPUT FORMAT
==================================================
1. Complete Asset Inventory Table (file path, type, size, used by, status)
2. Missing Assets Checklist (what the design spec requires but doesn't exist)
3. Emoji Usage Report (files using emojis that should use real icons)
4. Oversized Assets List (files > 500KB that need compression)
5. Organization Recommendations

==================================================
REQUIRED REPORT FILE
==================================================
Update or create: docs/PHASE_1_ASSET_ALIGNMENT_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] All asset files cataloged
- [ ] Missing assets documented
- [ ] Emoji usage flagged
- [ ] Oversized files identified
- [ ] No files modified
- [ ] Report created
```

`---END PROMPT 2---`

---
---

# PROMPT 3 — IMAGE OPTIMIZATION

`---START PROMPT 3---`

```
You are inside the JAHEEZ project. You have read all docs and the asset audit report.

Your task is to OPTIMIZE oversized image assets safely.

==================================================
ROLE
==================================================
Asset optimizer. Compress images. Preserve originals. Update references only if safe.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/PHASE_1_ASSET_ALIGNMENT_REPORT.md (the report from Prompt 2)
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md (Section: Production Asset Requirements)

==================================================
WHAT TO DO
==================================================
1. Read the asset audit report to identify files > 500KB.
2. For each oversized image, determine if it can be safely compressed.
3. If the asset is a PNG > 1MB, suggest compression to WebP or optimized PNG.
4. If a script can help, create a helper script in docs/ or a scratch folder — do NOT run it without my approval.
5. If assets can be compressed in-place, ask for my approval before doing so.
6. Document all planned changes BEFORE making them.
7. Update asset references in code ONLY if the filename changes AND I approve.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT delete original image files without approval.
- Do NOT change image filenames without approval.
- Do NOT modify any screen layout or design.
- Do NOT install new packages (like sharp or imagemin) without approval.
- Do NOT touch non-image files.

==================================================
FILES/FOLDERS TO INSPECT
==================================================
- user-app/assets/ (all images)
- assets/ (root, all images)

==================================================
FILES ALLOWED TO MODIFY
==================================================
- Image files in user-app/assets/ (ONLY after explicit approval)
- docs/PHASE_1B_IMAGE_OPTIMIZATION_REPORT.md (create this)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- All source code files
- brand.ts
- Any screen files
- package.json

==================================================
REQUIRED OUTPUT FORMAT
==================================================
1. Oversized Images Table (file, current size, recommended action, new size estimate)
2. Compression Plan (what will be done, in what order)
3. Risk Assessment (will any references break?)
4. Changes Made (after approval, document what was changed)

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_1B_IMAGE_OPTIMIZATION_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Oversized images identified
- [ ] Compression plan documented before execution
- [ ] No files changed without approval
- [ ] Asset references verified after changes
- [ ] Expo still starts after changes
- [ ] Report created
```

`---END PROMPT 3---`

---
---

# PROMPT 4 — UI COMPONENT AUDIT

`---START PROMPT 4---`

```
You are inside the JAHEEZ project. You have read all docs.

Your task is to AUDIT and IMPROVE the reusable UI components. Do NOT redesign full screens yet.

==================================================
ROLE
==================================================
Component quality engineer. Improve shared components one at a time.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md (Component Styles section)
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (to understand which components each screen uses)
- docs/15_AI_WORKING_RULES.md (code patterns section)
- user-app/constants/brand.ts

==================================================
WHAT TO DO
==================================================
1. List ALL files in user-app/components/ui/.
2. For each component, read the file and note:
   - Does it use brand.ts tokens? (colors, spacing, radius, shadows)
   - Does it follow the 52px button height / 52px input height / 16px card radius spec?
   - Does it have accessibilityLabel on Pressable elements?
   - Does it handle loading and error states?
   - Does it export a named export (not default)?
3. Improve components ONE AT A TIME, starting with the most-used ones:
   - Button → must be 52px, pill radius, red primary, loading spinner
   - Input → must be 52px, 12px radius, red focus border
   - Card → must be white bg, 16px radius, standard shadow
   - OTPInput → 6-digit boxes, auto-advance, shake on error
   - Loader / Shimmer → skeleton loading pattern
   - StatusPill / Badge → pill shape, semantic colors
   - OrderCard → order summary card with status
   - BottomSheet → drag handle, slide animation
4. After each component improvement, explain what changed and verify it compiles.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT modify screen files (only components/ui/).
- Do NOT install packages.
- Do NOT add data fetching logic to components.
- Do NOT change component file names.
- Do NOT use NativeWind/Tailwind classes.

==================================================
FILES/FOLDERS TO INSPECT
==================================================
- user-app/components/ui/ — all files
- user-app/constants/brand.ts

==================================================
FILES ALLOWED TO MODIFY
==================================================
- user-app/components/ui/*.tsx (existing components only)
- New files in user-app/components/ui/ if a listed component doesn't exist yet

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/app/ (all screen files)
- user-app/store/ (all stores)
- user-app/hooks/ (all hooks)
- user-app/lib/ (all API files)
- brand.ts (read only)
- package.json

==================================================
REQUIRED OUTPUT FORMAT
==================================================
For each component:
1. Before State (what was wrong)
2. Changes Made (what was fixed)
3. After State (what it looks like now)
4. Test Instruction (how to visually verify)

==================================================
REQUIRED REPORT FILE
==================================================
Update or create: docs/PHASE_2_COMPONENT_AUDIT_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] All components in ui/ audited
- [ ] Components use brand.ts tokens (no hardcoded colors)
- [ ] Button is 52px with pill radius
- [ ] Input is 52px with red focus border
- [ ] Card has 16px radius and shadow
- [ ] accessibilityLabel added to all Pressable elements
- [ ] No screen files modified
- [ ] Expo still starts
- [ ] Report created
```

`---END PROMPT 4---`

---
---

# PROMPT 5 — ANIMATION FOUNDATION

`---START PROMPT 5---`

```
You are inside the JAHEEZ project. You have read all docs.

Your task is to AUDIT and IMPROVE animation components. Do NOT add new packages without approval.

==================================================
ROLE
==================================================
Animation quality engineer. Improve existing animation patterns. Use already-installed libraries.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/10_ANIMATION_AND_MICROINTERACTION_SPEC.md
- docs/12_DEPENDENCY_AND_TOOLING_PLAN.md (check which animation libs are installed)
- user-app/package.json (verify react-native-reanimated, moti are installed)

==================================================
WHAT TO DO
==================================================
1. Check which animation libraries are actually installed in package.json.
2. List any existing animation-related components (AnimatedPressable, FadeInView, Shimmer, etc.).
3. If these components exist, audit them for brand.ts compliance and performance.
4. Improve or create these animation utilities (using ONLY installed libraries):
   - AnimatedPressable: scale 0.98 on press with 100ms spring
   - FadeInView: fade + slight slide-up on mount (300ms)
   - Shimmer/Skeleton: loading placeholder with shimmer effect
   - Button press states: visual feedback on all buttons
   - Screen transitions: ensure Expo Router transitions are smooth
5. Ensure all animations respect `reduceMotionEnabled` accessibility setting.
6. Work one component at a time. Explain each change.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT install new npm packages without asking me first.
- Do NOT modify screen files.
- Do NOT add complex gesture handlers without approval.
- Do NOT create Lottie animations (document need instead).
- Do NOT use NativeWind.

==================================================
FILES/FOLDERS TO INSPECT
==================================================
- user-app/components/ui/ — animation-related files
- user-app/package.json — check installed animation libs

==================================================
FILES ALLOWED TO MODIFY
==================================================
- user-app/components/ui/*.tsx (animation components only)
- New animation utility files in user-app/components/ui/

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/app/ (all screen files)
- package.json
- _layout.tsx

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_2B_ANIMATION_FOUNDATION_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Installed animation libraries verified
- [ ] AnimatedPressable working
- [ ] FadeInView working
- [ ] Shimmer/Skeleton working
- [ ] Accessibility reduceMotion respected
- [ ] No new packages installed
- [ ] Expo still starts
- [ ] Report created
```

`---END PROMPT 5---`

---
---

# PROMPT 6 — AUTH FLOW POLISH

`---START PROMPT 6---`

```
You are inside the JAHEEZ project. You have read all docs. Components have been improved (Prompts 4-5).

Your task is to POLISH the authentication flow screens.

==================================================
ROLE
==================================================
Auth flow engineer. Polish existing screens. Add forgot password. Improve forms and validation.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Auth screens section)
- docs/05_BUTTON_ACTION_MAP.md (Auth buttons section)
- docs/06_FORM_AND_VALIDATION_SPEC.md (Forms 1-3: Login, Register, OTP)
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 5: OTP/Auth Strategy)
- user-app/app/(auth)/ — read ALL files
- user-app/lib/authApi.ts
- user-app/store/authStore.ts (if exists)

==================================================
WHAT TO DO
==================================================
1. Read ALL auth screen files completely before making any changes.
2. Verify the auth flow order: splash → welcome/onboarding → login → register → OTP → home.
3. IMPORTANT: OTP screen must NOT be the first screen users see. Splash or welcome must come first.
4. Polish each screen in order:
   a. splash.tsx — verify animation, timing, auto-navigation
   b. welcome.tsx or onboarding.tsx — verify carousel/slides, "Get Started" button
   c. login.tsx — email + password, validation, loading state, error banners, "Forgot Password?" link
   d. register.tsx — email, password, full name, city selector, validation, loading
   e. Create forgot.tsx if it doesn't exist — email input, send reset OTP, navigate to OTP
   f. otp.tsx — 6 digit boxes, auto-advance, 60-second countdown timer, resend button, shake on error
5. Use Supabase Email OTP strategy (see TOOLS_AND_SERVICES_STRATEGY.md):
   - Login: supabase.auth.signInWithPassword({ email, password })
   - Register: supabase.auth.signUp({ email, password })
   - OTP verify: supabase.auth.verifyOtp({ email, token, type: 'signup' })
   - Forgot: supabase.auth.signInWithOtp({ email }) then verify
6. Ensure all forms use brand.ts tokens (RED for buttons, 52px height, etc.).
7. Ensure all inputs have accessibilityLabel.
8. Ensure loading and error states are handled on every screen.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT rewrite the entire auth system from scratch.
- Do NOT change the Supabase configuration.
- Do NOT touch (tabs) or (flows) screens.
- Do NOT install packages.
- Do NOT add phone/SMS OTP (email only for V1).
- Do NOT add Google/Apple social login yet.

==================================================
FILES/FOLDERS TO INSPECT
==================================================
- user-app/app/(auth)/ — all files
- user-app/lib/authApi.ts
- user-app/store/authStore.ts
- user-app/lib/supabase.ts (read only)

==================================================
FILES ALLOWED TO MODIFY
==================================================
- user-app/app/(auth)/*.tsx
- user-app/lib/authApi.ts (if needed for Supabase calls)
- New file: user-app/app/(auth)/forgot.tsx (if it doesn't exist)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/lib/supabase.ts (connection config)
- user-app/app/(tabs)/ (all files)
- user-app/app/(flows)/ (all files)
- package.json
- brand.ts (read only)
- shared/types.ts

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_3_AUTH_POLISH_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Auth flow order is correct (splash → welcome → login → register → OTP → home)
- [ ] OTP is NOT the first screen
- [ ] Login screen has email + password + validation + loading + errors
- [ ] Register screen has all required fields + validation
- [ ] Forgot password screen exists and works
- [ ] OTP has 6-digit input, countdown timer, resend, shake on error
- [ ] All forms use brand.ts tokens
- [ ] All inputs have accessibilityLabel
- [ ] Expo still starts
- [ ] Auth flow navigates correctly between screens
- [ ] Report created
```

`---END PROMPT 6---`

---
---

# PROMPT 7 — HOME AND SERVICES POLISH

`---START PROMPT 7---`

```
You are inside the JAHEEZ project. Auth flow is polished (Prompt 6).

Your task is to POLISH the home screen and service browsing experience.

==================================================
ROLE
==================================================
Home screen engineer. Polish layout, categories, search, promos. Replace emoji icons with real assets.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Home screen section)
- docs/05_BUTTON_ACTION_MAP.md (Home buttons)
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md (Category tints, asset inventory)
- docs/PHASE_1_ASSET_ALIGNMENT_REPORT.md (what assets exist, what is missing)
- user-app/app/(tabs)/index.tsx

==================================================
WHAT TO DO
==================================================
1. Read the home screen file completely.
2. Polish the following sections in order:
   a. Header area (location display, greeting, notification bell)
   b. Search bar entry (navigate to search screen, do not implement search logic here)
   c. Service category cards (Food, Grocery, Pharmacy, Parcel, Errand):
      - Replace ANY emoji icons with real asset images or @expo/vector-icons
      - Use the category tint colors from brand.ts
      - Ensure card press navigates to correct category
   d. Promo banner section (horizontal scroll, placeholder if no promos)
   e. Featured stores section (horizontal scroll of store cards)
   f. Active order card (if user has an active order, show a summary card at top)
3. Ensure all spacing uses 8px grid multiples.
4. Ensure all text uses Cairo font family.
5. Ensure all cards use SHADOW from brand.ts.
6. Verify pull-to-refresh is implemented.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT modify the search screen logic.
- Do NOT modify store detail screens.
- Do NOT change the tab bar.
- Do NOT add data fetching calls (keep existing patterns).
- Do NOT install packages.
- Do NOT use emojis as final icons — use Ionicons or PNG assets.

==================================================
FILES/FOLDERS TO INSPECT
==================================================
- user-app/app/(tabs)/index.tsx (home screen)
- user-app/app/(tabs)/search.tsx (read only)
- user-app/components/ui/ (use existing components)
- user-app/assets/ (available icons/illustrations)

==================================================
FILES ALLOWED TO MODIFY
==================================================
- user-app/app/(tabs)/index.tsx
- user-app/components/ui/*.tsx (if creating a new component used by home)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/app/(auth)/ (already polished)
- package.json
- brand.ts
- store files, hook files, lib files

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_4_HOME_SERVICES_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] No emojis used as final icons
- [ ] Category cards use real icons and category tint colors
- [ ] All cards have proper shadow and radius
- [ ] Cairo font used for all text
- [ ] 8px grid spacing throughout
- [ ] Pull-to-refresh works
- [ ] Navigation from category cards works
- [ ] Expo still starts
- [ ] Report created
```

`---END PROMPT 7---`

---
---

# PROMPT 8 — STORE / LIST / PRODUCT POLISH

`---START PROMPT 8---`

```
You are inside the JAHEEZ project. Home screen is polished (Prompt 7).

Your task is to POLISH the store listing, store detail, and product browsing screens.

==================================================
ROLE
==================================================
Store/product screen engineer. Polish layouts. Keep existing data layer safe.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Store screens section)
- docs/05_BUTTON_ACTION_MAP.md (Store buttons)
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md (Card, Badge styles)

==================================================
WHAT TO DO
==================================================
1. Find and read ALL store/product related screen files.
2. Polish in order:
   a. Store listing screen (category/[id].tsx or equivalent) — grid/list of stores, filters
   b. Store detail screen (store/[id].tsx or equivalent) — store info, menu categories, items
   c. Product detail (bottom sheet or modal) — item image, name, price, description, size/extras selection, add to cart
   d. Search results screen — store search results display
   e. Favorites — heart toggle on store cards, saved favorites list
3. Ensure all price displays use DH (Moroccan Dirham) format.
4. Ensure store cards show: image, name, rating, delivery time, delivery fee.
5. Ensure product detail shows: image, name, description, price, options (size, extras).
6. Use existing data layer (React Query / Zustand) — do NOT rewrite data fetching.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT rewrite the data fetching layer.
- Do NOT modify Supabase queries.
- Do NOT touch cart or checkout screens (next prompt).
- Do NOT touch auth screens (already done).
- Do NOT install packages.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- Store/product screen files in user-app/app/(flows)/ or user-app/app/(tabs)/
- user-app/components/ui/*.tsx (if creating shared store components)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/store/ (keep data layer safe)
- user-app/hooks/ (keep hooks safe)
- user-app/lib/ (keep API layer safe)
- package.json, brand.ts, shared/types.ts

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_5_STORE_LIST_PRODUCT_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Store listing shows cards with image, name, rating, delivery info
- [ ] Store detail shows menu categories and items
- [ ] Product detail bottom sheet works with options
- [ ] Prices displayed in DH format
- [ ] Favorite toggle works visually
- [ ] Existing data layer preserved
- [ ] Expo still starts
- [ ] Report created
```

`---END PROMPT 8---`

---
---

# PROMPT 9 — CART AND CHECKOUT POLISH

`---START PROMPT 9---`

```
You are inside the JAHEEZ project. Store screens are polished (Prompt 8).

Your task is to POLISH the cart and checkout screens. Payment is Cash on Delivery (COD) ONLY for V1.

==================================================
ROLE
==================================================
Cart/checkout engineer. Polish purchase flow. COD only. Strict address validation.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/06_FORM_AND_VALIDATION_SPEC.md (Forms 5-6: Address, Checkout)
- docs/05_BUTTON_ACTION_MAP.md (Cart/Checkout buttons)
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 9: Payment Strategy)

==================================================
WHAT TO DO
==================================================
1. Polish the cart screen:
   - Item list with quantity +/- buttons
   - Remove item button (swipe or tap)
   - Subtotal, delivery fee, discount, total display
   - Promo code input with "Apply" button
   - "Proceed to Checkout" button
2. Polish the checkout screen:
   - Address selection (list saved addresses, "Add new" option)
   - Address field: MINIMUM 15 characters (must include landmarks/directions, see form spec)
   - Special delivery instructions (optional textarea, max 200 chars)
   - Payment method: Cash on Delivery (COD) is the ONLY enabled option
   - Card and Wallet options should be visible but GRAYED OUT / DISABLED with "Coming soon" label
   - Order summary (items, fees, total)
   - "Confirm Order" button with loading state
3. Order confirmation screen: success message, order number, "Track Order" button.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT implement Stripe card payment (deferred to V2).
- Do NOT implement wallet payment (deferred to V2).
- Do NOT enable card/wallet as selectable payment methods.
- Do NOT touch auth or home screens.
- Do NOT modify Supabase order creation logic (just polish the UI).
- Do NOT install packages.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- Cart/checkout screen files in user-app/app/(flows)/
- user-app/components/ui/*.tsx (if creating checkout components)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/store/ (keep cart store safe — only polish UI)
- user-app/lib/ (keep API safe)
- package.json, brand.ts, shared/types.ts

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_6_CART_CHECKOUT_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Cart shows items with quantity controls
- [ ] Promo code input works visually
- [ ] Address field requires 15+ character descriptive input
- [ ] COD is the only selectable payment method
- [ ] Card/Wallet visible but disabled with "Coming soon"
- [ ] Order summary shows correct totals
- [ ] Confirm button has loading state
- [ ] Confirmation screen shows order number
- [ ] Expo still starts
- [ ] Report created
```

`---END PROMPT 9---`

---
---

# PROMPT 10 — ORDER STATUS AND TRACKING POLISH

`---START PROMPT 10---`

```
You are inside the JAHEEZ project. Cart/checkout is polished (Prompt 9).

Your task is to POLISH the orders list, order detail, and tracking screens. Use STATUS STEPPER (not live GPS) for V1.

==================================================
ROLE
==================================================
Order tracking engineer. Status timeline stepper. No live GPS map in V1.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/08_ORDER_STATUS_AND_STATE_MACHINE.md
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Orders/Tracking section)
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 10: Maps/Tracking Strategy)

==================================================
WHAT TO DO
==================================================
1. Polish the orders list screen (tabs):
   - Active orders section (in-progress orders at top)
   - Completed orders section
   - Cancelled orders section
   - Empty state when no orders
2. Polish the order detail screen:
   - Order number, date, status badge
   - Items list with quantities and prices
   - Address, delivery fee, total
   - Status timeline stepper (see state machine doc):
     * Order Received → Confirmed → Preparing → On the Way → Delivered
     * Color-coded steps (gray=pending, blue=current, green=completed, red=cancelled)
   - Driver info card (name, phone — placeholder if no driver yet)
3. Support/contact actions:
   - "Contact Driver" button (tel: link)
   - "WhatsApp Support" button (https://wa.me/212xxxxxxxxx?text=... deep link with order details)
   - "Report Issue" redirects to WhatsApp (not a database ticket in V1)
4. Do NOT build a live GPS map. Instead, show the status stepper timeline prominently.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT implement live GPS map tracking.
- Do NOT build a real-time driver location feature.
- Do NOT create a database-backed support ticket system.
- Do NOT touch cart, checkout, or auth screens.
- Do NOT install packages.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- Order/tracking screen files in user-app/app/(tabs)/ and user-app/app/(flows)/
- user-app/components/ui/*.tsx (status timeline components)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/store/ (keep order store safe)
- user-app/lib/ (keep API safe)
- package.json, brand.ts, shared/types.ts

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_7_ORDERS_TRACKING_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Orders list shows active/completed/cancelled sections
- [ ] Empty state displayed when no orders
- [ ] Order detail shows full order info
- [ ] Status timeline stepper is color-coded and clear
- [ ] Driver info card shown when driver is assigned
- [ ] WhatsApp support deep link works with order details
- [ ] No live GPS map implemented
- [ ] Expo still starts
- [ ] Report created
```

`---END PROMPT 10---`

---
---

# PROMPT 11 — PROFILE, SETTINGS, ADDRESSES, SUPPORT

`---START PROMPT 11---`

```
You are inside the JAHEEZ project. Orders/tracking is polished (Prompt 10).

Your task is to POLISH the profile, settings, addresses, and support screens.

==================================================
ROLE
==================================================
Profile/settings engineer. Polish user account screens. Text-based addresses (no map picker in V1).

==================================================
CONTEXT FILES TO READ
==================================================
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Profile/Settings section)
- docs/06_FORM_AND_VALIDATION_SPEC.md (Forms 4-5: Profile Edit, Address)

==================================================
WHAT TO DO
==================================================
1. Polish profile main screen:
   - Avatar (placeholder if none), full name, email, phone
   - Menu items: Edit Profile, My Addresses, Language, FAQ, Support, Logout
   - "Delete Account" at bottom (with confirmation)
2. Polish edit profile screen:
   - Edit full name, city selector
   - Avatar image picker (camera or gallery)
   - Save button with loading state
3. Polish addresses screen:
   - List of saved addresses with labels
   - Add new address button
   - Edit/delete existing addresses
   - Set default address toggle
   - Address input: minimum 15 characters with landmark instructions (NO MAP PICKER in V1)
4. Polish language settings:
   - Arabic (العربية), French (Français), English — radio selection
   - Selection saved to Zustand/AsyncStorage
5. FAQ screen: static list of questions and answers
6. Support: "Contact Support on WhatsApp" button (deep link)
7. Logout: clear auth state, navigate to login
8. Delete account: confirmation dialog, then call delete

==================================================
WHAT NOT TO DO
==================================================
- Do NOT add a map picker for addresses (deferred to V2).
- Do NOT add Google Maps geocoding.
- Do NOT modify auth store logic (only call existing logout method).
- Do NOT touch other screens.
- Do NOT install packages.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- Profile/settings screen files in user-app/app/(tabs)/ and user-app/app/(flows)/
- user-app/components/ui/*.tsx (if creating profile components)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/store/authStore.ts (use existing methods, don't rewrite)
- user-app/lib/supabase.ts
- package.json, brand.ts, shared/types.ts

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_8_PROFILE_SUPPORT_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Profile shows user info correctly
- [ ] Edit profile saves changes
- [ ] Address list works with add/edit/delete
- [ ] Address input requires 15+ chars
- [ ] No map picker used
- [ ] Language selector works and persists
- [ ] WhatsApp support button works
- [ ] Logout clears state and navigates to login
- [ ] Expo still starts
- [ ] Report created
```

`---END PROMPT 11---`

---
---

# PROMPT 12 — BACKEND / DATA VERIFICATION

`---START PROMPT 12---`

```
You are inside the JAHEEZ project. All user app UI screens are polished (Prompts 6-11).

Your task is to VERIFY the backend data layer. Do NOT create new UI.

==================================================
ROLE
==================================================
Backend data auditor. Verify Supabase tables match docs. Identify mock vs real data. Create integration plan.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/07_DATA_AND_SQL_MODEL.md
- docs/11_API_AND_BACKEND_REQUIREMENTS.md
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Backend strategy)
- user-app/lib/supabase.ts
- user-app/lib/api.ts
- user-app/lib/authApi.ts
- user-app/store/ — all store files
- user-app/hooks/ — all hook files

==================================================
WHAT TO DO
==================================================
1. Read ALL files in user-app/lib/ and user-app/store/.
2. Map each Supabase table from the data model doc to actual code usage:
   - Which tables are queried by which hooks/stores?
   - Which tables have no code references yet?
3. Identify mock/fallback data:
   - Which screens use hardcoded/mock data?
   - Which screens fetch from Supabase?
4. Verify supabase.ts configuration (no hardcoded keys).
5. Check if RLS (Row-Level Security) policies are mentioned or configured.
6. Create an integration priority order:
   - What should be connected to real data FIRST?
   - What can remain mock for now?
7. List any API endpoints that exist but aren't used.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT create new UI screens.
- Do NOT modify screen files.
- Do NOT modify Supabase configuration.
- Do NOT create new database tables or migrations.
- Do NOT install packages.
- Do NOT change store logic yet (just audit).

==================================================
FILES/FOLDERS TO INSPECT
==================================================
- user-app/lib/ — all files
- user-app/store/ — all files
- user-app/hooks/ — all files
- scripts/admin-api.js (read only — note its size and purpose)
- supabase/ directory (if exists — migrations, functions)

==================================================
FILES ALLOWED TO MODIFY
==================================================
- NONE (audit only)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- Everything

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_9_BACKEND_DATA_VERIFICATION.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] All lib/ files audited
- [ ] All store/ files audited
- [ ] All hooks/ files audited
- [ ] Mock vs real data mapped
- [ ] Supabase config verified (no hardcoded keys)
- [ ] Integration priority order created
- [ ] No code modified
- [ ] Report created
```

`---END PROMPT 12---`

---
---

# PROMPT 13 — AUTH / OTP BACKEND INTEGRATION

`---START PROMPT 13---`

```
You are inside the JAHEEZ project. Backend data has been audited (Prompt 12).

Your task is to implement or verify the EMAIL OTP authentication integration with Supabase.

==================================================
ROLE
==================================================
Auth integration engineer. Connect auth screens to Supabase Email OTP. Verify full flow.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 5: OTP/Auth Strategy)
- docs/06_FORM_AND_VALIDATION_SPEC.md (Forms 1-3)
- docs/PHASE_9_BACKEND_DATA_VERIFICATION.md (auth section)

==================================================
WHAT TO DO
==================================================
1. Verify that user-app/lib/supabase.ts creates a valid Supabase client.
2. Implement or verify these auth calls:
   - Login: supabase.auth.signInWithPassword({ email, password })
   - Register: supabase.auth.signUp({ email, password, options: { data: { full_name, phone, city } } })
   - OTP Verify: supabase.auth.verifyOtp({ email, token, type: 'signup' })
   - Forgot Password: supabase.auth.resetPasswordForEmail(email)
   - Logout: supabase.auth.signOut()
3. Ensure authStore saves user session to AsyncStorage via Zustand persist.
4. Ensure auth state is checked on app launch to skip login if already authenticated.
5. Test error handling: invalid credentials, expired OTP, network errors.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT use phone/SMS OTP (email only for V1).
- Do NOT use WhatsApp for authentication.
- Do NOT use unofficial OTP providers.
- Do NOT modify the Supabase project configuration (just use the client).
- Do NOT touch non-auth screens.
- Do NOT install packages.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- user-app/lib/authApi.ts
- user-app/store/authStore.ts
- user-app/app/(auth)/*.tsx (only auth call wiring, not UI redesign)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/lib/supabase.ts (connection config — read only)
- user-app/app/(tabs)/ and (flows)/ screens
- package.json, shared/types.ts

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_10_AUTH_INTEGRATION_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Supabase client correctly configured
- [ ] Login with email + password works
- [ ] Registration creates user and triggers OTP email
- [ ] OTP verification works
- [ ] Forgot password sends reset email
- [ ] Auth state persists across app restart
- [ ] Logout clears state
- [ ] Error messages displayed for failures
- [ ] Expo still starts
- [ ] Report created
```

`---END PROMPT 13---`

---
---

# PROMPT 14 — ORDERS / STORES REAL DATA INTEGRATION

`---START PROMPT 14---`

```
You are inside the JAHEEZ project. Auth integration is complete (Prompt 13).

Your task is to connect home, store, and order screens to REAL Supabase data where possible.

==================================================
ROLE
==================================================
Data integration engineer. Replace mock data with Supabase queries. Keep fallbacks for dev safety.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/PHASE_9_BACKEND_DATA_VERIFICATION.md (integration priority)
- docs/07_DATA_AND_SQL_MODEL.md

==================================================
WHAT TO DO
==================================================
1. Review the integration priority from the backend audit report.
2. Connect screens to Supabase in this order:
   a. Featured stores (home screen) → query stores table
   b. Store detail → query store + menu_categories + menu_items
   c. Orders list → query orders table filtered by user_id
   d. Order detail → query order + order_items + order_status_log
3. Use React Query for all data fetching (useQuery pattern).
4. Keep graceful fallbacks: if Supabase returns empty/error, show empty state — do NOT crash.
5. Add loading skeletons while data loads.
6. Remove hardcoded mock data ONLY if real data is confirmed working.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT remove mock data if Supabase tables are empty.
- Do NOT modify Supabase schema.
- Do NOT create new tables or migrations.
- Do NOT touch auth flow (already done).
- Do NOT install packages.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- user-app/hooks/ (create or update data fetching hooks)
- user-app/store/ (update stores to use real data)
- user-app/lib/api.ts (add Supabase query functions)
- Screen files ONLY for wiring data (not layout changes)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/lib/supabase.ts
- package.json, shared/types.ts, brand.ts

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_11_DATA_INTEGRATION_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Home screen loads featured stores from Supabase
- [ ] Store detail loads real menu data
- [ ] Orders list shows user's orders
- [ ] Order detail shows full order info
- [ ] Loading skeletons shown during fetch
- [ ] Empty states shown when no data
- [ ] App doesn't crash if Supabase is unavailable
- [ ] Expo still starts
- [ ] Report created
```

`---END PROMPT 14---`

---
---

# PROMPT 15 — ADMIN API VERIFICATION

`---START PROMPT 15---`

```
You are inside the JAHEEZ project. User app data integration is done (Prompt 14).

Your task is to INSPECT the admin API and panel. Do NOT refactor the admin API.

==================================================
ROLE
==================================================
Admin API inspector. Document endpoints. Verify admin panel connection. Audit only.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/11_API_AND_BACKEND_REQUIREMENTS.md
- scripts/admin-api.js (read only — this is ~146KB, skim it carefully)
- admin/ directory structure

==================================================
WHAT TO DO
==================================================
1. List all files in the admin/ directory.
2. Read admin/src/App.tsx or equivalent entry point.
3. Skim scripts/admin-api.js to identify:
   - Express routes defined
   - Authentication middleware
   - Database queries
   - External service calls
4. Document all API endpoints found (method, path, purpose).
5. Check if admin panel connects to the same Supabase instance.
6. Identify security risks (hardcoded keys, missing auth checks).
7. Note: The 146KB admin-api.js is large. Do NOT refactor it. Just document what's there.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT refactor or rewrite admin-api.js.
- Do NOT modify admin panel code.
- Do NOT modify user-app.
- Do NOT install packages.
- Do NOT deploy anything.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- NONE (audit only)

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_12_ADMIN_API_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Admin directory structure documented
- [ ] API endpoints listed
- [ ] Auth middleware identified
- [ ] Security risks noted
- [ ] Supabase connection verified
- [ ] No code modified
- [ ] Report created
```

`---END PROMPT 15---`

---
---

# PROMPT 16 — DRIVER APP STABILIZATION

`---START PROMPT 16---`

```
You are inside the JAHEEZ project. User app and admin are audited.

Your task is to STABILIZE the driver app. Only after user app is stable. No full redesign.

==================================================
ROLE
==================================================
Driver app stabilizer. Fix critical issues. Get basic screens working. No full redesign.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Driver app section)
- docs/13_IMPLEMENTATION_MASTER_PLAN.md (Phase 10: Driver App)

==================================================
WHAT TO DO
==================================================
1. List all files in driver-app/ directory.
2. Check if driver-app starts without errors (read package.json, _layout.tsx).
3. Verify driver app has:
   - Auth screens (login/register)
   - Home/order queue screen
   - Active delivery screen
   - Earnings/profile screen
4. Fix ONLY critical startup blockers:
   - Missing dependencies
   - Broken imports
   - Missing brand.ts (should mirror user-app tokens)
5. Verify driver app assets folder has necessary files.
6. Document what works and what doesn't.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT do a full redesign of driver app.
- Do NOT modify user-app.
- Do NOT install packages without approval.
- Do NOT implement GPS tracking.
- Do NOT implement complex matching logic.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- driver-app/ files (only to fix startup blockers, with approval)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- user-app/ (all files)
- admin/ (all files)
- shared/types.ts (without approval)

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_13_DRIVER_APP_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Driver app directory audited
- [ ] Startup status documented (works / blockers)
- [ ] Screen inventory completed
- [ ] Critical blockers fixed (if approved)
- [ ] Assets status documented
- [ ] No user-app files modified
- [ ] Report created
```

`---END PROMPT 16---`

---
---

# PROMPT 17 — WALLET AND PAYMENTS VERIFICATION

`---START PROMPT 17---`

```
You are inside the JAHEEZ project.

Your task is to INSPECT wallet and payment code. Do NOT add payment providers without approval.

==================================================
ROLE
==================================================
Payment auditor. Inspect code. Document readiness. No new integrations without approval.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 9: Payment Strategy)
- docs/14_FINAL_EXPECTED_DELIVERABLE.md (V1 MVP definition)

==================================================
WHAT TO DO
==================================================
1. Find all payment-related files across the project.
2. Check wallet.tsx — is it a stub or functional?
3. Check checkout screen — is COD the default/only method?
4. Look for Stripe-related code (keys, SDK imports, payment intent logic).
5. Document the current state:
   - What payment methods are coded?
   - What is functional vs stubbed?
   - Are Stripe keys present in .env?
   - Is there a COD confirmation flow?
6. V1 requirement: Cash on Delivery ONLY. Wallet/Card deferred to V2.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT implement Stripe integration.
- Do NOT add new payment providers.
- Do NOT modify checkout flow.
- Do NOT touch wallet balance logic.
- Do NOT install packages.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- NONE (audit only)

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_14_WALLET_PAYMENTS_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] All payment files identified
- [ ] Wallet screen status documented
- [ ] COD flow verified
- [ ] Stripe code presence noted
- [ ] No code modified
- [ ] Report created
```

`---END PROMPT 17---`

---
---

# PROMPT 18 — NOTIFICATIONS AND SUPPORT

`---START PROMPT 18---`

```
You are inside the JAHEEZ project.

Your task is to AUDIT and IMPROVE the notifications and support systems. No paid providers without approval.

==================================================
ROLE
==================================================
Notification/support engineer. Verify in-app notification patterns. Ensure WhatsApp support works.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 11: Push Notification Strategy)
- docs/08_ORDER_STATUS_AND_STATE_MACHINE.md (User Notification Triggers)

==================================================
WHAT TO DO
==================================================
1. Check if Expo push notifications are configured in the project.
2. Check if notification listeners exist in _layout.tsx.
3. Verify WhatsApp support buttons work across the app (deep links).
4. Check for notification list screen (if exists, polish it; if not, document the need).
5. For V1: notifications are status-based (in-app polling), NOT push-based.
6. Ensure order status changes trigger visual updates when user opens the app.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT set up FCM/APNs push notification server.
- Do NOT add paid notification services.
- Do NOT install packages.
- Do NOT modify auth or checkout flows.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- Notification-related screen files (if they exist)
- user-app/components/ui/ (notification components)

==================================================
FILES NOT ALLOWED TO MODIFY
==================================================
- _layout.tsx (without approval)
- package.json
- user-app/lib/supabase.ts

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_15_NOTIFICATIONS_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] Push notification config status documented
- [ ] WhatsApp support deep links verified
- [ ] In-app status polling works
- [ ] Notification list screen audited
- [ ] No paid providers added
- [ ] Expo still starts
- [ ] Report created
```

`---END PROMPT 18---`

---
---

# PROMPT 19 — TESTING AND QA

`---START PROMPT 19---`

```
You are inside the JAHEEZ project. All features are implemented and polished.

Your task is to perform TESTING and QA. Create checklists and verify key flows.

==================================================
ROLE
==================================================
QA engineer. Type-check code. Verify flows. Create testing checklists. No new features.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/15_AI_WORKING_RULES.md (Testing section)
- docs/14_FINAL_EXPECTED_DELIVERABLE.md (Quality Gates)

==================================================
WHAT TO DO
==================================================
1. Run TypeScript type check: npx tsc --noEmit (in user-app directory).
2. Document all type errors and fix critical ones.
3. Verify `npx expo start` launches without errors.
4. Create a MANUAL QA CHECKLIST covering these flows:
   a. Auth: Register → OTP → Login → Logout
   b. Browse: Home → Category → Store → Product → Add to Cart
   c. Order: Cart → Checkout → Confirm (COD) → Orders List → Order Detail
   d. Profile: View → Edit → Save → Addresses → Language → FAQ
   e. Support: WhatsApp button works on all screens
5. Check for console errors/warnings in the Expo terminal.
6. Verify no hardcoded colors (search for # followed by hex in .tsx files).
7. Verify all Pressable elements have accessibilityLabel.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT add new features.
- Do NOT install testing frameworks without approval.
- Do NOT modify existing tests if they pass.
- Do NOT touch backend.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- Source files ONLY to fix type errors or critical bugs
- Do NOT change UI layout during QA

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_16_QA_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] TypeScript type check passed (or errors documented)
- [ ] Expo starts without crash
- [ ] Manual QA checklist created
- [ ] No hardcoded colors found
- [ ] All Pressable elements have accessibilityLabel
- [ ] Console errors documented
- [ ] Report created
```

`---END PROMPT 19---`

---
---

# PROMPT 20 — PRODUCTION BUILD PREPARATION

`---START PROMPT 20---`

```
You are inside the JAHEEZ project. QA is complete (Prompt 19).

Your task is to PREPARE for production build. Do NOT submit to app stores without approval.

==================================================
ROLE
==================================================
Build/deploy engineer. Configure EAS. Verify app icons/splash. Prepare env strategy.

==================================================
CONTEXT FILES TO READ
==================================================
- docs/12_DEPENDENCY_AND_TOOLING_PLAN.md (EAS section)
- docs/13_IMPLEMENTATION_MASTER_PLAN.md (Phase 13: Production Build)
- user-app/app.json (or app.config.ts)

==================================================
WHAT TO DO
==================================================
1. Verify app.json has correct:
   - App name: "JAHEEZ" (or "جاهز")
   - Bundle identifier / package name
   - Version number
   - App icon configuration
   - Splash screen configuration
2. Check if eas.json exists. If not, document what's needed (don't create without approval).
3. Verify app icons exist at correct sizes.
4. Verify splash screen image exists.
5. Document environment variable strategy:
   - What vars are needed for production?
   - Are they currently in .env or hardcoded?
   - What needs to move to EAS secrets?
6. Create a deployment checklist (what must happen before submitting).
7. Verify .gitignore protects .env files.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT submit to app stores.
- Do NOT run EAS build without approval.
- Do NOT modify app.json without approval.
- Do NOT create production credentials.
- Do NOT install packages.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- NONE (audit and document only)

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_17_PRODUCTION_PREP_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] app.json verified
- [ ] App icons verified
- [ ] Splash screen verified
- [ ] EAS config status documented
- [ ] Environment variables documented
- [ ] Deployment checklist created
- [ ] .gitignore protects secrets
- [ ] No builds triggered
- [ ] Report created
```

`---END PROMPT 20---`

---
---

# PROMPT 21 — FINAL FULL AUDIT

`---START PROMPT 21---`

```
You are inside the JAHEEZ project. All phases are complete.

Your task is the FINAL FULL AUDIT. Create a comprehensive project status report.

==================================================
ROLE
==================================================
Final auditor. Review everything. Produce the definitive project status. No code unless approved.

==================================================
CONTEXT FILES TO READ
==================================================
- ALL docs/PHASE_*_REPORT.md files
- docs/14_FINAL_EXPECTED_DELIVERABLE.md
- docs/13_IMPLEMENTATION_MASTER_PLAN.md
- docs/TOOLS_AND_SERVICES_STRATEGY.md

==================================================
WHAT TO DO
==================================================
1. Read ALL phase report files.
2. Create a final audit covering:

   A. MVP READINESS SCORECARD
   - Auth flow: Ready / Not Ready
   - Home/Browse: Ready / Not Ready
   - Store/Product: Ready / Not Ready
   - Cart/Checkout: Ready / Not Ready
   - Orders/Tracking: Ready / Not Ready
   - Profile/Settings: Ready / Not Ready
   - Data Integration: Ready / Not Ready
   - Driver App: Ready / Not Ready
   - Admin Panel: Ready / Not Ready

   B. REMAINING RISKS
   - Critical risks (blocks launch)
   - Medium risks (affects quality)
   - Low risks (nice to fix)

   C. TECHNICAL DEBT
   - Known issues from all phase reports
   - Mock data still in use
   - Missing features deferred to V2

   D. V2 FEATURES (Not in V1)
   - Stripe card payments
   - Wallet top-up
   - Live GPS tracking
   - Push notifications (FCM/APNs)
   - SMS/WhatsApp OTP
   - AI order moderation

   E. RECOMMENDATION
   - Is the app ready for internal testing?
   - Is the app ready for Safi beta launch?
   - What must be done before public launch?

3. Create a one-page summary for the founder.

==================================================
WHAT NOT TO DO
==================================================
- Do NOT write code.
- Do NOT deploy anything.
- Do NOT install packages.
- Do NOT make changes without explicit approval.

==================================================
FILES ALLOWED TO MODIFY
==================================================
- NONE

==================================================
REQUIRED REPORT FILE
==================================================
Create: docs/PHASE_18_FINAL_AUDIT_REPORT.md

==================================================
VERIFICATION CHECKLIST
==================================================
- [ ] All phase reports reviewed
- [ ] MVP readiness scorecard complete
- [ ] Risks categorized
- [ ] Technical debt documented
- [ ] V2 features listed
- [ ] Founder summary included
- [ ] Recommendation provided
- [ ] No code modified
- [ ] Report created
```

`---END PROMPT 21---`

---
---

# APPENDIX: QUICK REFERENCE

## Prompt Execution Order

```
PROMPT 0  → Session Start (read docs, no code)
PROMPT 1  → Verify Current State (audit only)
PROMPT 2  → Design Assets Audit (audit only)
PROMPT 3  → Image Optimization (with approval)
PROMPT 4  → UI Component Audit (modify components/ui/ only)
PROMPT 5  → Animation Foundation (modify components/ui/ only)
PROMPT 6  → Auth Flow Polish (modify (auth)/ screens)
PROMPT 7  → Home & Services Polish (modify (tabs)/index.tsx)
PROMPT 8  → Store/List/Product Polish (modify store screens)
PROMPT 9  → Cart & Checkout Polish (modify cart/checkout screens)
PROMPT 10 → Orders/Tracking Polish (modify order screens)
PROMPT 11 → Profile/Settings/Support (modify profile screens)
PROMPT 12 → Backend Data Verification (audit only, no code)
PROMPT 13 → Auth/OTP Integration (modify auth API layer)
PROMPT 14 → Real Data Integration (modify data hooks/stores)
PROMPT 15 → Admin API Verification (audit only, no code)
PROMPT 16 → Driver App Stabilization (modify driver-app only)
PROMPT 17 → Wallet/Payments Verification (audit only, no code)
PROMPT 18 → Notifications/Support Polish (modify notification UI)
PROMPT 19 → Testing & QA (type checks, manual QA)
PROMPT 20 → Production Build Prep (audit only, no code)
PROMPT 21 → Final Full Audit (report only, no code)
```

## Rules Applied to Every Prompt

1. Read files before editing
2. Work in small batches (max 3 files at a time)
3. Explain changes before making them
4. Preserve existing working code
5. No package installs without approval
6. Use StyleSheet.create() + brand.ts tokens
7. No NativeWind / Tailwind in React Native
8. No hardcoded colors
9. No emojis as production icons
10. Respect Arabic RTL
11. Verify Expo starts after every change
12. Create a report file after every phase

## Emergency: If Something Breaks

If Expo stops starting after a prompt:
1. Tell Antigravity: "Expo is not starting. Undo your last changes and find the cause."
2. Do NOT continue to the next prompt until the app starts again.
3. The AI must fix its own mistakes before proceeding.

---

**End of Prompt Sequence**
