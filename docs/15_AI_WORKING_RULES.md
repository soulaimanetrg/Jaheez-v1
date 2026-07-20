# 15. AI WORKING RULES — JAHEEZ

**Purpose:** Guidelines for AI agents working on this codebase | **Last Updated:** 2026-05-19

---

## CRITICAL: Read Before Any Work

1. **Read all 15 markdown documentation files first** — Do not assume anything
2. **Read this file thoroughly** — These are non-negotiable safety rules
3. **Ask if unclear** — Better to ask than guess wrong
4. **Test after risky changes** — Always verify `expo start` still works
5. **Preserve working code** — Never refactor unless explicitly asked

---

## Golden Rules

### Never Break the Build

| Action | Why | What to Do |
|--------|-----|-----------|
| Change package.json | Breaks dependencies | Ask first, run `npm install` after |
| Delete node_modules | Wastes time, may break | Never do this |
| Modify EAS config | Breaks CI/CD | Ask first, test locally |
| Touch tsconfig.json | Breaks TypeScript | Ask first, run type check after |
| Change app.json version | Breaks builds | Let release manager handle |
| Modify any config file | Unknown side effects | Ask first, verify with full build |

### Never Introduce Inconsistency

| Anti-Pattern | Why | What to Do |
|--------------|-----|-----------|
| Hardcode colors (not using brand.ts) | Creates technical debt | Always import from constants/brand.ts |
| Use inline StyleSheet | Creates maintenance burden | Use components/ui/ component |
| Inconsistent button styling | Breaks design system | Match existing button implementation |
| Random component structure | Wastes AI context on next task | Follow folder patterns in codebase |
| Mix UI frameworks (CSS + StyleSheet) | Causes subtle bugs | Never use Tailwind in React Native code |
| Hardcode strings (not using i18n) | Breaks localization | Use i18n keys (AR/FR/EN) |

### Never Ignore Assets

| Situation | What to Do |
|-----------|-----------|
| Image asset missing | Mark as TODO, don't hardcode placeholder |
| Icon variant not found | Create spec for design team, use closest match |
| Illustration doesn't exist | Don't use emoji or placeholder text; document need |
| Font not available | Verify Cairo is correctly imported via Expo fonts |
| Animation asset unavailable | Use Lottie JSON spec or React Native Animated |

### Never Modify Without Reading

| File Type | Rule |
|-----------|------|
| **Screen files** | Read entire file before editing; understand navigation context |
| **Store/state files** | Read before modifying; understand subscriber impact |
| **Type definitions** | NEVER modify shared/types.ts without reviewing all imports |
| **Brand tokens** | NEVER change colors in brand.ts; update tailwind.config.js instead |
| **API files** | Read full API contract before adding endpoints |
| **Database schema** | NEVER modify migrations that already exist; create new migrations |
| **Authentication** | Extremely risky; read full auth flow before any change |

---

## Phase Separation Rules

### These Phases Must Not Mix

**Phase boundaries are hard rules:**

| Phase | Keep Isolated | Reason |
|-------|---------------|--------|
| UI Components | Don't add data fetching | Creates tight coupling, hard to test |
| Styling | Don't add business logic | Violates separation of concerns |
| Auth | Don't touch order/payment logic | Auth is fragile; changes break everything |
| Database schema | Don't add UI in same PR | Review separately |
| Payments | Don't handle order logic | Payments have compliance requirements |

### Example Violations ❌

```typescript
// ❌ BAD: Business logic in component
function CartButton() {
  const handlePress = async () => {
    const order = await fetch(`/api/orders`, { /* data */ });
    setSomeGlobalState(...);
    router.push('/tracking');
  };
  return <Button onPress={handlePress} />;
}

// ✅ GOOD: Separate concerns
function CartButton() {
  const { createOrder } = useOrderStore();
  const handlePress = async () => {
    const orderId = await createOrder(cartItems);
    router.push(`/tracking/${orderId}`);
  };
  return <Button onPress={handlePress} />;
}
```

---

## File Organization Rules

### Never Move Files

