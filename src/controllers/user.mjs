import Joi from 'joi';
import _ from 'lodash';
import shortid from 'shortid';

import errors from '../errors';
import * as userService from '../services/user';
import * as config from '../config';
import * as jwt from '../helpers/jwt';
/**
 * @swagger
 * parameters:
 *  user.account:
 *    name: account
 *    description: 用户账户，Joi.string().trim().min(4).max(32)
 *    type: string
 *    in: formData
 *  user.password:
 *    name: password
 *    description: 用户密码，Joi.string().trim().max(256)
 *    type: string
 *    in: formData
 *  user.email:
 *    name: email
 *    description: 用户邮箱，Joi.string().trim().email().max(64)
 *    type: string
 *    in: formData
 *  user.roles:
 *    name: roles
 *    description: 用户角色权限，Joi.array().items(Joi.string().valid(['admin', 'tester']))
 *    type: array
 *    items:
 *      type: string
 *    in: formData
 */

const schema = {
  account: () =>
    Joi.string()
      .trim()
      .min(4)
      .max(32),
  password: () =>
    Joi.string()
      .trim()
      .max(256),
  email: () =>
    Joi.string()
      .trim()
      .email()
      .max(64),
  roles: () => Joi.array().items(Joi.string().valid(['admin', 'tester'])),
};

/**
 * @swagger
 * definitions:
 *  UserInfo:
 *    required:
 *      - anonymous
 *      - date
 *    properties:
 *      anonymous:
 *        description: 是否匿名用户
 *        type: boolean
 *      date:
 *        description: 服务器时间，ISO Date String
 *        type: string
 *        example: 2017-12-18T12:52:23.651Z
 *      account:
 *        description: 用户账号
 *        type: string
 *      roles:
 *        description: 用户角色权限
 *        type: array
 *        items:
 *          type: string
 */
function pickUserInfo(userInfos, track) {
  const keys = 'account roles'.split(' ');
  let anonymous = true;
  if (userInfos && userInfos.account) {
    anonymous = false;
  }
  return _.extend(
    {
      anonymous,
      track,
    },
    _.pick(userInfos, keys),
  );
}

/**
 * @swagger
 * /users/me:
 *  post:
 *    description: 注册新账号。中间件：m.anonymous
 *    summary: 注册账号
 *    tags:
 *      - user
 *    consumes:
 *      - multipart/form-data
 *    parameters:
 *      - $ref: '#/parameters/user.account'
 *      - $ref: '#/parameters/user.password'
 *      - $ref: '#/parameters/user.email'
 *    responses:
 *      201:
 *        description: 注册成功
 *        schema:
 *          type: object
 *          $ref: '#/definitions/UserInfo'
 *
 */
export async function register(ctx) {
  const data = Joi.validate(ctx.request.body, {
    account: schema.account().required(),
    password: schema.password().required(),
    email: schema.email().required(),
  });
  const exists = await userService.exists({});
  // 第一个注册用户有su权限
  if (!exists) {
    data.roles = ['su'];
  }
  const doc = await userService.register(data);
  const track = ctx.cookies.get(config.trackCookie);
  const user = pickUserInfo(doc, track);
  ctx.status = 201;
  jwt.setXToken(ctx, user);
  ctx.body = user;
  userService.addLoginRecord({
    account: user.account,
    userAgent: ctx.get('User-Agent'),
    ip: ctx.ip,
    track,
  });
}

/**
 * @swagger
 * /users/me:
 *  delete:
 *    description: 退出用户当前登录态。中间件：m.login
 *    summary: 注销登录
 *    tags:
 *      - user
 *    responses:
 *      200:
 *        description: 注销登录态成功
 *        schema:
 *          type: object
 *          $ref: '#/definitions/UserInfo'
 */
export async function logout(ctx) {
  const track = ctx.cookies.get(config.trackCookie);
  const userInfo = pickUserInfo({}, track);
  jwt.setXToken(ctx, userInfo);
  ctx.body = userInfo;
}

/**
 * @swagger
 * /users/login:
 *  get:
 *    description: 获取登录加密使用的Token。中间件：m.anonymous
 *    summary: 获取登录Token
 *    tags:
 *      - user
 *    responses:
 *      200:
 *        description: 返回Token
 *        schema:
 *          type: object
 *          properties:
 *            token:
 *              type: string
 *              description: 随机生成的Token
 *              example: ryl3sFgBfz
 *  post:
 *    description: 用户登录。中间件：m.anonymous
 *    summary: 用户登录
 *    consumes:
 *      - multipart/form-data
 *    tags:
 *      - user
 *    parameters:
 *      - $ref: '#/parameters/user.account'
 *      - $ref: '#/parameters/user.password'
 *    responses:
 *      200:
 *        description: 登录成功，返回用户信息
 *        schema:
 *          type: object
 *          $ref: '#/definitions/UserInfo'
 */
export function loginToken(ctx) {
  const user = {
    token: shortid(),
  };
  jwt.setXToken(ctx, user);
  ctx.set('Cache-Control', 'no-store');
  // eslint-disable-next-line
  ctx.body = user;
}
export async function login(ctx) {
  const token = _.get(ctx.state, 'user.token');
  if (!token) {
    throw errors.get('user.tokenIsNull');
  }
  const {account, password} = Joi.validate(ctx.request.body, {
    account: schema.account().required(),
    password: schema.password().required(),
  });
  let user = null;
  try {
    user = await userService.login({
      account,
      password,
      token,
    });
  } catch (err) {
    throw err;
  }
  const track = ctx.cookies.get(config.trackCookie);
  const userInfo = pickUserInfo(user, track);
  jwt.setXToken(ctx, userInfo);
  ctx.body = userInfo;
  userService.addLoginRecord({
    account: user.account,
    userAgent: ctx.get('User-Agent'),
    ip: ctx.ip,
    track,
  });
}

/**
 * @swagger
 * /users/me:
 *  get:
 *    description: 获取用户信息。中间件：m.session
 *    summary: 获取用户信息
 *    tags:
 *      - user
 *    responses:
 *      200:
 *        description: 获取信息成功
 *        schema:
 *          type: object
 *          $ref: '#/definitions/UserInfo'
 *  patch:
 *    description: 刷新用户session，避免太久没有对session更新导致退出。中间件：m.session
 *    summary: 刷新用户session
 *    tags:
 *      - user
 *    responses:
 *      204:
 *        description: 刷新session成功
 */
export function me(ctx) {
  const {trackCookie} = config;
  if (!ctx.cookies.get(trackCookie)) {
    ctx.cookies.set(trackCookie, shortid(), {
      maxAge: 365 * 24 * 3600 * 1000,
      signed: true,
    });
  }
  const track = ctx.cookies.get(config.trackCookie);
  ctx.body = pickUserInfo(ctx.state.user || {}, track);
}

export function refresh(ctx) {
  ctx.session.updatedAt = new Date().toISOString();
  ctx.body = null;
}
