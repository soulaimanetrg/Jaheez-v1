# ANTIGRAVITY CODING PROMPTS — JAHEEZ (جاهز)

**Purpose:** Complete copy-paste prompt pack for implementing JAHEEZ step-by-step inside Antigravity  
**Created:** 2026-05-20  
**Total Prompts:** 22 (Prompt 0 → Prompt 21)  
**Phase 0 Status:** ✅ COMPLETED (do not redo)

---

> [!CAUTION]
> **ONE PROMPT AT A TIME.** Never paste more than one prompt per Antigravity session. Wait for the AI to finish and produce its report file. Review the report. Fix any blockers. Only then paste the next prompt.

> [!WARNING]
> **If Expo stops starting** after any prompt, tell the AI: "Expo is broken. Undo your last changes and find the cause." Do NOT continue to the next prompt until the app starts again.

> [!IMPORTANT]
> **You can start a fresh Antigravity session for each prompt.** The documentation and report files carry all context between sessions. The AI will re-read them each time.

---

## HOW TO USE

1. Open Antigravity.
2. Copy everything between `>>>COPY START<<<` and `>>>COPY END<<<` for the prompt you want.
3. Paste it into the chat.
4. Let the AI work. Answer any questions it asks.
5. When it finishes, check that the report file was created in `docs/`.
6. Review the report. If something is wrong, tell the AI to fix it in the SAME session.
7. Only move to the next prompt when you are satisfied.

---

## PROMPT INDEX

| # | Name | Type | Report File |
|---|------|------|-------------|
| 0 | Session Start | Setup | — |
| 1 | Runtime Verification | Audit | `docs/RUNTIME_VERIFICATION_REPORT.md` |
| 2 | Design Assets Audit | Audit | `docs/PHASE_1_ASSET_ALIGNMENT_REPORT.md` |
| 3 | Asset Optimization | Code | `docs/PHASE_1B_ASSET_OPTIMIZATION_REPORT.md` |
| 4 | UI Component Audit | Code | `docs/PHASE_2_COMPONENT_AUDIT_REPORT.md` |
| 5 | Animation Foundation | Code | `docs/PHASE_2B_ANIMATION_FOUNDATION_REPORT.md` |
| 6 | Auth Flow Polish | Code | `docs/PHASE_3_AUTH_POLISH_REPORT.md` |
| 7 | Home & Services Polish | Code | `docs/PHASE_4_HOME_SERVICES_REPORT.md` |
| 8 | Store/List/Product Polish | Code | `docs/PHASE_5_STORE_LIST_PRODUCT_REPORT.md` |
| 9 | Cart & Checkout Polish | Code | `docs/PHASE_6_CART_CHECKOUT_REPORT.md` |
| 10 | Order Status & Tracking | Code | `docs/PHASE_7_ORDERS_TRACKING_REPORT.md` |
| 11 | Profile, Settings, Support | Code | `docs/PHASE_8_PROFILE_SUPPORT_REPORT.md` |
| 12 | Backend/Data Verification | Audit | `docs/PHASE_9_BACKEND_DATA_VERIFICATION.md` |
| 13 | Auth/OTP Backend Integration | Code | `docs/PHASE_10_AUTH_OTP_INTEGRATION_REPORT.md` |
| 14 | Real Data Integration | Code | `docs/PHASE_11_REAL_DATA_INTEGRATION_REPORT.md` |
| 15 | Admin API Verification | Audit | `docs/PHASE_12_ADMIN_API_REPORT.md` |
| 16 | Driver App Stabilization | Code | `docs/PHASE_13_DRIVER_APP_REPORT.md` |
| 17 | Wallet & Payments Verification | Audit | `docs/PHASE_14_WALLET_PAYMENTS_REPORT.md` |
| 18 | Notifications & Support | Code | `docs/PHASE_15_NOTIFICATIONS_SUPPORT_REPORT.md` |
| 19 | Testing & QA | Code | `docs/PHASE_16_QA_REPORT.md` |
| 20 | Production Build Preparation | Audit | `docs/PHASE_17_PRODUCTION_BUILD_REPORT.md` |
| 21 | Final Full Project Audit | Audit | `docs/FINAL_PROJECT_AUDIT.md` |

---

## UNIVERSAL RULES (applied to every prompt)

These rules are baked into every prompt below, but are listed here for reference:

1. Read all relevant docs BEFORE touching code.
2. Work in small batches — max 3 files per batch, explain before editing.
3. NEVER overwrite working code without explaining why.
4. NEVER install npm packages without explicit user approval.
5. Use `StyleSheet.create()` + `constants/brand.ts` tokens for all styling.
6. NEVER use NativeWind, Tailwind classes, or className in React Native.
7. NEVER hardcode color hex values — always import from `brand.ts`.
8. NEVER use emoji characters as final production icons — use `@expo/vector-icons` or asset PNGs/SVGs.
9. Respect Arabic/RTL text direction where applicable.
10. After EVERY batch of changes, explain what changed and what to test.
11. NEVER touch apps/features outside the current prompt's scope.
12. NEVER modify `shared/types.ts` without asking the user first.
13. NEVER delete or rename existing screen files.
14. ALWAYS verify `npx expo start` still works after changes.
15. ALWAYS create the required report file at the end.

---
---
---

# PROMPT 0 — SESSION START / READ DOCS / NO CODING

>>>COPY START<<<

```
You are working inside the JAHEEZ project workspace.

=== TITLE ===
PROMPT 0 — Session Start / Read All Documentation / No Coding

=== ROLE ===
Project knowledge loader and state analyst. You are a careful reader who understands the full project before doing anything.

=== CONTEXT DOCS TO READ ===
Read ALL of these files before responding:
1. docs/01_PROJECT_MASTER_OVERVIEW.md
2. docs/02_PROJECT_CURRENT_STATE.md
3. docs/03_PROJECT_STRUCTURE_MAP.md
4. docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md
5. docs/05_BUTTON_ACTION_MAP.md
6. docs/06_FORM_AND_VALIDATION_SPEC.md
7. docs/07_DATA_AND_SQL_MODEL.md
8. docs/08_ORDER_STATUS_AND_STATE_MACHINE.md
9. docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md
10. docs/10_ANIMATION_AND_MICROINTERACTION_SPEC.md
11. docs/11_API_AND_BACKEND_REQUIREMENTS.md
12. docs/12_DEPENDENCY_AND_TOOLING_PLAN.md
13. docs/13_IMPLEMENTATION_MASTER_PLAN.md
14. docs/14_FINAL_EXPECTED_DELIVERABLE.md
15. docs/15_AI_WORKING_RULES.md
16. docs/TOOLS_AND_SERVICES_STRATEGY.md (if exists)
17. docs/PHASE_0_STABILIZATION_REPORT.md (if exists)
18. docs/PROJECT_IMPROVEMENT_STRATEGY.md (if exists)
19. Any other docs/PHASE_*_REPORT.md files that exist

=== GOAL ===
Load all project documentation into your context. Understand the full project. Summarize the current state. Wait for my specific task instruction.

=== ALLOWED SCOPE ===
- Reading documentation files
- Listing directory contents
- Summarizing project state

=== FORBIDDEN SCOPE ===
- Writing or modifying ANY source code files
- Installing packages
- Running build commands
- Creating new component or screen files
- Modifying configuration files

=== FILES/FOLDERS TO INSPECT ===
- docs/ (all markdown files)
- user-app/constants/brand.ts (read only to verify tokens exist)
- user-app/package.json (read only to verify dependencies)

=== FILES ALLOWED TO MODIFY ===
None.

=== FILES NOT ALLOWED TO MODIFY ===
Everything. This is a read-only session.

=== STEP-BY-STEP TASKS ===
1. Read every doc file listed above.
2. Read any existing PHASE_*_REPORT.md files to learn what work is already done.
3. Provide a summary of the current project state in 8-12 bullet points covering:
   - What apps exist (user, driver, admin)
   - What tech stack is used
   - What phase we are in
   - What has been completed
   - What key V1 decisions are locked (Email OTP, COD, status tracking, no live GPS, WhatsApp support)
4. State which prompt number should be run next based on completed reports.
5. Say: "Ready for your next instruction." and STOP.

=== REQUIRED REPORT FILE ===
None. This is a setup prompt.

=== REQUIRED OUTPUT FORMAT ===
- Bullet-point project summary (8-12 items)
- Current phase identification
- Next recommended prompt number
- "Ready for your next instruction."

=== VERIFICATION CHECKLIST ===
- [ ] All 15+ doc files read
- [ ] Existing phase reports read
- [ ] Summary provided
- [ ] No code written or modified
- [ ] Waiting for instruction

=== STOP CONDITION ===
Stop after providing the summary and saying "Ready for your next instruction." Do NOT start coding, do NOT suggest changes, do NOT modify files.
```

>>>COPY END<<<

---
---

# PROMPT 1 — VERIFY RUNTIME AFTER PHASE 0

>>>COPY START<<<

```
You are inside the JAHEEZ project. You have read all docs (Prompt 0 completed).

=== TITLE ===
PROMPT 1 — Verify Runtime After Phase 0

=== ROLE ===
Runtime verification inspector. Check that all three apps can start. Report blockers. Do NOT implement features.

=== CONTEXT DOCS TO READ ===
- docs/PHASE_0_STABILIZATION_REPORT.md
- docs/02_PROJECT_CURRENT_STATE.md
- docs/13_IMPLEMENTATION_MASTER_PLAN.md
- docs/15_AI_WORKING_RULES.md

=== GOAL ===
Confirm the project is in a healthy state after Phase 0. Verify each app can start or identify what blocks it. Create a verification report.

=== ALLOWED SCOPE ===
- Reading source code files to check for issues
- Listing directory contents
- Checking package.json files
- Checking config files (app.json, tsconfig, babel, metro)
- Verifying brand.ts tokens
- Checking supabase.ts for hardcoded secrets

=== FORBIDDEN SCOPE ===
- Writing or modifying source code
- Installing packages
- Implementing features
- Redesigning screens
- Modifying database schema
- Touching files outside audit scope

=== FILES/FOLDERS TO INSPECT ===
- user-app/package.json
- user-app/app/_layout.tsx
- user-app/app/(auth)/ — list all files, read _layout.tsx
- user-app/app/(tabs)/ — list all files, read _layout.tsx
- user-app/app/(flows)/ — list all files
- user-app/constants/brand.ts
- user-app/lib/supabase.ts
- user-app/tsconfig.json
- user-app/babel.config.js
- user-app/metro.config.js
- user-app/app.json
- driver-app/package.json (quick check)
- driver-app/app.json (quick check)
- admin/package.json (quick check)
- admin/vite.config.ts (quick check)

=== FILES ALLOWED TO MODIFY ===
None. Read-only audit.

=== FILES NOT ALLOWED TO MODIFY ===
Everything.

=== STEP-BY-STEP TASKS ===
1. Check each Phase 0 fix from PHASE_0_STABILIZATION_REPORT.md — confirm it's still in place (pass/fail).
2. Read user-app/package.json and list key dependencies with versions.
3. Read user-app/app/_layout.tsx — check for obvious import errors or broken references.
4. List ALL screen files across (auth), (tabs), (flows) with a 1-line status each.
5. Verify brand.ts contains expected tokens (RED, YELLOW, BG, TEXT, FONTS, SIZE, RADIUS, SPACE, SHADOW).
6. Verify supabase.ts does NOT contain hardcoded URLs or keys (should use process.env or Constants).
7. Quick-check driver-app: does it have package.json, app.json, _layout.tsx?
8. Quick-check admin: does it have package.json, vite.config.ts, src/App.tsx?
9. List any startup blockers found (broken imports, missing deps, config errors).
10. State whether you believe `npx expo start` would succeed for user-app.

=== REQUIRED REPORT FILE ===
Create: docs/RUNTIME_VERIFICATION_REPORT.md

Report must contain:
- Phase 0 Verification Table (item / status: pass or fail)
- User App Screen Inventory (file path / one-line status)
- Brand Token Verification (present / missing tokens)
- Security Check (hardcoded secrets: yes/no)
- Driver App Quick Status
- Admin Panel Quick Status
- Startup Blockers List
- Next Steps Recommendation

=== REQUIRED OUTPUT FORMAT ===
Structured markdown report + conversational summary of findings.

=== VERIFICATION CHECKLIST ===
- [ ] Phase 0 items re-verified
- [ ] All user-app screen files listed
- [ ] brand.ts tokens confirmed
- [ ] supabase.ts checked for secrets
- [ ] Driver app quick-checked
- [ ] Admin panel quick-checked
- [ ] No files modified
- [ ] Report file created

=== STOP CONDITION ===
Stop after creating the report. Do NOT fix blockers unless I explicitly say "fix it." Do NOT continue to the next prompt.
```

