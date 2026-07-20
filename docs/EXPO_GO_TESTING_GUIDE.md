# EXPO_GO_TESTING_GUIDE.md
# JAHEEZ — How to See Your App on Your Phone (Complete Guide)

> **Who this is for**: Someone who has never tested a mobile app before and wants to see JAHEEZ running on their real phone.

---

## Part 1: How Expo Go Works (Plain English)

Imagine you're drawing on a whiteboard in one city, and someone in another city can see it update in real-time on their screen. That's basically how Expo Go works.

- Your computer is the "whiteboard" (your code)
- Your phone is the "screen" (what you see)
- The QR code is the "address" that connects them
- Every time you save a file, your phone updates automatically — no cable, no upload, no restart needed

The app is NOT installed on your phone like a normal app. It's streaming from your computer. This is intentional — it lets you see changes instantly.

---

## Part 2: Before You Start

### Things that must be true:
1. ✅ Expo Go is installed on your phone (App Store or Play Store)
2. ✅ Your phone and your computer are on the **same Wi-Fi network**
3. ✅ You are inside the `user-app` folder in your terminal
4. ✅ You have run `npm install` at least once in the user-app folder

### Check if Expo Go is installed:
- **iPhone**: Open App Store → search "Expo Go" → if it shows "OPEN" instead of "GET", it's installed ✅
- **Android**: Open Play Store → search "Expo Go" → if it shows "OPEN", it's installed ✅

---

## Part 3: Starting the App

### Step 1: Open Terminal

**Mac**: Press `Cmd + Space`, type "Terminal", press Enter
**Windows**: Press `Win + R`, type "cmd", press Enter

### Step 2: Navigate to Your App Folder

Type this and press Enter:
```bash
cd Desktop/jaheez/user-app
```

(If your project is somewhere else, adjust the path accordingly.)

### Step 3: Start Expo

Type this and press Enter:
```bash
npx expo start
```

Wait about 10-15 seconds. You'll see something like this in the terminal:

```
  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
  ██████████████████████
  ████ ▄▄▄▄▄▄▄▄ ████
  ████ ████████ ████
  ████ ▄▄▄▄▄▄▄▄ ████
  ██████████████████████
  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

  exp://192.168.1.5:8081

  › Press a │ open Android
  › Press i │ open iOS simulator
  › Press w │ open web

  › Press ? │ show all commands
```

That square pattern is your QR code.

### Step 4: Connect Your Phone

**iPhone:**
1. Open the regular Camera app (not the QR scanner — just normal camera)
2. Point it at the QR code on your computer screen
3. A yellow banner appears at the top of your phone screen — tap it
4. Expo Go opens automatically and loads the app

**Android:**
1. Open the Expo Go app
2. Tap "Scan QR code"
3. Point your camera at the QR code
4. The app loads automatically

### Step 5: Wait for It to Load

The first load takes 30-60 seconds as it downloads everything. After that, updates are instant.

---

## Part 4: What You Should See

### At Different Build Stages

| If you've built... | You should see |
|---|---|
| Nothing yet | A blank screen or "Open up App.tsx" |
| Prompt A–G only | Nothing visible — these are invisible foundation files |
| Prompt H (Button) | Need a test screen to see it — ask AI to show you a test |
| Prompt O (Splash) | The JAHEEZ logo on a yellow background |
| Prompt P (Onboarding) | 3 slides you can swipe through |
| Prompt Q (Login) | A form with phone, password, red button |
| Prompt S (Home) | Map, categories, "new request" button, bottom tabs |
| All prompts | Full app navigation |

### The Correct First Visual

After building through Prompt O (Splash), your phone should show:

```
┌─────────────────────────┐
│                         │
│                         │
│                         │
│       JAHEEZ            │  ← Red text on yellow background
│   Smart Delivery        │  ← Tagline text
│                         │
│                         │
│                         │
└─────────────────────────┘
Background: warm yellow (#F2C94C)
```

If you see this, everything is working correctly. ✅

---

## Part 5: Seeing Changes Live

When the AI generates a new file and you save it, your phone updates within 1-2 seconds automatically. You don't need to re-scan the QR code.

**How to test this:**
1. With Expo Go showing the app on your phone
2. Ask the AI to change the button color to blue (just as a test)
3. Save the file
4. Watch your phone — it should update within 2 seconds
5. Then ask the AI to change it back

---

## Part 6: Troubleshooting

### Problem: QR code appears but phone won't scan it

**Reason**: Usually a Wi-Fi mismatch (phone on mobile data, or different network)

**Fix — Option 1**: Make sure phone and computer are on the exact same Wi-Fi network name

**Fix — Option 2**: Use tunnel mode (works on any network):
```bash
# Stop the current server first (Ctrl + C), then:
npx expo start --tunnel
```
Tunnel mode is slower to start but always works.

**Fix — Option 3**: On Android, you can type the URL manually:
1. Open Expo Go
2. Tap the URL bar at the top
3. Type the `exp://` address shown in your terminal

