import request from 'axios';
import _ from 'lodash';

import {
  ROUTE_LIMITS,
} from '../../urls';
import {
  getDate,
} from '../../helpers/util';

export default {
  data() {
    return {
      mode: -1,
      form: null,
      routeLimits: null,
      modified: null,
      methods: [
        'GET',
        'POST',
        'PATCH',
        'DELETE',
      ],
      statuses: [
        'enabled',
        'disabled',
      ],
    };
  },
  methods: {
    add() {
      this.form = {};
      this.mode = 1;
    },
    async submit() {
      const {
        name,
        path,
        method,
        status,
        date,
        time,
        id,
      } = this.form;
      if (!name || !path) {
        this.$error('name and path can not be null');
        return;
      }
      const data = {
        name,
        path,
        method,
        status,
      };
      if (date && date.length === 2) {
        data.date = _.map(date, item => item.toISOString());
      }
      if (time && time.length === 2) {
        data.time = _.map(time, (item) => {
          const date = item.toISOString();
          return date.substring(11, 19);
        });
      }
      const close = this.$loading();
      try {
        if (id) {
          await request.patch(`${ROUTE_LIMITS}/${id}`, data);
        } else {
          await request.post(ROUTE_LIMITS, data);
        }
        await this.loadRouteLimits();
      } catch (err) {
        this.$error(err);
      } finally {
        close();
      }
    },
    async loadRouteLimits() {
      const close = this.$loading();
      try {
        const res = await request.get(ROUTE_LIMITS);
        this.routeLimits = _.map(res.data.routeLimits, (item) => {
          if (item.date && item.date.length) {
            item.dateDesc = _.map(item.date, (tmp) => {
              const date = getDate(new Date(tmp));
              return date;
            }).join('-');
          }
          if (item.time && item.time.length) {
            const timeList = [];
            item.timeDesc = _.map(item.time, (tmp) => {
              const date = getDate(new Date(`2018-01-01T${tmp}.000Z`));
              timeList.push(date);
              return date.substring(11, 19);
            }).join('-');
            item.time = timeList;
          }
          return item;
        });
        this.mode = 0;
      } catch (err) {
        this.$error(err);
      } finally {
        close();
      }
    },
    async edit(id) {
      this.form = _.cloneDeep(_.find(this.routeLimits, item => item.id === id));
      this.mode = 1;
    },
    async remove(id) {
      try {
        await this.$confirm('Are you sure to remove the route limit?')
        await request.delete(`${ROUTE_LIMITS}/${id}`);
        this.loadRouteLimits(); 
      } catch (err) {
        if (err === 'cancel') {
          return
        }
        this.$error(err);
      }
    },
  },
  beforeMount() {
    this.loadRouteLimits();
  },
};
