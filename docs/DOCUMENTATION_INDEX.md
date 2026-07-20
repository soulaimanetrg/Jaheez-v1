# JAHEEZ DOCUMENTATION INDEX

> Generated: 2026-05-19 | Complete documentation system from workspace inspection

---

## 📋 Documentation Files

All files are in `docs/` — read them in this order.

Security rule: [JAHEEZ_STRICT_AI_SECURITY_RULES.md](JAHEEZ_STRICT_AI_SECURITY_RULES.md) is the first file to read before modifying code. It supersedes older docs when there is any conflict.

| # | File | Purpose | Lines |
|---|------|---------|-------|
| 0 | [JAHEEZ_STRICT_AI_SECURITY_RULES.md](JAHEEZ_STRICT_AI_SECURITY_RULES.md) | Mandatory backend-only MVC/security rulebook for every AI/developer | ~180 |
| 1 | [PROJECT_MASTER_OVERVIEW.md](PROJECT_MASTER_OVERVIEW.md) | What is JAHEEZ, all apps, features, direction, limitations | ~180 |
| 2 | [PROJECT_CURRENT_STATE.md](PROJECT_CURRENT_STATE.md) | What's done, partial, missing, broken, mock, production-ready | ~220 |
| 3 | [PROJECT_STRUCTURE_MAP.md](PROJECT_STRUCTURE_MAP.md) | Complete directory tree with file purposes, cleanup plan | ~280 |
| 4 | [DATA_AND_SQL_MODEL.md](DATA_AND_SQL_MODEL.md) | All database tables, columns, relationships, schema conflicts | ~180 |
| 5 | [ORDER_STATUS_AND_STATE_MACHINE.md](ORDER_STATUS_AND_STATE_MACHINE.md) | Order lifecycle, payment, wallet, support, driver KYC state machines | ~130 |
| 6 | [SCREEN_AND_FEATURE_BLUEPRINT.md](SCREEN_AND_FEATURE_BLUEPRINT.md) | Every screen's status, purpose, entry/exit, data needs | ~160 |
| 7 | [BUTTON_ACTION_MAP.md](BUTTON_ACTION_MAP.md) | Every button's behavior, navigation, and API calls | ~100 |
| 8 | [FORM_AND_VALIDATION_SPEC.md](FORM_AND_VALIDATION_SPEC.md) | All forms with fields, validation rules, error messages | ~130 |
| 9 | [STATE_MANAGEMENT_MAP.md](STATE_MANAGEMENT_MAP.md) | Zustand stores, React Query hooks, Realtime, data flows | ~200 |
| 10 | [API_AND_BACKEND_MAP.md](API_AND_BACKEND_MAP.md) | User API layer, admin API endpoints, external APIs, security | ~220 |
| 11 | [COMPONENT_LIBRARY_SPEC.md](COMPONENT_LIBRARY_SPEC.md) | All 26 UI components with props, design rules | ~120 |
| 12 | [DESIGN_SYSTEM_AND_ASSETS_SPEC.md](DESIGN_SYSTEM_AND_ASSETS_SPEC.md) | Brand tokens, typography, spacing, asset inventory | ~130 |
| 13 | [ANIMATION_AND_MICROINTERACTION_SPEC.md](ANIMATION_AND_MICROINTERACTION_SPEC.md) | Current animations, missing ones, accessibility | ~90 |
| 14 | [I18N_AND_LOCALIZATION_SPEC.md](I18N_AND_LOCALIZATION_SPEC.md) | Dual i18n systems, languages, ModernMT, conflicts | ~130 |
| 15 | [NAVIGATION_AND_ROUTING_MAP.md](NAVIGATION_AND_ROUTING_MAP.md) | Route groups, entry logic, flow diagrams, tab bar | ~120 |
| 16 | [ADMIN_PANEL_MAP.md](ADMIN_PANEL_MAP.md) | Pages, RBAC roles, auth flow, security | ~130 |
| 17 | [DRIVER_APP_MAP.md](DRIVER_APP_MAP.md) | Implemented screens, missing features, delivery lifecycle | ~110 |
| 18 | [CONFLICT_AND_RISK_REGISTER.md](CONFLICT_AND_RISK_REGISTER.md) | All conflicts, risks, resolution priority | ~150 |

---

## 🔴 Top 5 Issues to Resolve Before Implementation

1. **Order status enum mismatch** — Database CHECK constraint conflicts with TypeScript types
2. **Missing database tables** — `order_moderation`, `order_status_log`, `reviews` referenced but don't exist
3. **Exposed credentials** — Supabase service role key, JWT secret in `.env` files
4. **Dual i18n systems** — Two competing localization systems (`languageStore` vs `strings.ts`)
5. **Default language is French** — Should be Arabic for Moroccan market

---

## 📊 Project Health Summary

| Metric | Value |
|--------|-------|
| **User App Screens** | 33 implemented / 5-6 missing |
| **Admin Panel Pages** | 23 implemented / 0 missing |
| **Driver App Screens** | 13 implemented / 12+ missing |
| **UI Components** | 26 reusable components |
| **Zustand Stores** | 6 stores |
| **API Functions** | ~50 functions across lib files |
| **Admin API Endpoints** | ~40 endpoints |
| **Database Tables** | 19+ tables with RLS |
| **Languages** | 3 (AR, FR, EN) |
| **Test Files** | 0 |
| **CI/CD Config** | None |
| **Critical Conflicts** | 3 |
| **Medium Risks** | 6 |
| **Low Risks** | 7 |

---

## How to Use This Documentation

1. **Before coding:** Read `JAHEEZ_STRICT_AI_SECURITY_RULES` first, then `PROJECT_MASTER_OVERVIEW` + `CONFLICT_AND_RISK_REGISTER`
2. **Working on a screen:** Read `SCREEN_AND_FEATURE_BLUEPRINT` + `BUTTON_ACTION_MAP` + `FORM_AND_VALIDATION_SPEC`
3. **Working on data:** Read `DATA_AND_SQL_MODEL` + `ORDER_STATUS_AND_STATE_MACHINE`
4. **Working on state:** Read `STATE_MANAGEMENT_MAP`
5. **Working on API:** Read `API_AND_BACKEND_MAP`
6. **Working on UI:** Read `COMPONENT_LIBRARY_SPEC` + `DESIGN_SYSTEM_AND_ASSETS_SPEC`
7. **Working on admin:** Read `ADMIN_PANEL_MAP`
8. **Working on driver app:** Read `DRIVER_APP_MAP`
9. **File structure questions:** Read `PROJECT_STRUCTURE_MAP`
10. **i18n questions:** Read `I18N_AND_LOCALIZATION_SPEC`
