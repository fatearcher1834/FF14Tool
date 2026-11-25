<template>
  <span v-if="rank && rank !== 'None'" :class="['text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 leading-none', rankColors[rank]]">
    {{ rank }}
  </span>
</template>

<script setup>
const props = defineProps({
  rank: String
})

const rankColors = {
  B: 'bg-slate-400 text-white dark:bg-slate-700/80 dark:text-slate-300 dark:shadow-none',
  A: 'bg-red-500 text-white dark:bg-slate-700/80 dark:text-red-300 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-red-400/40',
  S: 'bg-amber-500 text-white shadow-sm dark:bg-slate-700/80 dark:text-amber-300 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-amber-400/40',
  SS: 'bg-purple-600 text-white shadow-md animate-pulse dark:bg-slate-700/80 dark:text-purple-300 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-purple-400/40'
}
</script>
