<template>
  <div
    ref="modalRef"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    tabindex="0"
    @keydown.esc="closeModal"
    @keydown.enter.prevent="submit"
    @mousedown="handleOverlayMouseDown"
    @click.self="handleOverlayClick"
  >
    <div class="bg-white rounded-[2.5rem] w-full max-w-lg sm:max-w-xl p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
      <div class="flex justify-between items-center">
        <h3 class="text-xl font-black text-slate-900">新增怪物</h3>
        <button @click="$emit('close')" class="p-2 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-100 transition-all">
          <X :size="16" />
        </button>
      </div>
      <div class="space-y-5">
        <!-- 九宮格等級按鈕與FATE -->
        <div class="flex gap-3 items-center">
          <div class="flex-1 flex bg-white p-1 border rounded-2xl shadow-sm">
            <button
              v-for="r in ['None','B','A','S','SS']"
              :key="r"
              @click="form.rank = r"
              :class="[
                'flex-1 py-2 rounded-xl text-xs font-black transition-all',
                form.rank === r ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
              ]"
            >
              {{ r === 'None' ? '一般' : r }}
            </button>
          </div>
          <button
            @click="form.isFate = !form.isFate"
            :class="[
              'px-4 py-2 rounded-2xl text-xs font-black border',
              form.isFate ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-slate-400'
            ]"
          >
            FATE
          </button>
          <button
            @click="form.isWanted = !form.isWanted"
            :class="[
              'px-4 py-2 rounded-2xl text-xs font-black border',
              form.isWanted ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400'
            ]"
          >
            通緝令
          </button>
        </div>

        <div>
          <label class="text-[10px] font-black text-slate-400 ml-1 uppercase">其他標籤</label>
          <select
            v-model="form.filterOther"
            class="w-full p-3 bg-slate-50 border rounded-2xl font-bold text-sm outline-none"
          > 
            <option value="">無</option>
            <option v-for="o in OTHER_FILTERS" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>

        <div v-if="form.rank && form.rank !== 'None'" class="space-y-2">
          <div
            class="w-full h-44 border-2 border-dashed rounded-xl p-2 text-slate-400 text-center text-xs flex items-center justify-center relative"
            tabindex="0"
            @paste.prevent="handleBatchImagePaste($event)"
          >
            <div v-if="!form.mapImageData" class="text-slate-500 text-xs">
              尚未設定地圖 請直接貼上圖片
            </div>
            <img
              v-if="form.mapImageData"
              :src="form.mapImageData"
              alt="預覽"
              class="absolute inset-0 m-auto max-h-full max-w-full"
            />
            <button
              v-if="form.mapImageData"
              @click.prevent="clearMapImage"
              class="absolute top-1 right-1 px-2 py-1 text-[10px] bg-red-500 text-white rounded"
            >
              移除圖片
            </button>
          </div>
        </div>

        <div v-if="(form.rank && form.rank !== 'None') || form.isFate" class="space-y-2">
          <div
            class="w-full h-44 border-2 border-dashed rounded-xl p-2 text-slate-400 text-center text-xs flex items-center justify-center relative"
            tabindex="0"
            @paste.prevent="handleMonsterImagePaste($event)"
          >
            <div v-if="!form.monsterImageData" class="text-slate-500 text-xs">
              尚未設定怪物照片 請直接貼上圖片
            </div>
            <img
              v-if="form.monsterImageData"
              :src="form.monsterImageData"
              alt="怪物預覽"
              class="absolute inset-0 m-auto max-h-full max-w-full"
            />
            <button
              v-if="form.monsterImageData"
              @click.prevent="clearMonsterImage"
              class="absolute top-1 right-1 px-2 py-1 text-[10px] bg-red-500 text-white rounded"
            >
              移除圖片
            </button>
          </div>
        </div>

        <div v-if="form.isFate" class="space-y-2">
          <label class="text-[10px] font-black text-slate-400 ml-1 uppercase">命運事件名稱</label>
          <input
            v-model="form.fateEventName"
            class="w-full p-3 bg-slate-50 border rounded-2xl font-bold text-sm outline-none"
            placeholder="事件名稱"
          />
        </div>

        <div v-if="form.isFate || form.rank === 'S' || form.rank === 'SS'" class="space-y-2">
          <textarea
            v-model="form.triggerCondition"
            class="w-full p-3 bg-white border rounded-2xl font-bold text-xs outline-none "
            placeholder="觸發條件"
            rows="4"
          />
        </div>

        <!-- 討伐筆記 -->
        <div class="flex flex-wrap gap-2 items-center">
          <div
            v-for="(job, idx) in form.jobs"
            :key="idx"
            class="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-black w-fit"
          >
            <span>{{ job }}</span>
            <button @click="removeJob(idx)" class="ml-1 hover:bg-blue-600 rounded-full p-0.5">
              <X :size="12" />
            </button>
          </div>
          <button
            @click="isJobPickerVisible = true"
            class="px-3 py-1 rounded-full text-xs font-black border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            + 討伐筆記
          </button>
        </div>

        <!-- 討伐筆記九宮格選擇器 -->
        <div v-if="isJobPickerVisible" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div class="bg-white rounded-[2rem] w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div class="flex justify-between items-center">
              <h4 class="text-lg font-black text-slate-900">選擇討伐筆記</h4>
              <button @click="isJobPickerVisible = false; jobPickerBase = null; jobPickerLevel = null" class="p-1 bg-slate-100 rounded-full hover:bg-slate-200">
                <X :size="18" />
              </button>
            </div>
            <!-- 職業九宮格 -->
            <div v-if="!jobPickerBase" class="space-y-3">
              <div class="grid grid-cols-3 gap-2">
                <button v-for="job in JOB_BASE_NAMES" :key="job" @click="jobPickerBase = job" class="py-3 px-2 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all">
                  {{ job }}
                </button>
              </div>
            </div>
            <!-- 編號格子選擇 -->
            <div v-if="jobPickerBase" class="space-y-3">
              <div class="flex items-center gap-2">
                <button @click="jobPickerBase = null" class="p-1 hover:bg-slate-100 rounded transition-colors">
                  <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <h5 class="text-sm font-black text-slate-900">{{ jobPickerBase }} - 選擇層級 (1~50)</h5>
              </div>
              <div class="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto">
                <button v-for="level in 50" :key="level" @click="confirmJobWithLevel(jobPickerBase, level)" :class="['py-2 px-1 rounded-lg text-[10px] font-black transition-all', jobPickerLevel === level ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white']">
                  {{ level }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 怪物名稱與版本 -->
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <label class="text-[10px] font-black text-slate-400 ml-1 uppercase">怪物名稱</label>
            <input
              v-model="form.name"
              class="w-full p-3 bg-slate-50 border rounded-2xl font-bold text-sm outline-none mt-1"
            />
          </div>
          <div>
            <label class="text-[10px] font-black text-slate-400 ml-1 uppercase">版本</label>
            <select
              v-model="form.version"
              class="w-full p-3 bg-slate-50 border rounded-2xl font-bold text-sm outline-none mt-1"
            >
              <option v-for="v in VERSIONS" :key="v" :value="v">{{ v }}</option>
            </select>
          </div>
        </div>
        <!-- 批次座標解析與座標列表 -->
        <div class="space-y-3">
          <div class="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50 space-y-3">
            <label class="text-[10px] font-black text-blue-600 uppercase tracking-wider">批次座標解析 (貼上即自動匯入)</label>
            <textarea
              ref="batchInput"
              class="w-full p-3 bg-white/80 border border-blue-200 rounded-xl text-xs font-mono outline-none focus:border-blue-400 transition-all placeholder:text-slate-300"
              placeholder="例如：劍術師01 黑衣森林中央林區(X: 6.28, Y: 21.06)"
              rows="2"
              @paste.prevent="handleBatchImagePaste($event); handleBatchParseFromPaste($event)"
              @change="handleBatchParse($event.target.value); $event.target.value=''"
            />
          </div>
          <label class="text-[10px] font-black text-slate-400 ml-1 uppercase">座標點位</label>
          <div
            v-for="(loc, i) in form.locations"
            :key="i"
            class="flex gap-2 p-3 bg-slate-50 rounded-2xl border items-center"
          >
            <div class="flex-1 flex gap-2">
              <select v-model="loc.type" class="bg-white border p-2 rounded-xl text-xs font-bold outline-none w-20">
                <option value="map">地圖</option>
                <option value="dungeon">副本</option>
              </select>

              <select
                v-model="loc.map"
                class="flex-1 bg-white border p-2 rounded-xl text-xs font-bold outline-none"
              >
                <template v-if="loc.type === 'map'">
                  <option v-for="r in MAP_DATA[form.version]" :key="r" :value="r">{{ r }}</option>
                  <optgroup v-if="otherRegions(form.version).length > 0" label="其他版本">
                    <option v-for="r in otherRegions(form.version)" :key="r" :value="r">{{ r }}</option>
                  </optgroup>
                </template>
                <template v-else>
                  <option v-for="r in DUNGEON_MAPS" :key="r" :value="r">{{ r }}</option>
                </template>
              </select>
            </div>

            <template v-if="loc.type === 'map'">
              <div class="flex gap-1 items-center">
                <span class="text-[10px] font-black text-slate-300">X</span>
                <input
                  v-model="loc.x"
                  class="w-14 bg-white border p-2 rounded-xl text-center text-xs font-mono"
                />
              </div>

              <div class="flex gap-1 items-center">
                <span class="text-[10px] font-black text-slate-300">Y</span>
                <input
                  v-model="loc.y"
                  class="w-14 bg-white border p-2 rounded-xl text-center text-xs font-mono"
                />
              </div>

              <div class="flex gap-1 items-center">
                <span class="text-[10px] font-black text-slate-300">Z</span>
                <input
                  v-model="loc.z"
                  class="w-14 bg-white border p-2 rounded-xl text-center text-xs font-mono"
                  placeholder="可留空"
                />
              </div>
            </template>

            <button @click="form.locations.splice(i, 1)" class="p-2 text-slate-300 hover:text-red-500">
              <X :size="14" />
            </button>
          </div>
          <button @click="addLocation" class="w-full p-4 border-2 border-dashed rounded-2xl text-slate-400 text-xs font-black">+ 新增座標</button>
        </div>
        <!-- 儲存狀態提示 -->
        <div v-if="modalMessage" class="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 p-3 text-xs font-bold">
          {{ modalMessage }}
        </div>
        <!-- 按鈕 -->
        <div class="flex gap-3 pt-4">
          <button @click="$emit('close')" class="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs">取消</button>
          <button
            @click="submit"
            :disabled="isLoadingImages || isLoadingMap || isLoadingMonster"
            :class="[
              'flex-1 py-4 rounded-2xl font-black text-xs shadow-lg',
              (isLoadingImages || isLoadingMap || isLoadingMonster)
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white'
            ]"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useMonstersStore } from '@/stores/monsters.store'
