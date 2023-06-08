import { HttpStatusCode } from '@/enums';

import { AppError, Options as AppOptions } from './app';

interface Options extends Omit<AppOptions, 'message'> {
  path: string;
  method: string;
  message?: string;
}

export class PageNotFoundError extends AppError {
  constructor({ path, method, ...options }: Options) {
    super({
      code: 'PAGE_NOT_FOUND',
      metadata: {
        path,
        method,
      },
      statusCode: HttpStatusCode.NOT_FOUND,
      message: 'errors.page_not_found',
      sendToSlack: false,
      logging: false,
      ...options,
    });

    this.name = 'PageNotFoundError';
  }
}
