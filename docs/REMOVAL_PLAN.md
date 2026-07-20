# JAHEEZ (جاهز) — SCOPE CLEANING & REMOVAL PLAN
**Prepared by: Technical Due Diligence Team**  
**Project:** Moroccan Hyperlocal Logistics Platform (Safi Launch)  
**Status:** Scope Reduction Approved

---

## 1. FILE & COMPONENT DELETIONS

The following files and components are mockup leftovers or unused abstractions and must be deleted from the repository:

| File/Folder Path | Category | Reason for Deletion |
| :--- | :--- | :--- |
| `user-app/app/(flows)/ai-suggestion.tsx` | Mock/AI Screen | Mock screen that uses a timer to simulate prompt analysis. |
| `admin/src/pages/vehicle-types.tsx` | Unused Abstraction | Violates the **motorcycle-only** logistics constraint. |
| `user-app/lib/fallbackApi.ts` | Mock Fallback API | Pulls random meals and OpenStreetMap nodes when database is empty. |
| `jaheez-temp/` | Orphaned Legacy | Prototypes leftovers. |
| `jaheez_workspace/` | Legacy packages | Old monorepo structure leftovers. |
| `html-preview/` | Static HTML | Obsolete static templates. |

---

## 2. CODE CLEANUP & CONTRAINT REFACTORINGS

### 1. Database Schema Check Constraints
* **Location:** `supabase_schema.sql` (Line 115)
* **Refactor:** Remove check constraints permitting `car` or `bicycle` for drivers.
* **Fix:** Update driver validation constraints to strictly accept `motorcycle`.

---

### 2. Admin API Vehicle Type Endpoints
* **Location:** [admin-api.js](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/scripts/admin-api.js)
* **Refactor:** Remove routes matching `/admin-api/vehicle-types/*` and `/admin-api/vehicle-types`.

---

### 3. Analytics Mock Data Collections
* **Location:** `admin/src/pages/analytics.tsx`
* **Refactor:** Remove mock datasets and link widgets directly to database aggregates.
