<template>
  <span v-if="isFate" class="text-[10px] font-black px-1.5 py-0.5 rounded bg-pink-500 text-white shrink-0 leading-none dark:bg-slate-700/80 dark:text-pink-300 dark:ring-1 dark:ring-inset dark:ring-pink-400/40">
    FATE
  </span>
</template>

<script setup>
defineProps({
  isFate: Boolean
})
</script>
