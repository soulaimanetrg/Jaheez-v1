# Broken Flows Report

## 1. Card Payment Flow

CURRENT FLOW:
`Checkout UI -> calculate finalTotal -> stripeClient sends amount_centimes -> legacy Stripe endpoint -> Stripe`

TARGET FLOW:
`Checkout UI -> API helper(order_id) -> Payment Controller -> Payment Service -> Order Repository -> Stripe`

Break: secure payment amount is calculated in the UI.

Status: RISKY / INSECURE

## 2. Custom Order Flow

CURRENT FLOW:
`Custom request UI -> createCustomOrder -> Supabase orders insert`

TARGET FLOW:
`Custom request UI -> Communication Layer -> CustomOrder Controller -> CustomOrder Service -> Order Repository -> Database`

Break: skips backend validation and service layer.

Status: RISKY / INSECURE

## 3. Admin API Flow

CURRENT FLOW:
`Admin page -> /admin-api -> Vite proxy -> scripts/admin-api.js:3001`

TARGET FLOW:
`Admin page -> admin API helper -> MVC Controller -> Service -> Repository -> Database`

Break: admin mostly uses monolith, not new MVC backend.

Status: LEGACY ACTIVE / PARTIAL

## 4. Driver Dispatch Flow

CURRENT FLOW:
`Driver app -> GET /driver/orders?scope=available -> query unassigned orders`

TARGET FLOW:
`Driver socket -> Dispatch Service -> Redis GEO candidates -> offer event -> accept endpoint -> repository update`

Break: no live offer/dispatch queue and no Socket.IO trace.

Status: BROKEN / PARTIAL

## 5. Driver Location Flow

CURRENT FLOW:
`Driver updateMe with optional coords -> DB update -> Redis update only if coords present`

TARGET FLOW:
`Driver background location -> API/socket heartbeat -> Driver Service -> Redis GEO + TTL -> DB reconciliation -> tracking broadcast`

Break: no traced background heartbeat; DB online can desync from Redis TTL.

Status: PARTIAL / UNRELIABLE

## 6. Backend Deployment Flow

CURRENT FLOW:
`proxy expects new backend 3002 -> backend defaults 3001 -> backend build fails`

TARGET FLOW:
`CI build passes -> single configured API port/base -> health check -> deploy`

Break: new backend cannot currently build.

Status: BROKEN
