<template>
  <div
    ref="modalRef"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    tabindex="0"
    @keydown.esc="closeModal"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[95vh]">
      <div class="flex justify-between items-center">
        <h3 class="text-2xl font-black text-slate-900 tracking-tighter uppercase"> 批量新增怪物 </h3>
        <button @click="$emit('close')" class="p-2 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-100 transition-all">
          <X :size="16" />
        </button>
      </div>

      <!-- 配置區域 -->
      <div class="bg-slate-50 p-4 rounded-[2rem] border border-slate-200 space-y-3">
        <!-- 版本 -->
        <div class="flex gap-3">
          <select v-model="config.version" class="flex-1 p-3 bg-white border rounded-2xl font-bold text-sm outline-none">
            <option v-for="v in VERSIONS" :key="v" :value="v">版本 {{ v }}</option>
          </select>
        </div>

        <!-- 等級和 FATE -->
        <div class="flex gap-3 items-center">
          <div class="flex-1 flex bg-white p-1 border rounded-2xl shadow-sm">
            <button v-for="rank in ['None', 'B', 'A', 'S', 'SS']" :key="rank" @click="config.rank = rank === 'None' ? 'None' : rank" :class="['flex-1 py-2 rounded-xl text-[12px] font-black', config.rank === (rank === 'None' ? 'None' : rank) ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50']">
              {{ rank === 'None' ? '一般' : rank }}
            </button>
          </div>
          <button @click="config.isFate = !config.isFate" :class="['px-4 py-2 rounded-2xl text-[14px] font-black border', config.isFate ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-slate-400']">
            FATE
          </button>
          <button @click="config.isWanted = !config.isWanted" :class="['px-4 py-2 rounded-2xl text-[14px] font-black border', config.isWanted ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-400']">
            通緝令
          </button>
        </div>
        <div v-if="config.rank && config.rank !== 'None'" class="space-y-2">
          <label class="text-[10px] font-black text-slate-400 ml-1 uppercase">貼上地圖圖片 (B/A/S/SS)</label>
          <div
            class="w-full h-36 border-2 border-dashed rounded-xl p-2 text-slate-400 text-center text-xs flex items-center justify-center relative"
            tabindex="0"
            @paste.prevent="handleBatchImagePaste($event)"
          >
            <div v-if="!config.mapImageData">在此處按 Ctrl+V 貼上圖片</div>
            <img
              v-if="config.mapImageData"
              :src="config.mapImageData"
              alt="地圖預覽"
              class="absolute inset-0 m-auto max-h-full max-w-full"
            />
            <button
              v-if="config.mapImageData"
              @click.prevent="clearBatchMapImage"
              class="absolute top-1 right-1 px-2 py-1 text-[10px] bg-red-500 text-white rounded"
            >
              移除圖片
            </button>
          </div>
          <p class="text-[10px] text-slate-500">僅在有等級時顯示並保留圖片，坐標解析不受影響。</p>
        </div>


        <!-- 討伐筆記 -->
        <div class="flex flex-wrap gap-2 items-center">
          <div v-if="config.jobs.length > 0">
            <div v-for="(job, idx) in config.jobs" :key="idx" class="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-black">
              <span>{{ job }}</span>
              <button @click="config.jobs.splice(idx, 1)" class="ml-1 hover:bg-blue-600 rounded-full p-0.5">
                <X :size="12" />
              </button>
            </div>
          </div>
          <button @click="showJobPicker = true" class="px-3 py-1 rounded-full text-xs font-black border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50">
            + 討伐筆記
          </button>
        </div>

        <!-- 討伐筆記九宮格選擇器 -->
        <div v-if="showJobPicker" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div class="bg-white rounded-[2rem] w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div class="flex justify-between items-center">
              <h4 class="text-lg font-black text-slate-900">選擇討伐筆記</h4>
              <button @click="showJobPicker = false; selectedJobBase = null; selectedJobLevel = null" class="p-1 bg-slate-100 rounded-full hover:bg-slate-200">
                <X :size="18" />
              </button>
            </div>
            <!-- 職業九宮格 -->
            <div v-if="!selectedJobBase" class="space-y-3">
              <div class="grid grid-cols-3 gap-2">
                <button v-for="job in JOB_BASE_NAMES" :key="job" @click="selectedJobBase = job" class="py-3 px-2 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all">
                  {{ job }}
                </button>
              </div>
            </div>
            <!-- 編號格子選擇 -->
            <div v-if="selectedJobBase" class="space-y-3">
              <div class="flex items-center gap-2">
                <button @click="selectedJobBase = null" class="p-1 hover:bg-slate-100 rounded transition-colors">
                  <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <h5 class="text-sm font-black text-slate-900">{{ selectedJobBase }} - 選擇層級 (1~50)</h5>
              </div>
              <div class="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto">
                <button v-for="level in 50" :key="level" @click="confirmJobWithLevel(selectedJobBase, level)" :class="['py-2 px-1 rounded-lg text-[10px] font-black transition-all', selectedJobLevel === level ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white']">
                  {{ level }}
                </button>
              </div>
              <div v-if="selectedJobBase && selectedJobLevel" class="flex gap-2 mt-3">
                <button @click="selectedJobBase = null; selectedJobLevel = null" class="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-xs transition-all">取消</button>
                <button @click="confirmJobWithLevel(selectedJobBase, selectedJobLevel)" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700">確認新增</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- 輸入與預覽區域 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- 左：輸入面板 -->
        <div class="flex flex-col space-y-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ props.monsterMode ? '請貼上怪物資料：名稱、標籤(如斧術師21)、位置(X/Y)' : '名稱輸入' }}</label>
          <textarea
            v-model="bulkInput"
            class="flex-1 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] font-bold text-sm resize-none"
            placeholder="例如：劍術師01 石殼蟹 拉諾西亞高地 (X: 13.6, Y: 24.3)"
            @paste.prevent="handleBatchImagePaste($event)"
          />
        </div>

        <!-- 右：預覽面板 -->
        <div class="flex flex-col space-y-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">預覽 ({{ bulkParsedList.length }})</label>
          <div class="flex-1 p-4 bg-slate-100 rounded-[2rem] overflow-y-auto space-y-2 border">
            <div v-for="(entry, idx) in bulkParsedList" :key="idx" class="bg-white p-3 rounded-2xl border shadow-sm">
              <div class="flex items-center justify-between">
                <span class="text-sm font-black text-slate-700">{{ typeof entry === 'string' ? entry : entry.name }}</span>
                <div class="flex gap-1 items-center scale-75 origin-right">
                  <VersionTag :version="config.version" />
                  <RankTag :rank="config.rank" />
                  <FateTag v-if="config.isFate" :is-fate="true" />
                  <div v-for="job in (typeof entry === 'string' ? config.jobs : entry.jobs)" :key="job" class="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-black">{{ job }}</div>
                </div>
              </div>
              <div v-if="typeof entry !== 'string' && entry.locations && entry.locations.length > 0" class="text-xs text-slate-500 mt-1">
                位置：<span v-for="(l, li) in entry.locations" :key="li" class="mr-2">
                  <span v-if="l.type === 'map'">{{ l.map }} (X: {{ l.x }}, Y: {{ l.y }})</span>
                  <span v-else-if="l.type === 'dungeon'">副本：{{ l.map }}</span>
                </span>
              </div>
              <div v-if="typeof entry !== 'string' && entry.otherLocations && entry.otherLocations.length > 0" class="text-xs text-amber-500 mt-1">
                其他版本（副本）：<span v-for="(d, di) in entry.otherLocations" :key="di" class="mr-2">{{ d }}</span>
              </div>
              <div v-if="config.mapImageUrl && config.rank !== 'None'" class="text-xs text-emerald-500 mt-1">
                地圖圖片 URL：<a :href="config.mapImageUrl" class="underline" target="_blank" rel="noopener">查看</a>
              </div>
            </div>
            <div v-if="bulkParsedList.length === 0" class="text-slate-500 text-center py-8 text-xs">輸入名稱後會在此預覽</div>
          </div>
        </div>
      </div>

      <!-- 按鈕 -->
      <div class="flex gap-3 pt-4 border-t border-slate-200">
        <button @click="parseNames" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs">解析名稱 →</button>
        <button @click="submit" :disabled="!canSubmit" :class="['w-full px-4 py-2.5 rounded-2xl font-black text-xs', canSubmit ? 'bg-amber-500 text-white shadow-xl hover:bg-amber-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed']">
          確認批量新增
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { VERSIONS, JOB_BASE_NAMES, JOB_SUFFIXES, MAP_DATA, DUNGEON_MAPS, DUNGEON_MAPS_TRAD } from '@/config/constants'
import { DUNGEON_MAPS_SIMPLE_MAP, simplifiedJobBaseMap } from '@/config/locale-translation'
import { simplifiedToTraditional as utilSimplifiedToTraditional, findBestMapMatch, calculateSimilarity } from '@/services/hunterUtils'
import { useUserStore } from '@/stores/user.store'
import { getDb } from '@/services/firebase'
import { collection, query, where, getDocs, setDoc, updateDoc, doc } from 'firebase/firestore'
import VersionTag from '@/components/VersionTag.vue'
import RankTag from '@/components/RankTag.vue'
import FateTag from '@/components/FateTag.vue'

