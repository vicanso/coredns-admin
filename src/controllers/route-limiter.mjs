import Joi from 'joi';

import routeLimiterService from '../services/route-limiter';

const schema = {
  name: () =>
    Joi.string()
      .trim()
      .min(2)
      .max(32),
  path: () =>
    Joi.string()
      .trim()
      .min(1)
      .max(128),
  method: () =>
    Joi.string()
      .trim()
      .uppercase()
      .min(1)
      .max(10),
  status: () => Joi.string().valid(['disabled', 'enabled']),
  date: () =>
    Joi.array()
      .length(2)
      .items(
        Joi.string()
          .trim()
          .max(32),
      ),
  time: () =>
    Joi.array()
      .length(2)
      .items(
        Joi.string()
          .trim()
          .max(16),
      ),
};

/**
 * @swagger
 * /sys/route-limits:
 *  get:
 *    description: 获取路由限制配置列表
 *    summary: 获取路由限制配置列表
 *    tags:
 *      - system
 *    responses:
 *      200:
 *        description: 获取成功时返回
 */
export async function list(ctx) {
  const docs = await routeLimiterService.find({});
  ctx.body = {
    routeLimits: docs,
  };
}

/**
 * 增加配置
 * @param ctx
 */
export async function add(ctx) {
  const data = await Joi.validate(ctx.request.body, {
    name: schema.name().required(),
    path: schema.path(),
    method: schema.method(),
    date: schema.date(),
    time: schema.time(),
    status: schema.status(),
  });
  data.creator = ctx.session.user.account;
  await routeLimiterService.add(data);
  ctx.status = 201;
}

/**
 * 删除配置
 * @param ctx
 */
export async function remove(ctx) {
  const id = Joi.attempt(ctx.params.id, Joi.objectId());
  // 默认service中不提供删除
  await routeLimiterService.Model.findByIdAndRemove(id);
  ctx.body = null;
}

/**
 * 更新配置
 * @param ctx
 */
export async function update(ctx) {
  const id = Joi.attempt(ctx.params.id, Joi.objectId());
  const data = await Joi.validate(ctx.request.body, {
    name: schema.name(),
    path: schema.path(),
    method: schema.method(),
    date: schema.date(),
    time: schema.time(),
    status: schema.status(),
  });
  await routeLimiterService.findByIdThenUpdate(id, data);
  ctx.body = null;
}
