import './init';

import mongo from './helpers/mongo';

import * as settingService from './services/setting';
import influx from './helpers/influx';
import dns from './helpers/dns';
import createServer from './helpers/server';
import * as globals from './helpers/globals';
import logger from './helpers/logger';
import './schedules';

function mongodbReady() {
  return new Promise(resolve => {
    mongo.once('connected', resolve);
  });
}


Promise.all([
  mongodbReady(),
  settingService.updateAppSettings(),
])
  .then(() => {
    const influxUrl = settingService.get('influx.url');
    if (influxUrl) {
      influx.init(influxUrl);
    }
    // 启用自定义DNS，如果没有自定义的需求，可以不使用
    dns();
    createServer();
    globals.start();
  })
  .catch(err => {
    logger.error(`the application isn't ready, ${err.message}`);
  });
