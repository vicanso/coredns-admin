import Joi from 'joi';
import _ from 'lodash';

import dnsService, {
  listSetting,
  removeDNSHost,
  listAvailableDNSHost,
  removeAvailableDNSHost,
} from '../services/dns';

const schema = {
  domain: () =>
    Joi.string()
      .trim()
      .max(100),
  ttl: () =>
    Joi.number()
      .integer()
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
  key: () => Joi.string().trim(),
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
  const doc = await dnsService.findById(id);
  if (!_.includes(doc.hosts, host)) {
    doc.hosts.push(host);
    await doc.save();
  }
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

/**
 * @swagger
 *  /available-dns
 *  get:
 *    description: 获取可用的dns配置
 */
export async function listAvailable(ctx) {
  ctx.body = await listAvailableDNSHost();
}

/**
 * @swagger
 *  /available-dns/:key
 *  delete:
 *    description: 删除可用的DNS配置
 */
export async function removeAvailable(ctx) {
  const {key} = Joi.validate(ctx.query, {
    key: schema.key().required(),
  });
  await removeAvailableDNSHost(key);
  ctx.body = null;
}
