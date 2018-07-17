import _ from 'lodash';
import bluebird from 'bluebird';
import mongoose from 'mongoose';
import stats from 'mongoose-stats';
import save4update from 'mongoose-save4update';

import * as config from '../config';
import models from '../models';
import influx from '../helpers/influx';
import stringify from '../helpers/stringify';
import logger from '../helpers/logger';

mongoose.Promise = bluebird;

/**
 * 初始化models，读取所有配置的model，初始化。
 * 并增加公共的统计hook函数
 * @param  {MongooseClient} conn   mongoose实例化的client
 */
function initModels(conn) {
  _.forEach(models, fn => {
    const {schema, name} = fn();
    schema.plugin(stats, {
      collection: name,
    });
    schema.plugin(save4update, {
      collection: name,
    });
    schema.set('toObject', {
      getters: true,
    });
    schema.set('toJSON', {
      getters: true,
    });
    schema.on('save4update', (data, doc) => {
      // eslint-disable-next-line
      const id = doc._id;
      logger.info(`mongo save for update:${id}-${stringify(data)}`);
    });
    schema.on('stats', data => {
      logger.debug(`mongodb stats:${stringify(data)}`);
      const keys = ['collection', 'op'];
      const spdy = _.sortedIndex([100, 300, 1000, 3000], data.use);
      const fields = _.omit(data, keys);
      _.forEach(fields, (v, k) => {
        if (_.isObject(v)) {
          fields[k] = stringify(v);
        }
      });
      influx.write(
        'mongo',
        fields,
        _.extend(
          {
            spdy,
          },
          _.pick(data, keys),
        ),
      );
    });
    conn.model(name, schema);
  });
}

/**
 * 根据mongodb连接串初始化Mongoose Connection
 * @param  {String} uri     mongodb连接串：mongodb://user:pass@localhost:port/database
 * @return {Connection}  Mongoose Connection
 */
function initClient(uri) {
  /* istanbul ignore if */
  if (!uri) {
    return null;
  }
  const client = mongoose.createConnection(uri);
  const maskUri = uri.replace(/\/\/\S+:\S+@/, '//***:***@');
  client.on('connected', () => {
    logger.info(`${maskUri} connected`);
  });
  client.on('disconnected', () => {
    /* istanbul ignore next */
    logger.alert(`${maskUri} disconnected`);
  });
  client.on(
    'reconnected',
    _.debounce(() => {
      /* istanbul ignore next */
      logger.info(`${maskUri} reconnected`);
    }, 3000),
  );
  client.on('connecting', () => {
    /* istanbul ignore next */
    logger.info(`${maskUri} connecting`);
  });
  client.on('error', err => logger.alert(`${maskUri} error, %s`, err));
  initModels(client);
  return client;
}

const client = initClient(config.mongoUri);

export default client;

/**
 * 获取mongodb model
 * @param  {String} name collection的名称
 * @return {Model} mongoose model
 */
export function get(name) {
  return client.model(name);
}
