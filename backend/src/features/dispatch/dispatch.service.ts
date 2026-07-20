import { Server } from 'socket.io';
import { logger } from '../../config/logger';
import { getSocketIO } from '../realtime/socket.server';
import { DispatchRepository } from './dispatch.repository';
import { DriverStateCache } from './driverStateCache';
import { OfferQueue } from './offerQueue';
import { AssignmentEngine } from './assignmentEngine';
import { REALTIME_EVENTS } from '../realtime/realtime.events';

const OFFER_DURATION_SECONDS = 45;

export class DispatchService {
  private repo = new DispatchRepository();
  private driverStateCache = new DriverStateCache();
  private offerQueue = new OfferQueue();
  private assignmentEngine = new AssignmentEngine();

  /**
   * Run dispatch loop iteration:
   * 1. Find eligible drivers and assign pending orders using scalable components
   */
  async runDispatchCycle(io?: Server): Promise<void> {
    try {
      const ioInstance = io || getSocketIO();

      // 1. Fetch pending orders
      const ordersData = await this.repo.getPendingOrders();
      if (!ordersData || ordersData.length === 0) {
        logger.debug('[dispatch] No pending unassigned orders found.');
        return;
      }

      // Filter out orders created less than 2.5 seconds ago (smooth transition delay)
      const orders = ordersData.filter(order => {
        const ageMs = Date.now() - new Date(order.created_at).getTime();
        const hasActiveOffer = order.offered_driver_id &&
          order.offer_expires_at &&
          new Date(order.offer_expires_at) > new Date();
        return ageMs >= 2500 && !hasActiveOffer;
      });

      if (orders.length === 0) {
        logger.debug('[dispatch] Pending orders exist, but all are too new or already have active offers.');
        return;
      }

      // 2. Fetch online available drivers from DriverStateCache (leveraging Redis memory + DB truth)
      const eligibleDrivers = await this.driverStateCache.getOnlineAvailableDrivers();
      if (eligibleDrivers.length === 0) {
        logger.warn('[dispatch] Pending dispatchable orders exist, but no eligible available drivers were found.', {
          pending_orders: orders.length,
        });
        return;
      }

      // 3. Fetch active delivery loads (count of active orders per driver)
      const activeLoads = await this.repo.getActiveLoads();

      // Fetch all delivery zones for zone neighbor/manual-mode resolution.
      const zones = await this.repo.getDeliveryZones();

      // 4. Run Assignment Engine to calculate match decisions (pure logic)
      const matches = this.assignmentEngine.match(orders, eligibleDrivers, activeLoads, zones);
      if (matches.length === 0) {
        logger.warn('[dispatch] Pending orders and eligible drivers exist, but assignment produced no matches.', {
          pending_orders: orders.length,
          eligible_drivers: eligibleDrivers.length,
        });
        return;
      }

      // 5. Apply match decisions
      for (const match of matches) {
        const { orderId, driverId } = match;
        const offerExpiresAt = new Date(Date.now() + OFFER_DURATION_SECONDS * 1000).toISOString();

        logger.info(`[dispatch] Matched order ${orderId} with driver ${driverId} (rate: ${match.acceptanceRate}%, reliability: ${match.reliabilityScore}%, distance: ${match.distance.toFixed(2)} km)`);

        try {
          // Commit offer to database and Redis Sorted Set
          await this.offerQueue.addOffer(orderId, driverId, offerExpiresAt);
        } catch (dbErr: any) {
          logger.error(`[dispatch] Failed to save offer for order ${orderId} and driver ${driverId}:`, dbErr.message);
          continue;
        }

        // Update driver state to OFFERED, increment total_offers and recalculate rate.
        try {
          await this.repo.markDriverOffered(driverId);
          await this.repo.recordOfferEvent({
            orderId,
            driverId,
            eventType: 'offered',
            metadata: {
              distance_km: Number(match.distance.toFixed(3)),
              acceptance_rate: match.acceptanceRate,
              reliability_score: match.reliabilityScore
            }
          });
        } catch (err: any) {
          logger.error(`[dispatch] Failed to update driver state/history on offer for driver ${driverId}:`, err.message);
        }

        // Emit Socket.IO event to driver and admin dashboard
        ioInstance?.to(`driver:${driverId}`).emit(REALTIME_EVENTS.ORDER_OFFERED, {
          order_id: orderId,
          expires_at: offerExpiresAt
        });
        ioInstance?.to('admin:dashboard').emit(REALTIME_EVENTS.ORDER_OFFERED, {
          order_id: orderId,
          driver_id: driverId,
          expires_at: offerExpiresAt
        });
      }
    } catch (err: any) {
      logger.error('[dispatch] Dispatch loop failure:', err.message);
    }
  }
}