>>>COPY END<<<

---
---

# PROMPT 2 — DESIGN ASSETS AUDIT AND ORGANIZATION

>>>COPY START<<<

```
You are inside the JAHEEZ project. Runtime verification is done (Prompt 1).

=== TITLE ===
PROMPT 2 — Design Assets Audit and Organization

=== ROLE ===
Asset inspector and organizer. Catalog everything. Note what's missing. Do NOT redesign screens.

=== CONTEXT DOCS TO READ ===
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 12-13: Animation/Design tooling)
- docs/03_PROJECT_STRUCTURE_MAP.md
- docs/RUNTIME_VERIFICATION_REPORT.md (if exists)

=== GOAL ===
Create a complete inventory of all visual assets. Identify what exists, what's missing, what's oversized, and where emojis are used instead of real icons.

=== ALLOWED SCOPE ===
- Listing all asset files recursively with sizes
- Categorizing assets (icon, illustration, splash, font, video, unknown)
- Scanning screen files for emoji usage in UI
- Checking which assets are imported/used by which screens
- Documenting missing assets from the design spec

=== FORBIDDEN SCOPE ===
- Deleting, moving, or renaming asset files
- Modifying screen files
- Creating new illustration/icon files
- Installing packages
- Redesigning UI

=== FILES/FOLDERS TO INSPECT ===
- user-app/assets/ (all subdirectories: branding/, icons/, illustrations/, images/, map/, videos/)
- user-app/constants/assets.ts (if exists — asset path constants)
- user-app/app/ (scan .tsx files for emoji characters used as icons: 🍔🛒📦 etc.)
- user-app/components/ui/ (scan for asset references)
- design/ directory (if exists at root)
- jaheez icons/ directory (if exists at root)

=== FILES ALLOWED TO MODIFY ===
None (audit only).

=== FILES NOT ALLOWED TO MODIFY ===
Everything.

=== STEP-BY-STEP TASKS ===
1. List ALL files in user-app/assets/ recursively. For each file note: path, type, file size.
2. Categorize each asset: splash, branding, category-icon, ui-icon, illustration, video, font, unknown.
3. Check which files are actually imported/used in code vs orphaned.
4. Search user-app/app/ and user-app/components/ for emoji characters used as UI elements (🍔🛒📦🏥🏃 etc.). List every file and line.
5. Compare existing assets against docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md asset inventory. List what's missing.
6. Check if all 5 category illustrations exist: food.png, grocery.png, pharmacy.png, parcel.png, errand.png.
7. Check splash_first.png and splash_video.webm sizes.
8. List any assets larger than 500KB.
9. Note any duplicate or near-duplicate files.
10. Suggest an organized folder structure if things are messy (but do NOT move files).

=== REQUIRED REPORT FILE ===
Create or update: docs/PHASE_1_ASSET_ALIGNMENT_REPORT.md

Report sections:
1. Complete Asset Inventory Table (path | type | size | used by | status)
2. Emoji Usage Report (file | line | emoji | recommended replacement)
3. Missing Assets Checklist (what the spec requires but doesn't exist)
4. Oversized Assets List (files > 500KB)
5. Duplicate/Redundant Files
6. Organization Recommendations

=== REQUIRED OUTPUT FORMAT ===
Structured markdown tables in the report file. Conversational summary in chat.

=== VERIFICATION CHECKLIST ===
- [ ] All asset directories scanned
- [ ] Every file listed with size and type
- [ ] Emoji usage flagged with file/line
- [ ] Missing assets documented against spec
- [ ] Oversized files identified
- [ ] Duplicates noted
- [ ] No files modified
- [ ] Report created

=== STOP CONDITION ===
Stop after creating the report. Do NOT optimize or modify any assets. That is the next prompt.
```

>>>COPY END<<<

---
---

# PROMPT 3 — ASSET OPTIMIZATION

>>>COPY START<<<

```
You are inside the JAHEEZ project. Asset audit is complete (Prompt 2).

=== TITLE ===
PROMPT 3 — Asset Optimization

=== ROLE ===
Asset optimizer. Compress oversized images. Preserve originals. Report every change.

=== CONTEXT DOCS TO READ ===
- docs/PHASE_1_ASSET_ALIGNMENT_REPORT.md (the report from Prompt 2)
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md (Production Asset Requirements section)

=== GOAL ===
Reduce oversized image files to mobile-friendly sizes. Preserve quality. Document every change. Do NOT break any asset references.

=== ALLOWED SCOPE ===
- Compressing PNG files that are > 500KB
- Creating a compression helper script in a scratch folder (not in app source)
- Documenting planned changes BEFORE making them
- Updating asset references in code ONLY if filenames change AND user approves

=== FORBIDDEN SCOPE ===
- Deleting original files without approval
- Changing filenames without approval
- Installing npm packages (like sharp, imagemin) without approval
- Modifying screen layouts or designs
- Touching any non-image files

=== FILES/FOLDERS TO INSPECT ===
- user-app/assets/ (all images flagged as oversized in the audit report)

=== FILES ALLOWED TO MODIFY ===
- Image files in user-app/assets/ (ONLY after listing planned changes and getting user approval)
- user-app/constants/assets.ts (ONLY if filename changes require it, after approval)

=== FILES NOT ALLOWED TO MODIFY ===
- All screen files
- All component files
- brand.ts
- package.json
- Any config files

=== STEP-BY-STEP TASKS ===
1. Read PHASE_1_ASSET_ALIGNMENT_REPORT.md to get the oversized files list.
2. For each file > 500KB, document: current size, recommended target size, compression method.
3. Present the full compression plan to the user BEFORE making changes.
4. Wait for user approval.
5. After approval, compress images one at a time.
6. After each compression, verify the file still loads correctly.
7. If any filename changes, update the corresponding import reference.
8. Document every change with before/after sizes.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_1B_ASSET_OPTIMIZATION_REPORT.md

Report sections:
1. Compression Plan Table (file | before size | after size | method | status)
2. Total Size Savings
3. Files Changed List
4. Asset Reference Updates (if any)
5. Verification Status

=== REQUIRED OUTPUT FORMAT ===
Present compression plan first. Wait for approval. Then execute and report.

=== VERIFICATION CHECKLIST ===
- [ ] Compression plan presented before execution
- [ ] User approved changes
- [ ] Each image compressed individually
- [ ] No broken asset references
- [ ] Before/after sizes documented
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after creating the report. If user does not approve the plan, stop immediately and create the report noting "Pending user approval."
```

>>>COPY END<<<

---
---

# PROMPT 4 — UI COMPONENT SYSTEM AUDIT

>>>COPY START<<<

```
You are inside the JAHEEZ project. Assets are organized (Prompts 2-3).

=== TITLE ===
PROMPT 4 — UI Component System Audit and Improvement

=== ROLE ===
Component quality engineer. Improve shared UI building blocks one at a time. Do NOT touch screen files.

=== CONTEXT DOCS TO READ ===
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md (Component Styles: Button, Input, Card, Badge, Tab, TopNav)
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (understand which components screens need)
- docs/15_AI_WORKING_RULES.md (Code patterns, naming conventions)
- user-app/constants/brand.ts (read completely — all tokens)

=== GOAL ===
Audit every file in user-app/components/ui/. Improve each component to match the design system spec. Use brand.ts tokens exclusively. Add missing accessibility labels. Handle loading/error/empty states.

=== ALLOWED SCOPE ===
- Reading and modifying files in user-app/components/ui/ ONLY
- Creating NEW component files in user-app/components/ui/ if they are listed in the spec but don't exist
- Updating user-app/components/ui/index.ts to export new components

=== FORBIDDEN SCOPE ===
- Modifying ANY screen file (app/(auth)/, app/(tabs)/, app/(flows)/)
- Modifying store, hooks, or lib files
- Installing packages
- Changing brand.ts
- Changing shared/types.ts
- Adding data fetching logic to components

=== FILES/FOLDERS TO INSPECT ===
- user-app/components/ui/ — every .tsx file
- user-app/components/ui/index.ts — export barrel
- user-app/constants/brand.ts — token reference

=== FILES ALLOWED TO MODIFY ===
- user-app/components/ui/*.tsx (existing files)
- user-app/components/ui/index.ts
- New files in user-app/components/ui/ (only for components listed in the spec that don't exist yet)

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/app/ (all screen files)
- user-app/store/ (all stores)
- user-app/hooks/ (all hooks)
- user-app/lib/ (all API/service files)
- user-app/constants/brand.ts (read only)
- package.json
- shared/types.ts

=== STEP-BY-STEP TASKS ===
1. List ALL files in user-app/components/ui/.
2. Read each file completely. For each component, note:
   - Does it import from brand.ts? (no hardcoded colors)
   - Does it match the design spec? (52px buttons, 52px inputs, 16px card radius, pill badges)
   - Does every Pressable/TouchableOpacity have accessibilityLabel?
   - Does it handle loading state? Error state? Empty state (where applicable)?
   - Is it a named export (not default)?
3. Improve components ONE AT A TIME in this priority order:
   a. Button — 52px height, pill radius (9999), RED primary, WHITE text, loading spinner, disabled state
   b. Input — 52px height, 12px radius, BORDER color, RED focus border, placeholder TEXT3 color
   c. Card — WHITE bg, 16px radius, SHADOW, 16px padding
   d. OTPInput — 6 individual digit boxes, auto-advance, backspace goes back, shake on error
   e. EmptyState — illustration placeholder, message text, optional action button
   f. Loader / ShimmerPlaceholder / SkeletonBox — skeleton loading pattern
   g. Badge / StatusBadge — pill shape, semantic colors (GREEN/RED/WARN/BLUE)
   h. OrderCard — order summary with status badge, items preview, total, date
   i. BottomSheet — drag handle, slide-up animation, backdrop
   j. ProgressTimeline — vertical stepper with status dots and connecting lines
   k. Avatar — circular image with fallback initials
   l. TopNav / ScreenWrapper — consistent screen header with back button
   m. AnimatedPressable / FadeInView — press feedback animations
4. After improving each component, explain what changed.
5. Update index.ts to re-export any new components.

=== REQUIRED REPORT FILE ===
Create or update: docs/PHASE_2_COMPONENT_AUDIT_REPORT.md

Report sections for EACH component:
1. Component Name
2. File Path
3. Before Status (issues found)
4. Changes Made
5. After Status
6. Visual Test Instruction

=== REQUIRED OUTPUT FORMAT ===
Per-component before/after report. Summary table at the end.

=== VERIFICATION CHECKLIST ===
- [ ] Every file in components/ui/ audited
- [ ] No hardcoded colors (all from brand.ts)
- [ ] Button: 52px, pill, RED, loading state
- [ ] Input: 52px, 12px radius, RED focus
- [ ] Card: 16px radius, SHADOW
- [ ] All Pressable elements have accessibilityLabel
- [ ] Named exports used (not default)
- [ ] No screen files touched
- [ ] index.ts updated
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after all components are audited/improved and the report is created. Do NOT proceed to polish screens.
```

