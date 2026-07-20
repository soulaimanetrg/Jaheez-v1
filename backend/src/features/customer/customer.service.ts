import jwt from 'jsonwebtoken';
import { CustomerRepository } from './customer.repository';
import { OrderLifecycleService } from '../order/orderLifecycle.service';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError, UnauthorizedError } from '../../middleware/error.middleware';
import { supabase } from '../../db/supabase';
import { moneyDto } from '../../utils/money';
import { env } from '../../config/env';
import { getSocketIO } from '../realtime/socket.server';
import { REALTIME_EVENTS } from '../realtime/realtime.events';
import { SettingsService } from '../settings/settings.service';
import { StoreService } from '../store/store.service';
import { isStoreCurrentlyOpen } from '../store/storeStatus';
import type { StoreRow } from '../store/store.repository';

type CustomerHomeFeedQuery = {
  lat?: number;
  lng?: number;
};

type CustomerAnalyticsEventInput = {
  event_name: string;
  screen?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  app_version?: string;
  platform?: string;
};

type AnalyticsMetadataValue = string | number | boolean | null;

type HomeStoreRow = StoreRow & {
  distance?: number | null;
  cover_url?: string | null;
  review_count?: number | null;
  rating_count?: number | null;
  min_order_amount?: number | null;
  has_reduction?: boolean;
  reduction_percentage?: number | null;
  promo_type?: string | null;
};

const REORDER_STATUSES = new Set(['delivered', 'completed']);
const SENSITIVE_ANALYTICS_KEY = /(phone|token|password|otp|secret|session|auth|email|address|lat|lng|location|coordinate|idempotency|provider|raw|payload)/i;

