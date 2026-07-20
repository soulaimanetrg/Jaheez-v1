# PROJECT STRUCTURE MAP

> **Updated:** June 14, 2026 | **Workspace State:** Unified modular backend, frontends grouped in `frontend/`, legacy root app folders and `scripts/admin-api.js` removed.

---

## 1. Root Workspace Tree

```
jaheez-v1/
├── backend/                       # ⚡ REST API & WebSocket Express Backend (Port 3002)
│   ├── src/                       # TypeScript Source
│   │   ├── config/                # Environment variables, logs, configurations
│   │   ├── db/                    # Supabase Postgres database client
│   │   ├── features/              # Modular Monolith domains
│   │   │   ├── auth/              # Role-specific authentication routes/controllers/services/repos
│   │   │   ├── driver/            # Live heartbeats and active order issue logs
│   │   │   ├── finance/           # Wallet, refunds, payout requests, and COD settlements
│   │   │   ├── order/             # Customer checkout, admin order management, driver updates
│   │   │   │   ├── customerOrder.routes.ts
│   │   │   │   ├── adminOrder.routes.ts
│   │   │   │   ├── driverOrder.routes.ts
│   │   │   │   └── checkout.routes.ts # Gateway router for checkout operations
│   │   │   ├── settings/          # CMS configuration, cities, categories, promos
│   │   │   │   ├── adminSettings.routes.ts
│   │   │   │   ├── publicSettings.routes.ts
│   │   │   │   └── settings.routes.ts # Gateway router for CMS/settings
│   │   │   ├── store/             # Store and menu CRUD
│   │   │   └── support/           # Helpdesk and review moderations
│   │   ├── middleware/            # Role guards, JWT verifiers, validation & errors
│   │   ├── notifications/         # Expo push notifications engine
│   │   ├── redis/                 # Redis client integration
│   │   ├── types/                 # Express request typings
│   │   ├── utils/                 # Cryptography, JWT, loggers
│   │   ├── workers/               # Dispatch worker & location tracking loops
│   │   ├── app.ts                 # Express routes mounting
│   │   └── server.ts              # HTTP server start logic
│   ├── package.json               # Backend dependencies
│   └── tsconfig.json              # TypeScript configuration
│
├── frontend/                      # 📱 Client Applications
│   ├── admin/                     # React web panel (Vite + React 18 + Tailwind v4)
│   │   ├── src/
│   │   │   ├── features/          # Admin feature modules with views/services
│   │   │   ├── components/        # Sidebar, layout components, shadcn/ui
│   │   │   ├── lib/               # adminApi client targeting port 3002
│   │   │   └── App.tsx            # Main router
│   │   ├── vite.config.ts         # Vite server config (port 3000, proxies to 3002)
│   │   └── package.json
│   │
│   ├── driver-app/                # Driver mobile application (Expo SDK 55 + RN)
│   │   ├── app/                   # Screen flows (tabs, active trips, issues reporting)
│   │   ├── features/              # Driver earnings, salary model, profiles
│   │   ├── lib/                   # API client (api.ts targets port 5000 proxy)
│   │   └── package.json
│   │
│   └── user-app/                  # Customer mobile application (Expo SDK 55 + RN)
│       ├── app/                   # Tab bar (home, search, orders) + flows (checkout, tracking)
│       ├── features/              # Cart management, orders, address CRUD, chats
│       ├── lib/                   # API clients (adminApi.ts targets port 5000 proxy)
│       └── package.json
│
├── shared/                        # 🗂️ Shared Types & Constants
│   ├── types.ts                   # Interfaces for User, Driver, Order, Wallet, etc.
│   └── constants.ts               # Shared enums (OrderStatus, VehicleType, etc.)
│
├── supabase_migrations/           # 🗄️ Supabase database migrations & RLS policies
├── supabase_schema.sql            # Schema reference
│
└── scripts/                       # 🔧 Development scripts
    ├── proxy.js                   # Reverse proxy gateway routing to ports 3000/3002/8081/8082
    ├── create-admin.js            # Initial admin credential creator
    └── seed-stores.js             # Database seeder script
```

---

## 2. Shared Code (`shared/`)

The `shared` directory is the single source of truth for types and enums used across both the Express backend and the React/React Native clients.

*   `types.ts`: Holds data interfaces for `User`, `Driver`, `Order`, `Wallet`, `Transaction`, `Refund`, `Payout`, `City`, `Store`, `MenuItem`, and more.
*   `constants.ts`: Contains state mappings like `OrderStatus` transitions, `VehicleType`, support status codes, and rate-limiting configs.

---

## 3. Backend Architecture (`backend/`)

The backend is built as a modular monolith in TypeScript using an MVC pattern:

```
[Request] → [Gateway Proxy (:5000)] → [Express Router] → [Middlewares] → [Controller] → [Service] → [Repository] → [Supabase DB / Redis]
```

### Key Modules

-   **`auth/`**: Split into role-specific authorization layers (`adminAuth`, `driverAuth`, and `customerAuth`) with distinct schemas and access control. Admin login enforces a 3-attempt lock within a 10-minute window.
-   **`order/`**: Manages customer checkouts, driver accepting/delivering state transitions, and dispatcher overrides. Centralizes all pricing calculations to prevent client-side manipulation.
-   -   **`finance/`**: Manages administrative wallet modifications, payouts, refund decisions (completed refunds auto-credit customer wallets), and cash-on-delivery (COD) settlements.
-   **`driver/`**: Coordinates driver coordinates updates (Redis TTL locations) and order issue reporting. (Drivers are created by administration only; no self-registration or direct KYC uploads exist).
-   **`settings/`**: Serves CMS configurations, service cities, categories, and promotions. Separates public settings endpoints from administrative CRUD routes.

---

## 4. Frontend Workspace (`frontend/`)

All customer, driver, and operator applications reside in the `frontend` workspace to maintain a clean monolith structure.

### Admin Dashboard (`frontend/admin/`)
-   **Routing**: Built with Vite and client-side routing.
-   **Integration**: Connects through `/admin-api` proxying directly to backend port `3002`.
-   **Operations**: Allows full control of order lifecycles, store catalog, users, support tickets, wallet adjustments, and refund reviews.

### Customer Mobile Application (`frontend/user-app/`)
-   **Routing**: Expo Router file-based navigation.
-   **Checkout**: Displays options and inputs; checkout data is sent directly to backend `POST /v1/checkout` where pricing calculations occur.
-   **Payments**: Integrates Stripe sessions generated by backend services.

### Driver Mobile Application (`frontend/driver-app/`)
-   **State**: Online/offline tracking, active order statuses.
-   **Lifecycle**: Allows accepting assigned deliveries and reporting active issues to support. (Drivers are admin-created with CIN/password login only; no self-registration exists).

---

## 5. Development Infrastructure & Gateway Routing

The local development stack routes traffic through `scripts/proxy.js` on port `5000` to direct client requests to their appropriate destinations:

*   `/socket.io/*` & `/admin-api/*` → **Express Monolith** on port `3002`.
*   `/admin/*` → **Vite Admin** on port `3000`.
*   `/driver/*` → **Driver Metro Bundler** on port `8082`.
*   `/*` (default) → **User App Metro Bundler** on port `8081`.
