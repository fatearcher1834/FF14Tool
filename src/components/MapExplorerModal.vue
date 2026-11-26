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
            點選怪物可只看牠的位置，再點一次或按「全部顯示」恢復。
          </p>

          <div class="grid grid-cols-2 gap-1 p-1 bg-slate-200 rounded-xl">
            <button
              v-for="option in scopeOptions"
              :key="option.value"
              type="button"
              @click="searchScope = option.value"
              :aria-pressed="searchScope === option.value"
              :class="[
                'px-2 py-1.5 rounded-lg text-xs font-black transition-all',
                searchScope === option.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              ]"
            >
              {{ option.label }}
            </button>
          </div>

          <input
            v-model="searchTerm"
            class="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none"
            :placeholder="searchScope === 'all' ? '搜尋所有地圖怪物...' : '搜尋此地圖怪物...'"
          />

          <button
            type="button"
            @click="selectedMonsterId = null"
            :class="[
              'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-black transition-all',
              selectedMonsterId == null
                ? 'bg-blue-600 text-white border-blue-300 ring-2 ring-blue-400/70 shadow-lg'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
            ]"
          >
            <span class="inline-flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              全部顯示
            </span>
            <span class="inline-flex items-center gap-2">
              <Check v-if="selectedMonsterId == null" :size="14" />
              <span class="text-[10px] opacity-70">{{ filteredMonsters.length }}</span>
            </span>
          </button>

          <div class="space-y-2">
            <button
              v-for="m in filteredMonsters"
              :key="m.id"
              :ref="el => setMonsterItemRef(m.id, el)"
              type="button"
              @click="toggleMonster(m)"
              :aria-pressed="selectedMonsterId === m.id"
              :class="[
                'w-full flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all',
                selectedMonsterId === m.id
                  ? 'bg-blue-600 text-white border-blue-300 ring-2 ring-blue-400/70 shadow-lg'
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
                <span :class="['block text-[10px] font-bold mt-1', selectedMonsterId === m.id ? 'text-blue-100' : 'text-slate-400']">
                  <template v-if="searchScope === 'all'">{{ monsterMapLabel(m) }} · {{ totalPoints(m) }} 個位置</template>
                  <template v-else>{{ countPoints(m) }} 個位置</template><template v-if="m.filterOther"> · {{ m.filterOther }}</template>
                </span>
              </span>
              <Check v-if="selectedMonsterId === m.id" :size="15" class="shrink-0 mt-0.5" />
            </button>
          </div>

          <div v-if="filteredMonsters.length === 0" class="text-center py-6 space-y-3">
            <p class="text-xs font-bold text-slate-400">
              {{ searchScope === 'all' ? '所有地圖都沒有符合的怪物' : '此地圖沒有符合的怪物' }}
            </p>
            <button
              v-if="searchScope !== 'all' && globalMatchCount > 0"
              type="button"
              @click="searchScope = 'all'"
              class="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all"
            >
              <Globe :size="13" />
              改搜尋全部地圖（{{ globalMatchCount }}）
            </button>
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
            {{ !selectedMap ? '尚無地圖資料' : (mapMonsters.length === 0 ? '此地圖尚無座標資料' : '沒有符合搜尋的怪物') }}
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { X, Check, Globe } from 'lucide-vue-next'
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
const monsterItemRefs = new Map()

const MAP_EXPLORER_STATE_KEY = 'monster-map-explorer-state-v1'
const loadExplorerState = () => {
  try {
    const raw = window.localStorage.getItem(MAP_EXPLORER_STATE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
const savedExplorerState = loadExplorerState()
const searchScope = ref(savedExplorerState.scope === 'all' ? 'all' : 'map')
const persistExplorerState = () => {
  savedExplorerState.version = selectedVersion.value
  savedExplorerState.map = selectedMap.value
  savedExplorerState.selectedMonsterId = selectedMonsterId.value
  savedExplorerState.scope = searchScope.value
  try {
    window.localStorage.setItem(MAP_EXPLORER_STATE_KEY, JSON.stringify({
      version: selectedVersion.value,
      map: selectedMap.value,
      selectedMonsterId: selectedMonsterId.value,
      scope: searchScope.value
    }))
  } catch {
    // 瀏覽器停用儲存時仍可正常使用地圖
  }
}

const setMonsterItemRef = (id, el) => {
  if (el) monsterItemRefs.set(id, el)
  else monsterItemRefs.delete(id)
}

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

const scopeOptions = [
  { value: 'all', label: '全地圖' },
  { value: 'map', label: '此地圖' }
]

const allMapMonsters = computed(() => {
  const seen = new Set()
  const result = []
  for (const monster of monstersStore.monsters) {
    if (!(monster.locations || []).some(loc => loc && getGameMap(loc.map) && hasCoords(loc))) continue
    if (seen.has(monster.id)) continue
    seen.add(monster.id)
    result.push(monster)
  }
  return result
})

const scopedMonsters = computed(() =>
  searchScope.value === 'all' ? allMapMonsters.value : mapMonsters.value
)

const validLocations = (monster) =>
  (monster.locations || []).filter(loc => loc && getGameMap(loc.map) && hasCoords(loc))

const monsterMaps = (monster) => [...new Set(validLocations(monster).map(loc => loc.map))]

const totalPoints = (monster) => validLocations(monster).length

const monsterMapLabel = (monster) => {
  const maps = monsterMaps(monster)
  if (maps.length <= 2) return maps.join('、')
  return `${maps.slice(0, 2).join('、')} 等 ${maps.length} 張地圖`
}

const matchMonster = (monster, term) => {
  if (!term) return true
  const jobs = Array.isArray(monster.jobs) ? monster.jobs : []
  return (monster.name || '').toLowerCase().includes(term) ||
    (monster.filterOther || '').toLowerCase().includes(term) ||
    jobs.some(job => String(job).toLowerCase().includes(term))
}

const priority = (monster) => {
  if (monster.rank === 'SS') return 0
  if (monster.rank === 'S') return 1
  if (monster.rank === 'A') return 2
  if (monster.rank === 'B') return 3
  if (monster.isFate) return 4
  if (monster.isWanted) return 5
  return 6
}

const sortByPriority = (list) =>
  [...list].sort((a, b) => priority(a) - priority(b) || (a.name || '').localeCompare(b.name || '', 'zh-Hant'))

const filteredMonsters = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return sortByPriority(scopedMonsters.value.filter(monster => matchMonster(monster, term)))
})

const globalMatchCount = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return 0
  return allMapMonsters.value.filter(monster => matchMonster(monster, term)).length
})

