# JAHEEZ — Antigravity Workflow

> **Purpose**: How to use Antigravity (Google's AI coding assistant) with the JAHEEZ project. Beginner-friendly daily workflow, Expo Go testing, batch management, chaos prevention, and Google Stitch integration.

---

## 1. What is Antigravity?

Antigravity is your AI coding partner inside the IDE. It can:
- Read your project files and understand context
- Generate code that follows your rules
- Run terminal commands (npm, expo, git)
- Open browsers and test your app
- Create documentation and plans

**Your role**: Give clear, focused instructions. Review its output. Keep it aligned with JAHEEZ rules.

---

## 2. Initial Setup (Do This Once)

### 2.1 Project Context

Antigravity reads your workspace files automatically. Make sure these files exist at the root:

| File | Purpose | Must Exist |
|---|---|---|
| `AGENTS.md` | Quick-reference project rules | ✅ Already exists |
| `JAHEEZ_AGENTS.md` | Complete AI instruction file | ✅ Already exists |
| `JAHEEZ_PROMPTS.md` | Sequenced build prompts | ✅ Already exists |
| `docs/MASTER_INSTRUCTIONS.md` | Top-level source of truth | ✅ Created |
| `docs/BUILD_PHASES.md` | Build order and done criteria | ✅ Created |

Antigravity will read `AGENTS.md` from the user rules automatically. For detailed work, reference specific docs.

### 2.2 Google Stitch Connection

You have **Google Stitch** connected to your IDE. Use it as follows:

1. **Before any UI work**: Search Google Stitch for design inspiration
2. **Search keywords**: Use these exact search terms:
   - `"premium delivery app UI mobile"` → Home screen layout ideas
   - `"order tracking map mobile premium"` → Tracking screen references
   - `"arabic mobile login screen beautiful"` → Auth screen patterns
   - `"food delivery order confirmation animation"` → Confirmation ideas
   - `"mobile chat interface premium design"` → Chat screen patterns
   - `"mobile bottom navigation premium"` → Tab bar design
   - `"OTP verification screen modern"` → OTP layout
   - `"mobile card component shadow"` → Card design
3. **Apply findings**: Tell Antigravity which Stitch result to draw from
4. **Example instruction**:
   > "Use the layout pattern from Google Stitch result for 'premium delivery home screen'. Apply JAHEEZ brand colors (RED #EF4444, YELLOW #F2C94C, BG #FEFCE8). Make the header gradient from YELLOW to YELLOW_LIGHT."

### 2.3 Expo Go Setup

To test the app on your real phone:

1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Connect phone and computer to the **same Wi-Fi network**
3. In terminal, Antigravity will run: `npx expo start`
4. Scan the QR code with your phone camera (iOS) or Expo Go app (Android)
5. The app loads instantly — changes hot-reload automatically

---

## 3. Daily Workflow

### Morning: Plan

```
Step 1: Open docs/BUILD_PHASES.md
Step 2: Identify which phase you're in
Step 3: Identify the next 1-3 deliverables for today
Step 4: Open Google Stitch and search for relevant design references
Step 5: Tell Antigravity your plan
```

**Say to Antigravity:**
> "Today I'm working on Phase [X]. I need to build [specific files]. Here's the Google Stitch reference I want to follow: [describe or screenshot]. Start with [first file]."

### During the Day: Build

```
Step 1: Give Antigravity ONE file to create
Step 2: Review the generated code (5-point check)
Step 3: Test in Expo Go on your phone
Step 4: If it works → commit and move to next file
Step 5: If it breaks → paste the error back to Antigravity
Step 6: Repeat for each file in today's plan
```

### Evening: Review

```
Step 1: Run through REVIEW_CHECKLIST.md for today's files
Step 2: Fix any violations found
Step 3: Update your progress (mark items done in BUILD_PHASES.md)
Step 4: Note any issues or questions for tomorrow
Step 5: Commit all working code to git
```

---

## 4. How to Give Instructions to Antigravity

### Good Instructions

```
✅ "Create user-app/components/ui/Button.tsx following the ButtonProps interface 
from JAHEEZ_AGENTS.md Section 10. Use NativeWind classes, add press animation 
with scale(0.97) spring, and include all 4 variants: primary, secondary, ghost, danger."

✅ "Create app/(auth)/login.tsx matching the Google Stitch reference for 'premium 
mobile login dark'. Use JAHEEZ brand colors. Include phone input, password input, 
login button (RED primary), divider with 'أو', and register link."

✅ "The Button component is missing the loading spinner state. 
When isLoading=true, replace the label with an ActivityIndicator in white. 
Disable press while loading."
```

### Bad Instructions

```
❌ "Build the app"
❌ "Create all the screens"  
❌ "Make it look good"
❌ "Fix everything"
❌ "Do what the AGENTS file says"
```

### The Golden Pattern

```
[What to create] + [Which spec to follow] + [Design reference] + [Specific details]
```

---

## 5. Working with Batches

### What is a Batch?

A batch is a related group of files that should be built together because they depend on each other.

### Batch Rules

| Batch Size | When to Use | Example |
|---|---|---|
| **1 file** | Complex screens, hooks with logic | `tracking/[id].tsx`, `useOrder.ts` |
| **2-3 files** | Simple related files | Auth layout + splash + onboarding |
| **4-5 files** | Foundation files (no deps) | types.ts + constants.ts + brand.ts + animations.ts |
| **Never > 5** | Quality drops sharply | Split into multiple requests |

### Batch Template

```
"Create these [N] files as a batch. They are related because [reason].

File 1: [path] — [brief description]
File 2: [path] — [brief description]

Follow [spec reference].
Use [design reference].
Show complete code for all files."
```

---

## 6. How to Avoid Chaos

### The 5 Chaos Traps

| Trap | How It Happens | Prevention |
|---|---|---|
| **Scope creep** | "While you're at it, also add..." | Finish current file first, then start new request |
| **Branching** | "Let's try a different approach" mid-file | Commit working code before experimenting |
| **Skipping phases** | "Just build the tracking screen" (no foundation) | Follow BUILD_PHASES.md in order |
| **No review** | Accepting code without checking | Always run 5-point verification |
| **No testing** | Building 10 files before testing any | Test each file in Expo Go immediately |

### The JAHEEZ Anti-Chaos Protocol

1. **One file at a time** (or small related batch)
2. **Review every output** (5-point check)
3. **Test on real device** (Expo Go)
4. **Commit working code** (git commit after each verified file)
5. **Never skip phases** (foundation first, always)
6. **Never change the architecture** without reading ARCHITECTURE_GUIDE.md
7. **Never install packages** without approval documentation

---

## 7. Running the App

### Start Development Server

Tell Antigravity:
> "Start the Expo development server for the user-app"

It will run:
```
cd user-app && npx expo start
```

### Test on Device

1. Expo Go will show a QR code in terminal
2. Scan with your phone
3. App loads with hot reload
4. Make changes → save → app updates automatically

### Common Issues

| Issue | Fix |
|---|---|
| QR code won't scan | Ensure same Wi-Fi network; try `npx expo start --tunnel` |
| App crashes on load | Check terminal for error; common: missing imports, type errors |
| Styles don't apply | NativeWind might not be configured; verify `babel.config.js` |
| Fonts not loading | Verify font files exist in `assets/fonts/` and are loaded in `_layout.tsx` |
| Supabase connection fails | Check `.env` file has correct `EXPO_PUBLIC_SUPABASE_URL` and key |

---

## 8. Using Google Stitch Effectively

### When to Search

| Phase | Search Before Building |
|---|---|
| Phase 1 (Components) | `"mobile button component design"`, `"card component shadow premium"` |
| Phase 3 (Auth) | `"premium login screen mobile"`, `"OTP input mobile beautiful"` |
| Phase 4 (Home) | `"delivery app home screen premium"`, `"bottom navigation tab bar modern"` |
| Phase 5 (Request) | `"mobile form design premium"`, `"order creation flow"` |
| Phase 6 (Tracking) | `"order tracking map mobile"`, `"live GPS tracking screen"` |

### How to Apply Stitch Results

1. Find a result you like
2. Identify the **layout pattern** (not the specific colors/branding)
3. Tell Antigravity:
   > "Use the layout pattern from this Google Stitch result: [describe layout]. The header has [X], the body has [Y], the bottom has [Z]. Apply JAHEEZ brand tokens: RED for CTAs, YELLOW for backgrounds, BG for screen background."
4. Review the output for brand consistency

### Stitch + JAHEEZ Rules Priority

If a Stitch reference conflicts with JAHEEZ rules:

```
JAHEEZ rules ALWAYS win.

Example: Stitch result uses purple buttons.
→ JAHEEZ rule: buttons are RED (#EF4444).
→ Use the layout from Stitch, but RED buttons from JAHEEZ.
```

---

## 9. What to Do Each Day

### Day 1: Setup & Foundation
- Verify project structure exists
- Create Phase 0 foundation files (types, constants, brand, API)
- Test that Supabase connects
- Set up Expo Go on your phone

### Day 2-3: UI Components
- Search Google Stitch for component references
- Build all 15+ UI components (Phase 1)
- Test each component visually in a scratch screen
- Verify animations work on real device

### Day 4-5: Hooks & State
- Build all hooks (Phase 2)
- Build all Zustand stores
- Test auth flow with Supabase
- Verify React Query caching works

### Day 6-8: Auth & Home
- Search Stitch for auth and home screen references
- Build auth screens (Phase 3)
- Build tab layout and home screen (Phase 4)
- Test full flow: splash → login → home

### Day 9-11: Request & Tracking
- Build custom request screen (Phase 5)
- Build confirmation and tracking screens (Phase 6)
- Test AI moderation flow (approve/review/reject)
- Test real-time tracking with simulated data

### Day 12-14: Chat & Polish
- Build chat screens
- Polish all animations
- Run REVIEW_CHECKLIST.md
- Fix all violations
- Test all user journeys

### Day 15+: Driver App
- Start driver-app Phase 4
- Mirror foundation from user-app
- Build driver-specific screens

---

## 10. Emergency Procedures

### "The App Won't Start"

Tell Antigravity:
> "The Expo app won't start. Here's the error: [paste full error]. Debug this following the app's rules."

### "Antigravity Generated Wrong Code"

> "This code violates JAHEEZ rules. Specifically: [list violations]. Re-read AGENTS.md Section [X] and regenerate this file."

### "I'm Lost and Don't Know What to Do Next"

> "Read docs/BUILD_PHASES.md and docs/EXECUTION_PLAYBOOK.md. Tell me which phase I'm in based on what files exist, and what the next step should be."

### "Everything is Broken"

1. Git reset to last working commit: `git checkout .`
2. Restart from the last verified phase
3. Rebuild one file at a time
4. Test after every single file

---

*Antigravity is your pair programmer. You drive, it codes. Stay in control.*
