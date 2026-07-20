import crypto from 'crypto';
import { CheckoutRepository, MenuItemDbRow } from './checkout.repository';
import { isStoreCurrentlyOpen } from '../store/storeStatus';
import { OrderLifecycleService } from './orderLifecycle.service';
import { sendPushToUser } from '../../notifications/notifications';
import { BadRequestError, NotFoundError, ConflictError } from '../../middleware/error.middleware';
import { logger } from '../../config/logger';
import { getPaymentProviderAdapter } from '../payments/paymentProvider.factory';
import { ErrandService } from '../errand/errand.service';
import { CustomerTrustService } from '../auth/customerTrust.service';

// Repeated pre-pickup cancellations flag the account for admin review
// (auth_risk_level=high) instead of auto-banning: cancelling in
// pending/confirmed is legitimate behavior the lifecycle explicitly allows.
const CANCELLATION_REVIEW_THRESHOLD = 3;
const CANCELLATION_REVIEW_WINDOW_DAYS = 7;

type CheckoutOptionInput = {
  option_id: string;
  choice_id: string;
  choice_name?: string | null;
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
    reason?: string;
  } | null;
};

export class CheckoutService {
  private checkoutRepo = new CheckoutRepository();
  private lifecycleService = new OrderLifecycleService();
  private errandService = new ErrandService();
  private customerTrust = new CustomerTrustService();

  async previewCheckout(userId: string, payload: CheckoutPayload) {
    const quote = await this.buildCheckoutQuote(userId, payload, false);
    return this.formatQuoteResponse(quote);
  }

