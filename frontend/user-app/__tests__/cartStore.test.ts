import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_CART_LINE_QUANTITY, MAX_CART_TOTAL_UNITS, useCartStore } from '@/features/orders/store/cartStore';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const line = (id: string, quantity = 1, choiceId?: string) => ({
  id,
  menu_item_id: id,
  name: `Item ${id}`,
  name_ar: `Item ${id}`,
  quantity,
  unit_price: 999,
  store_id: STORE_ID,
  selected_options: choiceId ? [{ option_id: 'size', choice_id: choiceId, choice_name: choiceId, price_delta: 99 }] : [],
});

describe('cart store safety and stability', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useCartStore.setState({
      carts: {}, activeStoreId: null, items: [], storeId: null, storeName: '',
      promoCode: null, deliveryNote: '', storeLogo: null,
    });
    useCartStore.getState().setStore(STORE_ID, 'Store');
  });

  it('merges identical lines while preserving different option combinations', () => {
    const cart = useCartStore.getState();
    expect(cart.addItem(line('22222222-2222-4222-8222-222222222222', 2, 'small'))).toBe(true);
    expect(useCartStore.getState().addItem(line('22222222-2222-4222-8222-222222222222', 3, 'small'))).toBe(true);
    expect(useCartStore.getState().addItem(line('22222222-2222-4222-8222-222222222222', 1, 'large'))).toBe(true);
    expect(useCartStore.getState().items).toHaveLength(2);
    expect(useCartStore.getState().items.map((item) => item.quantity)).toEqual([5, 1]);
  });

  it('caps a line at 50 and the active cart at 100 total units', () => {
    useCartStore.getState().addItem(line('22222222-2222-4222-8222-222222222222', 500));
    useCartStore.getState().addItem(line('33333333-3333-4333-8333-333333333333', 500));
    useCartStore.getState().addItem(line('44444444-4444-4444-8444-444444444444', 1));
    expect(useCartStore.getState().items.map((item) => item.quantity)).toEqual([
      MAX_CART_LINE_QUANTITY,
      MAX_CART_LINE_QUANTITY,
    ]);
    expect(useCartStore.getState().getItemCount()).toBe(MAX_CART_TOTAL_UNITS);
  });

  it('preserves unchanged line references on a quantity update', () => {
    useCartStore.getState().addItem(line('22222222-2222-4222-8222-222222222222'));
    useCartStore.getState().addItem(line('33333333-3333-4333-8333-333333333333'));
    const [firstBefore, secondBefore] = useCartStore.getState().items;
    useCartStore.getState().updateQuantity(firstBefore.cart_line_id, 2);
    const [firstAfter, secondAfter] = useCartStore.getState().items;
    expect(firstAfter).not.toBe(firstBefore);
    expect(secondAfter).toBe(secondBefore);
  });

  it('persists safe notes but clears client prices and promo trust', async () => {
    useCartStore.getState().addItem(line('22222222-2222-4222-8222-222222222222'));
    useCartStore.getState().setDeliveryNote('Ring once');
    useCartStore.getState().setPromo('SAVE');
    await Promise.resolve();
    const persisted = JSON.parse((await AsyncStorage.getItem('jaheez-cart')) || '{}');
    const storedCart = persisted.state.carts[STORE_ID];
    expect(storedCart.deliveryNote).toBe('Ring once');
    expect(storedCart.promoCode).toBeNull();
    expect(storedCart.items[0].unit_price).toBe(0);
  });

  it('normalizes a legacy persisted cart: zeros unit_price but preserves option price_delta', async () => {
    const menuItemId = '22222222-2222-4222-8222-222222222222';
    const legacyLine = {
      ...line(menuItemId, 999, 'large'),
      cart_line_id: undefined,
      unit_price: 500,
      selected_options: [
        { option_id: 'size', choice_id: 'large', choice_name: 'Large', price_delta: 75 },
        { option_id: 'size', choice_id: 'large', choice_name: 'Large', price_delta: 75 },
      ],
    };
    await AsyncStorage.setItem('jaheez-cart', JSON.stringify({
      state: {
        carts: {
          [STORE_ID]: {
            storeId: STORE_ID,
            storeName: 'Legacy',
            items: [legacyLine, { ...legacyLine, quantity: 4 }],
            promoCode: 'TRUST-ME',
            deliveryNote: 'Keep this note',
          },
        },
        activeStoreId: STORE_ID,
      },
      version: 0,
    }));

    await useCartStore.persist.rehydrate();
    const normalized = useCartStore.getState();
    expect(normalized.items).toHaveLength(1);
    expect(normalized.items[0].cart_line_id).toMatch(/^line:/);
    expect(normalized.items[0].quantity).toBe(MAX_CART_LINE_QUANTITY);
    // unit_price must be zeroed (server is price authority at checkout)
    expect(normalized.items[0].unit_price).toBe(0);
    // price_delta is preserved — it comes from the backend menu and drives correct UX display
    expect(normalized.items[0].selected_options).toEqual([
      { option_id: 'size', choice_id: 'large', choice_name: 'Large', price_delta: 75 },
    ]);
    // duplicate option entry should be deduplicated to a single choice
    expect(normalized.items[0].selected_options).toHaveLength(1);
    expect(normalized.promoCode).toBeNull();
    expect(normalized.deliveryNote).toBe('Keep this note');
  });
});
