import koaJwt from 'koa-jwt';
import jwt from 'jsonwebtoken';

import * as config from '../config';

const authToken = 'X-Auth-Token';
const secret = config.get('secret').join(',');

function genToken(data) {
  return jwt.sign(data, secret);
}

export function middleware() {
  return koaJwt({
    secret,
    passthrough: true,
  });
}

export function setXToken(ctx, data) {
  const token = genToken(data);
  return ctx.set(authToken, token);
}