import { X } from 'lucide-vue-next'
import { MAP_DATA, VERSIONS, ALL_REGIONS, JOB_BASE_NAMES, DUNGEON_MAPS, OTHER_FILTERS } from '@/config/constants'
import { DUNGEON_MAPS_SIMPLE_MAP, simplifiedToTraditional, simplifiedJobBaseMap } from '@/config/locale-translation'

const props = defineProps({
  monster: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])
const modalRef = ref(null)
const matchAccuracy = ref(90)
const overlayMouseDownOnSelf = ref(false)

const isManualLoadMap = ref(false)
const isLoadingMap = ref(false)
const isLoadingMonster = ref(false)
const isLoadingImages = ref(false)
const showImageLoadingWarning = ref(false)
let imageLoadingWarningTimer = null
const formMessage = ref('')

const otherRegions = (version) => {
  const current = MAP_DATA[version] || [];
  return ALL_REGIONS.filter(r => !current.includes(r));
}

const normalizeLocations = (locations = [], version = VERSIONS[0]) => {
  const maps = MAP_DATA[version] || []
  return locations.map((loc) => ({
    type: loc.type === 'dungeon' ? 'dungeon' : 'map',
    map: loc.map || (loc.type === 'dungeon' ? '' : maps[0] || ''),
    x: loc.x || '',
    y: loc.y || '',
    z: loc.z == null ? '' : loc.z
  }))
}

