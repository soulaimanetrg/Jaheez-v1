# User App: Maintenance Banner, Force Update, Delete Account

## What & Why
Three platform-level user-app pieces called out in the gap analysis as missing. Together they make the app safely operable in production:

1. **Maintenance-mode banner** — when ops flips the kill switch, every user sees a clear message instead of a broken app.
2. **Force-update modal** — when we ship a breaking backend change, old clients are blocked from causing data corruption.
3. **Delete-account flow** — legal requirement (Moroccan personal-data law + spec section 2.3.7); also good citizenship.

## Done looks like
- When admin enables maintenance mode in settings, every user-app screen shows a non-dismissible top banner with the AR/FR message; checkout and order placement are blocked.
- When the user-app version is below `min_required_version_ios` / `min_required_version_android`, a non-dismissible modal appears with an "Update now" link to the store.
- A user can go to Profile → "Supprimer mon compte" and complete a 3-step flow: (1) explanation + reason picker, (2) OTP re-verification of their phone, (3) final "I understand" checkbox and confirm. On confirm, the account is soft-deleted and PII is anonymized after 30 days via a backend job.

## Out of scope
- The 30-day anonymization cron job itself (document the SQL it should run; can be wired later).
- Granular maintenance modes per service category (single global flag is enough).
- Deletion confirmation email (we don't have outbound email in the platform).

## Architectural constraints
- Maintenance flag, min versions, and maintenance message live in `app_settings` (already an admin-managed key/value table). Add the right keys with sensible defaults.
- Public read endpoint at `/admin-api/app-settings/public` (no auth) returns just the safe-to-expose subset.
- User app polls this endpoint on splash and every 5 minutes (or on app foreground) and writes results to a global Zustand store.
- Force-update comparison is semver-aware and OS-aware (`Platform.OS` from React Native).
- Delete account uses the existing OTP send/verify endpoints. Soft-delete sets `users.deleted_at`; the anonymization step is documented as a SQL function.

## Steps
1. **Backend settings keys** — Add to `app_settings` (and admin Settings UI) the keys: `maintenance_mode` (bool), `maintenance_message_fr`, `maintenance_message_ar`, `min_required_version_ios`, `min_required_version_android`, `support_phone_e164`. Expose via new public `/admin-api/app-settings/public` endpoint.
2. **Settings UI** — Extend `admin/src/pages/Settings.tsx` to include these new fields with clear labels and an explicit warning before enabling maintenance mode.
3. **User-app platform store** — Create a Zustand store that fetches public settings on splash + every 5 minutes, exposes `isInMaintenance`, `needsForceUpdate`, `maintenanceMessage`, `supportPhone`.
4. **Maintenance banner** — Render a top banner globally (above tabs) when `isInMaintenance`. Add a guard in checkout that blocks order submission with the maintenance message.
5. **Force-update modal** — Render a non-dismissible modal that overlays the entire app when `needsForceUpdate`, with platform-aware store link.
6. **Delete account flow** — New screen `delete-account.tsx`: 3 steps with progress indicator. Step 1 explains consequences + optional reason picker. Step 2 sends OTP and verifies. Step 3 final checkbox + confirm button. On success: soft-delete via Supabase, sign user out, redirect to welcome.
7. **Backend deletion endpoint** — `DELETE /admin-api/auth/account` requires bearer + recent OTP token; sets `users.deleted_at = now()`, anonymizes phone to `+212-DELETED-<id-prefix>`, clears full_name/email; emits an audit log entry (admin null, action `user_self_deleted`).
8. **Document anonymization job** — Add SQL in `supabase_schema.sql` for a `purge_deleted_users()` function that fully nulls PII for users with `deleted_at < now() - interval '30 days'`. Note in `replit.md` how to schedule it (Supabase cron or external scheduler).
9. **Manual testing** — Toggle maintenance mode and verify banner appears; force a version mismatch and verify modal blocks all interaction; complete the deletion flow end-to-end and verify the row is soft-deleted with audit entry.

## Relevant files
- `user-app/app/`
- `user-app/app/(tabs)/profile.tsx`
- `user-app/app/checkout.tsx`
- `user-app/lib/supabase.ts`
- `user-app/lib/infobipOtp.ts`
- `scripts/admin-api.js`
- `admin/src/pages/Settings.tsx`
- `supabase_schema.sql`
- `replit.md`
- `GAP_ANALYSIS.md`
