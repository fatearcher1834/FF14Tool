<template>
  <template v-if="jobs && jobs.length > 0">
    <span v-for="(job, idx) in jobs" :key="idx" class="app-tag">
      <span class="app-tag-dot" :class="getJobDot(job)"></span>{{ job }}
    </span>
  </template>
</template>

<script setup>
import { JOB_DOT_COLORS, JOB_BASE_NAMES } from '@/config/constants'

defineProps({
  jobs: {
    type: Array,
    default: () => []
  }
})

function getJobDot(job) {
  if (!job || job.trim() === '') return 'bg-slate-400'
  const jobBase = JOB_BASE_NAMES.find(j => job.startsWith(j)) || ''
  return JOB_DOT_COLORS[jobBase] || 'bg-slate-400'
}
</script>
