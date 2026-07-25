import { CheckoutRepository, MenuItemDbRow } from './checkout.repository';
import { getStoreClosesAt, isStoreCurrentlyOpen } from '../store/storeStatus';
import { OrderLifecycleService } from './orderLifecycle.service';
import { sendPushToUser } from '../../notifications/notifications';
import { BadRequestError, NotFoundError, ConflictError } from '../../middleware/error.middleware';
import { logger } from '../../config/logger';
import { getPaymentProviderAdapter } from '../payments/paymentProvider.factory';
import { ErrandService } from '../errand/errand.service';
import { CustomerTrustService } from '../auth/customerTrust.service';
import { normalizeOptionGroups, OptionConfigurationError } from './optionGroups';

// Repeated pre-pickup cancellations flag the account for admin review
// (auth_risk_level=high) instead of auto-banning: cancelling in
// pending/confirmed is legitimate behavior the lifecycle explicitly allows.
const CANCELLATION_REVIEW_THRESHOLD = 3;
const CANCELLATION_REVIEW_WINDOW_DAYS = 7;

type CheckoutOptionInput = {
  option_id: string;
  choice_id: string;
};

type CheckoutItemInput = {
  menu_item_id: string;
  quantity: number;
  options?: CheckoutOptionInput[] | null;
};

type CheckoutPayload = {
  store_id: string;
  items: CheckoutItemInput[];
  delivery_address?: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  payment_method?: string;
  notes?: string | null;
  promo_code?: string | null;
  rider_tip?: number | null;
};

type LinePreviewPayload = {
  store_id: string;
  item: CheckoutItemInput;
};

type CheckoutDbOption = {
  option_id: string;
  option_label: string;
  choice_id: string;
  choice_name: string;
  price_delta: number;
};

type CheckoutDbItem = {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  options: CheckoutDbOption[];
};

type CheckoutQuote = {
  canCheckout: boolean;
  paymentMethod: 'cash';
  storeStatus: {
    is_open: boolean;
    label_fr: string;
    label_ar: string;
  };
  items: CheckoutDbItem[];
  subtotalDh: number;
  deliveryFeeDh: number;
  serviceFeeDh: number;
  discountDh: number;
  riderTipDh: number;
  totalDh: number;
  appliedPromoId: string | null;
  promo: {
    code: string;
    is_valid: boolean;
    discount_dh: number;
  } | null;
};

export class CheckoutService {
  private checkoutRepo = new CheckoutRepository();
  private lifecycleService = new OrderLifecycleService();
  private errandService = new ErrandService();
  private customerTrust = new CustomerTrustService();

  async previewCheckout(userId: string, payload: CheckoutPayload) {
    await this.customerTrust.requireActiveCustomer(userId);
    const quote = await this.buildCheckoutQuote(userId, payload, false);
    return this.formatQuoteResponse(quote);
  }

  async previewLine(userId: string, payload: LinePreviewPayload) {
    await this.customerTrust.requireActiveCustomer(userId);
    const menuItems = await this.checkoutRepo.getMenuItemsByIds([payload.item.menu_item_id], payload.store_id);
    const menu = menuItems[0];
    if (!menu) throw new BadRequestError('Product is not available in this store.', 'cart_item_store_mismatch');
    if (!menu.is_available) throw new ConflictError('Product is currently unavailable.', 'cart_item_unavailable');
    const item = this.buildQuoteItem(payload.item, menu);
    return {
      ok: true,
      signature: this.lineSignature(payload.item),
      availability: { is_available: true, code: 'available' as const },
      item: this.formatQuoteItem(item),
    };
  }

