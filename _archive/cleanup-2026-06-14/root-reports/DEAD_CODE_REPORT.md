# Dead Code / Legacy Report

## Directory Classification

| Path | Classification | Evidence |
|---|---|---|
| `user-app/` | ACTIVE | Expo app with active scripts. |
| `driver-app/` | ACTIVE | Expo app with active scripts. |
| `admin/` | ACTIVE | Vite admin with active scripts. |
| `backend/` | LEGACY ACTIVE / BROKEN NEW | Intended new backend, but build fails. |
| `scripts/admin-api.js` | LEGACY ACTIVE | Still targeted by admin Vite proxy and many `/admin-api` calls. |
| `scripts/proxy.js` | LEGACY ACTIVE | Public dev route mux. |
| `html-preview/` | PROTOTYPE | Served only by root `server.js`. |
| `server.js` | PROTOTYPE | Static preview server, not production API. |
| `jaheez-temp/` | PROTOTYPE | Template app remnants. |
| `jaheez_workspace/` | PROTOTYPE / EXPERIMENTAL | Separate workspace not imported by current apps. |
| `artifacts/mockup-sandbox/` | EXPERIMENTAL | Mockup route in proxy. |
| `scratch/` | EXPERIMENTAL | Inspection/test scripts. |
| `backend/docs/PHASE_*` | REFERENCE | Describes intended phases; code must be source of truth. |

## Dead / Remove Candidates

- `html-preview/` and root `server.js` should not ship with production runtime.
- `jaheez-temp/` should be removed from production repository or moved to archive.
- `jaheez_workspace/` should be archived unless a Flutter migration is active.
- `artifacts/mockup-sandbox/` should be removed from production deploy paths.
- Timestamped `admin/vite.config.ts.timestamp-*.mjs` files should be deleted if not used.

## Legacy Active Candidates

- `scripts/admin-api.js` cannot be deleted immediately because admin and several user/driver flows still call it.
- `scripts/proxy.js` cannot be deleted until API base and app hosting are normalized.
