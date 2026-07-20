# JAHEEZ — Beginner Guide

> **Purpose**: Explain the whole path to a non-technical beginner using AI tools. What to do first, what not to do, how to test, how to avoid giving AI too much at once, and how to go from idea to a working app.

---

## Welcome to JAHEEZ

You're about to build a real mobile app. You don't need to be a programmer — your AI tools (Antigravity, Claude) will write the code. **Your job is to direct them correctly.**

Think of yourself as an **architect** telling builders what to construct. The builders are fast and skilled, but they only build exactly what you describe. If you describe something wrong, they build it wrong — quickly.

This guide will teach you how to direct your AI builders effectively.

---

## 1. What You're Building

**JAHEEZ** is a delivery and errand app for people in Safi, Morocco. Here's what it does:

1. **Users** open the app, type what they need ("buy medicine from pharmacy X")
2. **AI** checks if the request is safe and legal
3. If safe, nearby **drivers** get notified and can accept the job
4. **Users** track the driver in real-time on a map
5. When delivered, the **user** confirms and rates the driver

You're building the **user app** first. The driver app and admin panel come later.

---

## 2. What You Need

### Tools (Install These)

| Tool | What It Is | Where to Get It |
|---|---|---|
| **VS Code or Cursor** | Your code editor (where Antigravity lives) | [code.visualstudio.com](https://code.visualstudio.com) |
| **Node.js** | JavaScript runtime (needed for everything) | [nodejs.org](https://nodejs.org) — install LTS version |
| **Expo Go** | App to test JAHEEZ on your phone | App Store (iOS) or Play Store (Android) |
| **Git** | Version control (saves your work) | Usually pre-installed; or [git-scm.com](https://git-scm.com) |

### Accounts (Create These)

| Account | Why | URL |
|---|---|---|
| **Supabase** | Your database and backend | [supabase.com](https://supabase.com) — free tier is fine |
| **Google Cloud** | For Google Maps API key | [console.cloud.google.com](https://console.cloud.google.com) |
| **Expo** | For building the final app | [expo.dev](https://expo.dev) — free account |

### Knowledge (You Don't Need Much)

You do NOT need to know:
- ❌ How to write JavaScript or TypeScript
- ❌ How databases work
- ❌ How React Native works
- ❌ How Supabase works

You DO need to know:
- ✅ How to copy and paste text
- ✅ How to read error messages (even if you don't understand them — you'll paste them to AI)
- ✅ How to use your phone to scan a QR code
- ✅ How to follow step-by-step instructions

---

## 3. The Order of Things

> **THE MOST IMPORTANT RULE**: Build things in order. Every step depends on the one before it.

```
Step 1:  Set up the project         (one time)
Step 2:  Build the foundation       (types, tokens, API layer)
Step 3:  Build UI components        (buttons, cards, inputs)
Step 4:  Build the brain            (hooks and state management)
Step 5:  Build auth screens         (login, register, OTP)
Step 6:  Build the home screen      (tabs and navigation)
Step 7:  Build order creation       (request form + AI moderation)
Step 8:  Build tracking and chat    (maps, real-time, messaging)
Step 9:  Polish and test            (review, fix, verify)
```

**Never skip steps.** Don't ask for the tracking screen before the foundation exists.

---

## 4. How to Work Each Day

### The Daily Cycle

```
Morning:
  1. Open docs/BUILD_PHASES.md
  2. Find where you left off
  3. Identify 1-3 files to build today
  4. Open Google Stitch, search for design inspiration

Work:
  5. Ask your AI tool to build ONE file
  6. Review what it generated (Quick 5-Point Check)
  7. Test on your phone (open Expo Go, scan QR code)
  8. If it works → save (git commit)
  9. If it doesn't → paste the error back to AI
  10. Repeat for each file

Evening:
  11. Check off what you completed in BUILD_PHASES.md
  12. Note any problems for tomorrow
  13. Save everything (git commit)
```

### The Quick 5-Point Check (Do This Every Time)

After the AI generates any file, check:

1. **Colors**: Are there any `#EF4444` or other hex values? They should only be in `brand.ts`
2. **Types**: Is the word `any` anywhere? It shouldn't be
3. **Styles**: Is there `style={{` in the code? Only for animations and dynamic values
4. **Labels**: Does every button have `accessibilityLabel`?
5. **States**: Does the screen handle loading, error, and empty conditions?

If any check fails, tell the AI: "You violated rule [X]. Fix it."

---

## 5. What NOT to Do

### The Biggest Mistakes Beginners Make

| Mistake | Why It's Bad | What to Do Instead |
|---|---|---|
| **"Build the whole app"** | AI generates garbage | Ask for ONE file at a time |
| **"Make it look nice"** | Too vague, AI guesses wrong | Use Google Stitch references + brand tokens |
| **Skipping Phase 0** | Nothing works without foundation | Always build foundation first |
| **Not testing on phone** | Code might look correct but crash | Test after every file in Expo Go |
| **Not saving (git commit)** | You lose working code when AI breaks something | Commit after every verified file |
| **Asking AI to "fix everything"** | AI changes things randomly | Point to specific lines and specific problems |
| **Building 10 files before testing** | Too many things to debug at once | Test ONE file, then build the next |
| **Changing the architecture** | Breaks all existing code | Follow FOLDER_STRUCTURE.md exactly |
| **Installing random packages** | Compatibility issues | Only use specified packages |

### Things You Should Never Ask the AI

- ❌ "Build the whole user app"
- ❌ "Add whatever you think is missing"
- ❌ "Make it production-ready"
- ❌ "Use a better approach"
- ❌ "Do what makes sense"

### Things You Should Always Say to the AI

- ✅ "Follow JAHEEZ_AGENTS.md Section 10 for the Button component"
- ✅ "Create only `user-app/components/ui/Button.tsx`"
- ✅ "Use NativeWind classes, not inline styles"
- ✅ "Import colors from constants/brand.ts"
- ✅ "Add accessibilityLabel to every Pressable"

---

## 6. How to Test the App

### Testing on Your Phone (Expo Go)

1. Make sure your phone and computer are on the **same Wi-Fi**
2. In the terminal, the AI will run `npx expo start`
3. A QR code appears in the terminal
4. **iPhone**: Open Camera → point at QR code → tap the link
5. **Android**: Open Expo Go app → tap "Scan QR Code" → scan

### What to Look For When Testing

| Test | What You See | ✅ Pass | ❌ Fail |
|---|---|---|---|
| App loads | Screen appears | Something shows | White/red error screen |
| Colors correct | Brand colors | Red buttons, yellow background | Random/default colors |
| Text readable | Arabic text | Right-to-left, correct font | Left-to-right, system font |
| Buttons work | Tap any button | Animation + action happens | Nothing happens or crash |
| Loading shows | Wait for data | Spinner or skeleton | Blank screen |
| Error shows | Turn off Wi-Fi, open app | Error message with icon | Blank screen or crash |

### If Something Breaks

1. Look at the **terminal** for error messages
2. Copy the **entire error message**
3. Tell the AI: "I got this error: [paste error]. Fix it."
4. If the AI can't fix it after 2 attempts, go back to the last working version:
   ```
   git checkout .
   ```

---

## 7. Understanding the Project Files

You don't need to understand code, but you should know what these files DO:

### Files About Rules (Read These, Don't Edit)

| File | What It Contains |
|---|---|
| `AGENTS.md` | Quick reference for all project rules |
| `JAHEEZ_AGENTS.md` | Complete detailed rules (give this to AI) |
| `docs/MASTER_INSTRUCTIONS.md` | Top-level source of truth |
| `docs/BUILD_PHASES.md` | What to build and when |
| `docs/REVIEW_CHECKLIST.md` | How to verify AI output |

### Files the AI Creates (These Are the App)

| Folder | What's Inside |
|---|---|
| `shared/` | Data types and constants (shared by all apps) |
| `user-app/constants/` | Colors, fonts, spacing — the design system |
| `user-app/lib/` | Database connection and query functions |
| `user-app/components/ui/` | Reusable visual pieces (buttons, cards, etc.) |
| `user-app/hooks/` | The "brain" — business logic |
| `user-app/store/` | Memory — data that persists between screens |
| `user-app/app/` | The screens users see and interact with |

---

## 8. Using Google Stitch for Design

Google Stitch is connected to your IDE. It helps you find beautiful design references.

### Before Building Any Screen

1. Open Google Stitch
2. Search: `"premium [screen name] mobile design"`
   - Example: `"premium login screen mobile arabic"`
   - Example: `"delivery tracking map screen premium"`
3. Browse 3-5 results
4. Pick the layout you like most
5. Tell the AI: "Use the layout pattern from Google Stitch. Apply JAHEEZ brand colors."

### Important: Stitch is for Layout, Not Branding

- ✅ Copy the **layout structure** (what goes where)
- ✅ Copy the **animation ideas** (how things move)
- ❌ Don't copy the **colors** (use JAHEEZ brand tokens)
- ❌ Don't copy the **fonts** (use DM Sans and JetBrains Mono)
- ❌ Don't copy the **branding** (JAHEEZ has its own identity)

---

## 9. The Path from Idea to Working App

```
Week 1: Environment + Foundation
├── Day 1: Install tools, create accounts, set up project
├── Day 2: Build foundation files (types, constants, brand, API)
└── Day 3: Build UI components (buttons, inputs, cards)

Week 2: Components + Auth
├── Day 4: Finish UI components (loaders, sheets, animations)
├── Day 5: Build hooks and state stores
├── Day 6: Build auth screens (splash, onboarding, login)
└── Day 7: Build auth screens (register, OTP, test full auth flow)

Week 3: Core Screens
├── Day 8: Build bottom navigation and home screen
├── Day 9: Build orders, chat list, profile screens
├── Day 10: Build custom request screen with AI moderation
└── Day 11: Build confirmation screen, test order creation

Week 4: Tracking + Polish
├── Day 12: Build tracking screen with map
├── Day 13: Build chat screen
├── Day 14: Polish, review checklist, fix violations
└── Day 15: Final testing, all user journeys verified

Result: Working user-app MVP on your phone! 🎉
```

---

## 10. Glossary

Terms you'll encounter:

| Term | Meaning |
|---|---|
| **Component** | A reusable piece of UI (like a button or card) |
| **Screen** | A full page in the app (like the login page) |
| **Hook** | A function that manages data and logic |
| **Store** | A place to save data that multiple screens share |
| **Type** | A definition of what shape data should have |
| **Token** | A named value (like BRAND.RED = "#EF4444") |
| **NativeWind** | A system for styling that uses class names |
| **Supabase** | Your database and backend service |
| **Expo Go** | The app on your phone to test while developing |
| **React Query** | A tool that manages fetching data from the server |
| **Zustand** | A tool that manages data shared between screens |
| **RTL** | Right-to-left (how Arabic text flows) |
| **RLS** | Row-Level Security (database protection rules) |
| **Edge Function** | A small server program that runs on Supabase |
| **Lottie** | Animated illustrations in JSON format |
| **MVP** | Minimum Viable Product (first working version) |

---

*You don't need to be a programmer. You need to be a clear communicator. Tell the AI exactly what you want, one piece at a time, and verify each piece before moving on.*
