# 14. Legacy and Dead Code Report

This document identifies obsolete files, duplicated logic, and legacy dependencies to clean up.

---

## 1. Dead and Prototype Folders

*   **`html-preview/`**: Mockup preview HTML screens that do not link to active codebase logic.
    *   *Recommendation*: **DELETE**.
*   **`jaheez-temp/`**: Temporary duplicate files and system sandbox artifacts.
    *   *Recommendation*: **DELETE**.
*   **`jaheez_workspace/`**: original workspace/prototype templates.
    *   *Recommendation*: **DELETE**.

---

## 2. Legacy Infrastructure & Code

*   **`scripts/proxy.js`**: A vanilla Node `http` proxy running on Port 5000. Routes all `/admin-api/*` to Port 3001.
    *   *Recommendation*: **REPLACE** or update to split traffic between Metro and the restructured backend on Port 3002. Delete once the migration is complete.
*   **`scripts/admin-api.js`**: Legacy monolithic Express API. Contains duplicate database logic, raw SQL executions, and OTP in-memory states.
    *   *Recommendation*: **DEPRECATE** and archive once all endpoints are migrated to the restructured backend.
*   **Mock Fallback Admin**: Hardcoded `admin@jaheez.ma` login path inside `scripts/admin-api.js` line 362.
    *   *Recommendation*: **REMOVE IMMEDIATELY**.

---

## 3. Deprecated Business Logic

*   **Driver Revenue Share Splits**: Database columns and configuration parameters for `driver_share_pct` in the `drivers` and `app_settings` tables.
    *   *Recommendation*: **DEPRECATE** the calculation triggers in completion services, preserving historic data columns for audits. Transition all active driver profiles to the salary/hourly compensation scheme.
*   **Local PostgreSQL Database Table Consolidation**:
    *   Tables like `promotions`, `banners`, and `admin_login_attempts` are hosted in a local PostgreSQL database but are required by the new backend.
    *   *Recommendation*: **MIGRATE** these table structures to Supabase and clean up the local PostgreSQL database pool (`pg`) entirely from the backend.

