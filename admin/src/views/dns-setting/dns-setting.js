import request from 'axios';
import _ from 'lodash';

import {
  DNS_SETTINGS,
  DNS_SETTINGS_HOST,
} from '../../urls';
import {
  diff,
} from '../../helpers/util';

export default {
  data() {
    return {
      mode: -1,
      dnsSettings: null,
      form: null,
    };
  },
  methods: {
    async loadingDnsSettings() {
      const close = this.$loading();
      try {
        const res = await request.get(DNS_SETTINGS);
        this.dnsSettings = res.data.dns;
        this.mode = 0;
      } catch (err) {
        this.$error(err);
      } finally {
        close();
      }
    },
    edit(id) {
      this.form = _.cloneDeep(_.find(this.dnsSettings, item => item.id === id));
      if (this.form) {
        const {
          check,
        } = this.form;
        const arr = check.split('://');
        this.form.checkPath = arr[1];
        this.form.checkType = `${arr[0]}://`;
      }
      this.mode = 1;
    },
    add() {
      this.form = {};
      this.mode = 1;
    },
    async submit() {
      const {
        form,
      } = this;
      const {
        domain,
        ttl,
        disabled,
        id,
        checkType,
        checkPath,
      } = form;
      if (!domain || !checkPath || !checkType) {
        this.$error('domain and check can\'t be null');
        return;
      }
      form.check = checkType + checkPath;
      const close = this.$loading();
      try {
        if (id) {
          const found = _.find(this.dnsSettings, item => item.id === id);
          const keys = ['domain', 'check', 'ttl', 'disabled'];
          const updateData = diff(found, form, keys);
          await request.patch(`${DNS_SETTINGS}/${id}`, updateData);
        } else {
          await request.post(DNS_SETTINGS, {
            domain,
            check: form.check,
            ttl,
            disabled,
          });
        }
        await this.loadingDnsSettings();
        this.mode = 0;
      } catch (err) {
        this.$error(err);
      } finally {
        close();
      }
    },
    async removeHost(host) {
      const {
        form,
      } = this;
      const {
        id,
      } = form;
      let close = _.noop;
      try {
        await this.$confirm(`Are you sure to remove ${host}?`)
        close = this.$loading();
        const url = DNS_SETTINGS_HOST.replace(":id", id);
        await request.delete(`${url}/${host}`);
        const found = _.find(this.dnsSettings, item => item.id === id);
        _.remove(found.hosts, item => item.host == host); 
        form.hosts = found.hosts.slice(0);
      } catch (err) {
        if (err === 'cancel') {
          return;
        }
        this.$error(err);
      } finally {
        close();
      }
    },
    async addHost() {
      const {
        form,
      } = this;
      const {
        host,
        id,
      } = form;
      let close = _.noop;
      try {
        await this.$confirm(`Are you sure to add ${host}?`);
        const url = DNS_SETTINGS_HOST.replace(":id", id); 
        await request.post(url, {
          host,
        });
        const found = _.find(this.dnsSettings, item => item.id === id);
        found.hosts.push({
          host,
        });
        form.hosts.push({
          host,
        });
        form.host = '';
      } catch (err) {
        if (err === 'cancel') {
          return;
        }
        this.$error(err);
      } finally {
        close();
      }
    }
  },
  beforeMount() {
    this.loadingDnsSettings();
  },
};
