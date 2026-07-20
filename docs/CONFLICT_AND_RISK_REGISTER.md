# CONFLICT AND RISK REGISTER

> Generated: 2026-05-19 | Source: Full workspace audit — conflicts, contradictions, risks

---

## 🔴 Critical Conflicts

### 1. Order Status Enum Mismatch
| Source | Values |
|--------|--------|
| **Database** (`supabase_schema.sql`) | `pending`, `confirmed`, `preparing`, `picked_up`, `delivered`, `completed`, `cancelled` |
| **TypeScript** (`shared/types.ts`) | `pending_moderation`, `pending_driver`, `driver_assigned`, `in_progress`, `picked_up`, `delivered`, `completed`, `cancelled`, `disputed`, `moderation_rejected` |
| **Admin API** (`admin-api.js`) | Uses database values |
| **User App API** (`lib/api.ts`) | Uses TypeScript values (e.g., creates with `pending_driver`) |
| **Impact** | Creating an order with `status='pending_driver'` would **fail the database CHECK constraint**. The user app and database are incompatible. |
| **Resolution** | Either update database schema to match TypeScript types, or update TypeScript types to match database. Given the moderation flow design, the TypeScript version appears to be the intended target. |

### 2. Missing Database Tables Referenced in Code
| Table | Referenced In | Exists in Schema? |
|-------|--------------|-------------------|
| `order_moderation` | `api.ts` line 40 (join query) | ❌ No |
| `order_status_log` | `api.ts` line 101 (insert) | ❌ No |
| `reviews` | `api.ts` line 184-192 | ❌ Only `store_reviews` exists |
| **Impact** | Any code path that touches these tables will throw a Supabase error |

### 3. Exposed Credentials in .env
| Credential | File | Risk |
|-----------|------|------|
| Supabase service role key | `.env`, `user-app/.env` | 🔴 Full database access bypass RLS |
| Stripe secret key (test) | `.env` | 🟡 Test mode only, limited risk |
| Infobip API key | `.env` | 🟡 SMS charges if leaked |
| Admin JWT secret | `.env` | 🔴 Token forging if leaked |
| ModernMT API key | `user-app/.env` | 🟡 Translation charges |
| **Impact** | If repo is public or shared, all backend security is compromised |

---

## 🟡 Medium Conflicts

### 4. Dual Localization Systems
| System | File | Languages | Structure |
|--------|------|-----------|-----------|
| languageStore | `store/languageStore.ts` | AR, FR, EN | Flat |
| strings | `constants/strings.ts` | AR, FR | Nested |
| **Impact** | Screens may reference wrong system. English missing in System 2. |
| **Risk** | Inconsistent translations, maintenance burden |

### 5. Default Language is French (not Arabic)
- `languageStore.ts` line 361-363: `lang: 'fr'`, `t: FR`
- Morocco's primary language is Arabic
- First-time users see French UI before they can change language
- **Risk:** Poor first impression for Arabic-speaking majority

### 6. NativeWind Configured But Not Used
| File | Purpose | Status |
|------|---------|--------|
| `tailwind.config.js` | Tailwind config | Exists but unused |
| `nativewind-env.d.ts` | NativeWind types | Exists but unused |
| `global.css` | CSS entry | 62 bytes (almost empty) |
| `babel.config.js` | NativeWind plugin | Configured |
| **Impact** | Adds build complexity, potential Metro conflicts, unused dependency weight |
| **Risk** | Build warnings, confusion for new developers |

### 7. Local PostgreSQL Unreachable
- `DATABASE_URL` in `.env`: `postgresql://postgres:password@localhost/heliumdb`
- Hostname `heliumdb` is not a valid hostname (past conversation confirmed ENOTFOUND error)
- Admin-only features (promotions, audit logs, admin accounts) are disabled when unreachable
- **Impact** | Admin panel partially broken
- **Workaround** | Change to `localhost` or migrate to Supabase

### 8. Oversized Assets
| Asset | Size | Acceptable |
|-------|------|-----------|
| `bag_hero.png` | 1.7MB | ❌ Max 200KB |
| `scooter.png` | 1.3MB | ❌ |
| `scooter2.png` | 1.7MB | ❌ |
| `support.png` | 1.6MB | ❌ |
| `splash_first.png` | 1.2MB | ❌ |
| Tab icons (each) | 300-400KB | ❌ Should be <10KB |
| **Impact** | Slow app startup, excessive memory usage, poor UX on slow connections |

### 9. Video Format Compatibility
- `splash_video.webm` — WebM format
- iOS does not natively support WebM playback
- Past conversation attempted .mp4 migration but unclear if completed
- **Impact** | Splash video may not play on iOS devices

---

## 🟢 Low Risks

### 10. Mock Admin Login Active
- `admin@jaheez.ma` / `admin123` hardcoded in `admin-api.js` line 362
- Bypasses all real authentication
- **Must remove before production**

### 11. CORS Wide Open
- `admin-api.js` line 93: `cors({ origin: true })`
- Any website can make authenticated requests to admin API
- **Must restrict to admin panel domain**

### 12. Root `server.js` — Unknown Purpose
- 1.3KB file at project root
- May be legacy from Replit deployment
- **Verify and remove if unused**

### 13. Duplicate Schema Files
- `supabase_schema.sql` (root, 43.5KB) — appears current
- `docs/supabase_schema.sql` (32.3KB) — appears older
- **Risk:** Developer may reference wrong one

### 14. No Test Coverage
- Zero test files found across entire monorepo
- No Jest/Vitest/Detox configuration
- **Risk:** Any change can break functionality without detection

### 15. No CI/CD Pipeline
- No GitHub Actions, GitLab CI, or other CI config found
- No `eas.json` for Expo builds
- **Risk:** No automated quality gates

### 16. Admin Panel Template Still Present
- `jaheez-admin-template/` (24.5MB) still in workspace
- Source template from which `admin/` was created
- **Risk:** Confusion, wasted disk space

---

## Conflict Priority Matrix

| Priority | Count | Items |
|----------|-------|-------|
| 🔴 Critical (blocks functionality) | 3 | Order status mismatch, missing tables, exposed credentials |
| 🟡 Medium (degraded experience) | 6 | Dual i18n, wrong default lang, NativeWind unused, local PG unreachable, oversized assets, WebM format |
| 🟢 Low (technical debt) | 7 | Mock login, CORS, server.js, duplicate schema, no tests, no CI/CD, template artifacts |

---

## Resolution Order (Recommended)

1. **Immediately:** Rotate exposed credentials (Supabase service role key, JWT secret)
2. **Before any coding:** Resolve order status enum conflict (database vs TypeScript)
3. **Before any coding:** Create missing database tables (`order_moderation`, `order_status_log`, `reviews`)
4. **Phase 1:** Consolidate i18n to single system, set default language to Arabic
5. **Phase 1:** Fix `DATABASE_URL` or migrate admin-only tables to Supabase
6. **Phase 1:** Compress/optimize oversized assets
7. **Phase 2:** Remove NativeWind if not needed, or commit to using it
8. **Phase 2:** Add test infrastructure
9. **Phase 2:** Set up CI/CD pipeline
10. **Phase 3:** Remove mock login, restrict CORS, clean up legacy files
