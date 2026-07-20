import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let redis: Redis;

// Log error throttle control
let lastErrorTime = 0;
const ERROR_LOG_INTERVAL = 60000; // 1 minute
let isInitialConnectionFailedLogged = false;

const redisOptions: any = {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    // Reconnection backoff strategy: 2s, 4s, 8s, up to 30s
    const delay = Math.min(times * 2000, 30000);
    const requiredStr = env.REDIS_REQUIRED ? 'REQUIRED' : 'OPTIONAL';
    
    // Log reconnect message on a throttled basis or on first reconnect
    if (times === 1 || times % 10 === 0) {
      logger.warn(`[redis] Connection lost. Reconnecting (attempt #${times}, ${requiredStr}) in ${delay}ms...`);
    }
    return delay;
  }
};

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, redisOptions);
} else {
  redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    ...redisOptions
  });
}

redis.on('connect', () => {
  logger.info('🟢 Connected to Redis successfully');
  isInitialConnectionFailedLogged = false;
});

redis.on('error', (err: any) => {
  const now = Date.now();
  // Throttle error logging to avoid spamming the log every second
  if (now - lastErrorTime > ERROR_LOG_INTERVAL) {
    if (env.REDIS_REQUIRED) {
      logger.error('🔴 Redis REQUIRED connection error:', err);
    } else {
      if (!isInitialConnectionFailedLogged) {
        logger.warn('⚠️ Redis is unavailable (local dev fallback active). Continuing without Redis tracking.', { message: err.message });
        isInitialConnectionFailedLogged = true;
      }
    }
    lastErrorTime = now;
  }
});

export { redis };
