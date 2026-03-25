<template>
  <span v-if="isWanted" class="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white shrink-0 leading-none">
    通緝令
  </span>
</template>

<script setup>
defineProps({
  isWanted: Boolean
})
</script>