>>>COPY END<<<

---
---

# PROMPT 5 — ANIMATION FOUNDATION

>>>COPY START<<<

```
You are inside the JAHEEZ project. UI components are improved (Prompt 4).

=== TITLE ===
PROMPT 5 — Animation Foundation

=== ROLE ===
Animation quality engineer. Improve existing animation primitives using ONLY already-installed libraries.

=== CONTEXT DOCS TO READ ===
- docs/10_ANIMATION_AND_MICROINTERACTION_SPEC.md
- docs/12_DEPENDENCY_AND_TOOLING_PLAN.md (installed animation libs)
- user-app/package.json (verify react-native-reanimated, moti versions)
- user-app/constants/animations.ts (if exists)

=== GOAL ===
Ensure animation building blocks are polished, performant, and accessible. Use ONLY libraries already in package.json.

=== ALLOWED SCOPE ===
- Improving animation components in user-app/components/ui/
- Creating new animation utility components in user-app/components/ui/
- Using react-native-reanimated and moti IF they are in package.json
- Using React Native's built-in Animated API as fallback

=== FORBIDDEN SCOPE ===
- Installing ANY new npm packages
- Modifying screen files
- Adding Lottie files (document the need instead)
- Modifying package.json
- Using NativeWind

=== FILES/FOLDERS TO INSPECT ===
- user-app/components/ui/AnimatedPressable.tsx
- user-app/components/ui/FadeInView.tsx
- user-app/components/ui/ShimmerPlaceholder.tsx
- user-app/components/ui/SkeletonBox.tsx
- user-app/components/ui/AnimatedTransition.tsx
- user-app/components/ui/PulseIndicator.tsx
- user-app/constants/animations.ts
- user-app/package.json (check installed deps)

=== FILES ALLOWED TO MODIFY ===
- user-app/components/ui/*.tsx (animation-related components only)
- user-app/constants/animations.ts
- New animation utility files in user-app/components/ui/

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/app/ (all screen files)
- user-app/store/, hooks/, lib/
- package.json
- brand.ts
- _layout.tsx

=== STEP-BY-STEP TASKS ===
1. Check package.json: is react-native-reanimated installed? Is moti installed? List versions.
2. Read all existing animation components in components/ui/.
3. Improve or create these animation utilities:
   a. AnimatedPressable — scale to 0.98 on press, 100ms spring, ripple on Android
   b. FadeInView — opacity 0→1, slight translateY, 300ms, spring
   c. ShimmerPlaceholder — horizontal gradient sweep, 1s loop, brand BORDER color
   d. SkeletonBox — configurable width/height skeleton with shimmer
   e. PulseIndicator — scale pulse for active states (1→1.2→1, repeating)
4. All animations MUST check for `reduceMotionEnabled` accessibility setting. If motion is reduced, skip the animation and show the content immediately.
5. Ensure all animations use `useNativeDriver: true` where possible.
6. Test: each animation should work independently without requiring screen context.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_2B_ANIMATION_FOUNDATION_REPORT.md

Report sections:
1. Installed Animation Libraries (name, version, status)
2. Per-component audit (before/changes/after)
3. Accessibility Compliance (reduceMotion handling)
4. Performance Notes
5. Missing Animation Assets (Lottie files needed but not created)

=== REQUIRED OUTPUT FORMAT ===
Per-component before/after. Technical summary.

=== VERIFICATION CHECKLIST ===
- [ ] Package.json checked for animation libs
- [ ] AnimatedPressable working with scale feedback
- [ ] FadeInView working with fade + slide
- [ ] Shimmer/Skeleton working with gradient sweep
- [ ] PulseIndicator working
- [ ] reduceMotionEnabled respected in all animations
- [ ] No new packages installed
- [ ] No screen files touched
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after animation components are improved and report is created. Do NOT start polishing screens.
```

>>>COPY END<<<

---
---

# PROMPT 6 — AUTH FLOW POLISH

>>>COPY START<<<

```
You are inside the JAHEEZ project. Components and animations are ready (Prompts 4-5).

=== TITLE ===
PROMPT 6 — Auth Flow Polish

=== ROLE ===
Auth screen engineer. Polish the complete authentication flow. Use Supabase Email OTP. No backend rewrite.

=== CONTEXT DOCS TO READ ===
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Auth screens section)
- docs/05_BUTTON_ACTION_MAP.md (Auth buttons: Login, Register, Verify OTP, Forgot Password)
- docs/06_FORM_AND_VALIDATION_SPEC.md (Forms 1-3: Login, Register, OTP Verification)
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 5: OTP/Auth Strategy — EMAIL OTP, no phone SMS in V1)
- docs/10_ANIMATION_AND_MICROINTERACTION_SPEC.md (OTP animations, form interactions)

=== GOAL ===
Polish all auth screens so the flow is smooth: splash → welcome/onboarding → login → register → OTP → home. Ensure forgot password exists. Use email-based OTP. All forms validated, loading states shown, errors displayed clearly.

=== ALLOWED SCOPE ===
- Reading and modifying auth screen files in user-app/app/(auth)/
- Creating user-app/app/(auth)/forgot.tsx if it doesn't exist
- Modifying user-app/lib/authApi.ts to wire Supabase auth calls
- Using improved components from components/ui/

=== FORBIDDEN SCOPE ===
- Rewriting the entire auth system from scratch
- Modifying user-app/lib/supabase.ts connection config
- Touching (tabs) or (flows) screens
- Installing packages
- Adding phone SMS OTP or Google/Apple social login
- Modifying Supabase project settings

=== FILES/FOLDERS TO INSPECT ===
- user-app/app/(auth)/ — read ALL files: _layout.tsx, splash.tsx, welcome.tsx, onboarding.tsx, login.tsx, register.tsx, otp.tsx
- user-app/lib/authApi.ts
- user-app/store/authStore.ts
- user-app/lib/supabase.ts (read only)

=== FILES ALLOWED TO MODIFY ===
- user-app/app/(auth)/splash.tsx
- user-app/app/(auth)/welcome.tsx
- user-app/app/(auth)/onboarding.tsx
- user-app/app/(auth)/login.tsx
- user-app/app/(auth)/register.tsx
- user-app/app/(auth)/otp.tsx
- user-app/app/(auth)/forgot.tsx (create if missing)
- user-app/app/(auth)/_layout.tsx
- user-app/lib/authApi.ts

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/lib/supabase.ts
- user-app/app/(tabs)/ — all files
- user-app/app/(flows)/ — all files
- user-app/store/authStore.ts (use existing methods — don't rewrite the store)
- package.json
- brand.ts
- shared/types.ts

=== STEP-BY-STEP TASKS ===
1. Read ALL auth screen files completely before making any changes.
2. Map the current auth flow order. Confirm: splash → welcome/onboarding → login ↔ register → OTP → home tabs.
3. CRITICAL: Verify that OTP is NOT the first screen users see. Splash or welcome must come first.
4. Polish each screen one at a time:
   a. splash.tsx — image/video animation, auto-navigate after delay
   b. welcome.tsx / onboarding.tsx — carousel slides, "Get Started" CTA
   c. login.tsx — email + password fields, validation (email format, password min 6 chars), loading spinner in button, error banner for invalid credentials, "Forgot Password?" link, "Don't have an account? Register" link
   d. register.tsx — email, password, confirm password, full name, city selector. All validated. Loading state. Error handling.
   e. forgot.tsx — create if missing. Email input. "Send Reset Code" button calls supabase.auth.resetPasswordForEmail(email). Success message. Navigate to OTP if needed.
   f. otp.tsx — 6 individual digit input boxes. Auto-advance on digit entry. Backspace goes to previous box. 60-second countdown timer for resend. Resend button disabled during countdown. Shake animation on wrong code. Error banner. Verify via supabase.auth.verifyOtp().
5. Ensure all auth API calls use these patterns:
   - Login: supabase.auth.signInWithPassword({ email, password })
   - Register: supabase.auth.signUp({ email, password, options: { data: { full_name, phone, city } } })
   - Verify OTP: supabase.auth.verifyOtp({ email, token, type: 'signup' })
   - Forgot: supabase.auth.resetPasswordForEmail(email)
   - Logout: supabase.auth.signOut()
6. Every form must use brand.ts tokens (RED buttons, 52px height, RED focus borders).
7. Every input must have accessibilityLabel.
8. Every screen must handle: loading state, error state, success state.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_3_AUTH_POLISH_REPORT.md

Report sections:
1. Auth Flow Order (verified screen sequence)
2. Per-screen changes (what was wrong → what was fixed)
3. OTP Implementation Details
4. Forgot Password Implementation
5. Auth API Calls Summary (which Supabase methods are used)
6. Remaining Issues / Known Limitations
7. Test Instructions

=== REQUIRED OUTPUT FORMAT ===
Per-screen before/after details. Auth flow diagram. Test instructions.

=== VERIFICATION CHECKLIST ===
- [ ] Auth flow: splash → welcome → login ↔ register → OTP → home
- [ ] OTP is NOT the first screen
- [ ] Login: email + password + validation + loading + errors
- [ ] Register: all fields + validation + loading + errors
- [ ] Forgot password screen exists and sends email
- [ ] OTP: 6 digit boxes, auto-advance, countdown, shake, resend
- [ ] All forms use brand.ts tokens
- [ ] All inputs have accessibilityLabel
- [ ] No (tabs) or (flows) files touched
- [ ] No packages installed
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after auth flow is polished and report is created. Do NOT move to home screen polish.
```

