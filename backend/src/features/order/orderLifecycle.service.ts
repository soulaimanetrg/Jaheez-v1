import { randomInt, timingSafeEqual } from 'crypto';
import { OrderLifecycleRepository, OrderRow } from './orderLifecycle.repository';
import { CheckoutRepository } from './checkout.repository';
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../../middleware/error.middleware';
import { sendPushToUser, sendPushToDriver } from '../../notifications/notifications';
import { logger } from '../../config/logger';
import { getSocketIO } from '../realtime/socket.server';
import { supabase } from '../../db/supabase';
import { DispatchRepository } from '../dispatch/dispatch.repository';
import { isMissingColumnError } from '../../utils/schemaCompatibility';
import { CommissionService } from '../commission/commission.service';
import { DelayService } from '../delay/delay.service';
import { ReliabilityService } from '../reliability/reliability.service';

export interface Actor {
  type: 'customer' | 'driver' | 'admin' | 'system';
  id: string | null; // user_id, driver_id, or admin_id/email (nullable for system)
  email?: string;
}

export class OrderLifecycleService {
  private repo = new OrderLifecycleRepository();
  private dispatchRepo = new DispatchRepository();
  private commissionService = new CommissionService();
  private delayService = new DelayService();
  private reliabilityService = new ReliabilityService();

  private async recordDelayEvidence(orderId: string, stage: 'arrived_pickup' | 'picked_up' | 'arrived_customer' | 'delivered'): Promise<void> {
    try {
      const evidence = await this.delayService.getEvidence(orderId);
      if (!evidence) return;
      const occurredAt = stage === 'arrived_pickup' ? evidence.arrived_pickup_at
        : stage === 'picked_up' ? evidence.picked_up_at
        : stage === 'arrived_customer' ? evidence.arrived_customer_at : evidence.delivered_at;
      await this.delayService.recordTimeline({ order_id: orderId, store_id: evidence.store_id, driver_id: evidence.driver_id,
        event_type: stage === 'arrived_pickup' ? 'driver_arrived_pickup'
          : stage === 'arrived_customer' ? 'driver_arrived_customer' : stage,
        occurred_at: occurredAt || new Date().toISOString(), actor_type: 'driver', actor_id: evidence.driver_id,
        request_id: `${stage}:${orderId}:v1`, metadata: {} });

      if (stage === 'arrived_pickup') {
        await this.reliabilityService.assessAndApply({ orderId, driverId: evidence.driver_id, storeId: evidence.store_id,
          requestId: `${orderId}:driver_to_pickup:v1`, assessment: { segment: 'driver_to_pickup',
            expectedAt: evidence.driver_pickup_eta_at, actualAt: evidence.arrived_pickup_at,
            gpsAccuracyMeters: evidence.driver_accuracy_meters,
            gpsCapturedAt: evidence.driver_location_recorded_at,
            gpsIsMocked: evidence.driver_location_is_mocked,
            gpsContinuityValid: evidence.driver_location_continuity_valid } });
      }
      if (stage === 'picked_up') {
        await this.reliabilityService.assessAndApply({ orderId, driverId: evidence.driver_id, storeId: evidence.store_id,
          requestId: `${orderId}:store_preparation:v1`, assessment: { segment: 'store_preparation',
            expectedAt: evidence.promised_ready_at, actualAt: evidence.picked_up_at, storeReadyAt: evidence.store_ready_at,
            driverArrivedAt: evidence.arrived_pickup_at } });
        await this.reliabilityService.assessAndApply({ orderId, driverId: evidence.driver_id, storeId: evidence.store_id,
          requestId: `${orderId}:driver_after_ready:v1`, assessment: { segment: 'driver_after_ready',
            actualAt: evidence.picked_up_at, storeReadyAt: evidence.store_ready_at, driverArrivedAt: evidence.arrived_pickup_at } });
      }
      if (stage === 'arrived_customer') {
        await this.reliabilityService.assessAndApply({ orderId, driverId: evidence.driver_id, storeId: evidence.store_id,
          requestId: `${orderId}:driver_to_customer:v1`, assessment: { segment: 'driver_to_customer',
            expectedAt: evidence.driver_delivery_eta_at, actualAt: evidence.arrived_customer_at,
            gpsAccuracyMeters: evidence.driver_accuracy_meters,
            gpsCapturedAt: evidence.driver_location_recorded_at,
            gpsIsMocked: evidence.driver_location_is_mocked,
            gpsContinuityValid: evidence.driver_location_continuity_valid } });
      }
    } catch (error: any) {
      // Missing or contradictory evidence must never create a penalty or break delivery.
      logger.warn('[delay] Evidence recording skipped; no reliability penalty applied.', { order_id: orderId, stage, error: error.message });
    }
  }

