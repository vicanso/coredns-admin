import request from 'axios';
import _ from 'lodash';

import {
  DNS_AVAILABLE,
} from '../../urls';

export default {
  data() {
    return {
      mode: -1,
      currentDNSList: null,
    };
  },
  methods: {
    async loadingAvaliableDNS() {
      const close = this.$loading();
      try {
        const res = await request.get(DNS_AVAILABLE);
        const currentDNSList = [];
        _.forEach(res.data, (items, domain) => {
          _.forEach(items, (item) => {
            currentDNSList.push(_.extend({
              domain,
            }, item));
          });
        });
        this.currentDNSList = currentDNSList;
        this.mode = 0;
      } catch (err) {
        this.$error(err);
      } finally {
        close();
      }
    },
    async remove(item) {
      const {
        domain,
        host,
        key,
      } = item
      let close = _.noop;
      try {
        await this.$confirm(`Are you sure to remove ${domain}(${host})?`)
        close = this.$loading();
        await request.delete(DNS_AVAILABLE, {
          params: {
            key,
          }
        });
        this.currentDNSList = _.reject(this.currentDNSList, item => item.key === key)
      } catch (err) {
        if (err === 'cancel') {
          return;
        }
        this.$error(err);
      } finally {
        close();
      }
    },
  },
  beforeMount() {
    this.loadingAvaliableDNS();
  },
}
