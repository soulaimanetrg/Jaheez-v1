# DRIVER APP MAP

> Generated: 2026-05-19 | Source: `driver-app/` directory inspection

---

## Overview

| Field | Value |
|-------|-------|
| **Framework** | Expo SDK 55 + React Native 0.83 + Expo Router v3 |
| **Location** | `driver-app/` |
| **Package name** | `jaheez-driver` |
| **Slug** | `jaheez-driver` |
| **Status** | ⚠️ Early stage — basic screens exist but significantly less developed than user-app |

---

## Implemented Screens

### Auth Screens
| Screen | File | Size | Status |
|--------|------|------|--------|
| Root Layout | `app/_layout.tsx` | ~3KB | ✅ Done |
| Entry/Index | `app/index.tsx` | ~1.5KB | ✅ Done |
| Auth Layout | `app/(auth)/_layout.tsx` | ~1KB | ✅ Done |
| Welcome | `app/(auth)/welcome.tsx` | ~5KB | ✅ Done |
| Login | `app/(auth)/login.tsx` | ~8KB | ✅ Done |
| Register | `app/(auth)/register.tsx` | ~12KB | ✅ Done |
| OTP | `app/(auth)/otp.tsx` | ~6KB | ✅ Done |
| Pending Approval | `app/(auth)/pending.tsx` | ~4KB | ✅ Done |

### Tab Screens
| Screen | File | Size | Status |
|--------|------|------|--------|
| Tabs Layout | `app/(tabs)/_layout.tsx` | ~3KB | ✅ Done |
| Home/Dashboard | `app/(tabs)/index.tsx` | ~10KB | ✅ Done |
| Earnings | `app/(tabs)/earnings.tsx` | ~8KB | ✅ Done |
| Profile | `app/(tabs)/profile.tsx` | ~6KB | ✅ Done |

### Flow Screens
| Screen | File | Size | Status |
|--------|------|------|--------|
| Flows Layout | `app/(flows)/_layout.tsx` | ~1KB | ✅ Done |
| Active Delivery | `app/(flows)/active-delivery.tsx` | ~15KB | ✅ Done |
| Payout Request | `app/(flows)/payout-request.tsx` | ~8KB | ✅ Done |

---

## Missing Screens / Features

| Screen | Purpose | Priority |
|--------|---------|----------|
| KYC Document Upload | Upload CIN, permis, carte grise, assurance | 🔴 High |
| Document Status | View uploaded document statuses | 🔴 High |
| Order History | Past deliveries list | 🟡 Medium |
| Order Details | Specific delivery breakdown | 🟡 Medium |
| Chat (with customer) | Real-time messaging | 🟡 Medium |
| Settings | Preferences, notifications | 🟡 Medium |
| Earnings Detail | Detailed earnings breakdown | 🟡 Medium |
| Notifications | Delivery notifications inbox | 🟡 Medium |
| Vehicle Info Edit | Update vehicle details | 🟢 Low |
| Bank Details Edit | Update RIB/bank for payouts | 🟢 Low |
| COD Settlement | Cash collection history | 🟢 Low |
| Rating/Reviews | View customer ratings | 🟢 Low |

---

## Missing Infrastructure

| Layer | Status |
|-------|--------|
| `components/ui/` | ❌ Not found — no reusable component library |
| `hooks/` | ❌ Not found — no custom hooks |
| `lib/` | ⚠️ Minimal — may have supabase.ts only |
| `constants/brand.ts` | ⚠️ Needs verification |
| `store/` | ⚠️ Minimal stores |
| Shared types import | ⚠️ Should import from `../../shared/types.ts` |

---

## Driver Lifecycle

```
1. Download App → Welcome Screen
2. Register (phone, name, vehicle info) → OTP Verify
3. Upload KYC Documents → Pending Admin Approval
4. Admin Approves → Driver can go "Online"
5. Online → Receive Order Notifications
6. Accept Order → Active Delivery Flow:
   a. Heading to Pickup
   b. Arrived at Store
   c. Picked Up Items
   d. Heading to Customer
   e. Arrived at Customer → Delivered
7. Customer Confirms → Order Complete
8. Earnings Updated → Request Payout when ready
```

---

## Active Delivery Flow (5 stages in `active-delivery.tsx`)

| Stage | Action | Button |
|-------|--------|--------|
| 1. Heading to Pickup | Navigate to store | "وصلت للمتجر" (Arrived at Store) |
| 2. At Store | Wait for items | "استلمت الطلب" (Picked Up) |
| 3. Heading to Customer | Navigate to dropoff | "وصلت للعميل" (Arrived at Customer) |
| 4. At Customer | Hand over items | "تم التسليم" (Delivered) |
| 5. Completed | See summary | Back to dashboard |

---

## Shared Code Dependencies

The driver-app SHOULD share these files with user-app via `../../shared/`:
- `shared/types.ts` — Order, Driver, User interfaces
- `shared/constants.ts` — Order statuses, vehicle types

And SHOULD replicate these patterns from user-app:
- `constants/brand.ts` — Same brand tokens
- `lib/supabase.ts` — Same Supabase client
- `components/ui/` — Same UI component library (or subset)
- `store/authStore.ts` — Similar auth state pattern (but for driver role)
