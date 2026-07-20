# 11. Driver Tracking and Realtime Audit

This document audits driver tracking, telemetry updates, and realtime events.

---

## 1. Driver Location Heartbeat

```
 [ Driver App ] ──(No GPS Code)──> [ PATCH /driver/me ] ──(Proxy 5000)──> [ Monolith Port 3001 ]
                                                                                   │
                                                                                   v
                                                                          (No Redis Write)
                                                                                   │
                                                                                   v
                                                                          [ Empty Redis DB ]
```

*   **Heartbeat Mechanism**: Restructured backend contains full TTL online heartbeat matching (`updateProfile` sets `driver:online:${driverId}` in Redis with 30s expiry).
*   **Driver App Gap**: The mobile `driver-app` has **no background location updates or periodic heartbeat code**. It only sends coordinates when updating the profile status manually, which fetches through Port 5000 (proxied to legacy monolith Port 3001).
*   **Monolith Redis Exclusion**: The legacy monolith on Port 3001 does not connect to Redis or log geolocation updates. Active driver locations in Redis locations remain empty.

---

## 2. Telemetry & Cleanup Workers

*   **Heartbeat Reconcile Worker**:
    *   *Reference*: `backend/src/workers/driverHeartbeat.worker.ts`
    *   *Current State*: **ACTIVE / WORKING**. The server runs a scheduled worker (`HEARTBEAT_SCAN_MS = 30000`) that scans active driver IDs, checks their Redis heartbeat TTL, and updates PostgreSQL `drivers.is_online = false` when they expire.
    *   *Realtime Emission*: Bypassed drivers trigger Socket.IO `driver:offline` broadcasts to the admin dashboard.
*   **Matching Engine**: Implements geographical closest-driver matching via Redis `GEORADIUS`/`GEOSEARCH` inside `backend/src/services/driver.service.ts`. However, it has no active input coordinates due to client-side gaps.

---

## 3. Realtime Messaging

*   **Socket.IO Server**:
    *   *Reference*: `backend/src/server.ts` line 10 launches Socket.IO server on start.
    *   *Room Authorization*: Verified in `realtime.service.ts` line 32 (`canJoinRoom` checks roles and ownership).
    *   *Current State*: **UNCONNECTED**. Secure handshake works, but mobile client applications do not have `socket.io-client` installed, leaving this channel unutilized.
*   **Supabase Realtime**:
    *   *Mechanism*: Both client apps subscribe directly to PostgreSQL WAL changes using Supabase's `channel` and `postgres_changes`.
    *   *Current State*: **WORKING (UNSECURE)**. Bypasses backend filters, allowing clients to receive updates directly from Supabase WAL without controller check boundaries.

