<template>
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div class="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[95vh]">
      <div class="flex justify-between items-center">
        <h3 class="text-2xl font-black text-slate-900 tracking-tighter uppercase">批量新增列表</h3>
        <button @click="$emit('close')" class="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
          <X :size="16" />
        </button>
      </div>

      <!-- 配置區域 -->
      <div class="bg-slate-50 p-4 rounded-[2rem] border border-slate-200 space-y-3">
        <!-- 版本和地圖 -->
        <div class="flex gap-3">
          <select v-model="config.version" class="flex-1 p-3 bg-white border rounded-2xl font-bold text-sm outline-none">
            <option v-for="v in VERSIONS" :key="v" :value="v">版本 {{ v }}</option>
          </select>
          <select v-model="config.map" class="flex-[2] p-3 bg-white border rounded-2xl font-bold text-sm outline-none">
            <option value="">無</option>
            <option v-for="m in getMapsForVersion(config.version)" :key="m" :value="m">{{ m }}</option>
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
              <h5 class="text-sm font-black text-slate-500">第一步：選擇職業</h5>
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
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">名稱輸入</label>
          <textarea v-model="bulkInput" class="flex-1 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] font-bold text-sm resize-none" placeholder="一行一個名稱..." />
        </div>

        <!-- 右：預覽面板 -->
        <div class="flex flex-col space-y-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">預覽 ({{ bulkParsedList.length }})</label>
          <div class="flex-1 p-4 bg-slate-100 rounded-[2rem] overflow-y-auto space-y-2 border">
            <div v-for="(name, idx) in bulkParsedList" :key="idx" class="flex items-center justify-between bg-white p-3 rounded-2xl border shadow-sm">
              <span class="text-sm font-black text-slate-700">{{ name }}</span>
              <div class="flex gap-1 items-center scale-75 origin-right">
                <VersionTag :version="config.version" />
                <RankTag :rank="config.rank" />
                <FateTag v-if="config.isFate" :is-fate="true" />
                <div v-for="job in config.jobs" :key="job" class="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-black">{{ job }}</div>
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
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { VERSIONS, JOB_BASE_NAMES, JOB_SUFFIXES, MAP_DATA } from '@/config/constants'
import { useUserStore } from '@/stores/user.store'
import { getDb } from '@/services/firebase'
import { doc, setDoc } from 'firebase/firestore'
import VersionTag from '@/components/VersionTag.vue'
import RankTag from '@/components/RankTag.vue'
import FateTag from '@/components/FateTag.vue'

const emit = defineEmits(['close', 'save'])

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
  map: '',
  rank: 'None',
  isFate: false,
  jobs: []
})

const getMapsForVersion = (version) => {
  return MAP_DATA[version] || []
}

const canSubmit = computed(() => {
  return config.value.map && bulkParsedList.value.length > 0
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
const parsePastedCoords = () => {
  const lines = pasteCoordText.value.split('\n').filter(line => line.trim())
  const validMaps = Object.values(MAP_DATA).flat()
  // 正則解析地圖名與座標
  const locationPattern = /([\u4E00-\u9FFF]+)\s*\(?\s*[Xx][:：]\s*([0-9.]+)\s*[,，]?\s*[Yy][:：]\s*([0-9.]+)\s*\)?/g
  lines.forEach(line => {
    const matches = [...line.matchAll(locationPattern)]
    matches.forEach(m => {
      const map = m[1].trim()
      const x = parseFloat(m[2])
      const y = parseFloat(m[3])
      // 只加入有效座標
      if (map && !isNaN(x) && !isNaN(y)) {
        config.value.map = map
        // 這裡只存一組座標，若要多組可改為陣列
        config.value.locations = [{ map, x, y }]
      }
    })
  })
  showPasteCoords.value = false
  pasteCoordText.value = ''
}

const parseNames = () => {
  bulkParsedList.value = bulkInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

const submit = async () => {
  try {
    const db = getDb()
    const now = Date.now()
    let successCount = 0

    for (const name of bulkParsedList.value) {
      const id = `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      
      await setDoc(doc(db, 'artifacts', userStore.appId, 'public', 'data', 'monsters', id), {
        id,
        name,
        version: config.value.version,
        rank: config.value.rank,
        isFate: config.value.isFate,
        jobs: config.value.jobs.length > 0 ? config.value.jobs : null,
        locations: config.value.map ? [{ map: config.value.map, x: 0, y: 0 }] : [],
        createdAt: now,
        updatedAt: now
      })
      
      successCount++
    }

    alert(`成功新增 ${successCount} 隻怪物`)
    emit('save')
  } catch (error) {
    console.error('Batch add failed:', error)
    alert('批量新增失敗: ' + error.message)
  }
}
</script>
