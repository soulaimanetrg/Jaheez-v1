# 12. DEPENDENCY AND TOOLING PLAN — JAHEEZ

**Purpose:** Audit dependencies, identify risks, and plan tooling | **Last Updated:** 2026-05-19

---

## Current Dependencies

### Root (Admin API)

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| express | 5.2.1 | HTTP server | ✅ Latest |
| @supabase/supabase-js | 2.105.1 | Supabase client | ✅ Latest |
| jsonwebtoken | 9.0.3 | JWT token handling | ✅ Latest |
| bcryptjs | 3.0.3 | Password hashing | ⚠️ Consider bcrypt (faster) |
| stripe | 22.1.0 | Payment processing | ✅ Latest |
| pg | 8.20.0 | PostgreSQL client | ✅ Latest |
| cors | 2.8.6 | CORS middleware | ✅ Latest |
| dotenv | 17.4.2 | Env variable loading | ✅ Latest |

### User App (Mobile)

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| expo | ~55.0.24 | Mobile framework | ✅ Current |
| react | 19.2.0 | UI framework | ✅ Latest |
| react-native | 0.83.6 | Mobile runtime | ✅ Latest for Expo 55 |
| expo-router | ~55.0.14 | Navigation | ✅ Current |
| zustand | 4.5.2 | State management | ✅ Latest |
| @tanstack/react-query | 5.39.0 | Server state | ✅ Latest |
| react-hook-form | 7.75.0 | Form handling | ✅ Latest |
| zod | 4.4.2 | Validation | ✅ Latest |
| @supabase/supabase-js | 2.43.0 | Backend | ✅ Latest |
| react-native-maps | 1.20.1 | Maps | ✅ Latest |
| react-native-reanimated | 4.2.1 | Animations | ✅ Latest |
| moti | 0.28.1 | Motion library | ✅ Latest |
| expo-linear-gradient | ~55.0.14 | Gradients | ✅ Current |
| expo-video | ~55.0.17 | Video playback | ⚠️ Optional (splash only) |
| i18next | 26.0.4 | i18n framework | ✅ Latest |
| react-i18next | 17.0.2 | React i18n | ✅ Latest |
| @expo-google-fonts/cairo | 0.4.2 | Cairo font | ✅ Installed |
| @expo/vector-icons | 15.0.3 | Icons | ✅ Latest |

### Admin Panel (Web)

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| vite | 5.0.0+ | Build tool | ✅ Latest |
| react | 18.x | UI framework | ✅ Latest |
| react-router-dom | Latest | Routing | ✅ Latest |
| tailwindcss | 3.4.0 | Styling | ✅ Latest |
| shadcn/ui | Latest | Components | ✅ Latest |
| recharts | Latest | Charts | ✅ Latest |
| lucide-react | Latest | Icons | ✅ Latest |

---

## Dependency Conflicts & Risks

| Issue | Severity | Reason | Fix |
|---|---|---|---|
| **Color system mismatch** | 🟡 Medium | tailwind.config.js uses `#AB3500`, brand.ts uses `#F03030` | Update tailwind to reference brand.ts. |
| **NativeWind Not Allowed** | 🔴 Critical | Configured in codebase but forbidden by brand guidelines | **DO NOT USE NativeWind or inline Tailwind classes.** Always write styled components using React Native `StyleSheet.create()` and brand tokens from `constants/brand.ts`. |
| **SDK version docs outdated** | 🟠 Low | AGENTS.md says SDK 51, code uses 55 | Updated docs to Expo SDK 55 / RN 0.83. |
| **expo-video optional** | 🟢 Low | Splash works without it; safe to keep | Keep as optional, code handles fallback. |
| **bcryptjs performance** | 🟡 Low | Slower than native bcrypt | Consider switching to `bcrypt` package (requires native build). |
| **@expo/ngrok** | 🟡 Low | Likely for Replit legacy | Remove if not used. |

---

## Missing Tooling

