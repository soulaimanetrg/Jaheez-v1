# TECHNICAL AUDIT — JAHEEZ

> **Generated:** 2026-05-05 | **Method:** Package.json + config file inspection

---

## Frameworks & Libraries Detected

### User App (`user-app/`)

| Library | Version | Purpose |
|---------|---------|---------|
| expo | ~55.0.0 | Expo SDK (latest) |
| react | 19.2.0 | React core |
| react-native | 0.83.6 | React Native core |
| expo-router | * (latest) | File-based routing |
| @tanstack/react-query | ^5.39.0 | Server state management |
| zustand | ^4.5.2 | Client state management |
| @supabase/supabase-js | ^2.43.0 | Backend client |
| nativewind | ^4.0.1 | Tailwind CSS for RN |
| tailwindcss | ^3.4.0 | Tailwind CSS |
| react-native-reanimated | 4.2.1 | Animations |
| react-native-maps | ^1.20.1 | Maps |
| react-native-screens | ~4.23.0 | Native screens |
| react-native-safe-area-context | ~5.6.2 | Safe area handling |
| react-native-web | ^0.21.0 | Web support |
| expo-linear-gradient | * | Gradients |
| expo-blur | ~55.0.14 | Blur effects |
| expo-location | * | GPS location |
| expo-notifications | ~55.0.22 | Push notifications |
| expo-image-picker | * | Image picker |
| expo-secure-store | * | Secure storage |
| expo-font | * | Font loading |
| expo-splash-screen | * | Splash screen |
| @expo-google-fonts/cairo | ^0.4.2 | Cairo Arabic font |
| @expo-google-fonts/dm-sans | ^0.4.2 | DM Sans font (unused?) |
| moti | ^0.28.1 | Moti animations |
| react-hook-form | ^7.75.0 | Form management |
| @hookform/resolvers | ^5.2.2 | Form validation |
| zod | ^4.4.2 | Schema validation |
| i18next | ^26.0.4 | i18n framework |
| react-i18next | ^17.0.2 | React i18n bindings |
| react-native-url-polyfill | ^3.0.0 | URL polyfill |
| react-native-worklets | 0.7.4 | Worklets for Reanimated |
| promise | ^8.3.0 | Promise polyfill |

**DevDependencies:**
| Library | Version |
|---------|---------|
| @babel/core | ^7.20.0 |
| @types/react | ~19.2.0 |
| typescript | ~5.9.2 |

---

### Driver App (`driver-app/`)

| Library | Version | Notes |
|---------|---------|-------|
| expo | ~55.0.0 | Same SDK as user-app |
| react | 19.2.0 | Same as user-app |
| react-native | 0.83.6 | Same as user-app |
| lucide-react-native | ^1.14.0 | Icon library (different from user-app!) |
| react-native-reanimated | ^3.15.5 | ⚠️ **Different version** from user-app (4.2.1 vs ^3.15.5) |
| react-native-worklets | ^0.8.1 | ⚠️ **Different version** from user-app (0.7.4 vs ^0.8.1) |

**Note:** Driver app does NOT have: react-query, react-hook-form, zod, moti, expo-blur, i18next. It has a much smaller dependency set.

---

### Admin Panel (`admin/`)

| Library | Version | Notes |
|---------|---------|-------|
| react | ^18.3.1 | ⚠️ React 18 (user/driver apps use React 19) |
| react-dom | ^18.3.1 | React DOM |
| react-router-dom | ^6.28.0 | SPA routing |
| vite | ^5.4.0 | Build tool |
| @vitejs/plugin-react | ^4.3.0 | Vite React plugin |
| @supabase/supabase-js | ^2.45.0 | Supabase client |
| @tanstack/react-query | ^5.56.0 | Server state |
| zustand | ^4.5.0 | Client state |
| lucide-react | ^0.460.0 | Icons |
| date-fns | ^3.6.0 | Date formatting |
| tailwindcss | ^3.4.14 | Tailwind CSS |
| typescript | ^5.5.0 | TypeScript |

---

### Root Package (`package.json`)

