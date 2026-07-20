# Fake And Mock Systems

## Findings

| System | Classification | Evidence | Risk |
|---|---|---|---|
| Built-in admin login | FAKE / MOCKED, CRITICAL | `scripts/admin-api.js` fallback `admin@jaheez.ma` / `admin123` | Full admin compromise if deployed. |
| Places ratings/fallback | FAKE / MOCKED | `user-app/lib/placesApi.ts` deterministic fake rating and mock data fallback | Users see untrusted store/place quality. |
| Custom request pricing | FAKE / PARTIAL | `custom-request.tsx` comments mock delivery cost; `createCustomOrder` inserts flat fee | Errand pricing not production-authoritative. |
| Demo guards | FAKE / DEMO ONLY | `confirmation.tsx`, `chat/[id].tsx` handle `demo`/`new` ids | UI can look functional without real order. |
| Socket.IO realtime | FAKE CLAIM / NOT CONNECTED | dependency/config exists; no server attach or auth trace | Team may believe realtime is production-grade when it is not. |
| Prototype folders | PROTOTYPE | `html-preview`, `jaheez-temp`, `jaheez_workspace`, `artifacts` | Deployment confusion and dead-code drag. |

## Required Removals Before Launch

1. Delete mock admin fallback.
2. Remove demo routes/ids from production build or gate them behind dev-only flags.
3. Remove fake ratings from user-facing production.
4. Remove prototype servers/folders from deployment config.
5. Replace Socket.IO claims with real authenticated server implementation or document Supabase realtime as the actual mechanism.
