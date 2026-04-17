<template>
  <transition name="copy-feedback">
    <div v-if="visible" class="absolute inset-0 z-10 rounded-xl flex items-center justify-center bg-green-500/90 ring-2 ring-white/70">
      <Check size="12" class="text-white" />
    </div>
  </transition>
</template>

<script setup>
import { defineProps } from 'vue'
import { Check } from 'lucide-vue-next'

const props = defineProps({
  visible: Boolean
})
</script>
