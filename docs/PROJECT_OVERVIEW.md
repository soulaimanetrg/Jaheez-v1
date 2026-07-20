# JAHEEZ — Project Overview

> **Purpose**: Explain what JAHEEZ is, why it exists, who it serves, and what the first milestone looks like.

---

## 1. What is JAHEEZ?

JAHEEZ (جاهز — Arabic for "Ready") is a smart delivery and errand platform built for the Safi region of Morocco. It connects everyday people who need things done with local drivers who can do them.

Unlike traditional delivery apps that focus only on food or packages, JAHEEZ handles **any legal errand**:

- 🍕 **Food delivery** — Order from restaurants and street vendors
- 🛒 **Grocery shopping** — Someone shops for you at the souk or supermarket
- 💊 **Pharmacy runs** — Pick up medicine from a specific pharmacy
- 📄 **Document delivery** — Send or collect papers across town
- ⏳ **Queue waiting** — Someone stands in line for you at government offices
- 🎁 **Gift delivery** — Send a gift to a friend across Safi
- 🔧 **Custom errands** — Anything legal you can describe

---

## 2. Why Does JAHEEZ Exist?

### The Problem

In Safi (and similar Moroccan cities):
- Major delivery platforms don't cover smaller cities comprehensively
- People regularly need errands done but have no reliable service
- Existing informal solutions (asking friends, hiring random people) lack trust, tracking, and accountability
- There's no safety layer to prevent delivery platforms from being misused for illegal activities

### The Solution

JAHEEZ provides:
1. **A single platform** for all delivery and errand needs
2. **Verified drivers** with ID checks and approval process
3. **Safety filtering** — every request is screened for risk before a driver sees it
4. **Real-time tracking** — users know exactly where their delivery is
5. **Full accountability** — audit trails, chat history, and dispute resolution

### The Market Opportunity

- Safi: ~350,000 population, growing urbanization
- Smartphone penetration increasing rapidly in Morocco
- Cash-first economy (MAD), with gradual digital payment adoption
- Underserved by existing platforms — room for a locally-tuned solution

---

## 3. The Three Actors

### 👤 Users (Customers)

- Regular people in Safi who need deliveries or errands fulfilled
- Register with phone number (+212 format) and OTP verification
- Place requests in Arabic, French, or Darija
- Track orders in real-time
- Chat with assigned drivers
- Rate and review after completion
- Have a **trust score** (0-100) that affects moderation speed

### 🚗 Drivers

- Local people with motorcycles, cars, bicycles, or on foot
- Go through a verification process: ID card, selfie, vehicle info
- Must be approved by admin before going online
- Set their own availability (online/offline toggle)
- Receive order offers based on proximity, rating, and experience
- Earn per delivery with transparent pricing
- Have their location tracked (every 5s) during active trips

### 🔧 Admins

- Operations team members who monitor the platform
- Review flagged orders in the moderation queue
- Manage driver approvals and suspensions
- Monitor fraud flags and risk patterns
- Configure moderation rules and banned keywords
- Access KPI dashboard for operational metrics

---

## 4. Product Goals

### Short-term (MVP)
1. Working user app with full order lifecycle
2. Moderation system preventing misuse
3. Real-time tracking on map
4. Phone-based authentication
5. Cash payments only

### Medium-term (Post-MVP)
1. Driver app with full trip management
2. Admin panel for operations
3. Digital payments (cards, mobile wallets)
4. Store browsing and menu ordering
5. Scheduled deliveries

### Long-term (Future)
1. Expansion beyond Safi to other Moroccan cities
2. Multi-language support (Amazigh)
3. Advanced fraud detection with ML
4. Driver gamification and incentive programs
5. Partnership integrations with local businesses

---

## 5. The Moderation and Trust Layer

This is a core pillar of the JAHEEZ platform. Every request passes through a moderation pipeline to ensure safety and legality:

### Rule-Based Filter
- Text is normalized (diacritics removed)
- Checked against a database of banned keywords and prohibited categories
- High-risk keywords trigger an instant flag for review

