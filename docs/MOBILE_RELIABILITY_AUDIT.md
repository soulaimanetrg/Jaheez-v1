# JAHEEZ (جاهز) — MOBILE RELIABILITY AUDIT
**Prepared by: Technical Due Diligence Team**  
**Project:** Moroccan Hyperlocal Logistics Platform (Safi Launch)  
**Status:** Medium Risk — Performance and Geolocation Hardening Needed

---

## 1. CRITICAL PERFORMANCE & CRASH RISKS

### Low-End Android Memory Exhaustion (OOM)
* **Risk:** The app bundle loads high-resolution brand illustrations (exceeding 1.5MB each) in the assets directory. Low-end Android devices (common in the Safi target market) will experience Out Of Memory (OOM) crashes when mounting these views.
* **Fix:** Compress all images in `user-app/assets/` and `driver-app/assets/` using compression tools. Ensure no asset image exceeds 200KB.

---

### Blocking Main JS Thread during Hydration
* **Risk:** Multiple synchronous reads to AsyncStorage are made in `useEffect` hooks during app startup (e.g. loading language presets, reading cached session states). On single-core CPU devices, this blocks the main JavaScript thread, locking up the interface and causing Android's "Application Not Responding" (ANR) popups.
* **Fix:** Move blocking reads into asynchronous Promise chains and show a loading skeleton or lightweight native fallback UI while resources load.

---

### Font Loading Failure Blocker
* **Risk:** Google Fonts Cairo is loaded over the network via `@expo-google-fonts/cairo`. On unstable 3G/4G networks, the font loading promise can reject or hang, causing the app to remain stuck on an infinite blank splash screen.
* **Fix:** Maintain the 2-second timeout fallback implemented in `driver-app/app/_layout.tsx` across the user-app layout:
  ```typescript
  const [fontsTimeout, setFontsTimeout] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFontsTimeout(true), 2000);
    return () => clearTimeout(t);
  }, []);
  ```

---

## 2. OFFLINE & GEOLOCATION ISSUES

### Simulated GPS Fallbacks
* **Risk:** Real-time logistics requires continuous driver location tracking. The current driver tracking screen uses simulated mock paths. If the driver loses connection, the UI keeps moving along the mock path, masking connection losses.
* **Fix:** Integrate `expo-location` and stream real coordinates to the Supabase database. Add a connection timeout indicator to the customer screen if no coordinate updates are received for over 30 seconds.

---

### Absence of Offline Mutations Queue
* **Risk:** If a user loses connection during checkout, the app fails with standard fetch errors, losing the cart state.
* **Fix:** Use TanStack React Query's `offline` persist configurations or configure custom offline request queues to retry order creation once connection is re-established.
