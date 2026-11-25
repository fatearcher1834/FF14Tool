<template>
  <span v-if="version" class="app-tag">
    <span class="app-tag-dot" :class="versionDots[version]"></span>{{ version }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
  version: String
})

const versionDots = computed(() => ({
  '2.0': 'bg-zinc-400',
  '3.0': 'bg-sky-400',
  '4.0': 'bg-red-400',
  '5.0': 'bg-indigo-400',
  '6.0': 'bg-emerald-400',
  '7.0': 'bg-amber-400'
}))
</script>
