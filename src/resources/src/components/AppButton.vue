<template>
  <button
    :class="`btn ${_$attrs.color ? 'btn-' + _$attrs.color : 'btn-primary'} ${_$attrs.weight ? 'btn-' + _$attrs.weight : ''} w-100`"
    v-bind="_$attrs"
  >
    <span :class="_$attrs.icon ? 'pe-2' : ''">{{ _$attrs.label }}</span>
    <span v-if="_$attrs.icon"><i :class="_$attrs.icon"></i></span>
  </button>
</template>

<script setup>
import { useAttrs } from "vue";

defineOptions({ name: "AppButton", inheritAttrs: false });

const _$attrs = useAttrs();
</script>

<style lang="scss" scoped></style>
