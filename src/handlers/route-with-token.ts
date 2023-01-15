import { NextFunction, Request, Response } from 'express';

import { InternalServerError, UnauthorizedError } from '@/errors';
import { Env, Jwt } from '@/shared';

export const routeWithTokenHandler = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const { token } = request.context.jwt;
  if (!token?.trim()) {
    throw new InternalServerError({
      message: 'Token missing in the request.',
      sendToSlack: false,
    });
  }
  if (token === Env.get('API_KEY')) return next();
  if (token.split('.').length !== 3) {
    throw new InternalServerError({
      code: 'auth.invalid-format-token',
      message: 'Token does not have a valid format.',
      sendToSlack: false,
    });
  }
  try {
    request.context.jwt = (await Jwt.decode(token)) as any;
  } catch (e: any) {
    throw new UnauthorizedError({
      code: 'auth.invalid-token',
      message: 'Unable to validate your token, contact support.',
      sendToSlack: false,
      originalError: e,
    });
  }
  return next();
};
