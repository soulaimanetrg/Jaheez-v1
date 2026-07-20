# MISSING WORK — JAHEEZ

> **Generated:** 2026-05-05 | **Method:** Gap analysis against all discovered code + documentation

---

## 1. Documentation

| Item | Priority | Notes |
|------|----------|-------|
| Root README.md | 🔴 High | Currently empty — just "# Jaheez" |
| Setup guide | 🔴 High | No instructions for how to set up and run the project |
| Environment variable template | 🔴 High | Need `.env.example` files (without real secrets) |
| API documentation | 🟡 Medium | `admin-api.js` has 146KB of endpoints — no docs |
| Database schema documentation | 🟡 Medium | Schema exists but no ERD or relationship docs |
| Deployment guide | 🟡 Medium | No deployment instructions |
| Architecture decision records | 🟢 Low | Many docs exist but are potentially outdated |
| Changelog | 🟢 Low | No version history |

---

## 2. Design / Assets

| Item | Priority | Notes |
|------|----------|-------|
| App icon (iOS + Android adaptive) | 🔴 High | No configured app icon images |
| Splash screen image | 🔴 High | No image; only code-based splash |
| Driver app tab bar icons | 🔴 High | Driver app `assets/` is empty |
| Driver app illustrations | 🟡 Medium | No driver-specific illustrations |
| Image optimization | 🟡 Medium | Hero illustrations are 1.3-1.7MB — must compress |
| SVG icon system | 🟡 Medium | All icons are large PNGs — SVGs would be better |
| Loading/empty state illustrations | 🟡 Medium | Generic EmptyState component but no custom illustrations |
| Error state illustrations | 🟡 Medium | No visual error states |
| Onboarding slide images | 🟡 Medium | Onboarding exists but likely text/emoji only |
| App store screenshots | 🟢 Low | Needed before publishing |
| Admin panel favicon | 🟢 Low | No favicon configured |
| Custom map markers | 🟢 Low | MapMarker component exists but may use defaults |

---

## 3. Frontend / Screens

| Item | Priority | Notes |
|------|----------|-------|
| Wallet tab screen | 🔴 High | Only a redirect stub (6 lines) |
| Forgot password screen | 🔴 High | Referenced in strings but no file |
| Review/rating submission | 🟡 Medium | No screen for users to leave reviews |
| AI suggestion screen | 🟡 Medium | Referenced in folder structure docs but no file |
| Store filter/sort | 🟡 Medium | Search exists but filtering may be incomplete |
| Order re-order flow | 🟡 Medium | "Reorder" button exists in strings but unclear if functional |
| Promo/deal detail screen | 🟡 Medium | Promo banners shown but no detail view |
| Address map picker | 🟡 Medium | Address management exists but may lack map selection |
| Image viewer (chat/product) | 🟢 Low | Chat can send images but no full-screen viewer |
| Language selection screen | 🟢 Low | Language toggle exists in settings but no dedicated picker |
| Referral/invite screen | 🟢 Low | Not in current scope but common for platforms |

---

## 4. Components

| Item | Priority | Notes |
|------|----------|-------|
| StoreCard component | 🟡 Medium | Store listings likely use inline rendering |
| MenuItemCard component | 🟡 Medium | Menu items likely rendered inline in store detail |
| ReviewCard component | 🟡 Medium | Reviews page exists in admin but no user-facing review card |
| SearchBar component | 🟡 Medium | Search screen has inline search bar |
| PromoCard/Banner component | 🟡 Medium | Promo banners likely inline |
| AddressCard component | 🟢 Low | Address list may use inline rendering |
| DriverInfoCard component | 🟢 Low | Tracking screen likely renders driver info inline |
| CategoryCard component | 🟢 Low | Category grid likely inline |

---

## 5. State Management

