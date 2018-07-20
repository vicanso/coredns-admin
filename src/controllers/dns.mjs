import Joi from 'joi';

import dnsService, {listSetting, removeDNSHost} from '../services/dns';

const schema = {
  domain: () =>
    Joi.string()
      .trim()
      .max(100),
  ttl: () =>
    Joi.number()
      .integer()
      .default(60)
      .min(1)
      .max(600),
  check: () =>
    Joi.string()
      .trim()
      .max(200),
  host: () =>
    Joi.string()
      .trim()
      .ip(),
  disabled: () => Joi.boolean().default(false),
};

/**
 * @swagger
 * /dns
 *  post:
 *    description: 创建新的DNS配置。中间件：m.admin
 *    summary: 创建新的DNS配置
 *    tags:
 *      - dns
 */
export async function add(ctx) {
  const data = Joi.validate(ctx.request.body, {
    domain: schema.domain().required(),
    ttl: schema.ttl(),
    check: schema.check().required(),
    disabled: schema.disabled(),
  });
  data.creator = ctx.session.user.account;
  await dnsService.add(data);
  ctx.status = 201;
}

/**
 * @swagger
 *  /dns/:id
 *    patch:
 *      description: 更新DNS配置，中间件：m.admin
 */
export async function update(ctx) {
  const data = Joi.validate(ctx.request.body, {
    domain: schema.domain(),
    ttl: schema.ttl(),
    check: schema.check(),
    disabled: schema.disabled(),
  });
  const id = Joi.attempt(ctx.params.id, Joi.objectId());
  await dnsService.findByIdThenUpdate(id, data);
  ctx.body = null;
}

/**
 * @swagger
 * /dns
 *  get:
 *    description: 获取所有DNS配置。
 */
export async function list(ctx) {
  const data = await listSetting();
  ctx.body = {
    dns: data,
  };
}

/**
 * @swagger
 *  /dns/:id/hosts
 *  post:
 *    description: 添加host配置。中间件：m.admin
 */
export async function addHost(ctx) {
  const id = Joi.attempt(ctx.params.id, Joi.objectId());
  const {host} = Joi.validate(ctx.request.body, {
    host: schema.host().required(),
  });
  await dnsService.findByIdAndUpdate(id, {
    $addToSet: {
      hosts: host,
    },
  });
  ctx.status = 201;
}

/**
 * @swagger
 *  /dns/:id/hosts
 *  delete:
 *    description: 删除host配置。中间件：m.admin
 */
export async function removeHost(ctx) {
  const id = Joi.attempt(ctx.params.id, Joi.objectId());
  const host = Joi.attempt(ctx.params.host, schema.host());
  await removeDNSHost(id, host);
  ctx.body = null;
}
