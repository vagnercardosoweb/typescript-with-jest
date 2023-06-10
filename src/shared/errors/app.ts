import { randomInt } from 'node:crypto';

import dottie from 'dottie';

import { HttpStatusCode } from '@/shared/enums';
import { Utils } from '@/shared/utils';

type Metadata = Record<string, any>;

export interface Options {
  code?: string;
  message?: string;
  description?: string;
  metadata?: Metadata;
  statusCode?: HttpStatusCode;
  sendToSlack?: boolean;
  originalError?: Error;
  logging?: boolean;
  requestId?: string;
  errorId?: string;
}

export class AppError extends Error {
  public code: string;
  public message: string;
  public description?: string;
  public metadata: Metadata = {};
  public statusCode: HttpStatusCode;
  public sendToSlack: boolean;
  public originalError?: Error;
  public logging: boolean;
  public requestId?: string;
  public errorId: string;

  constructor(options: Options = {}) {
    if (!options.code) options.code = 'DEFAULT';
    if (!options.statusCode) options.statusCode = HttpStatusCode.BAD_REQUEST;
    if (!options.errorId) options.errorId = AppError.generateErrorId();
    if (!options.message) {
      options.message = 'An error occurred, contact support';
    }

    if (Utils.isUndefined(options.logging)) options.logging = true;
    if (Utils.isUndefined(options.sendToSlack)) options.sendToSlack = true;

    super(options.message);
    this.name = AppError.mapperStatusCodeToName(options.statusCode);

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);

    const { originalError, ...rest } = options;
    Object.entries(rest).forEach(([k, v]) => this.setProperty(k, v));

    if (originalError) {
      this.setProperty('originalError', {
        name: originalError.name,
        message: originalError.message,
        stack: originalError.stack,
      });
    }

    this.setProperty('stack', this.stack);

    this.setProperty(
      'message',
      this.replaceMessage({
        ...options.metadata,
        errorId: this.errorId,
        requestId: this.requestId,
        code: this.code,
      }),
    );
  }

  public static generateErrorId(): string {
    return `V${randomInt(1_000_000_000, 9_999_999_999).toString()}C`;
  }

  public static mapperStatusCodeToName(statusCode: number): string {
    const names: Record<number, string> = {
      [HttpStatusCode.CONFLICT]: 'ConflictError',
      [HttpStatusCode.BAD_REQUEST]: 'BadRequestError',
      [HttpStatusCode.FORBIDDEN]: 'ForbiddenError',
      [HttpStatusCode.INTERNAL_SERVER_ERROR]: 'InternalServerError',
      [HttpStatusCode.METHOD_NOT_ALLOWED]: 'MethodNotAllowedError',
      [HttpStatusCode.NOT_ACCEPTABLE]: 'NotAcceptableError',
      [HttpStatusCode.NOT_FOUND]: 'NotFoundError',
      [HttpStatusCode.MANY_REQUEST]: 'RateLimiterError',
      [HttpStatusCode.SERVICE_UNAVAILABLE]: 'ServiceUnavailableError',
      [HttpStatusCode.UNAUTHORIZED]: 'UnauthorizedError',
    };
    if (names?.[statusCode]) return names[statusCode];
    return 'AppError';
  }

  private replaceMessage(metadata: Metadata): string {
    let message = this.message;
    const replaces = dottie.flatten(metadata);
    for (const key in replaces) {
      message = message.replace(`{{${key}}}`, replaces[key]);
    }
    return message;
  }

  private setProperty(key: string, value: any) {
    if (value === undefined) return;
    Object.defineProperty(this, key, {
      writable: true,
      enumerable: true,
      configurable: true,
      value,
    });
  }
}
