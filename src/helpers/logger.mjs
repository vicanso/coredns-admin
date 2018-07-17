import winston from 'winston';
import dgram from 'dgram';
import _ from 'lodash';

import {isDevelopment} from '../helpers/utils';

import {logLevel, get} from '../config';

const {createLogger, format, transports, Transport} = winston;
const {combine, timestamp} = format;

const logConfig = get('log');

class UDPTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
    this.options = {
      prefix: Buffer.from(`${opts.prefix || ''}`),
      port: opts.port || 7349,
      host: opts.host || '127.0.0.1',
    };
    this.client = dgram.createSocket('udp4');
  }
  log(info, cb) {
    const {client, options} = this;
    const {prefix, port, host} = options;
    let message = info;
    if (_.isObject(info)) {
      message = JSON.stringify(info);
    }
    const buf = Buffer.concat([prefix, Buffer.from(message)]);
    setImmediate(() => {
      client.send(buf, 0, buf.length, port, host);
    });
    cb();
  }
}

const trans = [];
let customFormat = null;
if (isDevelopment()) {
  trans.push(new transports.Console());
  customFormat = combine(format.colorize(), format.simple());
} else {
  customFormat = combine(timestamp(), format.json());
}

// 设置UDP日志收集
if (logConfig.udp) {
  trans.push(new UDPTransport(logConfig.udp));
}

const logger = createLogger({
  level: logLevel,
  format: customFormat,
  transports: trans,
  levels: winston.config.syslog.levels,
});

export default logger;
