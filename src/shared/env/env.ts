import { InternalServerError, NodeEnv, Utils } from '@/shared';

export class Env {
  public static get(key: string, defaultValue?: any) {
    const value = process.env[key] || defaultValue;
    return Utils.normalizeValue(value);
  }

  public static has(key: string): boolean {
    return !!process.env[key];
  }

  public static set(key: string, value: any, override = true) {
    if (!override && process.env?.[key]?.trim()) return;
    process.env[key] = Utils.normalizeValue(value);
  }

  public static required(key: string, defaultValue?: any) {
    const value = this.get(key, defaultValue);
    if (!value) {
      throw new InternalServerError({
        message: 'Missing environment variable: {{key}}',
        metadata: { key },
      });
    }
    return value;
  }

  public static isLocal(): boolean {
    return Env.get('NODE_ENV') === NodeEnv.LOCAL || Env.get('IS_LOCAL', false);
  }

  public static isProduction(): boolean {
    return Env.get('NODE_ENV') === NodeEnv.PRODUCTION;
  }

  public static isStaging(): boolean {
    return Env.get('NODE_ENV') === NodeEnv.STAGING;
  }

  public static isTesting(): boolean {
    return Env.get('NODE_ENV') === NodeEnv.TEST;
  }
}