const props = defineProps({
  monsterMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

const modalRef = ref(null)
const userStore = useUserStore()
const bulkInput = ref('')
const showJobPicker = ref(false)
const selectedJobBase = ref(null)
const selectedJobLevel = ref(null)
const bulkParsedList = ref([])
const showPasteCoords = ref(false)
const pasteCoordText = ref('')
const similarityThreshold = ref(70)

const config = ref({
  version: '2.0',
  rank: 'None',
  isFate: false,
  isWanted: false,
  mapImageUrl: '',
  mapImageData: '',
  jobs: []
})

const normalizeJobName = (name) => {
  if (!name) return name
  const normalized = (name || '').trim()
  if (simplifiedJobBaseMap[normalized]) {
    return simplifiedJobBaseMap[normalized]
  }
  return normalized
}

const closeModal = () => {
  emit('close')
}

onMounted(() => {
  if (modalRef.value) {
    modalRef.value.focus()
  }
})

const getMapsForVersion = (version) => {
  return MAP_DATA[version] || []
}

const canSubmit = computed(() => {
  return bulkParsedList.value.length > 0
})

const confirmJobWithLevel = (jobBase, level) => {
  const fullJob = `${jobBase}${level.toString().padStart(2, '0')}`
  if (!config.value.jobs.includes(fullJob)) {
    config.value.jobs.push(fullJob)
  }
  showJobPicker.value = false
  selectedJobBase.value = null
  selectedJobLevel.value = null
}

const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('讀取檔案失敗'))
    reader.readAsDataURL(file)
  })
}

const handleBatchMapImageFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  try {
    const dataUrl = await readFileAsDataURL(file)
    config.value.mapImageData = dataUrl
    config.value.mapImageUrl = ''
  } catch (error) {
    console.error('載入地圖圖片失敗', error)
    alert('載入地圖圖片失敗，請重試。')
  }
}

const clearBatchMapImage = () => {
  config.value.mapImageData = ''
}

const handleBatchImagePaste = async (event) => {
  const items = event.clipboardData?.items || []
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (!file) continue
      try {
        const dataUrl = await readFileAsDataURL(file)
        config.value.mapImageData = dataUrl
        config.value.mapImageUrl = ''
      } catch (error) {
        console.error('貼上圖片失敗', error)
        alert('貼上圖片失敗，請稍後再試。')
      }
      return
    }
  }
}

const coordPattern = /([Xx][:：]\s*([0-9]+(?:\.[0-9]+)?)\s*[,，]?\s*[Yy][:：]\s*([0-9]+(?:\.[0-9]+)?))\s*/g
const coordTestPattern = /[Xx][:：]\s*([0-9]+(?:\.[0-9]+)?)\s*[,，]?\s*[Yy][:：]\s*([0-9]+(?:\.[0-9]+)?)/

const findMapFromText = (text) => {
  const normalized = utilSimplifiedToTraditional(text || '').replace(/\s+/g, '').toLowerCase()
  if (!normalized) return ''

  // 優先本版本地圖精準匹配
  const mapsForVersion = MAP_DATA[config.value.version] || []
  const exactVersion = mapsForVersion.find(m => normalized.includes(m.replace(/\s+/g, '').toLowerCase()))
  if (exactVersion) return exactVersion

  // 副本地圖（如果行中出現可識別副本名稱）
  const dungeonTrad = DUNGEON_MAPS_TRAD.find(m => normalized.includes(m.replace(/\s+/g, '').toLowerCase()))
  if (dungeonTrad) return '其他版本（副本）'
  const dungeonSimple = Object.keys(DUNGEON_MAPS_SIMPLE_MAP).find(m => normalized.includes(m.replace(/\s+/g, '').toLowerCase()))
  if (dungeonSimple) return '其他版本（副本）'

  // 再做模糊匹配本版本
  const candidate = mapsForVersion
    .map(m => ({ map: m, similarity: calculateSimilarity(normalized, m.replace(/\s+/g, '').toLowerCase()) }))
    .sort((a, b) => b.similarity - a.similarity)[0]

  if (candidate && candidate.similarity >= 75) {
    return candidate.map
  }

  return ''
}