const cleanLocations = (locations = []) => {
  return locations.map(loc => {
    const cleaned = { ...loc }
    if (cleaned.z == null || cleaned.z === '') {
      delete cleaned.z
    }
    return cleaned
  })
}

const normalizeDateTime = (val) => {
  if (!val) return null
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  if (val.toDate && typeof val.toDate === 'function') {
    return val.toDate()
  }
  if (val instanceof Date) {
    return val
  }
  return null
}

// 核心初始化
const form = ref({
  id: props.monster.id || null,
  name: props.monster.name || '',
  rank: props.monster.rank || 'None',
  isFate: props.monster.isFate || false,
  isWanted: props.monster.isWanted || false,
  jobs: Array.isArray(props.monster.jobs) ? [...props.monster.jobs] : [],
  version: props.monster.version || VERSIONS[0],
  mapImageData: props.monster.mapImageData || '',
  mapImageUpdatedAt: normalizeDateTime(props.monster.mapImageUpdatedAt),
  monsterImageData: props.monster.monsterImageData || '',
  monsterImageUpdatedAt: normalizeDateTime(props.monster.monsterImageUpdatedAt),
  hasMap: props.monster.hasMap || false,
  hasMonsterImage: props.monster.hasMonsterImage || false,
  triggerCondition: props.monster.triggerCondition || '',
  fateEventName: props.monster.fateEventName || '',
  locations: normalizeLocations(Array.isArray(props.monster.locations) ? [...props.monster.locations] : [], props.monster.version || VERSIONS[0]),
  filterOther: props.monster.filterOther || ''
})

