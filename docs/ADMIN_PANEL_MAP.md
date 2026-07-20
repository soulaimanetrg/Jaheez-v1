# ADMIN PANEL MAP

> Generated: 2026-05-19 | Source: `admin/src/` inspection

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Vite + React 18 |
| Styling | Tailwind CSS v4 + Radix UI + shadcn/ui pattern |
| State | Zustand (auth) + React state (pages) |
| Data Fetching | TanStack React Query |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router v6 |
| Font | Cairo (Google Fonts) |

---

## RBAC System (5 Roles)

| Role | Access |
|------|--------|
| `super_admin` | Full access to everything including admin management, audit logs, settings |
| `operations` | Orders, stores, products, drivers, users, zones, categories |
| `finance` | Refunds, wallet adjustments, payouts, COD settlements, finance overview |
| `support` | Support tickets, review moderation |
| `content_manager` | Banners, categories, promotions, app content, push broadcasts |

---

## Pages (23 total)

### Dashboard & Analytics
| Page | File | Role | Purpose |
|------|------|------|---------|
| Dashboard | `stats.tsx` | super_admin, ops, finance | KPI cards (orders today, revenue, users, drivers), recent orders, weekly chart |
| Analytics | `analytics.tsx` | super_admin, ops, finance | Revenue charts, order trends, category breakdown |

### Operations
| Page | File | Role | Purpose |
|------|------|------|---------|
| Orders | `orders.tsx` | super_admin, ops, finance | Table with status filter, status update, driver assignment, notes |
| Stores | `stores.tsx` | super_admin, ops, content | Store CRUD, verify, feature toggle, open/close |
| Products | `products.tsx` | super_admin, ops, content | Menu items per store, CRUD, availability toggle |
| Users | `users.tsx` | super_admin, ops, support | User list, ban/unban |
| Drivers | `drivers.tsx` | super_admin, ops | Driver list, verify, KYC review |
| Categories | `categories.tsx` | super_admin, ops, content | Service category management |
| Cities | `cities.tsx` | super_admin, ops | Delivery zone management |
| Vehicle Types | `vehicle-types.tsx` | super_admin, ops | Vehicle type configuration |

### Finance
| Page | File | Role | Purpose |
|------|------|------|---------|
| Finance | `finance.tsx` | super_admin, finance | Financial overview, revenue, costs |
| Refunds | `refunds.tsx` | super_admin, finance | Process refunds, refund history |
| Payout Requests | `payout-requests.tsx` | super_admin, finance | Driver payout approval |
| COD Reconciliation | `cod-reconciliation.tsx` | super_admin, finance | Cash settlement tracking |

### Support & Content
| Page | File | Role | Purpose |
|------|------|------|---------|
| Support | `support.tsx` | super_admin, support | Ticket list, status update, admin notes |
| Promotions | `promotions.tsx` | super_admin, ops, content | Promo code CRUD |
| App Content | `app-content.tsx` | super_admin, content | CMS for banners, announcements |

### Administration
| Page | File | Role | Purpose |
|------|------|------|---------|
| Admin Users | `admins.tsx` | super_admin | Admin account CRUD, role assignment |
| Audit Logs | `audit-logs.tsx` | super_admin | Security audit trail |
| Settings | `settings.tsx` | super_admin | Platform configuration |

### Support Extras
| Page | File | Role | Purpose |
|------|------|------|---------|
| Driver Issues | `driver-issues.tsx` | super_admin, ops | Driver problem tracking |
| Login | `login.tsx` | None | Admin authentication |
| Not Found | `not-found.tsx` | None | 404 page |

---

## Auth Flow (Admin)

1. Admin navigates to `/login`
2. Enters email + password
3. POST `/admin-api/login` → bcrypt verify → JWT token
4. Token stored in localStorage (via `getToken()/setToken()`)
5. `api.me()` called to verify token and get admin profile
6. Role-based redirect: `defaultPathForRole(role)` → `/dashboard`
7. JWT has sliding expiry (re-signed on each request via `X-New-Token` header)
8. Idle timeout: 4 hours of inactivity → session expired
9. Account lockout: 3 failed logins in 10 min → locked for 10 min

---

## Admin Panel Security

| Feature | Status |
|---------|--------|
| JWT authentication | ✅ |
| Role-based access control | ✅ |
| Account lockout | ✅ (3 attempts / 10 min) |
| Idle session timeout | ✅ (4 hours) |
| Token sliding renewal | ✅ |
| Audit logging | ✅ |
| Role live-check from DB | ✅ (on every request) |
| Token kind validation | ✅ (`kind: 'admin'` only) |
| CORS restriction | ❌ (open `origin: true`) |
| HTTPS enforcement | ❌ (localhost only) |
| Rate limiting | ❌ Not implemented |
| 2FA | ❌ Not implemented |
| IP allowlisting | ❌ Not implemented |

---

## Known Admin Panel Issues

1. **Mock admin login** — `admin@jaheez.ma/admin123` hardcoded as fallback in `admin-api.js`
2. **CORS wide open** — Any origin can access admin API
3. **Local PostgreSQL dependency** — Promotions, audit logs, admin accounts stored locally, not in Supabase
4. **Dual data source** — Some data in Supabase, some in local PG → complexity for deployment
5. **No 2FA** — Super admin accounts have no multi-factor authentication
6. **French-first error messages** — Some API errors in French, some in Arabic
7. **Template artifacts** — `jaheez-admin-template/` still present in workspace