| Tool | Purpose | Reason Needed | Impact | Recommendation |
|------|---------|---------------|--------|---|
| **Jest** | Unit testing | Zero test files exist | High — regression risk | Install before production |
| **Detox** | E2E testing | No integration tests | High — feature testing | Install for critical flows |
| **ESLint** | Linting | Enforce code quality | Medium — consistency | Install if not present |
| **Prettier** | Code formatting | Maintain style | Low — QoL | Install if team wants |
| **EAS** | Build/deploy | Current setup: local only | Critical — needed for app stores | Configure eas.json |
| **GitHub Actions** | CI/CD | No automated testing | Medium — deployments | Set up workflows |

---

## Dependency Health Check

### Outdated Packages
- Run: `npm outdated` in each app directory
- Consider updating if > 2 versions behind
- Always test after major version bumps

### Security Vulnerabilities
- Run: `npm audit` in each app
- High/Critical: Fix immediately
- Medium: Fix before production
- Low: Consider if time permits

### Unused Dependencies
- Run: `npm ls` and check for unused packages
- Found: `@expo/ngrok` (Replit legacy)
- Remove: `@expo/ngrok` if confirmed unused

---

## Build & Deployment Tools

### Expo Application Services (EAS)

**Status:** Not configured  
**Required for:** App Store / Play Store submission

**Setup steps:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login with Expo account
eas login

# Initialize EAS in user-app directory
eas build:configure

# Create eas.json with build profiles
```

**eas.json template:**
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "ios": { "buildType": "simulator" }
    },
    "production": {
      "android": { "buildType": "aab" },
      "ios": { "buildType": "archive" }
    }
  },
  "submit": {
    "production": {
      "android": { "serviceAccount": "path/to/service-account.json" },
      "ios": { "appleId": "your@email.com" }
    }
  }
}
```

### Production Environment

**Required for user-app:**
- .env.production with Supabase URLs
- No hardcoded secrets
- API keys from Expo secrets (not .env files)

**Required for admin:**
- .env.production with API endpoint
- Auth endpoint for admin login

---

## Package Manager Recommendations

| Tool | Current | Recommendation |
|------|---------|---|
| npm | 9+ | ✅ Fine, continue using |
| yarn | Not used | Consider if team prefers |
| pnpm | Not used | Consider for monorepo efficiency |
| bun | Not used | Emerging; not recommended yet for React Native |

---

## Tooling Installation Checklist

### Pre-Development
- [ ] Node.js 18+ installed
- [ ] npm 9+ or yarn
- [ ] Expo CLI: `npm install -g expo-cli`
- [ ] EAS CLI: `npm install -g eas-cli`
- [ ] Xcode (for iOS, Mac only)
- [ ] Android Studio (for Android emulator)

### Development
- [ ] VS Code extensions: ES Lint, Prettier, React Native Tools
- [ ] Expo Go app on physical phone

### Testing
- [ ] Jest: `npm install --save-dev jest`
- [ ] Detox: `npm install --save-dev detox-cli detox`

### Production
- [ ] GitHub Actions for CI/CD
- [ ] EAS for builds and submissions
- [ ] Sentry or similar for error reporting

---

## Version Locking Strategy

**Current approach:** package-lock.json (recommended)  
**Alternative:** Use exact versions in package.json for critical deps

**Recommendation:** Keep lock files in git, use `npm ci` for deployments (not `npm install`)

---

## Future Dependency Considerations

| Potential | Purpose | Recommendation |
|-----------|---------|---|
| **Sentry** | Error tracking | Add before production |
| **LogRocket** | Session replay | Nice-to-have for debugging |
| **OneSignal** | Push notifications | Alternative to FCM/APNs |
| **Firebase** | Analytics | Nice-to-have for metrics |
| **Amplitude** | Event tracking | Alternative for analytics |
| **aws-sdk** | AWS services | Only if storing media on AWS S3 |

---

**Created:** 2026-05-19 | **Method:** package.json inspection + dependency analysis | **Confidence:** High
