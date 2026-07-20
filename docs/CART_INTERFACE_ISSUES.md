# Cart (Panier) Interface — Issues & Recommendations

**Date:** 2026-07-19  
**File:** `frontend/user-app/app/(flows)/cart.tsx` (1367 lines)  
**Store:** `frontend/user-app/features/orders/store/cartStore.ts` (Zustand + AsyncStorage persistence)

---

## 🔴 CRITICAL: Why the whole interface refreshes on +/- clicks

### Root cause: **Entire cart re-keys on store switch**

**Line 437-442:**
```tsx
<MotiView
  key={activeStoreId}  // ← PROBLEM: new key = full unmount/remount
  from={{ opacity: 0, translateY: 6 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'timing' as any, duration: 180 }}
  style={styles.itemsBlock}
>
```

Every time `activeStoreId` changes, React destroys the entire item list and re-creates it from scratch with entrance animations. But `activeStoreId` **also changes inside `updateQuantity`** when the cart becomes empty (line 168 in cartStore):

```ts
updateQuantity: (cartLineId, quantity) => {
  // ... if last item removed ...
  return activeState(carts, items.length ? storeId : (Object.keys(carts)[0] || null));
  //                                           ^^^^^^^ activeStoreId switches to next cart
}
```

**What happens:**
1. User taps `-` on last item in a multi-cart scenario
2. `updateQuantity` removes the item and switches `activeStoreId` to the next cart
3. The `<MotiView key={activeStoreId}>` sees a new key
4. React unmounts the entire items block and re-mounts with animation
5. **All items flash/refresh even though only one changed**

Even without multi-cart, the `key={activeStoreId}` causes unnecessary full re-renders when switching between carts.

### Fix 1: Remove the unstable key
```tsx
<MotiView
  // Remove: key={activeStoreId}
  from={{ opacity: 0, translateY: 6 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'timing' as any, duration: 180 }}
  style={styles.itemsBlock}
>
```

Each item already has its own stable key (`item.id || item.menu_item_id`), so React will diff them correctly without needing a container key.

### Fix 2: Memoize the item render
Wrap each cart item in `React.memo` or extract to a separate component with stable props so quantity changes don't cascade.

---

## 🟡 MEDIUM: Back button requires multiple clicks

### Root cause: **Async router check + focus effects racing**

**Line 286:**
```tsx
onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
```

`router.canGoBack()` can return stale state if:
- The focus effect (line 254-268) is running an async `getStoreById` call
- The checkout quote hook (`useCheckoutQuote`) is refetching
- React Navigation's state hasn't settled after a deep link or tab switch

**Symptoms:**
- First tap: `canGoBack()` returns false even though history exists → does nothing or wrong action
- Second tap: state has settled → actually goes back

### Fix: Simplify to always call `router.back()` with a fallback
```tsx
onPress={() => {
  try {
    router.back();
  } catch {
    router.replace('/(tabs)');
  }
}}
```

Or use the Expo Router `useNavigation()` hook which has more reliable history tracking.

---

## 🟡 MEDIUM: Hardcoded values

| Line | Issue | Recommendation |
|------|-------|----------------|
| 34-35 | `const SIDE = 16; const PRODUCT_SIDE = 8;` | Move to `constants/spacing.ts` as `SPACING.SCREEN_HORIZONTAL` |
| 109-128 | All labels hardcoded in component | Extract to `constants/translations.ts` or `i18n/cart.json` |
| 396-400 | Promo banner text hardcoded with manual ar/fr/en switches | Use translation function with interpolation: `t('cart.storewidePromo', { percent })` |
| 641 | `insets.bottom + 104` | Magic number 104 (sticky button height?) — extract to `const STICKY_BUTTON_CLEARANCE = 104` |
| 909-915 | Quantity stepper dimensions hardcoded (104×38, borderRadius 19) | Extract to `CART_STYLES` config or theme |
| 1343-1366 | `BRAND.PROMO_BG` and promo banner styles | Good (already using BRAND constants) |

### Most critical: Translation strings
The component has **50+ hardcoded translation strings** inline (lines 109-128 define the `L` object fresh on every render). Move these to a shared i18n file:

```ts
// constants/translations/cart.ts
export const cartTranslations = {
  ar: {
    title: 'السلة',
    emptyTitle: 'السلة فارغة',
    // ... all 20+ strings
  },
  fr: { /* ... */ },
  en: { /* ... */ }
};
```

Then in component:
```tsx
const t = cartTranslations[lang] || cartTranslations.fr;
```

---

## 🟢 LOGIC Issues

### 1. **Promo code cleared on every quantity change** (line 131, 144, 154, 176)
Every `updateQuantity`, `removeItem`, `replaceItem` call sets `promoCode: null`. This means:
- User applies a promo code
- User adjusts quantity → promo is cleared → user has to re-enter it

**Rationale:** The backend re-validates the promo on checkout anyway, so clearing client-side is defensive but harsh. Better UX: keep the promo until the server rejects it.

**Fix:** Remove `promoCode: null` from quantity mutations, only clear on explicit user action or server rejection.

