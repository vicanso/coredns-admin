<template lang="pug">
.routeLimiterPage
  h3.tac Route Limiter Setting
  div(
    v-if="mode === 0"
  )
    p.tac(v-if="!routeLimits || routeLimits.length === 0") There isn't any route limit
    el-table.table(
      v-else
      :data="routeLimits"
    )
      el-table-column(
        prop="name"
        label="Name"
        width="150"
      )
      el-table-column(
        prop="path"
        label="Path"
        width="200"
      )
      el-table-column(
        prop="method"
        label="Method"
        width="80"
      )
      el-table-column(
        prop="status"
        label="Status"
        width="90"
      )
      el-table-column(
        prop="dateDesc"
        label="Date"
        width="350"
      )
      el-table-column(
        prop="timeDesc"
        label="Time"
        width="150"
      )
      el-table-column(
        label="OP"
      )
        template(
          slot-scope="scope"
        )
          el-button(
            type="text"
            @click.native="edit(scope.row.id)"
          ) Edit
          el-button(
            type="text"
            @click.native="remove(scope.row.id)"
          ) Remove
    el-button.addRouteLimit.mtop10(
      type="primary"
      @click.native="add"
    ) Add Route Limit
  el-form.form(
    v-model="form"
    label-width="100px"
    v-if="mode === 1"
  )
    el-form-item(
      label="Name"
    )
      el-input(
        v-model="form.name"
        placeholder="route limiter's name"
        autofocus
      )
    el-form-item(
      label="Path"
    )
      el-input(
        v-model="form.path"
        placeholder="route path"
      )
    el-form-item(
      label="Method"
    )
      el-select(
        v-model="form.method"
        placeholder="select method"
      )
        el-option(
          v-for="item in methods"
          :key="item"
          :label="item"
          :value="item"
        )
    el-form-item(
      label="Status"
    )
      el-select(
        v-model="form.status"
        placeholder="select status"
      )
        el-option(
          v-for="item in statuses"
          :key="item"
          :label="item"
          :value="item"
        )
    el-form-item(
      label="Date"
    )
      el-date-picker(
        style="width:100%"
        v-model="form.date"
        type="datetimerange"
        range-separator="To"
        start-placeholder="Start date"
        end-placeholder="End date"
      )
    el-form-item(
      label="Time"
    )
      el-time-picker(
        style="width:100%"
        is-range
        v-model="form.time"
        range-separator="To"
        start-placeholder="Start time"
        end-placeholder="End time"
      )
    el-form-item
      el-button(
        type="primary"
        @click.native="submit"
      ) Submit 
      el-button(
        @click.native="mode = 0"
      ) Back
</template>
<script src="./route-limiter.js"></script>
<style lang="sass" scoped>
.routeLimiterPage
  padding: 10px
  pre
    overflow-x: auto
.form
  width: 600px
  padding: 40px 20px 20px
  margin: auto
.addRouteLimit, .table
  width: 100%
</style>
