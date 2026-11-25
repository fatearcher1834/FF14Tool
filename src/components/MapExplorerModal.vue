<template>
  <div class="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
    <div class="admin-modal-surface bg-white rounded-[2rem] w-full max-w-7xl h-[92vh] shadow-2xl border overflow-hidden flex flex-col">
      <div class="flex items-start justify-between gap-4 p-4 border-b border-slate-200">
        <div>
          <h3 class="text-lg font-black text-slate-900">怪物分布地圖</h3>
          <p class="text-[10px] font-bold text-slate-400 mt-0.5">
            不同顏色代表不同怪物；點左側怪物只顯示牠在目前地圖的位置
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-100 transition-all shrink-0"
        >
          <X :size="16" />
        </button>
      </div>

      <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px,1fr]">
        <aside class="border-b lg:border-b-0 lg:border-r border-slate-200 p-4 overflow-y-auto bg-slate-50 space-y-3">
          <div class="grid grid-cols-[92px,1fr] gap-2">
            <select
              v-model="selectedVersion"
              class="w-full p-2.5 bg-white border rounded-xl text-xs font-black outline-none"
              title="版本"
            >
              <option value="">全部版本</option>
              <option v-for="version in versionOptions" :key="version" :value="version">{{ version }}</option>
            </select>
            <select
              v-model="selectedMap"
              class="w-full p-2.5 bg-white border rounded-xl text-xs font-black outline-none"
            >
              <option v-for="name in filteredMapOptions" :key="name" :value="name">
                {{ name }}（{{ mapGroups[name].length }}）
              </option>
            </select>
          </div>

          <p class="text-[10px] font-bold text-slate-400 leading-relaxed">
            不同顏色代表不同怪物；點選怪物可只看牠的位置，再點一次或按「全部顯示」恢復。座標重疊時會稍微散開顯示。
          </p>

          <input
            v-model="searchTerm"
            class="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none"
            placeholder="搜尋此區怪物..."
          />

          <button
            type="button"
            @click="selectedMonsterId = null"
            :class="[
              'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-black transition-all',
              selectedMonsterId == null ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
            ]"
          >
            <span class="inline-flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              全部顯示
            </span>
            <span class="text-[10px] opacity-70">{{ filteredMonsters.length }}</span>
          </button>

          <div class="space-y-2">
            <button
              v-for="m in filteredMonsters"
              :key="m.id"
              type="button"
              @click="toggleMonster(m)"
              :class="[
                'w-full flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all',
                selectedMonsterId === m.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-100'
              ]"
            >
              <span class="mt-1 w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: getMonsterExplorerColor(m) }"></span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-black leading-tight break-words">{{ m.name }}</span>
                <span class="flex flex-wrap items-center gap-1 mt-1">
                  <VersionTag :version="m.version" />
                  <RankTag :rank="m.rank" />
                  <FateTag :is-fate="m.isFate" />
                  <WantedTag :is-wanted="m.isWanted" />
                </span>
                <span class="block text-[10px] font-bold text-slate-400 mt-1">
                  {{ countPoints(m) }} 個位置<span v-if="m.filterOther"> · {{ m.filterOther }}</span>
                </span>
              </span>
            </button>
          </div>

          <div v-if="filteredMonsters.length === 0" class="text-xs font-bold text-slate-400 text-center py-6">
            此區域沒有符合的怪物
          </div>
        </aside>

        <main class="min-h-0 overflow-y-auto p-4 bg-slate-100">
          <GameMapViewer
            v-if="selectedMap && displayMonsters.length > 0"
            :monsters="displayMonsters"
            :selected-monster-id="selectedMonsterId"
            :initial-location="explorerLocation"
            :height="mapHeight"
            colored-markers
            @select-monster="toggleMonster"
          />
          <div v-else class="h-64 flex items-center justify-center text-sm font-bold text-slate-400">
            {{ selectedMap ? '此區域尚無座標資料' : '尚無地圖資料' }}
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useMonstersStore } from '@/stores/monsters.store'
import { GAME_MAPS, getGameMap } from '@/config/gameMaps'
import { VERSIONS, MAP_DATA } from '@/config/constants'
import { getMonsterExplorerColor } from '@/config/mapColors'
import VersionTag from '@/components/VersionTag.vue'
import RankTag from '@/components/RankTag.vue'
import FateTag from '@/components/FateTag.vue'
import WantedTag from '@/components/WantedTag.vue'
import GameMapViewer from '@/components/GameMapViewer.vue'