---

### Problem: Red error screen with a lot of text

This means something in the code has an error. Don't panic.

1. Read the first line of the text — it usually says what file and what line
2. Copy everything on the red screen
3. Tell the AI: "I got this error in Expo Go: [paste the text]"

**Common red screen causes:**
- A file has a typo in an import
- A component is trying to use something that doesn't exist yet
- A font file is missing from assets/fonts/

---

### Problem: White/blank screen with no error

This usually means the app started but something prevented rendering.

**Fix:**
1. Shake your phone (or press `m` in the terminal on Mac, `m` on Windows)
2. This opens the Expo developer menu
3. Tap "Reload"
4. If still blank: check the terminal for warning messages (yellow text)

---

### Problem: "Metro Bundler" error — port 8081 in use

**Fix:**
```bash
# Kill whatever is using port 8081
npx kill-port 8081
# Then restart
npx expo start
```

---

### Problem: "Could not connect to development server"

**Fix:**
1. Make sure your terminal is still running (not closed)
2. Make sure you see the QR code in the terminal
3. If the terminal shows errors, fix those first
4. Try re-scanning the QR code

---

### Problem: Fonts not loading, text looks wrong

**Fix:**
1. Make sure font files exist in `user-app/assets/fonts/`
2. Make sure `_layout.tsx` is loading the fonts correctly
3. Clear the Expo cache: `npx expo start --clear`

---

### Problem: "Cannot find module" error

This means a file is trying to import something that doesn't exist yet.

**Fix:**
1. Check what file the error mentions
2. The AI probably tried to import a component or hook before it was built
3. Build the missing file first
4. Then reload

---

### The Nuclear Option (When Nothing Works)

If you've tried everything and nothing works:

```bash
# Stop Expo (Ctrl + C)
# Clear everything
npx expo start --clear

# If still broken:
rm -rf node_modules
npm install
npx expo start --clear
```

This reinstalls everything fresh. Takes 5-10 minutes but fixes most issues.

---

## Part 7: Testing Each Screen

Once you can see the app on your phone, here's how to test each major screen:

### Testing the Splash Screen (After Prompt O)
- Open Expo Go → app loads
- You should see the logo on yellow background for ~1.5 seconds
- Then it should navigate to onboarding

### Testing Onboarding (After Prompt P)
- Swipe left/right between slides
- Tap "التالي" (Next) button — should go to next slide
- On slide 3: "ابدأ الآن" (Start Now) should navigate to login
- "تخطى" (Skip) at top right should also go to login

### Testing Login (After Prompt Q)
- Enter a phone number (e.g., 612345678)
- Enter any password
- Tap "تسجيل الدخول"
- With placeholder Supabase: should show a mock success or error

### Testing Home (After Prompt S)
- After login: should see bottom tabs
- Map area should appear (may show empty if no Google Maps key yet)
- Category pills should be tappable
- "طلب جديد" button should navigate to custom request

### Testing Navigation
- Tap each bottom tab — should switch screens smoothly
- Tap the back arrow on any flow screen — should go back
- Try the logout button in profile — should return to splash

---

## Part 8: When to Stop Testing and Fix

**Stop and fix when:**
- The app shows a red error screen
- A screen shows a blank white area (missing component)
- A button does nothing when pressed
- Text appears in Latin script instead of Arabic
- Colors look wrong (gray instead of red, white instead of yellow background)

**Don't worry about:**
- Map not showing (normal — needs a real Maps API key)
- Supabase errors (normal in frontend-only mode with placeholder .env)
- Very first load being slow (normal — subsequent loads are fast)

---

## Part 9: Sharing a Preview (Optional)

If you want to show someone else the app without them being on your Wi-Fi:

### Option 1: Physical demo
Show them on your phone directly.

### Option 2: EAS Preview Build (for when the frontend is complete)

When the entire frontend is done, you can create a shareable APK or IPA:

```bash
# Login to Expo (create account at expo.dev if needed)
npx eas login

# Configure EAS (one time)
npx eas build:configure

# Create a preview build (APK for Android)
npx eas build --platform android --profile preview
```

This creates a downloadable APK that anyone with an Android phone can install. It takes 10-15 minutes to build and Expo emails you the download link.

**Note**: Do this ONLY after the frontend is complete and tested. Not during development.

---

## Part 10: Daily Testing Habit

Follow this routine every day you work on JAHEEZ:

**Morning (2 minutes):**
```bash
cd Desktop/jaheez/user-app
npx expo start
```
Scan QR code. Verify the app opens without errors.

**During work (after each prompt):**
Save the file → look at phone → verify it updated correctly.

**Evening (5 minutes):**
Walk through any new screens you built today:
- Does it look like the design?
- Does every button respond?
- Are the colors correct?
- Is the text in Arabic?

---

*You're not a developer. You're the creative director. Your phone is your canvas.*
*If it looks wrong, describe what's wrong in plain English to the AI. That's your job.*
