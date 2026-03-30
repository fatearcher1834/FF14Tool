<template>
  <div
    ref="modalRef"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    tabindex="0"
    @keydown.esc="closeModal"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-[2.5rem] w-full max-w-lg p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
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
                'flex-1 py-2 rounded-xl text-xs font-black',
                form.rank === r ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
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
        <div v-if="form.rank && form.rank !== 'None'" class="space-y-2">
          <div
            class="w-full h-44 border-2 border-dashed rounded-xl p-2 text-slate-400 text-center text-xs flex items-center justify-center relative"
            tabindex="0"
            @paste.prevent="handleBatchImagePaste($event)"
          >
            <div v-if="!form.mapImageData" class="text-slate-500 text-xs">
              尚未設定地圖
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

        <div v-if="form.rank && form.rank !== 'None'" class="space-y-2">
          <div
            class="w-full h-44 border-2 border-dashed rounded-xl p-2 text-slate-400 text-center text-xs flex items-center justify-center relative"
            tabindex="0"
            @paste.prevent="handleMonsterImagePaste($event)"
          >
            <div v-if="!form.monsterImageData" class="text-slate-500 text-xs">
              尚未設定怪物照片
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

        <div v-if="form.rank && form.rank !== 'None'" class="space-y-2">
          <input
            v-model="form.triggerCondition"
            class="w-full p-3 bg-white border rounded-2xl font-bold text-xs outline-none "
            placeholder="觸發條件"
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
                <button v-for="level in 50" :key="level" @click="confirmJobWithLevel(jobPickerBase, level)" :class="['py-2 px-1 rounded-lg text-[10px] font-black transition-all', jobPickerLevel === level ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white']">
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
            <!--
            <div class="flex items-center gap-2 text-[12px] text-slate-500">
              <span class="whitespace-nowrap">匹配精確度：</span>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                v-model="matchAccuracy"
                class="w-full"
              />
              <span class="w-10 text-right">{{ matchAccuracy }}%</span>
            </div>
            -->
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
            </template>

            <button @click="form.locations.splice(i, 1)" class="p-2 text-slate-300 hover:text-red-500">
              <X :size="14" />
            </button>
          </div>
          <button @click="addLocation" class="w-full p-4 border-2 border-dashed rounded-2xl text-slate-400 text-xs font-black">+ 新增座標</button>
        </div>
        <!-- 按鈕 -->
        <div class="flex gap-3 pt-4">
          <button @click="$emit('close')" class="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs">取消</button>
          <button @click="submit" class="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg">儲存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMonstersStore } from '@/stores/monsters.store'
import { X } from 'lucide-vue-next'
import { MAP_DATA, VERSIONS, ALL_REGIONS, JOB_BASE_NAMES, DUNGEON_MAPS } from '@/config/constants'
import { DUNGEON_MAPS_SIMPLE_MAP, simplifiedToTraditional, simplifiedJobBaseMap } from '@/config/locale-translation'
// 取得非當前版本地圖
const otherRegions = (version) => {
  const current = MAP_DATA[version] || [];
  return ALL_REGIONS.filter(r => !current.includes(r));
}

const props = defineProps({
  monster: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

const modalRef = ref(null)

const jobSuffixes = Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, '0'))

const normalizeLocations = (locations = [], version = VERSIONS[0]) => {
  const maps = MAP_DATA[version] || []
  return locations.map((loc) => ({
    type: loc.type === 'dungeon' ? 'dungeon' : 'map',
    map: loc.map || (loc.type === 'dungeon' ? '' : maps[0] || ''),
    x: loc.x || '',
    y: loc.y || ''
  }))
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
  triggerCondition: props.monster.triggerCondition || '',
  locations: normalizeLocations(Array.isArray(props.monster.locations) ? [...props.monster.locations] : [], props.monster.version || VERSIONS[0])
})
const matchAccuracy = ref(90)


const closeModal = () => {
  emit('close')
}

const isManualLoadMap = ref(false)
const isLoadingMap = ref(false)
const isLoadingMonster = ref(false)

