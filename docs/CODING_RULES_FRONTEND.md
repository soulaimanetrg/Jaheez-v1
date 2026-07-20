# JAHEEZ — Frontend Coding Rules

> **Purpose**: TypeScript rules, React Native rules, NativeWind rules, state management, hook patterns, component patterns, naming rules, forbidden patterns, and review standards for all frontend code (user-app, driver-app).  
> **Companion**: See `CODING_RULES_BACKEND.md` for Supabase, Edge Functions, and database rules.

---

## 1. TypeScript Rules

### Strict Mode Always

```
// tsconfig.json — these must be enabled
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Type Rules

| Rule | Example |
|---|---|
| **No `any` type** | Use proper types from `shared/types.ts` |
| **No type assertions unless necessary** | Avoid `as any`, `as unknown` |
| **Use interfaces for objects** | `interface Order { ... }` not `type Order = { ... }` |
| **Use type aliases for unions/primitives** | `type OrderStatus = 'pending' \| 'completed'` |
| **All function parameters typed** | `function create(input: CreateOrderInput): Promise<Order>` |
| **All return types explicit on hooks** | `function useAuth(): AuthReturn { ... }` |
| **Use `as const` for constants** | `export const BRAND = { ... } as const` |
| **Prefer readonly where possible** | `readonly items: CartItem[]` |

### Import Rules

```typescript
// ✅ CORRECT import order (always follow this sequence)
import { useState, useEffect } from 'react';           // 1. React
import { View, Text, Pressable } from 'react-native';  // 2. React Native
import { router } from 'expo-router';                   // 3. Expo
import { useQuery } from '@tanstack/react-query';       // 4. Third-party
import { Button, Card } from '@/components/ui';         // 5. Internal components
import { useOrder } from '@/hooks/useOrder';            // 6. Hooks
import { BRAND } from '@/constants/brand';              // 7. Constants
import type { Order } from '@/shared/types';            // 8. Types (always last)
```

### Generic Types

```typescript
// ✅ Use these project-standard generic wrappers
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
```

---

## 2. React Native Rules

### Component Structure

Every screen file follows this exact structure:

```typescript
// 1. Imports (in order specified above)
// 2. Type definitions (if screen-local)
// 3. Component function
// 4. Default export (screens only)

export default function ScreenName() {
  // A. Hooks (all hooks at the top)
  const { user } = useAuth();
  const { orders, isLoading, error } = useOrder();

  // B. Local state
  const [selectedFilter, setSelectedFilter] = useState('all');

  // C. Derived values
  const filteredOrders = orders.filter(/* ... */);

  // D. Handlers
  const handlePress = () => { /* ... */ };

  // E. Guard clauses (loading, error, empty)
  if (isLoading) return <Loader fullScreen />;
  if (error) return <EmptyState icon="⚠️" title="حدث خطأ" subtitle={error} />;
  if (!orders.length) return <EmptyState icon="📦" title="لا توجد طلبات" />;

  // F. Main render
  return (
    <View className="flex-1 bg-[#FEFCE8]">
      {/* Screen content */}
    </View>
  );
}
```

### Component Best Practices

| Do | Don't |
|---|---|
| Use `Pressable` for all tappable elements | Use `TouchableOpacity` or `TouchableHighlight` |
| Use `FlatList` for scrollable lists | Use `ScrollView` with `.map()` for long lists |
| Use `KeyboardAvoidingView` for forms | Let keyboard cover inputs |
| Use `SafeAreaView` for root containers | Ignore safe area insets |
| Use Expo Router for navigation | Use React Navigation directly |
| Use `Image` from expo-image for performance | Use RN core `Image` for network images |

### Performance Rules

1. **Memoize expensive components** with `React.memo()` when props change rarely
2. **Use `useCallback`** for handlers passed to child components
3. **Use `useMemo`** for expensive computations (filtered lists, sorted data)
4. **Never create objects in render** — move to `useMemo` or outside component
5. **FlatList must have `keyExtractor`** — use `item.id`, never index
6. **Avoid re-renders** — use Zustand selectors, not entire store consumption

```typescript
// ✅ CORRECT — select only what you need from Zustand
const user = useAuthStore((state) => state.user);

// ❌ WRONG — re-renders on any store change
const store = useAuthStore();
```

---

## 3. NativeWind Rules

### Style Rules

| Rule | Detail |
|---|---|
| **All styling via NativeWind classes** | `className="p-4 flex-row items-center"` |
| **No inline styles** | Never `style={{ padding: 16, flexDirection: 'row' }}` |
| **Exception**: Dynamic values from brand tokens | `style={{ backgroundColor: BRAND.RED }}` when class can't express it |
| **Exception**: Animated values | `style={{ transform: [{ scale: animatedValue }] }}` |

### When Inline Styles ARE Allowed

Only in these specific cases:

```typescript
// ✅ Dynamic brand token values
<View style={{ backgroundColor: BRAND.YELLOW_LIGHT }}>

