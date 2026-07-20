# PROJECT DISCOVERY — JAHEEZ (جاهز)

> **Generated:** 2026-05-05 | **Source:** Full workspace inspection (zero assumptions)

---

## What This Project Appears To Be

**JAHEEZ** (جاهز — Arabic for "Ready") is a **smart delivery and errand platform** targeting the **Safi region of Morocco**. It is a multi-app ecosystem with three distinct applications:

1. **User App** — Mobile (Expo/React Native) for customers to order food, groceries, pharmacy items, parcels, and custom errands.
2. **Driver App** — Mobile (Expo/React Native) for delivery drivers to accept and fulfill orders.
3. **Admin Panel** — Web app (Vite + React) for platform administrators to manage stores, orders, drivers, users, and platform operations.

---

## Product Idea

A full-service delivery platform inspired by apps like Glovo, Talabat, and Uber Eats, but localized for Morocco (specifically Safi). It goes beyond food delivery by supporting:

- **Restaurant/café/bakery ordering** (menu-based)
- **Grocery & pharmacy delivery**
- **Parcel delivery**
- **Custom errands** (send someone to do anything legal for you)
- **AI-powered content moderation** (detect risky or illegal requests)
- **Wallet system** with cash-on-delivery (COD) and card payments (Stripe)

---

## Target Users

| Role | Description |
|------|-------------|
| **Customers** | Residents of Safi, Morocco who want food, groceries, or errands delivered |
| **Drivers** | Local motorcycle/car/bicycle couriers who earn money fulfilling orders |
| **Admins** | Platform operators who manage stores, moderate orders, and handle finances |

---

## Type of Application

- **Multi-app platform**: 2 mobile apps + 1 web admin panel
- **Marketplace model**: Users → Platform → Drivers
- **Regional scope**: Safi region, Morocco (zones: centre, nord, sud, est)

---

## Main Goal

Enable users in Safi to order anything (food, groceries, errands) through a mobile app and have it delivered by local drivers, with a full backend for moderation, payments, and operations management.

---

## Business / Domain Context

- **Currency**: Moroccan Dirham (MAD), amounts stored in centimes internally
- **Locale**: Arabic (primary), French (secondary), English (tertiary)
- **Text direction**: RTL-first design (Arabic), with LTR fallback
- **Payment methods**: Cash on delivery (primary), card (Stripe), in-app wallet
- **SMS OTP**: Infobip for phone verification (Moroccan +212 numbers)
- **Translation**: ModernMT API for dynamic AR→FR/EN translations
- **Delivery zones**: Safi centre, nord, sud, est with configurable radius
- **Trust/fraud system**: Risk scoring, content moderation, banned keywords

---

## Product Assumptions Found in Files

1. **AGENTS.md** defines Supabase as the backend, Expo SDK 51 as the mobile framework, and NativeWind v4 for styling. **Evidence shows SDK 55** in `package.json` (upgraded from 51).
2. **Brand identity**: Red (#F03030) on yellow (#F5CE2E) — based on `brand.ts`. The `AGENTS.md` file specifies slightly different colors (#EF4444 for red, #F2C94C for yellow), indicating a design evolution that happened during development.
3. **app.json** uses yet another color scheme (`primaryColor: #AB3500`, `backgroundColor: #FCF8FB`) and `tailwind.config.js` uses a "Kinetic Curator" palette (`primary: #AB3500`). This is a **conflict** — the runtime code uses `brand.ts` values, but the Tailwind config has diverged.
4. **AGENTS.md** says DM Sans + JetBrains Mono fonts; actual implementation uses **Cairo** font family (Arabic-first).
5. The project was originally developed on **Replit** (`.replit` file, `replit.md`, `server.js` serving HTML previews) and has since been migrated to a local Windows dev environment.
6. **Clerk** authentication was explored (per conversation history) but does not appear to be implemented; Supabase Auth is the current system.
7. The documentation mentions a "96-screen design system" but actual implementation has ~35 screens across all three apps.
