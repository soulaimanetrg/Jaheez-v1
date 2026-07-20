import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../config/logger';

/**
 * Express middleware to log structured HTTP requests and track latency.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;

  // Track the original send method to capture response details
  const originalSend = res.send;
  res.send = function (this: Response, body?: any): Response {
    const latencyMs = Date.now() - start;
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
      .toString()
      .split(',')[0]
      .trim();

    const userId = req.admin?.id || req.driver?.user_id || req.supabaseUser?.id || 'anonymous';

    logger.info({
      message: `HTTP ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${latencyMs}ms)`,
      request_id: requestId,
      user_id: userId,
      route: req.originalUrl || req.url,
      method: req.method,
      ip,
      latency_ms: latencyMs,
      status_code: res.statusCode,
    });

    return originalSend.call(this, body);
  };

  next();
}
