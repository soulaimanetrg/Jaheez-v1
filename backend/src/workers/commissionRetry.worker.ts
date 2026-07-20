import { logger } from '../config/logger';
import { CommissionRepository } from '../features/commission/commission.repository';

const RETRY_INTERVAL_MS = 2 * 60 * 1000;
const GRACE_MINUTES = 2;
const BATCH_LIMIT = 25;

/**
 * Outbox sweep for financial finalization. transitionOrder() finalizes
 * commissions inline after 'delivered', but if that call fails the order is
 * left delivered with financial_finalized_at NULL and no retry would ever
 * happen. This worker re-drives finalize_delivered_order_financial (an
 * idempotent RPC) for those orders until each one lands.
 *
 * Orders that keep failing (e.g. 'no active shift' because the driver closed
 * the shift before finalization succeeded) are logged loudly on every sweep
 * so operators see them; they need manual reconciliation.
 */
export function startCommissionRetryWorker() {
  const repo = new CommissionRepository();
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;
    try {
      const pending = await repo.listUnfinalizedDeliveredOrders(GRACE_MINUTES, BATCH_LIMIT);
      if (pending.length === 0) return;

      logger.warn('[commissionRetry] Found delivered orders without financial finalization', {
        count: pending.length,
        order_ids: pending.map((o) => o.id),
      });

      for (const order of pending) {
        try {
          const applied = await repo.finalizeDeliveredOrder(order.id);
          logger.info('[commissionRetry] Finalization retried', { order_id: order.id, applied });
        } catch (err: any) {
          logger.error('[commissionRetry] Finalization still failing; manual reconciliation may be required', {
            order_id: order.id,
            status: order.status,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (err: any) {
      logger.error('[commissionRetry] Sweep failed', { error: err instanceof Error ? err.message : String(err) });
    } finally {
      running = false;
    }
  };

  void run();
  return setInterval(run, RETRY_INTERVAL_MS);
}