  private generateConfirmationCode(): string {
    return randomInt(1000, 10000).toString();
  }

  private codesMatch(expected: string, received: string): boolean {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  private normalizeConfirmationCode(code?: string | null): string | null {
    const normalized = String(code || '').replace(/\D/g, '');
    return normalized.length > 0 ? normalized : null;
  }

  private async ensureConfirmationCodes(orderId: string): Promise<void> {
    const { data, error } = await supabase
      .from('orders')
      .select('id, pickup_confirmation_code, delivery_confirmation_code')
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      if (isMissingColumnError(error)) {
        logger.warn('[lifecycle] Confirmation code columns are unavailable; skipping code generation.', { order_id: orderId });
        return;
      }
      throw new Error(error.message);
    }

    if (!data) return;

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (!data.pickup_confirmation_code) {
      updates.pickup_confirmation_code = this.generateConfirmationCode();
    }
    if (!data.delivery_confirmation_code) {
      updates.delivery_confirmation_code = this.generateConfirmationCode();
    }

    if (Object.keys(updates).length === 1) return;

    const { error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (updateError) {
      if (isMissingColumnError(updateError)) {
        logger.warn('[lifecycle] Confirmation code columns are unavailable; skipping code generation.', { order_id: orderId });
        return;
      }
      throw new Error(updateError.message);
    }
  }

  async prepareConfirmationCodes(orderId:string):Promise<void> {
    await this.ensureConfirmationCodes(orderId);
  }

  private async validateStageConfirmationCode(
    orderId: string,
    driverId: string,
    kind: 'pickup' | 'delivery',
    code?: string | null
  ): Promise<void> {
    const { data, error } = await supabase
      .from('orders')
      .select('id, driver_id, pickup_confirmation_code, delivery_confirmation_code')
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      if (isMissingColumnError(error)) {
        logger.warn('[lifecycle] Confirmation code columns are unavailable; skipping code validation.', { order_id: orderId, stage: kind });
        return;
      }
      throw new Error(error.message);
    }

    if (!data) {
      throw new NotFoundError('Commande introuvable');
    }
    if (data.driver_id !== driverId) {
      throw new ForbiddenError('Cette commande ne vous est pas assignée.');
    }

    const expected = kind === 'pickup' ? data.pickup_confirmation_code : data.delivery_confirmation_code;
    if (!expected) {
      logger.warn('[lifecycle] Confirmation code missing on order; allowing stage for compatibility.', { order_id: orderId, stage: kind });
      return;
    }

    const received = this.normalizeConfirmationCode(code);
    if (!received || !this.codesMatch(String(expected), received)) {
      throw new BadRequestError(kind === 'pickup' ? 'Code de retrait invalide.' : 'Code de livraison invalide.');
    }
  }

  private async markStageConfirmationCodeUsed(orderId: string, kind: 'pickup' | 'delivery'): Promise<void> {
    const updates = kind === 'pickup'
      ? { pickup_confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      : { delivery_confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() };

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error && !isMissingColumnError(error)) {
      throw new Error(error.message);
    }
  }

  private async updateDriverCompat(driverId: string, updates: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId);

    if (!error) return;
    if (!isMissingColumnError(error)) {
      throw new Error(error.message);
    }

    const legacyUpdates = { ...updates };
    delete legacyUpdates.shift_active;
    delete legacyUpdates.active_orders;
    delete legacyUpdates.cooldown_until;
    delete legacyUpdates.cooldown_reason;

    const retry = await supabase
      .from('drivers')
      .update(legacyUpdates)
      .eq('id', driverId);

