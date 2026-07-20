# FRONTEND_ONLY_SETUP.md
# JAHEEZ — Plain English Guide: Build the Front End First, See It on Your Phone

> **Who this is for**: Someone with zero mobile dev experience who wants to build the JAHEEZ user app visually first, see it on their phone, and worry about the database later.

---

## What "Frontend Only" Means

The **frontend** is everything you see and touch on the screen — the buttons, screens, colors, animations, maps, and flows. It is the visual layer.

The **backend** is the invisible part — the database, the moderation system, the driver matching. It runs on a server.

**The plan**: Build the entire visual app first. Use fake/placeholder data where real data would come from the backend. Test everything on your phone. When the visuals are 100% right, connect the backend.

This is the correct order for a non-technical person because:
- You can see results immediately on your phone
- You don't need to set up Supabase yet
- You can focus on "does this look and feel right?" before worrying about "does the data work?"
- It's faster to get to a working demo

---

## Part 1: What You Are Installing and Why

Think of building an app like baking a cake. You need specific ingredients in the right amounts. These packages are your ingredients.

### The Main Ingredients Explained (No Jargon)

| Package | What it does | Why JAHEEZ needs it |
|---------|-------------|---------------------|
| **Expo** | The oven that bakes your app for iOS and Android | Makes one codebase work on all phones |
| **React Native** | The batter — the base of everything | Turns your code into a real mobile app |
| **Expo Router** | The table of contents — which screen shows when | Handles navigation between all screens |
| **NativeWind** | The decorator — styles your screens with classes | Makes styling fast using Tailwind CSS |
| **Zustand** | A sticky note — remembers things between screens | Keeps user logged in, remembers cart |
| **React Query** | A smart courier — fetches and caches data | Gets orders from the server efficiently |
| **react-native-reanimated** | The animator — smooth movements and transitions | Makes buttons bounce, sheets slide up |
| **react-native-gesture-handler** | Understands swipes and drags | Needed for BottomSheet and swipe dismissal |
| **react-native-maps** | Shows Google Maps inside the app | The tracking screen with driver movement |
| **expo-location** | Finds the user's GPS position | Pickup/dropoff location detection |
| **expo-font** | Loads your custom fonts | DM Sans and JetBrains Mono |
| **expo-image** | Displays photos efficiently | Driver photos, avatars |
| **@expo/vector-icons** | Icon library (arrows, hearts, maps) | All icons throughout the app |
| **date-fns** | Handles dates and times | "Ordered 2 hours ago", timestamps |

---

## Part 2: Setting Up Your Computer (One Time Only)

### Step 1: Install Node.js

Node.js is the engine that runs everything. You need it before anything else.

1. Go to **nodejs.org**
2. Click the big green button that says "LTS" (Long Term Support)
3. Download and install it like any normal program
4. To verify: open Terminal (Mac) or Command Prompt (Windows) and type:
   ```
   node --version
   ```
   You should see something like `v20.11.0` — any v18 or higher is fine.

### Step 2: Install VS Code (Your Editor)

This is where you will work every day.

1. Go to **code.visualstudio.com**
2. Download for your operating system
3. Install it

### Step 3: Install Expo Go on Your Phone

This is the app that lets you see JAHEEZ on your real phone instantly.

- **iPhone**: Open App Store → Search "Expo Go" → Install
- **Android**: Open Play Store → Search "Expo Go" → Install

That's it. You don't need a cable. You don't need to submit anything to the App Store. Expo Go is your live preview.

### Step 4: Verify Git is Installed

Git saves your work so you can go back if something breaks.

Open Terminal and type:
```
git --version
```
If you see a version number, you're good. If not, download from **git-scm.com**.

---

## Part 3: Creating the Project

### Step 1: Create the Project Folder

Open Terminal. Type these commands one at a time, pressing Enter after each:

```bash
# Go to your Desktop (or wherever you want the project)
cd Desktop

# Create the project folder
mkdir jaheez
cd jaheez

# Create the user-app inside it
npx create-expo-app user-app --template blank-typescript
```

When it asks questions, press Enter to accept defaults. This takes 2-3 minutes.

### Step 2: Go Into the App Folder

```bash
cd user-app
```

You'll stay in this folder for most of the work.

### Step 3: Test That Everything Works

```bash
npx expo start
```

A QR code will appear in the terminal. Open Expo Go on your phone and scan it. You should see a blank white screen that says "Open up App.tsx..." — that's success! Your phone is connected to your computer.

Press `Ctrl + C` in the terminal to stop it.

---

## Part 4: Installing All Packages

Now install everything JAHEEZ needs. Copy and paste each block into your terminal exactly as written. Wait for each one to finish before running the next.

### Block 1: Expo Router (Navigation)

```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar
```

Then update your `package.json`. Open the file in VS Code, find the `"main"` line, and change it to:
```json
"main": "expo-router/entry"
```

Also add to `app.json` inside the `"expo"` section:
```json
"scheme": "jaheez"
```

### Block 2: NativeWind (Styling)

```bash
npm install nativewind@^4.0.0
npm install --save-dev tailwindcss@3.3.2
npx tailwindcss init
```

**Now you need to configure 3 files:**

**Create/replace `tailwind.config.js`** with:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
```

**Replace `babel.config.js`** with:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
```

**Create `metro.config.js`** in the root of user-app:
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

**Create `global.css`** in the root of user-app:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Create `nativewind-env.d.ts`** in the root of user-app:
```typescript
/// <reference types="nativewind/types" />
```

### Block 3: Animation and Gestures

```bash
npx expo install react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens
```

### Block 4: State Management

