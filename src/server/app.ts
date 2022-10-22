import cookieParser from 'cookie-parser';
import express, { RequestHandler } from 'express';
import 'express-async-errors';
import fs from 'fs/promises';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';

import configRoutes from '@/config/routes';
import { HttpMethod, NodeEnv } from '@/enums';
import {
  checkAccessByRouteHandler,
  corsHandler,
  errorHandler,
  extractTokenHandler,
  isAuthenticatedHandler,
  requestUuidHandler,
  methodOverrideHandler,
  notFoundHandler,
  routeWithTokenHandler,
} from '@/handlers';
import { Env, Logger } from '@/shared';

export class App {
  protected app: express.Application;
  protected server: http.Server;
  protected port: number;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = Env.get('PORT', 3333);

    this.app.set('trust proxy', true);
    this.app.set('x-powered-by', false);
    this.app.set('strict routing', true);
  }

  public registerHandlers(): void {
    this.app.use(express.json() as RequestHandler);
    this.app.use(express.urlencoded({ extended: true }) as RequestHandler);
    this.app.use(cookieParser(Env.required('APP_KEY')));
    if (Env.required('NODE_ENV') !== NodeEnv.TEST) {
      this.app.use(helmet() as RequestHandler);
      this.app.use(morgan('combined'));
      this.app.use(corsHandler);
      this.app.use(methodOverrideHandler);
      this.app.use(requestUuidHandler);
    }
    this.app.use(extractTokenHandler);
  }

  public registerErrorHandling() {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async registerRoutes() {
    const directory = `${__dirname}/../modules`;
    const modules = await fs.opendir(directory);
    for await (const dir of modules) {
      if (!dir.isDirectory()) continue;
      const routePath = `${directory}/${dir.name}/routes.ts`;
      try {
        if (!(await fs.stat(routePath))) continue;
        configRoutes.push(...(await import(routePath)).default);
      } catch (e: any) {
        Logger.warn(`error dynamic route`, { stack: e.stack });
      }
    }
    for await (const route of configRoutes) {
      route.method = route.method ?? HttpMethod.GET;
      route.handlers = route.handlers ?? [];
      route.public = route.public ?? false;
      const handlers: RequestHandler[] = [];
      if (!route.public) handlers.push(routeWithTokenHandler);
      if (route.authType) {
        handlers.push(isAuthenticatedHandler(route.authType));
        handlers.push(checkAccessByRouteHandler);
      }
      (<any>this.app)[route.method.toLowerCase()](
        route.path,
        ...handlers,
        ...route.handlers,
        route.handler,
      );
    }
  }

  public async createServer(): Promise<http.Server> {
    return new Promise((resolve, reject) => {
      this.server = this.server.listen(this.port);
      this.server.on('error', reject);
      this.server.on('listening', async () => {
        this.registerHandlers();
        await this.registerRoutes();
        this.registerErrorHandling();
        resolve(this.server);
      });
    });
  }

  public async closeServer(): Promise<void> {
    if (!this.server.listening) return;
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) reject(error);
        resolve();
      });
    });
  }

  public getPort(): number {
    return this.port;
  }

  public getServer(): http.Server {
    return this.server;
  }

  public getApp(): express.Application {
    return this.app;
  }
}
