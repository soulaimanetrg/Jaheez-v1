import { supabase } from '../../db/supabase';
import { logger } from '../../config/logger';
import { getSocketIO } from '../realtime/socket.server';
import { OfferQueue } from './offerQueue';
import { DispatchRepository } from './dispatch.repository';

export class TimeoutWorker {
  private offerQueue = new OfferQueue();
  private dispatchRepo = new DispatchRepository();

  /**
   * Scans for and processes all expired order offers.
   */
  async processExpiredOffers(): Promise<void> {
    try {
      // 1. Get expired offers
      const expiredOffers = await this.offerQueue.getExpiredOffers();
      if (expiredOffers.length === 0) {
        return;
      }

      const io = getSocketIO();

      for (const offer of expiredOffers) {
        const orderId = offer.id;
        const driverId = offer.offered_driver_id;
        const rejectedIds: string[] = offer.rejected_driver_ids || [];

        logger.info(`[timeout-worker] Offer expired for order ${orderId} offered to driver ${driverId}`);

        if (driverId && !rejectedIds.includes(driverId)) {
          rejectedIds.push(driverId);
        }

        const nextReassignments = (offer.reassignment_count || 0) + 1;

        // 2. Clear the active expired offer. The repository guards against stale
        // snapshots so a new offer or claimed order is not accidentally cleared.
        const expired = await this.dispatchRepo.expireOffer({
          orderId,
          driverId,
          rejectedDriverIds: rejectedIds,
          reassignmentCount: nextReassignments,
        });

        if (!expired) {
          logger.warn(`[timeout-worker] Skipped stale expired offer for order ${orderId} and driver ${driverId}`);
          continue;
        }

        // Also remove from Redis OfferQueue cache
        if (orderId) {
          try {
            await this.offerQueue.removeOffer(orderId);
          } catch (qErr: any) {
            logger.warn(`[timeout-worker] Failed to remove expired offer from queue cache: ${qErr.message}`);
          }
        }

        if (!driverId) {
          continue;
        }

        try {
          await this.dispatchRepo.recordOfferEvent({
            orderId,
            driverId,
            eventType: 'timed_out',
            reason: 'Offer expired before driver response',
            metadata: { reassignment_count: nextReassignments }
          });
        } catch (eventErr: any) {
          logger.error(`[timeout-worker] Failed to record timeout event for order ${orderId}:`, eventErr.message);
        }

        // 3. Update driver state, consecutive timeouts, and check penalty blocks
        try {
          const drv = await this.dispatchRepo.getDriverTimeoutInputs(driverId);

          if (drv) {
            const totalOffers = drv.total_offers || 0;
            const acceptedOffers = drv.accepted_offers || 0;
            const rate = totalOffers > 0 ? Number(((acceptedOffers * 100.0) / totalOffers).toFixed(2)) : 100.00;
            const nextTimeouts = (drv.driver_timeout_count || 0) + 1;
            const nextConsecutive = (drv.consecutive_timeouts || 0) + 1;

            let pausedUntil: string | null = null;
            let cooldownUntil = new Date(Date.now() + 60 * 1000).toISOString();
            let finalConsecutive = nextConsecutive;
            let shouldAlert = false;
            let nextState = drv.is_online ? 'AVAILABLE' : 'OFFLINE';

            if (nextConsecutive >= 3) {
              pausedUntil = new Date(Date.now() + 15 * 60000).toISOString();
              cooldownUntil = pausedUntil;
              nextState = 'FORCED_BREAK';
              finalConsecutive = 0;
              shouldAlert = true;
            }

            await this.dispatchRepo.updateDriverAfterTimeout(driverId, {
              state: nextState,
              driver_timeout_count: nextTimeouts,
              driver_acceptance_rate: rate,
              consecutive_timeouts: finalConsecutive,
              cooldown_until: cooldownUntil,
              cooldown_reason: 'TIMED_OUT',
              ...(pausedUntil ? { paused_until: pausedUntil } : {}),
              updated_at: new Date().toISOString()
            });

            try {
              await this.dispatchRepo.recalculateDriverReliability(driverId);
              await this.dispatchRepo.createReliabilitySnapshot(driverId);
            } catch (scoreErr: any) {
              logger.error(`[timeout-worker] Failed to update reliability after timeout for driver ${driverId}:`, scoreErr.message);
            }

            // 4. Handle consecutive timeouts penalty pause & support ticket escalations
            if (shouldAlert) {
              logger.warn(`[timeout-worker] Driver ${driverId} ignored 3 consecutive offers. Applying forced break for 15 minutes.`);
              
              // Insert support request ticket as admin alert
              try {
                const { error: insertErr } = await supabase.from('support_requests').insert({
                  user_id: offer.user_id,
                  category: 'delivery_issue',
                  urgency: 'high',
                  subject: `Alerte Livreur: Refus excessifs`,
                  message: `Le livreur ${drv.full_name || 'Inconnu'} (${drv.phone || 'N/A'}) a ignoré 3 offres consécutives. Son taux d'acceptation est de ${rate}%. Il a été temporairement suspendu des affectations pendant 15 minutes.`,
                  order_id: orderId,
                  ref_number: `TKT-${Date.now().toString().slice(-6)}`,
                  status: 'open'
                });
                if (insertErr) {
                  logger.error(`[timeout-worker] Failed to create support request alert for driver ${driverId}: ${insertErr.message}`);
                }
              } catch (alertDbErr: any) {
                logger.error(`[timeout-worker] Exception creating support request alert for driver ${driverId}:`, alertDbErr.message);
              }

              // Call abuse detection service to increment warning count and escalate
              try {
                const { AbuseDetectionService } = await import('../order/abuseDetection.service');
                const abuseService = new AbuseDetectionService();
                await abuseService.reportViolation(
                  driverId,
                  'repeated_ignored_offers',
                  'Refus répétés d’offres de commande (3 consécutives)',
                  orderId
                );
              } catch (abuseErr: any) {
                logger.error(`[timeout-worker] Exception reporting ignored offers to abuse detection:`, abuseErr.message);
              }

              // Emit Socket.IO alert to dashboard
              try {
                io?.to('admin:dashboard').emit('driver:alert', {
                  driver_id: driverId,
                  full_name: drv.full_name,
                  phone: drv.phone,
                  type: 'consecutive_timeouts',
                  message: `Le livreur ${drv.full_name || 'Inconnu'} a été suspendu pour 15 minutes (3 refus consécutifs).`
                });
              } catch (socketEmitErr: any) {
                logger.warn(`[timeout-worker] Failed to emit driver alert socket:`, socketEmitErr.message);
              }
            }
          }
        } catch (err: any) {
          logger.error(`[timeout-worker] Failed to update driver stats on timeout for driver ${driverId}:`, err.message);
        }

        // Notify driver app that offer expired
        io?.to(`driver:${driverId}`).emit('order:offer_expired', { order_id: orderId });
        io?.to('admin:dashboard').emit('order:offer_expired', { order_id: orderId, driver_id: driverId });
      }
    } catch (err: any) {
      logger.error('[timeout-worker] Error processing expired offers:', err.message);
    }
  }
}