```bash
npm install zustand @tanstack/react-query
```

### Block 5: Fonts

```bash
npx expo install expo-font @expo-google-fonts/dm-sans
```

For JetBrains Mono:
1. Go to **fonts.google.com/specimen/JetBrains+Mono**
2. Click "Download family"
3. Unzip it
4. Create folder: `user-app/assets/fonts/`
5. Copy these 2 files into that folder:
   - `JetBrainsMono-Regular.ttf`
   - `JetBrainsMono-Bold.ttf`

### Block 6: Maps and Location

```bash
npx expo install react-native-maps expo-location
```

Add to `app.json` inside the `"expo"` section:
```json
"plugins": [
  [
    "expo-location",
    {
      "locationAlwaysAndWhenInUsePermission": "JAHEEZ needs your location to find nearby drivers."
    }
  ]
]
```

### Block 7: Images and Icons

```bash
npx expo install expo-image expo-image-picker
npm install @expo/vector-icons
```

### Block 8: Supabase (Install now, connect later)

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

### Block 9: Utilities

```bash
npm install date-fns i18next react-i18next
```

### Block 10: Create the Environment File

Create a file called `.env` inside `user-app/` with this content:
```
EXPO_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=placeholder_key_replace_later
EXPO_PUBLIC_GOOGLE_MAPS_KEY=placeholder_maps_key_replace_later
```

These are fake values for now. You'll replace them when you connect the backend later.

Create `.gitignore` (if it doesn't exist) and add:
```
.env
node_modules/
```

### Verify Installation

Run this to make sure nothing is broken:
```bash
npx expo start --clear
```

If a QR code appears and your phone can scan it — everything is installed correctly.

---

## Part 5: Creating the Folder Structure

Before the AI builds any files, create these folders manually. In Terminal:

```bash
# From inside user-app/
mkdir -p app/(auth)
mkdir -p app/(tabs)
mkdir -p "app/(flows)/tracking"
mkdir -p "app/(flows)/chat"
mkdir -p "app/(flows)/store"
mkdir -p store
mkdir -p hooks
mkdir -p constants
mkdir -p lib
mkdir -p assets/fonts
mkdir -p assets/images
```

Also create the shared folder one level up (in jaheez/):
```bash
cd ..
mkdir shared
cd user-app
```

---

## Part 6: Seeing the App on Your Phone

Once the AI has built some screens (even just one or two), you can see them immediately.

### How It Works

1. Open Terminal, go to user-app folder
2. Run: `npx expo start`
3. A QR code appears
4. Your phone and computer must be on the **same Wi-Fi**
5. **iPhone**: Open Camera → point at QR code → tap the banner
6. **Android**: Open Expo Go → tap "Scan QR code" → scan

### Seeing Changes Live

When you (or the AI) saves any file, your phone updates automatically within 1-2 seconds. No need to restart. This is called "hot reload."

### If the QR Code Doesn't Work

Try tunnel mode (works even on different networks):
```bash
npx expo start --tunnel
```

### Understanding Error Screens

If the app shows a red screen with text, that's an error. Don't panic.

1. Read the first line of the error — it usually says what's wrong
2. Copy the full error text
3. Tell the AI: "I got this error: [paste error]. Fix it."

### What You Should See at Each Stage

| After building... | What appears on phone |
|---|----|
| Root layout only | Blank screen, no crash |
| Splash screen | JAHEEZ logo on yellow background |
| Onboarding | 3 slides with dots |
| Login screen | Phone + password form with red button |
| Home screen | Categories, request button, recent orders |
| Tracking screen | Map with colored markers |
| Chat screen | Message bubbles |

---

## Part 7: The Build Order Summary

Follow this sequence. Don't skip steps.

```
Day 1:  Install everything (this guide)
Day 2:  Foundation — Prompt A (types), B (constants), C (brand tokens), D (animations), E (strings)
Day 3:  Infrastructure — Prompt F (Supabase stub), G (API stubs)
Day 4:  Core components — Prompts H (Button), I (Input), J (Card/Badge/StatusBadge/Avatar)
Day 5:  More components — Prompt K (Loader/EmptyState/BottomSheet/Shimmer), L (OrderCard/MapMarker/Animation)
Day 6:  Auth screens — Prompts M (layout+splash), N (onboarding), O (login+register), P (OTP)
Day 7:  Tab screens — Prompts Q (layout+home), R (search+orders+chat+profile)
Day 8:  Request flow — Prompts S/T (root layout + hooks foundation)
Day 9:  Request flow — Prompts U (custom-request), V (confirmation)
Day 10: Tracking + Chat — Prompts W (tracking), X (chat)
Day 11: Final — Prompts Y (root layout), Z (stub screens)
Day 12: Review and polish — run the final verification prompt
```

---

## Part 8: Tips for Non-Technical Builders

**You don't need to understand the code.** You need to understand what you want the app to look like and feel like. The AI writes the code.

**Your most important skill** is describing what you see in your head clearly enough for the AI to build it.

**When something looks wrong**: Don't try to fix the code yourself. Describe what's wrong in plain English to the AI. "The button is gray but it should be red" is a perfectly good bug report.

**When something crashes**: Copy the entire red error text and paste it to the AI. Don't try to interpret it yourself.

**Test every screen immediately** after the AI builds it. Don't build 5 screens and then test. Build one, test it, fix it if broken, then move to the next.

**Save often**: After every screen that works, type this in the terminal:
```bash
git add .
git commit -m "built [screen name] screen"
```
This creates a save point you can return to.

---

*Now move to FRONTEND_PROMPTS_STITCH.md to start building.*