const parseLocationsFromLine = (line) => {
  const locations = []
  const pattern = /(.+?)\s*\(?\s*[Xx][:：]\s*([0-9]+(?:\.[0-9]+)?)\s*[,，]?\s*[Yy][:：]\s*([0-9]+(?:\.[0-9]+)?)\s*\)?/g
  let m

  while ((m = pattern.exec(line)) !== null) {
    const x = parseFloat(m[2])
    const y = parseFloat(m[3])
    if (Number.isNaN(x) || Number.isNaN(y)) continue

    // 這裡直接用匹配的第一組文字最接近地圖名稱
    let mapCandidate = utilSimplifiedToTraditional(m[1].trim())
    if (!mapCandidate) {
      mapCandidate = findMapFromText(line.slice(0, m.index))
    }
    const map = findMapFromText(mapCandidate)
    if (!map) continue

    locations.push({ map, x, y, type: 'map' })
  }

  // 偵測純副本行：沒座標時 supplementary
  const normalizedLine = utilSimplifiedToTraditional(line).replace(/\s+/g, '').toLowerCase()
  const dungeon = DUNGEON_MAPS_TRAD.find(d => normalizedLine.includes(d.replace(/\s+/g, '').toLowerCase()))
  if (dungeon && locations.length === 0) {
    locations.push({ map: dungeon, type: 'dungeon' })
  }

  return locations
}

const parseJobTagsFromLine = (line) => {
  const jobs = []
  const normalizedLine = line.replace(/\s+/g, '')
  const regex = /([\u4e00-\u9fff]+?)(\d{1,2})/g
  let m
  while ((m = regex.exec(normalizedLine)) !== null) {
    let base = m[1].trim()
    const level = m[2].padStart(2, '0')
    base = normalizeJobName(base)
    if (JOB_BASE_NAMES.includes(base)) {
      const jobTag = `${base}${level}`
      if (!jobs.includes(jobTag)) jobs.push(jobTag)
    }
  }
  return jobs
}

const parseLine = (line) => {
  let normLine = line.trim()
  if (!normLine) return null

  // 去除常見噪音：圖片編號、PNG 檔、每行末尾置放流水等
  normLine = normLine
    .replace(/\b\d{3,}\.png\d*\b/gi, '')
    .replace(/\b\d+\.png\b/gi, '')
    .replace(/\b065001\.png\d*\b/gi, '')
    .replace(/\.[jJ][pP][eE]?[gG]\b/g, '')
    .replace(/\s{2,}/g, ' ').trim()

  if (!normLine) return null

  const jobs = parseJobTagsFromLine(normLine)
  const locations = parseLocationsFromLine(normLine)

  // 手動拆欄位，優先按 tab
  const fields = normLine
    .split(/[\t ]+/)
    .map(f => f.trim())
    .filter(Boolean)

  // 移除坐標片段及職業 tag
  const candidateFields = fields.filter(field => {
    const noCoord = !coordTestPattern.test(field)
    const noJob = !/([\u4e00-\u9fff]+?)(\d{1,2})/.test(field.replace(/\s+/g, ''))
    const notNumber = !/^\d+$/.test(field)
    const noImageTag = !/\.(png|jpg|jpeg)$/i.test(field) && !/\d{3,}\.png\d*/i.test(field)
    return noCoord && noJob && notNumber && noImageTag
  })

  const hasName = candidateFields.length > 0
  const nameCandidate = hasName
    ? candidateFields.find(f => !jobs.some(j => f.includes(j.replace(/\d+$/, '')))) || candidateFields[0]
    : ''

  const name = utilSimplifiedToTraditional((nameCandidate || '').trim())
  const isCoordinateOnly = !hasName && jobs.length === 0 && locations.length > 0

  if (isCoordinateOnly) {
    return {
      name: '',
      jobs: [],
      locations,
      isCoordinateOnly: true
    }
  }

  const finalName = name || ''

  return {
    name: finalName,
    jobs: jobs.length > 0 ? jobs : [],
    locations: locations.length > 0 ? locations : [],
    isCoordinateOnly: false
  }
}

