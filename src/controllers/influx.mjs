import Joi from 'joi';
import _ from 'lodash';

import influx from '../helpers/influx';
import errors from '../errors';
import commonSchema from '../helpers/common-schema';

const schema = {
  measurement: () => Joi.string().valid(['userTracker']),
  start: () =>
    Joi.string()
      .max(32)
      .default('-1d'),
  order: () =>
    Joi.string()
      .valid(['asc', 'desc'])
      .default('desc'),
  end: () => Joi.string().max(32),
  conditions: () => Joi.string().max(200),
};

// 获取series
export async function getSeries(ctx) {
  const measurement = Joi.attempt(ctx.params.measurement, schema.measurement());
  const client = influx.getClient();
  if (!client) {
    throw errors.get('common.influxNotInit');
  }
  const data = await client.showSeries(measurement);
  const tags = {};
  _.forEach(data, item => {
    const arr = item.split(',');
    arr.shift();
    _.forEach(arr, subItem => {
      const [key, value] = subItem.split('=');
      if (!tags[key]) {
        tags[key] = [];
      }
      tags[key].push(value);
    });
  });
  _.forEach(tags, (value, key) => {
    tags[key] = _.uniq(value).sort();
  });
  ctx.setCache('5m');
  ctx.body = tags;
}

// 查询measurement符合条件的数据
export async function list(ctx) {
  const measurement = Joi.attempt(ctx.params.measurement, schema.measurement());
  const {limit, start, end, offset, conditions, order} = Joi.validate(
    ctx.query,
    {
      limit: commonSchema.limit(),
      start: schema.start(),
      end: schema.end(),
      offset: commonSchema.offset(),
      conditions: schema.conditions(),
      order: schema.order(),
    },
  );
  const client = influx.getClient();
  if (!client) {
    throw errors.get('common.influxNotInit');
  }
  const ql = client.query(measurement);
  if (start) {
    ql.start = start;
  }
  if (end) {
    ql.end = end;
  }
  if (offset) {
    ql.offset = offset;
  }
  ql.order = order;
  if (conditions) {
    const conds = JSON.parse(conditions);
    _.forEach(conds, (v, k) => ql.condition(k, v));
  }
  const data = await ql.set({
    limit,
    format: 'json',
  });
  ctx.body = {
    trackers: data[measurement],
  };
}
