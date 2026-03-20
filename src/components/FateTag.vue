<template>
  <span v-if="isFate" class="text-[10px] font-black px-1.5 py-0.5 rounded bg-pink-500 text-white shrink-0 leading-none">
    FATE
  </span>
</template>

<script setup>
defineProps({
  isFate: Boolean
})
</script>
