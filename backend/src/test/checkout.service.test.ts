import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the repository
const mockCheckoutRepo = {
  getStoreById: vi.fn(),
  getMenuItemsByIds: vi.fn(),
  getServiceFeeDh: vi.fn().mockResolvedValue(2),
  getPromoByCode: vi.fn(),
  incrementPromoUsesCount: vi.fn(),
  getUserPromoUsesCount: vi.fn(),
  recordPromoUserUsage: vi.fn(),
  createAtomicOrder: vi.fn(),
  getOrderById: vi.fn(),
  getOrderForCustomerCancellation: vi.fn(),
  getRecentCancelledOrdersCount: vi.fn(),
  flagUserForCancellationReview: vi.fn(),
};

vi.mock('../features/order/checkout.repository', () => ({
  CheckoutRepository: vi.fn().mockImplementation(function() {
    return mockCheckoutRepo;
  }),
}));

// Mock OrderLifecycleService
const mockTransitionOrder = vi.fn();
vi.mock('../features/order/orderLifecycle.service', () => ({
  OrderLifecycleService: vi.fn().mockImplementation(function() {
    return { transitionOrder: mockTransitionOrder };
  }),
}));

const mockRequireOrderReady = vi.fn().mockResolvedValue(undefined);
const mockRequireActiveCustomer = vi.fn().mockResolvedValue({ id: 'user-1', role: 'user' });
vi.mock('../features/auth/customerTrust.service', () => ({
  CustomerTrustService: vi.fn().mockImplementation(function() {
    return { requireOrderReady: mockRequireOrderReady, requireActiveCustomer: mockRequireActiveCustomer };
  }),
}));

import { CheckoutService } from '../features/order/checkout.service';

