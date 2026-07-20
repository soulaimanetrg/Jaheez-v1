# Driver Acquisition & First-Job Experience — JAHEEZ Safi

> Design-thinking analysis for the riskiest part of Phase C (Driver App).
> Without enough drivers online during peak hours in Safi, none of the rest of JAHEEZ matters. This is the first thing to get right.

---

## Framework Used

**JTBD Switch Interview lens + Adoption Forces** (Standard mode).

**Why this one:** The core question isn't "what features should the driver app have?" — it's *"why would someone in Safi switch from their current income activity to driving for JAHEEZ, and what would make them stay past job #3?"* That's a switching-behavior question, which JTBD is built for. Double Diamond would be overkill (problem domain is reasonably defined). GV Sprint requires 5 real users on Day 5, which we don't have access to yet.

---

## Honesty Disclaimer

I have **not interviewed real Safi drivers**. The personas and forces below are working hypotheses extracted from:
- The JAHEEZ spec itself (what it assumes about drivers)
- General knowledge of Moroccan informal economy (motorbike-taxi "khattafa", grand-taxi drivers, gig couriers in Casablanca/Rabat)
- Patterns from comparable two-sided marketplaces (Glovo, Jumia Food, Yassir in MENA)

**Per the design-thinker skill's hard truth:** "Personas without research are fiction." Treat this as a *discussion guide and prototype plan*, not validated truth. The "Next Steps" section below is explicitly about replacing assumption with evidence.

---

## Problem Definition

### HMW Statement

**How might we** get a Safi driver from "first heard about JAHEEZ" to "completed 5 jobs and came back tomorrow" within 7 days, *without* requiring them to trust a brand-new app with their phone, time, fuel, and KYC documents up front?

(Scope test: not too narrow — doesn't bake in "referral program" or "signup bonus." Not too broad — doesn't say "make drivers happy." Anchored on a measurable outcome: 5 jobs in 7 days.)

### Key Insights (working hypotheses, evidence to be validated)

> **Insight 1**: In a small city like Safi (~300k people), the driver pool is *bounded* and largely *known to itself* — informal moto-taxi networks, the grand-taxi syndicate, and parents of the young men who'd consider gig work. Trust travels through social proof, not advertising.
>
> **Evidence**: Population scale + Moroccan informal-economy norms (cash, family-mediated employment, low penetration of digital labor platforms outside Casablanca-Rabat axis).
>
> **Implication**: Performance-marketing playbooks (Facebook ads → app install) will be expensive per acquired driver. A *5-driver pilot recruited in person via the moto-taxi stand at Bab Chaaba* will tell us more than 1000 ad clicks.

> **Insight 2**: The biggest fear isn't "will I get jobs" — it's *"will I get paid, in cash, on time, in my hand."* COD-heavy economy means a driver who can't cash out same-day is functionally unpaid.
>
> **Evidence**: Spec already encodes this (COD settlement, payout requests with RIB) — but the *anxiety* is upstream of the mechanism. The driver doesn't read your settlement policy; they ask their cousin "did you actually get paid?"
>
> **Implication**: First-job UX must *surface the cash flow* loudly. Show the COD they collected, show what JAHEEZ owes them, show the settlement timer, and offer same-day cash pickup at a known physical point in Safi for the first 30 days.

> **Insight 3**: Document upload is where 60-80% of driver onboarding funnels die in MENA gig apps. Photo of CIN + photo of permis + photo of carte grise + photo of insurance, on a phone with bad light and a cracked screen, with no idea if it's "good enough."
>
> **Evidence**: Industry pattern (Glovo, Yassir, inDrive all publish high abandon rates at document step). Spec assumes documents will be reviewed by admin but doesn't address abandonment.
>
> **Implication**: The onboarding flow should be **reversible and resumable**, not a one-shot wizard. Driver should be able to start delivering with *one* document (the CIN photo), and provide the rest within their first 5 jobs while a human helps them via WhatsApp.

---

## Forces Diagram (the JTBD Four Forces, applied to "switch to driving for JAHEEZ")

