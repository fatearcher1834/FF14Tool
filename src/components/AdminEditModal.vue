<template>
  <div
    ref="modalRef"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    tabindex="0"
    @keydown.esc="closeModal"
  >
    <div class="bg-white rounded-[2.5rem] w-full max-w-lg p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
      <div class="flex justify-between items-center">
        <h3 class="text-xl font-black text-slate-900">新增怪物</h3>
        <button @click="$emit('close')" class="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
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
            @click="showJobPicker = true"
            class="px-3 py-1 rounded-full text-xs font-black border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
          >
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
            <textarea
              ref="batchInput"
              class="w-full p-3 bg-white/80 border border-blue-200 rounded-xl text-xs font-mono outline-none focus:border-blue-400 transition-all placeholder:text-slate-300"
              placeholder="例如：劍術師01 黑衣森林中央林區(X: 6.28, Y: 21.06)"
              rows="2"
              @paste.prevent="handleBatchParseFromPaste($event)"
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
import { X } from 'lucide-vue-next'
import { GAME_VERSIONS, MAP_DATA, VERSIONS, ALL_REGIONS, JOB_BASE_NAMES } from '@/config/constants'
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

const form = ref({
  id: props.monster.id || null,
  name: props.monster.name || '',
  rank: props.monster.rank || 'None',
  isFate: props.monster.isFate || false,
  jobs: Array.isArray(props.monster.jobs) ? [...props.monster.jobs] : [],
  version: props.monster.version || VERSIONS[0],
  locations: normalizeLocations(Array.isArray(props.monster.locations) ? [...props.monster.locations] : [], props.monster.version || VERSIONS[0])
})
const matchAccuracy = ref(90)


const closeModal = () => {
  emit('close')
}

onMounted(() => {
  if (modalRef.value) {
    modalRef.value.focus()
  }
})
const showJobPicker = ref(false)
const selectedJobBase = ref(null)

// 比照批量新增九宮格選擇器
const removeJob = (idx) => {
  form.value.jobs.splice(idx, 1)
}

const selectJobBase = (job) => {
  selectedJobBase.value = job
}

const confirmJobWithLevel = (jobBase, level) => {
  if (jobBase && level) {
    const fullJob = `${jobBase}${String(level).padStart(2, '0')}`
    if (!form.value.jobs.includes(fullJob)) {
      form.value.jobs.push(fullJob)
    }
  }
  showJobPicker.value = false
  selectedJobBase.value = null
}

const DUNGEON_MAPS = [
  '魔獸領域日影地修煉所',
  '古代遺跡喀恩埋沒聖堂',
  '神靈聖域放浪神古神殿',
]

const simplifiedToTraditional = {
  '西萨纳兰': '西薩納蘭',
  '中拉诺西亚': '中拉諾西亞',
  '拉诺西亚低地': '拉諾西亞低地',
  '东拉诺西亚': '東拉諾西亞',
  '西拉诺西亚': '西拉諾西亞',
  '拉诺西亚高地': '拉諾西亞高地',
  '拉诺西亚外地': '拉諾西亞外地',
  '黑衣森林中央林区': '黑衣森林中央林區',
  '黑衣森林东部林区': '黑衣森林東部林區',
  '黑衣森林南部林区': '黑衣森林南部林區',
  '黑衣森林北部林区': '黑衣森林北部林區',
  '中萨纳兰': '中薩納蘭',
  '摩杜纳': '摩杜納',
  '东萨纳兰': '東薩納蘭',
  '南萨纳兰': '南薩納蘭',
  '北萨纳兰': '北薩納蘭',
  '库尔札斯中央高地': '庫爾札斯中央高地',
  '魔大陆阿济兹拉': '魔大陸阿濟茲拉',
  '基拉巴尼亚边区': '基拉巴尼亞邊區',
  '基拉巴尼亚山区': '基拉巴尼亞山區',
  '基拉巴尼亚湖区': '基拉巴尼亞湖區',
  '太陽神草原': '太陽神草原'
}

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

      // 如果座標內 map 为空，尝试从上一列取值（可能是地图名）
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

  const fields = clean.split(/\t+/).map(field => field.trim()).filter(Boolean)
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

const handleBatchParseFromPaste = (event) => {
  const text = event.clipboardData?.getData('text') || ''
  handleBatchParse(text)
  if (event.target) {
    event.target.value = ''
  }
}

const submit = () => {
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
