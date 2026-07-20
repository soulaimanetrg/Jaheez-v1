# Driver App Audit

## Verdict

Status: PARTIALLY WORKING, PRODUCT MODEL MISMATCH

The driver app has real backend API calls for login, profile, orders, stage updates, and payouts. It is not aligned with the target salary-based driver model and still exposes KYC/OTP/payout concepts.

## Key Traced Flows

### Driver login

CURRENT FLOW:
`driver auth screens -> driver-app/lib/api.ts -> /admin-api/otp/* and /admin-api/driver/login -> legacy/new backend depending on proxy`

Status: PARTIALLY WORKING

Evidence:

- `driver-app/lib/api.ts` calls `/otp/send`, `/otp/verify`, `/driver/login`.
- `scripts/admin-api.js` contains in-memory `otpStore` and driver login/token logic.
- `backend/src/routes/auth.routes.ts` has `/driver/login`, but OTP routes are not in new MVC backend.

Violation:

- OTP is legacy monolith state, stored in process memory. It is not robust across restarts or multiple instances.

### Online toggle / location

CURRENT FLOW:
`driver-app/app/(tabs)/index.tsx -> driverApi.updateMe({ is_online }) -> /admin-api/driver/me -> DriverService.updateProfile -> drivers table; Redis only if coords present`

Status: PARTIALLY WORKING

Evidence:

- `driver-app/app/(tabs)/index.tsx` toggles `is_online`.
- `backend/src/services/driver.service.ts` updates DB, then updates Redis only when coordinates are included.

Risk:

- Online status can remain true in PostgreSQL after Redis TTL expires.
- No traced background location loop in the app sends recurring coordinates.

### Dispatch and offers

CURRENT FLOW:
`driver app polls/fetches driverApi.orders('available') -> backend query orders where driver_id null and status in confirmed/preparing`

TARGET FLOW:
`driver socket/auth -> dispatch service -> Redis candidate lookup -> offer room -> accept endpoint -> order claim`

Status: BROKEN / PARTIAL

There is no central live dispatch offer system or Socket.IO room trace.

## KYC / OTP / Onboarding Remnants

Classification: ACTIVE and blocking/confusing

Evidence:

- `driver-app/app/(auth)/pending.tsx` gates on `kyc_status`.
- `driver-app/app/(tabs)/profile.tsx` accesses `kyc` / document data.
- `backend/src/validators/driver.validators.ts` accepts `kyc_status` and `kyc_note`.
- `scripts/admin-api.js` includes `driver_documents`, `/drivers/:id/kyc`, KYC filters, document upload, and KYC status mutation.

Target violation: KYC is out of current production scope and should be removed/deprecated.

## Revenue / Payout Remnants

Classification: ACTIVE, violates salary-based driver target

Evidence:

- `driver-app/app/(tabs)/earnings.tsx` shows earnings and payout history.
- `driver-app/app/(flows)/payout-request.tsx` lets drivers request payouts.
- `driver-app/lib/api.ts` exposes `payouts()` and `requestPayout()`.
- Backend and legacy API update `earnings_centimes` and `payout_requests`.

Fix:

Disable driver payout/earnings UI for salary-based production. Keep COD liability if needed, but do not calculate driver revenue share from deliveries.
