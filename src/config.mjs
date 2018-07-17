import shortid from 'shortid';
import config from 'config';

import pkg from '../package';
import expose from './expose';

export const port = Number.parseInt(process.env.PORT, 10) || config.get('port');

export const env = process.env.NODE_ENV || 'development';

// eslint-disable-next-line
export const version = pkg.version;

export const app = pkg.name;

// eslint-disable-next-line
export const httpLogFormat = config.get('log.http');

export const logLevel = process.env.LOG_LEVEL || config.get('log.level');

export const trackCookie = 'jt';

export const appUrlPrefix = process.env.APP_PREFIX || config.get('appPrefix');

export const ins = shortid();

// logger setting "console", "udp://127.0.0.1:5001"
export const logger = process.env.LOG;

// mongodb connection uri
export const mongoUri = process.env.MONGO || config.get('mongo');

// redis connection uri
export const redisUri = process.env.REDIS || config.get('redis');

export const appPath = expose.dirname;

// cookie name
export const session = {
  key: pkg.name,
  maxAge: 1 * 24 * 3600 * 1000,
};

// http connection limit options
export const connectLimitOptions = {
  mid: 500,
  high: 1000,
  interval: 5000,
};

// get the config
export function get(key) {
  return config.get(key);
}
