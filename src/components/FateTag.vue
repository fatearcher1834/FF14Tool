<template>
  <span v-if="isFate" class="app-tag">
    <span class="app-tag-dot bg-pink-400"></span>FATE
  </span>
</template>

<script setup>
defineProps({
  isFate: Boolean
})
</script>
