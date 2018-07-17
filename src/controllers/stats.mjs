import _ from 'lodash';
import stringify from '../helpers/stringify';
import logger from '../helpers/logger';

/**
 * @swagger
 * /stats/requests:
 *  post:
 *    description: 提交接口请求相关系统
 *    responses:
 *      201:
 *        description: 记录成功
 */
export function add(ctx) {
  _.forEach(ctx.request.body, item => {
    logger.info(`browser-ajax ${stringify(item)}`);
  });
  ctx.status = 201;
}

/**
 * @swagger
 * /stats/exceptions:
 *  post:
 *    description: 提交出错信息统计
 *    responses:
 *      201:
 *        description: 记录成功
 */
export function exception(ctx) {
  _.forEach(ctx.request.body, item => {
    logger.error(`browser-exception ${stringify(item)}`);
  });
  ctx.status = 201;
}

/**
 * @swagger
 * /stats/routes:
 *  post:
 *    description: 提交route统计信息
 *    responses:
 *      201:
 *        description: 记录成功
 */
export function route(ctx) {
  _.forEach(ctx.request.body, item => {
    logger.info(`route ${stringify(item)}`);
  });
  ctx.status = 201;
}