  /**
   * Process client checkout. Authoritative calculations performed on the server.
   */
  async processCheckout(userId: string, payload: CheckoutPayload, idempotencyKey: string | null) {
    if (!idempotencyKey) {
      throw new BadRequestError('Idempotency-Key header is required');
    }
    await this.customerTrust.requireOrderReady(userId);

    const quote = await this.buildCheckoutQuote(userId, payload, true);

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
        promoId: quote.appliedPromoId,
      });
    } catch (error: any) {
      if (error.message.includes('idempotency_key_owner_mismatch')) {
        throw new ConflictError('Idempotency key belongs to another user');
      }
      if (error.message.includes('promo_exhausted') || error.message.includes('promo_user_exhausted') || error.message.includes('promo_invalid')) {
        throw new ConflictError('Ce code promo n’est plus disponible.');
      }
      throw error;
    }

    if (order.is_replay && order.cached_response) {
      logger.debug('[checkout] Idempotency cache hit during transaction', {
        key_hash: crypto.createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 12),
      });
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
          promo_id: quote.appliedPromoId,
          error: err instanceof Error ? err.message : String(err),
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
        error: err instanceof Error ? err.message : String(err),
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
    const store = await this.checkoutRepo.getStoreById(payload.store_id);
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    const rawStoreStatus = isStoreCurrentlyOpen(store);
    const storeStatus = {
      is_open: rawStoreStatus.isOpen,
      label_fr: rawStoreStatus.labelFr,
      label_ar: rawStoreStatus.labelAr,
    };

    if (enforceOpen && !storeStatus.is_open) {
      throw new ConflictError('Store is currently closed. Please try again later.');
    }

    const menuItemIds = payload.items.map((item) => item.menu_item_id);
    const menuItems = await this.checkoutRepo.getMenuItemsByIds(menuItemIds, payload.store_id);
    const menuMap = new Map<string, MenuItemDbRow>(menuItems.map((menu) => [menu.id, menu]));

    const missingItems = menuItemIds.filter((id) => !menuMap.has(id));
    if (missingItems.length > 0) {
      throw new BadRequestError('Some products are not available in this store');
    }

    const unavailableItems = payload.items.filter((item) => !menuMap.get(item.menu_item_id)?.is_available);
    if (unavailableItems.length > 0) {
      const names = unavailableItems.map((item) => menuMap.get(item.menu_item_id)?.name_ar || item.menu_item_id);
      throw new ConflictError(`Some products are currently unavailable: ${names.join(', ')}`);
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
      throw new ConflictError('Delivery pricing is unavailable for this store.');
    }
    const deliveryFeeDh = this.roundDh(rawDeliveryFee);
    const serviceFeeDh = this.roundDh(await this.checkoutRepo.getServiceFeeDh());
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
    const dbOptions = this.parseMenuOptions(menu);
    const clientOptions = Array.isArray(input.options) ? input.options : [];
    let optionsCostDh = 0;
    const validatedOptions: CheckoutDbOption[] = [];

    for (const clientOption of clientOptions) {
      const group = dbOptions.find(
        (candidate: any) => candidate.id === clientOption.option_id || candidate.label === clientOption.option_id,
      );
      if (!group) {
        throw new BadRequestError(`Invalid option group '${clientOption.option_id}'`);
      }

      const choices = group.options || group.items || group.choices || [];
      const choice = choices.find(
        (candidate: any) =>
          candidate.id === clientOption.choice_id ||
          candidate.name === clientOption.choice_id ||
          candidate.name_ar === clientOption.choice_id,
      );
      if (!choice) {
        throw new BadRequestError(`Invalid option choice '${clientOption.choice_id}'`);
      }

      const priceDeltaDh = this.roundDh(Number(choice.price_delta ?? choice.price ?? choice.extra ?? 0));
      optionsCostDh += priceDeltaDh;

      validatedOptions.push({
        option_id: group.id || group.label,
        option_label: group.label || group.name || '',
        choice_id: choice.id,
        choice_name: choice.name || choice.name_ar || clientOption.choice_name || '',
        price_delta: priceDeltaDh,
      });
    }

    for (const group of dbOptions) {
      if (!group.required) continue;
      const hasSelection = clientOptions.some(
        (option) => option.option_id === group.id || option.option_id === group.label,
      );
      if (!hasSelection) {
        throw new BadRequestError(`Required option '${group.label || group.id}' is missing`);
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

  private parseMenuOptions(menu: MenuItemDbRow): any[] {
    if (!menu.options) return [];
    if (Array.isArray(menu.options)) return menu.options;
    if (typeof menu.options === 'string') {
      try {
        const parsed = JSON.parse(menu.options);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        throw new BadRequestError('Invalid product options configuration');
      }
    }
    throw new BadRequestError('Invalid product options configuration');
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
    return this.roundDh(Number(menu.price));
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
    const invalid = (reason: string) => ({
      discountDh: 0,
      appliedPromoId: null,
      promo: { code, is_valid: false, discount_dh: 0, reason },
    });

    if (!promo) return invalid('not_found');
    if (!promo.is_active) return invalid('inactive');
    if (promo.store_id && String(promo.store_id) !== String(storeId)) return invalid('wrong_store');
    if (promo.end_at && new Date(promo.end_at) <= new Date()) return invalid('expired');
    if (promo.max_uses && promo.uses_count >= promo.max_uses) return invalid('usage_limit_reached');

    if (promo.max_uses_per_user !== undefined && promo.max_uses_per_user !== null) {
      const userUses = await this.checkoutRepo.getUserPromoUsesCount(userId, promo.id);
      if (userUses >= promo.max_uses_per_user) return invalid('user_limit_reached');
    }

    const subtotalCentimes = Math.round(subtotalDh * 100);
    if (subtotalCentimes < (promo.min_order_centimes || 0)) return invalid('minimum_order_not_reached');

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
      items: quote.items.map((item) => ({
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
      })),
      subtotal_dh: quote.subtotalDh,
      delivery_fee_dh: quote.deliveryFeeDh,
      service_fee_dh: quote.serviceFeeDh,
      discount_dh: quote.discountDh,
      rider_tip_dh: quote.riderTipDh,
      total_dh: quote.totalDh,
      promo: quote.promo,
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