// 核心修正：當點選不同怪物切換編輯時，同步刷新 form 資料
watch(() => props.monster, (newMonster) => {
  if (!newMonster) return
  form.value.id = newMonster.id || null
  form.value.name = newMonster.name || ''
  form.value.rank = newMonster.rank || 'None'
  form.value.isFate = newMonster.isFate || false
  form.value.isWanted = newMonster.isWanted || false
  form.value.jobs = Array.isArray(newMonster.jobs) ? [...newMonster.jobs] : []
  form.value.version = newMonster.version || VERSIONS[0]
  form.value.mapImageData = newMonster.mapImageData || ''
  form.value.mapImageUpdatedAt = normalizeDateTime(newMonster.mapImageUpdatedAt)
  form.value.monsterImageData = newMonster.monsterImageData || ''
  form.value.monsterImageUpdatedAt = normalizeDateTime(newMonster.monsterImageUpdatedAt)
  form.value.hasMap = newMonster.hasMap || false
  form.value.hasMonsterImage = newMonster.hasMonsterImage || false
  form.value.triggerCondition = newMonster.triggerCondition || ''
  form.value.fateEventName = newMonster.fateEventName || ''
  form.value.locations = normalizeLocations(Array.isArray(newMonster.locations) ? [...newMonster.locations] : [], newMonster.version || VERSIONS[0])
  form.value.filterOther = newMonster.filterOther || ''
}, { deep: true })

const closeModal = () => { emit('close') }

const handleOverlayMouseDown = (event) => {
  overlayMouseDownOnSelf.value = event.target === event.currentTarget
}

const handleOverlayClick = (event) => {
  if (!overlayMouseDownOnSelf.value) {
    overlayMouseDownOnSelf.value = false
    return
  }
  if (typeof window !== 'undefined') {
    const selection = window.getSelection?.()
    if (selection && selection.type === 'Range') {
      overlayMouseDownOnSelf.value = false
      return
    }
  }
  overlayMouseDownOnSelf.value = false
  closeModal()
}