const props = defineProps({
  initialMap: { type: String, default: '' }
})

const emit = defineEmits(['close'])
const monstersStore = useMonstersStore()

const selectedMap = ref('')
const selectedVersion = ref('')
const selectedMonsterId = ref(null)
const searchTerm = ref('')
const mapHeight = Math.max(360, Math.min(620, window.innerHeight - 260))

const hasCoords = (loc) => !!(loc &&
  loc.x != null && loc.x !== '' && loc.y != null && loc.y !== '' &&
  Number.isFinite(Number(loc.x)) && Number.isFinite(Number(loc.y)))

const mapGroups = computed(() => {
  const groups = {}
  for (const monster of monstersStore.monsters) {
    const seen = new Set()
    for (const loc of (monster.locations || [])) {
      if (!loc || !getGameMap(loc.map) || !hasCoords(loc)) continue
      if (seen.has(loc.map)) continue
      seen.add(loc.map)
      if (!groups[loc.map]) groups[loc.map] = []
      groups[loc.map].push(monster)
    }
  }
  return groups
})

const mapOptions = computed(() =>
  Object.keys(GAME_MAPS).filter(name => (mapGroups.value[name] || []).length > 0)
)

const getMapVersion = (mapName) =>
  Object.keys(MAP_DATA).find(version => (MAP_DATA[version] || []).includes(mapName)) || ''

const versionOptions = computed(() =>
  VERSIONS.filter(version => mapOptions.value.some(name => getMapVersion(name) === version))
)

const filteredMapOptions = computed(() => {
  if (!selectedVersion.value) return mapOptions.value
  return mapOptions.value.filter(name => getMapVersion(name) === selectedVersion.value)
})

const mapMonsters = computed(() => mapGroups.value[selectedMap.value] || [])
const explorerLocation = computed(() => ({ map: selectedMap.value }))

const priority = (monster) => {
  if (monster.rank === 'SS') return 0
  if (monster.rank === 'S') return 1
  if (monster.rank === 'A') return 2
  if (monster.rank === 'B') return 3
  if (monster.isFate) return 4
  if (monster.isWanted) return 5
  return 6
}

const filteredMonsters = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return [...mapMonsters.value]
    .filter(monster => {
      if (!term) return true
      const jobs = Array.isArray(monster.jobs) ? monster.jobs : []
      return (monster.name || '').toLowerCase().includes(term) ||
        (monster.filterOther || '').toLowerCase().includes(term) ||
        jobs.some(job => String(job).toLowerCase().includes(term))
    })
    .sort((a, b) => priority(a) - priority(b) || (a.name || '').localeCompare(b.name || '', 'zh-Hant'))
})

const displayMonsters = computed(() => filteredMonsters.value)

const countPoints = (monster) =>
  (monster.locations || []).filter(loc => loc && loc.map === selectedMap.value && hasCoords(loc)).length

const toggleMonster = (monster) => {
  if (!monster) return
  selectedMonsterId.value = selectedMonsterId.value === monster.id ? null : monster.id
}

const syncSelectedMap = () => {
  if (!filteredMapOptions.value.includes(selectedMap.value)) {
    selectedMap.value = filteredMapOptions.value[0] || ''
  }
}

const initialized = ref(false)

const selectInitialMap = () => {
  const options = mapOptions.value
  if (!options.length) return

  if (props.initialMap && options.includes(props.initialMap)) {
    selectedVersion.value = getMapVersion(props.initialMap)
    selectedMap.value = props.initialMap
    return
  }

  const latestVersion = versionOptions.value[versionOptions.value.length - 1] || ''
  selectedVersion.value = latestVersion
  selectedMap.value = filteredMapOptions.value[0] || options[0]
}

watch(mapOptions, (options) => {
  if (!options.length) return
  if (!initialized.value) {
    initialized.value = true
    selectInitialMap()
    return
  }
  syncSelectedMap()
}, { immediate: true })

watch(selectedVersion, () => {
  syncSelectedMap()
})

watch(selectedMap, () => {
  selectedMonsterId.value = null
})

watch(searchTerm, () => {
  if (selectedMonsterId.value && !filteredMonsters.value.some(monster => monster.id === selectedMonsterId.value)) {
    selectedMonsterId.value = null
  }
})

watch(() => props.initialMap, () => {
  if (initialized.value) selectInitialMap()
})
</script>
