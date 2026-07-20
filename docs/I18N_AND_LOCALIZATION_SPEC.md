# i18n AND LOCALIZATION SPEC

> Generated: 2026-05-19 | Source: `languageStore.ts`, `strings.ts`, `infobipOtp.ts`, `modernmt.ts`

---

## ⚠️ CRITICAL: Two Competing i18n Systems

### System 1: `languageStore.ts` (Flat Object + ModernMT)
- **Type:** Flat `Translations` interface with ~160 keys
- **Languages:** Arabic (AR), French (FR), English (EN) — all hardcoded
- **Live Translation:** ModernMT API for French/English (Arabic is source of truth)
- **Caching:** AsyncStorage per-language cache of ModernMT overrides
- **Access:** `useLangStore(s => s.t.keyName)` — e.g., `t.home`, `t.login`
- **Default:** French (FR) — `lang: 'fr'` is initial state
- **Persist:** Only `lang` code persisted; translations rebuilt on app start
- **Used in:** Most tab and flow screens

### System 2: `strings.ts` (Nested Object)
- **Type:** Deeply nested `STRINGS.ar.nav.home`, `STRINGS.fr.auth.login`
- **Languages:** Arabic (AR), French (FR) only — **no English**
- **Live Translation:** None (static)
- **Access:** `STRINGS[lang].section.key`
- **Used in:** Some screens (unclear which)

### Conflict Analysis
| Aspect | System 1 | System 2 |
|--------|----------|----------|
| Structure | Flat (`t.home`) | Nested (`STRINGS.ar.nav.home`) |
| Languages | AR, FR, EN | AR, FR only |
| Source of truth | Arabic hardcoded | Arabic hardcoded |
| Translation | ModernMT live + cache | Static |
| English | ✅ Supported | ❌ Missing |
| Keys | ~160 | ~120 (fewer) |
| Overlap | Many keys overlap | Subset of System 1 |

**Recommendation:** Consolidate to System 1 (languageStore). System 2 should be deprecated and its unique keys migrated.

---

## Supported Languages

| Language | Code | Direction | Coverage | Status |
|----------|------|-----------|----------|--------|
| Arabic (العربية) | `ar` | RTL | 100% | ✅ Primary |
| French (Français) | `fr` | LTR | 100% hardcoded + ModernMT enhanced | ✅ Secondary |
| English | `en` | LTR | 100% hardcoded + ModernMT enhanced | ✅ Tertiary |

### RTL Handling
- `isRTL` derived from `lang === 'ar'` in languageStore
- `I18nManager.forceRTL(isRTL)` called in `_layout.tsx`
- Text alignment auto-flips
- **⚠️ Full restart may be required** for RTL layout changes to take effect (RN limitation)

---

## Translation Key Categories (System 1)

| Category | Count | Examples |
|----------|-------|---------|
| Navigation | 5 | home, orders, search, account, newOrder |
| Common | 17 | add, cancel, confirm, save, edit, delete, loading, error, free, retry |
| Auth | 19 | login, register, phone, password, forgotPassword, demoLogin, welcomeTitle |
| Home | 14 | hello, services, nearYou, promoTitle, food, grocery, pharmacy, noStores |
| Search | 13 | searchPlaceholder, recentSearches, trending, noResults, restaurants |
| Orders | 23 | myOrders, activeOrder, orderStatus_*, reorder, trackDriver, eta |
| Profile | 2 | favorites, paymentMethods |
| Settings | 32 | settings, notifications, pushNotifications, language, deleteAccount, logoutConfirmMsg |

---

## ModernMT Integration (`lib/modernmt.ts`)
- **API:** `https://api.modernmt.com/translate`
- **Key:** `EXPO_PUBLIC_MODERNMT_KEY` in `.env`
- **Source Language:** Arabic (`ar`)
- **Target Languages:** French (`fr`), English (`en`)
- **Flow:**
  1. User changes language to FR or EN
  2. Hardcoded translations applied immediately
  3. Cached ModernMT overrides checked in AsyncStorage
  4. If no cache: batch API call to translate all AR strings
  5. Results merged with hardcoded, persisted to cache
  6. Next session loads from cache (no API call)
- **Fallback:** If ModernMT fails, hardcoded translations remain

---

## SMS / OTP Language (`lib/infobipOtp.ts`)
- SMS messages sent via Infobip
- Language of SMS: Arabic (hardcoded in message template)
- OTP format: 4-6 digit numeric code

---

## Date/Time Formatting
- **No dedicated formatting library detected** (no `dayjs`, `date-fns`, or `moment`)
- Dates likely formatted with `Date.toLocaleDateString()` or manual formatting
- **Recommendation:** Add `date-fns` with Arabic locale for consistent date formatting

---

## Currency Formatting
- Internal storage: centimes (integer)
- Display: MAD (Moroccan Dirham)
- Format: `(amount / 100).toFixed(2) + ' MAD'`
- **No dedicated currency formatter detected**

---

## ⚠️ Known i18n Issues

1. **Default language is French**, not Arabic — despite targeting Moroccan Arabic speakers
2. **Two systems coexist** — some screens may break if they reference the wrong system
3. **No English in System 2** (`strings.ts`) — if any screen uses it, English users see French keys
4. **Emoji in translation keys** — `trending: 'الأكثر طلبًا اليوم 🔥'` — emoji may cause issues with some translation APIs
5. **No pluralization support** — Arabic has complex plural rules (singular, dual, few, many)
6. **No number formatting** — Arabic uses Eastern Arabic numerals (٠١٢٣) in some contexts
7. **Hardcoded Arabic in admin API** — error messages in `admin-api.js` are mixed Arabic/French
8. **ModernMT cost** — Every new language switch without cache triggers a batch API call
