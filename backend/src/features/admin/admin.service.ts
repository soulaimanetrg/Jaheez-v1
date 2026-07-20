import bcrypt from 'bcryptjs';
import { AdminRepository } from './admin.repository';
import { ConflictError, NotFoundError, BadRequestError } from '../../middleware/error.middleware';
import { DriverService } from '../driver/driver.service';
import { OrderLifecycleService } from '../order/orderLifecycle.service';
import { supabase } from '../../db/supabase';
import { DispatchRepository } from '../dispatch/dispatch.repository';
import { signAdminAccessToken } from '../../utils/jwt';
import { invalidateDriverActiveCache } from '../../utils/driverStatus';
import { REALTIME_EVENTS } from '../realtime/realtime.events';


export class AdminService {
  private adminRepo = new AdminRepository();
  private dispatchRepo = new DispatchRepository();

  private toAdminDto(admin: any) {
    const { password_hash, ...safeAdmin } = admin || {};
    return {
      ...safeAdmin,
      name: safeAdmin.full_name ?? safeAdmin.name ?? '',
      isActive: safeAdmin.is_active ?? safeAdmin.isActive ?? false,
      createdAt: safeAdmin.created_at ?? safeAdmin.createdAt ?? '',
      updatedAt: safeAdmin.updated_at ?? safeAdmin.updatedAt ?? '',
    };
  }

  /**
   * Admin creates driver account
   */
  async createDriver(payload: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const { full_name, cin, phone, password, vehicle_type, vehicle_plate, city, zone_id } = payload;

    const cleanCin = cin.trim().toUpperCase();

    // 1. Validate CIN uniqueness
    const existing = await this.adminRepo.findDriverByCin(cleanCin);
    if (existing) {
      throw new ConflictError(`Un livreur avec le CIN ${cleanCin} existe déjà.`);
    }
    if (await this.adminRepo.findDriverByPhone(phone)) {
      throw new ConflictError('Ce numero de telephone est deja utilise par un livreur.');
    }

    if (password.length < 8) {
      throw new BadRequestError('Le mot de passe doit comporter au moins 8 caractères.');
    }

    // 2. Hash password using bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    const driverData = {
      full_name: full_name.trim(),
      cin: cleanCin,
      phone: phone.trim(),
      password_hash: passwordHash,
      vehicle_type: vehicle_type || 'motorcycle',
      vehicle_plate: vehicle_plate || null,
      city: city || 'Safi',
      zone_id: zone_id || null,
      is_active: true,
      is_verified: true, // Compatibility behavior for activation
      kyc_status: 'verified', // Compatibility behavior for activation
      is_online: false,
      password_changed_at: null,
    };

    // 3. Create driver in DB
    const driver = await this.adminRepo.createDriver(driverData);

