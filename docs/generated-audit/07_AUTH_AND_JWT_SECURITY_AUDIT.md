# 07. Auth and JWT Security Audit

This document audits authentication mechanisms, JWT handling, and access controls.

---

## 1. Authentication Systems

### Customer Authentication
*   **Mechanism**: Handled via Supabase Auth.
*   **Flow**: Customers log in via phone number or email. The application receives a Supabase session token, which is passed in HTTP headers as `Authorization: Bearer <token>`.
*   **Security Verdict**: **WORKING**. Relying on Supabase Auth is secure, and mobile clients route writes through REST endpoints using this token.

### Driver Authentication
*   **Mechanism**: Custom SMS OTP validation (Infobip).
*   **Flow**: Drivers register via phone number. OTPs are processed through an Infobip SMS integration. On verification, the backend generates a custom JWT containing `kind: 'driver'`.
*   **Security Verdict**: **PARTIALLY WORKING / RISKY**. OTP validation states are cached in Express server memory (`Map`), which resets on server restart and prevents horizontal scaling.

### Admin Authentication
*   **Mechanism**: Custom JWT authentication against a local database.
*   **Flow**: Admins log in against a local PostgreSQL `admins` table. The server issues a custom JWT with the admin's role.
*   **Security Verdict**: **PARTIALLY WORKING / RISKY**. Includes a hardcoded fallback account (`admin@jaheez.ma` / `admin123`) that bypasses database checks if a connection timeout occurs.

---

## 2. JWT Verification and Role Separation

*   **Verification Middlewares**: The legacy backend implements `auth` middleware, verifying token kind and expiration.
*   **Role Enforcement**: The backend enforces access control via `requireRole()` middleware (`super_admin`, `operations`, `finance`, `support`, `content_manager`).
*   **Service Role Risks**: The legacy backend utilizes the Supabase `service_role` key, bypassing database RLS. Any endpoint vulnerability could expose full database access.
*   **Socket.IO Verification**: Handled via Socket.IO connection handshakes in `socket.server.ts` (lines 17-29). Verifies connection JWT against `SUPABASE_JWT_SECRET` (for customers), admin JWT secret, or driver JWT.
    *   *Security Verdict*: **WORKING (BACKEND) / NOT CONNECTED (CLIENT)**. The backend implementation is secure, but the client apps do not contain the Socket.IO client library or connection code, rendering this security layer unused.

---

## 3. Core Security Vulnerabilities

| Vulnerability | Severity | Classification | Impact | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Hardcoded Admin Credentials** | **CRITICAL** | SECURITY VIOLATION | Allows full platform access if database connection fails in production. | Remove fallback logic in `scripts/admin-api.js` line 362. Fail closed on database connection loss. |
| **Process-Memory OTP Cache** | **HIGH** | RISKY / INSECURE | Prevents horizontal scaling and drops validation states on server restart. | Move OTP cache to Redis with a 5-minute expiry. |
| **Stripe Legacy Bypass Path** | **CRITICAL** | PRODUCTION BLOCKER | Allows faking checkout totals if legacy routes are enabled on port 3001. | Set `LEGACY_STRIPE_ROUTES_ENABLED = false` and delete legacy checkout endpoints. |
| **Bypassed Database Rules via Service Role** | **HIGH** | RISKY / INSECURE | Broad database access bypasses table RLS. | Refactor operations to use authenticated client contexts. |