const displayMonsters = computed(() =>
  searchScope.value === 'all' ? mapMonsters.value : filteredMonsters.value
)

const countPoints = (monster) =>
  validLocations(monster).filter(loc => loc.map === selectedMap.value).length

let pendingJumpMonsterId = null

const toggleMonster = (monster) => {
  if (!monster) return
  if (selectedMonsterId.value === monster.id) {
    selectedMonsterId.value = null
    return
  }
  const maps = monsterMaps(monster)
  if (maps.length && !maps.includes(selectedMap.value)) {
    const targetMap = maps[0]
    if (!filteredMapOptions.value.includes(targetMap)) {
      selectedVersion.value = getMapVersion(targetMap)
    }
    pendingJumpMonsterId = monster.id
    selectedMap.value = targetMap
  }
  selectedMonsterId.value = monster.id
}

const syncSelectedMap = () => {
  if (!filteredMapOptions.value.includes(selectedMap.value)) {
    selectedMap.value = filteredMapOptions.value[0] || ''
  }
}

const restoreSelectedMonster = (id) => {
  if (id == null) return
  nextTick(() => {
    if (mapMonsters.value.some(monster => monster.id === id)) {
      selectedMonsterId.value = id
    }
  })
}

const initialized = ref(false)

const selectInitialMap = () => {
  const options = mapOptions.value
  if (!options.length) return
  const savedMap = savedExplorerState.map
  const savedMonsterId = savedExplorerState.selectedMonsterId

  if (props.initialMap && options.includes(props.initialMap)) {
    selectedVersion.value = getMapVersion(props.initialMap)
    selectedMap.value = props.initialMap
    persistExplorerState()
    if (props.initialMap === savedMap) {
      restoreSelectedMonster(savedMonsterId)
    }
    return
  }

  if (savedMap && options.includes(savedMap)) {
    const savedVersion = typeof savedExplorerState.version === 'string' ? savedExplorerState.version : ''
    const mapVersion = getMapVersion(savedMap)
    selectedVersion.value = savedVersion && versionOptions.value.includes(savedVersion) && mapVersion === savedVersion
      ? savedVersion
      : (savedVersion === '' ? '' : mapVersion)
    selectedMap.value = savedMap
    persistExplorerState()
    restoreSelectedMonster(savedMonsterId)
    return
  }

  const latestVersion = versionOptions.value[versionOptions.value.length - 1] || ''
  selectedVersion.value = latestVersion
  selectedMap.value = filteredMapOptions.value[0] || options[0]
  persistExplorerState()
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
  persistExplorerState()
})

watch(selectedMap, () => {
  if (pendingJumpMonsterId != null && selectedMonsterId.value === pendingJumpMonsterId) {
    pendingJumpMonsterId = null
  } else {
    selectedMonsterId.value = null
  }
  persistExplorerState()
})

watch(selectedMonsterId, async (id) => {
  persistExplorerState()
  if (!id) return
  await nextTick()
  monsterItemRefs.get(id)?.scrollIntoView({ block: 'nearest' })
})

watch(searchTerm, () => {
  if (selectedMonsterId.value && !filteredMonsters.value.some(monster => monster.id === selectedMonsterId.value)) {
    selectedMonsterId.value = null
  }
})

watch(searchScope, () => {
  if (selectedMonsterId.value && !filteredMonsters.value.some(monster => monster.id === selectedMonsterId.value)) {
    selectedMonsterId.value = null
  }
  persistExplorerState()
})

watch(() => props.initialMap, () => {
  if (initialized.value) selectInitialMap()
})

onBeforeUnmount(() => {
  monsterItemRefs.clear()
})
</script>