>>>COPY END<<<

---
---

# PROMPT 7 — HOME AND SERVICES POLISH

>>>COPY START<<<

```
You are inside the JAHEEZ project. Auth flow is polished (Prompt 6).

=== TITLE ===
PROMPT 7 — Home Screen and Services Polish

=== ROLE ===
Home screen engineer. Polish layout, categories, search entry, promos. Replace ALL emoji icons.

=== CONTEXT DOCS TO READ ===
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Home screen section)
- docs/05_BUTTON_ACTION_MAP.md (Home screen buttons)
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md (Category tints, component styles)
- docs/PHASE_1_ASSET_ALIGNMENT_REPORT.md (available assets, emoji usage list)

=== GOAL ===
Make the home screen look polished and professional. Replace every emoji icon with a real asset or vector icon. Ensure category cards, promo banners, featured stores, and active order card all match the design spec.

=== ALLOWED SCOPE ===
- Modifying user-app/app/(tabs)/index.tsx (home screen)
- Creating new shared components in user-app/components/ui/ if needed for home screen
- Using existing assets from user-app/assets/
- Using @expo/vector-icons (Ionicons, MaterialCommunityIcons) for any missing icon assets

=== FORBIDDEN SCOPE ===
- Modifying search screen logic (only the search bar entry on home)
- Modifying store detail screens
- Changing the tab bar structure
- Rewriting data fetching (keep existing patterns)
- Installing packages
- Using emoji as final icons

=== FILES/FOLDERS TO INSPECT ===
- user-app/app/(tabs)/index.tsx (home screen — read completely)
- user-app/app/(tabs)/search.tsx (read only — understand what search expects)
- user-app/components/ui/ (available shared components)
- user-app/assets/ (available icons and illustrations)

=== FILES ALLOWED TO MODIFY ===
- user-app/app/(tabs)/index.tsx
- New component files in user-app/components/ui/ (for home-specific shared components)

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/app/(auth)/ (already polished)
- user-app/app/(tabs)/search.tsx, orders.tsx, profile.tsx, chat.tsx, wallet.tsx
- user-app/store/, hooks/, lib/
- package.json, brand.ts, shared/types.ts

=== STEP-BY-STEP TASKS ===
1. Read index.tsx (home screen) completely.
2. Identify all sections: header, search bar, category cards, promo banner, featured stores, active order card.
3. Polish each section:
   a. Header — greeting text, location display, notification bell icon (Ionicons)
   b. Search bar — tap to navigate to search screen, magnifying glass icon, placeholder text
   c. Category cards (5 service types):
      - Food → use food.png asset or Ionicons "restaurant" icon + FOOD_TINT (#FF6B35)
      - Grocery → use grocery.png or Ionicons "cart" + GROCERY_TINT (#2DB87A)
      - Pharmacy → use pharmacy.png or Ionicons "medkit" + PHARMACY_TINT (#3A8FE8)
      - Parcel → use parcel.png or Ionicons "cube" + PARCEL_TINT (#A78BFA)
      - Errand → use errand.png or Ionicons "bicycle" + ERRAND_TINT (#F472B6)
      - ABSOLUTELY NO EMOJI ICONS (🍔🛒💊📦🏃 are forbidden)
   d. Promo banner — horizontal scroll, card style, placeholder if no promos
   e. Featured stores — horizontal scroll of store cards with image, name, rating, delivery time
   f. Active order card — if user has an active order, show summary at top with status and "Track" button
4. Ensure all spacing follows 8px grid (SPACE tokens from brand.ts).
5. Ensure all text uses Cairo font (FONTS tokens from brand.ts).
6. Ensure all cards use SHADOW from brand.ts.
7. Verify pull-to-refresh is implemented.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_4_HOME_SERVICES_REPORT.md

Report sections:
1. Home Screen Sections Inventory (section | status | changes)
2. Emoji Replacements (emoji → replacement icon/asset)
3. Category Card Implementation (icon source, tint color)
4. Remaining Issues
5. Test Instructions (what to check visually)

=== REQUIRED OUTPUT FORMAT ===
Section-by-section changes. Emoji replacement table. Visual test instructions.

=== VERIFICATION CHECKLIST ===
- [ ] Zero emoji icons on home screen
- [ ] 5 category cards with real icons and correct tint colors
- [ ] Search bar navigates to search screen
- [ ] Promo banner renders (or placeholder)
- [ ] Featured stores scroll horizontally
- [ ] Active order card appears when applicable
- [ ] All spacing uses SPACE tokens (8px grid)
- [ ] All text uses FONTS tokens (Cairo)
- [ ] All cards use SHADOW
- [ ] Pull-to-refresh works
- [ ] No other screen files touched
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after home screen is polished and report is created. Do NOT start store/product screens.
```

>>>COPY END<<<

---
---

# PROMPT 8 — STORE / LIST / PRODUCT POLISH

>>>COPY START<<<

```
You are inside the JAHEEZ project. Home screen is polished (Prompt 7).

=== TITLE ===
PROMPT 8 — Store Listing, Store Detail, and Product Polish

=== ROLE ===
Store/product screen engineer. Polish browsing experience. Protect existing data layer.

=== CONTEXT DOCS TO READ ===
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Store screens section)
- docs/05_BUTTON_ACTION_MAP.md (Store/product buttons)
- docs/09_DESIGN_SYSTEM_AND_ASSETS_SPEC.md (Card, Badge styles)
- docs/06_FORM_AND_VALIDATION_SPEC.md (search/filter patterns if applicable)

=== GOAL ===
Polish all store browsing, product browsing, and item detail screens. Ensure consistent card styling, price formatting (DH), and smooth navigation.

=== ALLOWED SCOPE ===
- Modifying store/product screen files in user-app/app/(flows)/
- Modifying category screen if it exists
- Creating shared store/product components in user-app/components/ui/

=== FORBIDDEN SCOPE ===
- Rewriting the data fetching layer (hooks, stores, lib)
- Modifying Supabase queries
- Touching cart, checkout, auth, or home screens
- Installing packages
- Changing shared/types.ts

=== FILES/FOLDERS TO INSPECT ===
- user-app/app/(flows)/store/[id].tsx (store detail)
- user-app/app/(flows)/category/[id].tsx (category listing)
- user-app/app/(flows)/favorites.tsx
- user-app/app/(tabs)/search.tsx (read for context — minimal changes if needed)
- user-app/components/ui/ (existing components)

=== FILES ALLOWED TO MODIFY ===
- user-app/app/(flows)/store/[id].tsx
- user-app/app/(flows)/category/[id].tsx
- user-app/app/(flows)/favorites.tsx
- user-app/app/(tabs)/search.tsx (minor polish only — no logic rewrite)
- New component files in user-app/components/ui/

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/app/(auth)/ (done)
- user-app/app/(tabs)/index.tsx (done)
- user-app/store/ (data layer — keep safe)
- user-app/hooks/ (keep safe)
- user-app/lib/ (keep safe)
- package.json, brand.ts, shared/types.ts

=== STEP-BY-STEP TASKS ===
1. Read ALL store/product screen files completely before editing.
2. Polish category listing screen:
   - Grid or list of store cards
   - Each card: store image, name, rating stars, delivery time, delivery fee
   - Pull-to-refresh
   - Empty state if no stores
3. Polish store detail screen:
   - Store header: cover image, logo, name, rating, open/closed badge
   - Menu categories as horizontal tabs/pills
   - Menu items list per category
   - Each item: image, name, description (truncated), price in DH
   - Tap item → product detail bottom sheet or modal
4. Polish product detail (bottom sheet):
   - Item image (large)
   - Name, full description
   - Price in DH
   - Size selector (if item has options)
   - Extras/add-ons checkboxes (if item has extras)
   - Quantity selector (+/-)
   - "Add to Cart" button with price total
5. Polish favorites screen:
   - List of favorited stores
   - Heart icon toggle
   - Empty state if no favorites
6. Polish search results (minimal — consistent card styling).
7. All prices must display as "XX.XX DH" format.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_5_STORE_LIST_PRODUCT_REPORT.md

=== VERIFICATION CHECKLIST ===
- [ ] Category listing shows store cards with image/name/rating/delivery
- [ ] Store detail shows header + menu categories + items
- [ ] Product detail bottom sheet has image/name/price/options/add-to-cart
- [ ] Prices in DH format
- [ ] Favorites screen works with heart toggle
- [ ] Empty states present
- [ ] Existing data layer preserved (stores/hooks/lib untouched)
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after store/product screens polished and report created. Do NOT start cart/checkout.
```

>>>COPY END<<<

---
---

# PROMPT 9 — CART AND CHECKOUT POLISH

>>>COPY START<<<

```
You are inside the JAHEEZ project. Store/product screens polished (Prompt 8).

=== TITLE ===
PROMPT 9 — Cart and Checkout Polish (Cash on Delivery Only)

=== ROLE ===
Checkout flow engineer. Polish purchase flow. V1 payment is Cash on Delivery (COD) ONLY.

=== CONTEXT DOCS TO READ ===
- docs/06_FORM_AND_VALIDATION_SPEC.md (Forms 5-6: Address, Checkout)
- docs/05_BUTTON_ACTION_MAP.md (Cart/Checkout buttons)
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 9: Payment Strategy — COD only for V1)
- docs/08_ORDER_STATUS_AND_STATE_MACHINE.md (order creation status)

=== GOAL ===
Polish cart and checkout screens. COD is the ONLY active payment method. Card/wallet are visible but disabled. Address requires descriptive text (min 15 chars). Order confirmation shows order number.

=== ALLOWED SCOPE ===
- Modifying cart/checkout/confirmation screens in user-app/app/(flows)/
- Creating checkout-related components in user-app/components/ui/

=== FORBIDDEN SCOPE ===
- Implementing Stripe card payments
- Implementing wallet payments
- Enabling card or wallet as selectable options
- Modifying order store logic (only polish UI calling existing methods)
- Touching auth/home/store screens
- Installing packages

=== FILES/FOLDERS TO INSPECT ===
- user-app/app/(flows)/cart.tsx
- user-app/app/(flows)/checkout.tsx
- user-app/app/(flows)/confirmation.tsx
- user-app/app/(flows)/addresses.tsx (address selection)
- user-app/store/cartStore.ts (read only)

=== FILES ALLOWED TO MODIFY ===
- user-app/app/(flows)/cart.tsx
- user-app/app/(flows)/checkout.tsx
- user-app/app/(flows)/confirmation.tsx
- user-app/app/(flows)/addresses.tsx (if used in checkout flow)
- New components in user-app/components/ui/

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/store/cartStore.ts (use existing methods, don't rewrite)
- user-app/store/orderStore.ts (use existing methods)
- user-app/lib/ (API layer)
- user-app/app/(auth)/, (tabs)/, other (flows)/ screens
- package.json, brand.ts, shared/types.ts

=== STEP-BY-STEP TASKS ===
1. Read cart.tsx, checkout.tsx, confirmation.tsx completely.
2. Polish cart screen:
   - Item list with image, name, quantity +/- buttons, price
   - Remove item button (trash icon or swipe)
   - Subtotal, delivery fee, discount line, total
   - Promo code text input + "Apply" button
   - Empty cart state with illustration and "Browse Stores" button
   - "Proceed to Checkout" button (disabled if cart empty)
3. Polish checkout screen:
   - Address section: show selected address or "Add Address" button
   - Address input: MINIMUM 15 characters, must include landmarks (per form spec)
   - Special instructions textarea (max 200 chars, optional)
   - Payment method section:
     * Cash on Delivery (COD) — SELECTED, ACTIVE, with radio button
     * Card Payment — VISIBLE but GRAYED OUT, "Coming Soon" label
     * Wallet — VISIBLE but GRAYED OUT, "Coming Soon" label
   - Order summary: items count, subtotal, delivery fee, discount, total
   - "Confirm Order" button with loading state
4. Polish confirmation screen:
   - Success checkmark or illustration
   - "Order Confirmed!" heading
   - Order number displayed
   - "Track Order" button → navigate to order tracking
   - "Back to Home" button
5. All prices in DH format.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_6_CART_CHECKOUT_REPORT.md

=== VERIFICATION CHECKLIST ===
- [ ] Cart shows items with quantity controls
- [ ] Empty cart state works
- [ ] Promo code input present
- [ ] Address requires 15+ chars descriptive text
- [ ] COD is the ONLY selectable payment
- [ ] Card/Wallet visible but grayed out with "Coming Soon"
- [ ] Order summary totals correct
- [ ] Confirm button has loading state
- [ ] Confirmation screen shows order number
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after cart/checkout polished and report created. Do NOT start orders/tracking.
```

