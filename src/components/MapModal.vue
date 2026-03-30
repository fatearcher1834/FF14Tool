<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl w-full max-w-2xl p-4 shadow-xl border">
      <div class="flex justify-between items-center mb-2">
        <div class="text-left">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <h3 class="text-base font-black text-slate-800">{{ monster?.name || '未知怪物' }}</h3>
            <VersionTag :version="monster?.version" />
            <RankTag :rank="monster?.rank" />
            <FateTag :is-fate="monster?.isFate" />
            <WantedTag :is-wanted="monster?.isWanted" />
            <JobTag :jobs="monster?.jobs || []" />
          </div>
          <p class="text-[14px] text-slate-500">地圖位置：{{ location?.map || '未知' }}</p>
          <p v-if="monster?.triggerCondition" class="text-[14px] text-amber-600">觸發條件：<br>{{ monster.triggerCondition }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-800 hover:border-slate-400 transition-colors"
        >
          <X size="14" />
        </button>
      </div>
      <div class="bg-slate-100 rounded-lg border p-2 overflow-auto max-h-[calc(100vh-9rem)]">
        <template v-if="props.loading">
          <div class="w-full h-56 flex items-center justify-center text-blue-500">載入地圖中...</div>
        </template>
        <template v-else-if="monster?.mapImageData">
          <div
            class="block w-full mx-auto mt-2 rounded cursor-pointer flex justify-center"
            @click.prevent="handleOpenMap"
          >
            <img
              :src="monster?.mapImageData"
              alt="地圖圖片"
              class="max-h-[calc(100vh-12rem)] max-w-full rounded"
              style="height: auto; width: auto;"
            />
          </div>
        </template>
        <template v-else>
          <div class="w-full h-56 flex items-center justify-center text-slate-400">未設定地圖圖片。</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import VersionTag from '@/components/VersionTag.vue'
import RankTag from '@/components/RankTag.vue'
import FateTag from '@/components/FateTag.vue'
import WantedTag from '@/components/WantedTag.vue'
import JobTag from '@/components/JobTag.vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: Boolean,
  monster: Object,
  location: Object,
  loading: Boolean,
  onOpenMap: Function
})

const emit = defineEmits(['close'])

const handleOpenMap = () => {
  if (typeof props.onOpenMap === 'function') {
    const imageSrc = props.monster?.mapImageData
    if (imageSrc) {
      props.onOpenMap(imageSrc)
    } else {
      console.warn('沒有可開啟的地圖資訊')
    }
  }
}
</script>
