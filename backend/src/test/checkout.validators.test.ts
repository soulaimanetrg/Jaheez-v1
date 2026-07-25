import { describe, expect, it } from 'vitest';
import { checkoutLinePreviewSchema, checkoutPreviewSchema, checkoutSchema } from '../features/order/checkout.validators';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const ITEM_A = '22222222-2222-4222-8222-222222222222';
const ITEM_B = '33333333-3333-4333-8333-333333333333';

const preview = (overrides: Record<string, unknown> = {}) => ({
  store_id: STORE_ID,
  payment_method: 'cash',
  items: [{ menu_item_id: ITEM_A, quantity: 1, options: [] }],
  ...overrides,
});

describe('checkout hostile-input boundaries', () => {
  it('accepts a minimal server-authoritative preview', () => {
    expect(checkoutPreviewSchema.safeParse(preview()).success).toBe(true);
  });

  it.each([
    { user_id: STORE_ID },
    { total_dh: 1 },
    { discount_dh: 999 },
    { status: 'confirmed' },
    { payment_method: 'card' },
  ])('rejects forged root fields %#', (forged) => {
    expect(checkoutPreviewSchema.safeParse(preview(forged)).success).toBe(false);
  });

  it.each([0, -1, 1.5, 51])('rejects hostile quantity %s', (quantity) => {
    expect(checkoutPreviewSchema.safeParse(preview({
      items: [{ menu_item_id: ITEM_A, quantity, options: [] }],
    })).success).toBe(false);
  });

  it('rejects item-level financial mass assignment', () => {
    expect(checkoutPreviewSchema.safeParse(preview({
      items: [{ menu_item_id: ITEM_A, quantity: 1, unit_price_dh: 0.01, options: [] }],
    })).success).toBe(false);
  });

  it('rejects duplicate line signatures that could bypass per-line limits', () => {
    expect(checkoutPreviewSchema.safeParse(preview({
      items: [
        { menu_item_id: ITEM_A, quantity: 50, options: [] },
        { menu_item_id: ITEM_A, quantity: 50, options: [] },
      ],
    })).success).toBe(false);
  });

  it('allows the same menu item with different option choices', () => {
    expect(checkoutPreviewSchema.safeParse(preview({
      items: [
        { menu_item_id: ITEM_A, quantity: 1, options: [{ option_id: 'size', choice_id: 'small' }] },
        { menu_item_id: ITEM_A, quantity: 1, options: [{ option_id: 'size', choice_id: 'large' }] },
      ],
    })).success).toBe(true);
  });

  it('rejects duplicate option choices and option financial fields', () => {
    const duplicate = { option_id: 'size', choice_id: 'large' };
    expect(checkoutPreviewSchema.safeParse(preview({
      items: [{ menu_item_id: ITEM_A, quantity: 1, options: [duplicate, duplicate] }],
    })).success).toBe(false);
    expect(checkoutPreviewSchema.safeParse(preview({
      items: [{ menu_item_id: ITEM_A, quantity: 1, options: [{ ...duplicate, price_delta_dh: -100 }] }],
    })).success).toBe(false);
  });

  it('rejects more than 100 total units and more than 20 options per line', () => {
    expect(checkoutPreviewSchema.safeParse(preview({
      items: [
        { menu_item_id: ITEM_A, quantity: 50, options: [] },
        { menu_item_id: ITEM_B, quantity: 50, options: [] },
        { menu_item_id: '44444444-4444-4444-8444-444444444444', quantity: 1, options: [] },
      ],
    })).success).toBe(false);

    const options = Array.from({ length: 21 }, (_, index) => ({ option_id: `g${index}`, choice_id: `c${index}` }));
    expect(checkoutPreviewSchema.safeParse(preview({
      items: [{ menu_item_id: ITEM_A, quantity: 1, options }],
    })).success).toBe(false);
  });

  it('keeps final checkout strict and requires an address', () => {
    expect(checkoutSchema.safeParse(preview()).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...preview(), delivery_address: 'Safi' }).success).toBe(true);
  });

  it('accepts only IDs in line preview and rejects client labels or prices', () => {
    const valid = {
      store_id: STORE_ID,
      item: { menu_item_id: ITEM_A, quantity: 1, options: [{ option_id: 'size', choice_id: 'large' }] },
    };
    expect(checkoutLinePreviewSchema.safeParse(valid).success).toBe(true);
    expect(checkoutLinePreviewSchema.safeParse({
      ...valid,
      item: { ...valid.item, options: [{ option_id: 'size', choice_id: 'large', choice_name: 'Large' }] },
    }).success).toBe(false);
    expect(checkoutLinePreviewSchema.safeParse({ ...valid, total_dh: 1 }).success).toBe(false);
  });

  it.each([
    { delivery_lat: 91, delivery_lng: 0 },
    { delivery_lat: -91, delivery_lng: 0 },
    { delivery_lat: 0, delivery_lng: 181 },
    { delivery_lat: 0, delivery_lng: -181 },
    { delivery_lat: Number.POSITIVE_INFINITY, delivery_lng: 0 },
  ])('rejects invalid delivery coordinates %#', (coordinates) => {
    expect(checkoutSchema.safeParse({ ...preview(), delivery_address: 'Safi', ...coordinates }).success).toBe(false);
  });
});