>>>COPY END<<<

---
---

# PROMPT 10 — ORDER STATUS AND TRACKING POLISH

>>>COPY START<<<

```
You are inside the JAHEEZ project. Cart/checkout polished (Prompt 9).

=== TITLE ===
PROMPT 10 — Order Status and Tracking Polish (Status Stepper, No Live GPS)

=== ROLE ===
Order tracking engineer. Build a status timeline stepper. No live GPS map for V1.

=== CONTEXT DOCS TO READ ===
- docs/08_ORDER_STATUS_AND_STATE_MACHINE.md (all status values, transitions, payment status)
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Orders/Tracking screens)
- docs/05_BUTTON_ACTION_MAP.md (Order actions)
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 10: Status-based tracking for V1)

=== GOAL ===
Polish orders list, order detail, and tracking screens. Use a status timeline stepper instead of a live GPS map. Add WhatsApp support deep link.

=== ALLOWED SCOPE ===
- Modifying order/tracking screen files
- Creating status timeline components in components/ui/
- Adding WhatsApp deep link buttons

=== FORBIDDEN SCOPE ===
- Implementing live GPS map tracking
- Building real-time driver location features
- Creating database-backed support tickets (use WhatsApp redirect for V1)
- Touching cart, checkout, auth, or home screens
- Installing packages

=== FILES/FOLDERS TO INSPECT ===
- user-app/app/(tabs)/orders.tsx
- user-app/app/(flows)/order/[id].tsx
- user-app/app/(flows)/tracking/[id].tsx
- user-app/components/ui/ProgressTimeline.tsx (if exists)
- user-app/components/ui/OrderCard.tsx
- user-app/components/ui/StatusBadge.tsx

=== FILES ALLOWED TO MODIFY ===
- user-app/app/(tabs)/orders.tsx
- user-app/app/(flows)/order/[id].tsx
- user-app/app/(flows)/tracking/[id].tsx
- user-app/components/ui/ProgressTimeline.tsx (create or improve)
- user-app/components/ui/OrderCard.tsx
- New components in user-app/components/ui/

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/store/orderStore.ts (use existing methods)
- user-app/lib/orderApi.ts (use existing methods)
- user-app/app/(auth)/, (tabs)/index.tsx, (flows)/cart.tsx, checkout.tsx
- package.json, brand.ts, shared/types.ts

=== STEP-BY-STEP TASKS ===
1. Read orders.tsx, order/[id].tsx, tracking/[id].tsx completely.
2. Polish orders list (tabs):
   - Segmented tabs or sections: Active / Completed / Cancelled
   - Each order card: order number, date, store name, items count, total, status badge
   - Empty state per section
   - Pull-to-refresh
3. Polish order detail:
   - Order header: order number, date, status badge (color-coded)
   - Items list: name, quantity, price per item
   - Price breakdown: subtotal, delivery fee, discount, total
   - Delivery address
   - Status timeline stepper (vertical):
     * Order Received → Confirmed → Preparing → On the Way → Delivered
     * Each step: icon/dot, label, timestamp (if available)
     * Colors: gray (pending), blue (current), green (completed), red (cancelled)
   - Driver info card: name, phone number (if driver assigned), vehicle type
   - Placeholder card if no driver yet
4. Polish support/contact section on order detail:
   - "Call Driver" button → tel: deep link
   - "WhatsApp Support" button → https://wa.me/212XXXXXXXXX?text=Hello%20Jaheez,%20I%20need%20help%20with%20order%20[ORDER_ID]
   - "Report Issue" → same WhatsApp link with issue text
5. Do NOT build a live GPS map. The timeline stepper IS the tracking screen for V1.
6. If tracking/[id].tsx exists and has a map, replace the map with the timeline stepper prominently.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_7_ORDERS_TRACKING_REPORT.md

=== VERIFICATION CHECKLIST ===
- [ ] Orders list has Active/Completed/Cancelled sections
- [ ] Empty state per section
- [ ] Order detail shows full info + timeline stepper
- [ ] Timeline stepper is color-coded (gray/blue/green/red)
- [ ] Driver card shows info or placeholder
- [ ] WhatsApp support link works with order ID
- [ ] No live GPS map implemented
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after orders/tracking polished and report created. Do NOT start profile screens.
```

>>>COPY END<<<

---
---

# PROMPT 11 — PROFILE, SETTINGS, ADDRESSES, SUPPORT

>>>COPY START<<<

```
You are inside the JAHEEZ project. Orders/tracking polished (Prompt 10).

=== TITLE ===
PROMPT 11 — Profile, Settings, Addresses, and Support Polish

=== ROLE ===
Profile/settings engineer. Polish user account screens. Text-only addresses (no map picker for V1).

=== CONTEXT DOCS TO READ ===
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Profile/Settings section)
- docs/06_FORM_AND_VALIDATION_SPEC.md (Forms 4-5: Profile Edit, Add/Edit Address)
- docs/05_BUTTON_ACTION_MAP.md (Profile/Settings buttons)

=== GOAL ===
Polish all profile, settings, address, FAQ, and support screens. Addresses use descriptive text only (no map picker). Support redirects to WhatsApp.

=== ALLOWED SCOPE ===
- Modifying profile/settings/address screen files
- Creating shared profile components in user-app/components/ui/

=== FORBIDDEN SCOPE ===
- Adding Google Maps or map picker (deferred to V2)
- Modifying auth store (use existing logout/delete methods)
- Touching auth/home/store/cart/order screens
- Installing packages
- Adding geocoding API calls

=== FILES/FOLDERS TO INSPECT ===
- user-app/app/(tabs)/profile.tsx
- user-app/app/(flows)/profile-edit.tsx
- user-app/app/(flows)/addresses.tsx
- user-app/app/(flows)/settings.tsx
- user-app/app/(flows)/faq.tsx
- user-app/app/(flows)/support-ticket.tsx
- user-app/app/(flows)/delete-account.tsx
- user-app/app/(flows)/terms.tsx
- user-app/store/authStore.ts (read only — use existing methods)
- user-app/store/languageStore.ts (read only — use existing methods)

=== FILES ALLOWED TO MODIFY ===
- user-app/app/(tabs)/profile.tsx
- user-app/app/(flows)/profile-edit.tsx
- user-app/app/(flows)/addresses.tsx
- user-app/app/(flows)/settings.tsx
- user-app/app/(flows)/faq.tsx
- user-app/app/(flows)/support-ticket.tsx
- user-app/app/(flows)/delete-account.tsx
- user-app/app/(flows)/terms.tsx
- New components in user-app/components/ui/

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/store/authStore.ts (use existing methods only)
- user-app/store/languageStore.ts (use existing methods only)
- user-app/lib/supabase.ts
- user-app/app/(auth)/, (tabs)/index.tsx, orders.tsx, search.tsx
- package.json, brand.ts, shared/types.ts

=== STEP-BY-STEP TASKS ===
1. Read ALL profile/settings screen files completely.
2. Polish profile main screen:
   - Avatar (circular, with initials fallback if no image)
   - Full name, email, phone number display
   - Menu items: Edit Profile, My Addresses, Language, FAQ, Support, Terms, Logout
   - "Delete Account" at the very bottom (red text)
3. Polish edit profile screen:
   - Avatar picker (camera or gallery)
   - Full name input (required)
   - City selector/dropdown
   - Save button with loading state
4. Polish addresses screen:
   - List of saved addresses with label and preview
   - "Add New Address" button
   - Swipe to delete or edit button per address
   - Set as default toggle
5. Polish add/edit address form:
   - Label input (e.g., "Home", "Work") — required, 2-30 chars
   - Address text input — required, MINIMUM 15 CHARACTERS (must include landmarks/building details for drivers)
   - NO MAP PICKER in V1
6. Polish settings screen:
   - Language selector: Arabic (العربية), French (Français), English — radio buttons
   - Notification toggle (cosmetic for V1 — stores preference locally)
7. Polish FAQ screen: static list of expandable Q&A items.
8. Polish support: "Contact Support on WhatsApp" button with deep link.
9. Polish logout: call existing auth store logout, navigate to login.
10. Polish delete account: confirmation dialog with warning text, then call delete.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_8_PROFILE_SUPPORT_REPORT.md

=== VERIFICATION CHECKLIST ===
- [ ] Profile shows user info with avatar
- [ ] Edit profile saves changes
- [ ] Addresses: list, add, edit, delete, set default
- [ ] Address input requires 15+ characters
- [ ] No map picker used
- [ ] Language selector works (3 options)
- [ ] FAQ renders Q&A list
- [ ] WhatsApp support button works
- [ ] Logout clears state, goes to login
- [ ] Delete account has confirmation
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after profile/settings polished and report created. Do NOT start backend work.
```

>>>COPY END<<<

---
---

# PROMPT 12 — BACKEND / DATA VERIFICATION

>>>COPY START<<<