    // 4. Log audit event
    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'driver_created',
      entity_type: 'driver',
      entity_id: driver.id,
      summary: `Création du livreur ${driver.full_name} (CIN: ${driver.cin})`,
      new_value: {
        id: driver.id,
        full_name: driver.full_name,
        cin: driver.cin,
        phone: driver.phone,
        vehicle_type: driver.vehicle_type,
        city: driver.city,
        zone_id: driver.zone_id,
      },
      ip: context.ip,
    });

    // Remove password_hash from return payload
    const { password_hash, ...safeDriver } = driver;
    return safeDriver;
  }

  /**
   * Admin updates driver metadata or status
   */
  async updateDriver(id: string, updates: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const driver = await this.adminRepo.findDriverById(id);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable.');
    }

    const cleanUpdates: any = {};
    if (updates.full_name !== undefined) cleanUpdates.full_name = updates.full_name.trim();
    if (updates.phone !== undefined) cleanUpdates.phone = updates.phone.trim();
    if (updates.vehicle_type !== undefined) cleanUpdates.vehicle_type = updates.vehicle_type;
    if (updates.vehicle_plate !== undefined) cleanUpdates.vehicle_plate = updates.vehicle_plate;
    if (updates.city !== undefined) cleanUpdates.city = updates.city;
    if (updates.zone_id !== undefined) cleanUpdates.zone_id = updates.zone_id;
    if (updates.driver_otp_enabled !== undefined) cleanUpdates.driver_otp_enabled = updates.driver_otp_enabled;
    if (updates.reset_otp_lock === true) {
      cleanUpdates.otp_failed_attempts = 0;
      cleanUpdates.otp_locked_until = null;
      cleanUpdates.otp_challenge_nonce_hash = null;
      cleanUpdates.otp_challenge_expires_at = null;
    }
    
    if (updates.cin !== undefined) {
      const cleanCin = updates.cin.trim().toUpperCase();
      if (cleanCin !== driver.cin) {
        const existing = await this.adminRepo.findDriverByCin(cleanCin);
        if (existing) {
          throw new ConflictError(`Un livreur avec le CIN ${cleanCin} existe déjà.`);
        }
        cleanUpdates.cin = cleanCin;
      }
    }

    let isStatusChange = false;
    let auditAction = 'driver_updated';
    if (updates.is_active !== undefined) {
      cleanUpdates.is_active = updates.is_active;
      if (updates.is_active !== driver.is_active) {
        isStatusChange = true;
        auditAction = updates.is_active ? 'driver_reactivated' : 'driver_deactivated';
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      const { password_hash, ...safeDriver } = driver;
      return safeDriver;
    }

    // Update in DB
    const updated = await this.adminRepo.updateDriver(id, cleanUpdates);

    // Deactivation must lock the driver out immediately, not at cache expiry.
    if (isStatusChange) {
      await invalidateDriverActiveCache(id);
    }

    // Log audit event
    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: auditAction,
      entity_type: 'driver',
      entity_id: id,
      summary: isStatusChange
        ? `Livreur ${driver.full_name} ${updated.is_active ? 'réactivé' : 'désactivé'}`
        : `Mise à jour du livreur ${driver.full_name}`,
      old_value: {
        full_name: driver.full_name,
        cin: driver.cin,
        phone: driver.phone,
        is_active: driver.is_active,
        vehicle_type: driver.vehicle_type,
        driver_otp_enabled: driver.driver_otp_enabled,
        otp_locked_until: driver.otp_locked_until,
      },
      new_value: {
        full_name: updated.full_name,
        cin: updated.cin,
        phone: updated.phone,
        is_active: updated.is_active,
        vehicle_type: updated.vehicle_type,
        driver_otp_enabled: updated.driver_otp_enabled,
        otp_locked_until: updated.otp_locked_until,
      },
      ip: context.ip,
    });

    const { password_hash, ...safeDriver } = updated;
    return safeDriver;
  }

  /**
   * Admin resets driver password
   */
  async resetDriverPassword(id: string, newPassword: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const driver = await this.adminRepo.findDriverById(id);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable.');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('Le mot de passe doit comporter au moins 8 caractères.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updated = await this.adminRepo.updateDriver(id, {
      password_hash: passwordHash,
      password_changed_at: new Date().toISOString(),
    });

    // Log audit event
    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'driver_password_reset',
      entity_type: 'driver',
      entity_id: id,
      summary: `Réinitialisation du mot de passe du livreur ${driver.full_name}`,
      ip: context.ip,
    });

    const { password_hash, ...safeDriver } = updated;
    return safeDriver;
  }

  async getMe(adminId: string) {
    const admin = await this.adminRepo.findAdminById(adminId);
    if (!admin || admin.is_active === false) {
      throw new NotFoundError('الحساب غير موجود');
    }
    const { password_hash, ...safeAdmin } = admin;
    return { ...safeAdmin, auth_id: admin.id };
  }

  async listAdmins() {
    const admins = await this.adminRepo.listAdmins();
    return admins.map((admin: any) => this.toAdminDto(admin));
  }

  async createAdmin(payload: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const email = payload.email;
    const full_name = payload.full_name ?? payload.name;
    const password = payload.password;
    const role = payload.role;
    if (!email || !full_name || !password) {
      throw new BadRequestError('Tous les champs sont requis');
    }
    if (password.length < 8) {
      throw new BadRequestError('Mot de passe trop court (min 8)');
    }
    const finalRole = role || 'operations';
    const VALID_ROLES = ['super_admin', 'operations', 'finance', 'support', 'content_manager'];
    if (!VALID_ROLES.includes(finalRole)) {
      throw new BadRequestError('Rôle invalide');
    }

    const lower = email.toLowerCase().trim();
    const existing = await this.adminRepo.findAdminByEmail(lower);
    if (existing) {
      throw new ConflictError('Email déjà utilisé');
    }

    const hash = await bcrypt.hash(password, 12);
    const newAdmin = await this.adminRepo.createAdmin({
      email: lower,
      full_name,
      password_hash: hash,
      role: finalRole,
      is_active: true,
    });

    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'admin_created',
      entity_type: 'admin',
      entity_id: newAdmin.id,
      summary: `${newAdmin.email} (${finalRole})`,
      new_value: newAdmin,
      ip: context.ip,
    });

    return this.toAdminDto(newAdmin);
  }

  async updateAdmin(id: string, updates: any, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const is_active = updates.is_active ?? updates.isActive;
    const role = updates.role;
    const full_name = updates.full_name ?? updates.name;
    const password = updates.password;
    const VALID_ROLES = ['super_admin', 'operations', 'finance', 'support', 'content_manager'];
    if (role && !VALID_ROLES.includes(role)) {
      throw new BadRequestError('Rôle invalide');
    }

    const before = await this.adminRepo.findAdminById(id);
    if (!before) {
      throw new NotFoundError('Admin introuvable');
    }

    const isSelf = id === context.adminId;
    const roleChange = role !== undefined && role !== before.role;
    const activeChange = typeof is_active === 'boolean' && is_active !== before.is_active;
    if (isSelf && (roleChange || activeChange)) {
      throw new BadRequestError('Vous ne pouvez pas modifier votre role ou statut depuis votre propre compte');
    }

    const cleanUpdates: any = {};
    if (typeof is_active === 'boolean') cleanUpdates.is_active = is_active;
    if (role) cleanUpdates.role = role;
    if (full_name !== undefined) cleanUpdates.full_name = String(full_name).trim();
    if (password !== undefined && String(password).trim()) {
      if (String(password).length < 8) {
        throw new BadRequestError('Mot de passe trop court (min 8)');
      }
      cleanUpdates.password_hash = await bcrypt.hash(String(password), 12);
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return this.toAdminDto(before);
    }

    const updated = await this.adminRepo.updateAdmin(id, cleanUpdates);

    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'admin_updated',
      entity_type: 'admin',
      entity_id: id,
      summary: before.email,
      old_value: { is_active: before.is_active, role: before.role },
      new_value: cleanUpdates,
      ip: context.ip,
    });

    if (role && role !== before.role) {
      await this.adminRepo.writeAuditLog({
        admin_id: context.adminId,
        admin_email: context.adminEmail,
        action: 'role_changed',
        entity_type: 'admin',
        entity_id: id,
        summary: `${before.email}: ${before.role} → ${role}`,
        old_value: { role: before.role },
        new_value: { role },
        ip: context.ip,
      });
    }

    return this.toAdminDto(updated);
  }

  async deleteAdmin(id: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    if (id === context.adminId) {
      throw new BadRequestError('Vous ne pouvez pas desactiver votre propre compte');
    }

    const before = await this.adminRepo.findAdminById(id);
    if (!before) {
      throw new NotFoundError('Admin introuvable');
    }

    const updated = await this.adminRepo.updateAdmin(id, { is_active: false });
    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'admin_deactivated',
      entity_type: 'admin',
      entity_id: id,
      summary: before.email,
      old_value: { is_active: before.is_active },
      new_value: { is_active: false },
      ip: context.ip,
    });

    return this.toAdminDto(updated);
  }

  async resetAdminToken(id: string, context: { adminId: string | null; adminEmail: string | null; ip: string | null }) {
    const admin = await this.adminRepo.findAdminById(id);
    if (!admin || admin.is_active === false) {
      throw new NotFoundError('Admin introuvable');
    }

    const token = signAdminAccessToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      remember_me: false,
    });

    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'admin_token_issued',
      entity_type: 'admin',
      entity_id: id,
      summary: admin.email,
      ip: context.ip,
    });

    return { token };
  }

  async listUsers(query: any) {
    const role = query.role?.toString();
    const banned = query.banned === 'true';
    return this.adminRepo.listUsers(role, banned);
  }

  async updateUser(id: string, updates: any) {
    const { is_banned } = updates;
    if (typeof is_banned !== 'boolean') {
      throw new BadRequestError('is_banned est requis et doit être un booléen');
    }
    return this.adminRepo.updateUser(id, { is_banned });
  }

  async getAuditLogs(query: any) {
    return this.adminRepo.getAuditLogs(query);
  }

  async getAuditActions() {
    return this.adminRepo.getAuditActions();
  }

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    return this.adminRepo.getDashboardStats(today.toISOString(), weekAgo.toISOString());
  }

  async getAnalytics(query: any) {
    const days = Math.min(parseInt(query.days as string) || 30, 90);
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const orders = await this.adminRepo.getAnalyticsOrders(since.toISOString());

    const dayMap: any = {};
    const statusMap: any = {};
    const storeMap: any = {};
    const payMap: any = {};

    for (const o of orders) {
      const day = o.created_at.slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { orders: 0, revenue: 0 };
      dayMap[day].orders++;
      const amt = parseFloat(o.total_amount || '0');
      if (['delivered', 'completed'].includes(o.status)) {
        dayMap[day].revenue += amt;
      }

      statusMap[o.status] = (statusMap[o.status] || 0) + 1;

      if (o.store_id) {
        if (!storeMap[o.store_id]) storeMap[o.store_id] = { count: 0, revenue: 0 };
        storeMap[o.store_id].count++;
        storeMap[o.store_id].revenue += amt;
      }
      const pm = o.payment_method || 'cash';
      if (!payMap[pm]) payMap[pm] = { count: 0, revenue: 0 };
      payMap[pm].count++;
      payMap[pm].revenue += amt;
    }

    const daily = Array.from({ length: days }, (_, i) => {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return { date: key, orders: dayMap[key]?.orders || 0, revenue: Math.round(dayMap[key]?.revenue || 0) };
    });

    const topStoreEntries = Object.entries(storeMap)
      .sort((a: any, b: any) => b[1].count - a[1].count)
      .slice(0, 6);

    const topStoreIds = topStoreEntries.map(([id]) => id);
    let topStores: any[] = [];
    if (topStoreIds.length) {
      const sd = await this.adminRepo.getAnalyticsStores(topStoreIds);
      topStores = topStoreEntries.map(([id]) => ({
        id,
        name_ar: sd.find(s => s.id === id)?.name_ar || id.slice(0, 8),
        count: storeMap[id].count,
        revenue: Math.round(storeMap[id].revenue),
      }));
    }

    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o: any) => ['delivered', 'completed'].includes(o.status))
      .reduce((s: number, o: any) => s + parseFloat(o.total_amount || '0'), 0);

    const operationalMetrics = await this.adminRepo.getGlobalOperationalMetrics(since.toISOString());

    return {
      daily,
      statusBreakdown: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      paymentBreakdown: Object.entries(payMap).map(([method, count]: any) => ({
        method,
        count,
        revenue: Math.round(payMap[method].revenue),
      })),
      topStores,
      summary: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
      operationalMetrics,
    };
  }

  async exportCsv(type: string) {
    if (!['orders', 'users', 'drivers'].includes(type)) {
      throw new BadRequestError('Type export invalide');
    }
    const rows = await this.adminRepo.getExportRows(type);
    const headers = rows.length ? Object.keys(rows[0]) : ['id'];
    const escape = (value: any) => {
      const text = value === null || value === undefined ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    return [
      headers.join(','),
      ...rows.map(row => headers.map(header => escape(row[header])).join(',')),
    ].join('\n');
  }

  async getNotifications() {
    return this.adminRepo.getNotifications();
  }

  async sendNotification(payload: any, adminEmail: string) {
    const { title, body, target } = payload;
    if (!title || !body) {
      throw new BadRequestError('العنوان والنص مطلوبان');
    }

    const tokens = await this.adminRepo.getPushTokens(target || 'all');
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < tokens.length; i += 100) {
      const batch = tokens.slice(i, i + 100).map(to => ({ to, title, body, sound: 'default' }));
      try {
        const resp = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
          body: JSON.stringify(batch),
        });
        const json: any = await resp.json().catch(() => ({}));
        (json.data || []).forEach((r: any) => {
          if (r.status === 'ok') sentCount++;
          else failedCount++;
        });
      } catch {
        failedCount += batch.length;
      }
    }

    const log = await this.adminRepo.createNotificationLog({
      title,
      body,
      target: target || 'all',
      sent_count: sentCount,
      failed_count: failedCount,
      sent_by: adminEmail,
    });

    return { ok: true, sent: sentCount, failed: failedCount, total_tokens: tokens.length, log };
  }

  async getNotificationFeed() {
    return this.adminRepo.getNotificationFeed();
  }

  async listDrivers(filter?: string, search?: string) {
    return this.adminRepo.listDrivers(filter, search);
  }

  async getDriverDetails(id: string) {
    return this.adminRepo.getDriverDetails(id);
  }

  async pauseDriver(
    driverId: string,
    durationMinutes: number,
    context: { adminId: string | null; adminEmail: string | null; ip: string | null }
  ) {
    const driver = await this.adminRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable.');
    }

    const pausedUntil = new Date(Date.now() + durationMinutes * 60000).toISOString();
    const updated = await this.adminRepo.updateDriver(driverId, { paused_until: pausedUntil });

    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'driver_paused',
      entity_type: 'driver',
      entity_id: driverId,
      summary: `Livreur ${driver.full_name} mis en pause pour ${durationMinutes} minutes (jusqu'à ${pausedUntil})`,
      new_value: { paused_until: pausedUntil },
      ip: context.ip,
    });

    const { password_hash, ...safeDriver } = updated;
    return safeDriver;
  }

  async forceOffline(
    driverId: string,
    context: { adminId: string | null; adminEmail: string | null; ip: string | null }
  ) {
    const driver = await this.adminRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable.');
    }

    const driverService = new DriverService();
    const updated = await driverService.updateProfile(driverId, { is_online: false });

    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'driver_forced_offline',
      entity_type: 'driver',
      entity_id: driverId,
      summary: `Livreur ${driver.full_name} forcé hors ligne par l'admin`,
      ip: context.ip,
    });

    const { password_hash, ...safeDriver } = updated;
    return safeDriver;
  }

  async suspendDriver(
    driverId: string,
    durationHours: number,
    context: { adminId: string | null; adminEmail: string | null; ip: string | null }
  ) {
    const driver = await this.adminRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable.');
    }

    const suspensionUntil = new Date(Date.now() + durationHours * 3600000).toISOString();

    const driverService = new DriverService();
    const updated = await driverService.updateProfile(driverId, {
      is_online: false,
      suspension_until: suspensionUntil
    });

    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'driver_suspended',
      entity_type: 'driver',
      entity_id: driverId,
      summary: `Livreur ${driver.full_name} suspendu pour ${durationHours} heures (jusqu'à ${suspensionUntil})`,
      new_value: { suspension_until: suspensionUntil },
      ip: context.ip,
    });

    const { password_hash, ...safeDriver } = updated;
    return safeDriver;
  }

  async manualReassignOrder(
    orderId: string,
    targetDriverId: string | null | undefined,
    context: { adminId: string | null; adminEmail: string | null; ip: string | null }
  ) {
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, status, driver_id, created_at, eta, rejected_driver_ids, reassignment_count')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      throw new NotFoundError('Commande introuvable.');
    }

    if (['delivered', 'completed', 'cancelled'].includes(order.status)) {
      throw new BadRequestError('Impossible de réassigner une commande livrée, terminée ou annulée.');
    }

    const currentDriverId = order.driver_id;

    if (!targetDriverId) {
      if (!currentDriverId) {
        throw new BadRequestError('Aucun livreur n\'est assigné à cette commande.');
      }

      const lifecycleService = new OrderLifecycleService();
      // Manual admin action may pull back a picked_up order too — that is a
      // deliberate operations decision, unlike the automatic stall path.
      await lifecycleService.reassignOrderDueToStall(orderId, currentDriverId, 'Réassignation manuelle par l\'administrateur', {
        allowedFromStatuses: ['confirmed', 'preparing', 'picked_up'],
      });

      await this.adminRepo.writeAuditLog({
        admin_id: context.adminId,
        admin_email: context.adminEmail,
        action: 'order_manually_unassigned',
        entity_type: 'orders',
        entity_id: orderId,
        summary: `Commande ${orderId} retirée du livreur ${currentDriverId} et renvoyée au pool`,
        ip: context.ip,
      });

      return { success: true, message: 'La commande a été remise dans le pool de dispatch.' };
    } else {
      const { data: targetDriver, error: drvErr } = await supabase
        .from('drivers')
        .select('id, full_name, is_active, is_online, state, current_lat, current_lng')
        .eq('id', targetDriverId)
        .maybeSingle();

      if (drvErr || !targetDriver) {
        throw new NotFoundError('Le livreur cible n\'existe pas.');
      }

      if (!targetDriver.is_active) {
        throw new BadRequestError('Le livreur cible n\'est pas actif.');
      }
      if (!targetDriver.is_online) {
        throw new BadRequestError('Le livreur cible n\'est pas en ligne.');
      }
      if (targetDriver.state !== 'AVAILABLE') {
        throw new BadRequestError('Le livreur cible n\'est pas disponible (il est déjà en livraison ou occupé).');
      }

      if (currentDriverId) {
        if (currentDriverId === targetDriverId) {
          throw new BadRequestError('La commande est déjà assignée à ce livreur.');
        }

        try {
          const { data: currentDrv } = await supabase
            .from('drivers')
            .select('is_online')
            .eq('id', currentDriverId)
            .maybeSingle();

          const nextState = currentDrv?.is_online ? 'AVAILABLE' : 'OFFLINE';
          await this.adminRepo.updateDriverState(currentDriverId, {
            state: nextState,
            updated_at: new Date().toISOString()
          });
        } catch (err: any) {
          console.error(`[admin-service] Failed to reset state of unassigned driver ${currentDriverId}:`, err.message);
          throw new Error('Impossible de libérer le livreur actuel avant la réassignation.');
        }
      }

      const rejectedIds = order.rejected_driver_ids || [];
      if (currentDriverId && !rejectedIds.includes(currentDriverId)) {
        rejectedIds.push(currentDriverId);
      }

      const delayMinutes = Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000));
      
      const elapsedMinutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
      let etaVal = 30;
      if (order.eta) {
        const parsed = parseInt(order.eta.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) {
          etaVal = parsed;
        }
      }
      const newEtaVal = Math.max(etaVal, elapsedMinutes + 20);
      const newEta = `${newEtaVal} min`;

      const nextReassignments = (order.reassignment_count || 0) + 1;

      await this.adminRepo.manualAssignOrder(orderId, {
        driver_id: targetDriverId,
        status: 'confirmed',
        heading_to_pickup_at: new Date().toISOString(),
        arrived_pickup_at: null,
        picked_up_at: null,
        arrived_customer_at: null,
        delivered_at: null,
        is_movement_warning: false,
        is_progress_flagged: false,
        is_arrived_warning: false,
        offered_driver_id: null,
        offer_expires_at: null,
        rejected_driver_ids: rejectedIds,
        reassignment_count: nextReassignments,
        driver_fault: true,
        is_refund_eligible: true,
        delivery_delay_minutes: delayMinutes,
        eta: newEta,
        updated_at: new Date().toISOString()
      });

      await this.adminRepo.updateDriverState(targetDriverId, {
        state: 'ACCEPTED',
        active_orders: 1,
        last_moved_at: new Date().toISOString(),
        last_movement_lat: targetDriver.current_lat,
        last_movement_lng: targetDriver.current_lng,
        updated_at: new Date().toISOString()
      });

      await this.adminRepo.insertOrderStatusHistory({
        order_id: orderId,
        event_type: 'driver_assignment',
        from_status: order.status,
        to_status: 'confirmed',
        actor_type: 'admin',
        actor_id: context.adminEmail || context.adminId || 'admin',
        reason: `Assignation manuelle au livreur ${targetDriver.full_name} par l'admin`,
        metadata: { target_driver_id: targetDriverId, previous_driver_id: currentDriverId }
      });

      try {
        const getSocketIOModule = require('../realtime/socket.server').getSocketIO;
        const io = getSocketIOModule();
        if (io) {
          io.to(`order:${orderId}`).emit(REALTIME_EVENTS.ORDER_REASSIGNED, {
            order_id: orderId,
            reason: 'manual_reassignment',
            reassignment_count: nextReassignments
          });
          io.to(`order:${orderId}`).emit(REALTIME_EVENTS.ORDER_STATUS, {
            order_id: orderId,
            status: 'confirmed',
            driver_id: targetDriverId
          });
          if (currentDriverId) {
            io.to(`driver:${currentDriverId}`).emit(REALTIME_EVENTS.ORDER_REASSIGNED, {
              order_id: orderId,
              reason: 'manual_reassignment'
            });
          }
          io.to(`driver:${targetDriverId}`).emit(REALTIME_EVENTS.ORDER_OFFERED, {
            order_id: orderId
          });
          io.to('admin:dashboard').emit(REALTIME_EVENTS.ORDER_REASSIGNED, {
            order_id: orderId,
            driver_id: targetDriverId,
            reason: 'manual_reassignment'
          });
        }
      } catch (socketErr: any) {
        console.error('[admin-service] Socket.IO broadcast for manual reassignment failed:', socketErr.message);
      }

      await this.adminRepo.writeAuditLog({
        admin_id: context.adminId,
        admin_email: context.adminEmail,
        action: 'order_manually_assigned',
        entity_type: 'orders',
        entity_id: orderId,
        summary: `Commande ${orderId} assignée manuellement au livreur ${targetDriver.full_name}`,
        new_value: { driver_id: targetDriverId },
        ip: context.ip,
      });

      return { success: true, message: `La commande a été assignée manuellement au livreur ${targetDriver.full_name}.` };
    }
  }

  async setDriverCooldown(
    driverId: string,
    durationSeconds: number,
    reason: 'DECLINED_OFFER' | 'TIMED_OUT' | 'BREAK_ABUSE' | 'ADMIN_ACTION',
    context: { adminId: string | null; adminEmail: string | null; ip: string | null }
  ) {
    const driver = await this.adminRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable.');
    }

    const cooldownUntil = durationSeconds > 0
      ? new Date(Date.now() + durationSeconds * 1000).toISOString()
      : null;

    const updated = await this.adminRepo.updateDriver(driverId, {
      cooldown_until: cooldownUntil,
      cooldown_reason: cooldownUntil ? reason : null,
      ...(cooldownUntil && reason === 'BREAK_ABUSE' ? { state: 'FORCED_BREAK' } : {}),
      updated_at: new Date().toISOString()
    });

    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: cooldownUntil ? 'driver_cooldown_applied' : 'driver_cooldown_cleared',
      entity_type: 'driver',
      entity_id: driverId,
      summary: cooldownUntil
        ? `Cooldown ${reason} applied to driver ${driver.full_name} until ${cooldownUntil}`
        : `Cooldown cleared for driver ${driver.full_name}`,
      new_value: { cooldown_until: cooldownUntil, cooldown_reason: cooldownUntil ? reason : null },
      ip: context.ip,
    });

    return updated;
  }

  async deleteDriver(
    driverId: string,
    context: { adminId: string | null; adminEmail: string | null; ip: string | null }
  ) {
    const driver = await this.adminRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable.');
    }

    const updated = await this.adminRepo.updateDriver(driverId, {
      is_active: false,
      is_online: false,
      state: 'OFFLINE',
      shift_active: false,
      cooldown_until: null,
      cooldown_reason: null,
      updated_at: new Date().toISOString()
    });

    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'driver_deactivated',
      entity_type: 'driver',
      entity_id: driverId,
      summary: `Driver ${driver.full_name} deactivated by admin`,
      old_value: { is_active: driver.is_active, is_online: driver.is_online, state: driver.state },
      new_value: { is_active: false, is_online: false, state: 'OFFLINE', shift_active: false },
      ip: context.ip,
    });

    return updated;
  }


  async setStoreDispatchMode(
    storeId: string,
    dispatchMode: 'AUTO_DISPATCH' | 'MANUAL_DISPATCH',
    context: { adminId: string | null; adminEmail: string | null; ip: string | null }
  ) {
    const store = await this.adminRepo.findStoreById(storeId);
    if (!store) {
      throw new NotFoundError('Store introuvable.');
    }

    const updated = await this.adminRepo.updateStore(storeId, {
      dispatch_mode: dispatchMode
    });

    await this.adminRepo.writeAuditLog({
      admin_id: context.adminId,
      admin_email: context.adminEmail,
      action: 'dispatch_mode_changed',
      entity_type: 'store',
      entity_id: storeId,
      summary: `Store ${store.name_ar || store.name || storeId} dispatch mode changed to ${dispatchMode}`,
      old_value: { dispatch_mode: store.dispatch_mode || 'AUTO_DISPATCH' },
      new_value: { dispatch_mode: dispatchMode },
      ip: context.ip,
    });

    return updated;
  }
}
