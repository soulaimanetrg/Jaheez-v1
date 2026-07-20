# 01. Project Overview

## What JAHEEZ Is
JAHEEZ (جاهز) is a localized smart logistics and on-demand delivery platform designed specifically for Safi, Morocco. The platform facilitates connecting customers, delivery drivers (operating motorcycles exclusively), and local merchants. It supports a variety of services, including food delivery, groceries, pharmacy purchases, custom errands, and custom parcel delivery.

## Platform Scope & Supported Delivery Model
*   **Target Region**: Safi, Morocco.
*   **Vehicle Fleet**: Motorcycle-only delivery agents.
*   **Operational Scope**: Regional, focused on on-demand consumer delivery and local custom errands.
*   **Business Model**: Order matching, service fees, and structured wallet transaction logs. Currently transitioning from a gig-worker commission structure to a salaried/hourly driver employment structure.

## Core Applications
The repository is structured as a multi-project monorepo containing:
1.  **User App (`user-app/`)**: Customer mobile application (iOS & Android) built using Expo SDK 55, React Native, and TypeScript.
2.  **Driver App (`driver-app/`)**: Courier mobile application (iOS & Android) built using Expo SDK 55, React Native, and TypeScript.
3.  **Admin Panel (`admin/`)**: Operational dashboard (Web) built using Vite, React 18, and TypeScript.
4.  **Backend Restructured (`backend/`)**: Restructured production-grade MVC backend built with Node.js, Express, and TypeScript.
5.  **Legacy Admin Monolith (`scripts/admin-api.js`)**: Original Express.js API server handling authentication, admin tools, and operational operations.

## Current Backend Migration State
The platform is in the middle of a migration phase from a monolithic/legacy architecture to a strict, production backend-authoritative MVC architecture:
*   The monolithic [scripts/admin-api.js](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/scripts/admin-api.js) still handles most of the production endpoints and bypasses database rules using broad `service_role` client access.
*   The new TS MVC backend (`backend/src`) **compiles successfully** (tsc exits with 0), but is currently unrouted during local dev tests because the proxy routes all API traffic to the legacy monolith.
*   A reverse proxy ([scripts/proxy.js](file:///c:/Users/user/Desktop/jaheeez/Jaheez-v1/scripts/proxy.js)) is running on Port 5000 and routes all `/admin-api/*` traffic to Port 3001 (legacy monolith), completely bypassing the new backend (Port 3002 or Port 3001 conflict).

## Core Architectural Authority Rule
*   **Frontend displays**: Mobile and Web applications render user interfaces and prompt actions.
*   **Backend decides**: The API layer evaluates business rules, price calculations, and states.
*   **Database records**: Supabase (PostgreSQL) is the single permanent source of truth.
*   **Redis accelerates**: Keeps ephemeral tracking data, GPS location logs, and heartbeats.
*   **Socket.IO broadcasts**: Distributes live order updates and location feeds.

## Main Risks
*   **Split Authority & Database Table Desync**: Promotions, banners, and admin login attempts are stored on a local PostgreSQL database by the legacy monolith, but the new backend queries them from Supabase where they do not exist. Additionally, the new backend queries the `reviews` table, which is named `store_reviews` in the Supabase schema, causing crashes.
*   **Unrouted MVC Backend**: Both the legacy and new backends default to port 3001, causing port conflicts. The proxy routes all `/admin-api/*` traffic to Port 3001 (monolith), meaning the new backend receives no traffic.
*   **Missing Telemetry Integration**: The driver-app contains no location-watching or heartbeat polling code. The backend's Redis geo-tracking remains empty because driver location patches hit the legacy monolith, which has no Redis connection.
*   **Stripe Bypass Risk**: The legacy monolith allows faking checkout totals if `LEGACY_STRIPE_ROUTES_ENABLED === 'true'`, as it accepts `amount_centimes` from the client request body.
*   **Socket.IO Client-Side Gap**: While the backend initializes a JWT-secured Socket.IO server, neither mobile app has the Socket.IO client library installed; they rely entirely on direct Supabase Realtime subscriptions.

## Launch Readiness Level
*   **Rating**: **25 / 100** (Unsafe for release).
*   **Assessment**: Critical table desyncs (new backend will crash on login, reviews, or promo codes), a complete lack of driver GPS tracking code in the driver app, a proxy that bypasses the new backend, and legacy Stripe bypass vulnerabilities block public deployment.