| File Type | Why | Action |
|-----------|-----|--------|
| Screen files (in app/) | Breaks routing | NEVER move; create new file if needed |
| Components in folders | Breaks imports | NEVER move; refactor inline if needed |
| Shared types | Breaks monorepo | NEVER move shared/types.ts |
| Brand tokens | Breaks design system | NEVER move constants/brand.ts |
| API files in lib/ | Breaks imports | NEVER move; create new file if needed |

### Folder Structure is Sacred

```
user-app/
  app/
    (auth)/         ← Auth screen files only; NEVER add cart logic here
    (tabs)/         ← Tab navigation screens only
    (flows)/        ← Checkout, tracking, etc.; NEVER add tab content here
  components/
    ui/             ← Shared UI components; NEVER add screens here
  store/            ← Zustand stores only; NEVER add API calls here (use hooks)
  hooks/            ← Custom hooks; NEVER add components here
  lib/              ← API clients; NEVER add UI here
```

---

## Code Style & Patterns

### Always Follow Existing Patterns

**Rule:** If 10 components do it one way, do it that way.  
**Never:** Introduce new patterns unless explicitly approved.

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `OrderCard.tsx`, `BottomSheet.tsx` |
| Hooks | camelCase, `use` prefix | `useOrder()`, `useTracking()` |
| Utilities | camelCase | `calculateTotal()`, `formatPrice()` |
| Types | PascalCase | `Order`, `User`, `Payment` |
| Constants | UPPER_SNAKE_CASE | `MAX_QUANTITY`, `API_TIMEOUT` |
| Screens | PascalCase | `HomeScreen.tsx` (if not using Expo Router) |
| Zustand stores | camelCase | `useOrderStore()`, `useUserStore()` |

### Import Rules

```typescript
// ✅ GOOD: Named imports from index files
import { OrderCard, ProductCard } from '@/components/ui';
import { useOrderStore } from '@/store';

// ✅ GOOD: Absolute imports with @/ alias
import { User, Order } from '@/shared/types';

// ❌ BAD: Relative paths (breaks when moving files)
import OrderCard from '../../../components/ui/OrderCard';

// ❌ BAD: Circular imports
// Don't do this: store -> hook -> component -> store
```

### Component Patterns

```typescript
// ✅ GOOD: Functional component with TypeScript
interface Props {
  order: Order;
  onPress?: (orderId: string) => void;
}

export function OrderCard({ order, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress?.(order.id)}>
      <Text accessibilityLabel={`Order ${order.id}`}>
        {order.id}
      </Text>
    </Pressable>
  );
}

// ❌ BAD: Class component
class OrderCard extends React.Component { ... }

// ❌ BAD: Missing accessibilityLabel
<Text>{order.id}</Text>  // Should have accessibilityLabel
```

### State Management Rules

```typescript
// ✅ GOOD: Zustand for shared state
const useOrderStore = create((set) => ({
  orders: [],
  addOrder: (order) => set((state) => ({
    orders: [...state.orders, order]
  }))
}));

// ✅ GOOD: React Query for server state
const { data: orders, isLoading } = useQuery({
  queryKey: ['orders'],
  queryFn: getOrders
});

// ❌ BAD: useState for global state (causes prop drilling)
const [orders, setOrders] = useState([]);

// ❌ BAD: useEffect for data fetching (use React Query)
useEffect(() => {
  fetch('/api/orders').then(...);
}, []);
```

---

## TypeScript Rules

### Strict Mode is Enabled

| Rule | Example |
|------|---------|
| No `any` type | Use `unknown` if necessary, then narrow type |
| All function params typed | `function getName(user: User): string` |
| All return types specified | `function calculate(): number` |
| Enums not unions | Use `enum OrderStatus` not `type OrderStatus = 'pending' \| 'done'` |
| Interfaces for objects | `interface Order { ... }` not `type Order = { ... }` |

```typescript
// ✅ GOOD
function handleOrderClick(orderId: string): void {
  const order: Order | null = getOrder(orderId);
  if (!order) return;
  router.push(`/order/${order.id}`);
}

// ❌ BAD: any type, no return type
function handleOrderClick(orderId: any) {
  const order: any = getOrder(orderId);
  router.push(`/order/${order.id}`);
}
```

