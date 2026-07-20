# JAHEEZ — Claude Workflow

> **Purpose**: How to use Claude (Claude Code, Claude chat, or any Claude-based tool) on the JAHEEZ project. Prompt hygiene, session management, alignment preservation, and recovery from drift.

---

## 1. Session Start Protocol

Every new Claude session must begin with this exact sequence. **Never skip steps.**

### Step 1: Paste the Context File

Copy and paste the **full content** of `JAHEEZ_AGENTS.md` into Claude's context. This file contains:
- All non-negotiable rules
- Brand tokens
- Folder structure
- Database schema
- TypeScript types
- Component specifications
- Hook specifications
- Screen specifications
- Supabase query patterns
- Forbidden patterns

**Say this:**
> "Read this file completely before doing anything. This is the JAHEEZ project intelligence file. Confirm you understand all rules before I ask for any code."

### Step 2: Confirm Understanding

Wait for Claude to confirm. If Claude summarizes the file, verify it mentions:
- NativeWind (not inline styles)
- Brand tokens from `constants/brand.ts`
- Hooks as the business logic layer
- Screen build order (Phase 0 first)
- No `any` types

### Step 3: State Your Current Phase

Tell Claude:
> "I am currently on Phase [X] — [Phase Name]. The following files already exist: [list key files]. The next deliverable is: [specific file or feature]."

### Step 4: Give ONE Prompt

Give exactly one prompt from `PROMPT_LIBRARY.md` or one custom request. Never ask for multiple screens at once.

---

## 2. The Single-Task Rule

### The Problem
Claude performs best when given **one clear task at a time**. Asking for 5 screens in one prompt produces lower quality, misses details, and makes errors harder to find.

### The Rule
> **One prompt = one file (or one tightly related group of files).**

### Examples

| ✅ Good Prompt | ❌ Bad Prompt |
|---|---|
| "Create `Button.tsx` following the spec" | "Create all UI components" |
| "Create `splash.tsx` and `onboarding.tsx`" | "Build the entire auth flow" |
| "Create `useOrder.ts` with React Query" | "Create all hooks and stores" |
| "Create the home screen following Section 13" | "Build the whole app" |

### Exception
Foundation files (Phase 0) can sometimes be requested together because they're small and have no dependencies on each other.

---

## 3. Prompt Template

Use this template for every code generation request:

```
You have read JAHEEZ_AGENTS.md. Now create [file path].

Follow [Section X] of the AGENTS file exactly.

Context:
- These files already exist: [list relevant existing files]
- This file will be imported by: [list consumers]
- [Any additional context]

Requirements:
- [Specific requirement 1]
- [Specific requirement 2]
- [etc.]

Show the complete code for [file path].
```

---

## 4. How to Keep Claude Aligned

### Re-anchor Every 3-4 Messages

After 3-4 exchanges, Claude's attention to the AGENTS file fades. Re-anchor:

> "Before continuing, re-read the non-negotiable rules from Section 1 of JAHEEZ_AGENTS.md. Specifically: NativeWind only, brand tokens only, accessibilityLabel always, no any types."

### Reference Specific Sections

Don't say "follow the rules." Say:

> "Follow the ButtonProps interface from Section 10 exactly."
> "Use the Supabase query pattern from Section 14."
> "Match the order status machine from Section 6 — validate transitions."

### Verify Output Immediately

After Claude generates code, check these 5 things before moving on:

1. **Colors**: Ctrl+F for any hex value — should not exist outside `brand.ts` import
2. **Types**: Ctrl+F for `any` — should find zero matches
3. **Styles**: Ctrl+F for `style={{` — should only be for dynamic values
4. **Labels**: Every `<Pressable` has `accessibilityLabel`
5. **States**: Look for `isLoading`, `error`, `EmptyState` guards

---

## 5. Handling Drift

### Signs Claude Has Drifted

