<template>
  <div
    :class="['absolute right-0 top-0 bottom-0 sm:w-[380px] w-full bg-slate-100 border-l sm:border-l shadow-2xl transition-transform duration-300 flex flex-col z-40 overflow-hidden', show ? 'translate-x-0' : 'translate-x-full']"
  >
    <div class="p-4 bg-white border-b flex justify-between items-center">
      <div class="flex items-center gap-3">
        <h2 class="font-black text-xs text-slate-800 uppercase tracking-widest shrink-0">追蹤看板</h2>
        <button
          @click="$emit('toggle-kb-all-expanded')"
          :class="['px-2 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all border', isKbGlobalExpanded ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200']"
          :title="isKbGlobalExpanded ? '展開座標' : '摺疊座標'"
        >
          <ChevronDown v-if="isKbGlobalExpanded" size="14" />
          <ChevronUp v-else size="14" />
          <span class="text-[11px] font-black">{{ isKbGlobalExpanded ? '展開座標' : '摺疊座標' }}</span>
        </button>
        <button
          @click="$emit('close-kanban')"
          class="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg border border-slate-200 font-black text-xs transition-all"
          title="收起追蹤看板"
        >
          收起
        </button>
      </div>
      <button
        @click="$emit('add-new-group')"
        class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-100 text-xs"
      >
        <Plus size="16" />
      </button>
    </div>

    <div class="p-3 bg-white border-b space-y-2 shadow-sm">
      <div class="relative flex items-center">
        <Filter size="10" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          :value="kbSearchTerm"
          @input="$emit('update:kbSearchTerm', $event.target.value)"
          class="w-full pl-7 pr-4 py-1.5 bg-slate-50 rounded-xl text-[12px] outline-none font-bold"
          placeholder="過濾追蹤內容..."
        />
        <button
          @click="$emit('copy-all-locations')"
          class="ml-2 p-1.5 rounded-full border border-slate-200 bg-white text-blue-400 shadow transition-all hover:bg-blue-500 hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 focus-visible:ring-offset-0 active:scale-95 app-copy-btn"
          title="一鍵複製所有怪物位置"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/></svg>
        </button>
      </div>

      <div class="flex gap-2 flex-wrap">
        <select
          :value="kbFilterVer"
          @change="(e) => { $emit('update:kbFilterVer', e.target.value); $emit('kb-version-change') }"
          class="bg-slate-50 px-2 py-1 rounded-lg text-[12px] font-black outline-none border"
        >
          <option value="">全版本</option>
          <option v-for="v in VERSIONS" :key="v" :value="v">{{ v }}</option>
        </select>
        <select
          :value="kbFilterMap"
          @change="$emit('update:kbFilterMap', $event.target.value)"
          class="bg-slate-50 px-2 py-1 rounded-lg text-[12px] font-black outline-none border flex-1 min-w-[220px]"
        >
          <option value="">{{ kbFilterVer ? `${kbFilterVer} 地圖` : '全地圖' }}</option>
          <option v-for="m in getMapsForVersion(kbFilterVer)" :key="m" :value="m">{{ m }}</option>
        </select>
        <select
          :value="kbFilterRank"
          @change="$emit('update:kbFilterRank', $event.target.value)"
          class="bg-slate-50 px-2 py-1 rounded-lg text-[12px] font-black outline-none border"
        >
          <option value="">等級</option>
          <option v-for="r in RANKS" :key="r" :value="r">{{ r === 'None' ? '一般' : `${r}級` }}</option>
        </select>
        <button
          @click="$emit('update:kbFilterFate', !kbFilterFate)"
          :class="['px-2 py-1 rounded-lg text-[12px] font-black border transition-all', kbFilterFate ? 'bg-pink-500 text-white border-pink-500' : 'bg-slate-50 text-slate-400 border-slate-200']"
        >
          FATE
        </button>
        <button
          @click="$emit('update:kbFilterWanted', !kbFilterWanted)"
          :class="['px-2 py-1 rounded-lg text-[12px] font-black border transition-all', kbFilterWanted ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 text-slate-400 border-slate-200']"
        >
          通緝令
        </button>
        <button
          @click="$emit('toggle-kb-job-filter')"
          :class="['px-2 py-1 rounded-lg text-[12px] font-black border transition-all', kbFilterJob ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-50 text-slate-400 border-slate-200']"
        >
          討伐筆記
        </button>
        <select
          v-if="showKbJobFilter"
          :value="kbFilterJob"
          @change="$emit('update:kbFilterJob', $event.target.value)"
          class="bg-slate-50 px-2 py-1 rounded-lg text-[12px] font-black outline-none border"
        >
          <option value="*">全部</option>
          <option v-for="j in JOB_BASE_NAMES" :key="j" :value="j">{{ j }}</option>
        </select>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar bg-slate-50">
      <div
        v-for="group in customGroups"
        :key="group.id"
        @dragover.prevent="dragOverMonsterId = 'group-' + group.id"
        @dragleave="dragOverMonsterId === 'group-' + group.id && (dragOverMonsterId = null)"
        @drop="$emit('group-drop', $event, group.id)"
        :class="['bg-white rounded-2xl border p-3 space-y-3 shadow-sm transition-all', dragOverMonsterId === 'group-' + group.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200']"
      >
        <div class="flex justify-between items-center px-1">
          <input
            :value="group.name"
            @input="$emit('update-group-name', group.id, $event.target.value)"
            class="bg-transparent font-black text-[11px] outline-none text-slate-700 w-full p-1 focus:bg-slate-50 rounded"
          />
          <div class="flex items-center gap-2">
            <span class="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full">
              {{ getGroupMonsters(group.id).length }}
            </span>
            <button
              @click="$emit('copy-group-locations', group.id)"
              title="區域複製：複製此分組中怪物的座標"
              class="p-1 rounded-full border border-slate-200 bg-white text-blue-400 shadow transition-all hover:bg-blue-500 hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 focus-visible:ring-offset-0 active:scale-95 app-copy-btn"
            >
              <Copy size="12" />
            </button>
            <button
              v-if="group.canDelete"
              @click="$emit('delete-group', group.id)"
              class="text-slate-300 hover:text-red-400"
            >
              <Trash2 size="12" />
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div
            v-for="m in getGroupMonsters(group.id)"
            :key="`kb-${m.id}`"
            :class="['border rounded-xl relative group/card cursor-grab active:cursor-grabbing shadow-sm transition-all', m.rank === 'S' || m.rank === 'SS' ? 'bg-amber-50 border-amber-100' : 'bg-[#fdfcf0] border-orange-100']"
            draggable="true"
            @dragstart="$emit('monster-drag-start', $event, m.id)"
            @dragover="$emit('monster-drag-over', $event, m.id)"
            @dragleave="$emit('monster-drag-leave')"
            @drop="$emit('monster-drop', $event, m.id, group.id)"
          >
            <div
              @click="$emit('toggle-kb-expanded', m.id)"
              class="p-3 flex justify-between items-start cursor-pointer hover:bg-black/5 rounded-t-xl transition-colors"
            >
              <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 overflow-hidden">
                <div class="text-[12px] font-black text-slate-800 truncate flex items-center gap-1 shrink-0">
                  <ChevronDown v-if="expandedIds[m.id]" size="10" class="text-slate-400" />
                  <ChevronRight v-else size="10" class="text-slate-400" />
                  {{ m.name }}
                  <VersionTag :version="m.version" />
                  <RankTag :rank="m.rank" />
                  <FateTag :isFate="m.isFate" />
                  <WantedTag :is-wanted="m.isWanted" />
                  <JobTag :jobs="m.jobs || []" />
                </div>
              </div>
              <div class="absolute top-2 right-2 flex gap-1">
                <button
                  @click.stop="$emit('copy-monster-locations', m)"
                  class="p-1 rounded-full border border-slate-200 bg-white text-blue-400 shadow transition-all hover:bg-blue-500 hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 focus-visible:ring-offset-0 active:scale-95 app-copy-btn"
                  title="複製所有位置座標"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/></svg>
                </button>
                <button
                  @click.stop="$emit('remove-pin', m.id)"
                  class="p-1 text-slate-300 hover:text-red-500 bg-white rounded-full shadow transition-all"
                  title="取消釘選"
                >
                  <Trash2 size="14" />
                </button>
              </div>
            </div>
            <div v-if="expandedIds[m.id] && m.locations && m.locations.length > 0" class="p-3 bg-slate-50 space-y-1 text-[10px] border-t">
              <div v-for="(loc, i) in m.locations" :key="i" class="flex items-center gap-2">
                <button
                  @click="$emit('monster-location-click', m, loc, `kb-${m.id}-${i}`)"
                  class="w-full p-2 bg-slate-50 rounded-xl hover:bg-blue-600 hover:text-white text-left relative transition-all group/loc text-[10px]"
                  :title="m.rank && m.rank !== 'None' ? '打開地圖視圖' : '複製座標'"
                >
                  <div class="flex items-center gap-2">
                    <div class="text-[9px] font-black opacity-60 group-hover/loc:opacity-100">{{ loc.map }}</div>
                    <div class="font-mono font-bold">X:{{ loc.x }} Y:{{ loc.y }}<span v-if="loc.z != null && loc.z !== ''"> Z:{{ loc.z }}</span></div>
                    <div v-if="m.rank && m.rank !== 'None'" class="text-[9px] text-amber-600 font-black">(菁英怪物地圖位置)</div>
                    <CopyFeedbackOverlay :visible="copyFeedback === `kb-${m.id}-${i}`" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import { VERSIONS, RANKS, JOB_BASE_NAMES } from '@/config/constants'
