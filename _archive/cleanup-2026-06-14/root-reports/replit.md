# JAHEEZ — Smart Delivery & Errand Platform

## Overview

JAHEEZ is a multi-service delivery platform primarily for Safi, Morocco. It aims to connect users with verified local drivers for food delivery, grocery shopping, pharmacy runs, and custom errands. The platform is designed to be mobile-first with a comprehensive admin panel for management.

## User Preferences

- **Primary UI Language:** French across all applications (user app, admin panel, driver app).
- **Admin Panel UI:** 100% French, including all labels, headings, buttons, table headers, status labels, error messages, and date/currency formatting (`fr-MA` locale, MAD currency). No `dir="rtl"` on page or modal wrappers.
- **User App Default Language:** French is the default (`languageStore.ts`: `defaultLang: 'fr'`, `isRTL: false`). Arabic and English are supported as secondary options.
- **Content Field Input:** Arabic language input is retained for fields like product names, store names, banner titles, and zone names, with `dir="rtl"` applied only to individual Arabic input fields.
- **Currency Format:** `toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })`.
- **Date Locale:** `import { fr } from 'date-fns/locale'`, `locale: fr` used consistently.
- **Iterative Development:** The project is structured in three phases: User App (Phase A), Admin Panel (Phase B), and Driver App (Phase C).

## System Architecture

The JAHEEZ platform consists of three main applications:

