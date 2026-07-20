# JAHEEZ (جاهز) — UI/UX STRICT AUDIT
**Prepared by: Technical Due Diligence Team**  
**Project:** Moroccan Hyperlocal Logistics Platform (Safi Launch)  
**Status:** Medium Risk — Visual Inconsistencies & Mock Components Present

---

## 1. DESIGN SYSTEM VIOLATIONS

### Hardcoded Off-Palette Hex Colors
* **Issue:** While [brand.ts](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/constants/brand.ts) defines brand colors (RED, YELLOW), components still use hardcoded color strings.
* **Example:** In [tracking/[id].tsx](file:///c:/Users/user/Desktop/jaheeez/jaheez-v1/user-app/app/%28flows%29/tracking/%5Bid%5D.tsx), colors like `'#F5F0EB'`, `'#F9E8EF'`, `'#C4548A'` are hardcoded into views.
* **Fix:** Move all colors to the central brand palette and reference them strictly via tokens.

---

### Inconsistent Spacing & Margins
* **Issue:** layout margins use random spacing values (e.g. `marginHorizontal: -20`, `height: 250`, `marginTop: 32`) instead of referencing the `SPACE` structure in `brand.ts`.
* **Fix:** Enforce strict spacing metrics across all screens.

---

## 2. AMATEUR & "VIBE-CODED" PATTERNS

### Simulated Map Grid
* **Issue:** The order tracking screen renders absolute positioned lines on a beige background to draw a simulated map. This mockup looks junior and unprofessional.
* **Fix:** Replace the mock drawing grid with a real MapView control (e.g., Google Maps API).

---

### Fake AI Prompts
* **Issue:** The AI assistant screen is a mockup that walks through pre-defined intervals to simulate analysis steps.
* **Fix:** Delete the AI assistant page entirely.

---

## 3. RTL & BILINGUAL ALIGNMENT ISSUES

### Arabic Text Alignment Gaps
* **Issue:** Mixed-language strings (Arabic and French text labels) cause layout breaks and text clipping on low-resolution mobile devices.
* **Fix:** Wrap all text items inside flexible layout containers and set `textAlign: 'right'` explicitly for RTL locale.
