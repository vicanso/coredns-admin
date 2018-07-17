import request from 'axios';
import _ from 'lodash';

import {
  SERIES,
  INFLUX_RECORDS,
} from '../../urls';
import {
  getDate,
} from '../../helpers/util';

export default {
  data() {
    return {
      form: {
        begin: Date.now() - (24 * 3600 * 1000),
        end: Date.now(),
        pageSize: 5,
        currentPage: 1,
      },
      categories: null,
      trackers: null,
      showPagination: false,
    };
  },
  methods: {
    handleSizeChange(v) {
      this.form.pageSize = v;
      this.form.currentPage = 1;
      this.search();
    },
    handleCurrentChange() {
      this.search();
    },
    async search() {
      const {
        category,
        account,
        begin,
        end,
        pageSize,
        currentPage,
      } = this.form;
      const url = INFLUX_RECORDS.replace(':measurement', 'userTracker');
      if (!category && !account) {
        this.$error('category and account can\'t be null');
        return;
      }
      const close = this.$loading();
      this.trackers = null;
      try {
        const conditions = {};
        if (category) {
          conditions.category = category;
        }
        if (account) {
          conditions.account = account;
        }
        const params = {
          'cache-control': 'no-cache',
        };
        if (!_.isEmpty(conditions)) {
          params.conditions = JSON.stringify(conditions);
        }
        if (begin) {
          params.start = new Date(begin).toISOString();
        }
        if (end) {
          params.end = new Date(end).toISOString();
        }
        params.limit = pageSize;
        params.offset = (currentPage - 1) * pageSize;
        const res = await request.get(url, {
          params,
        });
        const convert = (item, key) => {
          if (item[key]) {
            const value = JSON.parse(item[key]);
            item[key] = JSON.stringify(value, null, 2);
          }
        }
        this.trackers = _.map(res.data.trackers, (item) => {
          _.forEach(['params', 'query', 'form', 'body'], key => convert(item, key));
          item.date = getDate(item.time);
          return item;
        })
      } catch (err) {
        this.$error(err);
      } finally {
        const size = _.get(this, 'trackers.length');
        if (size || currentPage > 1) {
          this.showPagination = true;
        } else {
          this.showPagination = false;
        }
        close();
      }
    },
  },
  async beforeMount() {
    const url = SERIES.replace(':measurement', 'userTracker');
    const close = this.$loading();
    try {
      const res = await request.get(url);
      this.categories = res.data.category;
    } catch (err) {
      this.$error(err);
    } finally {
      close();
    }
  },
};