const loadMapImageDataNow = async () => {
  if (!form.value.id) return
  isLoadingMap.value = true
  try {
    const monstersStore = useMonstersStore()
    const updated = await monstersStore.loadMonsterImageData(form.value.id)
    if (updated) {
      if (updated.mapImageData) {
        form.value.mapImageData = updated.mapImageData
      }
      form.value.mapImageUpdatedAt = normalizeDateTime(updated.mapImageUpdatedAt || form.value.mapImageUpdatedAt)
      form.value.hasMap = true
      isManualLoadMap.value = true
    }
  } finally {
    isLoadingMap.value = false
  }
}

const loadMonsterImageDataNow = async () => {
  if (!form.value.id) return
  isLoadingMonster.value = true
  try {
    const monstersStore = useMonstersStore()
    const updated = await monstersStore.loadMonsterImageData(form.value.id)
    if (updated) {
      if (updated.monsterImageData) {
        form.value.monsterImageData = updated.monsterImageData
      }
      form.value.monsterImageUpdatedAt = normalizeDateTime(updated.monsterImageUpdatedAt || form.value.monsterImageUpdatedAt)
      form.value.hasMonsterImage = true
    }
  } finally {
    isLoadingMonster.value = false
  }
}

onMounted(async () => {
  if (modalRef.value) {
    modalRef.value.focus()
  }

  if (!form.value.id) {
    return
  }

  const monstersStore = useMonstersStore()

  // 直接讀取最新的圖片數據
  console.log('[編輯模態] 載入圖片數據...');
  const updated = await monstersStore.loadMonsterImageData(form.value.id)

  if (updated) {
    if (updated.mapImageData) {
      form.value.mapImageData = updated.mapImageData
    }
    form.value.mapImageUpdatedAt = normalizeDateTime(updated.mapImageUpdatedAt)
    if (updated.monsterImageData) {
      form.value.monsterImageData = updated.monsterImageData
    }
    form.value.monsterImageUpdatedAt = normalizeDateTime(updated.monsterImageUpdatedAt)
  }
})
const isJobPickerVisible = ref(false)
const jobPickerBase = ref(null)
const jobPickerLevel = ref(null)

// 比照批量新增九宮格選擇器
const removeJob = (idx) => {
  form.value.jobs.splice(idx, 1)
}

const selectJobBase = (job) => {
  jobPickerBase.value = job
}

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
  console.log('[地圖清除] 正在清除地圖資料');
  form.value.mapImageData = ''
  form.value.mapImageUpdatedAt = null
  
  // 也要清除 sessionStorage 緩存以防止重新編輯時回復舊值
  if (form.value.id) {
    try {
      sessionStorage.removeItem(`monster-map-${form.value.id}`)
      console.log('[地圖清除] ✓ 已清除 sessionStorage 緩存');
    } catch (error) {
      console.warn('[地圖清除] 清除緩存失敗:', error);
    }
  }
}

const clearMonsterImage = () => {
  console.log('[怪物照片清除] 正在清除怪物照片資料');
  form.value.monsterImageData = ''
  form.value.monsterImageUpdatedAt = null
  
  // 也要清除 sessionStorage 緩存以防止重新編輯時回復舊值
  if (form.value.id) {
    try {
      sessionStorage.removeItem(`monster-map-${form.value.id}`)
      console.log('[怪物照片清除] ✓ 已清除 sessionStorage 緩存');
    } catch (error) {
      console.warn('[怪物照片清除] 清除緩存失敗:', error);
    }
  }
}

