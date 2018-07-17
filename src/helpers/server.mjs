import Koa from 'koa';
import _ from 'lodash';
import bodyparser from 'koa-bodyparser';
import etag from 'koa-etag';
import koaLog from 'koa-log';
import methodoverride from 'koa-methodoverride';
import restVersion from 'koa-rest-version';
import shortid from 'shortid';
import Timing from 'supertiming';
import helmet from 'koa-helmet';

import * as config from '../config';
import middlewares from '../middlewares';
import router from '../router';
import {isDevelopment} from '../helpers/utils';
import logger from '../helpers/logger';

export default function createServer() {
  const app = new Koa();
  // trust proxy
  app.proxy = true;
  app.keys = config.get('cookieSigKeys');

  middlewares.session.init(app);

  app.use(helmet());
  // 初始化请求的相关参数
  app.use((ctx, next) => {
    const id = ctx.get('X-Request-Id') || shortid();
    const lang = ctx.query.lang || 'en';
    const timing = new Timing();
    const trackId = ctx.cookies.get(config.trackCookie);
    delete ctx.query.lang;
    ctx.state.timing = timing;
    ctx.state.lang = lang;
    ctx.state.id = id;
    ctx.state.trackId = trackId;
    ctx.set('X-Response-Id', id);
    return next();
  });

  app.use(middlewares.error());

  app.use(middlewares.responseLogger(2));

  app.use(
    middlewares.entry(`${config.version} ${config.app}`, config.appUrlPrefix),
  );

  app.use(
    middlewares.timeout({
      timeout: 3000,
      // 如果query中设置了disableTimeout，则跳过timeout处理
      pass: ctx => _.has(ctx.query, 'disableTimeout'),
    }),
  );

  app.use(middlewares.ping('/ping'));

  // http log
  /* istanbul ignore if */
  if (isDevelopment()) {
    // app.use(koaLog('dev'));
  } else {
    /* istanbul ignore next */
    koaLog.morgan.token('request-id', ctx => ctx.get('X-Request-Id') || '-');
    koaLog.morgan.token('account', ctx => ctx.state.account || 'anonymous');
    app.use(koaLog(config.httpLogFormat));
  }
  app.use(middlewares.admin(config.get('adminPath')));

  // http stats
  app.use(middlewares.httpStats());

  // http connection limit
  const limitOptions = config.connectLimitOptions;
  app.use(
    middlewares.limit.connection(
      _.omit(limitOptions, 'interval'),
      limitOptions.interval,
    ),
  );

  app.use(methodoverride());
  app.use(bodyparser());

  // 对版本号的处理
  app.use(
    restVersion({
      override: true,
    }),
  );

  app.use(middlewares.common.fresh());
  app.use(etag());
  app.use(middlewares.mock());

  app.use(router.routes());

  app.on('error', _.noop);

  const {port} = config;
  const server = app.listen(port, err => {
    /* istanbul ignore if */
    if (err) {
      logger.error(
        `server listen on http://127.0.0.1:${port}/ fail, err:${err.message}`,
      );
    } else {
      logger.info(`server listen on http://127.0.0.1:${port}/`);
    }
  });
  return server;
}