describe('CheckoutService', () => {
  let service: CheckoutService;

  const mockStore = {
    id: 'store-1',
    is_open: true,
    delivery_fee: 15,
    opening_hours: {
      sun: { open: '00:00', close: '23:59', is_closed: false },
      mon: { open: '00:00', close: '23:59', is_closed: false },
      tue: { open: '00:00', close: '23:59', is_closed: false },
      wed: { open: '00:00', close: '23:59', is_closed: false },
      thu: { open: '00:00', close: '23:59', is_closed: false },
      fri: { open: '00:00', close: '23:59', is_closed: false },
      sat: { open: '00:00', close: '23:59', is_closed: false },
    },
  };

  const mockMenuItem = {
    id: 'item-1',
    price: 50,
    is_available: true,
    name_ar: 'بيتزا',
    options: [],
  };

  const validPayload = {
    store_id: 'store-1',
    items: [{ menu_item_id: 'item-1', quantity: 2, options: [] }],
    delivery_address: '123 Rue Test, Safi',
    delivery_lat: 32.2994,
    delivery_lng: -9.2372,
    payment_method: 'cash',
    notes: null,
    promo_code: null,
    rider_tip: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckoutRepo.getUserPromoUsesCount.mockResolvedValue(0);
    mockCheckoutRepo.incrementPromoUsesCount.mockResolvedValue(undefined);
    mockCheckoutRepo.recordPromoUserUsage.mockResolvedValue(undefined);
    mockCheckoutRepo.getOrderForCustomerCancellation.mockResolvedValue({id:'order-1',user_id:'user-1',order_type:'standard',driver_id:null,status:'pending'});
    service = new CheckoutService();
  });

  describe('previewCheckout', () => {
    it('requires an active customer before querying store or price data', async () => {
      mockRequireActiveCustomer.mockRejectedValueOnce(new Error('account_disabled'));
      await expect(service.previewCheckout('driver-1', validPayload)).rejects.toThrow(/account_disabled/);
      expect(mockCheckoutRepo.getStoreById).not.toHaveBeenCalled();
    });

    it('rejects repeated choices for a single-select option group', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([{
        ...mockMenuItem,
        options: [{ id: 'size', required: true, multiple: false, options: [
          { id: 'small', price_delta: 0 },
          { id: 'large', price_delta: 5 },
        ] }],
      }]);
      await expect(service.previewCheckout('user-1', {
        ...validPayload,
        items: [{ menu_item_id: 'item-1', quantity: 1, options: [
          { option_id: 'size', choice_id: 'small' },
          { option_id: 'size', choice_id: 'large' },
        ] }],
      })).rejects.toThrow(/Too many choices/);
    });

    it('fails closed when stored option pricing is negative', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([{
        ...mockMenuItem,
        options: [{ id: 'extra', required: false, multiple: true, options: [{ id: 'bad', price_delta: -500 }] }],
      }]);
      await expect(service.previewCheckout('user-1', {
        ...validPayload,
        items: [{ menu_item_id: 'item-1', quantity: 1, options: [{ option_id: 'extra', choice_id: 'bad' }] }],
      })).rejects.toThrow(/pricing is unavailable/);
    });
  });

  describe('previewLine', () => {
    it('returns an authoritative signature and normalized server prices', async () => {
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([{
        ...mockMenuItem,
        options: [{
          id: 'extras', label: 'Extras', required: false, multiple: true,
          min_selections: 0, max_selections: 1,
          choices: [{ id: 'cheese', label: 'Cheese', price_delta_dh: 7 }],
        }],
      }]);
      const result = await service.previewLine('user-1', {
        store_id: 'store-1',
        item: { menu_item_id: 'item-1', quantity: 2, options: [{ option_id: 'extras', choice_id: 'cheese' }] },
      });
      expect(result.signature).toBe('item-1|2|extras:cheese');
      expect(result.item.unit_price_dh).toBe(57);
      expect(result.item.line_total_dh).toBe(114);
      expect(mockRequireActiveCustomer).toHaveBeenCalledWith('user-1');
    });
  });

  describe('processCheckout', () => {
    it('should reject checkout without idempotency key', async () => {
      await expect(
        service.processCheckout('user-1', validPayload, null)
      ).rejects.toThrow(/Idempotency-Key/);
    });

    it('should reject when store does not exist', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(null);

      await expect(
        service.processCheckout('user-1', validPayload, 'idem-key-1')
      ).rejects.toThrow(/Store not found/);
    });

    it('should reject when store is closed', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue({ ...mockStore, is_open: false });

      await expect(
        service.processCheckout('user-1', validPayload, 'idem-key-1')
      ).rejects.toThrow(/closed/);
    });

    it.each([null, {}, '{}'])('should allow checkout when an open store has no configured schedule (%#)', async (opening_hours) => {
      mockCheckoutRepo.getStoreById.mockResolvedValue({ ...mockStore, opening_hours });
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);
      mockCheckoutRepo.createAtomicOrder.mockResolvedValue({
        order_id: 'order-1',
        created_at: new Date().toISOString(),
        is_replay: false,
      });
      mockTransitionOrder.mockResolvedValue({});

      const result = await service.processCheckout('user-1', validPayload, 'idem-key-1');

      expect(result.ok).toBe(true);
      expect(result.order_id).toBe('order-1');
    });

    it('should reject when menu item not found in store', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([]); // no items found

      await expect(
        service.processCheckout('user-1', validPayload, 'idem-key-1')
      ).rejects.toThrow(/not available/);
    });

    it('should reject when menu item is unavailable', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([
        { ...mockMenuItem, is_available: false },
      ]);

      await expect(
        service.processCheckout('user-1', validPayload, 'idem-key-1')
      ).rejects.toThrow(/currently unavailable/);
    });

    it('should calculate prices server-side authoritatively', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);
      mockCheckoutRepo.createAtomicOrder.mockResolvedValue({
        order_id: 'order-1',
        created_at: new Date().toISOString(),
        is_replay: false,
      });
      mockTransitionOrder.mockResolvedValue({});

      const result = await service.processCheckout('user-1', validPayload, 'idem-key-1');

      // subtotal = 50 (price) * 2 (quantity) = 100
      // delivery_fee = 15
      // discount = 0
      // total = 100 + 15 + 2 = 117
      expect(result.subtotal_dh).toBe(100);
      expect(result.delivery_fee_dh).toBe(15);
      expect(result.discount_dh).toBe(0);
      expect(result.total_dh).toBe(117);
      expect(result.ok).toBe(true);
    });

    it('should reject checkout when the store has no authoritative delivery fee', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue({ ...mockStore, delivery_fee: null });
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);

      await expect(
        service.processCheckout('user-1', validPayload, 'idem-key-1')
      ).rejects.toThrow(/Delivery pricing is unavailable/);

      expect(mockCheckoutRepo.createAtomicOrder).not.toHaveBeenCalled();
    });

    it('should auto-confirm cash orders', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);
      mockCheckoutRepo.createAtomicOrder.mockResolvedValue({
        order_id: 'order-1',
        created_at: new Date().toISOString(),
        is_replay: false,
      });
      mockTransitionOrder.mockResolvedValue({});

      const result = await service.processCheckout('user-1', validPayload, 'idem-key-1');

      expect(result.status).toBe('confirmed');
      expect(mockTransitionOrder).toHaveBeenCalledWith(
        'order-1',
        { type: 'system', id: null },
        'confirmed',
        expect.any(String)
      );
    });

    it('should reject card orders while online payments are paused', async () => {
      const cardPayload = { ...validPayload, payment_method: 'card' };

      await expect(
        service.processCheckout('user-1', cardPayload, 'idem-key-1')
      ).rejects.toThrow(/Online payments are paused/);
      expect(mockTransitionOrder).not.toHaveBeenCalled();
    });

    it('should apply percentage promo code correctly', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);
      mockCheckoutRepo.getPromoByCode.mockResolvedValue({
        id: 'promo-1',
        discount_type: 'percentage',
        discount_value: 10, // 10%
        min_order_centimes: 0,
        is_active: true,
        end_at: null,
        uses_count: 0,
        max_uses: 100,
      });
      mockCheckoutRepo.createAtomicOrder.mockResolvedValue({
        order_id: 'order-1',
        created_at: new Date().toISOString(),
        is_replay: false,
      });
      mockTransitionOrder.mockResolvedValue({});

      const promoPayload = { ...validPayload, promo_code: 'SAVE10' };
      const result = await service.processCheckout('user-1', promoPayload, 'idem-key-1');

      // subtotal = 100, 10% discount = 10, delivery = 15
      // total = 100 + 15 + 2 - 10 = 107
      expect(result.discount_dh).toBe(10);
      expect(result.total_dh).toBe(107);
    });

    it('should ignore expired promo code', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);
      mockCheckoutRepo.getPromoByCode.mockResolvedValue({
        id: 'promo-1',
        discount_type: 'percentage',
        discount_value: 50,
        min_order_centimes: 0,
        is_active: true,
        end_at: '2020-01-01T00:00:00Z', // expired
        uses_count: 0,
        max_uses: 100,
      });
      mockCheckoutRepo.createAtomicOrder.mockResolvedValue({
        order_id: 'order-1',
        created_at: new Date().toISOString(),
        is_replay: false,
      });
      mockTransitionOrder.mockResolvedValue({});

      const promoPayload = { ...validPayload, promo_code: 'EXPIRED' };
      const result = await service.processCheckout('user-1', promoPayload, 'idem-key-1');

      expect(result.discount_dh).toBe(0);
    });

    it('should ignore store-specific promo code on a different store', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);
      mockCheckoutRepo.getPromoByCode.mockResolvedValue({
        id: 'promo-1',
        store_id: 'some-other-store-uuid',
        discount_type: 'percentage',
        discount_value: 50,
        min_order_centimes: 0,
        is_active: true,
        end_at: null,
        uses_count: 0,
        max_uses: 100,
      });
      mockCheckoutRepo.createAtomicOrder.mockResolvedValue({
        order_id: 'order-1',
        created_at: new Date().toISOString(),
        is_replay: false,
      });
      mockTransitionOrder.mockResolvedValue({});

      const promoPayload = { ...validPayload, promo_code: 'WRONGSTORE' };
      const result = await service.processCheckout('user-1', promoPayload, 'idem-key-1');

      expect(result.discount_dh).toBe(0);
    });

    it('should increment promo uses count on successful non-replay checkout', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);
      mockCheckoutRepo.getPromoByCode.mockResolvedValue({
        id: 'promo-active-1',
        store_id: null,
        discount_type: 'percentage',
        discount_value: 10,
        min_order_centimes: 0,
        is_active: true,
        end_at: null,
        uses_count: 5,
        max_uses: 10,
      });
      mockCheckoutRepo.createAtomicOrder.mockResolvedValue({
        order_id: 'order-1',
        created_at: new Date().toISOString(),
        is_replay: false,
      });
      mockTransitionOrder.mockResolvedValue({});
      mockCheckoutRepo.incrementPromoUsesCount = vi.fn().mockResolvedValue(undefined);

      const promoPayload = { ...validPayload, promo_code: 'ACTIVE10' };
      await service.processCheckout('user-1', promoPayload, 'idem-key-1');

      expect(mockCheckoutRepo.incrementPromoUsesCount).toHaveBeenCalledWith('promo-active-1');
    });

    it('should ignore promo code if user has reached their maximum usage limit', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);
      mockCheckoutRepo.getPromoByCode.mockResolvedValue({
        id: 'promo-user-1',
        store_id: null,
        discount_type: 'percentage',
        discount_value: 10,
        min_order_centimes: 0,
        is_active: true,
        end_at: null,
        uses_count: 0,
        max_uses: 10,
        max_uses_per_user: 2,
      });
      mockCheckoutRepo.getUserPromoUsesCount = vi.fn().mockResolvedValue(2);
      mockCheckoutRepo.createAtomicOrder.mockResolvedValue({
        order_id: 'order-1',
        created_at: new Date().toISOString(),
        is_replay: false,
      });
      mockTransitionOrder.mockResolvedValue({});

      const promoPayload = { ...validPayload, promo_code: 'USERLIMIT' };
      const result = await service.processCheckout('user-1', promoPayload, 'idem-key-1');

      expect(result.discount_dh).toBe(0);
      expect(mockCheckoutRepo.getUserPromoUsesCount).toHaveBeenCalledWith('user-1', 'promo-user-1');
    });

    it('should allow promo code if user has not reached their maximum usage limit and record usage', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);
      mockCheckoutRepo.getPromoByCode.mockResolvedValue({
        id: 'promo-user-1',
        store_id: null,
        discount_type: 'percentage',
        discount_value: 10,
        min_order_centimes: 0,
        is_active: true,
        end_at: null,
        uses_count: 0,
        max_uses: 10,
        max_uses_per_user: 2,
      });
      mockCheckoutRepo.getUserPromoUsesCount = vi.fn().mockResolvedValue(1);
      mockCheckoutRepo.createAtomicOrder.mockResolvedValue({
        order_id: 'order-1',
        created_at: new Date().toISOString(),
        is_replay: false,
      });
      mockTransitionOrder.mockResolvedValue({});
      mockCheckoutRepo.incrementPromoUsesCount = vi.fn().mockResolvedValue(undefined);
      mockCheckoutRepo.recordPromoUserUsage = vi.fn().mockResolvedValue(undefined);

      const promoPayload = { ...validPayload, promo_code: 'USERLIMIT' };
      const result = await service.processCheckout('user-1', promoPayload, 'idem-key-1');

      expect(result.discount_dh).toBe(10); // 10% of 100
      expect(mockCheckoutRepo.incrementPromoUsesCount).toHaveBeenCalledWith('promo-user-1');
      expect(mockCheckoutRepo.recordPromoUserUsage).toHaveBeenCalledWith('user-1', 'promo-user-1', 'order-1');
    });

    it('should return cached response for replayed idempotency key', async () => {
      mockCheckoutRepo.getStoreById.mockResolvedValue(mockStore);
      mockCheckoutRepo.getMenuItemsByIds.mockResolvedValue([mockMenuItem]);
      mockCheckoutRepo.createAtomicOrder.mockResolvedValue({
        order_id: 'order-1',
        created_at: new Date().toISOString(),
        is_replay: true,
        cached_response: { ok: true, order_id: 'order-1', total_amount: 117 },
      });

      const result = await service.processCheckout('user-1', validPayload, 'idem-key-1');

      expect(result.idempotent).toBe(true);
      expect(result.order_id).toBe('order-1');
    });
  });

  describe('cancelOrder', () => {
    it('should flag user for review after 3 cancellations within the window', async () => {
      mockTransitionOrder.mockResolvedValue({});
      mockCheckoutRepo.getRecentCancelledOrdersCount.mockResolvedValue(3);
      mockCheckoutRepo.flagUserForCancellationReview.mockResolvedValue(undefined);

      await service.cancelOrder('order-1', 'user-1', 'Changed my mind');

      expect(mockCheckoutRepo.getRecentCancelledOrdersCount).toHaveBeenCalledWith('user-1', 7);
      expect(mockCheckoutRepo.flagUserForCancellationReview).toHaveBeenCalledWith('user-1');
    });

    it('should NOT flag user with fewer than 3 recent cancellations', async () => {
      mockTransitionOrder.mockResolvedValue({});
      mockCheckoutRepo.getRecentCancelledOrdersCount.mockResolvedValue(2);

      await service.cancelOrder('order-1', 'user-1', 'Changed my mind');

      expect(mockCheckoutRepo.flagUserForCancellationReview).not.toHaveBeenCalled();
    });

    it('requires operations review once an errand has a courier',async()=>{
      mockCheckoutRepo.getOrderForCustomerCancellation.mockResolvedValue({id:'order-1',user_id:'user-1',order_type:'errand',driver_id:'driver-1',status:'confirmed'});
      await expect(service.cancelOrder('order-1','user-1','Changed my mind')).rejects.toMatchObject({errorCode:'errand_cancellation_requires_operations'});
      expect(mockTransitionOrder).not.toHaveBeenCalled();
    });

    it('does not disclose another customer order during cancellation',async()=>{
      mockCheckoutRepo.getOrderForCustomerCancellation.mockResolvedValue({id:'order-1',user_id:'other-user',order_type:'errand',driver_id:null,status:'pending'});
      await expect(service.cancelOrder('order-1','user-1','Changed my mind')).rejects.toMatchObject({errorCode:'order_not_found'});
      expect(mockTransitionOrder).not.toHaveBeenCalled();
    });
  });

  describe('createOnlinePaymentSession', () => {
    it('should reject because online payment checkout is paused', async () => {
      await expect(
        service.createOnlinePaymentSession('user-1', {
          order_id: 'order-1',
          amount_centimes: 9999,
        }, 'https://jaheez.ma', null)
      ).rejects.toThrow(/Online payment checkout is paused/);
    });

    it('should not look up orders while paused', async () => {
      await expect(
        service.createOnlinePaymentSession('user-1', { order_id: 'order-1' }, 'https://jaheez.ma', null)
      ).rejects.toThrow(/Online payment checkout is paused/);
      expect(mockCheckoutRepo.getOrderById).not.toHaveBeenCalled();
    });
  });
});