| Force | Direction | Working hypothesis |
|---|---|---|
| **Push** of the situation (toward switch) | Toward | Underemployment in Safi for 18-30yr males; existing moto-taxi income is unstable, weather-dependent, requires fighting for fares at the stand; grand-taxi licensing is locked behind syndicate fees they can't afford. |
| **Pull** of the new solution (toward switch) | Toward | "I drive when I want, the app tells me where to go, money goes in my pocket." The *autonomy* and *legibility* (clear price per job) is the actual product, not the bike. |
| **Anxiety** of the new (against switch) | Against | "Will the app cheat me on the fee?" "What if the customer disputes and I lose the cash?" "What if I burn fuel for a 5 dh fare?" "What happens if I crash with their package?" |
| **Habit** of the present (against switch) | Against | The moto-taxi stand is *predictable*: I show up at 7am, I know everyone there, I get paid in cash every fare. Switching means giving up that social fabric. |

**Balance:** In its current spec form, JAHEEZ probably has Push + Pull ≈ Anxiety + Habit — i.e., we're at the edge of adoption, not safely past it. **The design must actively reduce Anxiety and Habit** (those are the levers we control), since Push is set by the macro economy and Pull is bounded by what we can honestly promise.

---

## Solution Concepts

| # | Concept | Desirable? | Feasible? | Viable? | Riskiest assumption |
|---|---|---|---|---|---|
| **A** | **"Earn While You Verify"** — driver can take their first 3 jobs after only uploading CIN + selfie. Other documents collected via WhatsApp during week 1 by a human ops agent. Cap: 3 jobs, then hard-blocked until full KYC. | High — kills the document funnel | High — requires only a `kyc_partial` driver state + ops process | Medium — fraud risk if someone uses someone else's CIN | That fraud rate stays under 3% with selfie + CIN cross-check |
| **B** | **"Cash Window in Safi"** — physical settlement point (a partner shop in Safi medina, open 12-2pm and 6-9pm) where drivers can settle their COD float and receive what JAHEEZ owes them in cash. No RIB needed for first 30 days. | Very High — directly attacks the trust anxiety | Medium — needs a partner agreement + reconciliation process + insured cash float | High — converts a wallet/bank rail into a cultural ritual | That same-day in-person settlement is sustainable past 50 active drivers |
| **C** | **"Co-pilot" onboarding** — first 3 deliveries are *shadowed* by a JAHEEZ-employed lead driver via WhatsApp call, walking the new driver through pickup, customer interaction, and COD reconciliation in real time. | High — kills the "what if I mess up" fear | Low at scale — needs paid lead drivers, doesn't scale past ~20 new drivers/week | Medium — high CAC per driver but high LTV if it works | That a 1-hour human investment per new driver pays back in retention |
| **D** | **Referral cash bounty** — existing driver gets 100 dh after their referral completes 10 jobs; new driver gets 50 dh after job #5. | Medium — standard playbook | High — schema change only | High *if* referrals exist; useless cold-start | That after the first 10 hand-recruited drivers, the next 30 come via referral |

---

## Adoption Forces — for recommended concept (**A + B combined**)

| Force | Assessment with A+B applied |
|---|---|
| **Push** (pain of status quo) | Unchanged. Macro condition. ~Medium-High. |
| **Pull** (appeal of new solution) | **Increased.** "I can start *today* with just my CIN, and I cash out tonight at the medina shop." Concrete, immediate, legible. |
| **Anxiety** (fears about switching) | **Significantly reduced.** Document anxiety addressed by partial-KYC. Cash anxiety addressed by physical settlement window. Two of the three biggest fears defused. |
| **Habit** (comfort of current way) | Partially reduced. Driver doesn't have to abandon the moto-taxi stand — they can drive JAHEEZ jobs *between* fares for the first few weeks. We are *additive* income, not replacement. (This needs to be explicit in the messaging.) |
| **Balance** | Push + Pull > Anxiety + Habit ✓ — the design now plausibly tips toward adoption. |

