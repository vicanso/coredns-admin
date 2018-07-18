import _ from 'lodash';
import bluebird from 'bluebird';
import request from 'superagent';
import net from 'net';

import genService from './gen';
import {DNS} from '../models/names';
import * as settingService from './setting';
import errors from '../errors';

const dnsService = genService(DNS);

let dnsStatusDict = {};

export default dnsService;

export async function listSetting() {
  const docs = await dnsService.find({});
  return _.map(docs, (doc) => {
    const item = doc.toObject();
    const {
      hosts,
      domain,
    } = item;
    // eslint-disable-next-line
    item.hosts = _.map(hosts, (host) => {
      const status = _.get(dnsStatusDict, `${domain}.${host}`, false);
      return {
        host,
        status,
      };
    });
    return item;
  });
}

// http检测
async function httpCheck(url, domain) {
  let successCount = 0;
  const check = async function check() {
    try {
      // 有些反向代理依赖于Host做转发
      const res = await request.get(url)
        .timeout(3000)
        .set('Host', domain);
      const {status} = res;
      if (status >= 200 || status < 400) {
        successCount += 1;
      }
    } catch (err) {
      console.error(`check ${url} fail, ${err.message}`);
    }
  };
  const fns = [];
  for (let index = 0; index < 5; index += 1) {
    fns.push(check());
  }
  await Promise.all(fns);
  // 超过3次成功则认为可用
  if (successCount > 3) {
    return true;
  }
  return false;
}

// tcp检测
async function tcpCheck(url) {
  const urlInfo = new URL(url);
  const {port, hostname} = urlInfo;
  let successCount = 0;
  const check = async function check() {
    return new Promise(resolve => {
      const c = new net.Socket();
      c.unref();
      const cleanup = () => {
        c.removeAllListeners('connect');
        c.removeAllListeners('error');
        c.end();
        c.destroy();
        resolve();
      };
      c.once('connect', () => {
        successCount += 1;
        cleanup();
      });
      c.once('error', err => {
        console.error(`check ${url} fail, ${err.message}`);
        cleanup();
      });
      c.once('timeout', () => {
        console.error(`check ${url} fail, timeout`);
        cleanup();
      });
      c.connect({
        port,
        host: hostname,
      });
      c.setTimeout(3000);
    });
  };
  const fns = [];
  for (let index = 0; index < 5; index += 1) {
    fns.push(check());
  }
  await Promise.all(fns);
  // 超过3次成功则认为可用
  if (successCount > 3) {
    return true;
  }
  return false;
}

async function refreshHost(options) {
  const {domain, host, check, ttl} = options;
  let success = false;
  // TCP检测
  if (check.indexOf('tcp://') === 0) {
    success = tcpCheck(check);
  } else {
    success = httpCheck(check, domain);
  }
  const coredns = settingService.get('coredns');
  if (!coredns || !coredns.url) {
    throw errors.get('common.corednsNotSet');
  }
  const domainArr = domain.split('.').reverse();
  const url = `${coredns.url}/${domainArr.join('/')}/dns/apex/${host.replace(
    /\./g,
    '-',
  )}`;
  try {
    if (success) {
      // 如果是成功的，则添加记录
      await request.put(url).send({
        host,
        ttl,
      });
    } else {
      // 失败的则删除记录
      await request.del(url);
    }
  } catch (err) {
    console.error(`update dns config fail, ${err.message}`);
  }
  return success;
}

/**
 * 刷新coredns中DNS解析配置
 */
export async function refresh() {
  const docs = await dnsService
    .find({
      disabled: {
        $ne: true,
      },
    })
    .lean();
  const checkList = [];
  _.forEach(docs, item => {
    const {domain, check, hosts, ttl} = item;
    _.forEach(hosts, host => {
      checkList.push({
        ttl,
        domain,
        host,
        // eslint-disable-next-line
        check: check.replace('${domain}', host),
      });
    });
  });
  const dict = {}
  console.dir(checkList);
  await bluebird.map(checkList, (options) => {
    const {
      domain,
      host,
    } = options;
    if (!dict[domain]) {
      dict[domain] = {};
    }
    return refreshHost(options).then((status) => {
      dict[domain][host] = status;
    });
  }, {
    concurrency: 5,
  });
  dnsStatusDict = dict;
}
