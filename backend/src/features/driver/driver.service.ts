import { DriverRepository } from './driver.repository';
import { CheckoutRepository } from '../order/checkout.repository';
import { OrderLifecycleService } from '../order/orderLifecycle.service';
import { sendPushToUser } from '../../notifications/notifications';
import { redis } from '../../redis/redis';
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../../middleware/error.middleware';
import { logger } from '../../config/logger';
import { supabase } from '../../db/supabase';
import { getSocketIO } from '../realtime/socket.server';
import { env } from '../../config/env';
import { DispatchRepository } from '../dispatch/dispatch.repository';
import { isMissingColumnError } from '../../utils/schemaCompatibility';
import { CommissionService } from '../commission/commission.service';
import { ErrandService } from '../errand/errand.service';

export class DriverService {
  private driverRepo = new DriverRepository();
  private checkoutRepo = new CheckoutRepository();
  private lifecycleService = new OrderLifecycleService();
  private dispatchRepo = new DispatchRepository();
  private commissionService = new CommissionService();
  private errandService = new ErrandService();

  private toSafeDriver(driver: any) {
    if (!driver) return driver;
    const { password_hash, ...safeDriver } = driver;
    return safeDriver;
  }

  private async updateDriverCompat(driverId: string, updates: Record<string, any>) {
    try {
      return await this.driverRepo.updateDriver(driverId, updates);
    } catch (error: any) {
      if (!isMissingColumnError(error)) throw error;
      const legacyUpdates = { ...updates };
      delete legacyUpdates.shift_active;
      delete legacyUpdates.active_orders;
      delete legacyUpdates.cooldown_until;
      delete legacyUpdates.cooldown_reason;
      delete legacyUpdates.current_location_recorded_at;
      delete legacyUpdates.current_location_is_mocked;
      delete legacyUpdates.current_location_continuity_valid;
      return this.driverRepo.updateDriver(driverId, legacyUpdates);
    }
  }