| Library | Version | Notes |
|---------|---------|-------|
| express | ^5.2.1 | HTTP server for admin API |
| @supabase/supabase-js | ^2.105.1 | Server-side Supabase |
| stripe | ^22.1.0 | Payment processing |
| pg | ^8.20.0 | PostgreSQL client |
| bcryptjs | ^3.0.3 | Password hashing |
| jsonwebtoken | ^9.0.3 | JWT tokens |
| cors | ^2.8.6 | CORS middleware |
| dotenv | ^17.4.2 | Env var loading |
| i | ^0.3.7 | ⚠️ Accidental `npm i i` package |

---

## App Configuration

### Expo Config (`user-app/app.json`)

```json
{
  "name": "JAHEEZ",
  "slug": "jaheez-user",
  "version": "1.0.0",
  "scheme": "jaheez",
  "orientation": "portrait",
  "backgroundColor": "#FCF8FB",  // ⚠️ Doesn't match brand.ts BG (#FEFDF8)
  "primaryColor": "#AB3500",     // ⚠️ Doesn't match brand.ts RED (#F03030)
  "newArchEnabled": true,
  "experiments": { "typedRoutes": true }
}
```

**Issues:**
- `backgroundColor` and `primaryColor` don't match the `brand.ts` token values
- No splash screen image configured (only `backgroundColor`)
- No adaptive icon image paths
- No `extra` config for environment variables (would be needed for EAS builds)

---

## Routing Setup

- **User App:** Expo Router v3 with file-based routing, 3 route groups: `(auth)`, `(tabs)`, `(flows)`
- **Driver App:** Expo Router with 3 route groups: `(auth)`, `(tabs)`, `(flows)`
- **Admin:** React Router DOM v6 with component-based routes in `App.tsx`

All routing appears correctly structured. The user app has typed routes enabled.

---

## Styling Setup

### Primary: `StyleSheet.create()` (React Native)
Most screens use direct `StyleSheet.create()` with brand token imports. This is the **actual styling approach** despite NativeWind being configured.

### Secondary: NativeWind / Tailwind CSS
- `nativewind` is in dependencies
- `babel.config.js` has `nativewind/babel` plugin
- `metro.config.js` is wrapped with `withNativeWind`
- `tailwind.config.js` exists with a **completely different color palette** ("Kinetic Curator")
- `global.css` has Tailwind directives

**Conflict:** NativeWind is fully configured but the actual screens **do not use `className` props**. The tailwind config colors don't match `brand.ts`. This is a significant inconsistency — the project should pick one approach.

### Admin: Tailwind CSS
The admin panel uses Tailwind CSS properly through Vite/PostCSS.

---

## Animation / UI Setup

| Tool | Purpose | Status |
|------|---------|--------|
| `react-native-reanimated` | Layout animations, transitions | ✅ Installed, used in splash |
| `moti` | Declarative Reanimated animations | ✅ Installed, unclear usage |
| `expo-linear-gradient` | Gradient backgrounds | ✅ Used in splash, welcome |
| `expo-blur` | Blur effects | ✅ Installed, usage unclear |
| `constants/animations.ts` | Animation presets (springs, timing) | ✅ Defined but may be underused |
| `components/ui/AnimatedPressable` | Press animation | ✅ Available |
| `components/ui/FadeInView` | Fade-in wrapper | ✅ Available |
| `components/ui/ShimmerPlaceholder` | Loading shimmer | ✅ Available |

---

## Backend / API Setup

| Layer | Implementation | Notes |
|-------|---------------|-------|
| **Auth** | Supabase Auth (phone + email fallback) | Production: phone+SMS. Dev: email fallback via admin API |
| **Database** | Supabase (PostgreSQL) | Schema in `supabase_schema.sql` (11+ tables, RLS, triggers) |
| **Admin API** | Express.js (`scripts/admin-api.js`) | 146KB monolith with full CRUD for all entities |
| **SMS OTP** | Infobip API | Send + verify OTP |
| **Payments** | Stripe (test keys) | Client setup exists, no server-side charge flow |
| **Translation** | ModernMT API | AR→FR/EN dynamic translation |
| **Real-time** | Supabase Realtime | Orders, drivers, notifications, chat, wallet_transactions |
| **Storage** | Supabase Storage | Referenced but no explicit bucket setup found |
| **Edge Functions** | ❌ Not implemented | No `supabase/functions/` directory |
| **AI Moderation** | ❌ Not implemented | Referenced in docs only |

