<template>
  <div
    ref="modalRef"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    tabindex="0"
    @keydown.esc="closeModal"
  >
    <div class="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[95vh]">
      <div class="flex justify-between items-center">
        <h3 class="text-2xl font-black text-slate-900 tracking-tighter uppercase">{{ props.monsterMode ? '批量新增怪物 (測試)' : '批量新增列表' }}</h3>
        <button @click="$emit('close')" class="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
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
            <button v-for="rank in ['None', 'B', 'A', 'S', 'SS']" :key="rank" @click="config.rank = rank === 'None' ? 'None' : rank + '級'" :class="['flex-1 py-2 rounded-xl text-[12px] font-black', config.rank === (rank === 'None' ? 'None' : rank + '級') ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50']">
              {{ rank === 'None' ? '一般' : rank }}
            </button>
          </div>
          <button @click="config.isFate = !config.isFate" :class="['px-4 py-2 rounded-2xl text-[14px] font-black border', config.isFate ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-slate-400']">
            FATE
          </button>
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
          <textarea v-model="bulkInput" class="flex-1 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] font-bold text-sm resize-none" placeholder="例如：劍術師01 石殼蟹 拉諾西亞高地 (X: 13.6, Y: 24.3)" />
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
                位置：<span v-for="(l, li) in entry.locations" :key="li" class="mr-2">{{ l.map }} (X: {{ l.x }}, Y: {{ l.y }})</span>
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
import { VERSIONS, JOB_BASE_NAMES, JOB_SUFFIXES, MAP_DATA } from '@/config/constants'
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
  jobs: []
})

const simplifiedJobBaseMap = {
  '劍術師': '劍術師',
  '剑术师': '劍術師',
  '格斗家': '格鬥家',
  '斧术师': '斧術師',
  '槍術師': '槍術師',
  '枪术师': '槍術師',
  '弓箭手': '弓箭手',
  '幻術師': '幻術師',
  '幻术师': '幻術師',
  '咒術師': '咒術師',
  '咒术师': '咒術師',
  '秘術師': '秘術師',
  '双剑师': '雙劍師',
  '雙劍師': '雙劍師',
  '黑渦團': '黑渦團',
  '黑涡团': '黑渦團',
  '双蛇党': '雙蛇黨',
  '雙蛇黨': '雙蛇黨',
  '恆輝隊': '恆輝隊',
  '恒辉队': '恆輝隊'
}

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

const coordPattern = /([Xx][:：]\s*([0-9]+(?:\.[0-9]+)?)\s*[,，]?\s*[Yy][:：]\s*([0-9]+(?:\.[0-9]+)?))\s*/g
const coordTestPattern = /[Xx][:：]\s*([0-9]+(?:\.[0-9]+)?)\s*[,，]?\s*[Yy][:：]\s*([0-9]+(?:\.[0-9]+)?)/

const findMapFromText = (text) => {
  const allMaps = Object.values(MAP_DATA).flat()
  const normalized = utilSimplifiedToTraditional(text || '').replace(/\s+/g, '').toLowerCase()

  if (!normalized) return ''

  // 先精準匹配含 map 字串
  const exact = allMaps.find(m => normalized.includes(m.replace(/\s+/g, '').toLowerCase()))
  if (exact) return exact

  // 再嘗試模糊匹配
  const candidate = allMaps
    .map(m => ({ map: m, similarity: calculateSimilarity(normalized, m.replace(/\s+/g, '').toLowerCase()) }))
    .sort((a, b) => b.similarity - a.similarity)[0]

  if (candidate && candidate.similarity >= 50) {
    return candidate.map
  }

  // 最後回退預設版本第一個
  const mapsForVersion = MAP_DATA[config.value.version] || []
  return mapsForVersion[0] || ''
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

    locations.push({ map, x, y })
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
          current = existing
          continue
        }

        current = {
          name,
          jobs: jobs.length > 0 ? jobs : [],
          locations: locations.length > 0 ? locations : []
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

      if (typeof entry === 'string') {
        name = utilSimplifiedToTraditional(entry)
        entryJobs = [...config.value.jobs]
        entryLocations = config.value.map ? [{ map: config.value.map, x: 0, y: 0 }] : []
      } else {
        name = utilSimplifiedToTraditional(entry.name || '')
        entryJobs = Array.isArray(entry.jobs) ? [...entry.jobs] : [...config.value.jobs]
        entryLocations = Array.isArray(entry.locations) && entry.locations.length > 0 ? [...entry.locations] : (config.value.map ? [{ map: config.value.map, x: 0, y: 0 }] : [])
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

          await updateDoc(existingDoc.ref, {
            rank: config.value.rank || existing.rank || 'None',
            isFate: existing.isFate || config.value.isFate,
            jobs: mergeJobs.length > 0 ? mergeJobs : null,
            locations: updatedLocations.length > 0 ? updatedLocations : [],
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
          jobs: entryJobs.length > 0 ? entryJobs : null,
          locations: entryLocations.length > 0 ? entryLocations : [],
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
