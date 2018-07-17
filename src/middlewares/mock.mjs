/**
 * 此模块主要用于测试中自定义接口数据
 */

import _ from 'lodash';

import mockService from '../services/mock';

import * as config from '../config';
import {getSession} from '../services/cache';

let isStartUpdate = false;
let mockDict = {};

/**
 * 更新mock数据
 *
 */
async function updateMock() {
  const docs = await mockService.find({
    disabled: {
      $ne: true,
    },
  });
  const result = {};
  _.forEach(docs, item => {
    const {url} = item;
    if (!result[url]) {
      result[url] = [];
    }
    result[url].push(item);
  });
  _.forEach(result, (items, url) => {
    result[url] = _.sortBy(items, item => {
      if (item.track) {
        return 1;
      }
      if (item.account) {
        return 2;
      }
      return 4;
    });
  });
  mockDict = result;
}

export default function getMockMiddleware() {
  // 如果已启动了定时更新的任务，则不需要再启动
  if (!isStartUpdate) {
    setInterval(updateMock, 10 * 1000).unref();
    updateMock();
    isStartUpdate = true;
  }
  return async function mockMiddleware(ctx, next) {
    const mocks = mockDict[ctx.url];
    if (!mocks) {
      return next();
    }
    const key = ctx.cookies.get(config.session.key);
    const userInfo = await getSession(key);
    const currentAccount = _.get(userInfo, 'user.account');
    const trackValue = ctx.cookies.get(config.trackCookie);
    const mock = _.find(mocks, item => {
      const {track, account} = item;
      if (track) {
        return track === trackValue;
      }
      if (account) {
        return account === currentAccount;
      }
      return true;
    });
    if (!mock) {
      return next();
    }

    // 返回配置的mock信息
    ctx.status = mock.status || 500;
    ctx.body = mock.response;
    return Promise.resolve();
  };
}