```
You are inside the JAHEEZ project. All user app UI is polished (Prompts 4-11).

=== TITLE ===
PROMPT 12 — Backend and Data Layer Verification (Audit Only, No UI Work)

=== ROLE ===
Backend data auditor. Map Supabase tables to code. Identify mock data. Create integration plan. No UI changes.

=== CONTEXT DOCS TO READ ===
- docs/07_DATA_AND_SQL_MODEL.md
- docs/11_API_AND_BACKEND_REQUIREMENTS.md
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Backend strategy sections)
- docs/PHASE_0_STABILIZATION_REPORT.md (Supabase status)

=== GOAL ===
Audit the entire data layer. Map which Supabase tables are used, which are unused. Identify mock vs real data. Create an integration priority plan.

=== ALLOWED SCOPE ===
- Reading all lib/, store/, hooks/ files
- Reading Supabase schema files
- Reading API endpoint definitions

=== FORBIDDEN SCOPE ===
- Modifying ANY source code file
- Creating new UI screens
- Modifying database schema
- Creating migrations
- Installing packages
- Changing store/hook logic

=== FILES/FOLDERS TO INSPECT ===
- user-app/lib/ — every file (api.ts, authApi.ts, storeApi.ts, orderApi.ts, walletApi.ts, supportApi.ts, fallbackApi.ts, mockData.ts, supabase.ts, etc.)
- user-app/store/ — every file (authStore, cartStore, orderStore, locationStore, languageStore, platformStore)
- user-app/hooks/ — every file and subdirectory (queries/, mutations/)
- scripts/admin-api.js (skim — note size, key endpoints)
- supabase_migrations/ or supabase/ directory (if exists)
- docs/supabase_schema.sql (if exists in docs/)
- shared/types.ts
- shared/constants.ts

=== FILES ALLOWED TO MODIFY ===
None. Audit only.

=== FILES NOT ALLOWED TO MODIFY ===
Everything.

=== STEP-BY-STEP TASKS ===
1. Read every file in user-app/lib/. Document what each file does.
2. Read every file in user-app/store/. Document what state each manages.
3. Read every file in user-app/hooks/ (including queries/ and mutations/ subdirs). Document each hook.
4. Create a mapping table: Supabase Table → Code File(s) That Query It → Screen(s) That Use It.
5. Identify which screens use real Supabase data vs mock/fallback data.
6. Check if mockData.ts or fallbackApi.ts is the primary data source for any screen.
7. Verify supabase.ts does NOT contain hardcoded URLs or keys.
8. Check if RLS policies are mentioned in any migration files.
9. Note the admin-api.js file size and its general purpose (Express server? API routes?).
10. Create an integration priority list:
    - Priority 1: What data MUST be real for MVP (auth, stores, orders)
    - Priority 2: What can remain mock for now (wallet, analytics)
    - Priority 3: What should be deferred (Stripe, GPS, SMS)

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_9_BACKEND_DATA_VERIFICATION.md

Report sections:
1. Data Layer File Inventory (lib/ + store/ + hooks/)
2. Supabase Table → Code Mapping Table
3. Mock vs Real Data Report (per screen)
4. Security Findings (hardcoded secrets?)
5. RLS Policy Status
6. Integration Priority List
7. Recommendations

=== VERIFICATION CHECKLIST ===
- [ ] All lib/ files documented
- [ ] All store/ files documented
- [ ] All hooks/ files documented
- [ ] Table-to-code mapping created
- [ ] Mock vs real data identified per screen
- [ ] Supabase config verified clean
- [ ] Integration priorities listed
- [ ] No code modified
- [ ] Report created

=== STOP CONDITION ===
Stop after audit complete and report created. Do NOT start implementing integrations.
```

>>>COPY END<<<

---
---

# PROMPT 13 — AUTH / OTP BACKEND INTEGRATION

>>>COPY START<<<

```
You are inside the JAHEEZ project. Data layer audited (Prompt 12).

=== TITLE ===
PROMPT 13 — Auth and Email OTP Backend Integration

=== ROLE ===
Auth integration engineer. Wire auth screens to real Supabase Email OTP. No phone SMS. No WhatsApp auth.

=== CONTEXT DOCS TO READ ===
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 5: OTP/Auth Strategy)
- docs/06_FORM_AND_VALIDATION_SPEC.md (Forms 1-3)
- docs/PHASE_9_BACKEND_DATA_VERIFICATION.md (auth section)
- docs/PHASE_3_AUTH_POLISH_REPORT.md (what auth UI was done)

=== GOAL ===
Ensure auth screens connect to real Supabase Auth. Email OTP flow works end-to-end. Session persists via Zustand + AsyncStorage.

=== ALLOWED SCOPE ===
- Modifying user-app/lib/authApi.ts (Supabase auth calls)
- Modifying user-app/store/authStore.ts (session persistence)
- Minor wiring changes in auth screen files (connecting to real API calls, NOT redesigning UI)
- Modifying user-app/hooks/mutations/useAuth.ts

=== FORBIDDEN SCOPE ===
- Adding phone SMS OTP (use email only for V1)
- Using unofficial WhatsApp tools for auth
- Modifying user-app/lib/supabase.ts (connection config is read-only)
- Redesigning auth screen UI (already polished)
- Touching non-auth screens
- Installing packages

=== FILES ALLOWED TO MODIFY ===
- user-app/lib/authApi.ts
- user-app/store/authStore.ts
- user-app/hooks/mutations/useAuth.ts (if exists)
- user-app/app/(auth)/*.tsx (ONLY for wiring API calls — NOT for layout changes)

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/lib/supabase.ts
- user-app/app/(tabs)/ and (flows)/
- package.json, shared/types.ts, brand.ts

=== STEP-BY-STEP TASKS ===
1. Read user-app/lib/supabase.ts — verify client is created correctly.
2. Read user-app/lib/authApi.ts — check existing auth methods.
3. Implement or verify these methods in authApi.ts:
   - login(email, password) → supabase.auth.signInWithPassword({ email, password })
   - register(email, password, metadata) → supabase.auth.signUp({ email, password, options: { data: { full_name, phone, city } } })
   - verifyOtp(email, token) → supabase.auth.verifyOtp({ email, token, type: 'signup' })
   - forgotPassword(email) → supabase.auth.resetPasswordForEmail(email)
   - logout() → supabase.auth.signOut()
   - getSession() → supabase.auth.getSession()
   - onAuthStateChange() → supabase.auth.onAuthStateChange()
4. Verify authStore persists user session via Zustand with AsyncStorage persist.
5. Verify app checks auth state on launch (in _layout.tsx or auth _layout.tsx).
6. Test error scenarios: wrong password, expired OTP, network error.
7. IMPORTANT: Supabase email OTP sends a 6-digit code to the user's email. The app must NOT use magic links (they break on mobile with localhost redirects). Verify the Supabase project is configured for OTP codes, not magic links.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_10_AUTH_OTP_INTEGRATION_REPORT.md

=== VERIFICATION CHECKLIST ===
- [ ] Supabase client correctly initialized
- [ ] Login with email+password calls signInWithPassword
- [ ] Registration calls signUp with metadata
- [ ] OTP verification calls verifyOtp
- [ ] Forgot password calls resetPasswordForEmail
- [ ] Session persists in AsyncStorage
- [ ] App checks auth on launch
- [ ] Error handling for all failure cases
- [ ] No magic links (OTP code only)
- [ ] No SMS/WhatsApp auth
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after auth integration verified/implemented and report created.
```

>>>COPY END<<<

---
---

# PROMPT 14 — STORES / ORDERS REAL DATA INTEGRATION

>>>COPY START<<<

```
You are inside the JAHEEZ project. Auth integration done (Prompt 13).

=== TITLE ===
PROMPT 14 — Stores and Orders Real Data Integration

=== ROLE ===
Data integration engineer. Connect screens to Supabase. Keep fallbacks safe. No UI redesign.

=== CONTEXT DOCS TO READ ===
- docs/PHASE_9_BACKEND_DATA_VERIFICATION.md (integration priority list)
- docs/07_DATA_AND_SQL_MODEL.md (table schemas)

=== GOAL ===
Replace mock data with real Supabase queries for core screens: home (featured stores), store detail (menu), orders list, order detail. Keep graceful fallbacks.

=== ALLOWED SCOPE ===
- Creating/modifying hooks in user-app/hooks/queries/
- Modifying user-app/lib/storeApi.ts, orderApi.ts, api.ts
- Minor wiring in screen files (passing real data to UI — NOT redesigning)
- Adding loading skeletons where data is being fetched

=== FORBIDDEN SCOPE ===
- Modifying Supabase schema or migrations
- Removing mock data if Supabase tables are empty
- UI redesign of any screen
- Touching auth flow
- Installing packages

=== FILES ALLOWED TO MODIFY ===
- user-app/hooks/queries/ (create or modify)
- user-app/lib/storeApi.ts, orderApi.ts, api.ts
- Screen files (ONLY for wiring data — not layout)

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/lib/supabase.ts
- package.json, shared/types.ts (without approval), brand.ts

=== STEP-BY-STEP TASKS ===
1. Connect featured stores (home) → query stores table where is_featured = true.
2. Connect store detail → query store by ID + menu_categories + menu_items.
3. Connect orders list → query orders where user_id = current user.
4. Connect order detail → query order by ID + order_items + order_status_log.
5. Use React Query (useQuery) for all fetches.
6. Add loading skeleton while fetching.
7. Add empty state when no data.
8. Keep fallbackApi.ts or mockData.ts as dev fallback — do NOT delete.
9. If Supabase returns error or is unreachable, show error state — do NOT crash.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_11_REAL_DATA_INTEGRATION_REPORT.md

=== VERIFICATION CHECKLIST ===
- [ ] Home loads featured stores from Supabase
- [ ] Store detail loads menu from Supabase
- [ ] Orders list shows user's real orders
- [ ] Order detail shows real order data
- [ ] Loading skeletons shown during fetch
- [ ] Empty states when no data
- [ ] Error states when Supabase unreachable
- [ ] Mock data preserved as fallback
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after data integration done and report created.
```

>>>COPY END<<<

---
---

# PROMPT 15 — ADMIN API VERIFICATION

>>>COPY START<<<

```
You are inside the JAHEEZ project. User app data integrated (Prompt 14).

=== TITLE ===
PROMPT 15 — Admin API Verification and Documentation (Audit Only)

=== ROLE ===
Admin API inspector. Document what exists. Do NOT refactor. Do NOT rewrite.

=== CONTEXT DOCS TO READ ===
- docs/11_API_AND_BACKEND_REQUIREMENTS.md
- docs/03_PROJECT_STRUCTURE_MAP.md (admin section)

=== GOAL ===
Inspect the admin API (scripts/admin-api.js) and admin panel (admin/ directory). Document all endpoints, auth patterns, and connections. Do NOT modify anything.

=== ALLOWED SCOPE ===
- Reading scripts/admin-api.js (skim — it's ~146KB)
- Reading admin/ directory structure and key files
- Documenting API endpoints
- Noting security concerns

=== FORBIDDEN SCOPE ===
- Refactoring admin-api.js
- Modifying admin panel code
- Modifying user-app
- Installing packages
- Deploying anything

=== FILES/FOLDERS TO INSPECT ===
- scripts/admin-api.js
- admin/src/ (App.tsx, pages/, components/, lib/)
- admin/package.json
- admin/.env.example

=== FILES ALLOWED TO MODIFY ===
None.

=== FILES NOT ALLOWED TO MODIFY ===
Everything.

=== STEP-BY-STEP TASKS ===
1. List admin/ directory structure.
2. Read admin entry point (src/App.tsx or src/main.tsx).
3. Skim admin-api.js: list all Express routes (app.get, app.post, app.patch, app.delete).
4. Document each route: method, path, purpose, auth requirement.
5. Check admin panel: does it connect to same Supabase? Does it use the Express API?
6. Note security: hardcoded secrets? Missing auth middleware? Open endpoints?
7. Identify which admin pages exist and what they manage.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_12_ADMIN_API_REPORT.md

=== VERIFICATION CHECKLIST ===
- [ ] Admin directory structure listed
- [ ] All API routes documented
- [ ] Auth patterns identified
- [ ] Security concerns noted
- [ ] Admin panel pages inventoried
- [ ] No code modified
- [ ] Report created

=== STOP CONDITION ===
Stop after audit and report. Do NOT refactor or fix anything.
```

