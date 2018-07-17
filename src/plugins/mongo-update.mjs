/**
 * 记录mongodb更新操作的数据
 */

import _ from 'lodash';

import stringify from '../helpers/stringify';
import logger from '../helpers/logger';

const defaultIgnoreKeys = ['updatedAt'];
// TODO 是否增加findAndUpdate的处理
export default function update(schema, options = {}) {
  const ignoreKeys = options.ignoreKeys || defaultIgnoreKeys;
  const collection = options.collection || 'unknown';
  schema.post('init', function postInit(doc) {
    // 记录原始数据
    // eslint-disable-next-line
    this.__original = doc.toJSON();
  });

  schema.pre('save', function preSave(next) {
    // eslint-disable-next-line
    const originalData = this.__original;
    // 如果是新创建的数据，不记录
    if (this.isNew || !originalData) {
      return;
    }
    const modify = _.get(this, '$__.activePaths.states.modify');
    // eslint-disable-next-line
    const id = this._id.toString();
    const current = this.toJSON();
    const updated = {};
    const original = {};
    _.forEach(modify, (v, k) => {
      if (!v || _.includes(ignoreKeys, k)) {
        return;
      }
      updated[k] = current[k];
      original[k] = originalData[k];
    });
    logger.info(
      `mongo update log ${collection}-${id} is updated:${stringify(
        updated,
      )} original:${stringify(original)}`,
    );
    next();
  });
}
