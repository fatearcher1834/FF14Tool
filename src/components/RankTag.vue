<template>
  <span v-if="rank && rank !== 'None'" class="app-tag">
    <span class="app-tag-dot" :class="rankDots[rank]"></span>{{ rank }}
  </span>
</template>

<script setup>
defineProps({
  rank: String
})

const rankDots = {
  B: 'bg-slate-400',
  A: 'bg-red-400',
  S: 'bg-amber-400',
  SS: 'bg-purple-400'
}
</script>
