import mongoose from 'mongoose';

import {DNS} from './names';

const {Schema} = mongoose;

const schema = {
  // 域名
  domain: {
    type: String,
    required: true,
  },
  ttl: {
    type: Number,
    required: true,
  },
  // 检测条件
  check: {
    type: String,
    required: true,
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false,
  },
  // host配置
  hosts: [],
  creator: {
    type: String,
    required: true,
  },
};

export default function init() {
  const s = new Schema(schema, {
    timestamps: true,
  });
  s.index(
    {
      domain: 1,
    },
    {
      unique: true,
    },
  );
  return {
    name: DNS,
    schema: s,
  };
}