- **User App (Phase A):** A mobile application built with Expo / React Native.
    - **UI/UX:** Utilizes a "Light Warm Theme (v2)" with a specific color palette (`BRAND.BG`, `BRAND.SURFACE`, `BRAND.RED`, `BRAND.YELLOW`, etc.), Cairo fonts (`Cairo-Bold`, `Cairo-SemiBold`, `Cairo-Regular`), and defined shadow styles (`SHADOW`, `SHADOW_SM`, `SHADOW_LG`, `SHADOW_RED`).
    - **Design Patterns:** Major screens feature a red gradient hero (`LinearGradient colors={['#F03030', '#C42020', '#9A0000']}`).
    - **Technical Implementation:**
        - **Framework:** Expo 55 / React Native 0.83.6 (TypeScript).
        - **State Management:** Zustand (for `authStore`, `cartStore`) and TanStack Query.
        - **Navigation:** Expo Router v3 (file-based).
        - **Forms:** `react-hook-form` with `zod` and `@hookform/resolvers` for validation.
        - **Animations:** `moti` and `react-native-reanimated` for UI animations.
        - **Language Support:** RTL Arabic is implemented with `textAlign: 'right'` / `flexDirection: 'row-reverse'` on relevant screens.
        - **Key Features:** User authentication (welcome, onboarding, login, register, OTP), tab-based navigation (Home, Orders, Search, Chat, Wallet, Profile), various flows (Cart, Checkout, Store Detail, Order Tracking, Custom Request, Notifications, Order Detail, Profile Edit, Chat, Addresses, Favorites, Settings, Terms/Privacy, Category Browse, Payment Methods, FAQ).
        - **No AI/ML features (spec compliance):** Per JAHEEZ spec, the platform contains no AI moderation, scoring, or recommendation features. The previous `app/(flows)/ai-suggestion.tsx` screen and home-screen "AI Assistant" entry point were removed on 2026-05-03. User help is served via the static `app/(flows)/faq.tsx` curated Q&A screen and the human-staffed `support-ticket.tsx` flow.
        - **ModernMT (translation only — spec compatible):** `lib/modernmt.ts` + `store/languageStore.ts` use the ModernMT API to translate hardcoded UI strings from Arabic to French/English at runtime, with results cached in AsyncStorage. ModernMT is a pure machine-translation service — it does not perform recommendation, scoring, moderation, or content generation — and is therefore allowed under the spec's "no AI/ML" rule, which targets recommendation/scoring/moderation systems. Do not flag this in future audits.
        - **Real-time:** Order tracking uses Supabase Realtime for live status updates. Offline banner is implemented.
        - **Push Notifications:** `expo-notifications` and `expo-device` are used to register and send push notifications.
        - **Account Deletion (spec 2.3.7):** 3-step self-service flow at `app/(flows)/delete-account.tsx` (reason picker → OTP re-verification of the user's phone via `/admin-api/otp/verify` returning a 5-min `otp_proof` JWT → final "I understand" checkbox). On confirm, calls `DELETE /admin-api/auth/account` with `{user_id, otp_proof, reason}`; the server verifies the OTP-proof token's phone matches the user, soft-deletes (sets `users.deleted_at`), anonymizes phone to `+212-DELETED-<idprefix>`, clears `full_name`/`email`/`push_token`, sets `is_banned`, signs the Supabase auth user out, and audits as `user_self_deleted`. Final PII purge (addresses, avatar, push token) runs after 30 days via SQL function `purge_deleted_users()` (see `supabase_migrations/012_user_soft_delete.sql`) — schedule daily via Supabase pg_cron: `SELECT cron.schedule('purge_deleted_users_daily', '0 3 * * *', $$ SELECT public.purge_deleted_users(); $$);`.
        - **Maintenance & Force-Update (spec 2.3.7):** `store/platformStore.ts` (Zustand) polls unauthenticated `GET /admin-api/app-settings/public` on splash, every 5 min, and on AppState 'active'. Returns `maintenance_mode`, FR/AR maintenance messages, `min_required_version_ios|android`, and `support_phone_e164`. `components/ui/MaintenanceBanner.tsx` (top warn-color, non-dismissible, FR/AR localized) is mounted at the root of `app/_layout.tsx`. Checkout (`app/(flows)/checkout.tsx`) blocks order submission with the localized maintenance message. `components/ui/ForceUpdateModal.tsx` (non-dismissible Modal, store URL by Platform.OS, semver compared against `Constants.expoConfig.version`) overlays everything when the running app is below the minimum version. Admin Panel `Settings` page exposes all 5 new settings keys plus a confirm dialog before flipping the maintenance toggle.

- **Admin Panel (Phase B):** A web-based dashboard for managing the platform.
    - **UI/UX:** Uses Tailwind CSS 3 with RTL support, Cairo font, and JAHEEZ brand colors.
    - **Technical Implementation:**
        - **Framework:** React 18 + Vite 5 + TypeScript.
        - **Styling:** Tailwind CSS 3.
        - **State Management:** Zustand (authStore, persisted in localStorage).
        - **API Client:** `admin/src/lib/api.ts` for typed fetch with JWT injection.
        - **Routing:** React Router v6.
        - **Authentication:** Local PostgreSQL `admins` table with bcrypt password hash and JWT (7-day expiry).
        - **Data Source:** Primarily Supabase (using `service_role` key to bypass RLS for admin changes) and a local PostgreSQL database for admin-specific data.
        - **Key Features:** Login, Dashboard (KPIs, orders), Management (Orders, Stores, Products, Users, Drivers, Support Tickets, Promotions, Notifications, Analytics, Admins, Banners, Zones, Reviews, Wallets — manual adjust + freeze/unfreeze).
        - **Wallet manual adjustment (spec 4.10):** `/admin/wallets` page lists all user wallets with search and stats. Detail drawer shows balance + last transactions. Atomic credit/debit via Postgres RPC `admin_wallet_adjust(p_user_id, p_delta, p_tx_type, p_label, p_sublabel, p_ref_id)` (defined in migrations 011.1/011.2) which locks the wallet row `FOR UPDATE`, updates balance and writes a ledger row with `type='admin_adjustment'` + `direction` (011.3), all in one transaction. Freeze/unfreeze toggles `wallets.is_frozen` (migration 011). RPC is `SECURITY DEFINER` but `EXECUTE` is revoked from `PUBLIC`/`anon`/`authenticated` and only granted to `service_role`; the function body also asserts the caller is `service_role` (defence in depth). Wallet RLS (011.4) is now read-only for end users so they cannot tamper with balance or freeze flags. Every adjustment is recorded via `auditStrict` — if the audit insert fails after the money move, the API surfaces a manual-reconciliation error and never returns a silent success. RBAC at the Express layer: `super_admin` + `admin`.

- **Driver App (Phase C):** A mobile application for drivers.
    - **Technical Implementation:**
        - **Stack:** Expo 55 + Expo Router (web) + NativeWind + Zustand.
        - **Authentication:** Phone + OTP, generating a driver JWT.
        - **Key Features:** Welcome/Login/Register/OTP, Dashboard (available/mine/history orders), Active Delivery stepper, Earnings (balance, COD, payout history), Profile (KYC docs, RIB, bank).
        - **KYC Tiers:** System for driver verification (pending, partial, full, verified, rejected).
        - **Money Split:** Driver earns 80% of the delivery fee; cash orders adjust `cod_balance_centimes`.
        - **i18n:** French primary, Arabic fallback.
        - **Admin API Endpoints:** Dedicated endpoints for driver login, profile management, document uploads, order claiming and stage updates, payout requests, and COD settlements.

- **Admin API Server (`scripts/admin-api.js`):** An Express server mediating between the Admin Panel and Supabase/local PostgreSQL.
    - **Purpose:** Handles authentication for the Admin Panel, provides CRUD operations for various entities, and manages driver-related endpoints. Uses Supabase `service_role` for shared data and local PostgreSQL for admin-specific data.

- **Proxy Routing:** A `proxy.js` script routes requests to different applications/servers based on paths:
    - `/admin-api/*` → Express API (port 3001)
    - `/admin/*` → Vite admin UI (port 3000)
    - `/driver/*` → Driver App metro (port 8000)
    - `everything else` → Expo Metro (port 8081)

## External Dependencies

- **Supabase:**
    - Primary backend for User App and shared data across the platform.
    - Used for user authentication, real-time order tracking, database storage for users, stores, orders, menu items, drivers, wallets, wallet transactions, and support requests.
    - `service_role` key is used by the Admin API to bypass RLS for administrative operations.
    - Environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **PostgreSQL (Local):**
    - Used for admin-specific data in the Admin Panel: `admins`, `promotions`, `banners`, `delivery_zones`, `store_reviews`, `push_tokens` (legacy), `notifications_log`, `app_settings`.
    - Accessed via `DATABASE_URL` secret.
- **Expo:**
    - Used for User App and Driver App development (Expo 55).
    - `expo-notifications` and `expo-device` for push notifications.
    - `expo-image-picker` (planned for driver document upload).
- **Infobip:** Used for OTP delivery in driver authentication via existing `/admin-api/otp/*` endpoints.
- **Expo Push API:** (`https://exp.host/--/api/v2/push/send`) used by the Admin API to send push notifications to users.
- **OpenStreetMap Overpass API:** Used for real Safi places in the user app search functionality.
- **`date-fns`:** For date formatting and localization (`fr` locale).
- **`moti` and `react-native-reanimated`:** For animations in the User App.
- **`zustand`:** For state management in both User App and Admin Panel.
- **`TanStack Query`:** For data fetching and caching in the User App.
- **`react-hook-form` and `zod`:** For form management and validation.
- **`lucide-react`:** For icons in the Admin Panel.