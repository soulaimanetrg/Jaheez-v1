import rateLimit, { Options, MemoryStore, Store, IncrementResponse } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env';
import { redis } from '../redis/redis';
import { logger } from '../config/logger';
import type { Request } from 'express';

/**
 * Back each limiter with Redis so counters hold across processes/instances
 * (PM2 cluster, multiple containers). Each limiter needs its own prefix so
 * counters don't collide.
 *
 * Resilience: Redis being down must never break requests (mirrors the
 * REDIS_REQUIRED philosophy used elsewhere). The Redis-backed store is built
 * lazily on the first request that finds Redis ready — constructing it
 * eagerly makes rate-limit-redis issue commands (Lua script load) against a
 * dead connection, which crashes startup when Redis is absent. Any mid-flight
 * Redis failure falls back to the per-process memory store for that call.
 */
class ResilientStore implements Store {
  private redisStore: RedisStore | null = null;
  private memoryStore = new MemoryStore();
  private limiterName: string;
  private warnedFallback = false;
  private limiterOptions: Options | null = null;

  constructor(prefix: string) {
    this.limiterName = prefix;
  }

  private getRedisStore(): RedisStore | null {
    if (!redis || redis.status !== 'ready') return null;
    if (!this.redisStore) {
      try {
        this.redisStore = new RedisStore({
          // ioredis exposes call(); rate-limit-redis expects sendCommand.
          sendCommand: (...args: string[]) => (redis as any).call(...args),
          prefix: `rl:${this.limiterName}:`,
        });
        if (this.limiterOptions) this.redisStore.init?.(this.limiterOptions);
      } catch (err) {
        this.warnOnce(err);
        this.redisStore = null;
      }
    }
    return this.redisStore;
  }

  private warnOnce(err: unknown) {
    if (this.warnedFallback) return;
    this.warnedFallback = true;
    logger.warn(`[rateLimit] Redis store unavailable for ${this.limiterName}; using per-process memory store`, {
      message: err instanceof Error ? err.message : String(err),
    });
  }

  init(options: Options): void {
    this.limiterOptions = options;
    this.memoryStore.init(options);
  }

  async increment(key: string): Promise<IncrementResponse> {
    const store = this.getRedisStore();
    if (store) {
      try {
        return await store.increment(key);
      } catch (err) {
        this.warnOnce(err);
      }
    }
    return this.memoryStore.increment(key);
  }

  async decrement(key: string): Promise<void> {
    const store = this.getRedisStore();
    if (store) {
      try {
        await store.decrement(key);
        return;
      } catch (err) {
        this.warnOnce(err);
      }
    }
    return this.memoryStore.decrement(key);
  }

  async resetKey(key: string): Promise<void> {
    const store = this.getRedisStore();
    if (store) {
      try {
        await store.resetKey(key);
      } catch (err) {
        this.warnOnce(err);
      }
    }
    return this.memoryStore.resetKey(key);
  }
}

function buildLimiter(prefix: string, options: Partial<Options>) {
  return rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: new ResilientStore(prefix),
    ...options,
  });
}

/**
 * General API rate limiter (e.g. 100 requests per 15 minutes)
 */
export const apiLimiter = buildLimiter('api', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: env.NODE_ENV === 'test' ? 10000 : 200,
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
    error_code: 'too_many_requests',
  },
});

/**
 * Strict rate limiter for sensitive endpoints like auth/login, registration, OTP (e.g. 5 requests per minute)
 */
export const authLimiter = buildLimiter('auth', {
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') ? 10000 : 5,
  message: {
    error: 'Trop de tentatives, veuillez réessayer dans une minute.',
    error_code: 'too_many_auth_requests',
  },
});

export const confirmationLimiter = buildLimiter('confirm', {
  windowMs: 5 * 60 * 1000,
  limit: (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') ? 10000 : 10,
  keyGenerator: (req) => `${req.ip}:${req.params.id || 'stage'}`,
  message: { error: 'Trop de tentatives de confirmation.', error_code: 'confirmation_rate_limited' },
});

export const storeReadyLimiter = buildLimiter('store-ready', {
  windowMs: 60 * 1000,
  limit: (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') ? 10000 : 30,
  message: { error: 'Trop de signaux store-ready.', error_code: 'store_ready_rate_limited' },
});

export const errandOrderLimiter = buildLimiter('errand', {
  windowMs: 10 * 60 * 1000,
  limit: (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') ? 10000 : 5,
  message: { error: 'Trop de demandes de course.', error_code: 'errand_rate_limited' },
});

const customerRateLimitKey = (req: Request) => req.supabaseUser?.id || req.ip || 'unknown';

export const checkoutPreviewLimiter = buildLimiter('checkout-preview', {
  windowMs: 60 * 1000,
  limit: (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') ? 10000 : 60,
  keyGenerator: customerRateLimitKey,
  message: { error: 'Trop de mises a jour du panier.', error_code: 'checkout_preview_rate_limited' },
});

export const checkoutLinePreviewLimiter = buildLimiter('checkout-line-preview', {
  windowMs: 60 * 1000,
  limit: (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') ? 10000 : 90,
  keyGenerator: customerRateLimitKey,
  message: { error: 'Trop de mises a jour du produit.', error_code: 'checkout_line_preview_rate_limited' },
});

export const checkoutCreateLimiter = buildLimiter('checkout-create', {
  windowMs: 10 * 60 * 1000,
  limit: (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') ? 10000 : 10,
  keyGenerator: customerRateLimitKey,
  message: { error: 'Trop de tentatives de commande.', error_code: 'checkout_rate_limited' },
});
