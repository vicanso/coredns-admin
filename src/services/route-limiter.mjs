import _ from 'lodash';

import genService from './gen';
import {RouteLimiter} from '../models/names';

const routeLimiterService = genService(RouteLimiter);

const {find} = routeLimiterService;

export default routeLimiterService;

let routeLimitSettings = null;

/**
 * 更新route limiter的配置信息
 */
export async function updateRouteLimiter() {
  const docs = await find({}).lean();
  routeLimitSettings = docs;
}

/**
 * getMatched
 * @param routePath 路由
 * @param routeMethod
 */
export function getMatched(routePath, routeMethod) {
  return _.find(routeLimitSettings, item => {
    const {path, method} = item;
    if (routePath !== path) {
      return false;
    }
    if (method && method !== routeMethod) {
      return false;
    }
    return true;
  });
}