const fuzzyMapMatch = (rawMap) => {
  const norm = rawMap.replace(/[\s]/g, '')
  if (simplifiedToTraditional[norm]) return simplifiedToTraditional[norm]
    const allMapList = Object.values(MAP_DATA).flat()
  const exact = allMapList.find(m => m.replace(/[\s]/g, '').toLowerCase() === norm.toLowerCase())
  if (exact) return exact

  // 依 matchAccuracy 決定寬鬆度
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

const extractLocationFromLine = (line) => {
  // 優先處理制表符分隔資料（人為輸入可能包含多欄）
  const parts = line.split(/\t+/).map(p => p.trim()).filter(Boolean)

  let map = null
  let x = null
  let y = null

  const coordPattern = /(.+?)\s*\(?\s*[Xx][:：]\s*([0-9.]+)\s*[,，]?\s*[Yy][:：]\s*([0-9.]+)\s*\)?/

  const coordIndex = parts.findIndex(p => coordPattern.test(p))
  if (coordIndex !== -1) {
    const coordPart = parts[coordIndex]
    const m = coordPart.match(coordPattern)
    if (m) {
      map = m[1].trim() || null
      x = parseFloat(m[2])
      y = parseFloat(m[3])

      // 如果座標內 map 為空，嘗試從上一列取值（可能是地圖名）
      if (!map && coordIndex > 0) {
        map = parts[coordIndex - 1]
      }

      // 如果仍然不是地图集，进一步回溯查找非数值字符串
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
    // 沒有制表符、或不符合理想結構，退回整行解析
    let m
    while ((m = coordPattern.exec(line)) !== null) {
      map = m[1].trim()
      x = parseFloat(m[2])
      y = parseFloat(m[3])
      break
    }
  }

  if (!map || isNaN(x) || isNaN(y)) {
    const dungeon = findDungeonFromText(line)
    if (dungeon) {
      return { map: dungeon, type: 'dungeon' }
    }
    return null
  }

  map = fuzzyMapMatch(map)
  return { map, x, y, type: 'map' }
}

const coordTestPattern = /[Xx][:：]\s*([0-9]+(?:\.[0-9]+)?)\s*[,，]?\s*[Yy][:：]\s*([0-9]+(?:\.[0-9]+)?)/

const toTraditional = (text) => {
  if (!text) return text
  const mapping = simplifiedToTraditional[text]
  return mapping || text
}

const findDungeonFromText = (text) => {
  if (!text) return null
  const normalized = toTraditional(text).replace(/\s+/g, '').toLowerCase()
  const matched = DUNGEON_MAPS.find(d => normalized.includes(d.replace(/\s+/g, '').toLowerCase()))
  if (matched) return matched

  const matchedSimple = Object.keys(DUNGEON_MAPS_SIMPLE_MAP).find(d => normalized.includes(d.replace(/\s+/g, '').toLowerCase()))
  if (matchedSimple) return DUNGEON_MAPS_SIMPLE_MAP[matchedSimple]

  return null
}

const parseJobTagFromLine = (line) => {
  const candidates = line.match(/([^\s\d]+?)(\d{1,2})/g) || []
  for (const cand of candidates) {
    const m = cand.match(/^([^\d]+?)(\d{1,2})$/)
    if (!m) continue

    let base = m[1]
    const level = m[2].padStart(2, '0')

    if (simplifiedJobBaseMap[base]) {
      base = simplifiedJobBaseMap[base]
    }

    // 兼容正體職業名
    if (!JOB_BASE_NAMES.includes(base)) {
      const normalized = Object.keys(simplifiedJobBaseMap).find(key => simplifiedJobBaseMap[key] === base)
      if (normalized) base = simplifiedJobBaseMap[normalized]
    }

    if (JOB_BASE_NAMES.includes(base)) {
      return `${base}${level}`
    }
  }

  return null
}

const parseNameFromLine = (line) => {
  const clean = line
    .replace(/\b\d{3,}\.png\d*\b/gi, '')
    .replace(/\b\d+\.png\b/gi, '')
    .replace(/\.[jJ][pP][eE]?[gG]\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const fields = clean.split(/\t+|\s+/).map(field => field.trim()).filter(Boolean)
  const names = fields.filter(field => {
    const outline = field.replace(/\s+/g, '')
    if (coordTestPattern.test(field)) return false
    if (/([\u4e00-\u9fff]+?)(\d{1,2})/.test(outline)) return false
    if (/^\d+$/.test(field)) return false
    if (/\.(png|jpg|jpeg)$/i.test(field) || /\d{3,}\.png\d*/i.test(field)) return false
    return true
  })

  return names.length > 0 ? toTraditional(names[0]) : null
}

const handleBatchParse = (text) => {
  if (!text) return

  const lines = text.split('\n').map(line => line.trim()).filter(line => line)

  let currentJobTag = null

  lines.forEach(line => {
    const nameCandidate = parseNameFromLine(line)
    if (nameCandidate && !form.value.name) {
      form.value.name = nameCandidate
    }

    const jobTag = parseJobTagFromLine(line)
    if (jobTag) {
      currentJobTag = jobTag
      if (!form.value.jobs.includes(jobTag)) {
        form.value.jobs.push(jobTag)
      }
    }

    const loc = extractLocationFromLine(line)
    if (!loc) return

    if (!form.value.locations) form.value.locations = []

    const exists = form.value.locations.some(existing =>
      existing.map === loc.map && Number(existing.x) === Number(loc.x) && Number(existing.y) === Number(loc.y)
    )

    if (!exists) {
      form.value.locations.push({
        type: loc.type || 'map',
        map: loc.map || (MAP_DATA[form.value.version] ? MAP_DATA[form.value.version][0] : ''),
        x: loc.x || '',
        y: loc.y || ''
      })
    }

    if (currentJobTag && !form.value.jobs.includes(currentJobTag)) {
      form.value.jobs.push(currentJobTag)
    }
  })
}

const handleBatchImagePaste = async (event) => {
  const items = event.clipboardData?.items || []
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (!file) continue
      try {
        let dataUrl = await readFileAsDataURL(file)
        form.value.mapImageData = dataUrl
        form.value.hasMap = true
        form.value.mapImageUpdatedAt = new Date()
      } catch (error) {
        console.error('貼上圖片失敗', error)
        alert('貼上圖片失敗，請稍後再試。')
      }
      // 只處理第一張圖片
      return
    }
  }
}

const handleMonsterImagePaste = async (event) => {
  const items = event.clipboardData?.items || []
  console.log('[怪物照片粘貼] 開始處理...', items.length, '項目')
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (!file) {
        console.warn('[怪物照片粘貼] 無法取得文件')
        continue
      }
      try {
        console.log('[怪物照片粘貼] 文件:', file.name, '大小:', (file.size / 1024).toFixed(2), 'KB')
        let dataUrl = await readFileAsDataURL(file)
        console.log('[怪物照片粘貼] 轉換為 DataURL 完成, 大小:', (dataUrl.length / 1024).toFixed(2), 'KB')
        
        form.value.monsterImageData = dataUrl
        form.value.hasMonsterImage = true
        form.value.monsterImageUpdatedAt = new Date()
        console.log('[怪物照片粘貼] ✓ 已設定到表單', {
          hasData: !!form.value.monsterImageData,
          dataSize: form.value.monsterImageData.length,
          hasMonsterImage: form.value.hasMonsterImage,
          timestamp: form.value.monsterImageUpdatedAt
        })
      } catch (error) {
        console.error('[怪物照片粘貼] ✗ 失敗:', error)
        alert('貼上怪物照片失敗，請稍後再試。')
      }
      // 只處理第一張圖片
      return
    }
  }
  console.warn('[怪物照片粘貼] 未找到圖片文件')
}

const handleBatchParseFromPaste = (event) => {
  const text = event.clipboardData?.getData('text') || ''
  handleBatchParse(text)
  if (event.target) {
    event.target.value = ''
  }
}

const submit = () => {
  console.log('[表單提交] monsterImageData 大小:', form.value.monsterImageData?.length || 0, 'bytes, hasMonsterImage:', form.value.hasMonsterImage)
  if (form.value.monsterImageData) {
    console.log('[表單提交] ✓ 欲提交怪物照片:', (form.value.monsterImageData.length / 1024).toFixed(2), 'KB')
  }
  emit('save', form.value)
  closeModal()
}

const addLocation = () => {
  form.value.locations = form.value.locations || []
  // 預設 map 為目前版本第一個地圖
  const maps = MAP_DATA[form.value.version] || [];
  form.value.locations.push({ map: maps[0] || '', x: '', y: '', type: 'map' })
}
</script>

// VERSIONS 已由 constants.js 導出
