import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockSupabase } from './setup';
import { CheckoutRepository } from '../features/order/checkout.repository';

function queryResult(result: { data: any; error: any }) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };

  builder.then = (resolve: any) => resolve(result);
  return builder;
}

describe('CheckoutRepository promo schema compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retries menu item lookup without promo columns when Supabase schema cache is stale', async () => {
    mockSupabase.from
      .mockImplementationOnce(() => queryResult({
        data: null,
        error: { message: "Could not find the 'promo_price' column of 'menu_items' in the schema cache" },
      }))
      .mockImplementationOnce(() => queryResult({
        data: [{
          id: 'item-1',
          price: 50,
          is_available: true,
          name_ar: 'Pizza',
          options: {
            groups: [],
            __jaheez_product_promo: {
              promo_price: 40,
              promo_until: null,
            },
          },
        }],
        error: null,
      }));

    const rows = await new CheckoutRepository().getMenuItemsByIds(['item-1'], 'store-1');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'item-1',
      price: 50,
      promo_price: 40,
      promo_until: null,
      options: [],
    });
    expect(mockSupabase.from).toHaveBeenCalledTimes(2);
  });
});