---

## Testing Before Pushing

### Minimum Test Checklist

Before committing any code:

- [ ] **`expo start` still works** — Verify app launches without crash
- [ ] **TypeScript compiles** — Run `npm run type-check` or `tsc --noEmit`
- [ ] **No console errors** — Check Expo console for red boxes
- [ ] **No hardcoded colors** — Search for `#` colors in code
- [ ] **All types valid** — No `any` types introduced
- [ ] **Accessibility present** — All buttons have `accessibilityLabel`
- [ ] **No secrets** — No API keys hardcoded in files
- [ ] **Imports work** — No relative imports, use `@/` alias
- [ ] **Performance acceptable** — App loads < 3 seconds

### For Risky Changes

| Change | Extra Testing | Tool |
|--------|---------------|------|
| Auth flow | Test login/logout/token refresh | Expo + simulator |
| Database schema | Test migrations on fresh DB | Supabase local dev |
| Payment flow | Test with Stripe test mode | Stripe dashboard |
| Navigation | Test back button, deep links | Expo Router docs |
| State management | Test store subscriptions | Zustand logger |
| API changes | Test all consumer components | API testing tool (Postman) |

---

## Commit Message Rules

### Format

```
[PHASE/COMPONENT] Brief description of change

Detailed explanation if needed:
- What was changed
- Why it was changed
- Any trade-offs or side effects

Closes #123  (if fixing an issue)
```

### Examples

```
✅ [Phase 5] Add menu item customization

- Add size selector to ProductDetail
- Add extras checkbox list
- Validate customization before add to cart
- Update cartStore to include customization data

Closes #45

❌ [broken] fix stuff
❌ Update cart
❌ Add new feature
```

### NEVER commit without documenting

```bash
# ❌ BAD
git commit -m "wip"
git commit -m "fixes"
git commit -m "update"

# ✅ GOOD
git commit -m "[Phase 6] Fix cart quantity calculation

- Fix decimal rounding error in total calculation
- Add test case for $9.99 × 3 order
- Verify payment amount matches displayed total

Closes #123"
```

---

## Documentation Rules

### When to Comment Code

**DO comment:**
- Complex algorithms (A* pathfinding, payment calculations)
- Non-obvious business logic (why an order was cancelled)
- Workarounds or hacks (with TODO to fix later)
- Integration with external services (Stripe payment flow)

**DON'T comment:**
- Obvious code (`const name = user.name; // get name`)
- Self-documenting function names
- Simple loops and conditions
- UI rendering (obvious from JSX)

### Example

```typescript
// ✅ GOOD: Explains non-obvious behavior
// Order cost calculation must round to nearest 0.01 before
// payment to match Stripe's precision, not after (causes $0.01 diffs)
const roundedTotal = Math.round(total * 100) / 100;

// ❌ BAD: Obvious code commented
// Set order ID
const orderId = order.id;
// Loop through items
items.forEach(item => { ... });
```

---

## Dangerous Operations

### ABSOLUTELY FORBIDDEN

| Operation | Why | Alternative |
|-----------|-----|-------------|
| `DELETE FROM orders` in prod | Permanent data loss | Contact backup team |
| Modify auth.users table directly | Breaks authentication | Use Supabase Auth UI |
| Change primary keys | Breaks all foreign keys | Create new table, migrate data |
| Update types.ts without review | Breaks monorepo | Request code review first |
| Deploy to production without testing | Breaks app for all users | Always soft launch first |
| Hardcode Stripe/API keys | Exposes secrets | Use environment variables |
| Remove error handling | Crashes app silently | Add better error handling instead |
| Ignore TypeScript errors | Hidden bugs | Fix all errors, no `@ts-ignore` |

### If You Do This By Accident

1. **Stop immediately** — Don't compound the mistake
2. **Revert the change** — `git revert <commit>`
3. **Tell the team** — Communication > secrecy
4. **Restore from backup** — If data was deleted
5. **Write a post-mortem** — Learn for next time

