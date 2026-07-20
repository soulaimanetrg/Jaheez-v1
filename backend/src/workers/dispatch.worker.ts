import { Server } from 'socket.io';
import { DispatchService } from '../features/dispatch/dispatch.service';
import { TimeoutWorker } from '../features/dispatch/timeoutWorker';
import { OfferQueue } from '../features/dispatch/offerQueue';
import { logger } from '../config/logger';
import { redis } from '../redis/redis';

export function startDispatchWorker(io?: Server) {
  const service = new DispatchService();
  const timeoutWorker = new TimeoutWorker();
  const offerQueue = new OfferQueue();
  let lastRedisFallbackLogAt = 0;

  const logRedisFallbackIfNeeded = () => {
    if (redis.status === 'ready') return;
    const now = Date.now();
    if (now - lastRedisFallbackLogAt > 60_000) {
      logger.warn('[dispatch-worker] Redis is unavailable. Running dispatch with PostgreSQL fallback.');
      lastRedisFallbackLogAt = now;
    }
  };

  // Sync the active offer cache on startup to ensure consistency
  void offerQueue.syncCache().catch(err => {
    logger.error('[dispatch-worker] Failed to sync active offers cache:', err.message);
  });

  let ticks = 0;

  const tick = async () => {
    ticks++;

    // Process expired offers every 2 seconds
    if (ticks % 2 === 0) {
      try {
        logRedisFallbackIfNeeded();
        await timeoutWorker.processExpiredOffers();
      } catch (err: any) {
        logger.error('[dispatch-worker] Timeout check error:', err.message);
      }
    }

    // Run dispatch assignment matching loop every 5 seconds
    if (ticks % 5 === 0) {
      try {
        logRedisFallbackIfNeeded();
        await service.runDispatchCycle(io);
      } catch (err: any) {
        logger.error('[dispatch-worker] Dispatch matching error:', err.message);
      }
    }
  };

  const timer = setInterval(tick, 1000);
  timer.unref?.();

  // Run immediate initial checks
  void (async () => {
    try {
      logRedisFallbackIfNeeded();
      await timeoutWorker.processExpiredOffers();
      await service.runDispatchCycle(io);
    } catch (err: any) {
      logger.error('[dispatch-worker] Initial tick error:', err.message);
    }
  })();

  return timer;
}
