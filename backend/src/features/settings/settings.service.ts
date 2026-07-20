import { supabase } from '../../db/supabase';
import { SettingsRepository } from './settings.repository';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';
import { moneyDto, parseDhToCentimes } from '../../utils/money';

export class SettingsService {
  private repo = new SettingsRepository();

  private readonly protectedMoneySettings = new Set([
    'driver_delivery_commission_percent',
    'driver_tip_commission_percent',
    'driver_min_delivery_earning_centimes',
    'driver_commission_hold_until_shift_end',
    'driver_cod_payout_requires_settlement',
    'driver_high_tip_review_threshold_centimes',
  ]);

  private validateSettingValue(key: string, value: unknown): string {
    const raw = String(value).trim();
    const percentKeys = new Set([
      'driver_delivery_commission_percent',
      'driver_tip_commission_percent',
    ]);
    const centimeKeys = new Set([
      'driver_min_delivery_earning_centimes',
      'driver_high_tip_review_threshold_centimes',
    ]);
    const booleanKeys = new Set([
      'driver_commission_hold_until_shift_end',
      'driver_cod_payout_requires_settlement',
    ]);

    if (percentKeys.has(key)) {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        throw new BadRequestError(`${key} doit etre un pourcentage entre 0 et 100.`);
      }
      return String(parsed);
    }

