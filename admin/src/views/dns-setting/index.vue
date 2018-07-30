<template lang="pug">
.dnsSettingPage
  h3.tac DNS Setting 
  div(
    v-if="mode === 0"
  )
    p.tac(v-if="!dnsSettings || dnsSettings.length === 0") There isn't any dns setting
    el-table.table(
      v-else
      :data="dnsSettings"
    )
      el-table-column(
        prop="domain"
        label="Domain"
        width="150"
      )
      el-table-column(
        label="Host"
      )
        template(
          slot-scope="scope"
        )
          ul
            li(
              v-for="item in scope.row.hosts"
            )
              span(
                style="margin-right:3px"
              ) {{item.host}}
              span.success(v-if="item.status == 1")
                i.el-icon-circle-check
              span.fail(v-else-if="item.status == 2")
                i.el-icon-circle-close
              span(v-else)
                i.el-icon-question
      el-table-column(
        label="Check"
        prop="check"
        width="200"
      )
      el-table-column(
        label="TTL"
        prop="ttl"
        width="80"
      )
      el-table-column(
        label="Status"
        width="100"
      )
        template(
          slot-scope="scope"
        )
          span(v-if="scope.row.disabled") Disabled
          span(v-else) Enabled
      el-table-column(
        label="OP"
        width="80"
      )
        template(
          slot-scope="scope"
        )
          el-button(
            type="text"
            @click.native="edit(scope.row.id)"
          ) Edit
    el-button.addSetting.mtop10(
      type="primary"
      @click.native="add"
    ) Add DNS Setting
  el-form.form(
    v-model="form"
    label-width="100px"
    v-if="mode === 1"
  )
    el-form-item(
      label="Domain"
    )
      el-input(
        v-model="form.domain"
        autofocus
      )
    el-form-item(
      label="Check"
    )
      el-input(
        v-model="form.checkPath"
        placeholder="${domain}/ping or ${domain}:5018"
      )
        el-select.checkTypeSelector(
          v-model="form.checkType"
          slot="prepend"
          placeholder="Select type"
        )
          el-option(
            label='HTTP'
            value='http://'
          )
          el-option(
            label='TCP'
            value='tcp://'
          )
    el-form-item(
      label="TTL"
    )
      el-input-number(
        v-model="form.ttl"
        :min="1"
        :max="3600"
      )
    el-form-item(
      label="Disabled"
    )
      el-switch(
        v-model="form.disabled"
      )
    el-form-item(
      label="Host"
      v-if="form.id"
    )
      ul
        li(
          v-for="item in form.hosts"
        )
          span(
            style="margin-right:3px"
          ) {{item.host}}
          a.remove(
            href="javascript:;"
            @click="removeHost(item.host)"
          )
            i.el-icon-remove-outline

      el-input(
        placeholder="Please input the host ip"
        v-model="form.host"
      ) 
        el-button(
          slot="append"
          @click.native="addHost()"
        ) Add

    el-form-item
      el-button(
        type="primary"
        @click.native="submit"
      ) Submit 
      el-button(
        @click.native="mode = 0"
      ) Back
    
</template>

<style lang="sass" scoped>
@import "../../variables";
.dnsSettingPage
  padding: 10px
ul
  margin: 0
  padding: 0
  li
    list-style: none
.form
  width: 800px
  padding: 40px 20px 20px
  margin: auto
.checkTypeSelector
  width: 100px
.addSetting, .table
  width: 100%
a.remove
  color: $COLOR_RED
.success
  color: $COLOR_BLUE
.fail
  color: $COLOR_RED
</style>
<script src="./dns-setting.js"></script>
