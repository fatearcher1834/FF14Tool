<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl w-full max-w-2xl p-4 shadow-xl border">
      <div class="space-y-4 mb-4">
        <div class="flex justify-between gap-4 items-start">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-3">
              <h3 class="text-lg font-black text-slate-900 truncate">{{ monster?.name || '未知怪物' }}</h3>
              <VersionTag :version="monster?.version" />
              <RankTag :rank="monster?.rank" />
              <FateTag :is-fate="monster?.isFate" />
              <WantedTag :is-wanted="monster?.isWanted" />
              <JobTag :jobs="monster?.jobs || []" />
            </div>
            <div class="grid gap-2 text-sm text-slate-600">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-slate-800">地圖</span>
                <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700">{{ location?.map || '未知' }}</span>
              </div>
              <div v-if="monster?.isFate" class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-slate-800">事件</span>
                <span class="flex-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800">{{ monster.fateEventName || '未設定事件名稱' }}</span>
              </div>
              <div v-if="monster?.isFate" class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-slate-800">座標</span>
                <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  X: {{ location?.x || '--' }}, Y: {{ location?.y || '--' }}<span v-if="location?.z != null && location?.z !== ''">, Z: {{ location.z }}</span>
                </span>
                <button
                  @click.prevent="copyLocation()"
                  :class="['flex items-center justify-center w-10 h-10 rounded-full shadow transition-all', copied ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white text-blue-400 hover:text-white hover:bg-blue-500']"
                  title="複製座標"
                >
                  <template v-if="copied">
                    <Check size="16" />
                  </template>
                  <template v-else>
                    <Copy size="16" />
                  </template>
                </button>
              </div>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-800 hover:border-slate-400 transition-colors"
          >
            <X size="16" />
          </button>
        </div>
        <div v-if="monster?.triggerCondition" class="rounded-3xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          <span class="font-semibold">觸發條件：</span>{{ monster.triggerCondition }}
        </div>
      </div>
      <div class="bg-slate-100 rounded-3xl border border-slate-200 p-4 overflow-auto max-h-[calc(100vh-9rem)] space-y-4">
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
  const zPart = props.location.z != null && props.location.z !== '' ? `, Z: ${props.location.z}` : ''
  const text = `${prefix}${props.monster.name || '未知怪物'} ${props.location.map || '未知'} (X: ${props.location.x || '--'}, Y: ${props.location.y || '--'}${zPart})`
  await copyToClipboard(text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1000)
}
</script>
