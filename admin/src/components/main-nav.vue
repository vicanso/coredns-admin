<template lang="pug">
  .mainNav
    el-menu(
      :default-active="active"
    )
      el-menu-item(
        v-for="(item, index) in items",
        :key="index",
        :index="'' + index"
        @click.native="go(item)"
      )
        span {{item.name}}
</template>

<style lang="sass" scoped>
@import "../variables";
.mainNav
  position: fixed    
  left: 0
  top: $MAIN_HEADER_HEIGHT
  bottom: 0
  width: $MAIN_NAV_WIDTH
  background-color: $COLOR_BLACK
  z-index: 9
</style>
<script>
import _ from 'lodash';
import {Routes} from '../router/routes';

export default {
  data() {
    const {current} = this.$router.history;
    let active = '-1';
    const routes = [
      {
        name: 'DNS Setting',
        route: Routes.DNSSetting,
      },
      {
        name: 'Available DNS',
        route: Routes.AvailableDNS,
      },
    ];
    _.forEach(routes, (item, i) => {
      if (item.route === current.name) {
        active = `${i}`;
      }
    });
    return {
      active,
      items: routes,
    };
  },
  methods: {
    go(item) {
      this.$router.push({
        name: item.route,
      });
    },
  },
};
</script>