import { getMapsForVersion } from '@/services/hunterUtils'
import VersionTag from '@/components/VersionTag.vue'
import RankTag from '@/components/RankTag.vue'
import FateTag from '@/components/FateTag.vue'
import WantedTag from '@/components/WantedTag.vue'
import JobTag from '@/components/JobTag.vue'
import CopyFeedbackOverlay from '@/components/CopyFeedbackOverlay.vue'
import { Filter, Plus, ChevronDown, ChevronUp, ChevronRight, Copy, Trash2, Check } from 'lucide-vue-next'

const props = defineProps({
  show: Boolean,
  copyMessage: String,
  isKbGlobalExpanded: Boolean,
  kbSearchTerm: String,
  kbFilterVer: String,
  kbFilterMap: String,
  kbFilterRank: String,
  kbFilterFate: Boolean,
  kbFilterWanted: Boolean,
  kbFilterJob: String,
  showKbJobFilter: Boolean,
  customGroups: Array,
  userPins: Object,
  expandedIds: Object,
  kbFilteredMonsters: Array,
  copyFeedback: String,
  getGroupMonsters: Function
})

const dragOverMonsterId = ref(null)


const emit = defineEmits([
  'toggle-kb-all-expanded', 'close-kanban', 'add-new-group',
  'kb-version-change', 'toggle-kb-job-filter', 'group-drop',
  'update-group-name', 'copy-group-locations', 'delete-group',
  'monster-drag-start', 'monster-drag-over', 'monster-drag-leave', 'monster-drop',
  'toggle-kb-expanded', 'copy-monster-locations', 'remove-pin',
  'monster-location-click', 'copy-all-locations',
  'update:kbSearchTerm', 'update:kbFilterVer', 'update:kbFilterMap',
  'update:kbFilterRank', 'update:kbFilterFate', 'update:kbFilterWanted', 'update:kbFilterJob'
])

const getMapsForVersionLocal = version => getMapsForVersion(version)
</script>
