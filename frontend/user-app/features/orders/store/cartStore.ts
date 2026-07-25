import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem } from '@shared/types';
import { generateSecureUUID } from '@/lib/uuid';

/** A cart line is a customer draft, never a source of price or availability truth. */
export type CartLine = CartItem & { cart_line_id: string };

export interface StoreCart {
  storeId: string;
  storeName: string;
  items: CartLine[];
  promoCode: string | null;
  deliveryNote: string;
  storeLogo?: string | null;
}

export interface CartStoreState {
  // Kept temporarily to migrate persisted carts. New writes use one active store cart.
  carts: Record<string, StoreCart>;
  activeStoreId: string | null;
  items: CartLine[];
  storeId: string | null;
  storeName: string;
  promoCode: string | null;
  deliveryNote: string;
  storeLogo: string | null;
  getItemCount: () => number;
  getItemById: (cartLineId: string) => CartLine | undefined;
  getActiveCarts: () => StoreCart[];
  addItem: (item: CartItem) => boolean;
  replaceItem: (cartLineId: string, item: CartItem) => void;
  removeItem: (cartLineId: string) => void;
  updateQuantity: (cartLineId: string, quantity: number) => void;
  setPromo: (code: string) => void;
  clearPromo: () => void;
  setDeliveryNote: (note: string) => void;
  clearCart: (storeId?: string) => void;
  setStore: (storeId: string, storeName: string, storeLogo?: string | null) => boolean;
  replaceActiveStore: (storeId: string, storeName: string, storeLogo?: string | null) => void;
  setActiveStoreId: (storeId: string | null) => void;
}

export const MAX_CART_LINE_QUANTITY = 50;
export const MAX_CART_TOTAL_UNITS = 100;

export function cartLineSignature(item: Pick<CartItem, 'menu_item_id' | 'selected_options'>): string {
  const options = (item.selected_options || [])
    .map((option) => `${option.option_id}:${option.choice_id}`)
    .sort()
    .join('|');
  return `${item.menu_item_id}|${options}`;
}

function makeCartLineId(): string {
  return `line:${generateSecureUUID()}`;
}

function normalizeLine(item: CartItem | Partial<CartLine>): CartLine {
  const cartLineId = (item as Partial<CartLine>).cart_line_id || makeCartLineId();
  const optionKeys = new Set<string>();
  const selectedOptions = (item.selected_options || []).filter((option) => {
    const key = `${option.option_id}:${option.choice_id}`;
    if (!option.option_id || !option.choice_id || optionKeys.has(key)) return false;
    optionKeys.add(key);
    return true;
  }).slice(0, 20).map((option) => {
    // Preserve backend-provided price_delta; clamp to finite non-negative value
    const rawDelta = Number(option.price_delta ?? 0);
    const safeDelta = Number.isFinite(rawDelta) && rawDelta >= 0 ? rawDelta : 0;
    return { ...option, price_delta: safeDelta };
  });
  return {
    ...item,
    id: cartLineId,
    cart_line_id: cartLineId,
    menu_item_id: item.menu_item_id || '',
    name: item.name || '',
    name_ar: item.name_ar || '',
    quantity: Math.min(MAX_CART_LINE_QUANTITY, Math.max(1, Math.trunc(Number(item.quantity) || 1))),
    unit_price: Number(item.unit_price) || 0,
    store_id: item.store_id || '',
    selected_options: selectedOptions,
  } as CartLine;
}

function mergeNormalizedLines(items: Array<CartItem | Partial<CartLine>>): CartLine[] {
  const merged = new Map<string, CartLine>();
  let remainingUnits = MAX_CART_TOTAL_UNITS;
  for (const candidate of items) {
    if (remainingUnits <= 0) break;
    const line = normalizeLine(candidate);
    if (!line.menu_item_id) continue;
    const signature = cartLineSignature(line);
    const existing = merged.get(signature);
    const nextQuantity = Math.min(
      MAX_CART_LINE_QUANTITY,
      remainingUnits + (existing?.quantity || 0),
      (existing?.quantity || 0) + line.quantity,
    );
    const addedUnits = nextQuantity - (existing?.quantity || 0);
    if (addedUnits <= 0) continue;
    merged.set(signature, existing ? { ...existing, quantity: nextQuantity } : { ...line, quantity: addedUnits });
    remainingUnits -= addedUnits;
  }
  return Array.from(merged.values());
}

