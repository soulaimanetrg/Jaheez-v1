export abstract class HttpError extends Error {
  abstract statusCode: number;
  errorCode?: string;

  constructor(message: string, errorCode?: string) {
    super(message);
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends HttpError {
  statusCode = 400;
}

export class UnauthorizedError extends HttpError {
  statusCode = 401;
}

export class ForbiddenError extends HttpError {
  statusCode = 403;
}

export class NotFoundError extends HttpError {
  statusCode = 404;
}

export class ConflictError extends HttpError {
  statusCode = 409;
}

export class InternalServerError extends HttpError {
  statusCode = 500;
}

export class DatabaseError extends HttpError {
  statusCode = 500;
}

export class GoneError extends HttpError {
  statusCode = 410;
}

export class TooManyRequestsError extends HttpError {
  statusCode = 429;
}
