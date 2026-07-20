import { redis } from '../../redis/redis';
import { supabase } from '../../db/supabase';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { isMissingColumnError } from '../../utils/schemaCompatibility';

export interface CacheDriver {
  id: string;
  current_lat: number | null;
  current_lng: number | null;
  state: string;
  driver_acceptance_rate: number;
  driver_timeout_count: number;
  paused_until: string | null;
  suspension_until: string | null;
  zone_id: string | null;
  jobs_completed: number;
  total_offers: number;
  warning_count: number;
  consecutive_timeouts: number;
  shift_active: boolean;
  active_orders: number;
  max_active_orders: number;
  cooldown_until: string | null;
  cooldown_reason: string | null;
  driver_reliability_score: number;
}

export class DriverStateCache {
  private withDriverDefaults(driver: any): CacheDriver {
    return {
      ...driver,
      paused_until: driver.paused_until ?? null,
      suspension_until: driver.suspension_until ?? null,
      zone_id: driver.zone_id ?? null,
      jobs_completed: Number(driver.jobs_completed || 0),
      total_offers: Number(driver.total_offers || 0),
      warning_count: Number(driver.warning_count || 0),
      consecutive_timeouts: Number(driver.consecutive_timeouts || 0),
      shift_active: driver.shift_active ?? true,
      active_orders: Number(driver.active_orders || 0),
      max_active_orders: Number(driver.max_active_orders || 1),
      cooldown_until: driver.cooldown_until ?? null,
      cooldown_reason: driver.cooldown_reason ?? null,
      driver_reliability_score: Number(driver.driver_reliability_score ?? 100),
    };
  }

  /**
   * Fetches active, online drivers from Postgres and filters them using Redis heartbeats.
   * Dispatch does not require GPS coordinates; assigned zones and fairness rules drive matching.
   */
  async getOnlineAvailableDrivers(): Promise<CacheDriver[]> {
    try {
      const now = new Date();

      // 1. Fetch online available drivers from Postgres (Single source of truth)
      const { data: dbDrivers, error } = await supabase
        .from('drivers')
        .select('id, current_lat, current_lng, state, driver_acceptance_rate, driver_timeout_count, paused_until, suspension_until, zone_id, jobs_completed, total_offers, warning_count, consecutive_timeouts, shift_active, active_orders, max_active_orders, cooldown_until, cooldown_reason, driver_reliability_score')
        .eq('is_online', true)
        .eq('state', 'AVAILABLE');

      if (error && isMissingColumnError(error)) {
        const { data: fallbackDrivers, error: fallbackError } = await supabase
          .from('drivers')
          .select('id, current_lat, current_lng, state, driver_acceptance_rate, driver_timeout_count, paused_until, suspension_until, zone_id, jobs_completed, total_offers, warning_count, consecutive_timeouts')
          .eq('is_online', true)
          .eq('state', 'AVAILABLE');

        if (fallbackError) {
          throw new Error(`Database error fetching online drivers: ${fallbackError.message}`);
        }

        const fallback = ((fallbackDrivers || []) as any[]).map(driver => this.withDriverDefaults(driver));
        return fallback.filter(d => {
          if (d.paused_until && new Date(d.paused_until) > now) return false;
          if (d.suspension_until && new Date(d.suspension_until) > now) return false;
          return true;
        });
      }

      if (error) {
        throw new Error(`Database error fetching online drivers: ${error.message}`);
      }

      const drivers = ((dbDrivers || []) as any[]).map(driver => this.withDriverDefaults(driver));
      if (drivers.length === 0) {
        return [];
      }

      // Filter out paused or suspended drivers based on DB timestamps
      const eligibleDbDrivers = drivers.filter(d => {
        if (d.shift_active !== true) return false;
        if (Number(d.active_orders || 0) >= Number(d.max_active_orders || 1)) return false;
        if (d.paused_until && new Date(d.paused_until) > now) return false;
        if (d.suspension_until && new Date(d.suspension_until) > now) return false;
        if (d.cooldown_until && new Date(d.cooldown_until) > now) return false;
        return true;
      });

      if (eligibleDbDrivers.length === 0) {
        return [];
      }

      // 2. Enrich and filter with Redis if connected
      const isRedisConnected = redis && redis.status === 'ready';
      if (!isRedisConnected) {
        logger.debug('[driver-state-cache] Redis not connected. Falling back to Postgres availability.');
        return eligibleDbDrivers;
      }

      const driverIds = eligibleDbDrivers.map(d => d.id);

      // Execute bulk Redis pipeline: check heartbeats only.
      const pipeline = redis.pipeline();
      driverIds.forEach(id => {
        pipeline.exists(`driver:online:${id}`);
      });

      const results = await pipeline.exec();
      if (!results) {
        return eligibleDbDrivers;
      }

      const enrichedDrivers: CacheDriver[] = [];

      for (let i = 0; i < driverIds.length; i++) {
        const driver = eligibleDbDrivers[i];
        const existsErr = results[i]?.[0];
        const existsVal = results[i]?.[1]; // 1 if exists, 0 if not

        // If Redis heartbeat key does not exist, and Redis is required, filter out driver
        const hasHeartbeat = !existsErr && existsVal === 1;
        if (!hasHeartbeat && env.REDIS_REQUIRED) {
          logger.debug(`[driver-state-cache] Filtering out driver ${driver.id} due to missing Redis heartbeat`);
          continue;
        }

        enrichedDrivers.push(driver);
      }

      return enrichedDrivers;
    } catch (err: any) {
      logger.error('[driver-state-cache] Error in getOnlineAvailableDrivers:', err.message);
      // Fallback: fetch directly from Postgres filtering coordinates
      const { data: dbDrivers } = await supabase
        .from('drivers')
        .select('id, current_lat, current_lng, state, driver_acceptance_rate, driver_timeout_count, paused_until, suspension_until, zone_id, jobs_completed, total_offers, warning_count, consecutive_timeouts, shift_active, active_orders, max_active_orders, cooldown_until, cooldown_reason, driver_reliability_score')
        .eq('is_online', true)
        .eq('state', 'AVAILABLE')
        ;

      if (!dbDrivers) return [];

      const now = new Date();
      return ((dbDrivers || []) as any[]).map(driver => this.withDriverDefaults(driver)).filter(d => {
        if (Number(d.active_orders || 0) >= Number(d.max_active_orders || 1)) return false;
        if (d.paused_until && new Date(d.paused_until) > now) return false;
        if (d.suspension_until && new Date(d.suspension_until) > now) return false;
        if (d.cooldown_until && new Date(d.cooldown_until) > now) return false;
        return true;
      });
    }
  }

  /**
   * Retrieves current real-time coordinates of a single driver.
   */
  async getDriverLocation(driverId: string): Promise<{ lat: number; lng: number } | null> {
    try {
      if (redis && redis.status === 'ready') {
        const pos = await redis.geopos('drivers:locations', driverId);
        if (pos && pos[0]) {
          return {
            lng: Number(pos[0][0]),
            lat: Number(pos[0][1])
          };
        }
      }

      // Fallback to Postgres
      const { data, error } = await supabase
        .from('drivers')
        .select('current_lat, current_lng')
        .eq('id', driverId)
        .maybeSingle();

      if (!error && data && data.current_lat !== null && data.current_lng !== null) {
        return {
          lat: Number(data.current_lat),
          lng: Number(data.current_lng)
        };
      }
    } catch (err: any) {
      logger.error(`[driver-state-cache] Error getting location for driver ${driverId}:`, err.message);
    }
    return null;
  }
}