| Item | Priority | Notes |
|------|----------|-------|
| Order store expansion | 🟡 Medium | `orderStore.ts` is minimal (581 bytes) |
| Location store expansion | 🟡 Medium | `locationStore.ts` is minimal (474 bytes) |
| Notification store | 🟡 Medium | No dedicated notification state store |
| Search/filter store | 🟢 Low | Search state may be component-local |
| Favorites store | 🟢 Low | Favorites may be managed via React Query only |

---

## 6. Backend / API / Data

| Item | Priority | Notes |
|------|----------|-------|
| Supabase Edge Functions | 🔴 High | No `supabase/functions/` directory — AI moderation, driver matching, notifications need this |
| AI content moderation | 🔴 High | Core differentiator mentioned in every doc — not implemented |
| Push notification server-side | 🔴 High | Client setup exists but no server-side send via Expo push API |
| Stripe payment intent flow | 🟡 Medium | Client setup exists but no server-side charge creation |
| Google Maps API key | 🟡 Medium | `react-native-maps` installed but no API key configured |
| Driver location updates | 🟡 Medium | Schema supports it but no real-time location broadcasting |
| Order assignment algorithm | 🟡 Medium | No driver matching logic found |
| Image upload (Supabase Storage) | 🟡 Medium | Referenced in code but no explicit storage bucket setup |
| Rate limiting | 🟡 Medium | No rate limiting on admin API endpoints |
| Email templates | 🟢 Low | Supabase email templates not configured |
| Webhook handlers | 🟢 Low | Stripe webhooks, Supabase webhooks not set up |
| Database indexes | 🟢 Low | Basic indexes exist but may need optimization |

---

## 7. Testing

| Item | Priority | Notes |
|------|----------|-------|
| Unit tests | 🔴 High | ZERO test files in entire project |
| Component tests | 🔴 High | No component tests |
| API integration tests | 🟡 Medium | No API test files |
| E2E tests | 🟡 Medium | No Detox/Maestro setup |
| Zod schema tests | 🟢 Low | Schemas exist but untested |

---

## 8. Deployment

| Item | Priority | Notes |
|------|----------|-------|
| EAS build configuration | 🔴 High | No `eas.json` — required for production builds |
| CI/CD pipeline | 🟡 Medium | No GitHub Actions or similar |
| Environment variable management | 🟡 Medium | Secrets are hardcoded in `.env` files |
| Admin API deployment | 🟡 Medium | Express API has no deployment config (Docker, PM2, etc.) |
| Admin panel hosting | 🟡 Medium | Vite build exists but no hosting configured |
| Database migration management | 🟡 Medium | `supabase_migrations/` has only 1 file; main schema is a single dump |
| SSL / domain setup | 🟢 Low | No custom domain configuration |
| Monitoring / error tracking | 🟢 Low | No Sentry, LogRocket, or similar |

---

## 9. Cleanup / Polish

| Item | Priority | Notes |
|------|----------|-------|
| Resolve color system conflict | 🔴 High | 4 different primary colors across config files |
| Remove or fix NativeWind | 🔴 High | Either use it consistently or remove it |
| Remove abandoned directories | 🟡 Medium | `expo-new/`, `jaheez-temp/`, old HTML mockups |
| Consolidate documentation | 🟡 Medium | 23 docs files + 7 root markdown files — many overlap/conflict |
| Remove exposed secrets | 🔴 High | Rotate and remove all API keys from committed files |
| Fix driver-app dependency versions | 🟡 Medium | Reanimated/worklets versions mismatch user-app |
| Remove `i` package from root | 🟢 Low | Accidental dependency |
| Optimize image assets | 🟡 Medium | Compress hero illustrations from 1.7MB to <200KB |
| Add proper .gitignore | 🟡 Medium | Ensure .env files are excluded |
| Remove `html-preview/` and `server.js` | 🟢 Low | Legacy prototype — no longer needed |
| Fix `app.json` colors to match brand.ts | 🟡 Medium | Background and primary colors are wrong |
| Add proper accessibility labels | 🟡 Medium | Partially done but inconsistent |
