# Driver App — Phase C MVP

## What & Why
Build the driver-side mobile app (the missing third pillar of JAHEEZ alongside the user app and admin panel). Without this, the platform cannot fulfil orders. Per the spec section 3, drivers need a dedicated Expo app for auth, onboarding, online/offline toggle, accepting & completing deliveries, and managing their earnings & payouts.

This task implements the **MVP** — enough for a 10-driver pilot in Safi (per `DRIVER_ACQUISITION_DESIGN.md`). Polish, advanced earnings analytics, and driver-to-driver chat are deferred.

## Done looks like
- A new Expo app at `driver-app/` runs on web and mobile, in French (primary) and Arabic.
- A new driver can register, upload CIN photo + selfie, and reach the dashboard within 5 minutes.
- Approved driver can toggle online, receive a job assignment with 45-second accept/reject countdown, and walk through the 5-stage delivery flow (heading to pickup → arrived pickup → picked up → arrived customer → delivered).
- Driver sees their daily earnings, COD float currently in their pocket, and can submit a payout request with RIB.
- Real-time order assignment works via Supabase Realtime (with 30-second polling fallback).
- All driver state changes (online/offline, accept/reject, status updates) flow back to the user app's order tracking screen and the admin panel.

## Out of scope
- Driver-to-driver chat or social features.
- Advanced earnings analytics (week/month/year charts beyond basic totals).
- In-app navigation (we open the device's native maps app via deep-link).
- Multi-language beyond FR + AR.
- iOS/Android native builds (Expo web + Expo Go is enough for the pilot).
- Polygon-based zone enforcement (use existing flat-fee zones).

## Architectural constraints
- Match the existing `user-app/` structure: Expo Router, Zustand stores, Supabase client at `lib/supabase.ts`, brand colors from spec (#F03030 / #9A0000).
- Phone-based auth via the existing `/admin-api/otp/send` and `/admin-api/otp/verify` endpoints. Reuse Infobip wiring.
- Money in centimes (integer), never floats.
- Driver schema lives in Supabase (`drivers` table already exists). Add `kyc_status` enum (`partial` / `full` / `verified`) and `payout_requests` table — coordinate with main schema in `supabase_schema.sql`.
- French primary, Arabic RTL secondary. Reuse the user-app's `languageStore.ts` pattern.
- No AI features anywhere (per spec).
- Audit-log all admin-side approvals via the existing `audit()` helper in `scripts/admin-api.js`.

## Steps
1. **Scaffold the Expo app** — Create `driver-app/` with the same layout as `user-app/`: app router, Zustand stores, Supabase client, brand theme, FR/AR i18n. Add a workflow entry so it serves on a new port.
2. **Auth + onboarding (KYC partial)** — Splash, welcome, register (phone + OTP via Infobip), then a 3-step onboarding: (1) personal info, (2) vehicle info, (3) CIN photo + selfie upload. On completion driver state = `pending_approval`, KYC = `partial`. Show "pending review" screen with WhatsApp support link.
3. **Driver dashboard** — Online/offline toggle (writes `drivers.is_online`), today's job count and earnings, prominent "what JAHEEZ owes you" + "COD in your pocket" cards, online-status pulse indicator.
4. **Order assignment + active delivery flow** — Subscribe to Supabase Realtime for new assignments. 45-second accept countdown UI. Once accepted, 5-stage flow with status update buttons that write to `orders.status` and append to `order_status_events`. Native maps deep-link for navigation. Photo upload for proof of delivery.
5. **Earnings + payout requests** — Earnings tab showing today / 7d / 30d totals, transaction list, and a "request payout" button that creates a row in a new `payout_requests` table (RIB validation: 24 chars, MA prefix). Show payout status (pending / processing / paid / rejected).
6. **Admin-side wiring** — In `scripts/admin-api.js`: add `payout_requests` CRUD endpoints (admin-only, role gated to `super_admin` + `admin`), per-document approve/reject for KYC docs, and an "approve to full KYC" action. In `admin/src/pages/Drivers.tsx`: add a detail drawer/modal with KYC docs preview and approve/reject buttons.
7. **Schema migration** — Add to `supabase_schema.sql`: `drivers.kyc_status` enum, `driver_documents` table (id_card, license, registration with per-doc status), `payout_requests` table, `cod_settlements` table. Provide SQL the user runs in Supabase.
8. **Manual testing** — Walk through full driver lifecycle on web preview: register → KYC partial → admin approves → online → receive a test order from user app → complete delivery → check earnings → request payout → admin marks paid. Verify user-app order tracking reflects every step in real time.

## Relevant files
- `user-app/`
- `user-app/lib/supabase.ts`
- `user-app/store/languageStore.ts`
- `scripts/admin-api.js`
- `admin/src/pages/Drivers.tsx`
- `admin/src/lib/api.ts`
- `supabase_schema.sql`
- `JAHEEZ_FULL_SPEC.txt`
- `GAP_ANALYSIS.md`
- `DRIVER_ACQUISITION_DESIGN.md`
- `replit.md`