const imageLoadExpected = computed(() => {
  return !!(props.monster.hasMap || props.monster.hasMonsterImage || props.monster.mapImageData || props.monster.monsterImageData)
})

const startImageLoadingWarning = () => {
  if (imageLoadingWarningTimer) clearTimeout(imageLoadingWarningTimer)
  showImageLoadingWarning.value = false
  imageLoadingWarningTimer = setTimeout(() => {
    if (isLoadingImages.value || isLoadingMap.value || isLoadingMonster.value) {
      showImageLoadingWarning.value = true
    }
  }, 250)
}

const stopImageLoadingWarning = () => {
  if (imageLoadingWarningTimer) {
    clearTimeout(imageLoadingWarningTimer)
    imageLoadingWarningTimer = null
  }
  showImageLoadingWarning.value = false
}

onMounted(async () => {
  if (modalRef.value) modalRef.value.focus()
  if (!form.value.id || !imageLoadExpected.value) return

  const monstersStore = useMonstersStore()
  isLoadingImages.value = true
  startImageLoadingWarning()
  try {
    const updated = await monstersStore.loadMonsterImageData(form.value.id)
    if (updated) {
      if (!form.value.mapImageData && updated.mapImageData) {
        form.value.mapImageData = updated.mapImageData
      }
      form.value.mapImageUpdatedAt = normalizeDateTime(updated.mapImageUpdatedAt)
      if (!form.value.monsterImageData && updated.monsterImageData) {
        form.value.monsterImageData = updated.monsterImageData
      }
      form.value.monsterImageUpdatedAt = normalizeDateTime(updated.monsterImageUpdatedAt)
    }
  } finally {
    isLoadingImages.value = false
    stopImageLoadingWarning()
  }
})

const isJobPickerVisible = ref(false)
const jobPickerBase = ref(null)
const jobPickerLevel = ref(null)

const removeJob = (idx) => { form.value.jobs.splice(idx, 1) }

const confirmJobWithLevel = (jobBase, level) => {
  if (jobBase && level) {
    const fullJob = `${jobBase}${String(level).padStart(2, '0')}`
    if (!form.value.jobs.includes(fullJob)) {
      form.value.jobs.push(fullJob)
    }
  }
  isJobPickerVisible.value = false
  jobPickerBase.value = null
  jobPickerLevel.value = null
}

const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('讀取檔案失敗'))
    reader.readAsDataURL(file)
  })
}

const clearMapImage = () => {
  form.value.mapImageData = ''
  form.value.mapImageUpdatedAt = null
  form.value.hasMap = false
  if (form.value.id) sessionStorage.removeItem(`monster-map-${form.value.id}`)
}

const clearMonsterImage = () => {
  form.value.monsterImageData = ''
  form.value.monsterImageUpdatedAt = null
  form.value.hasMonsterImage = false
  if (form.value.id) sessionStorage.removeItem(`monster-map-${form.value.id}`)
}

const fuzzyMapMatch = (rawMap) => {
  const norm = rawMap.replace(/[\s]/g, '')
  if (simplifiedToTraditional[norm]) return simplifiedToTraditional[norm]
  const allMapList = Object.values(MAP_DATA).flat()
  const exact = allMapList.find(m => m.replace(/[\s]/g, '').toLowerCase() === norm.toLowerCase())
  if (exact) return exact

  const threshold = matchAccuracy.value / 100
  const includes = allMapList.find(m => {
    const has1 = norm.toLowerCase().includes(m.replace(/[\s]/g, '').toLowerCase())
    const has2 = m.replace(/[\s]/g, '').toLowerCase().includes(norm.toLowerCase())
    if (has1 || has2) return true
    if (threshold < 1) {
      const len = Math.max(norm.length, m.replace(/[\s]/g, '').length)
      const same = (norm.match(new RegExp(m.replace(/[\s]/g, ''), 'i')) || []).length > 0
      return same && threshold <= 0.95
    }
    return false
  })
  return includes || rawMap
}

