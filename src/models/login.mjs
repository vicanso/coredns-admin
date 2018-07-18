import mongoose from 'mongoose';

import {Login} from './names';

const {Schema} = mongoose;

const schema = {
  // 账号
  account: {
    type: String,
    required: true,
  },
  // 记录用户当时的user-agent
  userAgent: {
    type: String,
    required: true,
  },
  // ip地址
  ip: {
    type: String,
    required: true,
  },
  // track，跟踪用户的浏览器
  track: String,
  // 根据ip获取到的国家
  country: String,
  // 根据ip获取到的省份
  region: String,
  // 根据ip获取到的城市
  city: String,
  // 网络运营商
  isp: String,
};

export default function init() {
  const s = new Schema(schema, {
    timestamps: true,
  });
  s.index(
    {
      account: 1,
    },
    {
      background: true,
    },
  );
  s.index(
    {
      createdAt: 1,
    },
    {
      background: true,
    },
  );
  s.index(
    {
      account: 1,
      createdAt: 1,
    },
    {
      background: true,
    },
  );
  return {
    name: Login,
    schema: s,
  };
}