    if (centimeKeys.has(key)) {
      const parsed = Number(raw);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new BadRequestError(`${key} doit etre un montant entier en centimes >= 0.`);
      }
      return String(parsed);
    }

    if (booleanKeys.has(key)) {
      const normalized = raw.toLowerCase();
      if (!['true', 'false'].includes(normalized)) {
        throw new BadRequestError(`${key} doit etre true ou false.`);
      }
      return normalized;
    }

    return raw;
  }

  private promotionDto(row: any, storeName?: string | null) {
    const minOrderCentimes = Number(row.min_order_centimes || 0);
    const isFixedDiscount = row.discount_type === 'fixed';
    const discountValueCentimes = Number(row.discount_value || 0);

    const {
      min_order_centimes: _minOrderCentimes,
      ...rest
    } = row;

    return {
      ...rest,
      discount_value: isFixedDiscount ? moneyDto(discountValueCentimes) : Number(row.discount_value || 0),
      min_order_dh: moneyDto(minOrderCentimes),
      store_name: row.store_id ? storeName || null : null,
    };
  }

  private normalizePromotionWritePayload(payload: any, partial = false) {
    const clean: any = {};

    const allowed = ['title_ar', 'code', 'discount_type', 'discount_value', 'discount_value_dh', 'min_order_dh', 'max_uses', 'start_at', 'end_at', 'is_active', 'store_id'];
    for (const key of allowed) {
      if (payload[key] !== undefined) clean[key] = payload[key];
    }

    if (!partial) {
      clean.discount_type = clean.discount_type || 'percentage';
      clean.discount_value = clean.discount_value ?? 10;
      clean.min_order_dh = clean.min_order_dh ?? 0;
      clean.start_at = clean.start_at || new Date().toISOString();
    }

    if (clean.discount_type !== undefined && !['percentage', 'fixed'].includes(clean.discount_type)) {
      throw new BadRequestError('Type de remise invalide.');
    }

    const effectiveType = clean.discount_type || payload.discount_type;
    if (clean.discount_value_dh !== undefined) {
      clean.discount_value = parseDhToCentimes(clean.discount_value_dh);
      delete clean.discount_value_dh;
    } else if (clean.discount_value !== undefined && effectiveType === 'fixed') {
      clean.discount_value = parseDhToCentimes(clean.discount_value);
    } else if (clean.discount_value !== undefined) {
      const percent = Number(clean.discount_value);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        throw new BadRequestError('La remise en pourcentage doit etre entre 0 et 100.');
      }
      clean.discount_value = percent;
    }

    if (clean.min_order_dh !== undefined) {
      clean.min_order_centimes = parseDhToCentimes(clean.min_order_dh);
      delete clean.min_order_dh;
    }

    if (clean.code === '') clean.code = null;
    if (clean.max_uses === '') clean.max_uses = null;
    if (clean.store_id === '') clean.store_id = null;
    if (clean.end_at === '') clean.end_at = null;

    return clean;
  }

  // --- APP SETTINGS ---
  async getSettings() {
    return this.repo.getSettings();
  }

  async updateSettings(updates: Record<string, any>, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const oldSettings = await this.repo.getSettings();
    const cleanUpdates: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      cleanUpdates[key] = this.validateSettingValue(key, value);
    }

    for (const [key, value] of Object.entries(cleanUpdates)) {
      await this.repo.updateSetting(key, value);
    }

    // Log audit event
    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'settings_updated',
      entity_type: 'app_settings',
      summary: `Mise à jour des paramètres système par ${context.adminEmail}`,
      old_value: oldSettings,
      new_value: cleanUpdates,
      ip: context.ip,
    });

    return { ok: true };
  }

  async deleteSetting(key: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    if (!key || !key.trim()) {
      throw new BadRequestError('cle de parametre requise');
    }

    if (this.protectedMoneySettings.has(key.trim())) {
      throw new BadRequestError('Ce parametre financier est protege. Modifiez sa valeur au lieu de le supprimer.');
    }

    const oldSettings = await this.repo.getSettings();
    const before = oldSettings[key] ?? null;

    await this.repo.deleteSetting(key);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'setting_deleted',
      entity_type: 'app_settings',
      entity_id: key,
      summary: `Parametre ${key} supprime par ${context.adminEmail}`,
      old_value: { [key]: before },
      ip: context.ip,
    });

    return { ok: true };
  }

  async getPublicSettings() {
    const PUBLIC_KEYS = [
      'maintenance_mode',
      'maintenance_message_fr',
      'maintenance_message_ar',
      'min_required_version_ios',
      'min_required_version_android',
      'support_phone_e164',
      'support_phone',
      'whatsapp_support',
      'feature_referrals_enabled',
      'feature_loyalty_enabled',
      'feature_reorder_enabled',
      'feature_tracking_chat_enabled',
      'feature_customer_google_auth_enabled',
      'feature_customer_facebook_auth_enabled',
      'feature_customer_email_otp_enabled',
      'feature_customer_whatsapp_otp_enabled',
      'auth_whatsapp_trial_mode',
    ];
    return this.repo.getPublicSettings(PUBLIC_KEYS);
  }

  async getPublicNotificationFeed() {
    return this.repo.getPublicNotificationFeed();
  }

  // --- CITIES ---
  async getCities() {
    return this.repo.getCities();
  }

  async getPublicCities() {
    return this.repo.getPublicCities();
  }

  async createCity(payload: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const { name_ar, name_fr, sort_order, is_active } = payload;
    if (!name_ar || !name_fr) {
      throw new BadRequestError('name_ar et name_fr requis');
    }

    const city = await this.repo.createCity({
      name_ar,
      name_fr,
      sort_order: sort_order || 0,
      is_active: is_active !== false,
    });

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'city_created',
      entity_type: 'city',
      entity_id: city.id,
      summary: `${name_fr} / ${name_ar}`,
      new_value: city,
      ip: context.ip,
    });

    return city;
  }

  async updateCity(id: string, updates: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const before = await this.repo.findCityById(id);
    if (!before) {
      throw new NotFoundError('Ville introuvable');
    }

    const cleanUpdates: any = {};
    if (updates.name_ar !== undefined) cleanUpdates.name_ar = updates.name_ar;
    if (updates.name_fr !== undefined) cleanUpdates.name_fr = updates.name_fr;
    if (updates.sort_order !== undefined) cleanUpdates.sort_order = updates.sort_order;
    if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active;

    if (Object.keys(cleanUpdates).length === 0) {
      return { ok: true };
    }

    const city = await this.repo.updateCity(id, cleanUpdates);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'city_updated',
      entity_type: 'city',
      entity_id: id,
      summary: before.name_fr,
      old_value: before,
      new_value: cleanUpdates,
      ip: context.ip,
    });

    return { ok: true, city };
  }

  async deleteCity(id: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const before = await this.repo.findCityById(id);
    if (!before) {
      throw new NotFoundError('Ville introuvable');
    }

    await this.repo.deleteCity(id);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'city_deleted',
      entity_type: 'city',
      entity_id: id,
      summary: before.name_fr,
      old_value: before,
      ip: context.ip,
    });

    return { ok: true };
  }

  // --- SERVICE CATEGORIES ---
  async getCategories(type?: string) {
    return this.repo.getCategories(type);
  }

  async getPublicCategories(type?: string) {
    return this.repo.getPublicCategories(type);
  }

  async createCategory(payload: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const { name_ar, name_fr, type, parent_id, icon_emoji, color_hex, sort_order, is_active } = payload;
    if (!name_ar || !name_fr || !type) {
      throw new BadRequestError('name_ar, name_fr, type requis');
    }
    if (!['service', 'store', 'product', 'errand'].includes(type)) {
      throw new BadRequestError('type de catégorie invalide');
    }

    if (parent_id) {
      const parent = await this.repo.findCategoryById(parent_id);
      if (!parent) {
        throw new BadRequestError('La catégorie parente spécifiée n\'existe pas.');
      }
      if (parent.parent_id) {
        throw new BadRequestError('La catégorie parente ne peut pas elle-même avoir un parent (niveau maximum de 2).');
      }
    }

    const category = await this.repo.createCategory({
      name_ar,
      name_fr,
      type,
      parent_id: parent_id || null,
      icon_emoji: icon_emoji || null,
      color_hex: color_hex || '#F03030',
      sort_order: sort_order || 0,
      is_active: is_active !== false,
    });

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'category_created',
      entity_type: 'service_category',
      entity_id: category.id,
      summary: `${type}: ${name_fr}`,
      new_value: category,
      ip: context.ip,
    });

    return category;
  }

  async updateCategory(id: string, updates: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const before = await this.repo.findCategoryById(id);
    if (!before) {
      throw new NotFoundError('Catégorie introuvable');
    }

    const allowed = ['name_ar', 'name_fr', 'type', 'parent_id', 'icon_emoji', 'color_hex', 'sort_order', 'is_active'];
    const cleanUpdates: any = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    }

    if (cleanUpdates.parent_id) {
      if (cleanUpdates.parent_id === id) {
        throw new BadRequestError('Une catégorie ne peut pas être son propre parent.');
      }
      const parent = await this.repo.findCategoryById(cleanUpdates.parent_id);
      if (!parent) {
        throw new BadRequestError('La catégorie parente spécifiée n\'existe pas.');
      }
      if (parent.parent_id) {
        throw new BadRequestError('La catégorie parente ne peut pas elle-même avoir un parent (niveau maximum de 2).');
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return { ok: true };
    }

    const category = await this.repo.updateCategory(id, cleanUpdates);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'category_updated',
      entity_type: 'service_category',
      entity_id: id,
      summary: before.name_fr,
      old_value: before,
      new_value: cleanUpdates,
      ip: context.ip,
    });

    return { ok: true, category };
  }

  async deleteCategory(id: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const before = await this.repo.findCategoryById(id);
    if (!before) {
      throw new NotFoundError('Catégorie introuvable');
    }

    await this.repo.deleteCategory(id);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'category_deleted',
      entity_type: 'service_category',
      entity_id: id,
      summary: before.name_fr,
      old_value: before,
      ip: context.ip,
    });

    return { ok: true };
  }

  // --- DELIVERY ZONES ---
  async getZones() {
    return this.repo.getZones();
  }

  async createZone(payload: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const { name_ar, description_ar, neighborhoods, delivery_fee, min_order_centimes, sort_order, is_active } = payload;
    if (!name_ar) {
      throw new BadRequestError('nom de la zone requis');
    }

    const zone = await this.repo.createZone({
      name_ar,
      description_ar: description_ar || null,
      neighborhoods: neighborhoods || null,
      delivery_fee: delivery_fee || 1500,
      min_order_centimes: min_order_centimes || 0,
      sort_order: sort_order || 0,
      is_active: is_active !== false,
    });

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'zone_created',
      entity_type: 'delivery_zone',
      entity_id: zone.id,
      summary: zone.name_ar,
      new_value: zone,
      ip: context.ip,
    });

    return zone;
  }

  async updateZone(id: string, updates: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const allowed = ['name_ar', 'description_ar', 'neighborhoods', 'delivery_fee', 'min_order_centimes', 'sort_order', 'is_active'];
    const cleanUpdates: any = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return { ok: true };
    }

    const zone = await this.repo.updateZone(id, cleanUpdates);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'zone_updated',
      entity_type: 'delivery_zone',
      entity_id: id,
      summary: zone.name_ar,
      new_value: cleanUpdates,
      ip: context.ip,
    });

    return { ok: true, zone };
  }

  async deleteZone(id: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    await this.repo.deleteZone(id);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'zone_deleted',
      entity_type: 'delivery_zone',
      entity_id: id,
      summary: `Zone ${id} supprimée`,
      ip: context.ip,
    });

    return { ok: true };
  }

  // --- PROMOTIONS ---
  async getPromotions() {
    const rows = await this.repo.getPromotions();
    const storeIds = [...new Set(rows.map(r => r.store_id).filter(Boolean))];
    const storeNames = storeIds.length ? await this.repo.getStoreNames(storeIds) : {};

    return rows.map(r => this.promotionDto(r, r.store_id ? storeNames[r.store_id] || null : null));
  }

  async createPromotion(payload: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const { title_ar } = payload;
    if (!title_ar) {
      throw new BadRequestError('Titre de la promotion requis');
    }

    const clean = this.normalizePromotionWritePayload(payload);

    const promo = await this.repo.createPromotion({
      title_ar,
      code: clean.code || null,
      discount_type: clean.discount_type || 'percentage',
      discount_value: clean.discount_value ?? 10,
      min_order_centimes: clean.min_order_centimes || 0,
      max_uses: clean.max_uses || null,
      start_at: clean.start_at || new Date().toISOString(),
      end_at: clean.end_at || null,
      is_active: clean.is_active !== false,
      store_id: clean.store_id || null,
    });

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'promotion_created',
      entity_type: 'promotion',
      entity_id: promo.id,
      summary: `${promo.code || 'Auto-Discount'} : ${promo.title_ar}`,
      new_value: promo,
      ip: context.ip,
    });

    return this.promotionDto(promo);
  }

  async updatePromotion(id: string, updates: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const cleanUpdates = this.normalizePromotionWritePayload(updates, true);

    if (Object.keys(cleanUpdates).length === 0) {
      return { ok: true };
    }

    const promo = await this.repo.updatePromotion(id, cleanUpdates);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'promotion_updated',
      entity_type: 'promotion',
      entity_id: id,
      summary: `${promo.code || 'Discount'} : ${promo.title_ar}`,
      new_value: cleanUpdates,
      ip: context.ip,
    });

    return { ok: true, promo: this.promotionDto(promo) };
  }

  async deletePromotion(id: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    await this.repo.deletePromotion(id);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'promotion_deleted',
      entity_type: 'promotion',
      entity_id: id,
      summary: `Promotion ${id} supprimée`,
      ip: context.ip,
    });

    return { ok: true };
  }

  async getActivePromotions() {
    const rows = await this.repo.getActivePromotions();
    const storeIds = [...new Set(rows.map(r => r.store_id).filter(Boolean))];
    const storeNames = storeIds.length ? await this.repo.getStoreNames(storeIds) : {};

    return rows.map(r => this.promotionDto(r, r.store_id ? storeNames[r.store_id] || null : null));
  }

  async validatePromo(payload: any) {
    const { code, store_id } = payload;
    if (!code) {
      throw new BadRequestError('الكود مطلوب');
    }
    if (payload.order_total_dh === undefined) {
      throw new BadRequestError('order_total_dh requis.');
    }

    const promo = await this.repo.validatePromo(code, store_id);
    if (!promo) {
      return { valid: false, message: 'كود الخصم غير صحيح أو منتهي الصلاحية' };
    }

    const total = parseDhToCentimes(payload.order_total_dh);
    if (promo.min_order_centimes > 0 && total > 0 && total < promo.min_order_centimes) {
      return { valid: false, message: `الحد الأدنى للطلب ${moneyDto(promo.min_order_centimes).toFixed(0)} DH.` };
    }

    const discount_amount = promo.discount_type === 'percentage'
      ? Math.round((total * promo.discount_value) / 100)
      : promo.discount_value;

    const discountAmountDh = moneyDto(discount_amount);

    return {
      valid: true,
      promo_id: promo.id,
      title_ar: promo.title_ar,
      discount_type: promo.discount_type,
      discount_value: promo.discount_type === 'fixed' ? moneyDto(promo.discount_value) : promo.discount_value,
      discount_amount_dh: discountAmountDh,
      message: promo.discount_type === 'percentage'
        ? `خصم ${promo.discount_value}% — ${promo.title_ar}`
        : `خصم ${moneyDto(promo.discount_value).toFixed(0)} DH — ${promo.title_ar}`,
    };
  }

  // --- BANNERS ---
  async getBanners() {
    return this.repo.getBanners();
  }

  async createBanner(payload: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const { title_ar, subtitle_ar, image_url, bg_color, gradient_to, link_type, link_value, sort_order, is_active } = payload;
    if (!title_ar) {
      throw new BadRequestError('العنوان مطلوب');
    }

    const banner = await this.repo.createBanner({
      title_ar,
      subtitle_ar: subtitle_ar || null,
      image_url: image_url || null,
      bg_color: bg_color || '#F03030',
      gradient_to: gradient_to || '#C42020',
      link_type: link_type || 'none',
      link_value: link_value || null,
      sort_order: sort_order || 0,
      is_active: is_active !== false,
    });

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'banner_created',
      entity_type: 'banner',
      entity_id: banner.id,
      summary: banner.title_ar,
      new_value: banner,
      ip: context.ip,
    });

    return banner;
  }

  async updateBanner(id: string, updates: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const allowed = ['title_ar', 'subtitle_ar', 'image_url', 'bg_color', 'gradient_to', 'link_type', 'link_value', 'sort_order', 'is_active'];
    const cleanUpdates: any = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return { ok: true };
    }

    const banner = await this.repo.updateBanner(id, cleanUpdates);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'banner_updated',
      entity_type: 'banner',
      entity_id: id,
      summary: banner.title_ar,
      new_value: cleanUpdates,
      ip: context.ip,
    });

    return { ok: true, banner };
  }

  async deleteBanner(id: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    await this.repo.deleteBanner(id);

    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'banner_deleted',
      entity_type: 'banner',
      entity_id: id,
      summary: `Banner ${id} supprimé`,
      ip: context.ip,
    });

    return { ok: true };
  }

  async getPublicBanners() {
    return this.repo.getPublicBanners();
  }

  async getContent(type?: string) {
    const rows = await this.repo.getJsonSetting<any[]>('admin_content_rows', []);
    return type ? rows.filter(row => row.type === type) : rows;
  }

  async createContent(payload: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const slug = String(payload.slug || '').trim();
    if (!slug) throw new BadRequestError('slug requis');
    const rows = await this.repo.getJsonSetting<any[]>('admin_content_rows', []);
    if (rows.some(row => row.slug === slug)) throw new BadRequestError('slug deja utilise');
    const row = {
      slug,
      type: payload.type || 'faq',
      titleFr: payload.titleFr || '',
      titleAr: payload.titleAr || '',
      bodyFr: payload.bodyFr || '',
      bodyAr: payload.bodyAr || '',
      position: Number(payload.position || 0),
      isActive: payload.isActive !== false,
      updatedAt: new Date().toISOString(),
    };
    rows.push(row);
    await this.repo.setJsonSetting('admin_content_rows', rows);
    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'content_created',
      entity_type: 'app_content',
      entity_id: slug,
      summary: slug,
      new_value: row,
      ip: context.ip,
    });
    if (row.isActive) {
      let notifTitle = "Mise à jour de l'application 📄 / تحديث التطبيق";
      let notifBody = "Le document " + row.titleFr + " a été mis à jour. / " + "تم تحديث المستند " + row.titleAr + ". [app_content: " + row.type + "]";

      if (row.type === 'faq') {
        notifTitle = "Mise à jour FAQ ❓ / تحديث الأسئلة الشائعة";
        notifBody = "Consultez les nouvelles questions répondues. / راجع الأسئلة والأجوبة الجديدة. [app_content: faq]";
      } else if (row.type === 'terms') {
        notifTitle = "Conditions d'Utilisation 📄 / شروط الاستخدام";
        notifBody = "Les Conditions Générales d'Utilisation ont été mises à jour. / تم تحديث شروط الاستخدام. [app_content: terms]";
      } else if (row.type === 'privacy') {
        notifTitle = "Politique de Confidentialité 🔒 / سياسة الخصوصية";
        notifBody = "La politique de confidentialité a été mise à jour. / تم تحديث سياسة الخصوصية. [app_content: privacy]";
      } else if (row.type === 'about') {
        notifTitle = "À Propos de Jaheez ℹ️ / معلومات عن جاهز";
        notifBody = "Découvrez les nouveautés sur notre plateforme. / تعرف على آخر التحديثات على منصتنا. [app_content: about]";
      }

      await supabase.from('notifications_log').insert({
        title: notifTitle,
        body: notifBody,
        target: 'all',
        sent_by: 'system_admin_edit',
      });
    }

    return row;
  }

  async updateContent(slug: string, updates: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const rows = await this.repo.getJsonSetting<any[]>('admin_content_rows', []);
    const index = rows.findIndex(row => row.slug === slug);
    if (index === -1) throw new NotFoundError('Contenu introuvable');
    const before = rows[index];
    rows[index] = {
      ...before,
      titleFr: updates.titleFr ?? before.titleFr,
      titleAr: updates.titleAr ?? before.titleAr,
      bodyFr: updates.bodyFr ?? before.bodyFr,
      bodyAr: updates.bodyAr ?? before.bodyAr,
      position: updates.position !== undefined ? Number(updates.position) : before.position,
      isActive: updates.isActive !== undefined ? updates.isActive : before.isActive,
      updatedAt: new Date().toISOString(),
    };
    await this.repo.setJsonSetting('admin_content_rows', rows);
    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'content_updated',
      entity_type: 'app_content',
      entity_id: slug,
      summary: slug,
      old_value: before,
      new_value: rows[index],
      ip: context.ip,
    });

    const row = rows[index];
    if (row.isActive) {
      let notifTitle = "Mise à jour de l'application 📄 / تحديث التطبيق";
      let notifBody = "Le document " + row.titleFr + " a été mis à jour. / " + "تم تحديث المستند " + row.titleAr + ". [app_content: " + row.type + "]";

      if (row.type === 'faq') {
        notifTitle = "Mise à jour FAQ ❓ / تحديث الأسئلة الشائعة";
        notifBody = "Consultez les nouvelles questions répondues. / راجع الأسئلة والأجوبة الجديدة. [app_content: faq]";
      } else if (row.type === 'terms') {
        notifTitle = "Conditions d'Utilisation 📄 / شروط الاستخدام";
        notifBody = "Les Conditions Générales d'Utilisation ont été mises à jour. / تم تحديث شروط الاستخدام. [app_content: terms]";
      } else if (row.type === 'privacy') {
        notifTitle = "Politique de Confidentialité 🔒 / سياسة الخصوصية";
        notifBody = "La politique de confidentialité a été mise à jour. / تم تحديث سياسة الخصوصية. [app_content: privacy]";
      } else if (row.type === 'about') {
        notifTitle = "À Propos de Jaheez ℹ️ / معلومات عن جاهز";
        notifBody = "Découvrez les nouveautés sur notre plateforme. / تعرف على آخر التحديثات على منصتنا. [app_content: about]";
      }

      await supabase.from('notifications_log').insert({
        title: notifTitle,
        body: notifBody,
        target: 'all',
        sent_by: 'system_admin_edit',
      });
    }

    return rows[index];
  }

  async deleteContent(slug: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const rows = await this.repo.getJsonSetting<any[]>('admin_content_rows', []);
    const before = rows.find(row => row.slug === slug);
    if (!before) throw new NotFoundError('Contenu introuvable');
    await this.repo.setJsonSetting('admin_content_rows', rows.filter(row => row.slug !== slug));
    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'content_deleted',
      entity_type: 'app_content',
      entity_id: slug,
      summary: slug,
      old_value: before,
      ip: context.ip,
    });
    return { message: 'deleted' };
  }

  async getVehicleTypes() {
    const defaults = [
      { id: 'motorcycle', slug: 'motorcycle', labelFr: 'Moto', labelAr: 'دراجة نارية', iconName: 'bike', isActive: true, displayOrder: 1 },
      { id: 'bicycle', slug: 'bicycle', labelFr: 'Velo', labelAr: 'دراجة', iconName: 'bike', isActive: true, displayOrder: 2 },
      { id: 'car', slug: 'car', labelFr: 'Voiture', labelAr: 'سيارة', iconName: 'car', isActive: true, displayOrder: 3 },
    ];
    return this.repo.getJsonSetting<any[]>('vehicle_types', defaults);
  }

  async createVehicleType(payload: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const slug = String(payload.slug || '').trim();
    if (!slug) throw new BadRequestError('slug requis');
    const rows = await this.getVehicleTypes();
    if (rows.some(row => row.slug === slug || row.id === slug)) throw new BadRequestError('slug deja utilise');
    const row = {
      id: slug,
      slug,
      labelFr: payload.labelFr || slug,
      labelAr: payload.labelAr || '',
      iconName: payload.iconName || 'bike',
      isActive: payload.isActive !== false,
      displayOrder: Number(payload.displayOrder || rows.length + 1),
    };
    rows.push(row);
    await this.repo.setJsonSetting('vehicle_types', rows);
    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'vehicle_type_created',
      entity_type: 'vehicle_type',
      entity_id: row.id,
      summary: row.labelFr,
      new_value: row,
      ip: context.ip,
    });
    return row;
  }

  async updateVehicleType(id: string, updates: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const rows = await this.getVehicleTypes();
    const index = rows.findIndex(row => row.id === id);
    if (index === -1) throw new NotFoundError('Type de vehicule introuvable');
    const before = rows[index];
    rows[index] = {
      ...before,
      labelFr: updates.labelFr ?? before.labelFr,
      labelAr: updates.labelAr ?? before.labelAr,
      iconName: updates.iconName ?? before.iconName,
      isActive: updates.isActive !== undefined ? updates.isActive : before.isActive,
      displayOrder: updates.displayOrder !== undefined ? Number(updates.displayOrder) : before.displayOrder,
    };
    await this.repo.setJsonSetting('vehicle_types', rows);
    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'vehicle_type_updated',
      entity_type: 'vehicle_type',
      entity_id: id,
      summary: rows[index].labelFr,
      old_value: before,
      new_value: rows[index],
      ip: context.ip,
    });
    return rows[index];
  }

  async deleteVehicleType(id: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const rows = await this.getVehicleTypes();
    const before = rows.find(row => row.id === id);
    if (!before) throw new NotFoundError('Type de vehicule introuvable');
    await this.repo.setJsonSetting('vehicle_types', rows.filter(row => row.id !== id));
    await this.repo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'vehicle_type_deleted',
      entity_type: 'vehicle_type',
      entity_id: id,
      summary: before.labelFr,
      old_value: before,
      ip: context.ip,
    });
    return { message: 'deleted' };
  }
}
