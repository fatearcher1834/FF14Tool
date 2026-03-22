<template>
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
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
            <button v-for="r in ['None','B','A','S','SS']" :key="r" @click="form.rank = r" :class="['flex-1 py-2 rounded-xl text-xs font-black', form.rank === r ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50']">{{ r === 'None' ? '一般' : r }}</button>
          </div>
          <button @click="form.isFate = !form.isFate" :class="['px-4 py-2 rounded-2xl text-xs font-black border', form.isFate ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-slate-400']">FATE</button>
        </div>
        <!-- 討伐筆記 -->
        <div class="flex flex-wrap gap-2 items-center">
          <div v-for="(job, idx) in form.jobs" :key="idx" class="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-black w-fit">
            <span>{{ job }}</span>
            <button @click="removeJob(idx)" class="ml-1 hover:bg-blue-600 rounded-full p-0.5">
              <X :size="12" />
            </button>
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
            </div>
          </div>
        </div>

        <!-- 怪物名稱與版本 -->
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <label class="text-[10px] font-black text-slate-400 ml-1 uppercase">怪物名稱</label>
            <input v-model="form.name" class="w-full p-3 bg-slate-50 border rounded-2xl font-bold text-sm outline-none mt-1" />
          </div>
          <div>
            <label class="text-[10px] font-black text-slate-400 ml-1 uppercase">版本</label>
            <select v-model="form.version" class="w-full p-3 bg-slate-50 border rounded-2xl font-bold text-sm outline-none mt-1">
              <option v-for="v in VERSIONS" :key="v" :value="v">{{ v }}</option>
            </select>
          </div>
        </div>
        <!-- 批次座標解析與座標列表 -->
        <div class="space-y-3">
          <div class="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50 space-y-3">
            <label class="text-[10px] font-black text-blue-600 uppercase tracking-wider">批次座標解析 (貼上即自動匯入)</label>
            <textarea class="w-full p-3 bg-white/80 border border-blue-200 rounded-xl text-xs font-mono outline-none focus:border-blue-400 transition-all placeholder:text-slate-300" placeholder="在此貼上多筆座標文字...例如：黑衣森林中央林區(X: 6.28, Y: 21.06)" rows="2" @change="handleBatchParse($event.target.value); $event.target.value=''" />
          </div>
          <label class="text-[10px] font-black text-slate-400 ml-1 uppercase">座標點位</label>
          <div v-for="(loc, i) in form.locations" :key="i" class="flex gap-2 p-3 bg-slate-50 rounded-2xl border items-center">
            <select v-model="loc.map" class="flex-1 bg-white border p-2 rounded-xl text-xs font-bold outline-none">
              <option v-for="r in MAP_DATA[form.version]" :key="r" :value="r">{{ r }}</option>
              <optgroup v-if="otherRegions(form.version).length > 0" label="其他版本">
                <option v-for="r in otherRegions(form.version)" :key="r" :value="r">{{ r }}</option>
              </optgroup>
            </select>
            <div class="flex gap-1 items-center">
              <span class="text-[10px] font-black text-slate-300">X</span>
              <input v-model="loc.x" class="w-14 bg-white border p-2 rounded-xl text-center text-xs font-mono" />
            </div>
            <div class="flex gap-1 items-center">
              <span class="text-[10px] font-black text-slate-300">Y</span>
              <input v-model="loc.y" class="w-14 bg-white border p-2 rounded-xl text-center text-xs font-mono" />
            </div>
            <button @click="form.locations.splice(i, 1)" class="p-2 text-slate-300 hover:text-red-500"><X :size="14" /></button>
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
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { GAME_VERSIONS, MAP_DATA, VERSIONS, ALL_REGIONS } from '@/config/constants'
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

const JOB_BASE_NAMES = [
  '劍術師', '格鬥家', '斧術師', '槍術師', '弓箭手', '幻術師', '咒術師', '秘術師', '雙劍師', '黑渦團', '雙蛇黨', '恆輝隊'
]
const jobSuffixes = Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, '0'))

const form = ref({
  name: props.monster.name || '',
  rank: props.monster.rank || 'None',
  isFate: props.monster.isFate || false,
  jobs: Array.isArray(props.monster.jobs) ? props.monster.jobs : [],
  version: props.monster.version || VERSIONS[0],
  locations: Array.isArray(props.monster.locations) ? props.monster.locations : [],
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

const submit = () => {
  emit('save', form.value)
  emit('close')
}

const addLocation = () => {
  form.value.locations = form.value.locations || []
  // 預設 map 為目前版本第一個地圖
  const maps = MAP_DATA[form.value.version] || [];
  form.value.locations.push({ map: maps[0] || '', x: '', y: '' })
}
</script>

// VERSIONS 已由 constants.js 導出
