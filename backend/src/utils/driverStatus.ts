import { supabase } from '../db/supabase';
import { redis } from '../redis/redis';
import { logger } from '../config/logger';

const DRIVER_ACTIVE_TTL_SECONDS = 60;

const driverActiveKey = (driverId: string) => `driver:active:${driverId}`;

/**
 * Authoritative check that a driver account is still active. Driver JWTs live
 * for 30 days, so this is the revocation path: a deactivated driver must lose
 * API and socket access on the next request, not at token expiry.
 *
 * Results are cached in Redis for a short TTL to avoid one DB read per
 * request. Deactivation invalidates the cache for instant lockout.
 * Fails closed: an unverifiable status never grants access.
 */
export async function isDriverActive(driverId: string): Promise<boolean> {
  const key = driverActiveKey(driverId);

  if (redis && redis.status === 'ready') {
    try {
      const cached = await redis.get(key);
      if (cached === '1') return true;
      if (cached === '0') return false;
    } catch (err: any) {
      logger.warn('[driverStatus] Redis read failed; falling back to DB', { message: err.message });
    }
  }

  const { data, error } = await supabase
    .from('drivers')
    .select('is_active')
    .eq('id', driverId)
    .maybeSingle();

  if (error) {
    logger.error('[driverStatus] Driver status lookup failed', { driver_id: driverId, message: error.message });
    throw new Error('driver_status_lookup_failed');
  }

  const active = !!data && data.is_active !== false;

  if (redis && redis.status === 'ready') {
    try {
      await redis.set(key, active ? '1' : '0', 'EX', DRIVER_ACTIVE_TTL_SECONDS);
    } catch (err: any) {
      logger.warn('[driverStatus] Redis write failed', { message: err.message });
    }
  }

  return active;
}

/**
 * Drop the cached status so a deactivation takes effect immediately.
 */
export async function invalidateDriverActiveCache(driverId: string): Promise<void> {
  if (!redis || redis.status !== 'ready') return;
  try {
    await redis.del(driverActiveKey(driverId));
  } catch (err: any) {
    logger.warn('[driverStatus] Redis invalidation failed', { driver_id: driverId, message: err.message });
  }
}
