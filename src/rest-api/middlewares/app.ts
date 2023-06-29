import { randomUUID } from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

import { ContainerName, Logger, PgPoolInterface, Translation } from '@/shared';
import { ContainerInterface } from '@/shared/container';

export const app =
  (container: ContainerInterface) =>
  (request: Request, response: Response, next: NextFunction) => {
    let language =
      request
        .acceptsLanguages()
        .map((language) => language.toLowerCase())
        .at(0) ?? '*';
    if (language === '*') language = 'pt-br';

    request.container = container.clone();

    const requestId = randomUUID();
    request.logger = Logger.withId(requestId);
    request.context = {
      jwt: {} as Request['context']['jwt'],
      awsTraceId: request.header('x-amzn-trace-id'),
      awsRequestId: request.header('x-amzn-requestid'),
      requestId,
    };

    request.translation = container
      .get<Translation>(ContainerName.TRANSLATION)
      .withLocale(language);

    request.container.set(ContainerName.LOGGER, request.logger);
    request.container.set(ContainerName.TRANSLATION, request.translation);
    request.container.set(ContainerName.REQUEST_ID, requestId);
    request.container.set(
      ContainerName.PG_POOL,
      request.container
        .get<PgPoolInterface>(ContainerName.PG_POOL)
        .withLoggerId(requestId),
    );

    response.setHeader('X-Request-Id', requestId);

    return next();
  };
