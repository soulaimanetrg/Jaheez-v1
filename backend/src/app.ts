import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { redis } from './redis/redis';
import { requestLogger } from './middleware/requestLogger.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/error.middleware';
import authRouter from './features/auth/auth.routes';
import checkoutRouter from './features/order/checkout.routes';
import driverRouter from './features/driver/driver.routes';
import customerRouter from './features/customer/customer.routes';
import adminRouter from './features/admin/admin.routes';
import storeRouter from './features/store/store.routes';
import settingsRouter from './features/settings/settings.routes';
import financeRouter from './features/finance/finance.routes';
import supportRouter from './features/support/support.routes';
import legacyPaymentRouter from './features/order/legacyPayment.routes';
import paymentsRouter from './features/payments/payments.routes';
import uploadRouter from './features/admin/upload.routes';
import commissionRouter from './features/commission/commission.routes';
import reliabilityRouter from './features/reliability/reliability.routes';
import riskRouter from './features/risk/risk.routes';
import errandRouter from './features/errand/errand.routes';
import { supabaseSendSmsHook, wasenderWebhook, whatsappProviderHealth } from './features/auth/whatsappOtpHooks';

const app = express();

// Both environments sit behind exactly one reverse proxy hop:
// staging behind its Cloudflare proxy, production behind the Nginx container
// (see deploy/nginx.conf). Trusting exactly one hop lets rate limiting and
// audit logs use the real client address without honoring arbitrary
// client-supplied X-Forwarded-For chains.
if (env.JAHEEZ_TARGET_ENV === 'staging' || env.NODE_ENV === 'production') app.set('trust proxy', 1);

// Security and utility middlewares
app.use(helmet());

// CORS: whitelist allowed origins (configurable via env)
const ALLOWED_ORIGINS = (env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Default dev origins if none configured
if (ALLOWED_ORIGINS.length === 0 && env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push(
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:19006'
  );
}

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// Signed provider webhooks need the untouched JSON bytes.
app.post('/admin-api/auth/hooks/send-sms', express.raw({ type: 'application/json', limit: '64kb' }), supabaseSendSmsHook);
app.post('/admin-api/webhooks/wasender', express.raw({ type: 'application/json', limit: '256kb' }), wasenderWebhook);
app.get('/admin-api/auth/whatsapp/health', whatsappProviderHealth);

// Legacy Stripe webhook is intentionally disabled while JAHEEZ migrates payment providers.
// Keep this route before express.json() so old webhook traffic receives a clean 410.
app.use('/admin-api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/admin-api', legacyPaymentRouter);
// Uploads need a larger route-specific JSON parser for base64 image data.
app.use('/admin-api', uploadRouter);

// Body parsing with size limit to prevent DoS
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// Request timeout (30 seconds)
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout', error_code: 'timeout' });
    }
  });
  next();
});

// Request logging and general rate-limiting
app.use(requestLogger);
app.use('/admin-api', apiLimiter);

// env and redis imported at top of file

// Health check endpoint
app.get('/health', (req, res) => {
  const isRedisOk = redis && (redis.status === 'ready' || redis.status === 'connect');
  const isHealthy = !env.REDIS_REQUIRED || isRedisOk;

  res.status(isHealthy ? 200 : 503).json({
    ok: isHealthy,
    service: "jaheez-backend",
    architecture: "mvc",
    redis: isRedisOk ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

app.get('/admin-api/health', (req, res) => {
  const isRedisOk = redis && (redis.status === 'ready' || redis.status === 'connect');
  const isHealthy = !env.REDIS_REQUIRED || isRedisOk;

  res.status(isHealthy ? 200 : 503).json({
    ok: isHealthy,
    service: "jaheez-backend",
    architecture: "mvc",
    redis: isRedisOk ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

app.use('/admin-api', authRouter);
app.use('/admin-api', storeRouter);
app.use('/admin-api', checkoutRouter);
app.use('/admin-api', driverRouter);
app.use('/admin-api', customerRouter);
app.use('/admin-api', errandRouter);
app.use('/admin-api', adminRouter);
app.use('/admin-api', settingsRouter);
app.use('/admin-api', financeRouter);
app.use('/admin-api', supportRouter);
app.use('/admin-api', paymentsRouter);
app.use('/admin-api', commissionRouter);
app.use('/admin-api', reliabilityRouter);
app.use('/admin-api', riskRouter);


// Centralized error handler (must be registered last)
app.use(errorHandler);

export default app;
