import mongoose from 'mongoose';

import {Mock} from './names';

const {Schema} = mongoose;

const {Mixed} = Schema.Types;

const schema = {
  account: String,
  track: String,
  url: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    default: 500,
  },
  response: Mixed,
  description: String,
  creator: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
};

export default function init() {
  const s = new Schema(schema, {
    timestamps: true,
  });
  s.index(
    {
      url: 1,
      account: 1,
      track: 1,
    },
    {
      background: true,
      unique: true,
    },
  );
  return {
    name: Mock,
    schema: s,
  };
}