// ✅ Animated values (React Native Animated)
<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>

// ✅ Computed dimensions
<View style={{ height: screenHeight * 0.35 }}>

// ❌ NEVER — use NativeWind class instead
<View style={{ padding: 16, borderRadius: 12 }}>
// ✅ CORRECT
<View className="p-4 rounded-xl">
```

### Common NativeWind Patterns

```typescript
// Layout
className="flex-1"                       // flex: 1
className="flex-row"                     // flexDirection: 'row'
className="items-center justify-center"  // center both axes
className="self-end"                     // alignSelf: 'flex-end'

// Spacing
className="p-4"     // padding: 16px
className="px-4"    // paddingHorizontal: 16px
className="mt-2"    // marginTop: 8px
className="gap-3"   // gap: 12px

// Typography
className="text-base font-semibold"  // 16px, 600 weight
className="text-sm text-gray-500"    // 14px, gray color

// Borders
className="border border-gray-200 rounded-2xl"  // 1px border, 16px radius
className="rounded-full"                        // pill / circle

// Sizing
className="h-[52px] w-full"  // exact height, full width
className="min-h-[44px]"     // minimum touch target
```

---

## 4. State Management Rules

### When to Use What

| State Type | Tool | Persist? | Example |
|---|---|---|---|
| **Server data** | React Query | Cache (auto) | Orders list, user profile, messages |
| **Auth state** | Zustand + AsyncStorage | Yes | Current user, session tokens |
| **Cart** | Zustand + AsyncStorage | Yes | Cart items, selected store |
| **Active tracking** | Zustand (session) | No | Active order being tracked |
| **Location** | Zustand (session) | No | User's cached GPS coordinates |
| **Form inputs** | useState | No | Text field values, selections |
| **UI toggles** | useState | No | Modal visibility, selected tab |
| **Animation values** | useSharedValue (Reanimated) | No | Spring/timing animations |

### React Query Conventions

```typescript
// ✅ Query key convention: [entity, ...params]
useQuery({ queryKey: ['orders', userId], queryFn: ... });
useQuery({ queryKey: ['order', orderId], queryFn: ... });
useQuery({ queryKey: ['chat-messages', orderId], queryFn: ... });