>>>COPY END<<<

---
---

# PROMPT 16 — DRIVER APP STABILIZATION

>>>COPY START<<<

```
You are inside the JAHEEZ project. Admin audited (Prompt 15).

=== TITLE ===
PROMPT 16 — Driver App Stabilization (Only After User App Stable)

=== ROLE ===
Driver app stabilizer. Fix startup blockers. Get basic screens loading. No full redesign.

=== CONTEXT DOCS TO READ ===
- docs/04_SCREEN_AND_FEATURE_BLUEPRINT.md (Driver app section)
- docs/13_IMPLEMENTATION_MASTER_PLAN.md (Driver app phase)

=== GOAL ===
Get the driver app to a point where it starts without errors and basic screens render. Fix missing deps, broken imports, missing brand tokens. Do NOT do a full redesign.

=== ALLOWED SCOPE ===
- Reading driver-app/ files
- Fixing startup blockers (broken imports, missing config)
- Creating driver-app/constants/brand.ts if missing (copy from user-app)
- Fixing critical dependency issues

=== FORBIDDEN SCOPE ===
- Full redesign of driver app screens
- Modifying user-app
- Modifying admin
- Installing packages without approval
- Implementing GPS tracking
- Implementing complex matching logic

=== FILES/FOLDERS TO INSPECT ===
- driver-app/ (entire directory)
- driver-app/package.json
- driver-app/app/ (all screen files)
- driver-app/constants/ (brand tokens)
- driver-app/lib/ (API files)
- driver-app/store/ (state files)

=== FILES ALLOWED TO MODIFY ===
- driver-app/ files (ONLY to fix startup blockers)
- New files in driver-app/constants/ if missing

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/ (everything)
- admin/ (everything)
- shared/types.ts (without approval)
- Root package.json

=== STEP-BY-STEP TASKS ===
1. List ALL files in driver-app/.
2. Read package.json — check dependencies.
3. Read app/_layout.tsx — check for broken imports.
4. List all screen files with a 1-line status.
5. Check if brand.ts exists. If not, create it with same tokens as user-app.
6. Identify startup blockers and list them.
7. Fix ONLY critical blockers (with explanation before each fix).
8. Document what screens exist and what state they're in.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_13_DRIVER_APP_REPORT.md

=== VERIFICATION CHECKLIST ===
- [ ] Driver app directory fully audited
- [ ] Screen inventory completed
- [ ] Startup blockers identified
- [ ] Critical blockers fixed (if approved)
- [ ] Brand tokens available
- [ ] No user-app files touched
- [ ] Report created

=== STOP CONDITION ===
Stop after driver app audit and fixes. Do NOT redesign screens.
```

>>>COPY END<<<

---
---

# PROMPT 17 — WALLET AND PAYMENTS VERIFICATION

>>>COPY START<<<

```
You are inside the JAHEEZ project.

=== TITLE ===
PROMPT 17 — Wallet and Payments Verification (Audit Only)

=== ROLE ===
Payment auditor. Document what exists. Do NOT add payment providers without approval.

=== CONTEXT DOCS TO READ ===
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 9: Payment Strategy)
- docs/14_FINAL_EXPECTED_DELIVERABLE.md (V1 MVP — COD only)

=== GOAL ===
Audit all payment-related code. Document: what's implemented, what's stubbed, what Stripe code exists, whether COD flow is functional.

=== ALLOWED SCOPE ===
- Reading all payment/wallet related files

=== FORBIDDEN SCOPE ===
- Implementing Stripe
- Adding new payment providers
- Modifying checkout flow
- Modifying wallet logic
- Installing packages

=== FILES/FOLDERS TO INSPECT ===
- user-app/app/(tabs)/wallet.tsx
- user-app/app/(flows)/checkout.tsx (payment section — read only)
- user-app/app/(flows)/payment-methods.tsx
- user-app/app/(flows)/payment-success.tsx
- user-app/lib/walletApi.ts
- user-app/lib/stripeClient.ts
- user-app/hooks/queries/useWallet.ts
- user-app/store/cartStore.ts (payment method in cart)

=== FILES ALLOWED TO MODIFY ===
None.

=== FILES NOT ALLOWED TO MODIFY ===
Everything.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_14_WALLET_PAYMENTS_REPORT.md

Report sections:
1. Payment Files Inventory
2. Wallet Screen Status (stub vs functional)
3. COD Flow Status (working? where is it implemented?)
4. Stripe Code Status (keys present? SDK imported? functional?)
5. V1 Readiness Assessment (is COD-only checkout working?)
6. V2 Integration Plan (what's needed for Stripe/wallet)

=== VERIFICATION CHECKLIST ===
- [ ] All payment files identified
- [ ] Wallet screen status documented
- [ ] COD flow verified
- [ ] Stripe presence noted
- [ ] No code modified
- [ ] Report created

=== STOP CONDITION ===
Stop after audit and report. Do NOT implement payments.
```

>>>COPY END<<<

---
---

# PROMPT 18 — NOTIFICATIONS AND SUPPORT

>>>COPY START<<<

```
You are inside the JAHEEZ project.

=== TITLE ===
PROMPT 18 — Notifications and Support Verification and Polish

=== ROLE ===
Notification/support engineer. Verify in-app notification patterns. Polish WhatsApp support. No paid providers.

=== CONTEXT DOCS TO READ ===
- docs/TOOLS_AND_SERVICES_STRATEGY.md (Section 11: Notification Strategy)
- docs/08_ORDER_STATUS_AND_STATE_MACHINE.md (Notification triggers)

=== GOAL ===
Audit notification setup. Ensure WhatsApp support buttons work. Polish notification list if it exists. V1 = in-app polling, NOT push notifications.

=== ALLOWED SCOPE ===
- Reading notification-related files
- Polishing notification list screen if it exists
- Verifying WhatsApp deep links across the app
- Polishing support ticket screen (redirect to WhatsApp)

=== FORBIDDEN SCOPE ===
- Setting up FCM/APNs push notification server
- Adding paid notification services
- Installing packages
- Modifying auth or checkout flows

=== FILES/FOLDERS TO INSPECT ===
- user-app/app/(flows)/notifications.tsx
- user-app/app/(flows)/support-ticket.tsx
- user-app/hooks/usePushNotifications.ts
- user-app/hooks/queries/useNotifications.ts
- user-app/lib/notificationInbox.ts
- user-app/app/_layout.tsx (notification listener setup)

=== FILES ALLOWED TO MODIFY ===
- user-app/app/(flows)/notifications.tsx (polish UI)
- user-app/app/(flows)/support-ticket.tsx (ensure WhatsApp redirect)
- user-app/components/ui/ (notification-related components)

=== FILES NOT ALLOWED TO MODIFY ===
- user-app/app/_layout.tsx (without approval)
- package.json
- user-app/lib/supabase.ts

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_15_NOTIFICATIONS_SUPPORT_REPORT.md

=== VERIFICATION CHECKLIST ===
- [ ] Notification config status documented
- [ ] Notification list screen polished (or need documented)
- [ ] WhatsApp deep links verified on order detail, profile, support screens
- [ ] Support ticket redirects to WhatsApp
- [ ] No push server configured (V1 = polling)
- [ ] Expo still starts
- [ ] Report created

=== STOP CONDITION ===
Stop after audit/polish and report created.
```

>>>COPY END<<<

---
---

# PROMPT 19 — TESTING AND QA

>>>COPY START<<<

```
You are inside the JAHEEZ project. All features implemented and polished.

=== TITLE ===
PROMPT 19 — Testing and Quality Assurance

=== ROLE ===
QA engineer. Type-check. Verify flows. Create checklists. Fix critical bugs only.

=== CONTEXT DOCS TO READ ===
- docs/15_AI_WORKING_RULES.md (Testing section)
- docs/14_FINAL_EXPECTED_DELIVERABLE.md (Quality Gates)

=== GOAL ===
Verify the app compiles, starts, and all critical user flows work. Create manual QA checklists. Fix type errors. No new features.

=== ALLOWED SCOPE ===
- Running TypeScript type check (npx tsc --noEmit)
- Scanning for hardcoded colors
- Scanning for missing accessibilityLabels
- Fixing type errors and critical bugs
- Creating QA checklists

=== FORBIDDEN SCOPE ===
- Adding new features
- Installing testing frameworks without approval
- UI redesign
- Backend changes

=== FILES ALLOWED TO MODIFY ===
- Any .tsx/.ts file to fix type errors or critical bugs (document each fix)
- No layout or design changes

=== FILES NOT ALLOWED TO MODIFY ===
- package.json (without approval)
- brand.ts
- shared/types.ts (without approval)

=== STEP-BY-STEP TASKS ===
1. Run: npx tsc --noEmit in user-app/ directory. Document results.
2. Fix critical type errors (explain each fix).
3. Verify npx expo start launches without errors.
4. Search all .tsx files for hardcoded hex colors (regex: #[0-9a-fA-F]{3,8}). List violations.
5. Search all .tsx files for Pressable/TouchableOpacity without accessibilityLabel. List violations.
6. Create a MANUAL QA CHECKLIST for these flows:
   a. Auth: splash → welcome → register → OTP → login → logout
   b. Browse: home → category → store → product → add to cart
   c. Order: cart → checkout (COD) → confirm → order list → order detail → tracking
   d. Profile: view → edit → save → addresses → add address → language → FAQ
   e. Support: WhatsApp button on order detail, profile, and support screen
7. Note any console errors or warnings from Expo.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_16_QA_REPORT.md

Report sections:
1. TypeScript Check Results (pass/errors)
2. Type Errors Fixed
3. Hardcoded Colors Violations
4. Missing AccessibilityLabel Violations
5. Manual QA Checklist (5 flows)
6. Console Errors/Warnings
7. Overall Health Assessment

=== VERIFICATION CHECKLIST ===
- [ ] TypeScript check run
- [ ] Critical type errors fixed
- [ ] Expo starts without crash
- [ ] Hardcoded colors searched
- [ ] Accessibility labels checked
- [ ] QA checklist created
- [ ] Report created

=== STOP CONDITION ===
Stop after QA complete and report created. Do NOT start production build.
```

>>>COPY END<<<