| Symptom | What Happened | Fix |
|---|---|---|
| Hardcoded hex values appear | Forgot brand tokens | Re-read Section 2 |
| `any` types in code | Forgot strict typing rule | Re-read Section 1.1 |
| Business logic in screen file | Confused hook boundary | Re-read Section 1.2 |
| `style={{ }}` instead of NativeWind | Forgot NativeWind rule | Re-read Section 1.1 |
| Missing loading/error/empty states | Forgot state handling rule | Re-read Section 15 |
| Default exports on components | Forgot export rule | Re-read Section 1.1 |
| Navigation via setTimeout | Forgot navigation rule | Re-read Section 1.1 |

### How to Correct

**Mild drift** (one rule broken):
> "You used a hardcoded color on line X. Import from `BRAND` in `constants/brand.ts`. Fix this specific line."

**Moderate drift** (multiple rules broken):
> "Several rules from Section 1 were violated. Re-read Section 1 completely and fix: [list specific violations with line numbers]."

**Severe drift** (wrong architecture):
> "Stop. This approach violates the architecture. Re-read Section 1.2 (Architecture Rules). Business logic must be in hooks, not screens. Supabase calls go through lib/api.ts. Rewrite this file from scratch following those boundaries."

---

## 6. Review Loop

After every Claude output, follow this cycle:

```
1. Claude generates code
    ↓
2. You check the 5-point verification (colors, types, styles, labels, states)
    ↓
3. If violations found → correct Claude (specific section reference)
    ↓
4. If clean → copy to project files
    ↓
5. Test in Expo Go on your phone
    ↓
6. If works → move to next prompt
    ↓
7. If broken → paste the error back to Claude with context
```

### Error Pasting Template

When pasting errors back:

```
I got this error when running [file]:

[paste exact error message]

The relevant code is in [file path] at [lines].
The file imports from [list imports].
Fix this error while following all JAHEEZ_AGENTS.md rules.
```

---

## 7. Session Recovery

### When Claude Forgets Everything

Long sessions cause Claude to gradually forget the AGENTS file. Signs:
- Different naming conventions than specified
- Different component APIs than Section 10
- Generic React Native patterns instead of project-specific patterns

**Fix**: End the session. Start a new one. Re-paste JAHEEZ_AGENTS.md.

### When You Need to Continue Where You Left Off

Start a new session with:

> "Read this file completely: [paste JAHEEZ_AGENTS.md]"
>
> "I am building JAHEEZ. Here is the current state:
> - Phase [X] is complete.
> - Phase [Y] is in progress.
> - These files exist: [key files list]
> - I am working on: [specific deliverable]
> - The last thing built was: [file name]
>
> Continue from where I left off. The next task is: [specific task]."

---

## 8. Prompt Hygiene Rules

| Rule | Why |
|---|---|
| **Paste AGENTS.md at session start** | Without it, Claude has no project context |
| **One file per prompt** | Higher quality, easier review |
| **Name the section** | "Follow Section 10" is unambiguous |
| **Verify before accepting** | Cheaper to fix in the same session |
| **Never say "just make it work"** | Claude will take shortcuts that break rules |
| **Never say "do whatever you think is best"** | Claude must follow the spec, not improvise |
| **Always paste error messages in full** | Truncated errors lead to wrong fixes |
| **End sessions after 15-20 exchanges** | Context quality degrades |
| **Save working code immediately** | Don't rely on Claude's memory of what it generated |

---

## 9. Claude-Specific Tips

### What Claude Excels At
- Following detailed specifications exactly
- Writing TypeScript with correct types
- Implementing component APIs from interface definitions
- Writing Supabase query builder code
- Understanding Arabic text direction requirements

### What Claude Struggles With
- Maintaining rule adherence over long sessions
- Remembering brand-specific visual details after 10+ exchanges
- Correctly implementing NativeWind (sometimes uses vanilla RN styles)
- Complex animation code (Reanimated v3 patterns)
- RTL layout edge cases

### Working Around Weaknesses
1. **For animations**: Provide the exact Reanimated pattern you want, not just "add animations"
2. **For NativeWind**: Include example className strings in your prompt
3. **For RTL**: Explicitly mention RTL in every screen prompt
4. **For long sessions**: Break into shorter sessions, re-paste AGENTS.md

---

*Claude is a powerful tool when properly guided. Your job is to keep it on the rails.*
