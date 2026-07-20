# JAHEEZ — Master Instructions

> **Version**: 1.0  
> **Status**: Authoritative — This is the single source of truth for the entire JAHEEZ project.  
> **Last Updated**: 2026-04-07  
> **Read this before every session, before every task, before every line of code.**

---

## 1. Project Identity

**Name**: JAHEEZ (جاهز — Arabic for "Ready")  
**Tagline**: Delivery & Errands  
**Logo**: Red wordmark on yellow background  
**Target Market**: Safi region, Morocco  
**Primary Language**: Arabic (RTL), Secondary: French (LTR)  
**Currency**: Moroccan Dirham (MAD)

JAHEEZ is a production-grade delivery and errand platform. Users order food, groceries, pharmacy items, or request any legal errand. Drivers accept and fulfill tasks. Admins monitor operations, moderate requests, and manage the platform.

---

## 2. Mission

Build a reliable, safe, and locally-relevant delivery and errand platform that:

1. **Serves ordinary people** in Safi who need things done — from pharmacy runs to document pickups to food delivery.
2. **Protects against misuse** through a rule-based moderation system that detects and blocks illegal or exploitative requests.
3. **Empowers local drivers** with fair earning opportunities and a safe working environment.
4. **Operates with complete transparency** — full audit trails, clear pricing, and traceable decisions.

---

## 3. Three Applications

