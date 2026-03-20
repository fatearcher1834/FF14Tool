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
  B: 'bg-slate-400 text-white',
  A: 'bg-red-500 text-white',
  S: 'bg-amber-500 text-white shadow-sm',
  SS: 'bg-purple-600 text-white shadow-md animate-pulse'
}
</script>
