import { Request, Response, NextFunction } from 'express';
import { Schema, ZodError } from 'zod';
import { BadRequestError } from './error.middleware';
import { logger } from '../config/logger';
import { rejectServerOwned } from '../validators/security';

// Maximum request body size for validation attempts (500 KB)
const MAX_VALIDATION_BODY_SIZE = 500 * 1024;

interface ValidationSchema {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}

/**
 * Validates request components (body, query, params) against Zod schemas.
 * Replaces request values with parsed/validated data (coercing types if required).
 * Security-enhanced: rejects server-owned fields in body before validation,
 * limits body size, and adds structured security logging.
 */
export function validate(schema: ValidationSchema | Schema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // ── Payload size guard ──
    const bodySize = req.headers['content-length']
      ? parseInt(req.headers['content-length'], 10)
      : 0;
    if (bodySize > MAX_VALIDATION_BODY_SIZE) {
      logger.warn({
        message: 'Validation rejected: body too large',
        url: req.originalUrl,
        method: req.method,
        bodySize,
        maxAllowed: MAX_VALIDATION_BODY_SIZE,
      });
      return next(new BadRequestError('Corps de la requete trop volumineux.', 'payload_too_large'));
    }

    try {
      // ── Server-owned field guard (mass assignment prevention) ──
      if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
        rejectServerOwned(req.body, 'body');
      }

      // ── Schema validation ──
      if ('safeParse' in schema) {
        // Direct Zod schema: validate body by default
        req.body = schema.parse(req.body);
      } else {
        if (schema.body) {
          req.body = schema.body.parse(req.body);
        }
        if (schema.query) {
          req.query = schema.query.parse(req.query);
        }
        if (schema.params) {
          req.params = schema.params.parse(req.params);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
        // Security log: structured, never leaks raw tokens/passwords
        logger.warn({
          message: 'Validation error',
          url: req.originalUrl,
          method: req.method,
          issues,
          ip: req.ip || req.socket?.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
        return next(new BadRequestError(`Echec de validation: ${issues.join(', ')}`, 'validation_failed'));
      }
      next(error);
    }
  };
}