function normalizeCart(cart: Partial<StoreCart>, fallbackStoreId: string): StoreCart {
  return {
    storeId: cart.storeId || fallbackStoreId,
    storeName: cart.storeName || '',
    items: mergeNormalizedLines(cart.items || []).map((item) => ({ ...item, unit_price: 0 })),
    promoCode: null,
    deliveryNote: String(cart.deliveryNote || '').slice(0, 500),
    storeLogo: cart.storeLogo || null,
  };
}

function activeState(carts: Record<string, StoreCart>, activeStoreId: string | null) {
  const cart = activeStoreId ? carts[activeStoreId] : null;
  return {
    carts,
    activeStoreId,
    items: cart?.items || [],
    storeId: cart?.storeId || null,
    storeName: cart?.storeName || '',
    promoCode: cart?.promoCode || null,
    deliveryNote: cart?.deliveryNote || '',
    storeLogo: cart?.storeLogo || null,
  };
}

function updateActiveCart(state: CartStoreState, update: (cart: StoreCart) => StoreCart) {
  const storeId = state.activeStoreId;
  if (!storeId || !state.carts[storeId]) return {};
  return activeState({ ...state.carts, [storeId]: update(state.carts[storeId]) }, storeId);
}

function sanitizeCartForPersistence(cart: StoreCart): StoreCart {
  return {
    ...cart,
    // Server quotes are intentionally never persisted or trusted on the next launch.
    promoCode: null,
    items: cart.items.map((item) => ({ ...item, unit_price: 0 })),
  };
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      carts: {},
      activeStoreId: null,
      items: [],
      storeId: null,
      storeName: '',
      promoCode: null,
      deliveryNote: '',
      storeLogo: null,
      getItemCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getItemById: (cartLineId) => get().items.find((item) => item.cart_line_id === cartLineId),
      getActiveCarts: () => Object.values(get().carts).filter((cart) => cart.items.length > 0),

      addItem: (item) => {
        let added = false;
        set((state) => {
          if (state.activeStoreId && state.activeStoreId !== item.store_id && state.items.length > 0) return {};
          const cart = state.carts[item.store_id] || normalizeCart({ storeId: item.store_id }, item.store_id);
          const incoming = normalizeLine(item);
          const signature = cartLineSignature(incoming);
          const existing = cart.items.find((line) => cartLineSignature(line) === signature);
          const currentUnits = cart.items.reduce((sum, line) => sum + line.quantity, 0);
          const availableUnits = Math.max(0, MAX_CART_TOTAL_UNITS - currentUnits);
          const allowedAddition = Math.min(
            incoming.quantity,
            availableUnits,
            MAX_CART_LINE_QUANTITY - (existing?.quantity || 0),
          );
          if (allowedAddition <= 0) return {};
          const nextItems = existing
            ? cart.items.map((line) => line.cart_line_id === existing.cart_line_id
              ? { ...line, quantity: line.quantity + allowedAddition }
              : line)
            : [...cart.items, { ...incoming, quantity: allowedAddition }];
          const carts = {
            ...state.carts,
            [item.store_id]: { ...cart, items: nextItems, promoCode: null },
          };
          added = true;
          return activeState(carts, item.store_id);
        });
        return added;
      },

      replaceItem: (cartLineId, replacement) => set((state) => updateActiveCart(state, (cart) => ({
        ...cart,
        items: mergeNormalizedLines(cart.items.map((item) => item.cart_line_id === cartLineId
          ? normalizeLine({ ...replacement, id: cartLineId, cart_line_id: cartLineId })
          : item)),
        promoCode: null,
      }))),

      removeItem: (cartLineId) => set((state) => {
        const storeId = state.activeStoreId;
        const cart = storeId ? state.carts[storeId] : null;
        if (!storeId || !cart) return {};
        const items = cart.items.filter((item) => item.cart_line_id !== cartLineId);
        if (items.length === cart.items.length) return {};
        const carts = { ...state.carts };
        if (items.length) carts[storeId] = { ...cart, items, promoCode: null };
        else delete carts[storeId];
        return activeState(carts, items.length ? storeId : (Object.keys(carts)[0] || null));
      }),

      updateQuantity: (cartLineId, quantity) => set((state) => {
        const storeId = state.activeStoreId;
        const cart = storeId ? state.carts[storeId] : null;
        if (!storeId || !cart || !cart.items.some((item) => item.cart_line_id === cartLineId)) return {};
        if (quantity <= 0) {
          const items = cart.items.filter((item) => item.cart_line_id !== cartLineId);
          const carts = { ...state.carts };
          if (items.length) carts[storeId] = { ...cart, items, promoCode: null };
          else delete carts[storeId];
          return activeState(carts, items.length ? storeId : (Object.keys(carts)[0] || null));
        }
        const currentLine = cart.items.find((item) => item.cart_line_id === cartLineId)!;
        const otherUnits = cart.items.reduce((sum, item) => sum + (item.cart_line_id === cartLineId ? 0 : item.quantity), 0);
        const safeQuantity = Math.min(
          MAX_CART_LINE_QUANTITY,
          Math.max(1, Math.trunc(quantity)),
          Math.max(1, MAX_CART_TOTAL_UNITS - otherUnits),
        );
        if (safeQuantity === currentLine.quantity) return {};
        return activeState({
          ...state.carts,
          [storeId]: {
            ...cart,
            items: cart.items.map((item) => item.cart_line_id === cartLineId ? { ...item, quantity: safeQuantity } : item),
            promoCode: null,
          },
        }, storeId);
      }),

      setPromo: (code) => set((state) => updateActiveCart(state, (cart) => ({ ...cart, promoCode: code.trim() || null }))),
      clearPromo: () => set((state) => updateActiveCart(state, (cart) => ({ ...cart, promoCode: null }))),
      setDeliveryNote: (note) => set((state) => updateActiveCart(state, (cart) => ({ ...cart, deliveryNote: note.slice(0, 500) }))),

      clearCart: (requestedStoreId) => set((state) => {
        const storeId = requestedStoreId || state.activeStoreId;
        if (!storeId || !state.carts[storeId]) return {};
        const carts = { ...state.carts };
        delete carts[storeId];
        return activeState(carts, Object.keys(carts)[0] || null);
      }),

      setStore: (storeId, storeName, storeLogo) => {
        const state = get();
        if (state.activeStoreId && state.activeStoreId !== storeId && state.items.length > 0) return false;
        set((current) => {
          const cart = current.carts[storeId] || normalizeCart({ storeId, storeName, storeLogo }, storeId);
          return activeState({
            ...current.carts,
            [storeId]: { ...cart, storeName: storeName || cart.storeName, storeLogo: storeLogo ?? cart.storeLogo ?? null },
          }, storeId);
        });
        return true;
      },

      replaceActiveStore: (storeId, storeName, storeLogo) => set((state) => {
        const carts = { ...state.carts };
        if (state.activeStoreId) delete carts[state.activeStoreId];
        const cart = carts[storeId] || normalizeCart({ storeId, storeName, storeLogo }, storeId);
        carts[storeId] = { ...cart, storeName: storeName || cart.storeName, storeLogo: storeLogo ?? cart.storeLogo ?? null };
        return activeState(carts, storeId);
      }),

      setActiveStoreId: (storeId) => set((state) => activeState(state.carts, storeId && state.carts[storeId] ? storeId : null)),
    }),
    {
      name: 'jaheez-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        carts: Object.fromEntries(Object.entries(state.carts).map(([id, cart]) => [id, sanitizeCartForPersistence(cart)])),
        activeStoreId: state.activeStoreId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const carts = Object.fromEntries(Object.entries(state.carts || {}).map(([id, cart]) => [id, normalizeCart(cart, id)]));
        const activeStoreId = state.activeStoreId && carts[state.activeStoreId]
          ? state.activeStoreId
          : (Object.keys(carts)[0] || null);
        Object.assign(state, activeState(carts, activeStoreId));
      },
    },
  ),
);
