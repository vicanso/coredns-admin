<template lang="pug">
.availableDNSPage
  h3.tac Available DNS
  div(
    v-if="mode === 0"
  )
    p.tac(v-if="currentDNSList.length === 0") There isn't any available dns
    el-table.table(
      v-else
      :data="currentDNSList"
    )
      el-table-column(
        prop="domain"
        label="Domain"
      )
      el-table-column(
        prop="host"
        label="IP"
      )
      el-table-column(
        prop="ttl"
        label="TTL"
      )
      el-table-column(
        label="OP"
        width="80"
      )
        template(
          slot-scope="scope"
        )
          el-button(
            type="text"
            @click.native="remove(scope.row)"
          ) Remove
</template>
<style lang="sass" scoped>
.availableDNSPage
  padding: 10px
</style>
<script src="./available-dns.js"></script>