  /**
   * Fetch driver profile
   */
  async getProfile(driverId: string) {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable');
    }
    return this.toSafeDriver(driver);
  }

  async startShift(driverId: string) {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable');
    }
    if (driver.is_active === false) {
      throw new ForbiddenError('Compte livreur suspendu ou inactif.');
    }

    const now = new Date();
    const paused = driver.paused_until && new Date(driver.paused_until) > now;
    const suspended = driver.suspension_until && new Date(driver.suspension_until) > now;
    const coolingDown = driver.cooldown_until && new Date(driver.cooldown_until) > now;

    const { data: activeOrder } = await supabase
      .from('orders')
      .select('id, status')
      .eq('driver_id', driverId)
      .in('status', ['confirmed', 'preparing', 'picked_up'])
      .maybeSingle();

    let nextState = 'AVAILABLE';
    if (suspended) {
      nextState = 'SUSPENDED';
    } else if (paused) {
      nextState = 'FORCED_BREAK';
    } else if (coolingDown) {
      nextState = 'COOLDOWN';
    } else if (activeOrder?.status === 'picked_up') {
      nextState = 'PICKUP';
    } else if (activeOrder) {
      nextState = 'ACCEPTED';
    }

    let shift: any = null;
    try {
      shift = await this.driverRepo.getActiveShift(driverId);
      if (!shift) {
        shift = await this.driverRepo.createShift(driverId);
      }
    } catch (shiftError: any) {
      logger.error(`[shift] start failed closed for ${driverId}`, shiftError);
      throw shiftError;
    }

    const updated = await this.updateDriverCompat(driverId, {
      is_online: true,
      shift_active: true,
      state: nextState,
      last_seen_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

    return { success: true, driver: this.toSafeDriver(updated), shift };
  }

  async endShift(driverId: string) {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable');
    }

    const { data: activeOrder, error } = await supabase
      .from('orders')
      .select('id, status')
      .eq('driver_id', driverId)
      .in('status', ['confirmed', 'preparing', 'picked_up'])
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur lors de la vérification des livraisons actives: ${error.message}`);
    }
    if (activeOrder) {
      throw new ConflictError('Impossible de terminer le shift pendant une livraison active.');
    }

    let activeShift: any = null;
    let shiftSummary: any = null;
    try {
      activeShift = await this.driverRepo.getActiveShift(driverId);
    } catch (shiftError: any) {
      logger.error(`[shift] end failed closed for ${driverId}`, shiftError);
      throw shiftError;
    }

    try {
      if (activeShift?.id) {
        shiftSummary = await this.driverRepo.closeShiftFinancial(driverId, activeShift.id, 'driver', 'driver_ended_shift');
      }
    } catch (shiftError: any) {
      logger.error(`[shift] financial close failed closed for ${driverId}`, shiftError);
      throw shiftError;
    }

    const updated = await this.updateDriverCompat(driverId, {
      is_online: false, shift_active: false, state: 'OFFLINE', updated_at: new Date().toISOString(),
    });

    try {
      if (redis && redis.status === 'ready') {
        await redis.zrem('drivers:locations', driverId);
        await redis.del(`driver:online:${driverId}`);
      }
    } catch (redisError: any) {
      logger.warn(`[redis] Failed to clear driver ${driverId} after shift end: ${redisError.message}`);
    }

    return { success: true, driver: this.toSafeDriver(updated), shift_summary: shiftSummary };
  }

  /**
   * Update driver profile and synchronize Redis coordinate tracking / heartbeats
   */
  async updateProfile(driverId: string, updates: Record<string, any>) {
    // Intercept updates to update state depending on whether driver goes online/offline
    if (updates.is_online === false) {
      updates.state = 'OFFLINE';
    } else if (updates.is_online === true) {
      try {
        const { data: activeOrder } = await supabase
          .from('orders')
          .select('id, status')
          .eq('driver_id', driverId)
          .in('status', ['confirmed', 'preparing', 'picked_up'])
          .maybeSingle();

        if (activeOrder) {
          if (activeOrder.status === 'picked_up') {
            updates.state = 'PICKUP';
          } else {
            updates.state = 'ACCEPTED';
          }
        } else {
          updates.state = 'AVAILABLE';
        }
      } catch (err: any) {
        logger.error(`[driver] Error checking active orders for state resolution: ${err.message}`);
        updates.state = 'AVAILABLE';
      }
    }

    // 1. Perform database update
    const driver = await this.driverRepo.updateDriver(driverId, updates);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable');
    }

    // 2. Handle Redis location tracking & heartbeats
    const { current_lat, current_lng, is_online } = updates;

    try {
      // Check if the driver turned off online status
      if (is_online === false) {
        logger.info(`[redis] Driver ${driverId} went offline. Evicting from location cache.`);
        if (redis && redis.status === 'ready') {
          await redis.zrem('drivers:locations', driverId);
          await redis.del(`driver:online:${driverId}`);
        }
      } else if (is_online === true || driver.is_online) {
        if (!redis || redis.status !== 'ready') {
          throw new Error('Redis is not connected');
        }
        // If driver is online and coordinates are supplied, update Redis GeoIndex
        if (current_lat !== undefined && current_lng !== undefined && current_lat !== null && current_lng !== null) {
          // ioredis GEOADD syntax: GEOADD key longitude latitude member
          logger.debug('[redis] Updating driver location in geospatial cache', { driverId });
          await redis.geoadd('drivers:locations', current_lng, current_lat, driverId);
          
          // Renew driver online heartbeat with 30 seconds expiration TTL
          await redis.set(`driver:online:${driverId}`, '1', 'EX', 30);
          await redis.sadd('drivers:online:index', driverId);
        }
      }
    } catch (redisError) {
      logger.error('[redis] Location tracking update failed (Redis offline?):', redisError);
      if (env.REDIS_REQUIRED && (is_online === true || driver.is_online)) {
        logger.warn(`[redis] Reverting online status for driver ${driverId} to false in DB due to Redis write failure.`);
        await this.driverRepo.updateDriver(driverId, { is_online: false });
        driver.is_online = false;
      }
    }

    return this.toSafeDriver(driver);
  }

  async getOrders(driverId: string, scope: 'available' | 'mine' | 'history') {
    const orders = await this.driverRepo.getDriverOrders(driverId, scope);
    const formatted = orders.map(this.formatDriverOrder);
    if (scope === 'available') {
      formatted.forEach((o) => {
        if (o) {
          o.rider_tip = 0; // Mask/hide tip amount to prevent selective farming of tip orders
          o.delivery_address = '';
          o.delivery_lat = null;
          o.delivery_lng = null;
          o.customer_name = '';
          o.customer_phone = '';
        }
      });
    }
    return formatted;
  }

  async getOrderNavigation(orderId: string, driverId: string, destination: 'pickup' | 'dropoff') {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id, status, order_type, driver_id, offered_driver_id, delivery_address, delivery_lat, delivery_lng,
        stores(name, name_ar, address, address_ar, lat, lng),
        errand_details(pickup_address, pickup_lat, pickup_lng)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      throw new NotFoundError('Commande introuvable');
    }

    const isAssigned = order.driver_id === driverId;
    const isOfferedPickup = destination === 'pickup' && order.offered_driver_id === driverId;
    if (!isAssigned && !isOfferedPickup) {
      throw new ForbiddenError('Acces refuse');
    }

    if (destination === 'dropoff' && !isAssigned) {
      throw new ForbiddenError('Acces refuse');
    }

    const store = Array.isArray(order.stores) ? order.stores[0] : order.stores;
    const errand = Array.isArray(order.errand_details) ? order.errand_details[0] : order.errand_details;
    const target = destination === 'pickup'
      ? order.order_type === 'errand' ? {
          label: 'Point de retrait',
          address: errand?.pickup_address || '',
          lat: errand?.pickup_lat ?? null,
          lng: errand?.pickup_lng ?? null,
        } : {
          label: store?.name || 'Magasin',
          address: store?.address || store?.address_ar || store?.name || '',
          lat: store?.lat ?? null,
          lng: store?.lng ?? null,
        }
      : {
          label: 'Client',
          address: order.delivery_address || '',
          lat: order.delivery_lat ?? null,
          lng: order.delivery_lng ?? null,
        };

    const query = this.buildMapsDestinationQuery(target.lat, target.lng, target.address);
    if (!query) {
      throw new BadRequestError('Adresse de navigation indisponible');
    }

    return {
      provider: 'google_maps',
      destination,
      label: target.label,
      address: target.address,
      has_coordinates: target.lat !== null && target.lng !== null,
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`,
    };
  }

  private buildMapsDestinationQuery(lat: unknown, lng: unknown, address: unknown): string | null {
    const latitude = typeof lat === 'number' ? lat : Number(lat);
    const longitude = typeof lng === 'number' ? lng : Number(lng);
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return `${latitude},${longitude}`;
    }

    const text = typeof address === 'string' ? address.trim() : '';
    return text.length > 0 ? text : null;
  }

  /**
   * Atomic claim order
   */
  async claimOrder(orderId: string, driverId: string) {
    const ord = await this.lifecycleService.claimOrder(orderId, driverId);
    return this.formatDriverOrder(ord);
  }

  /**
   * Decline offered order
   */
  async declineOrder(orderId: string, driverId: string, reason: string, note?: string | null) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, offered_driver_id, rejected_driver_ids, status, driver_id')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      throw new NotFoundError('Commande introuvable');
    }

    if (order.offered_driver_id !== driverId) {
      throw new BadRequestError('Cette commande ne vous est pas offerte ou l’offre a expiré.');
    }

    if (order.driver_id !== null) {
      throw new ConflictError('Cette commande a déjà été acceptée.');
    }

    const rejectedIds: string[] = order.rejected_driver_ids || [];
    if (!rejectedIds.includes(driverId)) {
      rejectedIds.push(driverId);
    }

    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({
        offered_driver_id: null,
        offer_expires_at: null,
        rejected_driver_ids: rejectedIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('*')
      .maybeSingle();

    if (updateError || !updated) {
      throw new Error(`Erreur lors du refus de la commande: ${updateError?.message}`);
    }

    const io = getSocketIO();
    if (io) {
      io.to(`driver:${driverId}`).emit('order:offer_expired', { order_id: orderId });
      io.to('admin:dashboard').emit('order:offer_expired', { order_id: orderId, driver_id: driverId });
    }

    // Reset driver state to AVAILABLE/OFFLINE and apply a short persisted cooldown.
    try {
      const { data: drv } = await supabase
        .from('drivers')
        .select('is_online')
        .eq('id', driverId)
        .maybeSingle();

      const nextState = drv?.is_online ? 'AVAILABLE' : 'OFFLINE';
      const cooldownUntil = new Date(Date.now() + 45 * 1000).toISOString();
      await this.updateDriverCompat(driverId, {
        state: nextState,
        cooldown_until: cooldownUntil,
        cooldown_reason: 'DECLINED_OFFER',
        updated_at: new Date().toISOString()
      });

      try {
        await this.dispatchRepo.recordOfferEvent({
          orderId,
          driverId,
          eventType: 'declined',
          reason,
          metadata: { cooldown_until: cooldownUntil, note: note || null }
        });
        await this.dispatchRepo.recalculateDriverReliability(driverId);
        await this.dispatchRepo.createReliabilitySnapshot(driverId);
      } catch (historyErr: any) {
        logger.error(`[driver] Failed to record decline history/reliability for driver ${driverId}:`, historyErr.message);
      }
    } catch (err: any) {
      logger.error(`[driver] Failed to reset driver state on decline for driver ${driverId}:`, err.message);
    }

    return { success: true };
  }

  /**
   * Handle driver stage transition updates
   */
  async updateStage(orderId: string, driverId: string, stage: 'arrived_pickup' | 'picked_up' | 'arrived_customer' | 'delivered', code?: string | null) {
    const ord = await this.lifecycleService.updateStage(orderId, driverId, stage, code);
    await this.errandService.syncDriverStage(orderId,driverId,stage);
    return this.formatDriverOrder(ord);
  }

  /**
   * Update driver app heartbeat. GPS coordinates are optional and are not required for dispatch.
   */
  async updateLocation(driverId: string, telemetry: any) {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable');
    }

    if (driver.is_active === false) {
      throw new ForbiddenError('Compte livreur suspendu ou inactif.');
    }

    const {
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      battery_level,
      app_active = true,
      client_recorded_at,
      is_mocked,
      continuity_valid,
    } = telemetry;
    const now = new Date();
    const nowIso = now.toISOString();
    const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number';
    let redisSuccess = true;

    if (app_active === false) {
      const updated = await this.updateDriverCompat(driverId, {
        is_online: false,
        shift_active: false,
        state: 'OFFLINE',
        last_seen_at: nowIso,
        updated_at: nowIso
      });
      return { success: true, redis: true, driver: this.toSafeDriver(updated) };
    }

    if (driver.shift_active === false) {
      const updates: Record<string, any> = {
        is_online: false,
        shift_active: false,
        state: 'OFFLINE',
        last_seen_at: nowIso,
        updated_at: nowIso,
      };
      if (hasCoordinates) {
        updates.current_lat = latitude;
        updates.current_lng = longitude;
        updates.heading = heading || null;
        updates.current_location_accuracy_meters = typeof accuracy === 'number' ? accuracy : null;
        updates.current_location_recorded_at = client_recorded_at || nowIso;
        updates.current_location_is_mocked = is_mocked === true;
        updates.current_location_continuity_valid = continuity_valid !== false;
      }
      const updated = await this.updateDriverCompat(driverId, updates);
      return { success: true, redis: true, driver: this.toSafeDriver(updated) };
    }

    try {
      if (!redis || redis.status !== 'ready') {
        throw new Error('Redis is not connected');
      }

      await redis.set(`driver:online:${driverId}`, '1', 'EX', 30);
      await redis.sadd('drivers:online:index', driverId);

      if (hasCoordinates) {
        await redis.geoadd('drivers:locations', longitude, latitude, driverId);
      }
    } catch (redisError) {
      logger.error(`[redis] Failed to update heartbeat for driver ${driverId}:`, redisError);
      redisSuccess = false;
    }

    const { data: activeOrder } = await supabase
      .from('orders')
      .select('id, status, arrived_pickup_at, picked_up_at, store_ready_at, eta, is_arrived_warning, is_suspicious')
      .eq('driver_id', driverId)
      .in('status', ['confirmed', 'preparing', 'picked_up'])
      .maybeSingle();

    const paused = driver.paused_until && new Date(driver.paused_until) > now;
    const suspended = driver.suspension_until && new Date(driver.suspension_until) > now;
    const coolingDown = driver.cooldown_until && new Date(driver.cooldown_until) > now;

    let nextState = driver.state || 'AVAILABLE';
    if (suspended) {
      nextState = 'SUSPENDED';
    } else if (paused) {
      nextState = 'FORCED_BREAK';
    } else if (coolingDown) {
      nextState = 'COOLDOWN';
    } else if (activeOrder?.status === 'picked_up') {
      nextState = ['PICKUP', 'DELIVERING'].includes(driver.state) ? driver.state : 'PICKUP';
    } else if (activeOrder) {
      nextState = 'ACCEPTED';
    } else {
      nextState = 'AVAILABLE';
    }

    const updates: Record<string, any> = {
      is_online: redisSuccess || !env.REDIS_REQUIRED,
      shift_active: true,
      state: redisSuccess || !env.REDIS_REQUIRED ? nextState : 'OFFLINE',
      last_seen_at: new Date().toISOString(),
      updated_at: nowIso
    };

    if (hasCoordinates) {
      updates.current_lat = latitude;
      updates.current_lng = longitude;
      updates.current_location_accuracy_meters = typeof accuracy === 'number' ? accuracy : null;
      updates.current_location_recorded_at = client_recorded_at || nowIso;
      updates.current_location_is_mocked = is_mocked === true;
      updates.current_location_continuity_valid = continuity_valid !== false;
      updates.heading = heading || null;
    }

    const updated = await this.updateDriverCompat(driverId, updates);

    try {
      if (activeOrder?.arrived_pickup_at && activeOrder.store_ready_at) {
        const readyAt = new Date(activeOrder.store_ready_at);
        const elapsedSinceReady = (Date.now() - readyAt.getTime()) / 60000;
        if (elapsedSinceReady > 12) {
          await this.lifecycleService.reassignOrderDueToStall(
            activeOrder.id,
            driverId,
            'Livreur resté au restaurant > 12 mins sans récupérer la commande'
          );
        } else if (elapsedSinceReady > 10 && !activeOrder.is_arrived_warning) {
          await supabase
            .from('orders')
            .update({ is_arrived_warning: true, updated_at: nowIso })
            .eq('id', activeOrder.id);
        }
      }

      if (activeOrder?.status === 'picked_up' && activeOrder.picked_up_at) {
        let etaMinutes = 30;
        if (activeOrder.eta) {
          const parsed = parseInt(String(activeOrder.eta).replace(/[^0-9]/g, ''), 10);
          if (!isNaN(parsed) && parsed > 0) {
            etaMinutes = parsed;
          }
        }

        const elapsedMinutes = (Date.now() - new Date(activeOrder.picked_up_at).getTime()) / 60000;
        if (elapsedMinutes > etaMinutes + 15 && !activeOrder.is_suspicious) {
          await supabase
            .from('orders')
            .update({
              delivery_delay_minutes: Math.max(0, Math.floor(elapsedMinutes - etaMinutes)),
              updated_at: nowIso
            })
            .eq('id', activeOrder.id);

          const ioInstance = getSocketIO();
          ioInstance?.to(`order:${activeOrder.id}`).emit('order:flagged', {
            order_id: activeOrder.id,
            flag_type: 'eta_delay_pending_attribution',
            message: 'Le livreur dépasse l’ETA de plus de 15 minutes.'
          });
          ioInstance?.to('admin:dashboard').emit('order:flagged', {
            order_id: activeOrder.id,
            flag_type: 'eta_delay_pending_attribution',
            message: 'Le livreur dépasse l’ETA de plus de 15 minutes.'
          });
        }
      }
    } catch (err: any) {
      logger.error(`[heartbeat] Error applying non-GPS driver rules for driver ${driverId}:`, err.message);
    }

    const io = getSocketIO();
    if (io) {
      io.to('admin:dashboard').emit('driver:heartbeat', {
        driver_id: driverId,
        is_online: updated?.is_online,
        state: updated?.state,
        battery_level: battery_level || null,
        updated_at: nowIso
      });

      if (hasCoordinates) {
        io.to('admin:dashboard').emit('driver:location', {
          driver_id: driverId,
          latitude,
          longitude,
          speed: speed || null,
          heading: heading || null,
          battery_level: battery_level || null,
          updated_at: nowIso
        });

        if (activeOrder) {
          io.to(`order:${activeOrder.id}`).emit('driver:location', {
            driver_id: driverId,
            latitude,
            longitude,
            speed: speed || null,
            heading: heading || null,
            updated_at: nowIso
          });
        }
      }
    }

    return {
      success: true,
      redis: redisSuccess,
      driver: this.toSafeDriver(updated)
    };
  }

  async changePassword(driverId: string, currentPassword: string, newPassword: string) {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Livreur introuvable');
    }

    if (!driver.password_hash) {
      throw new ForbiddenError('Mot de passe non configuré');
    }

    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(currentPassword, driver.password_hash);
    if (!isValid) {
      throw new ForbiddenError('Mot de passe actuel incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.driverRepo.updateDriver(driverId, {
      password_hash: newHash,
      password_changed_at: new Date().toISOString(),
    });

    return { success: true, message: 'Mot de passe modifié avec succès' };
  }

  /**
   * Driver cancels order
   */
  async cancelOrder(orderId: string, driverId: string, reason: string) {
    const ord = await this.lifecycleService.cancelOrder(
      orderId,
      { type: 'driver', id: driverId },
      reason
    );
    return this.formatDriverOrder(ord);
  }



  /**
   * Fetch driver payouts
   */
  async getPayouts(driverId: string): Promise<any[]> {
    return this.driverRepo.getPayouts(driverId);
  }

  async getDocuments(driverId: string): Promise<any[]> {
    await this.getProfile(driverId);
    return this.driverRepo.getDriverDocuments(driverId);
  }

  async uploadDocument(driverId: string, docType: string, url: string): Promise<any> {
    await this.getProfile(driverId);
    await this.driverRepo.deletePendingOrRejectedDoc(driverId, docType);
    return this.driverRepo.insertDocument(driverId, docType, url);
  }

  /**
   * Request payout (driver self-service is disabled; finance reviews closed shifts)
   */
  async requestPayout(driverId: string): Promise<any> {
    throw new BadRequestError('Les demandes de payout chauffeur sont generees automatiquement a la fin du shift et traitees par finance/admin.');
  }

  /**
   * Driver reports a problem with an active order (logs a support ticket)
   */
  async reportIssue(orderId: string, driverId: string, reason: string, note?: string) {
    const { data: ord, error } = await supabase
      .from('orders')
      .select('id, user_id, driver_id, status')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !ord) {
      throw new NotFoundError('Commande introuvable');
    }

    if (ord.driver_id !== driverId) {
      throw new ForbiddenError('Accès refusé');
    }

    if (!['confirmed', 'preparing', 'picked_up'].includes(ord.status)) {
      throw new ConflictError(`Course non active (statut: ${ord.status})`);
    }

    const summary = `[Livreur] ${reason}${note ? ' — ' + String(note).slice(0, 280) : ''}`;
    
    const ticket = await this.driverRepo.insertSupportRequest({
      user_id: ord.user_id,
      order_id: orderId,
      issue_category: 'delivery_issue',
      title: `Problème de livraison: ${reason}`,
      description: summary,
      status: 'pending',
      urgency: 'high',
      metadata: { driver_id: driverId, reason, note }
    });

    const io = getSocketIO();
    if (io) {
      io.to('admin:dashboard').emit('support:ticket_created', { ticket_id: ticket?.id, order_id: orderId });
    }

    return { logged: true, ticket };
  }


  /**
   * Helper function to format order payload for driver application compat
   */
  private formatDriverOrder(order: any) {
    if (!order) return null;
    const errand=Array.isArray(order.errand_details)?order.errand_details[0]:order.errand_details;
    const isErrand=order.order_type==='errand';
    return {
      ...order,
      users:isErrand?undefined:order.users,
      customer_name: isErrand?'':order.users?.full_name || '',
      customer_phone: isErrand?'':order.users?.phone || '',
      store_name: isErrand?'Course & Errand':order.stores?.name || '',
      store_name_ar: order.stores?.name_ar || '',
      store_phone: order.stores?.phone || '',
      store_address: order.stores?.address || '',
      store_address_ar: order.stores?.address_ar || '',
      store_lat: order.stores?.lat || null,
      store_lng: order.stores?.lng || null,
      errand:errand?{service_type:errand.service_type,errand_stage:errand.errand_stage,pickup_address:errand.pickup_address,pickup_lat:errand.pickup_lat,pickup_lng:errand.pickup_lng,item_category:errand.item_category,item_size:errand.item_size,weight_band:errand.weight_band,declared_value_dh:Number(errand.declared_value_centimes||0)/100,recipient_name:errand.recipient_name}:null,
      estimated_earning_dh:isErrand?Number(errand?.courier_earning_centimes||0)/100:order.estimated_earning_dh,
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