| Application | Technology | Purpose |
|---|---|---|
| **user-app/** | Expo SDK 51 + React Native + Expo Router v3 | Customer mobile app (iOS + Android) |
| **driver-app/** | Expo SDK 51 + React Native + Expo Router v3 | Driver mobile app (iOS + Android) |
| **admin/** | Next.js 14 App Router + Tailwind CSS | Operations web panel |

**Build order**: user-app → driver-app → admin panel.  
The user-app is the first milestone. All documentation is written with user-app as the primary focus, then extended.

---

## 4. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Mobile Framework** | Expo SDK 51 + React Native | Cross-platform, OTA updates, Expo Go for testing |
| **Routing** | Expo Router v3 | File-based routing, deep linking, type-safe navigation |
| **Styling** | NativeWind v4 | Tailwind CSS for React Native — consistent, utility-first |
| **Local State** | Zustand | Lightweight, no boilerplate, persist with AsyncStorage |
| **Server State** | React Query (TanStack Query) | Caching, refetching, pagination, mutations |
| **Backend** | Supabase | Postgres + Auth + Realtime + Storage + Edge Functions |
| **Database** | PostgreSQL (via Supabase) | ACID, PostGIS, JSONB, RLS |
| **Real-Time** | Supabase Realtime | WebSocket channels for tracking, chat, order updates |
| **Maps** | react-native-maps + Google Maps API | Driver tracking, location selection |
| **Language** | TypeScript (strict mode) | No `any`. Types defined once in `shared/types.ts` |
| **Build/Deploy** | EAS (Expo Application Services) | iOS + Android builds, OTA updates |
| **Admin Panel** | Next.js 14 + Tailwind CSS | Operations web panel, moderation UI |

### What is NOT in the stack
- No custom backend server — Supabase IS the backend
- No Redux — use Zustand
- No Styled Components — use NativeWind
- No Firebase — use Supabase
- No REST API server — use Supabase client SDK + Edge Functions

---

## 5. Non-Negotiable Rules

These rules must never be broken. Any output violating them is rejected.

### 5.1 Code Rules

| Rule | Enforcement |
|---|---|
| **No inline styles** | Use NativeWind classes only. Never `style={{ }}` |
| **No hardcoded colors** | Always import from `constants/brand.ts` |
| **No `any` type** | Use proper types from `shared/types.ts` |
| **No default exports** | Named exports only, except screen files in `app/` |
| **No business logic in components** | Logic lives in `hooks/`, UI in `components/ui/` |
| **No new packages without approval** | Ask first, explain why |
| **No setTimeout for navigation** | Use Expo Router `router.push()` / `router.replace()` |
| **No duplicate code** | If used twice, extract to `components/ui/` |
| **Handle all states** | Loading, error, AND empty state on every screen |
| **Accessibility always** | `accessibilityLabel` on every `Pressable` and `Image` |
| **TypeScript strict mode** | `tsconfig.json` has `strict: true` |
| **Named exports** | Everything except screen files |
| **React Query for server data** | No raw `fetch` or direct Supabase calls in screens |
| **Zustand for shared state** | State shared between screens uses Zustand |
| **JetBrains Mono for prices** | All money values, OTP codes, and reference IDs |

### 5.2 Architecture Rules

| Rule | Detail |
|---|---|
| **Screen import boundary** | Screens only import from: `hooks/`, `components/ui/`, `constants/`, `lib/` |
| **Hook responsibility** | Hooks handle all Supabase calls, business logic, and state |
| **Component purity** | `components/ui/` contains only pure presentational widgets |
| **No cross-screen imports** | No screen imports another screen directly |
| **Single Supabase client** | Instantiated ONCE in `lib/supabase.ts` — never elsewhere |
| **Centralized types** | All interfaces live in `shared/types.ts` — never inline |
| **API layer** | All API calls go through `lib/api.ts` — never call Supabase from screens |

### 5.3 Design Rules

| Element | Specification |
|---|---|
| **Primary button** | RED (#EF4444), 52px height, pill radius (9999) |
| **Input fields** | 52px height, 12px radius, INPUT_BG fill, RED focus border |
| **Cards** | White background, 16px radius, shadow, 16px padding |
| **Screen background** | BG (#FEFCE8) — warm cream-yellow |
| **Spacing** | All multiples of 8px |
| **Primary font** | DM Sans (display, body, UI) |
| **Mono font** | JetBrains Mono (prices, OTP, IDs, references) |
| **Bottom nav** | 64px + safe area, white, 1px top border |
| **Top nav** | 56px, white, title bold centered, back arrow 44px touch |

---

## 6. Architecture Principles

### 6.1 Separation of Concerns

```
Screen (UI) → Hook (Logic) → API Layer (lib/api.ts) → Supabase (Backend)
```

- **Screens** render UI, call hooks, handle navigation
- **Hooks** contain all business logic, call API functions, manage state
- **API Layer** wraps Supabase queries with error handling and typed responses
- **Supabase** is the database, auth provider, real-time engine, and file storage

### 6.2 Data Flow

```
User Action → Hook.mutation() → api.ts → Supabase
Supabase Change → Realtime Subscription → Hook state update → Screen re-render
```

### 6.3 State Management Strategy

| State Type | Tool | Example |
|---|---|---|
| Server data (remote) | React Query | Orders list, user profile, chat messages |
| Shared client state | Zustand | Auth state, cart, active order tracking |
| Local component state | useState | Form inputs, toggles, animation values |
| Navigation state | Expo Router | Current screen, route params |

### 6.4 Error Handling Pattern

Every async operation returns `ApiResponse<T>`:
```
{ data: T | null, error: string | null }
```

Every screen handles three states:
1. **Loading** → Show `<Loader />`
2. **Error** → Show `<EmptyState icon="⚠️" title="حدث خطأ" />`
3. **Empty** → Show `<EmptyState />` with contextual message
4. **Data** → Render content

---

## 7. Coding Principles

1. **Write less code, not more**. If there's a simpler way, use it.
2. **Types are documentation**. If a type exists in `shared/types.ts`, use it.
3. **Don't be clever**. Write obvious code that a junior developer can read.
4. **One responsibility per file**. A hook does one thing. A component renders one thing.
5. **Consistency over preference**. Follow the established patterns, even if you'd do it differently.
6. **Test the boundaries**. Test hooks (logic boundary) and API functions (data boundary).
7. **NoOps are safe**. A disabled button that does nothing is better than a crash.

---

## 8. Design Principles

1. **Red and Yellow are the brand**. RED for actions, YELLOW for backgrounds and accents.
2. **Arabic first**. All UI text defaults to Arabic (RTL). French is secondary.
3. **8px grid always**. Every spacing value is a multiple of 8.
4. **Consistency is king**. Every button looks the same. Every card has the same radius and shadow.
5. **Status colors are semantic**. GREEN = success, WARN = pending, ERROR_RED = failure.
6. **Accessibility is mandatory**. Labels on every interactive element. Sufficient contrast ratios.
7. **Mobile-first thinking**. Thumb zones, 44px minimum touch targets, safe area respect.

---

## 9. Workflow Rules

### Starting a new session
1. Read this file (MASTER_INSTRUCTIONS.md)
2. Read the relevant build phase in BUILD_PHASES.md
3. Read the relevant prompts in PROMPT_LIBRARY.md
4. Execute ONE phase or ONE screen at a time
5. Review output against REVIEW_CHECKLIST.md before moving on

### During development
- Build in the exact order specified in BUILD_PHASES.md
- Never skip phases — each phase depends on the previous
- Test after each screen is built, not at the end
- Keep the AGENTS.md file in AI context at all times

### After building
- Run the review checklist
- Verify all three states (loading, error, empty) on every screen
- Confirm no hardcoded colors, no `any` types, no inline styles
- Test the user journey end-to-end

---

## 10. How AI Should Behave on This Project

### When starting a task:
1. State which file(s) you will create or modify
2. State which types from `shared/types.ts` you will use
3. State which hooks you will call
4. State which Supabase tables you will query
5. State whether any new component is needed in `components/ui/`

### When generating code:
- Follow the file placement rules in FOLDER_STRUCTURE.md
- Import brand tokens from `constants/brand.ts`
- Import types from `shared/types.ts`
- Use NativeWind classes, never inline styles
- Handle loading, error, and empty states
- Add `accessibilityLabel` to every interactive element

### When you are unsure:
- Check the AGENTS.md file for the answer
- Check the relevant section of JAHEEZ_AGENTS.md
- If still unsure, ask — do not improvise

### When you drift:
The user will say: "You violated a rule from the AGENTS file. Re-read section [X] and fix it."  
When this happens, stop, re-read the section, and correct the output.

---

## 11. Key Reference Files

| File | Purpose |
|---|---|
| `AGENTS.md` | Quick-reference project intelligence file |
| `JAHEEZ_AGENTS.md` | Complete AI agent instruction file (all specs) |
| `JAHEEZ_PROMPTS.md` | Sequenced AI prompts for building the app |
| `JAHEEZ_system_design_part1.md` | System architecture, DB schema, API design |
| `JAHEEZ_system_design_part2.md` | Real-time system, moderation workflows, security |
| `docs/MASTER_INSTRUCTIONS.md` | This file — top-level source of truth |
| `docs/BUILD_PHASES.md` | Phase-by-phase execution plan |
| `docs/CODING_RULES.md` | Detailed coding standards |
| `docs/DESIGN_SYSTEM_RULES.md` | Visual identity and component specifications |
| `docs/FOLDER_STRUCTURE.md` | Exact folder tree and placement rules |
| `docs/REVIEW_CHECKLIST.md` | Post-build review criteria |

---

## 12. The MVP — First Milestone

The first working milestone is the **user-app** with these capabilities:

1. ✅ User can register with phone + OTP verification
2. ✅ User can log in
3. ✅ User sees home screen with categories and recent orders
4. ✅ User can create a custom errand/delivery request
5. ✅ Request goes through moderation (manual review or reject)
6. ✅ User sees confirmation screen with order reference
7. ✅ User can track order in real-time on a map
8. ✅ User can chat with assigned driver
9. ✅ User can view order history
10. ✅ User can manage profile

This does NOT include:
- Payment processing (cash only for MVP)
- Store browsing / menu ordering
- Driver app (Phase 4)
- Admin panel (Phase 5)

---

*This document governs all decisions. When in doubt, this file wins.*