---

## Environment Variables Required

### User App (`.env`)
```
EXPO_PUBLIC_SUPABASE_URL         # Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY    # Supabase anon key
EXPO_PUBLIC_ADMIN_API_BASE       # Admin API URL (e.g., http://192.168.3.13:3001)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Stripe publishable key
EXPO_PUBLIC_MODERNMT_API_KEY     # ModernMT translation API key
```

### Root / Admin API (`.env`)
```
SUPABASE_URL                     # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY        # ⚠️ SECRET — Supabase service role key
SUPABASE_ANON_KEY                # Supabase anon key
ADMIN_JWT_SECRET                 # JWT signing secret for admin auth
PORT                             # Admin API port (3001)
DATABASE_URL                     # PostgreSQL connection string
INFOBIP_API_KEY                  # ⚠️ SECRET — Infobip SMS key
INFOBIP_BASE_URL                 # Infobip API hostname
STRIPE_SECRET_KEY                # ⚠️ SECRET — Stripe server key
```

### Admin Panel (`.env`)
```
VITE_SUPABASE_URL                # Supabase project URL
VITE_SUPABASE_ANON_KEY           # Supabase anon key
```

---

## 🚨 Security Risks

1. **Hardcoded Supabase credentials**: `supabase.ts` has hardcoded fallback URL and anon key
2. **Service role key in .env files**: `SUPABASE_SERVICE_ROLE_KEY` is in both `.env` files — this key bypasses RLS
3. **API keys committed**: Infobip, Stripe, ModernMT keys are in `.env` files in the workspace
4. **Admin JWT secret is weak**: `jaheez-admin-jwt-2024-secret` is a guessable string
5. **No .gitignore for root .env**: Root `.env` may be committed to git

---

## Likely Technical Risks

| Risk | Severity | Details |
|------|----------|---------|
| **Dependency version conflicts** | 🔴 High | user-app has `react-native-reanimated` 4.2.1, driver-app has ^3.15.5 |
| **React version split** | 🟡 Medium | Admin uses React 18, mobile apps use React 19 |
| **NativeWind unused but configured** | 🟡 Medium | Increases bundle size and build complexity for no benefit |
| **146KB monolith admin API** | 🟡 Medium | Single file is hard to maintain and debug |
| **Mock data everywhere** | 🟡 Medium | Most screens fall back to mock data — real data path untested |
| **No testing** | 🔴 High | Zero test files across entire project |
| **Exposed secrets** | 🔴 High | Service role key + API keys in workspace |
| **`i` package** | 🟢 Low | Accidental `npm i i` — harmless but should be removed |
| **Large image assets** | 🟡 Medium | 1.3-1.7MB illustrations will slow app startup |
| **Expo SDK 55 + New Architecture** | 🟡 Medium | `newArchEnabled: true` may cause issues with some packages |

---

## Likely Expo / Build / Runtime Risks

| Risk | Details |
|------|---------|
| **Metro bundler port conflicts** | Conversation history shows repeated Metro issues |
| **NativeWind + New Architecture** | NativeWind v4 + React Native new arch can be unstable |
| **react-native-maps on web** | Maps don't work on Expo web — needs conditional rendering |
| **expo-notifications on Expo Go** | Limited push notification support in Expo Go |
| **Monorepo Metro resolution** | `metro.config.js` has custom resolution for monorepo — fragile |
| **Missing android/ native config** | `user-app/android/` exists but may not be up to date with SDK 55 |
| **No EAS config** | No `eas.json` — can't build for production without it |
| **Font loading** | Uses `@expo-google-fonts/cairo` — requires network on first launch |
| **AsyncStorage size limits** | Language store caches ModernMT translations — could grow large |
