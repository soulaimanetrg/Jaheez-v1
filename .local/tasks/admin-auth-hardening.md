# Admin Auth Hardening

## What & Why
The admin panel handles money, customer data, and driver KYC. Per spec section 4.1.1 and the gap analysis, several auth controls are missing and any one of them could be exploited:
- No account lockout after repeated wrong passwords (brute-force exposure).
- No 30-day "remember me" option (UX gap forces frequent re-auth, leading to bad workarounds).
- No 4-hour idle timeout (admin walks away from laptop, anyone can act as them).
- Roles don't match the spec: current `super_admin / admin / operator / support` should become `super_admin / operations / finance / support / content_manager` with per-action enforcement.

## Done looks like
- After 3 wrong password attempts within 10 minutes, the account is locked for 10 minutes; UI shows a clear countdown.
- Login form has a "Se souvenir de moi" checkbox; checked = 30-day JWT, unchecked = 24-hour JWT (instead of current 7-day default).
- After 4 hours without any admin-api request from a session, the JWT is rejected and the user is logged out with a "session expirée pour inactivité" message.
- Roles renamed and the existing admin accounts auto-migrated (operator → operations, admin → operations, support → support, super_admin → super_admin). New `finance` and `content_manager` roles are creatable in the Admins page.
- Permission matrix enforced server-side per the spec table: refunds + wallet adjustments = finance + super_admin only; audit logs + admin user management = super_admin only; content management = content_manager + super_admin; driver approval = operations + super_admin; etc.
- Login redirects by role: `support` → `/support`, `content_manager` → `/categories`, others → `/dashboard`.
- All new auth events (lockout triggered, role changed, role-based 403) are written to `audit_log`.

## Out of scope
- Two-factor auth (separate future work — would need TOTP infra).
- SSO / OAuth.
- Password rotation policy.
- IP allowlisting.

## Architectural constraints
- All changes server-side only — frontend gates are advisory, never authoritative.
- JWT contains role; `requireRole()` middleware (already added during the refund work) is the single enforcement point.
- Lockout state tracked in a new `admin_login_attempts` table (local PG), not in memory (so it survives server restart).
- Idle timeout via "last activity" timestamp updated by middleware; checked on each request.
- Migration script must run idempotently — re-running shouldn't double-rename roles.

## Steps
1. **Lockout table + logic** — Add `admin_login_attempts` table tracking email + ip + attempt time + outcome. Update `/admin-api/login` to count recent failures and refuse with a clear "compte verrouillé" error if ≥ 3 in last 10 min. Audit-log lockout events.
2. **Remember-me + idle timeout** — Add `remember_me` boolean to login request (24h vs 30d JWT). Add `last_seen_at` to JWT payload (or a separate `admin_sessions` table). Middleware checks idle > 4h → reject 401 with idle-expired error code. Frontend handles this code by clearing token and redirecting with a French toast.
3. **Role rename + migration** — Add an idempotent migration at admin-api startup: rename `operator` → `operations` and `admin` → `operations` in the `admins` table. Update the role enum check across the codebase. Add `finance` and `content_manager` as valid roles.
4. **Permission matrix** — For every existing write endpoint in `scripts/admin-api.js`, add the appropriate `requireRole()` per the spec section 9 matrix. Document the matrix in a comment block at the top of the file.
5. **Admins page UI** — Update `admin/src/pages/Admins.tsx` to expose the new role names with French labels and short descriptions of each role's powers.
6. **Login UX** — Add "Se souvenir de moi" checkbox to `Login.tsx`. Display lockout countdown and idle-expired messages. Update `ROLE_LABELS` in `authStore.ts`.
7. **Role-based redirect** — On login, redirect by role per the spec.
8. **Manual testing** — Trigger lockout by entering 3 wrong passwords; verify clear error and 10-min countdown. Log in with remember-me and verify token survives a browser restart. Idle for >4h (or simulate by editing JWT) and verify rejection. Create a finance admin and verify they can issue refunds but not view audit logs. Create a content_manager and verify they can edit categories but not approve drivers.

## Relevant files
- `scripts/admin-api.js`
- `admin/src/pages/Login.tsx`
- `admin/src/pages/Admins.tsx`
- `admin/src/store/authStore.ts`
- `admin/src/lib/api.ts`
- `admin/src/App.tsx`
- `JAHEEZ_FULL_SPEC.txt`
- `GAP_ANALYSIS.md`