### Manual Admin Review
- Admins monitor a moderation queue in the Admin Panel
- Flagged orders are reviewed by a human operator within minutes
- Decisions are made based on community guidelines and safety standards

---

## 6. The Order Lifecycle

```
User creates request
    ↓
Moderation workflow analyzes (approve / manual review / reject)
    ↓
If approved → broadcast to nearby drivers
    ↓
Driver accepts → assigned to order
    ↓
Driver navigates to pickup → marks "picked up"
    ↓
Driver navigates to dropoff → marks "delivered"
    ↓
User confirms receipt → order completed
    ↓
User rates driver → trust scores updated
```

### Terminal States
- **completed** — successfully delivered and confirmed
- **cancelled** — cancelled by user, driver, or system
- **moderation_rejected** — blocked by admin or keyword filter

---

## 7. What the MVP User App Includes

### Screens (in build order)

| # | Screen | Purpose |
|---|---|---|
| 1 | Splash | Logo, session check, route to auth or home |
| 2 | Onboarding | 3-slide intro explaining JAHEEZ |
| 3 | Login | Phone + password authentication |
| 4 | Register | Account creation with phone verification |
| 5 | OTP | 6-digit code verification |
| 6 | Home | Categories, search bar, recent orders, new request button |
| 7 | Search | Search for stores, items, or services |
| 8 | Orders | Order history with filter tabs |
| 9 | Chat List | Active conversations with drivers |
| 10 | Profile | User info, settings, logout |
| 11 | Custom Request | Create errand/delivery with moderation filtering |
| 12 | Confirmation | Order placed success screen |
| 13 | Tracking | Real-time map with driver location and status |
| 14 | Individual Chat | Message conversation with driver |

### Core Features

1. **Authentication** — Phone + OTP via Supabase Auth
2. **Order Creation** — Title, description, category, pickup/dropoff addresses
3. **Moderation Workflow** — Rule-based and manual risk assessment
4. **Real-Time Tracking** — Map with driver location updating every 5 seconds
5. **In-Order Chat** — Text and image messaging between user and driver
6. **Order History** — Filterable list of past and active orders
7. **Profile Management** — Name, avatar, trust score display, logout

### What's NOT in the MVP
- ❌ Payment processing (cash only)
- ❌ Store browsing / menu ordering (custom request only)
- ❌ Push notifications (visual only, no Expo Push in MVP)
- ❌ Scheduled deliveries (immediate only)

---

## 8. Success Criteria for MVP

The MVP is considered complete when:

1. A user can register, verify phone, and log in
2. A user can create a custom errand request
3. The request passes through moderation (approve/review/reject paths all work)
4. An approved order shows on the confirmation screen
5. The tracking screen shows a map with markers (driver location can be simulated)
6. The chat screen allows sending and receiving messages
7. Order history shows past orders with correct status badges
8. Profile screen shows user info and allows logout
9. All screens handle loading, error, and empty states
10. No hardcoded colors, no `any` types, no inline styles

---

## 9. Key Stakeholders

| Role | Responsibility |
|---|---|
| **Product Owner** | Defines features, priorities, and acceptance criteria |
| **Developer** | Builds the app using these docs and AI tools |
| **AI Tool** | Generates code following JAHEEZ_AGENTS.md and these docs |
| **QA** | Reviews output against REVIEW_CHECKLIST.md |

---

## 10. Related Documents

| Document | What to read it for |
|---|---|
| `MASTER_INSTRUCTIONS.md` | Non-negotiable rules and project identity |
| `ARCHITECTURE_GUIDE.md` | How the system fits together |
| `BUILD_PHASES.md` | What to build and in what order |
| `CODING_RULES.md` | How to write code for this project |
| `DESIGN_SYSTEM_RULES.md` | Visual identity and component specs |
| `PROMPT_LIBRARY.md` | Ready-to-use prompts for AI tools |

---

*JAHEEZ exists to make Safi's daily life easier, safer, and more connected.*