const getVersionByMap = (mapName) => {
  if (!mapName) return null
  const normalized = mapName.trim()
  for (const [version, maps] of Object.entries(MAP_DATA)) {
    if (maps.includes(normalized)) return version
  }
  return null
}

const extractLocationFromLine = (line) => {
  const parts = line.split(/\t+/).map(p => p.trim()).filter(Boolean)
  let map = null, x = null, y = null, z = null
  const coordPattern = /(.+?)\s*\(?\s*[Xx][:：]\s*([0-9.]+)\s*[,，]?\s*[Yy][:：]\s*([0-9.]+)(?:\s*[,，]?\s*[Zz][:：]\s*([0-9.]+))?\s*\)?/
  const coordIndex = parts.findIndex(p => coordPattern.test(p))

  if (coordIndex !== -1) {
    const coordPart = parts[coordIndex]
    const m = coordPart.match(coordPattern)
    if (m) {
      map = m[1].trim() || null
      x = parseFloat(m[2])
      y = parseFloat(m[3])
      z = m[4] != null ? parseFloat(m[4]) : null
      if (!map && coordIndex > 0) map = parts[coordIndex - 1]
      if (!map || /^\d+$/.test(map)) {
        for (let i = coordIndex - 1; i >= 0; i--) {
          if (!/^\d+$/.test(parts[i]) && !/^[\d.]+$/.test(parts[i])) {
            map = parts[i]
            break
          }
        }
      }
    }
  } else {
    let m
    while ((m = coordPattern.exec(line)) !== null) {
      map = m[1].trim()
      x = parseFloat(m[2])
      y = parseFloat(m[3])
      z = m[4] != null ? parseFloat(m[4]) : null
      break
    }
  }

  if (!map || isNaN(x) || isNaN(y)) {
    const dungeon = findDungeonFromText(line)
    return dungeon ? { map: dungeon, type: 'dungeon' } : null
  }
  return { map: fuzzyMapMatch(map), x, y, z, type: 'map' }
}

const coordTestPattern = /[Xx][:：]\s*([0-9]+(?:\.[0-9]+)?)\s*[,，]?\s*[Yy][:：]\s*([0-9]+(?:\.[0-9]+)?)/
const toTraditional = (text) => text ? (simplifiedToTraditional[text] || text) : text

const findDungeonFromText = (text) => {
  if (!text) return null
  const normalized = toTraditional(text).replace(/\s+/g, '').toLowerCase()
  const matched = DUNGEON_MAPS.find(d => normalized.includes(d.replace(/\s+/g, '').toLowerCase()))
  if (matched) return matched
  const matchedSimple = Object.keys(DUNGEON_MAPS_SIMPLE_MAP).find(d => normalized.includes(d.replace(/\s+/g, '').toLowerCase()))
  return matchedSimple ? DUNGEON_MAPS_SIMPLE_MAP[matchedSimple] : null
}

const parseJobTagFromLine = (line) => {
  const candidates = line.match(/([^\s\d]+?)(\d{1,2})/g) || []
  for (const cand of candidates) {
    const m = cand.match(/^([^\d]+?)(\d{1,2})$/)
    if (!m) continue
    let base = m[1]
    const level = m[2].padStart(2, '0')
    if (simplifiedJobBaseMap[base]) base = simplifiedJobBaseMap[base]
    if (!JOB_BASE_NAMES.includes(base)) {
      const normalized = Object.keys(simplifiedJobBaseMap).find(key => simplifiedJobBaseMap[key] === base)
      if (normalized) base = simplifiedJobBaseMap[normalized]
    }
    if (JOB_BASE_NAMES.includes(base)) return `${base}${level}`
  }
  return null
}

const parseNameFromLine = (line) => {
  const clean = line.replace(/\b\d{3,}\.png\d*\b/gi, '').replace(/\b\d+\.png\b/gi, '').replace(/\.[jJ][pP][eE]?[gG]\b/g, '').replace(/\s{2,}/g, ' ').trim()
  const fields = clean.split(/\t+|\s+/).map(field => field.trim()).filter(Boolean)
  const names = fields.filter(field => {
    const outline = field.replace(/\s+/g, '')
    if (coordTestPattern.test(field) || /([\u4e00-\u9fff]+?)(\d{1,2})/.test(outline) || /^\d+$/.test(field) || /\.(png|jpg|jpeg)$/i.test(field) || /\d{3,}\.png\d*/i.test(field)) return false
    return true
  })
  return names.length > 0 ? toTraditional(names[0]) : null
}