  /**
   * Process client checkout. Authoritative calculations performed on the server.
   */
  async processCheckout(userId: string, payload: CheckoutPayload, idempotencyKey: string | null) {
    if (!idempotencyKey) {
      throw new BadRequestError('Idempotency-Key header is required', 'idempotency_key_required');
    }
    await this.customerTrust.requireOrderReady(userId);

    const quote = await this.buildCheckoutQuote(userId, payload, true);
    const requestPayload = this.requestFingerprintPayload(payload);

    let order;
    try {
      order = await this.checkoutRepo.createAtomicOrder({
        userId,
        storeId: payload.store_id,
        deliveryAddress: String(payload.delivery_address || '').trim(),
        deliveryLat: payload.delivery_lat ?? null,
        deliveryLng: payload.delivery_lng ?? null,
        notes: payload.notes ?? null,
        subtotal: quote.subtotalDh,
        deliveryFee: quote.deliveryFeeDh,
        discount: quote.discountDh,
        riderTip: quote.riderTipDh,
        totalAmount: quote.totalDh,
        paymentMethod: quote.paymentMethod,
        items: quote.items,
        idempotencyKey,
        requestPayload,
        promoId: quote.appliedPromoId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('idempotency_key_owner_mismatch')) {
        throw new ConflictError('Checkout request conflicts with an existing submission.', 'idempotency_owner_mismatch');
      }
      if (message.includes('idempotency_payload_mismatch')) {
        throw new ConflictError('Checkout request conflicts with an existing submission.', 'idempotency_payload_mismatch');
      }
      if (message.includes('promo_exhausted') || message.includes('promo_user_exhausted') || message.includes('promo_invalid')) {
        throw new ConflictError('Ce code promo n’est plus disponible.', 'promo_unavailable');
      }
      throw error;
    }

    if (order.is_replay && order.cached_response) {
      logger.debug('[checkout] Replayed checkout submission');
      return { ...order.cached_response, idempotent: true };
    }

    // Migration 055 records promo usage inside the order transaction; the
    // post-commit path only remains for the legacy RPC signature.
    if (!order.is_replay && quote.appliedPromoId && !order.promo_atomic) {
      try {
        await this.checkoutRepo.incrementPromoUsesCount(quote.appliedPromoId);
        await this.checkoutRepo.recordPromoUserUsage(userId, quote.appliedPromoId, order.order_id);
      } catch (err: any) {
        logger.error('[checkout] Failed to update promo usage', {
          error_type: err instanceof Error ? err.name : 'unknown_error',
        });
      }
    }

    try {
      await this.lifecycleService.transitionOrder(
        order.order_id,
        { type: 'system', id: null },
        'confirmed',
        'Auto-confirmed cash order',
      );
    } catch (err: any) {
      logger.error('[checkout] Auto-confirm failed', {
        order_id: order.order_id,
        error_type: err instanceof Error ? err.name : 'unknown_error',
      });
    }

    const responsePayload = {
      ...this.formatQuoteResponse(quote),
      order_id: order.order_id,
      status: 'confirmed',
      created_at: order.created_at,
    };

    sendPushToUser(userId, responsePayload.status, order.order_id);

    logger.info('[checkout] Order created successfully', {
      order_id: order.order_id,
      user_id: userId,
    });

    return responsePayload;
  }

  private async buildCheckoutQuote(
    userId: string,
    payload: CheckoutPayload,
    enforceOpen: boolean,
  ): Promise<CheckoutQuote> {
    const paymentMethod = this.normalizePaymentMethod(payload.payment_method);

    // menuItemIds is a pure transform — compute it synchronously before the
    // DB fan-out so it is available to both parallel queries.
    const menuItemIds = payload.items.map((item) => item.menu_item_id);

    // ── Fetch 3 independent resources in parallel ───────────────────────────
    // getStoreById, getMenuItemsByIds, and getServiceFeeDh share no data
    // dependency — running them sequentially wastes 2 extra round-trips to
    // Supabase (each 50-300 ms). Promise.all collapses them into one hop.
    const [store, menuItems, rawServiceFeeDh] = await Promise.all([
      this.checkoutRepo.getStoreById(payload.store_id),
      this.checkoutRepo.getMenuItemsByIds(menuItemIds, payload.store_id),
      this.checkoutRepo.getServiceFeeDh(),
    ]);
    // ───────────────────────────────────────────────────────────────────────

    if (!store) {
      throw new NotFoundError('Store not found', 'store_not_found');
    }

    const rawStoreStatus = isStoreCurrentlyOpen(store);
    const storeStatus = {
      is_open: rawStoreStatus.isOpen,
      label_fr: rawStoreStatus.labelFr,
      label_ar: rawStoreStatus.labelAr,
      closes_at: rawStoreStatus.isOpen ? getStoreClosesAt(store) : null,
    };

    if (enforceOpen && !storeStatus.is_open) {
      throw new ConflictError('Store is currently closed. Please try again later.', 'store_closed');
    }

    const menuMap = new Map<string, MenuItemDbRow>(menuItems.map((menu) => [menu.id, menu]));

    const missingItems = menuItemIds.filter((id) => !menuMap.has(id));
    if (missingItems.length > 0) {
      throw new BadRequestError('Some products are not available in this store.', 'cart_item_store_mismatch');
    }

    const unavailableItems = payload.items.filter((item) => !menuMap.get(item.menu_item_id)?.is_available);
    if (unavailableItems.length > 0) {
      throw new ConflictError('Some products are currently unavailable.', 'cart_item_unavailable');
    }

    const items = payload.items.map((item) => this.buildQuoteItem(item, menuMap.get(item.menu_item_id)!));
    const subtotalDh = this.roundDh(items.reduce((sum, item) => sum + item.total_price, 0));
    const configuredDeliveryFee = store.delivery_fee;
    const rawDeliveryFee = configuredDeliveryFee === null
      || configuredDeliveryFee === undefined
      || String(configuredDeliveryFee).trim() === ''
      ? Number.NaN
      : Number(configuredDeliveryFee);
    if (!Number.isFinite(rawDeliveryFee) || rawDeliveryFee < 0) {
      throw new ConflictError('Delivery pricing is unavailable for this store.', 'delivery_pricing_unavailable');
    }
    const deliveryFeeDh = this.roundDh(rawDeliveryFee);
    const serviceFeeDh = this.roundDh(rawServiceFeeDh);
    const promoResult = await this.calculatePromoDiscount(userId, payload.store_id, payload.promo_code, subtotalDh);
    const riderTipDh = this.roundDh(Math.max(0, Number(payload.rider_tip || 0)));
    const totalDh = this.roundDh(
      Math.max(0, subtotalDh + deliveryFeeDh + serviceFeeDh - promoResult.discountDh) + riderTipDh,
    );

    return {
      canCheckout: storeStatus.is_open,
      paymentMethod,
      storeStatus,
      items,
      subtotalDh,
      deliveryFeeDh,
      serviceFeeDh,
      discountDh: promoResult.discountDh,
      riderTipDh,
      totalDh,
      appliedPromoId: promoResult.appliedPromoId,
      promo: promoResult.promo,
    };
  }

  private buildQuoteItem(input: CheckoutItemInput, menu: MenuItemDbRow): CheckoutDbItem {
    let dbOptions;
    try {
      dbOptions = normalizeOptionGroups(menu.options);
    } catch (error) {
      const code = error instanceof OptionConfigurationError ? error.errorCode : 'option_configuration_invalid';
      throw new ConflictError(
        code === 'option_pricing_unavailable'
          ? 'Product option pricing is unavailable.'
          : 'Product options are temporarily unavailable.',
        code,
      );
    }
    const clientOptions = Array.isArray(input.options) ? input.options : [];
    let optionsCostDh = 0;
    const validatedOptions: CheckoutDbOption[] = [];
    const selectedPairs = new Set<string>();
    const groupSelections = new Map<string, number>();

    for (const clientOption of clientOptions) {
      const group = dbOptions.find((candidate) => candidate.id === clientOption.option_id);
      if (!group) {
        throw new BadRequestError('Invalid product option selection.', 'invalid_option_group');
      }

      const groupId = group.id;
      const pair = `${groupId}:${clientOption.choice_id}`;
      if (selectedPairs.has(pair)) {
        throw new BadRequestError('Duplicate option choice', 'duplicate_option_choice');
      }
      selectedPairs.add(pair);

      const choice = group.choices.find((candidate) => candidate.id === clientOption.choice_id);
      if (!choice) {
        throw new BadRequestError('Invalid product option selection.', 'invalid_option_choice');
      }

      const priceDeltaDh = choice.price_delta_dh;
      const selectionCount = (groupSelections.get(groupId) || 0) + 1;
      if (selectionCount > group.max_selections) {
        throw new BadRequestError('Too many choices selected for an option group', 'option_selection_limit');
      }
      groupSelections.set(groupId, selectionCount);
      optionsCostDh += priceDeltaDh;

      validatedOptions.push({
        option_id: group.id,
        option_label: group.label,
        choice_id: choice.id,
        choice_name: choice.label || choice.label_ar,
        price_delta: priceDeltaDh,
      });
    }

    for (const group of dbOptions) {
      const count = groupSelections.get(group.id) || 0;
      if (count < group.min_selections) {
        throw new BadRequestError('A required product option is missing.', 'required_option_missing');
      }
      if (count > group.max_selections) {
        throw new BadRequestError('Too many choices selected for an option group', 'option_selection_limit');
      }
    }

    const basePriceDh = this.resolveMenuBasePrice(menu);
    const unitPriceDh = this.roundDh(basePriceDh + optionsCostDh);
    const totalPriceDh = this.roundDh(unitPriceDh * input.quantity);

    return {
      menu_item_id: input.menu_item_id,
      quantity: input.quantity,
      unit_price: unitPriceDh,
      total_price: totalPriceDh,
      options: validatedOptions,
    };
  }

  private resolveMenuBasePrice(menu: MenuItemDbRow): number {
    const promoPrice = menu.promo_price;
    const promoUntil = menu.promo_until;
    if (
      promoPrice !== null &&
      promoPrice !== undefined &&
      Number(promoPrice) > 0 &&
      (!promoUntil || new Date(promoUntil) > new Date())
    ) {
      return this.roundDh(Number(promoPrice));
    }
    const price = Number(menu.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new ConflictError('Product pricing is unavailable.', 'product_pricing_unavailable');
    }
    return this.roundDh(price);
  }

  private async calculatePromoDiscount(
    userId: string,
    storeId: string,
    promoCode: string | null | undefined,
    subtotalDh: number,
  ): Promise<{
    discountDh: number;
    appliedPromoId: string | null;
    promo: CheckoutQuote['promo'];
  }> {
    const code = String(promoCode || '').trim().toUpperCase();
    if (!code) {
      return { discountDh: 0, appliedPromoId: null, promo: null };
    }

    const promo = await this.checkoutRepo.getPromoByCode(code);
    const invalid = () => ({
      discountDh: 0,
      appliedPromoId: null,
      promo: { code, is_valid: false, discount_dh: 0 },
    });

    if (!promo) return invalid();
    if (!promo.is_active) return invalid();
    if (promo.store_id && String(promo.store_id) !== String(storeId)) return invalid();
    if (promo.end_at && new Date(promo.end_at) <= new Date()) return invalid();
    if (promo.max_uses && promo.uses_count >= promo.max_uses) return invalid();

    if (promo.max_uses_per_user !== undefined && promo.max_uses_per_user !== null) {
      const userUses = await this.checkoutRepo.getUserPromoUsesCount(userId, promo.id);
      if (userUses >= promo.max_uses_per_user) return invalid();
    }

    const subtotalCentimes = Math.round(subtotalDh * 100);
    if (subtotalCentimes < (promo.min_order_centimes || 0)) return invalid();

    const rawDiscountDh = promo.discount_type === 'percentage'
      ? (subtotalDh * promo.discount_value) / 100
      : promo.discount_value / 100;
    const discountDh = this.roundDh(Math.min(rawDiscountDh, subtotalDh));

    return {
      discountDh,
      appliedPromoId: promo.id,
      promo: { code, is_valid: true, discount_dh: discountDh },
    };
  }

  private formatQuoteResponse(quote: CheckoutQuote) {
    return {
      ok: true,
      can_checkout: quote.canCheckout,
      payment_method: quote.paymentMethod,
      store_status: quote.storeStatus,
      items: quote.items.map((item) => this.formatQuoteItem(item)),
      subtotal_dh: quote.subtotalDh,
      delivery_fee_dh: quote.deliveryFeeDh,
      service_fee_dh: quote.serviceFeeDh,
      discount_dh: quote.discountDh,
      rider_tip_dh: quote.riderTipDh,
      total_dh: quote.totalDh,
      promo: quote.promo,
    };
  }

  private formatQuoteItem(item: CheckoutDbItem) {
    return {
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price_dh: item.unit_price,
      line_total_dh: item.total_price,
      options: item.options.map((option) => ({
        option_id: option.option_id,
        option_label: option.option_label,
        choice_id: option.choice_id,
        choice_name: option.choice_name,
        price_delta_dh: option.price_delta,
      })),
    };
  }

  private lineSignature(item: CheckoutItemInput): string {
    const selections = (item.options || [])
      .map((option) => `${option.option_id}:${option.choice_id}`)
      .sort();
    return `${item.menu_item_id}|${item.quantity}|${selections.join('|')}`;
  }

  private requestFingerprintPayload(payload: CheckoutPayload) {
    const items = payload.items
      .map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        options: (item.options || [])
          .map((option) => ({ option_id: option.option_id, choice_id: option.choice_id }))
          .sort((a, b) => `${a.option_id}:${a.choice_id}`.localeCompare(`${b.option_id}:${b.choice_id}`)),
      }))
      .sort((a, b) => `${a.menu_item_id}:${JSON.stringify(a.options)}`.localeCompare(`${b.menu_item_id}:${JSON.stringify(b.options)}`));
    return {
      store_id: payload.store_id,
      items,
      delivery_address: String(payload.delivery_address || '').trim(),
      delivery_lat: payload.delivery_lat ?? null,
      delivery_lng: payload.delivery_lng ?? null,
      payment_method: 'cash',
      notes: payload.notes ?? null,
      promo_code: String(payload.promo_code || '').trim().toUpperCase() || null,
      rider_tip: this.roundDh(Number(payload.rider_tip || 0)),
    };
  }

  private normalizePaymentMethod(paymentMethod?: string): 'cash' {
    if ((paymentMethod || 'cash') !== 'cash') {
      throw new ConflictError('Online payments are paused. Cash on delivery is currently the only checkout payment method.');
    }
    return 'cash';
  }

  private roundDh(value: number): number {
    return Number((Math.round((Number(value) || 0) * 100) / 100).toFixed(2));
  }

  async createOnlinePaymentSession(
    userId: string,
    payload: any,
    origin: string,
    idempotencyKey: string | null,
  ) {
    return getPaymentProviderAdapter().createSession({
      user_id: userId,
      order_id: String(payload?.order_id || ''),
      origin,
      idempotency_key: idempotencyKey,
    });
  }

  async verifyOnlinePaymentSession(userId: string, sessionId: string) {
    return getPaymentProviderAdapter().verifySession(userId, sessionId);
  }

  /**
   * Cancel order (User-initiated)
   */
  async cancelOrder(orderId: string, userId: string, reason: string) {
    const order=await this.checkoutRepo.getOrderForCustomerCancellation(orderId);
    if(!order||order.user_id!==userId) throw new NotFoundError('Commande introuvable','order_not_found');
    if(order.order_type==='errand'&&order.driver_id) {
      throw new ConflictError('Une course assignee doit etre annulee par les operations.','errand_cancellation_requires_operations');
    }
    await this.lifecycleService.transitionOrder(
      orderId,
      { type: 'customer', id: userId },
      'cancelled',
      reason,
    );
    if(order.order_type==='errand') await this.errandService.syncCustomerCancellation(orderId,userId,reason);

    try {
      const cancelCount = await this.checkoutRepo.getRecentCancelledOrdersCount(userId, CANCELLATION_REVIEW_WINDOW_DAYS);
      if (cancelCount >= CANCELLATION_REVIEW_THRESHOLD) {
        logger.warn('[checkout] User reached cancellation review threshold; flagged for admin review', {
          user_id: userId,
          cancellation_count: cancelCount,
          window_days: CANCELLATION_REVIEW_WINDOW_DAYS,
        });
        await this.checkoutRepo.flagUserForCancellationReview(userId);
      }
    } catch (err: any) {
      logger.error('[checkout] Failed to check/flag user after cancellation', {
        user_id: userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return { ok: true, order_id: orderId, status: 'cancelled' };
  }

  /**
   * Driver accepts order
   */
  async acceptOrder(orderId: string, driverId: string) {
    const ord = await this.lifecycleService.claimOrder(orderId, driverId);
    return { ok: true, ...this.formatDriverOrder(ord) };
  }

  /**
   * Admin completes order
   */
  async completeOrder(orderId: string, adminEmail: string) {
    await this.lifecycleService.transitionOrder(
      orderId,
      { type: 'admin', id: adminEmail },
      'completed',
      `Completed by admin ${adminEmail}`,
    );
    return { ok: true, order_id: orderId, status: 'completed' };
  }

  /**
   * Helper function to format order payload for driver application compat
   */
  private formatDriverOrder(order: any) {
    if (!order) return null;
    return {
      ...order,
      customer_name: order.users?.full_name || '',
      customer_phone: order.users?.phone || '',
      store_name: order.stores?.name || '',
      store_name_ar: order.stores?.name_ar || '',
      store_phone: order.stores?.phone || '',
      store_address: order.stores?.address || '',
      store_address_ar: order.stores?.address_ar || '',
      store_lat: order.stores?.lat || null,
      store_lng: order.stores?.lng || null,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: item.notes,
        name: item.menu_items?.name || '',
        name_ar: item.menu_items?.name_ar || '',
        options: item.options || [],
      })),
    };
  }
}
