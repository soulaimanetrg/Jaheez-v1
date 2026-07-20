# 3. PROJECT STRUCTURE MAP — JAHEEZ

> **Updated:** June 14, 2026 | **Workspace State:** Official app roots are `backend/`, `frontend/user-app`, `frontend/driver-app`, and `frontend/admin`. Legacy root app folders and `scripts/admin-api.js` are removed.

Please see the single authoritative structure map: [PROJECT_STRUCTURE_MAP.md](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/docs/PROJECT_STRUCTURE_MAP.md)

---

## 1. Root Workspace Tree

```
jaheez-v1/
├── backend/                       # ⚡ REST API & WebSocket Express Backend (Port 3002)
│   ├── src/                       # TypeScript Source
│   │   ├── config/                # Environment variables, logs, configurations
│   │   ├── db/                    # Supabase Postgres database client
│   │   ├── features/              # Modular Monolith domains
│   │   │   ├── auth/              # Role-specific Authentication routers & services
│   │   │   ├── driver/            # Live heartbeats and active order issue logs
│   │   │   ├── finance/           # Wallet, refunds, payout requests, and COD settlements
│   │   │   ├── order/             # Customer checkout, admin order management, driver updates
│   │   │   ├── settings/          # CMS configuration, cities, categories, promos
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
│   ├── driver-app/                # Driver mobile application (Expo SDK 55 + RN)
│   └── user-app/                  # Customer mobile application (Expo SDK 55 + RN)
│
├── shared/                        # 🗂️ Shared Types & Constants
├── supabase/                      # 🗄️ Supabase configurations
└── scripts/                       # 🔧 Development scripts
```