    if (retry.error) {
      throw new Error(retry.error.message);
    }
  }

  private async clearOrderOffer(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({
        offered_driver_id: null,
        offer_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      throw new Error(error.message);
    }
  }

  private async updateOrderCompat(orderId: string, updates: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (!error) return;
    if (!isMissingColumnError(error)) {
      throw new Error(error.message);
    }

    const legacyUpdates = { ...updates };
    delete legacyUpdates.heading_to_pickup_at;
    delete legacyUpdates.is_movement_warning;
    delete legacyUpdates.is_progress_flagged;
    delete legacyUpdates.is_arrived_warning;
    delete legacyUpdates.reassignment_count;
    delete legacyUpdates.driver_fault;
    delete legacyUpdates.is_refund_eligible;
    delete legacyUpdates.delivery_delay_minutes;

    const retry = await supabase
      .from('orders')
      .update(legacyUpdates)
      .eq('id', orderId);

    if (retry.error) {
      throw new Error(retry.error.message);
    }
  }

  private translateError(err: Error): Error {
    const msg = err.message || '';
    if (msg.includes('order_not_found')) {
      return new NotFoundError(msg.split('order_not_found: ')[1] || msg);
    }
    if (msg.includes('forbidden_action')) {
      return new ForbiddenError(msg.split('forbidden_action: ')[1] || msg);
    }
    if (msg.includes('conflict_driver') || msg.includes('conflict_status')) {
      return new ConflictError(msg.split('conflict_driver: ')[1] || msg.split('conflict_status: ')[1] || msg);
    }
    if (msg.includes('bad_request') || msg.includes('invalid_stage')) {
      return new BadRequestError(msg.split('bad_request: ')[1] || msg.split('invalid_stage: ')[1] || msg);
    }
    return err;
  }

  /**
   * Transition order status authoritatively
   */
  async transitionOrder(
    orderId: string,
    actor: Actor,
    toStatus: string,
    reason?: string | null,
    additionalUpdates: Record<string, any> = {}
  ): Promise<OrderRow> {
    try {
      const updated = await this.repo.updateOrderLifecycleRpc({
        orderId,
        actorType: actor.type,
        actorId: actor.id,
        action: 'transition',
        toStatus,
        reason,
        metadata: additionalUpdates
      });

      // Update driver state on status transition
      if (updated.driver_id) {
        try {
          if (toStatus === 'picked_up') {
            const { data: drv } = await supabase
              .from('drivers')
              .select('current_lat, current_lng')
              .eq('id', updated.driver_id)
              .maybeSingle();

            await this.updateDriverCompat(updated.driver_id, {
              state: 'PICKUP',
              active_orders: 1,
              last_moved_at: new Date().toISOString(),
              last_movement_lat: drv ? drv.current_lat : null,
              last_movement_lng: drv ? drv.current_lng : null,
              updated_at: new Date().toISOString()
            });
          } else if (['delivered', 'completed', 'cancelled'].includes(toStatus)) {
            const { data: drv } = await supabase
              .from('drivers')
              .select('is_online')
              .eq('id', updated.driver_id)
              .maybeSingle();

            const nextState = drv?.is_online ? 'AVAILABLE' : 'OFFLINE';
            await this.updateDriverCompat(updated.driver_id, {
              state: nextState,
              active_orders: 0,
              updated_at: new Date().toISOString()
            });

            await this.clearOrderOffer(orderId);
          }
        } catch (err: any) {
          logger.error(`[lifecycle] Failed to update driver state for driver ${updated.driver_id} on order transition to ${toStatus}:`, err.message);
        }
      }

      // Update driver statistics if transitioned to delivered
      if (toStatus === 'delivered' && updated.driver_id) {
        try {
          logger.info(`[lifecycle] updated order fields: id=${updated.id}, status=${updated.status}, delivery_fee=${updated.delivery_fee}, total_amount=${updated.total_amount}`);
          await this.commissionService.recordDeliveredOrder({
            id: updated.id,
            driver_id: updated.driver_id,
            payment_method: updated.payment_method,
            delivery_fee: updated.delivery_fee,
            rider_tip: updated.rider_tip,
            total_amount: updated.total_amount,
          });
        } catch (err: any) {
          logger.error(`[lifecycle] Financial finalization failed closed for order ${orderId}:`, err.message);
          throw err;
        }
      }

      // Dispatch push notifications (best-effort)
      try {
        sendPushToUser(updated.user_id, toStatus, orderId);
        if (toStatus === 'cancelled' && updated.driver_id) {
          sendPushToDriver(updated.driver_id, 'Commande annulée ❌', 'L’utilisateur a annulé la commande.', orderId);
        }
      } catch (pushErr: any) {
        logger.warn('[orderLifecycle] Push notification dispatch failed:', pushErr.message);
      }

      logger.info(`[lifecycle] Order ${orderId} transitioned to ${toStatus} by ${actor.type} (${actor.id})`);

      try {
        const io = getSocketIO();
        if (io) {
          io.to(`order:${orderId}`).emit('order:status', {
            order_id: orderId,
            status: toStatus,
          });
          io.to('admin:dashboard').emit('order:status', {
            order_id: orderId,
            status: toStatus,
          });
        }
      } catch (socketErr: any) {
        logger.warn('[orderLifecycle] Socket.IO broadcast failed:', socketErr.message);
      }

      return updated;
    } catch (err: any) {
      throw this.translateError(err);
    }
  }

  /**
   * Claim/Accept an order atomically (preventing dual assignment)
   */
  async claimOrder(orderId: string, driverId: string): Promise<OrderRow> {
    try {
      // Fast pre-flight for clear error messages. The authoritative offer
      // validation lives inside the claim RPC (migration 055) under the row
      // lock, so an expiry/re-offer cannot race between this check and the
      // claim itself.
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, offered_driver_id, offer_expires_at, driver_id, status')
        .eq('id', orderId)
        .maybeSingle();

      if (error || !order) {
        throw new NotFoundError('Commande introuvable');
      }

      if (order.driver_id && order.driver_id !== driverId) {
        throw new ConflictError('Cette commande est déjà acceptée par un autre livreur.');
      }

      if (order.offered_driver_id !== driverId) {
        throw new ForbiddenError('Cette commande ne vous est pas offerte.');
      }

      if (order.offer_expires_at && new Date(order.offer_expires_at) < new Date()) {
        throw new BadRequestError('L’offre pour cette commande a expiré.');
      }

      const updated = await this.repo.updateOrderLifecycleRpc({
        orderId,
        actorType: 'driver',
        actorId: driverId,
        action: 'claim'
      });

      try {
        await this.ensureConfirmationCodes(orderId);
      } catch (codeErr: any) {
        logger.error(`[lifecycle] Failed to prepare confirmation codes for order ${orderId}:`, codeErr.message);
      }

      // The 055 claim RPC clears offer fields in-transaction; this remains as
      // a no-op safety sweep for the pre-055 function.
      try {
        await this.clearOrderOffer(orderId);
      } catch (offerErr: any) {
        logger.error(`[lifecycle] Failed to clear offer fields after claim for order ${orderId}:`, offerErr.message);
      }

      // Update driver state and metrics on claim (atomic SQL increments).
      try {
        const { error: metricsErr } = await supabase.rpc('record_driver_claim_metrics', { p_driver_id: driverId });
        if (metricsErr) {
          if (!/function .*record_driver_claim_metrics.* does not exist/i.test(metricsErr.message)) {
            throw new Error(metricsErr.message);
          }
          // Pre-055 fallback: read-modify-write (racy but self-correcting).
          const { data: drv } = await supabase
            .from('drivers')
            .select('total_offers, accepted_offers, current_lat, current_lng')
            .eq('id', driverId)
            .maybeSingle();

          if (drv) {
            const totalOffers = drv.total_offers || 0;
            const acceptedOffers = (drv.accepted_offers || 0) + 1;
            const finalTotal = Math.max(totalOffers, acceptedOffers);
            const rate = finalTotal > 0 ? Number(((acceptedOffers * 100.0) / finalTotal).toFixed(2)) : 100.00;

            await this.updateDriverCompat(driverId, {
              state: 'ACCEPTED',
              active_orders: 1,
              accepted_offers: acceptedOffers,
              driver_acceptance_rate: rate,
              consecutive_timeouts: 0,
              cooldown_until: null,
              cooldown_reason: null,
              last_moved_at: new Date().toISOString(),
              last_movement_lat: drv.current_lat,
              last_movement_lng: drv.current_lng,
              updated_at: new Date().toISOString()
            });
          }
        }
      } catch (err: any) {
        logger.error(`[lifecycle] Failed to update driver state on claim for driver ${driverId}:`, err.message);
      }

      try {
        await this.dispatchRepo.recordOfferEvent({
          orderId,
          driverId,
          eventType: 'accepted',
          reason: 'Driver accepted offered order'
        });
        await this.dispatchRepo.recalculateDriverReliability(driverId);
        await this.dispatchRepo.createReliabilitySnapshot(driverId);
        await this.delayService.ensureBaselines(orderId);
        await this.delayService.recordTimeline({ order_id: orderId, store_id: updated.store_id, driver_id: driverId,
          event_type: 'driver_accepted', occurred_at: new Date().toISOString(), actor_type: 'driver', actor_id: driverId,
          request_id: `driver_accepted:${orderId}:${driverId}`, metadata: {} });
      } catch (historyErr: any) {
        logger.error(`[lifecycle] Failed to record accepted offer history for driver ${driverId}:`, historyErr.message);
      }

      // Notify user
      try {
        sendPushToUser(updated.user_id, updated.status, orderId);
      } catch (pushErr: any) {
        logger.warn('[orderLifecycle] Push notification claim failed:', pushErr.message);
      }

      try {
        const io = getSocketIO();
        if (io) {
          io.to(`order:${orderId}`).emit('order:status', {
            order_id: orderId,
            status: updated.status,
            driver_id: updated.driver_id,
          });
          io.to('admin:dashboard').emit('order:status', {
            order_id: orderId,
            status: updated.status,
            driver_id: updated.driver_id,
          });
        }
      } catch (socketErr: any) {
        logger.warn('[orderLifecycle] Socket.IO broadcast failed:', socketErr.message);
      }

      logger.info(`[lifecycle] Order ${orderId} claimed by driver ${driverId} (status: ${updated.status})`);
      return updated;
    } catch (err: any) {
      throw this.translateError(err);
    }
  }

  /**
   * Update stages that do not change status, such as arrived_pickup or arrived_customer
   */
  async updateStage(
    orderId: string,
    driverId: string,
    stage: 'arrived_pickup' | 'picked_up' | 'arrived_customer' | 'delivered',
    code?: string | null
  ): Promise<OrderRow> {
    // Delegate to status transition logic if status shifts
    if (stage === 'picked_up') {
      await this.validateStageConfirmationCode(orderId, driverId, 'pickup', code);
      const updated = await this.transitionOrder(
        orderId,
        { type: 'driver', id: driverId },
        'picked_up',
        'Driver picked up order'
      );
      await this.markStageConfirmationCodeUsed(orderId, 'pickup');
      const etaMinutes = Math.max(1, parseInt(String(updated.eta || '30').replace(/[^0-9]/g, ''), 10) || 30);
      await this.delayService.setDeliveryBaseline(orderId, etaMinutes).catch((error: any) => logger.warn('[delay] delivery baseline unavailable', { order_id: orderId, error: error.message }));
      await this.recordDelayEvidence(orderId, 'picked_up');
      return updated;
    }

    if (stage === 'delivered') {
      await this.validateStageConfirmationCode(orderId, driverId, 'delivery', code);
      const updated = await this.transitionOrder(
        orderId,
        { type: 'driver', id: driverId },
        'delivered',
        'Driver delivered order'
      );
      await this.markStageConfirmationCodeUsed(orderId, 'delivery');
      await this.recordDelayEvidence(orderId, 'delivered');
      return updated;
    }

    try {
      const updated = await this.repo.updateOrderLifecycleRpc({
        orderId,
        actorType: 'driver',
        actorId: driverId,
        action: 'stage_update',
        metadata: { stage }
      });
      await this.recordDelayEvidence(orderId, stage);

      // Notify user
      try {
        sendPushToUser(updated.user_id, updated.status, orderId);
      } catch (pushErr: any) {
        logger.warn('[orderLifecycle] Push notification stage failed:', pushErr.message);
      }

      try {
        const io = getSocketIO();
        if (io) {
          io.to(`order:${orderId}`).emit('order:stage', {
            order_id: orderId,
            stage,
          });
          io.to('admin:dashboard').emit('order:stage', {
            order_id: orderId,
            stage,
          });
        }
      } catch (socketErr: any) {
        logger.warn('[orderLifecycle] Socket.IO broadcast failed:', socketErr.message);
      }

      logger.info(`[lifecycle] Order ${orderId} stage updated to ${stage} by driver ${driverId}`);
      return updated;
    } catch (err: any) {
      throw this.translateError(err);
    }
  }

  /**
   * Customer delivery confirmation
   */
  async confirmDelivery(orderId: string, customerId: string): Promise<OrderRow> {
    return this.transitionOrder(
      orderId,
      { type: 'customer', id: customerId },
      'completed',
      'Customer confirmed delivery'
    );
  }

  /**
   * Cancellation
   */
  async cancelOrder(orderId: string, actor: Actor, reason: string): Promise<OrderRow> {
    if (!reason || !reason.trim()) {
      throw new BadRequestError('Le motif d’annulation est obligatoire.');
    }

    // Check if order already has driver_fault
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('driver_fault, reassignment_count')
      .eq('id', orderId)
      .maybeSingle();

    const result = await this.transitionOrder(
      orderId,
      actor,
      'cancelled',
      reason
    );

    const isDriverFault = actor.type === 'driver' || !!(currentOrder?.driver_fault);

    if (isDriverFault) {
      try {
        await supabase
          .from('orders')
          .update({
            driver_fault: true,
            is_refund_eligible: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      } catch (err: any) {
        logger.error(`[lifecycle] Failed to update driver_fault on cancellation for order ${orderId}:`, err.message);
      }
    }

    if (actor.type === 'driver') {
      try {
        const { AbuseDetectionService } = await import('./abuseDetection.service');
        const abuseService = new AbuseDetectionService();
        await abuseService.reportViolation(
          actor.id as string,
          'excessive_cancellations',
          `Annulation manuelle de la commande par le livreur (Raison: ${reason})`,
          orderId
        );
      } catch (err: any) {
        logger.error(`[lifecycle] Failed to report cancellation violation for driver ${actor.id}:`, err.message);
      }
    }

    return result;
  }

  /**
   * Guarded variant of updateOrderCompat for reassignment: the update only
   * applies while the order is still held by the expected driver in an
   * allowed status, and reports whether a row was actually written. This is
   * what makes stall reassignment safe against a concurrently progressing
   * driver (e.g. picked_up landing between our read and our write).
   */
  private async updateOrderGuarded(
    orderId: string,
    expectedDriverId: string,
    allowedFromStatuses: string[],
    updates: Record<string, any>
  ): Promise<boolean> {
    const applyUpdate = async (payload: Record<string, any>) => supabase
      .from('orders')
      .update(payload)
      .eq('id', orderId)
      .eq('driver_id', expectedDriverId)
      .in('status', allowedFromStatuses)
      .select('id');

    let { data, error } = await applyUpdate(updates);

    if (error && isMissingColumnError(error)) {
      const legacyUpdates = { ...updates };
      delete legacyUpdates.heading_to_pickup_at;
      delete legacyUpdates.is_movement_warning;
      delete legacyUpdates.is_progress_flagged;
      delete legacyUpdates.is_arrived_warning;
      delete legacyUpdates.reassignment_count;
      delete legacyUpdates.driver_fault;
      delete legacyUpdates.is_refund_eligible;
      delete legacyUpdates.delivery_delay_minutes;
      ({ data, error } = await applyUpdate(legacyUpdates));
    }

    if (error) {
      throw new Error(error.message);
    }
    return (data || []).length > 0;
  }

  /**
   * Auto-reassign order due to driver stalling
   */
  async reassignOrderDueToStall(
    orderId: string,
    driverId: string,
    reason: string,
    options?: { allowedFromStatuses?: string[] }
  ): Promise<void> {
    // By default only pre-pickup orders may be pulled back: once the driver
    // has the goods, taking the order away automatically would strand them.
    // Admin manual reassignment passes a wider list explicitly.
    const allowedFromStatuses = options?.allowedFromStatuses ?? ['confirmed', 'preparing'];
    try {
      let { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('created_at, eta, rejected_driver_ids, reassignment_count')
        .eq('id', orderId)
        .maybeSingle();

      if (orderErr && isMissingColumnError(orderErr)) {
        const fallback = await supabase
          .from('orders')
          .select('created_at, eta, rejected_driver_ids')
          .eq('id', orderId)
          .maybeSingle();

        order = fallback.data ? { ...fallback.data, reassignment_count: 0 } : null;
        orderErr = fallback.error;
      }

      if (orderErr || !order) {
        throw new NotFoundError('Commande introuvable pour réassignation.');
      }

      const rejectedIds = order.rejected_driver_ids || [];
      if (!rejectedIds.includes(driverId)) {
        rejectedIds.push(driverId);
      }

      const delayMinutes = Math.max(0, Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000));
      const newEta = this.recalculateEta(order.created_at, order.eta);
      const nextReassignments = (order.reassignment_count || 0) + 1;

      // 1. Unassign driver and reset order fields in DB — guarded so a
      // concurrent pickup/delivery by the driver aborts the reassignment.
      const applied = await this.updateOrderGuarded(orderId, driverId, allowedFromStatuses, {
        driver_id: null,
        status: 'confirmed',
        heading_to_pickup_at: null,
        arrived_pickup_at: null,
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

      if (!applied) {
        logger.info(`[lifecycle] Reassignment of order ${orderId} skipped: order progressed or changed driver concurrently.`);
        return;
      }

      // 2. Reset driver state to AVAILABLE/OFFLINE
      try {
        const { data: drv } = await supabase
          .from('drivers')
          .select('is_online')
          .eq('id', driverId)
          .maybeSingle();

        const nextState = drv?.is_online ? 'AVAILABLE' : 'OFFLINE';
        await this.updateDriverCompat(driverId, {
          state: nextState,
          active_orders: 0,
          cooldown_until: null,
          cooldown_reason: null,
          updated_at: new Date().toISOString()
        });
      } catch (err: any) {
        logger.error(`[lifecycle] Failed to reset driver state on stall reassignment for driver ${driverId}:`, err.message);
        throw err;
      }

      logger.info(`[lifecycle] Order ${orderId} automatically reassigned from driver ${driverId} due to stall: ${reason}`);

      // 3. Emit Socket.IO events
      try {
        const io = getSocketIO();
        if (io) {
          io.to(`order:${orderId}`).emit('order:reassigned', {
            order_id: orderId,
            reason,
            reassignment_count: nextReassignments
          });
          io.to(`order:${orderId}`).emit('order:status', {
            order_id: orderId,
            status: 'confirmed'
          });
          io.to(`driver:${driverId}`).emit('order:reassigned', {
            order_id: orderId,
            reason
          });
          io.to('admin:dashboard').emit('order:reassigned', {
            order_id: orderId,
            driver_id: driverId,
            reason
          });
          io.to('admin:dashboard').emit('order:status', {
            order_id: orderId,
            status: 'confirmed'
          });
        }
      } catch (socketErr: any) {
        logger.warn('[orderLifecycle] Socket.IO broadcast for reassignment failed:', socketErr.message);
      }
    } catch (err: any) {
      logger.error(`[lifecycle] Error in reassignOrderDueToStall for order ${orderId}:`, err.message);
      throw err;
    }
  }

  /**
   * Helper to recalculate ETA on reassignment/delay
   */
  private recalculateEta(createdAtStr: string, currentEtaStr: string | null): string {
    const elapsedMinutes = Math.floor((Date.now() - new Date(createdAtStr).getTime()) / 60000);
    let etaVal = 30;
    if (currentEtaStr) {
      const parsed = parseInt(currentEtaStr.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) {
        etaVal = parsed;
      }
    }
    const newEtaVal = Math.max(etaVal, elapsedMinutes + 20);
    return `${newEtaVal} min`;
  }
}
