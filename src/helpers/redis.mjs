import Redis from 'ioredis';
import _ from 'lodash';
import url from 'url';
import querystring from 'querystring';

import * as config from '../config';
import logger from '../helpers/logger';

// 获取redis client
function getRedisClient(uri) {
  if (uri.indexOf('sentinels://') !== 0) {
    return new Redis(uri, {
      keyPrefix: `${config.app}:`,
    });
  }
  const options = {};
  const pwdReg = /sentinels:\/\/:(\S+)@/;
  const result = pwdReg.exec(uri);
  const password = _.get(result, '[1]');
  if (password) {
    options.password = password;
  }
  const hostsReg = /sentinels:\/\/(:\S+@)?(\S+)/;
  const hostRegResult = hostsReg.exec(uri);
  const hosts = _.get(hostRegResult, '[2]');
  if (hosts) {
    options.sentinels = _.map(hosts.split(','), item => {
      const urlInfo = url.parse(`http://${item}`);
      const opt = {
        host: urlInfo.hostname,
      };
      if (urlInfo.port) {
        opt.port = Number.parseInt(urlInfo.port, 10);
      }
      return opt;
    });
  }
  const info = url.parse(uri);
  if (info.query) {
    _.extend(options, querystring.parse(info.query));
  }
  return new Redis(options);
}

const client = getRedisClient(config.redisUri);

const delayLog = _.throttle((message, type) => {
  const maskUri = config.redisUri.replace(/:\S+@/, '//:***@');
  if (type === 'error') {
    logger.alert(`${maskUri} error, ${message})`);
  } else {
    logger.info(`${maskUri} ${message}`);
  }
}, 3000);

client.on('error', err => delayLog(err.message, 'error'));

// 延时输出日志，避免一直断开连接时大量无用日志
client.on('connect', () => delayLog('connected'));

class SessionStore {
  constructor(redisClient) {
    this.redisClient = redisClient;
  }
  async get(key) {
    const data = await this.redisClient.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  }
  async set(key, json, maxAge) {
    await this.redisClient.psetex(key, maxAge, JSON.stringify(json));
  }
  async destroy(key) {
    await this.redisClient.del(key);
  }
}

export default client;

export const sessionStore = new SessionStore(client);
