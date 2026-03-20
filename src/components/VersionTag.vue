<template>
  <span v-if="version" :class="['text-[10px] font-black px-1.5 py-0.5 rounded text-white shrink-0 leading-none shadow-sm', versionColors[version]]">
    {{ version }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  version: String
})

const versionColors = computed(() => ({
  '2.0': 'bg-zinc-500',
  '3.0': 'bg-sky-700',
  '4.0': 'bg-red-700',
  '5.0': 'bg-indigo-800',
  '6.0': 'bg-emerald-700',
  '7.0': 'bg-amber-600'
}))
</script>