### 2. **Store closed check runs on every focus** (line 254-268)
The `useFocusEffect` fetches store hours every time the screen gains focus, even if the user just tabbed away for 2 seconds. This causes unnecessary flashing of the "Store closed" warning.

**Fix:** Add a timestamp cache:
```tsx
const lastCheckedRef = useRef<number>(0);
if (Date.now() - lastCheckedRef.current < 60_000) return; // 1-min cache
```

### 3. **Quantity update doesn't validate max stock** (line 489)
The `+` button always allows increment with no upper bound. If the backend enforces stock limits, the user only discovers it at checkout (poor UX).

**Fix:** Check `serverQuote?.items` for `max_quantity` or `available_stock` and disable the `+` button when reached.

### 4. **Active item details modal doesn't update live** (line 171-172)
`activeItemDetails` is set once when the user taps. If they then change quantity via the stepper, the modal shows stale data until they close and reopen it.

**Fix:** Either:
- Close the modal on any cart mutation, or
- Make `activeItemDetails` a ref to `items[index]` so it stays reactive

---

## 🟢 ANIMATION Issues

### 1. **MotiView entrance animations on every render** (lines 311-336, 437-442, 524-528, 581-585, 600-603, 646-649)
Six separate `<MotiView from={{...}} animate={{...}}>` blocks run entrance animations **every time the component renders**, not just on mount. Combined with the key issue above, this causes constant flashing.

**Fix:**
- Only animate on true mount (check `useEffect` + state)
- Or remove `from={}` and rely on layout animations instead
- Use `AnimatePresence` for item add/remove, not blanket entrance animations

### 2. **Scroll-driven header animations recalculate on every scroll event** (lines 200-216)
Perfectly fine, but worth noting: `scrollY.interpolate` runs 60 times/second. If performance becomes an issue, throttle or use `useSharedValue` from `react-native-reanimated`.

---

## 🟢 ACCESSIBILITY

### Good:
- Every interactive element has `accessibilityRole` and `accessibilityLabel` ✅
- RTL support is thorough (`dirRow`, `dirText`, `dirItems`) ✅
- Color contrast is good (BRAND.RED on white, etc.) ✅

### Missing:
- No `accessibilityHint` on complex actions (e.g., "Double-tap to view details")
- Stepper buttons don't announce current quantity on focus (screen readers won't know "2" without looking at the label)
- Modal doesn't auto-focus the close button or trap focus

---

## 🎨 UI/UX Observations

### What's done well:
1. **Backend-authoritative pricing** — `quoteForItem()` always defers to `serverQuote`, never trusts client `unit_price` ✅
2. **Promo banner** — store-level promotions are prominently displayed (line 388-402) ✅
3. **Multi-cart support** — horizontal pills to switch between stores (lines 406-435) ✅
4. **Loading states** — spinner while fetching quote, retry button on error (lines 606-624) ✅
5. **Detailed item modal** — tapping an item shows supplements breakdown (lines 665-762) ✅

### Could improve:
1. **No "Continue shopping" CTA** — user can only tap back or the empty-state button
2. **Delivery note buried** — it's below the items; consider moving it to checkout
3. **Item edit flow unclear** — the pencil icon (line 501-506) pushes to the store screen with query params, but users might expect an inline edit
4. **No quantity input** — users can only tap +/- ; for bulk orders (10+ items) this is tedious. Consider a long-press → number input.

---

## 📋 Recommended Changes (Priority Order)

### 🔴 Must fix (breaks UX):
1. **Remove `key={activeStoreId}` from MotiView** (line 438) — stops the whole-interface refresh
2. **Fix back button** (line 286) — replace conditional with try/catch `router.back()`

### 🟡 Should fix (polish):
3. **Extract translations** — move `L` object to `constants/translations/cart.ts`
4. **Stop clearing promo on quantity change** — only clear on user action or server rejection
5. **Cache store-hours check** — add 1-min throttle to `useFocusEffect`
6. **Memoize item cards** — wrap in `React.memo` to prevent cascade re-renders

### 🟢 Nice to have:
7. **Max quantity validation** — disable `+` when stock limit reached
8. **Remove entrance animations** — or gate them to true mount only
9. **Accessibility hints** — add `accessibilityHint` to complex actions
10. **Long-press quantity input** — for bulk adjustments

---

## Code Locations Summary

| Issue | File | Lines |
|-------|------|-------|
| Refresh on quantity change | `cart.tsx` | 438 (key), 159-178 (store updateQuantity) |
| Back button multi-click | `cart.tsx` | 286 |
| Hardcoded translations | `cart.tsx` | 109-128 |
| Promo cleared on edit | `cartStore.ts` | 131, 144, 154, 176 |
| Store hours refetch spam | `cart.tsx` | 254-268 |
| No max quantity check | `cart.tsx` | 489 |
| Stale modal data | `cart.tsx` | 171-172 |
| Redundant animations | `cart.tsx` | 311, 437, 524, 581, 600, 646 |

---

**Next steps:** Implement fixes 1-6 above, then test with a multi-store cart and rapid +/- taps to verify the refresh issue is gone.
