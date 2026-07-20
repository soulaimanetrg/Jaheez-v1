# Realtime / Socket / Redis Audit

## Verdict

Status: BROKEN / PARTIAL

Realtime is not implemented according to the target architecture. Socket.IO is present as a dependency and has a config file, but no wired Socket.IO server, JWT socket auth, room join flow, or service-triggered broadcasts were traced.

## Socket.IO

- `backend/src/config/socket.ts` defines options.
- `backend/src/server.ts` only starts Express with `app.listen`; it does not attach `new Server(...)`.
- No traced socket middleware validates customer/driver/admin JWT before joining rooms.
- No traced event names or room names for order updates, dashboard updates, dispatch, or tracking.

Status: NOT CONNECTED

## Supabase Realtime

Evidence:

- `user-app/lib/orderApi.ts` uses `.channel('order:{id}')` and `postgres_changes`.
- `user-app/hooks/useTracking.ts` subscribes to `orders` and `driver_locations`.
- `user-app/app/(flows)/chat/[id].tsx` subscribes to `chat_messages`.

Status: PARTIALLY WORKING as read-side realtime, but not the required Socket.IO architecture.

## Redis

Evidence:

- `backend/src/services/driver.service.ts` calls `redis.geoadd('drivers:locations', lng, lat, driverId)` and sets `driver:online:{driverId}` with 30s TTL.
- Redis is updated only when `PATCH /driver/me` includes coordinates and the driver is online.

Risks:

- PostgreSQL `drivers.is_online` can remain true after Redis heartbeat expires.
- No stale driver cleanup reconciles DB online state.
- No dispatch queue or offer timeout system was traced.
- No background location update loop was traced in the driver app.

## Required Fix

1. Attach Socket.IO to the backend HTTP server.
2. Authenticate socket connections with the correct JWT kind.
3. Define rooms: `order:{id}`, `driver:{id}`, `admin:orders`, `dispatch:{city}`.
4. Emit from services only after database commits.
5. Reconcile Redis TTL expiry with DB online state.
6. Add background driver location update path and battery/lifecycle handling.
