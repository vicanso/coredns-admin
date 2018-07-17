import mongoose from 'mongoose';

import {isDevelopment} from '../helpers/utils';

const {Schema} = mongoose;

const {String} = Schema.Types;

const name = 'RouteLimiter';

const schema = {
  name: {
    type: String,
    unique: true,
  },
  // 路由路径
  path: {
    type: String,
    required: true,
  },
  // 路由method，可为空
  method: {
    type: String,
  },
  // 路由状态
  status: {
    type: String,
    default: 'disabled',
  },
  // 限制日期（表示在此日期内对功能限制，默认为禁止）
  date: {
    type: [String],
  },
  // 限制时间（如果只有一个时间，表示此时间前可用，如果两个，则表示此时间段可用）
  time: {
    type: [String],
  },
  creator: {
    type: String,
    required: true,
  },
};

export default function init() {
  const s = new Schema(schema, {
    timestamps: true,
    autoIndex: isDevelopment(),
  });
  return {
    name,
    schema: s,
  };
}