const parseNames = () => {
  const lines = bulkInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  if (props.monsterMode) {
    const parsedEntries = []
    let current = null

    for (const rawLine of lines) {
      const line = rawLine
        .replace(/\b\d{3,}\.png\d*\b/gi, '')
        .replace(/\b\d+\.png\b/gi, '')
        .replace(/\.[jJ][pP][eE]?[gG]\b/g, '')
        .replace(/\s{2,}/g, ' ') 
        .trim()

      if (!line) continue

      const jobs = parseJobTagsFromLine(line)
      const locations = parseLocationsFromLine(line)

      const fields = line.split(/[\t ]+/).map(f => f.trim()).filter(Boolean)
      const candidateNames = fields.filter(field => {
        const isCoord = coordTestPattern.test(field)
        const isJob = /([\u4e00-\u9fff]+?)(\d{1,2})/.test(field.replace(/\s+/g, ''))
        const isImage = /\.(png|jpg|jpeg)$/i.test(field) || /\d{3,}\.png\d*/i.test(field)
        return !isCoord && !isJob && !/^\d+$/.test(field) && !isImage
      })

      let nameCandidate = candidateNames.length > 0 ? candidateNames[0] : ''
      let name = utilSimplifiedToTraditional(nameCandidate).trim()

      const normalizedLine = utilSimplifiedToTraditional(line).replace(/\s+/g, '').toLowerCase()
      const matchedDungeon = DUNGEON_MAPS_TRAD.find(d => normalizedLine.includes(d.replace(/\s+/g, '').toLowerCase()))
      const shouldMarkDungeon = matchedDungeon && !locations.length

      // 若這行只是座標續行（e.g. 黑衣森林北部林區 (X:21, Y:31)），避免誤當作新怪物名稱
      if (name && locations.length > 0 && locations.some(loc => loc.map === name)) {
        name = ''
      }

      if (name) {
        // 若同名已存在，合併座標與討伐筆記；否則新建
        const existing = parsedEntries.find(entry => entry.name === name)
        if (existing) {
          locations.forEach(loc => {
            if (!existing.locations.some(l => l.map === loc.map && l.x === loc.x && l.y === loc.y)) {
              existing.locations.push(loc)
            }
          })
          jobs.forEach(job => {
            if (!existing.jobs.includes(job)) {
              existing.jobs.push(job)
            }
          })
          if (shouldMarkDungeon) {
            existing.otherLocations = existing.otherLocations || []
            if (!existing.otherLocations.includes(matchedDungeon)) {
              existing.otherLocations.push(matchedDungeon)
            }
          }
          current = existing
          continue
        }

        current = {
          name,
          jobs: jobs.length > 0 ? jobs : [],
          locations: locations.length > 0 ? locations : [],
          otherLocations: shouldMarkDungeon ? [matchedDungeon] : []
        }
        parsedEntries.push(current)
        continue
      }

      if (!name && locations.length > 0 && current) {
        locations.forEach(loc => {
          if (!current.locations.some(l => l.map === loc.map && l.x === loc.x && l.y === loc.y)) {
            current.locations.push(loc)
          }
        })
        if (jobs.length > 0) {
          jobs.forEach(job => {
            if (!current.jobs.includes(job)) {
              current.jobs.push(job)
            }
          })
        }
        if (shouldMarkDungeon && matchedDungeon) {
          current.otherLocations = current.otherLocations || []
          if (!current.otherLocations.includes(matchedDungeon)) {
            current.otherLocations.push(matchedDungeon)
          }
        }
        continue
      }

      if (!name && shouldMarkDungeon && current) {
        current.otherLocations = current.otherLocations || []
        if (!current.otherLocations.includes(matchedDungeon)) {
          current.otherLocations.push(matchedDungeon)
        }
      }
    }

    bulkParsedList.value = parsedEntries.filter(e => e.name)
  } else {
    bulkParsedList.value = lines
  }
}

