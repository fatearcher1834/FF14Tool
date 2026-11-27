<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click.self="$emit('close')"
  >
    <div class="admin-modal-surface bg-white rounded-2xl w-full max-w-6xl p-4 shadow-xl border">
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
                <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700">{{ currentLocation?.map || '未知' }}</span>
              </div>
              <div v-if="monster?.isFate" class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-slate-800">事件</span>
                <span class="flex-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800">{{ monster.fateEventName || '未設定事件名稱' }}</span>
              </div>
              <div v-if="hasCurrentCoords" class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-slate-800 shrink-0">座標</span>
                <select
                  v-if="locationOptions.length > 1"
                  v-model.number="selectedIndex"
                  class="flex-1 min-w-[220px] px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-bold outline-none"
                >
                  <option v-for="(loc, i) in locationOptions" :key="i" :value="i">
                    {{ loc.map }} · X:{{ loc.x }} Y:{{ loc.y }}<span v-if="loc.z != null && loc.z !== ''"> Z:{{ loc.z }}</span>
                  </option>
                </select>
                <span v-else class="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  X: {{ currentLocation?.x || '--' }}, Y: {{ currentLocation?.y || '--' }}<span v-if="currentLocation?.z != null && currentLocation?.z !== ''">, Z: {{ currentLocation.z }}</span>
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
                <button
                  v-if="showGameMap"
                  @click.prevent="focusCurrentLocation"
                  class="flex items-center justify-center w-10 h-10 rounded-full shadow transition-all bg-white text-amber-500 hover:text-white hover:bg-amber-500"
                  title="在地圖上定位目前座標"
                >
                  <LocateFixed size="16" />
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
      <div class="bg-slate-100 rounded-3xl border border-slate-200 p-4 overflow-auto max-h-[calc(100vh-13rem)]">
        <template v-if="props.loading">
          <div class="w-full h-56 flex items-center justify-center text-blue-500">載入中...</div>
        </template>

        <div v-else class="grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-4">
          <!-- 地圖部分 -->
          <div v-if="showMapSection" class="space-y-2 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-xs font-bold text-slate-600">{{ showGameMap ? '遊戲地圖' : '攻略地圖' }}</h4>
              <button
                v-if="showGameMap"
                type="button"
                @click="fitMap"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 text-[10px] font-black transition-colors shrink-0"
                title="顯示整張地圖"
              >
                <Maximize2 :size="11" />
                全圖
              </button>
            </div>
            <GameMapViewer
              ref="mapViewerRef"
              v-if="showGameMap"
              :monster="monster"
              :initial-location="currentLocation"
              :height="420"
              :zoom-offset="1"
              @select-location="handleSelectLocation"
            />
            <p v-if="showGameMap" class="text-[10px] font-bold text-slate-400">
              光環代表目前選取的位置；切換座標時會自動定位。
            </p>
            <template v-else-if="monster?.mapImageData">
              <div
                class="block w-full mx-auto rounded cursor-pointer flex justify-center"
                @click.prevent="handleOpenMap"
              >
                <img
                  :src="monster?.mapImageData"
                  alt="地圖圖片"
                  class="max-h-[calc(100vh-18rem)] max-w-full rounded"
                  style="height: auto; width: auto;"
                />
              </div>
            </template>
            <template v-else>
              <div class="w-full h-40 flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded">未設定地圖圖片。</div>
            </template>
          </div>

          <!-- 怪物照片部分 -->
          <div :class="['space-y-2 min-w-0', !showMapSection ? 'lg:col-span-2' : '']">
            <h4 class="text-xs font-bold text-slate-600">怪物照片</h4>
            <template v-if="monster?.monsterImageData">
              <div
                class="block w-full mx-auto rounded flex justify-center"
              >
                <img
                  :src="monster?.monsterImageData"
                  alt="怪物照片"
                  class="max-h-[calc(100vh-18rem)] max-w-full rounded"
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
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, watch } from 'vue'
import VersionTag from '@/components/VersionTag.vue'
import RankTag from '@/components/RankTag.vue'
import FateTag from '@/components/FateTag.vue'
import WantedTag from '@/components/WantedTag.vue'
import JobTag from '@/components/JobTag.vue'
import GameMapViewer from '@/components/GameMapViewer.vue'
import { X, Copy, Check, LocateFixed, Maximize2 } from 'lucide-vue-next'
import { copyToClipboard } from '@/services/hunterUtils'
import { getGameMap } from '@/config/gameMaps'

const props = defineProps({
  open: Boolean,
  monster: Object,
  location: Object,
  loading: Boolean,
  onOpenMap: Function
})

const emit = defineEmits(['close'])
const copied = ref(false)
const selectedIndex = ref(0)
const mapViewerRef = ref(null)

const fitMap = () => {
  mapViewerRef.value?.fitWholeMap()
}

const locations = computed(() => Array.isArray(props.monster?.locations) ? props.monster.locations : [])

const hasValidCoords = (loc) => !!(loc &&
  loc.x != null && loc.x !== '' && loc.y != null && loc.y !== '' &&
  Number.isFinite(Number(loc.x)) && Number.isFinite(Number(loc.y)))

const locationOptions = computed(() => locations.value.filter(hasValidCoords))

const currentLocation = computed(() => locationOptions.value[selectedIndex.value] || props.location || null)

const sameLocation = (a, b) => !!(
  a && b &&
  a.map === b.map &&
  Number(a.x) === Number(b.x) &&
  Number(a.y) === Number(b.y)
)

const syncSelectedLocation = () => {
  if (!locationOptions.value.length) {
    selectedIndex.value = 0
    return
  }
  const index = locationOptions.value.findIndex(loc => sameLocation(loc, props.location))
  selectedIndex.value = index >= 0 ? index : 0
}

const handleSelectLocation = (loc) => {
  const index = locationOptions.value.findIndex(option => sameLocation(option, loc))
  if (index >= 0) selectedIndex.value = index
}

const focusCurrentLocation = () => {
  if (!currentLocation.value) return
  mapViewerRef.value?.focusLocation(currentLocation.value)
}

watch(() => props.location, syncSelectedLocation, { immediate: true, deep: true })
watch(() => props.monster, syncSelectedLocation, { deep: true })

const hasGameMap = computed(() =>
  (props.monster?.locations || []).some(loc => {
    if (!getGameMap(loc?.map)) return false
    return hasValidCoords(loc)
  })
)

const hasCurrentCoords = computed(() => hasValidCoords(currentLocation.value))

const isElite = computed(() => ['B', 'A', 'S', 'SS'].includes(props.monster?.rank))

const showStaticMap = computed(() => isElite.value && !!props.monster?.mapImageData)

const showGameMap = computed(() => hasGameMap.value && !showStaticMap.value)

const showMapSection = computed(() => showGameMap.value || !!props.monster?.mapImageData || !props.monster?.isFate)

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
  const loc = currentLocation.value
  if (!props.monster || !loc) return

  const prefix = props.monster.isFate ? `FATE: ${props.monster.fateEventName || '未設定事件名稱'} ` : ''
  const zPart = loc.z != null && loc.z !== '' ? `, Z: ${loc.z}` : ''
  const text = `${prefix}${props.monster.name || '未知怪物'} ${loc.map || '未知'} (X: ${loc.x || '--'}, Y: ${loc.y || '--'}${zPart})`
  await copyToClipboard(text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1000)
}
</script>
