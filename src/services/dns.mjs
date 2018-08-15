import _ from 'lodash';
import bluebird from 'bluebird';
import request from 'superagent';
import net from 'net';
import etcd from 'etcd3';

import genService from './gen';
import {DNS} from '../models/names';
import * as config from '../config';

const dnsService = genService(DNS);
const defaultTimeout = 3000;
const client = new etcd.Etcd3({
  hosts: config.get('coredns.etcd').split(','),
});
const ns = client.namespace(config.get('coredns.path') || '');

let dnsStatusDict = {};

// 未知状态（写入etcd失败，导致状态无法确认）
const STATUS_UNKNOWN = 0;
// 成功（该IP可用）
const STATUS_SUCCESS = 1;
// 失败（该IP不可用）
const STATUS_FAIL = 2;

export default dnsService;

function convertDotString(host) {
  return host.replace(/\./g, '-');
}

export async function listSetting() {
  const docs = await dnsService.find({});
  return _.map(docs, doc => {
    const item = doc.toObject();
    const {hosts, domain} = item;
    const d = convertDotString(domain);
    // eslint-disable-next-line
    item.hosts = _.map(hosts, host => {
      const status = _.get(dnsStatusDict, `${d}.${convertDotString(host)}`, 0);
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
      const res = await request
        .get(url)
        .timeout(defaultTimeout)
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
      c.setTimeout(defaultTimeout);
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
    success = await tcpCheck(check);
  } else {
    success = await httpCheck(check, domain);
  }
  const domainArr = domain.split('.').reverse();
  const key = `/${domainArr.join('/')}/${convertDotString(host)}`;
  let status = STATUS_UNKNOWN;
  try {
    if (success) {
      // 如果是成功的，则添加记录
      await ns.put(key).value(
        JSON.stringify({
          host,
          ttl,
        }),
      );
      status = STATUS_SUCCESS;
    } else {
      // 失败的则删除记录
      await ns.delete().key(key);
      status = STATUS_FAIL;
    }
  } catch (err) {
    console.error(`update ${domain} ${host} dns config fail, ${err.message}`);
  }
  return status;
}

function dnsAlert(data) {
  const url = config.get('alert');
  if (!url) {
    console.error(`dns all fail, %j`, data);
    return;
  }
  request
    .post(url)
    .send(data)
    .catch(err => {
      if (err) {
        console.error(`alert fail, ${err.message}`);
      }
    });
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
  const dict = {};
  await bluebird.map(
    checkList,
    options => {
      const {domain, host} = options;
      const d = convertDotString(domain);
      const h = convertDotString(host);
      if (!dict[d]) {
        dict[d] = {};
      }
      return refreshHost(options).then(status => {
        dict[d][h] = status;
      });
    },
    {
      concurrency: 5,
    },
  );
  dnsStatusDict = dict;
  _.forEach(dict, (hosts, domain) => {
    let count = 0;
    _.forEach(hosts, status => {
      if (status === STATUS_SUCCESS) {
        count += 1;
      }
    });
    if (count === 0) {
      dnsAlert({
        domain,
        ips: _.keys(hosts),
      });
    }
  });
}

// 删除dns
export async function removeDNSHost(id, host) {
  const doc = await dnsService.findById(id);
  if (!doc) {
    return;
  }
  const domainArr = doc.domain.split('.').reverse();
  const key = `/${domainArr.join('/')}/${convertDotString(host)}`;
  await ns.delete().key(key);
  if (_.includes(doc.hosts, host)) {
    _.pull(doc.hosts, host);
    await doc.save();
  }
}

// 列出当前coredns中有效的DNS配置
// 有可能直接添加至coredns，并未通过管理后台添加，则在管理后台并无记录
export async function listAvailableDNSHost() {
  const data = await ns.getAll();
  const result = {};
  _.forEach(data, (v, k) => {
    const arr = k.split('/');
    // 将前端标记的删除
    arr.pop();
    arr.shift();

    const domain = arr.reverse().join('.');
    if (!result[domain]) {
      result[domain] = [];
    }
    const value = JSON.parse(v);
    result[domain].push(
      _.extend(
        {
          key: k,
        },
        value,
      ),
    );
  });
  return result;
}

// 删除可用的host
export async function removeAvailableDNSHost(key) {
  await ns.delete().key(key);
}