function safeNumber(value: unknown, fallback: number | null = null): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value: number | null, precision = 2): number | null {
  if (value === null) return null;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function boolSetting(settings: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = settings[key];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return fallback;
}

function stringSetting(settings: Record<string, unknown>, key: string): string | null {
  const value = settings[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function sanitizeCustomerAnalyticsMetadata(metadata?: Record<string, unknown>): Record<string, AnalyticsMetadataValue> {
  if (!metadata) return {};

  return Object.entries(metadata).reduce<Record<string, AnalyticsMetadataValue>>((clean, [rawKey, rawValue]) => {
    const key = rawKey.trim();
    if (!key || key.length > 40 || SENSITIVE_ANALYTICS_KEY.test(key)) return clean;
    if (Object.keys(clean).length >= 20) return clean;

    if (typeof rawValue === 'string') {
      clean[key] = rawValue.slice(0, 160);
      return clean;
    }

    if (typeof rawValue === 'number') {
      if (Number.isFinite(rawValue)) clean[key] = rawValue;
      return clean;
    }

    if (typeof rawValue === 'boolean' || rawValue === null) {
      clean[key] = rawValue;
    }

    return clean;
  }, {});
}

export class CustomerService {
  private repo = new CustomerRepository();
  private lifecycleService = new OrderLifecycleService();
  private settingsService = new SettingsService();
  private storeService = new StoreService();

  async getWallet(userId: string) {
    const wallet = await this.repo.getWallet(userId);
    return { id: wallet?.id || '', user_id: userId, balance_dh: moneyDto(wallet?.balance_centimes || 0),
      created_at: wallet?.created_at || null, updated_at: wallet?.updated_at || null };
  }

  async getWalletTransactions(userId: string, type?: string) {
    const rows = await this.repo.getWalletTransactions(userId, type);
    return rows.map(({ amount_centimes, ...row }: any) => ({ ...row, amount_dh: moneyDto(amount_centimes) }));
  }

  upsertProfile(userId: string, input: Record<string, unknown>) {
    return this.repo.upsertUser(userId, input);
  }

  async getProfile(userId: string) {
    const user = await this.repo.getUser(userId);
    if (!user) throw new NotFoundError('Utilisateur introuvable', 'user_not_found');
    return user;
  }

  async getHomeFeed(userId: string, query: CustomerHomeFeedQuery) {
    const storeParams = {
      lat: query.lat,
      lng: query.lng,
    };

    const [
      publicSettings,
      serviceCategories,
      banners,
      promotions,
      featuredStores,
      nearbyStores,
      promoStores,
      activeOrder,
      recentOrders,
    ] = await Promise.all([
      this.settingsService.getPublicSettings(),
      this.settingsService.getPublicCategories('service'),
      this.settingsService.getPublicBanners(),
      this.settingsService.getActivePromotions(),
      this.storeService.getStores({ ...storeParams, is_featured: true }),
      this.storeService.getStores(storeParams),
      this.storeService.getStores({ ...storeParams, sort: 'promotions' }),
      this.repo.getActiveOrder(userId),
      this.repo.listOrders(userId, 1, 8),
    ]);

    return {
      generated_at: new Date().toISOString(),
      app_config: this.customerAppConfigDto(publicSettings || {}),
      service_categories: (serviceCategories || [])
        .filter((category: any) => category && category.is_active !== false && !category.parent_id)
        .slice(0, 12)
        .map((category: any) => ({
          id: category.id,
          name_ar: category.name_ar || '',
          name_fr: category.name_fr || '',
          type: category.type || 'service',
          parent_id: category.parent_id || null,
          icon_emoji: category.icon_emoji || null,
          color_hex: category.color_hex || null,
          sort_order: safeNumber(category.sort_order, 0) || 0,
        })),
      banners: (banners || []).slice(0, 8).map((banner: any) => ({
        id: banner.id,
        title_ar: banner.title_ar || '',
        subtitle_ar: banner.subtitle_ar || null,
        image_url: banner.image_url || null,
        link_type: banner.link_type || 'none',
        link_value: banner.link_value || null,
        sort_order: safeNumber(banner.sort_order, 0) || 0,
      })),
      promotions: (promotions || []).slice(0, 8).map((promotion: any) => this.promotionDto(promotion)),
      stores: {
        featured: featuredStores.slice(0, 10).map((store) => this.homeStoreCardDto(store as HomeStoreRow)),
        nearby: nearbyStores.slice(0, 12).map((store) => this.homeStoreCardDto(store as HomeStoreRow)),
        promos: promoStores.slice(0, 10).map((store) => this.homeStoreCardDto(store as HomeStoreRow)),
      },
      active_order: activeOrder ? this.activeOrderDto(activeOrder) : null,
      reorder_cards: (recentOrders || [])
        .filter((order: any) => REORDER_STATUSES.has(String(order.status || '')))
        .slice(0, 8)
        .map((order: any) => this.reorderCardDto(order))
        .filter(Boolean),
    };
  }

  async recordAnalyticsEvent(
    userId: string,
    input: CustomerAnalyticsEventInput,
    context: { userAgent?: string | null },
  ) {
    await this.repo.insertAnalyticsEvent({
      user_id: userId,
      event_name: input.event_name,
      screen: input.screen || null,
      entity_type: input.entity_type || null,
      entity_id: input.entity_id || null,
      metadata: sanitizeCustomerAnalyticsMetadata(input.metadata),
      app_version: input.app_version || null,
      platform: input.platform || 'unknown',
      ip_address: null,
      user_agent: context.userAgent ? context.userAgent.slice(0, 180) : null,
    });

    return { ok: true };
  }

  private customerAppConfigDto(settings: Record<string, unknown>) {
    return {
      maintenance: {
        enabled: boolSetting(settings, 'maintenance_mode', false),
        message_fr: stringSetting(settings, 'maintenance_message_fr'),
        message_ar: stringSetting(settings, 'maintenance_message_ar'),
      },
      force_update: {
        min_required_version_ios: stringSetting(settings, 'min_required_version_ios'),
        min_required_version_android: stringSetting(settings, 'min_required_version_android'),
      },
      support: {
        phone: stringSetting(settings, 'support_phone'),
        phone_e164: stringSetting(settings, 'support_phone_e164'),
        whatsapp: stringSetting(settings, 'whatsapp_support'),
      },
      feature_flags: {
        online_payments_enabled: false,
        referrals_enabled: boolSetting(settings, 'feature_referrals_enabled', true),
        loyalty_enabled: boolSetting(settings, 'feature_loyalty_enabled', true),
        reorder_enabled: boolSetting(settings, 'feature_reorder_enabled', true),
        tracking_chat_enabled: boolSetting(settings, 'feature_tracking_chat_enabled', true),
      },
    };
  }

  private homeStoreCardDto(store: HomeStoreRow) {
    return {
      id: store.id,
      name: store.name,
      name_ar: store.name_ar || null,
      logo_url: store.logo_url || null,
      cover_url: store.cover_url || null,
      category: store.category,
      cuisine_tags: Array.isArray(store.cuisine_tags) ? store.cuisine_tags : [],
      rating_avg: safeNumber(store.rating_avg, 0) || 0,
      review_count: safeNumber(store.review_count ?? store.rating_count, 0) || 0,
      delivery_fee_dh: safeNumber(store.delivery_fee, 0) || 0,
      delivery_time_min: safeNumber(store.delivery_time_min, 0) || 0,
      delivery_time_max: safeNumber(store.delivery_time_max, 0) || 0,
      min_order_amount_dh: safeNumber(store.min_order_amount, 0) || 0,
      distance_km: round(safeNumber(store.distance)),
      is_open: isStoreCurrentlyOpen(store).isOpen,
      is_featured: Boolean(store.is_featured),
      has_reduction: Boolean(store.has_reduction),
      reduction_percentage: safeNumber(store.reduction_percentage, 0) || 0,
      promo_type: store.promo_type || 'none',
    };
  }

  private promotionDto(promotion: any) {
    const discountType = promotion.discount_type === 'fixed' ? 'fixed' : 'percentage';
    return {
      id: promotion.id,
      title_ar: promotion.title_ar || '',
      code: promotion.code || null,
      discount:
        discountType === 'fixed'
          ? { type: 'fixed', amount_dh: safeNumber(promotion.discount_value, 0) || 0 }
          : { type: 'percentage', percentage: safeNumber(promotion.discount_value, 0) || 0 },
      min_order_dh: safeNumber(promotion.min_order_dh, 0) || 0,
      store_id: promotion.store_id || null,
      store_name: promotion.store_name || null,
      end_at: promotion.end_at || null,
    };
  }

  private activeOrderDto(order: any) {
    return {
      id: order.id,
      status: order.status,
      store_id: order.store_id || null,
      created_at: order.created_at || null,
      estimated_delivery_time: order.estimated_delivery_time || null,
    };
  }

  private reorderCardDto(order: any) {
    const store = order.store || {};
    const items = Array.isArray(order.items) ? order.items : [];
    return {
      order_id: order.id,
      store_id: order.store_id || store.id || null,
      store_name: store.name || null,
      store_name_ar: store.name_ar || null,
      store_logo_url: store.logo_url || null,
      item_count: items.reduce((sum: number, item: any) => sum + (safeNumber(item.quantity, 0) || 0), 0),
      total_amount_dh: safeNumber(order.total_amount ?? order.final_price, 0) || 0,
      ordered_at: order.created_at || null,
    };
  }

  private normalizePhone(phone: string): string {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) throw new BadRequestError('Numero de telephone invalide', 'invalid_phone');
    if (digits.startsWith('212')) return '+' + digits;
    if (digits.startsWith('0')) return '+212' + digits.slice(1);
    if (digits.length === 9 && /^[67]/.test(digits)) return '+212' + digits;
    if (digits.length >= 10) return '+' + digits;
    throw new BadRequestError('Numero de telephone invalide', 'invalid_phone');
  }

  private normalizeEmail(email: unknown): string | null {
    if (email === null || email === undefined) return null;
    const normalized = String(email).trim().toLowerCase();
    return normalized || null;
  }

  private verifyContactOtpProof(
    proofToken: unknown,
    expected: { phone?: string; email?: string },
  ): void {
    if (!proofToken || typeof proofToken !== 'string') {
      throw new BadRequestError('Verification OTP requise pour modifier ces informations', 'contact_otp_required');
    }

    let proof: any;
    try {
      proof = jwt.verify(proofToken, env.ADMIN_JWT_SECRET) as any;
    } catch {
      throw new UnauthorizedError('Verification OTP expiree ou invalide', 'contact_otp_invalid');
    }

    if (proof.kind !== 'otp_proof') {
      throw new UnauthorizedError('Verification OTP invalide', 'contact_otp_invalid');
    }

    if (expected.phone && proof.phone !== expected.phone) {
      throw new ForbiddenError('Le telephone verifie ne correspond pas au telephone demande', 'contact_otp_mismatch');
    }

    if (expected.email && proof.email !== expected.email) {
      throw new ForbiddenError('L email verifie ne correspond pas a l email demande', 'contact_otp_mismatch');
    }
  }

  async updateProfile(userId: string, updates: Record<string, any>) {
    const currentUser = await this.repo.getUser(userId);
    if (!currentUser) throw new NotFoundError('Utilisateur introuvable', 'user_not_found');

    const phoneOtpProof = updates.phone_otp_proof;
    const emailOtpProof = updates.email_otp_proof;
    const safeUpdates = { ...updates };
    delete safeUpdates.phone_otp_proof;
    delete safeUpdates.email_otp_proof;

    const authUpdates: Record<string, any> = {};

    const hasPhoneChanged = safeUpdates.phone !== undefined && this.normalizePhone(safeUpdates.phone) !== (currentUser.phone ? this.normalizePhone(currentUser.phone) : '');
    const hasEmailChanged = safeUpdates.email !== undefined && this.normalizeEmail(safeUpdates.email) !== this.normalizeEmail(currentUser.email);

    let authUser: any = null;
    if (hasPhoneChanged || hasEmailChanged) {
      const { data } = await supabase.auth.admin.getUserById(userId);
      authUser = data?.user;
    }

    if (safeUpdates.phone !== undefined) {
      const normalizedPhone = this.normalizePhone(safeUpdates.phone);
      const currentPhone = currentUser.phone ? this.normalizePhone(currentUser.phone) : '';

      safeUpdates.phone = normalizedPhone;
      if (normalizedPhone !== currentPhone) {
        const authPhone = authUser?.phone ? this.normalizePhone(authUser.phone) : '';
        if (authPhone !== normalizedPhone) {
          this.verifyContactOtpProof(phoneOtpProof, { phone: normalizedPhone });
          authUpdates.phone = normalizedPhone;
        }
      }
    }

    if (safeUpdates.email !== undefined) {
      const normalizedEmail = this.normalizeEmail(safeUpdates.email);
      const currentEmail = this.normalizeEmail(currentUser.email);

      safeUpdates.email = normalizedEmail;
      if (normalizedEmail && normalizedEmail !== currentEmail) {
        const authEmail = authUser?.email ? this.normalizeEmail(authUser.email) : '';
        if (authEmail !== normalizedEmail) {
          this.verifyContactOtpProof(emailOtpProof, { email: normalizedEmail });
          authUpdates.email = normalizedEmail;
        }
      }
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error } = await supabase.auth.admin.updateUserById(userId, authUpdates);
      if (error) {
        if (error.message.includes('already exists') || error.message.includes('unique constraint') || error.message.includes('registered')) {
          throw new ConflictError('Ce numéro de téléphone ou email est déjà utilisé');
        }
        throw new Error(`Failed to update auth info: ${error.message}`);
      }
    }

    return this.repo.updateUser(userId, safeUpdates);
  }


  updatePushToken(userId: string, pushToken: string) {
    return this.repo.updateUser(userId, { push_token: pushToken });
  }

  listAddresses(userId: string) {
    return this.repo.listAddresses(userId);
  }

  async createAddress(userId: string, input: Record<string, unknown>) {
    if (input.is_default && input.lat != null && input.lng != null && input.location_source) {
      return this.repo.upsertDefaultAddressAtomic(userId, input as Record<string, any>);
    }
    if (input.is_default) await this.repo.clearDefaultAddresses(userId);
    return this.repo.createAddress(userId, input);
  }

  async saveOnboardingAddress(userId: string, input: Record<string, unknown>) {
    return this.repo.upsertDefaultAddressAtomic(userId, { ...input, is_default: true } as Record<string, any>);
  }

  async updateAddress(userId: string, addressId: string, updates: Record<string, unknown>) {
    if (updates.is_default) await this.repo.clearDefaultAddresses(userId);
    const address = await this.repo.updateAddress(userId, addressId, updates);
    if (!address) throw new NotFoundError('Adresse introuvable', 'address_not_found');
    return address;
  }

  async deleteAddress(userId: string, addressId: string) {
    const deleted = await this.repo.deleteAddress(userId, addressId);
    if (!deleted) throw new NotFoundError('Adresse introuvable', 'address_not_found');
    return { ok: true };
  }

  async toggleFavorite(userId: string, storeId: string) {
    const existing = await this.repo.findFavorite(userId, storeId);
    if (existing) {
      await this.repo.removeFavorite(userId, storeId);
      return { favorited: false };
    }
    await this.repo.addFavorite(userId, storeId);
    return { favorited: true };
  }

  async checkFavorite(userId: string, storeId: string) {
    return { favorited: !!(await this.repo.findFavorite(userId, storeId)) };
  }

  createSupportTicket(userId: string, input: Record<string, unknown>) {
    return this.repo.createSupportTicket({
      ...input,
      user_id: userId,
      order_id: input.order_id || null,
      ref_number: `TKT-${Date.now().toString().slice(-6)}`,
      status: 'open',
    });
  }

  listSupportTickets(userId: string) {
    return this.repo.listSupportTickets(userId);
  }

  getActiveOrder(userId: string) {
    return this.repo.getActiveOrder(userId);
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.repo.getOrderById(userId, orderId);
    if (!order) throw new NotFoundError('Commande introuvable', 'order_not_found');
    if(order.order_type==='errand'&&order.driver) order.driver={...order.driver,phone:undefined};
    if(order.order_type==='errand'&&order.errand_details){
      const details=Array.isArray(order.errand_details)?order.errand_details[0]:order.errand_details;
      order.errand_details={...details,declared_value_dh:Number(details?.declared_value_centimes||0)/100,declared_value_centimes:undefined};
    }
    return order;
  }

  listOrders(userId: string, page = 1, pageSize = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(Math.max(1, Number(pageSize) || 20), 50);
    return this.repo.listOrders(userId, safePage, safePageSize);
  }

  async listChatMessages(userId: string, orderId: string) {
    const order = await this.repo.getOrderOwner(orderId);
    if (!order) throw new NotFoundError('Commande introuvable', 'order_not_found');
    if (order.user_id !== userId) throw new ForbiddenError('Commande non autorisee', 'order_forbidden');
    if (order.order_type === 'errand' && !order.driver_id) throw new ConflictError('Le chat sera disponible apres assignation du livreur.', 'errand_chat_not_assigned');
    return this.repo.listChatMessages(orderId);
  }

  async sendChatMessage(userId: string, orderId: string, content: string) {
    const order = await this.repo.getOrderOwner(orderId);
    if (!order) throw new NotFoundError('Commande introuvable', 'order_not_found');
    if (order.user_id !== userId) throw new ForbiddenError('Commande non autorisee', 'order_forbidden');
    if (order.order_type === 'errand' && !order.driver_id) throw new ConflictError('Le chat sera disponible apres assignation du livreur.', 'errand_chat_not_assigned');
    const message = await this.repo.insertChatMessage({
      order_id: orderId,
      sender_id: userId,
      sender_role: 'user',
      content,
      type: 'text',
    });

    getSocketIO()?.to(`order:${orderId}`).emit(REALTIME_EVENTS.CHAT_MESSAGE, {
      id: message.id,
      order_id: message.order_id,
      sender_id: message.sender_id,
      sender_role: message.sender_role,
      content: message.content,
      type: message.type,
      media_url: message.media_url || null,
      is_read: Boolean(message.is_read),
      created_at: message.created_at,
    });

    return message;
  }

  async submitReview(userId: string, orderId: string, rating: number, comment?: string) {
    const order = await this.repo.getOrderOwner(orderId);
    if (!order) throw new NotFoundError('Commande introuvable', 'order_not_found');
    if (order.user_id !== userId) throw new ForbiddenError('Commande non autorisee', 'order_forbidden');
    if (!order.store_id) throw new ConflictError('Commande sans magasin a evaluer', 'review_no_store');
    if (!['delivered', 'completed'].includes(order.status)) {
      throw new ConflictError('La commande doit etre livree avant evaluation', 'review_order_not_delivered');
    }
    const exists = await this.repo.checkStoreReviewExistsForOrder(orderId);
    if (exists) throw new ConflictError('Cette commande a deja ete evaluee', 'review_already_exists');

    const review = await this.repo.createReview({
      order_id: orderId,
      store_id: order.store_id,
      user_id: userId,
      rating,
      comment: comment || null,
      is_visible: true,
    });
    await this.recalcStoreRating(order.store_id);
    return review;
  }

  private async recalcStoreRating(storeId: string) {
    const ratings = await this.repo.getRatingsForStore(storeId);
    const count = ratings.length;
    const avg = count > 0 ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / count) * 10) / 10 : 0;
    await this.repo.updateStoreRating(storeId, avg, count);
  }

  async confirmDelivery(userId: string, orderId: string) {
    await this.lifecycleService.transitionOrder(
      orderId,
      { type: 'customer', id: userId },
      'completed',
      'Customer confirmed delivery'
    );
    return { ok: true, order_id: orderId, status: 'completed' };
  }

  async toggleFavoriteProduct(userId: string, menuItemId: string) {
    const existing = await this.repo.findFavoriteProduct(userId, menuItemId);
    if (existing) {
      await this.repo.removeFavoriteProduct(userId, menuItemId);
      return { favorited: false };
    }
    await this.repo.addFavoriteProduct(userId, menuItemId);
    return { favorited: true };
  }

  async checkFavoriteProduct(userId: string, menuItemId: string) {
    return { favorited: !!(await this.repo.findFavoriteProduct(userId, menuItemId)) };
  }

  async listFavoriteProducts(userId: string) {
    return this.repo.listFavoriteProducts(userId);
  }

  async listFavoriteStores(userId: string) {
    const favorites = await this.repo.listFavoriteStores(userId);
    if (!favorites || favorites.length === 0) return favorites;

    const stores = favorites.map((f: any) => f.stores).filter(Boolean);
    const storeService = new (require('../store/store.service').StoreService)();
    const enrichedStores = await storeService.enrichStoresWithPromo(stores);
    const enrichedMap = new Map(enrichedStores.map((s: any) => [s.id, s]));

    return favorites.map((f: any) => {
      if (f.stores && f.stores.id) {
        return {
          ...f,
          stores: enrichedMap.get(f.stores.id) || f.stores,
        };
      }
      return f;
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // 1. Fetch user's auth details
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(userId);
    if (getUserError || !user) {
      throw new NotFoundError('Utilisateur introuvable dans Supabase auth');
    }

    // 2. Verify current password by signing in
    const { createClient } = await import('@supabase/supabase-js');
    const { env } = await import('../../config/env');
    const authClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });

    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword(
      user.email
        ? { email: user.email, password: currentPassword }
        : { phone: user.phone || '', password: currentPassword }
    );

    if (signInError || !signInData.session) {
      throw new ForbiddenError('Mot de passe actuel incorrect');
    }

    // 3. Update to the new password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    return { success: true, message: 'Mot de passe modifié avec succès' };
  }
}
