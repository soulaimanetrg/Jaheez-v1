import { Server } from 'socket.io';
import { redis } from '../redis/redis';
import { logger } from '../config/logger';
import { DriverRepository } from '../features/driver/driver.repository';
import { supabase } from '../db/supabase';

const HEARTBEAT_SCAN_MS = 30_000;
const STALE_THRESHOLD_MS = 60_000; // 60 seconds

export function startDriverHeartbeatWorker(io?: Server) {
  const repo = new DriverRepository();
  let lastRedisWarningTime = 0;
  const WARNING_THROTTLE_MS = 10 * 60 * 1000; // 10 minutes

  const checkStaleDrivers = async () => {
    const staleDriversSet = new Set<string>();

    // 1. Redis Check (if available)
    if (redis && redis.status === 'ready') {
      try {
        const driverIds = await redis.smembers('drivers:online:index');
        await Promise.all(
          driverIds.map(async (driverId) => {
            const ttl = await redis.ttl(`driver:online:${driverId}`);
            if (ttl <= 0) {
              staleDriversSet.add(driverId);
              // Clean up Redis immediately
              await redis.srem('drivers:online:index', driverId);
              await redis.zrem('drivers:locations', driverId);
            }
          })
        );
      } catch (error) {
        logger.error('[heartbeat] Redis stale driver check failed', { error: error instanceof Error ? error.message : error });
      }
    } else {
      const now = Date.now();
      if (now - lastRedisWarningTime > WARNING_THROTTLE_MS) {
        logger.warn('[heartbeat] Redis is not connected. Relying on database last_seen_at for stale driver detection.');
        lastRedisWarningTime = now;
      }
    }

    // 2. Database last_seen_at Check (always run as fallback/reconciliation)
    try {
      const threshold = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
      const { data: dbDrivers, error: dbError } = await supabase
        .from('drivers')
        .select('id, is_online, last_seen_at')
        .eq('is_online', true)
        .lt('last_seen_at', threshold);

      if (dbError) {
        throw dbError;
      }

      if (dbDrivers && dbDrivers.length > 0) {
        for (const drv of dbDrivers) {
          staleDriversSet.add(drv.id);
        }
      }
    } catch (dbError) {
      logger.error('[heartbeat] Database stale driver check failed', { error: dbError instanceof Error ? dbError.message : dbError });
    }

    // 3. Mark all identified stale drivers offline
    if (staleDriversSet.size > 0) {
      await Promise.all(
        Array.from(staleDriversSet).map(async (driverId) => {
          try {
            const driver = await repo.markDriverOffline(driverId);
            if (driver) {
              logger.info('[heartbeat] Driver marked offline after stale check', { driverId });
              io?.to('admin:dashboard').emit('driver:offline', { driver_id: driverId });
              io?.to(`driver:${driverId}`).emit('driver:offline', { driver_id: driverId });
            }
          } catch (error) {
            logger.error('[heartbeat] Failed to mark stale driver offline', { driverId, error: error instanceof Error ? error.message : error });
          }
        })
      );
    }
  };

  const timer = setInterval(checkStaleDrivers, HEARTBEAT_SCAN_MS);
  timer.unref?.();
  void checkStaleDrivers();
  return timer;
}
