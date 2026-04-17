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
          <p v-if="monster?.isFate" class="text-[14px] text-slate-700">事件名稱：{{ monster.fateEventName || '未設定事件名稱' }}</p>
          <div class="flex flex-wrap gap-2 items-center text-[14px] text-slate-500">
            <span>座標位置 (X: {{ location?.x || '--' }}, Y: {{ location?.y || '--' }})</span>
            <button
              @click.prevent="copyLocation()"
              :class="['ml-3 p-2 rounded-full shadow transition-all', copied ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white text-blue-400 hover:text-white hover:bg-blue-500']"
              title="複製座標"
            >
              <template v-if="copied">
                <Check size="14" />
              </template>
              <template v-else>
                <Copy size="14" />
              </template>
            </button>
          </div>
          <p v-if="monster?.triggerCondition" class="text-[14px] text-amber-600">觸發條件：{{ monster.triggerCondition }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-800 hover:border-slate-400 transition-colors"
        >
          <X size="14" />
        </button>
      </div>
      <div class="bg-slate-100 rounded-lg border p-2 overflow-auto max-h-[calc(100vh-9rem)] space-y-4">
        <template v-if="props.loading">
          <div class="w-full h-56 flex items-center justify-center text-blue-500">載入中...</div>
        </template>

        <!-- 地圖部分 -->
        <div v-if="!monster?.isFate" class="space-y-2">
          <h4 class="text-xs font-bold text-slate-600">地圖位置</h4>
          <template v-if="monster?.mapImageData">
            <div
              class="block w-full mx-auto rounded cursor-pointer flex justify-center"
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
            <div class="w-full h-40 flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded">未設定地圖圖片。</div>
          </template>
        </div>

        <!-- 怪物照片部分 -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold text-slate-600">怪物照片</h4>
          <template v-if="monster?.monsterImageData">
            <div
              class="block w-full mx-auto rounded flex justify-center"
            >
              <img
                :src="monster?.monsterImageData"
                alt="怪物照片"
                class="max-h-[calc(50vh-6rem)] max-w-full rounded"
                style="height: auto; width: auto;"
              />
            </div>
          </template>
          <template v-else>
            <div class="w-full h-32 flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded">未設定怪物照片。</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import VersionTag from '@/components/VersionTag.vue'
import RankTag from '@/components/RankTag.vue'
import FateTag from '@/components/FateTag.vue'
import WantedTag from '@/components/WantedTag.vue'
import JobTag from '@/components/JobTag.vue'
import { X, Copy, Check } from 'lucide-vue-next'
import { copyToClipboard } from '@/services/hunterUtils'

const props = defineProps({
  open: Boolean,
  monster: Object,
  location: Object,
  loading: Boolean,
  onOpenMap: Function
})

const emit = defineEmits(['close'])
const copied = ref(false)

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

const copyLocation = async () => {
  if (!props.monster || !props.location) return

  const prefix = props.monster.isFate ? `FATE: ${props.monster.fateEventName || '未設定事件名稱'} ` : ''
  const text = `${prefix}${props.monster.name || '未知怪物'} ${props.location.map || '未知'} (X: ${props.location.x || '--'}, Y: ${props.location.y || '--'})`
  await copyToClipboard(text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1000)
}
</script>