const handleBatchParse = (text) => {
  if (!text) return
  const lines = text.split('\n').map(line => line.trim()).filter(line => line)
  let currentJobTag = null

  lines.forEach(line => {
    if (/通緝令/i.test(line)) form.value.isWanted = true
    if (/命運|fate/i.test(line)) form.value.isFate = true

    const nameCandidate = parseNameFromLine(line)
    if (nameCandidate && !form.value.name) form.value.name = nameCandidate

    const jobTag = parseJobTagFromLine(line)
    if (jobTag) {
      currentJobTag = jobTag
      if (!form.value.jobs.includes(jobTag)) form.value.jobs.push(jobTag)
    }

    const loc = extractLocationFromLine(line)
    if (!loc) return

    const locationVersion = loc.map ? getVersionByMap(loc.map) : null
    if (locationVersion && form.value.version !== locationVersion) form.value.version = locationVersion

    if (!form.value.locations) form.value.locations = []
    const existingLocation = form.value.locations.find(existing => existing.map === loc.map && Number(existing.x) === Number(loc.x) && Number(existing.y) === Number(loc.y))

    if (existingLocation) {
      if ((existingLocation.z == null || existingLocation.z === '') && loc.z != null && loc.z !== '') {
        existingLocation.z = loc.z
      }
    } else {
      form.value.locations.push({
        type: loc.type || 'map',
        map: loc.map || (MAP_DATA[form.value.version] ? MAP_DATA[form.value.version][0] : ''),
        x: loc.x || '',
        y: loc.y || '',
        z: loc.z == null ? '' : loc.z
      })
    }
    if (currentJobTag && !form.value.jobs.includes(currentJobTag)) form.value.jobs.push(currentJobTag)
  })
}

const handleBatchImagePaste = async (event) => {
  const items = event.clipboardData?.items || []
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (!file) continue
      try {
        form.value.mapImageData = await readFileAsDataURL(file)
        form.value.hasMap = true
        form.value.mapImageUpdatedAt = new Date()
      } catch (error) {
        formMessage.value = '貼上圖片失敗，請稍後再試。'
      }
      return
    }
  }
}

const handleMonsterImagePaste = async (event) => {
  const items = event.clipboardData?.items || []
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (!file) continue
      try {
        form.value.monsterImageData = await readFileAsDataURL(file)
        form.value.hasMonsterImage = true
        form.value.monsterImageUpdatedAt = new Date()
      } catch (error) {
        formMessage.value = '貼上怪物照片失敗，請稍後再試。'
      }
      return
    }
  }
}

const handleBatchParseFromPaste = (event) => {
  const text = event.clipboardData?.getData('text') || ''
  handleBatchParse(text)
  if (event.target) event.target.value = ''
}

const saveBlockedMessage = computed(() => {
  if ((isLoadingImages.value || isLoadingMap.value || isLoadingMonster.value) && imageLoadExpected.value && showImageLoadingWarning.value) {
    return '圖片載入中，請等載入完成再按儲存。'
  }
  return ''
})
const modalMessage = computed(() => saveBlockedMessage.value || formMessage.value)

const submit = () => {
  if (saveBlockedMessage.value) {
    formMessage.value = saveBlockedMessage.value
    return
  }
  formMessage.value = ''
  emit('save', {
    ...form.value,
    locations: cleanLocations(form.value.locations)
  })
  closeModal()
}

const addLocation = () => {
  form.value.locations = form.value.locations || []
  const maps = MAP_DATA[form.value.version] || [];
  form.value.locations.push({ map: maps[0] || '', x: '', y: '', z: '', type: 'map' })
}
</script>