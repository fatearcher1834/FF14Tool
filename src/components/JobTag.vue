<template>
  <template v-if="jobs && jobs.length > 0">
    <span v-for="(job, idx) in jobs" :key="idx" :class="['text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 leading-none', getJobColor(job)]">
      {{ job }}
    </span>
  </template>
</template>

<script setup>
import { JOB_COLORS, JOB_BASE_NAMES } from '@/config/constants'

defineProps({
  jobs: {
    type: Array,
    default: () => []
  }
})

function getJobColor(job) {
  if (!job || job.trim() === '') return 'bg-slate-300 text-slate-700'
  const jobBase = JOB_BASE_NAMES.find(j => job.startsWith(j)) || ''
  return JOB_COLORS[jobBase] || 'bg-slate-400 text-white'
}
</script>
