<template>
  <span v-if="isWanted" class="app-tag">
    <span class="app-tag-dot bg-rose-400"></span>通緝令
  </span>
</template>

<script setup>
defineProps({
  isWanted: Boolean
})
</script>