// ✅ Mutation with cache invalidation
useMutation({
  mutationFn: (data) => api.createOrder(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});

// ✅ Configure stale time per use case
useQuery({
  queryKey: ['orders', userId],
  queryFn: () => api.getOrderHistory(userId, 1),
  staleTime: 30_000,  // 30 seconds before refetch
});
```

### Zustand Store Rules

```typescript
// ✅ CORRECT — typed store with clear actions
interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null, isLoading: false }),
    }),
    { name: 'auth-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

---

## 5. Hook Rules

### Structure

Every custom hook follows this pattern:

```typescript
export function useXxx(params?: ParamType): ReturnType {
  // 1. External hooks
  const queryClient = useQueryClient();
  const store = useXxxStore((s) => s.value);

  // 2. React Query for data fetching
  const query = useQuery({ ... });

  // 3. Mutations
  const createMutation = useMutation({ ... });

  // 4. Realtime subscriptions (with cleanup)
  useEffect(() => {
    const channel = supabase.channel('xxx').subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dependency]);

  // 5. Return a clean, typed object
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    create: createMutation.mutateAsync,
  };
}
```

### Hook Rules

1. **One hook per concern** — `useAuth` for auth, `useOrder` for orders
2. **Hooks call `lib/api.ts`** — never use Supabase client directly in hooks
3. **Exception**: Realtime subscriptions can use `supabase.channel()` directly
4. **Always clean up** subscriptions in `useEffect` return function
5. **Never throw from hooks** — return error as a string in the return object
6. **All async errors are caught** — wrap in try/catch, return `{ data: null, error: message }`

### Forbidden Hook Patterns

```typescript
// ❌ WRONG — hook calling supabase directly for queries
const { data } = await supabase.from('orders').select('*');

// ✅ CORRECT — hook calling api.ts
const { data } = await api.getOrderHistory(userId, page);

// ❌ WRONG — business logic in the component
// ✅ CORRECT — business logic in the hook, component calls hook
```

---

## 6. Component (`components/ui/`) Rules

### Purity Contract

Every component in `components/ui/` must be:

1. **Pure** — No API calls, no hooks that fetch data, no Supabase imports
2. **Stateless** (mostly) — Local state only for animations, toggles, internal UI logic
3. **Typed** — Every prop has a TypeScript type, interface exported alongside component
4. **Accessible** — `accessibilityLabel` required on all interactive elements
5. **Animated** — Must include press animations and transition animations per DESIGN_SYSTEM_RULES

### Component Template

```typescript
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  isDisabled?: boolean;
  accessibilityLabel: string; // REQUIRED
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
  accessibilityLabel,
}: ButtonProps) {
  // Animation values
  const scale = useSharedValue(1);

  // Event handlers
  const handlePressIn = () => { scale.value = withSpring(0.97, SPRING_SNAPPY); };
  const handlePressOut = () => { scale.value = withSpring(1, SPRING_SNAPPY); };

  return (
    <Animated.View style={{ transform: [{ scale: scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled || isLoading}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        className={/* variant-specific classes */}
      >
        {isLoading ? <Loader /> : <Text>{label}</Text>}
      </Pressable>
    </Animated.View>
  );
}
```

---

## 7. Navigation Rules

### Expo Router Patterns

```typescript
// ✅ Navigate forward (pushes onto stack)
router.push('/(flows)/custom-request');
router.push(`/(flows)/tracking/${orderId}`);

// ✅ Replace (no back button to previous)
router.replace('/(tabs)/');
router.replace('/(auth)/splash');

// ✅ Go back
router.back();

// ✅ Pass params via URL
router.push(`/(flows)/tracking/${order.id}`);
// Receive in screen:
const { id } = useLocalSearchParams<{ id: string }>();

// ❌ NEVER use setTimeout for navigation
setTimeout(() => router.push('/home'), 2000); // WRONG

// ❌ NEVER import another screen directly
import HomeScreen from '../(tabs)/index'; // WRONG
```

---

## 8. Error Handling Rules

### In Hooks

```typescript
async function createOrder(input: CreateOrderInput): Promise<ApiResponse<Order>> {
  try {
    const result = await api.createOrder(input, userId);
    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
    return { data: null, error: message };
  }
}
```

### In Screens

```typescript
// Every screen must handle ALL states
const { data: orders, isLoading, error } = useOrder();

if (isLoading) return <Loader fullScreen />;
if (error) return <EmptyState icon="⚠️" title="حدث خطأ" subtitle={error} />;
if (!orders?.length) return <EmptyState icon="📦" title="لا توجد طلبات" />;

return <OrderList orders={orders} />;
```

### Error Display Rules

| Error Type | Display |
|---|---|
| Network error | `EmptyState` with retry button |
| Validation error | Inline field error text in ERROR_RED |
| Auth error | Toast or inline error below form |
| Server error | Full screen `EmptyState` with generic message |
| Moderation rejection | Highlighted error card with explanation |

---

## 9. Forbidden Patterns

Every pattern listed below **must never appear** in front-end code:

```typescript
// ❌ Hardcoded color
style={{ backgroundColor: '#EF4444' }}
className="bg-red-500"  // No Tailwind color classes — use brand tokens

// ❌ Inline styles (when NativeWind works)
<View style={{ padding: 16, flexDirection: 'row' }}>

// ❌ any type
const handleData = (data: any) => { ... }
function process(items: any[]) { ... }

// ❌ Business logic in component
export function OrderCard({ order }) {
  const supabase = createClient(...); // NEVER
  const cancel = async () => await supabase.from('orders')... // NEVER
}

// ❌ Direct supabase call in screen
const { data } = await supabase.from('orders').select('*');

// ❌ Missing loading/error/empty states
return <OrderCard order={order} />; // What if null? Loading?

// ❌ setTimeout for navigation
setTimeout(() => router.push('/home'), 2000);

// ❌ Missing accessibilityLabel
<Pressable onPress={handlePress}>  // MISSING LABEL

// ❌ Default export on non-screen files
export default function Button() { ... } // WRONG for component

// ❌ Importing screen from another screen
import LoginScreen from '../login'; // NEVER
```

---

## 10. Frontend Review Standards

Before any frontend code is accepted, verify:

| # | Check | How |
|---|---|---|
| 1 | No hardcoded colors | Search for hex values outside `brand.ts` |
| 2 | No `any` types | TypeScript compiler with `strict: true` |
| 3 | No inline styles (unnecessary) | Search for `style={{` in components |
| 4 | Loading state handled | Every `useQuery` has `isLoading` guard |
| 5 | Error state handled | Every `useQuery` has `error` guard |
| 6 | Empty state handled | Every list has an `EmptyState` fallback |
| 7 | Accessibility labels | Every `Pressable` and `Image` has `accessibilityLabel` |
| 8 | Named exports | No `export default` except screen files |
| 9 | Animations present | Press animations on interactive elements |
| 10 | Types from `shared/types.ts` | No inline type definitions |
| 11 | API calls through `lib/api.ts` | No direct Supabase calls in screens/hooks (except Realtime) |
| 12 | NativeWind classes used | `className` for all static styles |

---

*Write code that's typed, styled, animated, and accessible. No shortcuts.*
