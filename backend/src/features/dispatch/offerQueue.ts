import { redis } from '../../redis/redis';
import { supabase } from '../../db/supabase';
import { logger } from '../../config/logger';

export interface ActiveOffer {
  id: string;
  offered_driver_id: string;
  offer_expires_at: string;
  rejected_driver_ids: string[] | null;
  user_id: string;
  reassignment_count?: number;
}

export class OfferQueue {
  private readonly REDIS_KEY = 'dispatch:offers';

  /**
   * Adds an offer to PostgreSQL and caches it in Redis.
   */
  async addOffer(orderId: string, driverId: string, offerExpiresAt: string): Promise<void> {
    const expiresMs = new Date(offerExpiresAt).getTime();
    const now = new Date().toISOString();

    // 1. Update PostgreSQL (Source of truth). Guard against stale dispatch snapshots
    // so a driver cannot be re-offered an order after declining it.
    const { data, error } = await supabase
      .from('orders')
      .update({
        offered_driver_id: driverId,
        offer_expires_at: offerExpiresAt,
        updated_at: now
      })
      .eq('id', orderId)
      .is('driver_id', null)
      .in('status', ['confirmed', 'preparing'])
      .or(`offered_driver_id.is.null,offer_expires_at.lte.${now}`)
      .not('rejected_driver_ids', 'cs', `{${driverId}}`)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to save offer for order ${orderId} in Postgres: ${error.message}`);
    }
    if (!data) {
      throw new Error(`Skipped stale offer for order ${orderId} and driver ${driverId}`);
    }

    // 2. Cache in Redis Sorted Set
    if (redis && redis.status === 'ready') {
      try {
        await redis.zadd(this.REDIS_KEY, expiresMs, orderId);
        logger.debug(`[offer-queue] Cached offer in Redis for order ${orderId} expiring at ${offerExpiresAt}`);
      } catch (err: any) {
        logger.warn(`[offer-queue] Redis write failed for offer cache: ${err.message}`);
      }
    }
  }

  /**
   * Removes/clears an offer from PostgreSQL and the Redis cache.
   */
  async removeOffer(orderId: string): Promise<void> {
    // 1. Clear fields in PostgreSQL
    const { error } = await supabase
      .from('orders')
      .update({
        offered_driver_id: null,
        offer_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Failed to remove offer for order ${orderId} in Postgres: ${error.message}`);
    }

    // 2. Remove from Redis Sorted Set
    if (redis && redis.status === 'ready') {
      try {
        await redis.zrem(this.REDIS_KEY, orderId);
        logger.debug(`[offer-queue] Removed offer cache from Redis for order ${orderId}`);
      } catch (err: any) {
        logger.warn(`[offer-queue] Redis delete failed for offer cache: ${err.message}`);
      }
    }
  }

  /**
   * Retrieves all offers that have expired.
   */
  async getExpiredOffers(): Promise<ActiveOffer[]> {
    const now = Date.now();
    const isRedisConnected = redis && redis.status === 'ready';

    if (isRedisConnected) {
      try {
        // Query Redis for expired order IDs
        const expiredOrderIds = await redis.zrangebyscore(this.REDIS_KEY, '-inf', now);
        if (expiredOrderIds && expiredOrderIds.length > 0) {
          // Fetch these specific orders from Postgres to get full payloads
          const { data, error } = await supabase
            .from('orders')
            .select('id, offered_driver_id, offer_expires_at, rejected_driver_ids, user_id, reassignment_count')
            .in('id', expiredOrderIds)
            .is('driver_id', null);

          if (!error && data) {
            return data as ActiveOffer[];
          }
        }
        return [];
      } catch (err: any) {
        logger.warn(`[offer-queue] Redis getExpiredOffers failed: ${err.message}. Falling back to PostgreSQL.`);
      }
    }

    // Fallback: Query Postgres directly
    const { data, error } = await supabase
      .from('orders')
      .select('id, offered_driver_id, offer_expires_at, rejected_driver_ids, user_id, reassignment_count')
      .is('driver_id', null)
      .not('offered_driver_id', 'is', null)
      .lte('offer_expires_at', new Date(now).toISOString());

    if (error) {
      logger.error(`[offer-queue] Postgres getExpiredOffers failed: ${error.message}`);
      return [];
    }

    return (data || []) as ActiveOffer[];
  }

  /**
   * Synchronizes Redis cache with PostgreSQL. (Useful on startup or recovery)
   */
  async syncCache(): Promise<void> {
    if (!redis || redis.status !== 'ready') return;

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('orders')
        .select('id, offer_expires_at')
        .is('driver_id', null)
        .not('offered_driver_id', 'is', null)
        .gt('offer_expires_at', now);

      if (error || !data) return;

      // Clear current Redis cache
      await redis.del(this.REDIS_KEY);

      if (data.length > 0) {
        const pipeline = redis.pipeline();
        data.forEach(order => {
          const score = new Date(order.offer_expires_at!).getTime();
          pipeline.zadd(this.REDIS_KEY, score, order.id);
        });
        await pipeline.exec();
        logger.info(`[offer-queue] Synchronized ${data.length} active offers from Postgres to Redis cache`);
      }
    } catch (err: any) {
      logger.error(`[offer-queue] Failed to sync cache:`, err.message);
    }
  }
}