---

## Escalation Path

### When to Ask for Help

**Ask before:**
- Making changes to shared/types.ts
- Modifying database schema
- Touching authentication logic
- Changing brand colors or design tokens
- Installing new dependencies
- Modifying build configuration
- Deploying to production

**Escalate if:**
- Something breaks that doesn't have an obvious fix
- You find a security vulnerability
- You discover conflicting requirements in docs
- You're asked to do something this guide forbids
- Change would take > 4 hours to undo

---

## Common Mistakes (Don't Repeat)

| Mistake | How to Avoid | Result of Mistake |
|---------|-------------|---|
| Hardcode color instead of using brand.ts | Always import from constants/brand.ts | Inconsistent colors, breaks design |
| Put business logic in component | Use custom hooks or Zustand | Hard to test, component bloat |
| Forget accessibilityLabel on buttons | Checklist before commit | App fails accessibility audit |
| Use hardcoded string instead of i18n key | Search for i18n usage patterns | App won't translate to French |
| Circular imports (store → hook → component) | Check import chain before committing | Build fails mysteriously |
| Modify existing migration file | Create new migration instead | Database consistency breaks |
| Remove @ts-ignore without fixing | Fix underlying type error | Hidden bugs surface later |
| Commit secrets to git | Use .env, add to .gitignore | Exposes API keys, security risk |
| Don't read file before editing | Read entire file first | Break existing functionality |

---

## Workflow for New Features

### Step-by-Step Process

1. **Read the docs** (all 15 files, especially relevant ones)
2. **Ask clarifying questions** if requirements unclear
3. **Plan on paper** (pseudocode, wireframe, state flow)
4. **Create types first** (define data shape in shared/types.ts)
5. **Build components** (UI components first, no logic)
6. **Add state management** (Zustand store or React Query)
7. **Add API calls** (in lib/ or hooks)
8. **Connect everything** (wire hooks to components)
9. **Test thoroughly** (expo start, check console, test all flows)
10. **Commit with detail** (document what and why)
11. **Wait for code review** (before merging)

### Example: Adding a New Feature (Wallet Balance Display)

```
1. Read docs
   └─ Docs say: Wallet should show balance, transaction history

2. Check current state
   └─ wallet.tsx only redirects to home; implementation missing

3. Define types
   └─ Add Wallet interface to shared/types.ts
   └─ Add WalletTransaction interface

4. Create UI components
   └─ Create WalletCard component showing balance
   └─ Create TransactionItem component for history

5. Add state
   └─ Create useWalletStore in store/walletStore.ts
   └─ Add getBalance() and getTransactions() actions

6. Add API
   └─ Create walletApi.ts in lib/
   └─ Add fetchBalance(userId) and fetchTransactions(userId)

7. Connect in screen
   └─ Import store and hook in wallet.tsx
   └─ Add useEffect to load data on mount
   └─ Render WalletCard and TransactionList

8. Test
   └─ Run expo start
   └─ Verify no TypeScript errors
   └─ Test wallet loads data
   └─ Check console for errors

9. Commit
   └─ [Phase 9] Add wallet balance display
   └─ Document: types added, components, store, API
```

---

## Performance Guidelines

### Optimize For

| Metric | Target | How to Test |
|--------|--------|-----------|
| App startup | < 3 seconds | Time from icon tap to first screen render |
| Screen transition | < 300ms | Smooth navigation between screens |
| Search result | < 1 second | Query to results displayed |
| Image load | < 500ms | Image downloaded and rendered |
| API response | < 500ms | Server responds (p95) |

### Avoid

- [ ] Large images (> 500KB) — Compress to WebP
- [ ] Rendering 1000+ items in list — Use FlatList pagination
- [ ] Re-renders on every keystroke — Use useCallback
- [ ] Large bundle size — Check with `expo-bundle-visualizer`
- [ ] Memory leaks — Always cleanup subscriptions in useEffect

---

**Created:** 2026-05-19 | **Method:** Industry best practices + codebase-specific rules | **Confidence:** High