Concept C is held in reserve for the first 10 hand-recruited drivers (where the human investment is affordable and where we'll learn the most). Concept D (referrals) is deferred until we have a base of 20+ drivers who actually like the app — paying bounties before that point pays for noise.

---

## Recommendation

**Build the driver app's first version around Concept A ("Earn While You Verify") and run a 10-driver, 30-day pilot using Concept B ("Cash Window in Safi") and Concept C ("Co-pilot onboarding") as concierge ops.**

What this looks like in code:
- `drivers.kyc_status` enum: `partial` (CIN + selfie only, max 3 jobs) → `full` (all docs approved) → `verified` (all docs approved + first 5 jobs completed clean)
- Onboarding screen #1 = CIN photo + selfie + WhatsApp number, *that's it*. Other documents are a "complete your profile" home-screen card that nags after each job.
- Wallet/earnings screen prominently shows: "COD in your pocket: X dh · JAHEEZ owes you: Y dh · Next cash window: tonight 6-9pm at [partner shop]"
- Dispatch system flags drivers in `partial` state and refuses to assign their 4th job until KYC is full.
- An "Op support" WhatsApp chat link is prominent on every screen for the first 30 days.

### Conviction Level

**Medium.**

- **Would increase to High if:** 5 of the 10 pilot drivers complete 10+ jobs in their first 14 days *and* at least 3 of them refer another driver organically.
- **Would decrease if:** the partial-KYC path produces a fraud incident in the pilot, *or* the cash window operationally costs more than 15 dh per settlement (in which case it's not viable past 50 drivers).
- **Unknowns I can't resolve from this chair:** actual size of the Safi gig-driver pool; willingness of a Safi medina shopkeeper to be the cash window for a 4-5% fee; whether Bank Al-Maghrib KYC rules permit the partial-KYC approach for any wallet activity (likely yes for COD-only, needs checking).

---

## Prototype Plan

**What to build (lowest fidelity that tests the riskiest assumption):**

The riskiest assumption is *"drivers will trust JAHEEZ enough to take a real job after only uploading a CIN."* The cheapest test of that doesn't require an app at all:

1. **Week 1 — Recruit 10 drivers in person** at the moto-taxi stand and the Safi medina taxi area. Pitch in darija, hand them a printed one-pager.
2. **Week 1-2 — Manual dispatch via WhatsApp.** No app. Operator sends "pickup at X, deliver to Y, cash 35 dh, you keep 28 dh, JAHEEZ keeps 7 dh." Driver replies with photo at pickup and at delivery.
3. **Week 2-4 — Cash window pilot** at one Safi shopkeeper, 6-9pm daily. Reconcile floats with each driver. Note every friction point.
4. **Week 4 — Decide.** If 5+ drivers completed 10+ jobs and want to keep going, build the actual app screens around what worked. If not, the spec is wrong about the supply side and we need to revisit before writing a line of Phase C code.

**Who to test with:** 10 drivers, ages 22-40, currently driving moto-taxi or unemployed with own bike, recruited in person, paid 100 dh participation fee + their actual earnings. (Per Nielsen Norman, 5 users surface ~85% of usability problems; we go with 10 because supply-side trust requires more signal than UI testing.)

**What "success" looks like:** ≥5 of 10 complete ≥10 jobs in 14 days; ≥3 say "yes, build the app, I'll keep driving"; cash window settles at <15 dh operational cost per driver per week.

---

## Next Steps (in order of urgency)

1. **Validate the cash-window assumption with one Safi shopkeeper this week.** The whole concept hinges on it. A 30-min in-person conversation kills or confirms it.
2. **Write the 10-driver recruiting script in darija** (1 page). I can draft the structure; the actual translation needs a Safi-native voice.
3. **Write a 5-question JTBD discussion guide** for the recruiting visits — focused on "walk me through last Tuesday's income" rather than "would you use an app?" (Per Moesta: ask about the situation, never the feature.)
4. **Defer all Phase C code** until the 4-week manual-dispatch pilot finishes. Building the app first is the most expensive way to learn we picked the wrong concept.
5. **In parallel (cheap, no risk):** add the `kyc_status` enum + partial-KYC fields to the `drivers` schema so the app, when built, has the data model already aligned with the pilot's findings.

---

## What this analysis is *not*

- Not a substitute for the actual user research. It's a structured set of bets that tells the next research session where to look.
- Not a product spec. It's the upstream of a product spec — the "are we even building the right thing" gate.
- Not a competitive analysis. If you want one, the competitive-analysis skill is the right next call (look at Glovo's Morocco operation, Yassir's driver acquisition in Algeria, and inDrive's negotiated-fare model).
