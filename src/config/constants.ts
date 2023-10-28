import os from 'node:os';
import process from 'node:process';

export const PID = process.pid;
export const HOSTNAME = os.hostname();

export const REDACTED_KEYS = (process.env.REDACTED_KEYS || '').split(',');
export const REDACTED_TEXT = process.env.REDACTED_TEXT || '[Redacted]';

export const RATE_LIMITER_LIMIT = Number(
  process.env.RATE_LIMITER_LIMIT || '50',
);

export const RATE_LIMITER_SKIP_SUCCESS =
  process.env.RATE_LIMITER_SKIP_SUCCESS === 'true';

export const RATE_LIMITER_EXPIRES_SECONDS = Number(
  process.env.RATE_LIMITER_EXPIRES_SECONDS || '60',
);
