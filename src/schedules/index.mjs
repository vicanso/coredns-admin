import performance from './performance';
import * as settingService from '../services/setting';
import * as routeLimiterService from '../services/route-limiter';
import * as dnsService from '../services/dns';
import * as config from '../config';

performance(10 * 1000);

setInterval(() => {
  settingService.updateAppSettings().catch(err => {
    console.error(`更新系统配置失败，${err.message}`);
  });
  routeLimiterService.updateRouteLimiter().catch(err => {
    console.error(`更新路由限制配置失败，${err.message}`);
  });
}, 60 * 1000).unref();

dnsService.refresh();
const dnsFreshInterval = config.get('dns.freshInterval');
if (dnsFreshInterval) {
  setInterval(() => {
    dnsService.refresh();
  }).unref();
}