const submit = async () => {
  try {
    const db = getDb()
    const now = Date.now()

    for (const entry of bulkParsedList.value) {
      let name
      let entryJobs
      let entryLocations

      let entryOtherLocations = []
      if (typeof entry === 'string') {
        name = utilSimplifiedToTraditional(entry)
        entryJobs = [...config.value.jobs]
        entryLocations = []
      } else {
        name = utilSimplifiedToTraditional(entry.name || '')
        entryJobs = Array.isArray(entry.jobs) ? [...entry.jobs] : [...config.value.jobs]
        entryLocations = Array.isArray(entry.locations) && entry.locations.length > 0 ? [...entry.locations] : []
        if (Array.isArray(entry.otherLocations) && entry.otherLocations.length > 0) {
          entryOtherLocations = [...entry.otherLocations]
        }
      }

      if (!name) continue

      const monsterQuery = query(
        collection(db, 'artifacts', userStore.appId, 'public', 'data', 'monsters'),
        where('name', '==', name)
      )
      const snapshot = await getDocs(monsterQuery)

      if (!snapshot.empty) {
        for (const existingDoc of snapshot.docs) {
          const existing = existingDoc.data()
          const mergeJobs = Array.isArray(existing.jobs) ? [...existing.jobs] : []
          entryJobs.forEach(job => {
            if (job && !mergeJobs.includes(job)) mergeJobs.push(job)
          })

          const updatedLocations = Array.isArray(existing.locations) ? [...existing.locations] : []
          entryLocations.forEach(loc => {
            if (!updatedLocations.some(l => l.map === loc.map && Number(l.x) === Number(loc.x) && Number(l.y) === Number(loc.y))) {
              updatedLocations.push(loc)
            }
          })

          const mergedOtherLocations = Array.isArray(existing.otherLocations) ? [...existing.otherLocations] : []
          entryOtherLocations.forEach(loc => {
            if (!mergedOtherLocations.includes(loc)) {
              mergedOtherLocations.push(loc)
            }
          })

          await updateDoc(existingDoc.ref, {
            rank: config.value.rank || existing.rank || 'None',
            isFate: existing.isFate || config.value.isFate,
            isWanted: existing.isWanted || config.value.isWanted,
            mapImageUrl: config.value.rank && config.value.rank !== 'None' ? (config.value.mapImageUrl || existing.mapImageUrl || null) : null,
            mapImageData: config.value.rank && config.value.rank !== 'None' ? (config.value.mapImageData || existing.mapImageData || null) : null,
            jobs: mergeJobs.length > 0 ? mergeJobs : null,
            locations: updatedLocations.length > 0 ? updatedLocations : [],
            otherLocations: mergedOtherLocations.length > 0 ? mergedOtherLocations : null,
            updatedAt: now
          })
        }
      } else {
        const id = `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        await setDoc(doc(db, 'artifacts', userStore.appId, 'public', 'data', 'monsters', id), {
          id,
          name,
          version: config.value.version,
          rank: config.value.rank,
          isFate: config.value.isFate,
          isWanted: config.value.isWanted,
          mapImageUrl: config.value.rank && config.value.rank !== 'None' ? (config.value.mapImageUrl || null) : null,
          mapImageData: config.value.rank && config.value.rank !== 'None' ? (config.value.mapImageData || null) : null,
          jobs: entryJobs.length > 0 ? entryJobs : null,
          locations: entryLocations.length > 0 ? entryLocations : [],
          otherLocations: entryOtherLocations.length > 0 ? entryOtherLocations : null,
          createdAt: now,
          updatedAt: now
        })
      }
    }

    emit('save')
    closeModal()
  } catch (error) {
    console.error('Batch add failed:', error)
    alert('批量新增失敗: ' + error.message)
  }
}
</script>