---
---

# PROMPT 20 — PRODUCTION BUILD PREPARATION

>>>COPY START<<<

```
You are inside the JAHEEZ project. QA complete (Prompt 19).

=== TITLE ===
PROMPT 20 — Production Build Preparation (Audit and Document Only)

=== ROLE ===
Build/deploy engineer. Verify configurations. Document what's needed. Do NOT build or submit without approval.

=== CONTEXT DOCS TO READ ===
- docs/12_DEPENDENCY_AND_TOOLING_PLAN.md (EAS section)
- docs/13_IMPLEMENTATION_MASTER_PLAN.md (Production Build phase)

=== GOAL ===
Verify all production-related configurations are in place. Document what's ready and what's missing. Create a deployment checklist.

=== ALLOWED SCOPE ===
- Reading config files (app.json, eas.json, .env files)
- Verifying app icons and splash screen exist
- Documenting environment variable needs
- Creating deployment checklist

=== FORBIDDEN SCOPE ===
- Running EAS build commands
- Submitting to app stores
- Creating production credentials
- Modifying app.json without approval
- Installing packages

=== FILES/FOLDERS TO INSPECT ===
- user-app/app.json (or app.config.ts)
- user-app/eas.json (if exists)
- user-app/assets/ (app icon, splash screen files)
- user-app/.env.example
- .gitignore (secrets protection)

=== FILES ALLOWED TO MODIFY ===
None.

=== FILES NOT ALLOWED TO MODIFY ===
Everything.

=== STEP-BY-STEP TASKS ===
1. Read app.json: verify name, slug, version, bundleIdentifier, package, icon, splash config.
2. Check if eas.json exists. Document its contents or note it's missing.
3. Verify app icon file exists at expected path and is correct size.
4. Verify splash screen image exists.
5. List ALL environment variables needed for production.
6. Check if they're in .env.example.
7. Verify .gitignore protects .env files.
8. Create a deployment checklist: everything that must happen before app store submission.

=== REQUIRED REPORT FILE ===
Create: docs/PHASE_17_PRODUCTION_BUILD_REPORT.md

Report sections:
1. app.json Configuration Status
2. EAS Configuration Status
3. App Icon / Splash Verification
4. Environment Variables Inventory
5. Secrets Security Check
6. Deployment Checklist
7. Blockers Before Production

=== VERIFICATION CHECKLIST ===
- [ ] app.json reviewed
- [ ] EAS config status documented
- [ ] App icon verified
- [ ] Splash image verified
- [ ] Env vars documented
- [ ] .gitignore protects secrets
- [ ] Deployment checklist created
- [ ] No builds triggered
- [ ] Report created

=== STOP CONDITION ===
Stop after audit and report. Do NOT trigger any builds.
```

>>>COPY END<<<

---
---

# PROMPT 21 — FINAL FULL PROJECT AUDIT

>>>COPY START<<<

```
You are inside the JAHEEZ project. All phases complete.

=== TITLE ===
PROMPT 21 — Final Full Project Audit

=== ROLE ===
Chief auditor. Review everything. Produce the definitive project status report. No code changes.

=== CONTEXT DOCS TO READ ===
- ALL docs/PHASE_*_REPORT.md files
- docs/RUNTIME_VERIFICATION_REPORT.md
- docs/FINAL_PROJECT_AUDIT.md (if previous version exists)
- docs/14_FINAL_EXPECTED_DELIVERABLE.md
- docs/13_IMPLEMENTATION_MASTER_PLAN.md
- docs/TOOLS_AND_SERVICES_STRATEGY.md

=== GOAL ===
Create the final, comprehensive project audit report. Assess MVP readiness. Document risks. Provide a clear recommendation to the founder.

=== ALLOWED SCOPE ===
- Reading all report files and documentation
- Reading source code for verification
- Creating the final audit report

=== FORBIDDEN SCOPE ===
- Writing or modifying ANY source code
- Installing packages
- Making changes of any kind
- Deploying anything

=== FILES ALLOWED TO MODIFY ===
None.

=== FILES NOT ALLOWED TO MODIFY ===
Everything.

=== STEP-BY-STEP TASKS ===
1. Read every PHASE_*_REPORT.md file.
2. Create a comprehensive audit covering:

   A. MVP READINESS SCORECARD (per feature area: Ready ✅ / Partial ⚠️ / Not Ready ❌)
   - Auth Flow
   - Home / Browse
   - Store / Product
   - Cart / Checkout (COD)
   - Orders / Tracking (Stepper)
   - Profile / Settings / Addresses
   - Data Integration (Supabase)
   - Driver App
   - Admin Panel
   - Notifications
   - Payments

   B. REMAINING CRITICAL RISKS
   - Blockers that prevent launch
   - Medium risks that affect quality
   - Low risks that are nice to fix

   C. TECHNICAL DEBT LOG
   - Known issues from all reports
   - Mock data still in use
   - Incomplete features

   D. V2 FEATURES (Deferred — Not in V1 MVP)
   - Stripe card payments
   - Wallet top-up
   - Live GPS driver tracking
   - Push notifications (FCM/APNs)
   - SMS/WhatsApp OTP
   - AI order moderation
   - Dynamic translation API

   E. FOUNDER RECOMMENDATION (plain language)
   - Is the app ready for internal testing?
   - Is it ready for a small Safi beta?
   - What MUST be done before public launch?
   - Estimated effort remaining

3. Write a 1-page executive summary at the top for the founder.

=== REQUIRED REPORT FILE ===
Create: docs/FINAL_PROJECT_AUDIT.md

=== REQUIRED OUTPUT FORMAT ===
Executive summary + detailed sections with tables and checklists.

=== VERIFICATION CHECKLIST ===
- [ ] All phase reports reviewed
- [ ] MVP scorecard complete
- [ ] Risks categorized (critical/medium/low)
- [ ] Technical debt documented
- [ ] V2 features listed
- [ ] Founder summary in plain language
- [ ] Clear recommendation provided
- [ ] No code modified
- [ ] Report created

=== STOP CONDITION ===
Stop after final audit report created. This is the last prompt in the sequence. Congratulations!
```

>>>COPY END<<<

---
---
---

# APPENDIX A: PROMPT EXECUTION ORDER

```
Phase 0 is DONE. Do not redo.

PROMPT 0  → Read docs, no code
PROMPT 1  → Verify runtime (audit only)
PROMPT 2  → Audit design assets (audit only)
PROMPT 3  → Optimize oversized assets (with approval)
PROMPT 4  → Audit and improve UI components (components/ui/ only)
PROMPT 5  → Improve animation primitives (components/ui/ only)
PROMPT 6  → Polish auth screens (app/(auth)/ only)
PROMPT 7  → Polish home screen (app/(tabs)/index.tsx only)
PROMPT 8  → Polish store/product screens (store/category flows)
PROMPT 9  → Polish cart/checkout (cart/checkout flows, COD only)
PROMPT 10 → Polish orders/tracking (status stepper, no GPS)
PROMPT 11 → Polish profile/settings/addresses/support
PROMPT 12 → Audit backend data layer (no code changes)
PROMPT 13 → Integrate auth with Supabase Email OTP
PROMPT 14 → Connect stores/orders to real Supabase data
PROMPT 15 → Audit admin API (no code changes)
PROMPT 16 → Stabilize driver app (fix startup only)
PROMPT 17 → Audit wallet/payments (no code changes)
PROMPT 18 → Polish notifications and support
PROMPT 19 → TypeScript check + QA checklists
PROMPT 20 → Production build prep (audit only)
PROMPT 21 → Final project audit (report only)
```

---

# APPENDIX B: EMERGENCY PROCEDURES

**If Expo stops starting after any prompt:**
1. Tell the AI: "Expo is broken. Undo your last changes and find the cause."
2. Do NOT continue to the next prompt.
3. The AI must fix its own mistakes before proceeding.

**If the AI starts working on the wrong app:**
1. Tell the AI: "STOP. You are working on the wrong app. The current prompt only allows changes to [user-app / driver-app / admin]."

**If the AI tries to install packages:**
1. Tell the AI: "STOP. Do not install packages without my approval. Explain why you need this package and wait for my answer."

**If the AI modifies brand.ts or shared/types.ts:**
1. Tell the AI: "STOP. You are not allowed to modify brand.ts or shared/types.ts without my approval. Revert your change."

---

# APPENDIX C: REPORT FILES SUMMARY

| Report File | Created By | Purpose |
|---|---|---|
| `docs/RUNTIME_VERIFICATION_REPORT.md` | Prompt 1 | Confirms app health after Phase 0 |
| `docs/PHASE_1_ASSET_ALIGNMENT_REPORT.md` | Prompt 2 | Asset inventory and missing assets |
| `docs/PHASE_1B_ASSET_OPTIMIZATION_REPORT.md` | Prompt 3 | Compression results |
| `docs/PHASE_2_COMPONENT_AUDIT_REPORT.md` | Prompt 4 | Component quality improvements |
| `docs/PHASE_2B_ANIMATION_FOUNDATION_REPORT.md` | Prompt 5 | Animation primitives status |
| `docs/PHASE_3_AUTH_POLISH_REPORT.md` | Prompt 6 | Auth flow polish results |
| `docs/PHASE_4_HOME_SERVICES_REPORT.md` | Prompt 7 | Home screen polish results |
| `docs/PHASE_5_STORE_LIST_PRODUCT_REPORT.md` | Prompt 8 | Store/product polish results |
| `docs/PHASE_6_CART_CHECKOUT_REPORT.md` | Prompt 9 | Cart/checkout polish results |
| `docs/PHASE_7_ORDERS_TRACKING_REPORT.md` | Prompt 10 | Orders/tracking polish results |
| `docs/PHASE_8_PROFILE_SUPPORT_REPORT.md` | Prompt 11 | Profile/settings polish results |
| `docs/PHASE_9_BACKEND_DATA_VERIFICATION.md` | Prompt 12 | Data layer audit |
| `docs/PHASE_10_AUTH_OTP_INTEGRATION_REPORT.md` | Prompt 13 | Auth backend integration |
| `docs/PHASE_11_REAL_DATA_INTEGRATION_REPORT.md` | Prompt 14 | Real data connection |
| `docs/PHASE_12_ADMIN_API_REPORT.md` | Prompt 15 | Admin API documentation |
| `docs/PHASE_13_DRIVER_APP_REPORT.md` | Prompt 16 | Driver app stabilization |
| `docs/PHASE_14_WALLET_PAYMENTS_REPORT.md` | Prompt 17 | Payments audit |
| `docs/PHASE_15_NOTIFICATIONS_SUPPORT_REPORT.md` | Prompt 18 | Notifications/support status |
| `docs/PHASE_16_QA_REPORT.md` | Prompt 19 | QA results and checklists |
| `docs/PHASE_17_PRODUCTION_BUILD_REPORT.md` | Prompt 20 | Production readiness |
| `docs/FINAL_PROJECT_AUDIT.md` | Prompt 21 | Final comprehensive audit |

---

**End of ANTIGRAVITY CODING PROMPTS**
