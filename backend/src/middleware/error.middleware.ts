import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

import { HttpError } from '../utils/errors';

export {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  DatabaseError,
  GoneError,
} from '../utils/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const reqId = req.headers['x-request-id'] || 'N/A';

  const isHttpError = err instanceof HttpError || (err && 'statusCode' in err && typeof (err as any).statusCode === 'number');

  if (isHttpError) {
    const status = (err as any).statusCode || 500;
    const code = (err as any).errorCode;
    logger.warn({
      message: err.message,
      reqId,
      code,
      status,
      url: req.originalUrl,
      method: req.method,
    });
    return res.status(status).json({
      error: err.message,
      error_code: code,
    });
  }

  // Log unhandled exceptions with error level
  logger.error({
    message: err.message,
    stack: err.stack,
    reqId,
    url: req.originalUrl,
    method: req.method,
  });

  return res.status(500).json({
    error: 'Une erreur interne est survenue sur le serveur.',
    error_code: 'internal_error',
  });
}
