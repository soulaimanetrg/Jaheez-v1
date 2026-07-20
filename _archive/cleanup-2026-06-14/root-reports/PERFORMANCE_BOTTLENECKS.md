# Performance Bottlenecks Report

This document reports critical performance issues and database bottlenecks identified in the JAHEEZ backend and dispatch services.

---

## 1. Un-batched Sequential DB Updates in Dispatch Loop

* **Exact File Path**: `backend/src/features/dispatch/dispatch.service.ts`
* **Exact Function/Component**: `runDispatchCycle` (lines 55-106)
* **Root Cause**: The dispatch matching loop processes match results (orders paired with drivers) sequentially in a `for` loop. For each match, the engine executes three database/Redis operations:
  1. `offerQueue.addOffer`: A write query updating the order record in Postgres, plus a Redis ZADD command.
  2. `supabase.from('drivers').select(...)`: A read query fetching driver total and accepted offers.
  3. `supabase.from('drivers').update(...)`: A write query recalculating the driver's acceptance rate and updating their state to `OFFERED`.
* **Severity**: HIGH
* **Impact**: Under concurrent load (e.g. 50 orders matched simultaneously), the dispatch thread executes 150 sequential database requests. This results in execution delays, blocking the main event loop, causing matching queue starvation, and triggering offer delays.
* **Exact Fix**:
  Batch matching assignments.
  1. Retrieve all drivers matching the batch in a single SELECT query.
  2. Perform updates concurrently using `Promise.all()` or compile updates into a single Postgres batch statement.

---

## 2. Sequential Status Checks in Timeout Worker

* **Exact File Path**: `backend/src/features/dispatch/timeoutWorker.ts`
* **Exact Function/Component**: `processExpiredOffers` (lines 22-158)
* **Root Cause**: The worker processes expired order offers inside a `for` loop. For each expired offer, the worker makes multiple sequential database queries:
  1. Updates the order in Postgres to clear the offered driver fields and increments `reassignment_count`.
  2. Queries Redis to remove the cached offer.
  3. Queries Postgres to fetch driver status and statistics.
  4. Updates Postgres to increment the driver's timeout count, recalculate their acceptance rate, and apply penalty blocks if needed.
  5. Inserts support requests and logs violations.
* **Severity**: MEDIUM
* **Impact**: Under peak hours with multiple timeouts, the worker blocks thread execution, stalling reassignment and leaving drivers stuck in `OFFERED` status instead of releasing them to receive other assignments.
* **Exact Fix**:
  Batch retrieve all driver/order statistics, process the state transitions in memory, and execute batch updates for orders and drivers in parallel using `Promise.all()`.

---

## 3. Client REST Polling Resource Exhaustion

* **Exact File Path**: `frontend/driver-app/features/delivery/views/DriverDashboardScreen.tsx`
* **Exact Function/Component**: Main view React hooks
* **Root Cause**: Since there is no WebSocket client implemented, the driver app polls the `/driver/orders?scope=available` API endpoint every 15 seconds.
* **Severity**: HIGH
* **Impact**: Scaling to 1,000 active online drivers translates to 4,000 incoming REST HTTP requests and subsequent Supabase SELECT queries per minute. This consumes the Express thread pool, exhausts Postgres connection pool limits, and results in API latency spikes for other critical flows like checkout and payments.
* **Exact Fix**:
  Implement WebSockets using Socket.IO, allowing the backend to push order offers to drivers instantly, and eliminate periodic REST polling.
