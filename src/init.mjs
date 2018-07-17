import bluebird from 'bluebird';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import {addReplacer} from './helpers/stringify';
import './helpers/joi-extend';
import './helpers/logger';

// 堆的全局的Promise对象
global.Promise = bluebird;

dayjs.extend(relativeTime);

// set stringify mask
addReplacer(key => {
  const reg = /password/gi;
  if (reg.test(key)) {
    return '***';
  }
  return null;
});
