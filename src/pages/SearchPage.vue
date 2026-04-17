<template>
  <div class="flex flex-col h-full bg-slate-50 overflow-hidden">
    <!-- Navbar -->
    <nav class="bg-slate-900 text-white p-3 flex justify-between items-center shrink-0 z-50">
      <div class="flex items-center gap-3">
        <div class="bg-blue-600 p-1.5 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-black text-xs tracking-tighter uppercase">FINAL FANTASY XIV 繁體中文怪物座標查詢工具</span>
            <span class="inline-flex items-center px-2 py-1 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black tracking-widest">v{{ appVersion }}</span>
          </div>
          <div class="text-[9px] text-blue-400 font-bold uppercase">{{ userStore.virtualId }}</div>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <RouterLink
          v-if="userStore.isAdmin"
          to="/admin"
          class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-900 shadow-md"
        >
          管理員
        </RouterLink>

        <button
          @click="appStore.toggleThemeMode()"
          :title="appStore.themeMode === 'dark' ? '切換回一般模式' : '切換到護眼模式'"
          class="p-2 rounded-full border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors"
        >
          <template v-if="appStore.themeMode === 'dark'">
            <Sun size="18" />
          </template>
          <template v-else>
            <Moon size="18" />
          </template>
        </button>

        <button
          @click="logout"
          class="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </nav>

    <!-- 主容器 -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- 左邊 - 搜尋看板 -->
      <div :class="['flex-1 flex flex-col transition-all duration-300', showKanban ? 'sm:mr-[380px] mr-0' : 'mr-0']">
        <!-- 搜尋工具欄 -->
        <div class="p-4 bg-white border-b space-y-3 z-30 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="relative flex-1">
              <Search size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="searchTerm"
                @input="resetSearchPageSilent()"
                class="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-2xl text-xs outline-none font-bold"
                placeholder="搜尋怪物..."
              />
            </div>
            <button
              @click="toggleMainAllExpanded"
              :class="['px-3 py-2 rounded-2xl flex items-center justify-center gap-2 transition-all border', isMainGlobalExpanded ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200']"
              :title="isMainGlobalExpanded ? '展開座標' : '摺疊座標'"
            >
              <ChevronDown v-if="isMainGlobalExpanded" size="18" />
              <ChevronUp v-else size="18" />
              <span class="text-[12px] font-black">{{ isMainGlobalExpanded ? '展開座標' : '摺疊座標' }}</span>
            </button>
            <button
              @click="showKanban = !showKanban"
              :class="['px-4 py-2.5 rounded-2xl flex items-center gap-2 text-[12px] font-black transition-all border', showKanban ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-slate-500 border-slate-200']"
            >
              <Layout :size="14" :class="showKanban ? 'text-amber-600' : 'text-slate-400'" />
              <span>追蹤板</span>
            </button>
          </div>

          <!-- 篩選條件 -->
          <div class="flex gap-2 items-center flex-wrap">
            <select
              v-model="filterVer"
              @change="onSearchVersionChange"
              class="bg-slate-100 px-3 py-1.5 rounded-xl text-[14px] font-black outline-none"
            >
              <option value="">全版本</option>
              <option v-for="v in VERSIONS" :key="v" :value="v">{{ v }}</option>
            </select>

            <select
              v-model="filterMap"
              @change="resetSearchPageSilent()"
              class="bg-slate-100 px-3 py-1.5 rounded-xl text-[14px] font-black outline-none"
            >
              <option value="">{{ filterVer ? `${filterVer} 所有地圖` : '所有地圖' }}</option>
              <option v-for="m in getMapsForVersion(filterVer)" :key="m" :value="m">{{ m }}</option>
            </select>

            <select
              v-model="filterRank"
              @change="resetSearchPageSilent()"
              class="bg-slate-100 px-3 py-1.5 rounded-xl text-[14px] font-black outline-none"
            >
              <option value="">等級</option>
              <option v-for="r in RANKS" :key="r" :value="r">{{ r === 'None' ? '一般' : `${r}級` }}</option>
            </select>

            <button
              @click="filterFate = !filterFate; resetSearchPageSilent()"
              :class="[
                'px-3 py-1.5 rounded-xl text-[14px] font-black border transition-all',
                filterFate
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              ]"
            >
              FATE
            </button>

            <button
              @click="filterWanted = !filterWanted; resetSearchPageSilent()"
              :class="[
                'px-3 py-1.5 rounded-xl text-[14px] font-black border transition-all',
                filterWanted
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              ]"
            >
              通緝令
            </button>

            <button
              @click="toggleJobFilter"
              :class="[
                'px-3 py-1.5 rounded-xl text-[14px] font-black border transition-all',
                filterJob
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              ]"
            >
              討伐筆記
            </button>

            <select
              v-if="showJobFilter"
              v-model="filterJob"
              @change="resetSearchPageSilent()"
              class="bg-slate-100 px-3 py-1.5 rounded-xl text-[14px] font-black outline-none border"
            >
              <option value="*">全部</option>
              <option v-for="j in JOB_BASE_NAMES" :key="j" :value="j">{{ j }}</option>
            </select>
          </div>
        </div>
        <!-- 沐窗區域 -->
        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <!-- 分頁導航 -->
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-2 border">
          <div class="flex items-center gap-3">
            <span class="text-[12px] font-bold text-slate-600">
              第 <span class="font-black text-slate-800">{{ searchCurrentPage }}</span> 頁
              <span class="text-slate-400">| 本頁 {{ searchPagedMonsters.length }} 筆</span>
              <span class="text-slate-400">| 共 {{ totalMonsters === null ? '...' : totalMonsters }} 筆</span>
            </span>
            <select
              v-model.number="searchPageSize"
              @change="resetSearchPageSilent()"
              class="bg-white border p-1.5 rounded text-[11px] font-black outline-none"
            >
              <option value="20">20筆</option>
              <option value="50">50筆</option>
              <option value="100">100筆</option>
              <option value="300">300筆</option>
              <option value="500">500筆</option>
              <option value="1000">1000筆</option>
            </select>
            <select
              v-model="searchSortField"
              @change="onSearchSortFieldChange"
              class="bg-white border p-1.5 rounded text-[11px] font-black outline-none"
            >
              <option value="name">名字</option>
              <option value="job">討伐筆記</option>
              <option value="map">地圖</option>
            </select>
            <select
              v-if="searchSortField === 'job'"
              v-model="searchSortJobs"
              @change="resetSearchPageSilent()"
              class="bg-white border p-1.5 rounded text-[11px] font-black outline-none"
            >
              <option value="*">全部</option>
              <option v-for="j in JOB_BASE_NAMES" :key="j" :value="j">{{ j }}</option>
            </select>
            <button
              @click="searchSortDir = searchSortDir === 'asc' ? 'desc' : 'asc'"
              :title="`排序：${searchSortDir === 'asc' ? '升序' : '降序'}`"
              class="px-3 py-1.5 bg-white border text-[11px] font-black rounded hover:bg-slate-50 flex items-center gap-1"
            >
              <ArrowUpDown size="14" />
              {{ searchSortDir === 'asc' ? '升序' : '降序' }}
            </button>
          </div>
          <div class="flex gap-2">
            <button
              @click="searchCurrentPage = Math.max(searchCurrentPage - 1, 1)"
              :disabled="searchCurrentPage === 1"
              class="px-3 py-1.5 bg-white border rounded-lg text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              ← 上一頁
            </button>
            <button
              @click="searchCurrentPage = searchCurrentPage + 1"
              :disabled="!searchHasNextPage"
              class="px-3 py-1.5 bg-white border rounded-lg text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              下一頁 →
            </button>
          </div>
        </div>

        <!-- 怪物卡片網格 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-4">
            <div
              v-for="m in searchPagedMonsters"
              :key="m.id"
              class="bg-white rounded-3xl border border-slate-200 hover:border-blue-400 transition-all overflow-hidden shadow-sm"
            >
              <div class="p-4">
                <!-- 怪物名稱和標籤 -->
                <div class="flex justify-between items-start mb-2">
                  <div class="flex flex-col flex-1 cursor-pointer" @click="toggleMainExpanded(m.id)">
                    <div class="flex flex-wrap items-center gap-1.5 mb-1">
                      <ChevronDown v-if="mainExpandedIds[m.id]" size="12" class="text-slate-400" />
                      <ChevronRight v-else size="12" class="text-slate-400" />
                      <h4 class="font-black text-slate-800 text-sm mr-0.5">{{ m.name }}</h4>
                      <VersionTag :version="m.version" />
                      <RankTag :rank="m.rank" />
                      <FateTag :isFate="m.isFate" />
                      <WantedTag :isWanted="m.isWanted" />
                      <JobTag :jobs="m.jobs || []" />
                    </div>
                  </div>
                  <button
                    @click="handleCopyMonsterLocations(m)"
                    class="p-2 rounded-full border border-slate-200 bg-white text-blue-400 shadow transition-all hover:bg-blue-500 hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 focus-visible:ring-offset-0 active:scale-95 app-copy-btn"
                    title="複製怪物所有位置座標"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/></svg>
                  </button>
                  <button
                    @click="handleTogglePin(m.id)"
                    :class="[
                      'p-2 rounded-xl border border-slate-200 bg-white shadow transition-all focus:outline-none focus:ring-2 focus:ring-slate-400/30 active:scale-95',
                      userPins[m.id]
                        ? 'bg-amber-100 text-amber-600 border-amber-200'
                        : 'text-slate-500 hover:text-amber-300'
                    ]"
                  >
                    <Pin size="14" :fill="userPins[m.id] ? 'currentColor' : 'none'" />
                  </button>
                </div>

                <!-- 展開的位置列表 -->
                <div v-if="mainExpandedIds[m.id] && m.locations && m.locations.length > 0" class="space-y-1.5">
                  <button
                    v-for="(loc, i) in m.locations"
                    :key="i"
                    @click="m.isFate || (m.rank && m.rank !== 'None') ? handleOpenLocationMap(m, loc) : handleCopyLocation(m.name, loc, `${m.id}-${i}`)"
                    class="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-600 hover:text-white text-left relative transition-all group/loc"
                    :title="m.isFate || (m.rank && m.rank !== 'None') ? '打開地圖視圖' : '複製座標'"
                  >
                    <div class="flex items-center gap-2">
                      <div class="text-[9px] font-black opacity-60 group-hover/loc:opacity-100">{{ loc.map }}</div>
                      <div v-if="m.isFate || !m.rank || m.rank === 'None'" class="font-mono font-bold text-[10px]">X:{{ loc.x }} Y:{{ loc.y }}</div>
                      <div v-if="m.rank && m.rank !== 'None'" class="text-[9px] text-amber-600 font-black">(菁英怪物地圖位置)</div>
                      <span v-if="m.isFate || (m.rank && m.rank !== 'None')" class="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 group-hover/loc:bg-blue-600 group-hover/loc:text-white transition-colors">
                        <ArrowUpRight size="16" />
                      </span>
                      <div
                        v-if="copyFeedback === `${m.id}-${i}`"
                        class="absolute inset-0 z-10 rounded-xl flex items-center justify-center bg-green-500/90 ring-2 ring-white/70"
                      >
                        <Check size="12" class="text-white" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MonsterDetailModal
        :open="monsterDetailModal.open"
        :monster="monsterDetailModal.monster"
        :location="monsterDetailModal.location"
        :loading="monsterDetailModal.loading"
        :onOpenMap="openMapInNewTab"
        @close="handleCloseMonsterDetailModal"
      />

      <div v-if="copyMessage" class="fixed top-4 left-1/2 z-50 -translate-x-1/2 px-4 py-2 rounded-2xl bg-slate-950/90 text-white text-xs font-bold shadow-xl backdrop-blur-sm max-w-[280px] text-center">
        {{ copyMessage }}
      </div>
      <KanbanPanel
        :show="showKanban"
        :copyMessage="copyMessage"
        :isKbGlobalExpanded="isKbGlobalExpanded"
        :kbSearchTerm="kbSearchTerm"
        :kbFilterVer="kbFilterVer"
        :kbFilterMap="kbFilterMap"
        :kbFilterRank="kbFilterRank"
        :kbFilterFate="kbFilterFate"
        :kbFilterWanted="kbFilterWanted"
        :kbFilterJob="kbFilterJob"
        :showKbJobFilter="showKbJobFilter"
        :customGroups="customGroups"
        :userPins="userPins"
        :expandedIds="expandedIds"
        :kbFilteredMonsters="kbFilteredMonsters"
        :dragOverMonsterId="dragOverMonsterId"
        :copyFeedback="copyFeedback"
        :getGroupMonsters="getGroupMonsters"
        @toggle-kb-all-expanded="toggleKbAllExpanded"
        @close-kanban="showKanban = false"
        @add-new-group="addNewGroup"
        @kb-version-change="onKbVersionChange"
        @toggle-kb-job-filter="toggleKbJobFilter"
        @group-drop="handleGroupDrop"
        @update-group-name="updateGroupName"
        @copy-group-locations="handleCopyGroupLocations"
        @delete-group="deleteGroup"
        @monster-drag-start="handleMonsterDragStart"
        @monster-drag-over="handleMonsterDragOver"
        @monster-drag-leave="handleMonsterDragLeave"
        @monster-drop="handleMonsterDrop"
        @toggle-kb-expanded="toggleKbExpanded"
        @copy-monster-locations="handleCopyMonsterLocations"
        @remove-pin="pinsStore.removePin($event, userStore.virtualId)"
        @monster-location-click="(m, loc, key) => m.isFate || (m.rank && m.rank !== 'None') ? handleOpenLocationMap(m, loc) : handleCopyLocation(m.name, loc, key)"
        @copy-all-locations="handleCopyAllLocations"
        @update:kbSearchTerm="val => kbSearchTerm = val"
        @update:kbFilterVer="val => kbFilterVer = val"
        @update:kbFilterMap="val => kbFilterMap = val"
        @update:kbFilterRank="val => kbFilterRank = val"
        @update:kbFilterFate="val => kbFilterFate = val"
        @update:kbFilterWanted="val => kbFilterWanted = val"
        @update:kbFilterJob="val => kbFilterJob = val"
      />
      <div :class="['absolute right-0 top-0 bottom-0 sm:w-[380px] w-full bg-slate-100 border-l sm:border-l shadow-2xl transition-transform duration-300 flex flex-col z-40 overflow-hidden', showKanban ? 'translate-x-0' : 'translate-x-full']">
        <!-- 追蹤看板頭部 -->
        <div class="p-4 bg-white border-b flex justify-between items-center">
          <div class="flex items-center gap-3">
            <h2 class="font-black text-xs text-slate-800 uppercase tracking-widest shrink-0">追蹤看板</h2>
            <button
              @click="toggleKbAllExpanded"
              :class="['px-2 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all border', isKbGlobalExpanded ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200']"
              :title="isKbGlobalExpanded ? '展開座標' : '摺疊座標'"
            >
              <ChevronDown v-if="isKbGlobalExpanded" size="14" />
              <ChevronUp v-else size="14" />
              <span class="text-[11px] font-black">{{ isKbGlobalExpanded ? '展開座標' : '摺疊座標' }}</span>
            </button>
            <button
              @click="showKanban = false"
              class="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg border border-slate-200 font-black text-xs transition-all"
              title="收起追蹤看板"
            >
              收起
            </button>
          </div>
          <button
            @click="addNewGroup"
            class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-100 text-xs"
          >
            <Plus size="16" />
          </button>
        </div>

        <!-- 追蹤看板篩選 -->
        <div class="p-3 bg-white border-b space-y-2 shadow-sm">
          <div class="relative flex items-center">
            <Filter size="10" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="kbSearchTerm"
              class="w-full pl-7 pr-4 py-1.5 bg-slate-50 rounded-xl text-[12px] outline-none font-bold"
              placeholder="過濾追蹤內容..."
            />
            <button
              @click="handleCopyAllLocations"
              class="ml-2 p-1.5 rounded-full bg-slate-100 hover:bg-blue-500 hover:text-white text-blue-500 transition-all border border-blue-100"
              title="一鍵複製所有怪物位置"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/></svg>
            </button>
          </div>
          <div class="flex gap-2 flex-wrap">
            <select
              v-model="kbFilterVer"
              @change="onKbVersionChange"
              class="bg-slate-50 px-2 py-1 rounded-lg text-[12px] font-black outline-none border"
            >
              <option value="">全版本</option>
              <option v-for="v in VERSIONS" :key="v" :value="v">{{ v }}</option>
            </select>
            <select
              v-model="kbFilterMap"
              class="bg-slate-50 px-2 py-1 rounded-lg text-[12px] font-black outline-none border flex-1 min-w-[220px]"
            >
              <option value="">{{ kbFilterVer ? `${kbFilterVer} 地圖` : '全地圖' }}</option>
              <option v-for="m in getMapsForVersion(kbFilterVer)" :key="m" :value="m">{{ m }}</option>
            </select>            <select
              v-model="kbFilterRank"
              class="bg-slate-50 px-2 py-1 rounded-lg text-[12px] font-black outline-none border"
            >
              <option value="">等級</option>
              <option v-for="r in RANKS" :key="r" :value="r">{{ r === 'None' ? '一般' : `${r}級` }}</option>
            </select>            <button
              @click="kbFilterFate = !kbFilterFate"
              :class="['px-2 py-1 rounded-lg text-[12px] font-black border transition-all', kbFilterFate ? 'bg-pink-500 text-white border-pink-500' : 'bg-slate-50 text-slate-400 border-slate-200']"
            >
              FATE
            </button>
            <button
              @click="kbFilterWanted = !kbFilterWanted"
              :class="['px-2 py-1 rounded-lg text-[12px] font-black border transition-all', kbFilterWanted ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 text-slate-400 border-slate-200']"
            >
              通緝令
            </button>
            <button
              @click="toggleKbJobFilter"
              :class="['px-2 py-1 rounded-lg text-[12px] font-black border transition-all', kbFilterJob ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-50 text-slate-400 border-slate-200']"
            >
              討伐筆記
            </button>
            <select
              v-if="showKbJobFilter"
              v-model="kbFilterJob"
              class="bg-slate-50 px-2 py-1 rounded-lg text-[12px] font-black outline-none border"
            >
              <option value="*">全部</option>
              <option v-for="j in JOB_BASE_NAMES" :key="j" :value="j">{{ j }}</option>
            </select>
          </div>
        </div>

        <!-- 分組列表 -->
        <div class="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar bg-slate-50">
          <div
            v-for="group in customGroups"
            :key="group.id"
            @dragover.prevent="dragOverMonsterId = 'group-' + group.id"
            @dragleave="dragOverMonsterId === 'group-' + group.id && (dragOverMonsterId = null)"
            @drop="handleGroupDrop($event, group.id)"
            :class="['bg-white rounded-2xl border p-3 space-y-3 shadow-sm transition-all', dragOverMonsterId === 'group-' + group.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200']"
          >
            <!-- 分組頭部 -->
            <div class="flex justify-between items-center px-1">
              <input
                :value="group.name"
                @input="updateGroupName(group.id, $event.target.value)"
                class="bg-transparent font-black text-[11px] outline-none text-slate-700 w-full p-1 focus:bg-slate-50 rounded"
              />
              <div class="flex items-center gap-2">
                <span class="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full">
                  {{ getGroupMonsters(group.id).length }}
                </span>
                <button
                  @click="handleCopyGroupLocations(group.id)"
                  title="區域複製：複製此分組中怪物的座標"
                  class="p-1 rounded-full border border-slate-200 bg-white text-blue-400 shadow transition-all hover:bg-blue-500 hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 focus-visible:ring-offset-0 active:scale-95 app-copy-btn"
                >
                  <Copy size="12" />
                </button>
                <button                  v-if="group.canDelete"
                  @click="deleteGroup(group.id)"
                  class="text-slate-300 hover:text-red-400"
                >
                  <Trash2 size="12" />
                </button>
              </div>
            </div>

            <!-- 分組內的怪物 -->
            <div class="flex flex-col gap-2">
              <div
                v-for="m in getGroupMonsters(group.id)"
                :key="`kb-${m.id}`"
                :class="['border rounded-xl relative group/card cursor-grab active:cursor-grabbing shadow-sm transition-all', 
                  m.rank === 'S' || m.rank === 'SS' ? 'bg-amber-50 border-amber-100' : 'bg-orange-50 border-orange-100']"
                draggable="true"
                @dragstart="handleMonsterDragStart($event, m.id)"
                @dragover="handleMonsterDragOver($event, m.id)"
                @dragleave="handleMonsterDragLeave()"
                @drop="handleMonsterDrop($event, m.id, group.id)"
              >
                <div
                  @click="toggleKbExpanded(m.id)"
                  class="p-3 flex justify-between items-start cursor-pointer hover:bg-black/5 rounded-t-xl transition-colors"
                >
                  <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 overflow-hidden">
                    <div class="text-[12px] font-black text-slate-800 truncate flex items-center gap-1 shrink-0">
                      <ChevronDown v-if="expandedIds[m.id]" size="10" class="text-slate-400" />
                      <ChevronRight v-else size="10" class="text-slate-400" />
                      {{ m.name }}
                      <VersionTag :version="m.version" />
                      <RankTag :rank="m.rank" />
                      <FateTag :isFate="m.isFate" />                      <WantedTag :isWanted="m.isWanted" />                      <JobTag :jobs="m.jobs || []" />
                    </div>
                  </div>
                  <!-- 取消釘選按鈕 -->
                  <div class="absolute top-2 right-2 flex gap-1">
                    <button
                      @click.stop="handleCopyMonsterLocations(m)"
                      class="p-1 rounded-full border border-slate-200 bg-white text-blue-400 shadow transition-all hover:bg-blue-500 hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 focus-visible:ring-offset-0 active:scale-95 app-copy-btn"
                      title="複製所有位置座標"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/></svg>
                    </button>
                    <button
                      @click.stop="pinsStore.removePin(m.id, userStore.virtualId)"
                      class="p-1 text-slate-300 hover:text-red-500 bg-white rounded-full shadow transition-all"
                      title="取消釘選"
                    >
                      <Trash2 size="14" />
                    </button>
                  </div>
                </div>

                <!-- 位置列表 -->
                <div v-if="expandedIds[m.id] && m.locations && m.locations.length > 0" class="p-3 bg-slate-50 space-y-1 text-[10px] border-t">
                  <div v-for="(loc, i) in m.locations" :key="i" class="flex items-center gap-2">
                    <button
                      @click="m.isFate || (m.rank && m.rank !== 'None') ? handleOpenLocationMap(m, loc) : handleCopyLocation(m.name, loc, `kb-${m.id}-${i}`)"
                      class="w-full p-2 bg-slate-50 rounded-xl hover:bg-blue-600 hover:text-white text-left relative transition-all group/loc text-[10px]"
                      :title="m.isFate || (m.rank && m.rank !== 'None') ? '打開地圖視圖' : '複製座標'"
                    >
                    <div class="flex items-center gap-2">
                      <div class="text-[9px] font-black opacity-60 group-hover/loc:opacity-100">{{ loc.map }}</div>
                      <div v-if="m.isFate || !m.rank || m.rank === 'None'" class="font-mono font-bold">X:{{ loc.x }} Y:{{ loc.y }}</div>
                      <div v-if="m.rank && m.rank !== 'None'" class="text-[9px] text-amber-600 font-black">(菁英怪物地圖位置)</div>
                      <span v-if="m.isFate || (m.rank && m.rank !== 'None')" class="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 group-hover/loc:bg-blue-600 group-hover/loc:text-white transition-colors">
                        <ArrowUpRight size="16" />
                      </span>
                      <div v-if="copyFeedback === `kb-${m.id}-${i}`" class="absolute inset-0 rounded-xl flex items-center justify-center bg-green-500/90 ring-2 ring-white/70">
                        <Check size="12" class="text-white" />
                      </div>
                    </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 複製單一怪物所有位置座標
const handleCopyMonsterLocations = async (monster) => {
  if (!monster.locations || !monster.locations.length) return
  // 按地圖分組
  const mapGroups = {}
  monster.locations.forEach(loc => {
    if (!mapGroups[loc.map]) mapGroups[loc.map] = []
    mapGroups[loc.map].push(`(X: ${loc.x}, Y: ${loc.y})`)
  })
  // 組合
  const mapStr = Object.entries(mapGroups)
    .map(([map, coords]) => `${map} ${coords.join(' ')}`)
    .join(' ')
  const text = `${monster.name} ${mapStr}`.trim()
  await copyToClipboard(text)
  copyFeedback.value = `monster-${monster.id}`
  copyMessage.value = `已複製：${monster.name}`
  setTimeout(() => { if (copyFeedback.value === `monster-${monster.id}`) copyFeedback.value = null; if (copyMessage.value === `已複製：${monster.name}`) copyMessage.value = '' }, 1000)
}

// 複製指定分組的所有怪物位置座標
const handleCopyGroupLocations = async (groupId) => {
  const monsters = getGroupMonsters(groupId)
  if (!monsters || monsters.length === 0) return

  const group = customGroups.value.find(g => g.id === groupId)
  const groupName = group ? group.name : '區域'

  const lines = monsters.map(m => {
    if (!m.locations || !m.locations.length) return m.name
    const mapGroups = {}
    m.locations.forEach(loc => {
      if (!mapGroups[loc.map]) mapGroups[loc.map] = []
      mapGroups[loc.map].push(`(X: ${loc.x}, Y: ${loc.y})`)
    })
    const mapStr = Object.entries(mapGroups)
      .map(([map, coords]) => `${map} ${coords.join(' ')}`)
      .join(' ')
    return `${m.name} ${mapStr}`.trim()
  })

  const text = lines.join('\n')
  await copyToClipboard(text)
  copyFeedback.value = `group-${groupId}`
  copyMessage.value = `已複製：${groupName}`
  setTimeout(() => { if (copyFeedback.value === `group-${groupId}`) copyFeedback.value = null; if (copyMessage.value === `已複製：${groupName}`) copyMessage.value = '' }, 1000)
}

const handleOpenLocationMap = async (monster, loc) => {
  if (!monster || !loc) return

  monsterDetailModal.value.open = true
  monsterDetailModal.value.monster = monster
  monsterDetailModal.value.location = loc
  monsterDetailModal.value.loading = monster.isFate ? !monster.monsterImageData : (!monster.mapImageData || !monster.monsterImageData)

  // 動態加載圖片數據：避免一開始載入大量 Base64
  const shouldLoadImages = monster.isFate ? !monster.monsterImageData : (!monster.mapImageData || !monster.monsterImageData)
  if (shouldLoadImages) {
    try {
      const updated = await monstersStore.loadMonsterImageData(monster.id)
      if (updated && monsterDetailModal.value.monster?.id === monster.id) {
        monsterDetailModal.value.monster = {
          ...monsterDetailModal.value.monster,
          ...updated
        }
      }
    } finally {
      monsterDetailModal.value.loading = false
    }
  } else {
    monsterDetailModal.value.loading = false
  }

  console.log('Opening monster detail modal for', monster)
}

const openMapInNewTab = (src) => {
  if (!src) return
  const w = window.open('', '_blank')
  if (!w) return

  const title = monsterDetailModal.value.monster?.name || '地圖'
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh;}img{max-width:100vw;max-height:100vh;object-fit:contain;}</style></head><body><img id="mapImage" alt="${title}"/></body></html>`)
  w.document.close()

  // 直接 DOM 賦值，避免 URL 編碼/轉義導致 data URL 或特殊 URL 錯誤
  const img = w.document.getElementById('mapImage')
  if (img) img.src = src
}

const handleCloseMonsterDetailModal = () => {
  monsterDetailModal.value.open = false
  monsterDetailModal.value.monster = null
  monsterDetailModal.value.location = null
}

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
  Layout,
  Pin,
  Filter,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowUpDown,
  ArrowUpRight,
  Moon,
  Sun,
  X
} from 'lucide-vue-next'
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getFirestore } from 'firebase/firestore'
import { getFirebaseInstance } from '@/services/firebase'
import { VERSIONS, RANKS, MAP_DATA, JOB_BASE_NAMES } from '@/config/constants'
import { APP_CONFIG } from '@/config/app.config'
import { getMonstersPage, getMonsterCount } from '@/services/database'
import { applyFilter, sortMonsters, getMapsForVersion, copyToClipboard } from '@/services/hunterUtils'
import { useUserStore } from '@/stores/user.store'
import { useMonstersStore } from '@/stores/monsters.store'
import { useUserPinsStore } from '@/stores/user-pins.store'
import { useAppStore } from '@/stores/app.store'
import VersionTag from '@/components/VersionTag.vue'
import RankTag from '@/components/RankTag.vue'
import FateTag from '@/components/FateTag.vue'
import WantedTag from '@/components/WantedTag.vue'
import JobTag from '@/components/JobTag.vue'
import MonsterDetailModal from '@/components/MonsterDetailModal.vue'
import KanbanPanel from '@/components/KanbanPanel.vue'

const userStore = useUserStore()
const monstersStore = useMonstersStore()
const pinsStore = useUserPinsStore()
const appStore = useAppStore()
const router = useRouter()
const appVersion = APP_CONFIG.version

const pageMonsters = ref([])
const isLoadingMonsters = ref(false)

// 搜尋狀態
const searchTerm = ref('')
const filterVer = ref('')
const filterMap = ref('')
const filterRank = ref('')
const filterFate = ref(false)
const filterWanted = ref(false)
const filterJob = ref('')
const showJobFilter = ref(false)

// 追蹤看板狀態
const showKanban = ref(window.innerWidth >= 1024)
const kbSearchTerm = ref('')

const handleResize = () => {
  showKanban.value = window.innerWidth >= 1024
}
const kbFilterVer = ref('')
const kbFilterMap = ref('')
const kbFilterRank = ref('')
const kbFilterFate = ref(false)
const kbFilterWanted = ref(false)
const kbFilterJob = ref('')
const showKbJobFilter = ref(false)

// 分頁狀態
const searchCurrentPage = ref(1)
const searchPageSize = ref(100)
const searchSortField = ref('name')
const searchSortDir = ref('asc')
const searchSortJobs = ref('*') // 排序用職業

// 展開狀態
const mainExpandedIds = ref({})
const expandedIds = ref({})
const isMainGlobalExpanded = ref(false)
const isKbGlobalExpanded = ref(false)

// 複製反饋
const copyFeedback = ref(null)
const copyMessage = ref('')

// 地圖預覽彈窗
const monsterDetailModal = ref({
  open: false,
  monster: null,
  location: null,
  loading: false
})

// 自訂分組
const customGroups = ref([])

// 一鍵複製所有怪物位置
const handleCopyAllLocations = async () => {
  // 取得所有已釘選怪物（已過濾）
  const monsters = kbFilteredMonsters.value
  if (!monsters.length) return

  // 每個怪物一行，格式：
  // 怪物名 地圖1 (X: , Y: ) (X: , Y: ) 地圖2 (X: , Y: ) ...
  const lines = monsters.map(m => {
    if (!m.locations || !m.locations.length) return m.name
    // 按地圖分組
    const mapGroups = {}
    m.locations.forEach(loc => {
      if (!mapGroups[loc.map]) mapGroups[loc.map] = []
      mapGroups[loc.map].push(`(X: ${loc.x}, Y: ${loc.y})`)
    })
    // 組合
    const mapStr = Object.entries(mapGroups)
      .map(([map, coords]) => `${map} ${coords.join(' ')}`)
      .join(' ')
    return `${m.name} ${mapStr}`.trim()
  })
  const text = lines.join('\n')
  await copyToClipboard(text)
  copyFeedback.value = 'all-locations'
  copyMessage.value = '已複製：全部區域'
  // 1 秒後清除提示
  setTimeout(() => {
    if (copyFeedback.value === 'all-locations') copyFeedback.value = null
    if (copyMessage.value === '已複製：全部區域') copyMessage.value = ''
  }, 1000)
}

// 用戶 PIN
const userPins = computed(() => pinsStore.pins)

const pageCursors = ref({ 1: null })
const pageHasMore = ref(false)
const lastQueryKey = ref('')
const totalMonsters = ref(null)
const queryCountCache = ref({})

const pageFilters = computed(() => ({
  searchTerm: searchTerm.value,
  version: filterVer.value || undefined,
  map: filterMap.value || undefined,
  rank: filterRank.value || undefined,
  isFate: filterFate.value ? true : undefined,
  isWanted: filterWanted.value ? true : undefined,
  job: filterJob.value && filterJob.value !== '*' ? filterJob.value : undefined,
  sortDir: searchSortDir.value,
  sortField: searchSortField.value
}))

const useLocalMonsterCache = computed(() => Array.isArray(monstersStore.monsters) && monstersStore.monsters.length > 0)

const localFilteredMonsters = computed(() => {
  if (!useLocalMonsterCache.value) return []
  return applyFilter(
    monstersStore.monsters,
    searchTerm.value,
    filterVer.value,
    filterMap.value,
    filterRank.value,
    filterFate.value,
    filterWanted.value,
    filterJob.value
  )
})

const localSortedMonsters = computed(() => {
  if (!useLocalMonsterCache.value) return []
  return sortMonsters(
    localFilteredMonsters.value,
    searchSortField.value,
    searchSortDir.value,
    searchSortJobs.value
  )
})

const localPageMonsters = computed(() => {
  const start = (searchCurrentPage.value - 1) * searchPageSize.value
  return localSortedMonsters.value.slice(start, start + searchPageSize.value)
})

const localFilteredTotal = computed(() => localFilteredMonsters.value.length)

const searchPagedMonsters = computed(() => {
  if (useLocalMonsterCache.value) {
    return localPageMonsters.value
  }
  if (searchSortField.value === 'name') {
    return pageMonsters.value
  }
  return sortMonsters(
    pageMonsters.value,
    searchSortField.value,
    searchSortDir.value,
    searchSortJobs.value
  )
})
const searchHasNextPage = computed(() => {
  if (useLocalMonsterCache.value) {
    return searchCurrentPage.value * searchPageSize.value < localFilteredTotal.value
  }
  return pageHasMore.value
})

const getQueryKey = () => JSON.stringify({
  searchTerm: searchTerm.value,
  version: filterVer.value || '',
  map: filterMap.value || '',
  rank: filterRank.value || '',
  isFate: filterFate.value ? '1' : '0',
  isWanted: filterWanted.value ? '1' : '0',
  job: filterJob.value && filterJob.value !== '*' ? filterJob.value : '',
  sortDir: searchSortDir.value,
  sortField: searchSortField.value,
  pageSize: searchPageSize.value
})

const getCountKey = () => JSON.stringify({
  searchTerm: searchTerm.value,
  version: filterVer.value || '',
  map: filterMap.value || '',
  rank: filterRank.value || '',
  isFate: filterFate.value ? '1' : '0',
  isWanted: filterWanted.value ? '1' : '0',
  job: filterJob.value && filterJob.value !== '*' ? filterJob.value : '',
  sortDir: searchSortDir.value,
  sortField: searchSortField.value
})

const resetSearchPagination = () => {
  pageCursors.value = { 1: null }
  pageHasMore.value = false
}

const loadMonsterCount = async (filters) => {
  try {
    if (useLocalMonsterCache.value) {
      totalMonsters.value = localFilteredTotal.value
      return
    }

    const countKey = getCountKey()
    if (queryCountCache.value[countKey] !== undefined) {
      totalMonsters.value = queryCountCache.value[countKey]
      return
    }

    const count = await getMonsterCount(filters)
    queryCountCache.value[countKey] = count
    totalMonsters.value = count
  } catch (error) {
    console.error('✗ 讀取怪物總數失敗:', error)
    totalMonsters.value = null
  }
}

const loadMonsterPage = async (targetPage = searchCurrentPage.value) => {
  isLoadingMonsters.value = true
  try {
    const queryKey = getQueryKey()
    const filters = pageFilters.value
    if (lastQueryKey.value !== queryKey) {
      resetSearchPagination()
      lastQueryKey.value = queryKey
      targetPage = 1
      searchCurrentPage.value = 1
      totalMonsters.value = null
      await loadMonsterCount(filters)
    }

    const pageNumber = Math.max(1, targetPage)

    if (useLocalMonsterCache.value) {
      pageMonsters.value = localPageMonsters.value
      pageHasMore.value = searchCurrentPage.value * searchPageSize.value < localFilteredTotal.value
      return
    }

    for (let page = 1; page < pageNumber; page++) {
      if (pageCursors.value[page] === undefined) {
        break
      }
      if (pageCursors.value[page + 1] !== undefined) {
        continue
      }
      const result = await getMonstersPage(searchPageSize.value, filters, pageCursors.value[page])
      pageCursors.value[page + 1] = result.lastDoc
      if (!result.hasMore) {
        break
      }
    }

    const cursor = pageCursors.value[pageNumber] || null
    const result = await getMonstersPage(searchPageSize.value, filters, cursor)
    pageMonsters.value = result.monsters
    pageHasMore.value = result.hasMore
    if (result.lastDoc) {
      pageCursors.value[pageNumber + 1] = result.lastDoc
    }
  } catch (error) {
    console.error('✗ 讀取分頁怪物失敗:', error)
    pageMonsters.value = []
    pageHasMore.value = false
  } finally {
    isLoadingMonsters.value = false
  }
}

let searchTermTimeout = null
let filterChangeTimeout = null
let suppressPageLoad = false

const resetSearchPageSilent = () => {
  suppressPageLoad = true
  searchCurrentPage.value = 1
  suppressPageLoad = false
}

watch(searchTerm, () => {
  clearTimeout(searchTermTimeout)
  searchTermTimeout = setTimeout(async () => {
    suppressPageLoad = true
    searchCurrentPage.value = 1
    await loadMonsterPage()
    suppressPageLoad = false
  }, 300)
})

const scheduleFilterUpdate = async () => {
  clearTimeout(filterChangeTimeout)
  filterChangeTimeout = setTimeout(async () => {
    suppressPageLoad = true
    searchCurrentPage.value = 1
    await loadMonsterPage()
    suppressPageLoad = false
  }, 300)
}

watch([
  filterVer,
  filterMap,
  filterRank,
  filterFate,
  filterWanted,
  filterJob
], scheduleFilterUpdate)

watch([
  searchSortDir,
  searchSortField,
  searchSortJobs,
  searchPageSize
], async () => {
  suppressPageLoad = true
  searchCurrentPage.value = 1
  await loadMonsterPage()
  suppressPageLoad = false
})

watch(searchCurrentPage, () => {
  if (!suppressPageLoad) {
    loadMonsterPage()
  }
})

// 追蹤看板過濾
const kbFilteredMonsters = computed(() => {
  if (!monstersStore.monsters || monstersStore.monsters.length === 0) {
    return []
  }
  return applyFilter(
    monstersStore.monsters.filter(m => userPins.value[m.id]),
    kbSearchTerm.value,
    kbFilterVer.value,
    kbFilterMap.value,
    kbFilterRank.value,
    kbFilterFate.value,
    kbFilterWanted.value,
    kbFilterJob.value
  )
})

// 獲取分組內的怪物
const getGroupMonsters = groupId =>
  kbFilteredMonsters.value.filter(m => userPins.value[m.id] === groupId)

// PIN 切換
const handleTogglePin = async mId => {
  if (!userStore.virtualId || !userStore.virtualId.trim()) {
    console.warn('⚠ 無效用戶 ID，無法更新追蹤項目')
    return
  }

  if (userPins.value[mId]) {
    await pinsStore.removePin(mId, userStore.virtualId)
  } else {
    expandedIds.value[mId] = isKbGlobalExpanded.value
    const targetGroupId = customGroups.value[0]?.id || pinsStore.defaultGroup?.id || 'default'
    await pinsStore.addPin(mId, userStore.virtualId, targetGroupId)
  }
}

// 複製位置
const handleCopyLocation = async (name, loc, key) => {
  const text = `${name} ${loc.map} (X: ${loc.x}, Y: ${loc.y})`
  await copyToClipboard(text)
  copyFeedback.value = key
  copyMessage.value = `已複製：${name}`
  setTimeout(() => { copyFeedback.value = null; copyMessage.value = '' }, 1000)
}

// 全部展開 / 摺疊
const setMainAllExpanded = expanded => {
  isMainGlobalExpanded.value = expanded
  const newStates = {}
  searchPagedMonsters.value.forEach(m => {
    newStates[m.id] = expanded
  })
  mainExpandedIds.value = newStates
}

const toggleMainAllExpanded = () => {
  setMainAllExpanded(!isMainGlobalExpanded.value)
}

// 當排序或過濾導致結果重新排列，若處於「全展開」狀態則保持展開
watch(
  () => searchPagedMonsters.value.map(m => m.id).join(','),
  () => {
    if (isMainGlobalExpanded.value) {
      setMainAllExpanded(true)
    }
  }
)

const toggleKbAllExpanded = () => {
  isKbGlobalExpanded.value = !isKbGlobalExpanded.value
  const newStates = {}
  monstersStore.monsters.forEach(m => {
    if (userPins.value[m.id]) newStates[m.id] = isKbGlobalExpanded.value
  })
  expandedIds.value = newStates
}

// 切換展開
const toggleMainExpanded = id => {
  mainExpandedIds.value[id] = !mainExpandedIds.value[id]
}

const toggleKbExpanded = id => {
  expandedIds.value[id] = !expandedIds.value[id]
}

// 排序欄位切換時，若不是 job，清空排序職業
const onSearchSortFieldChange = () => {
  if (searchSortField.value !== 'job') {
    searchSortJobs.value = '*'
  } else if (!searchSortJobs.value) {
    searchSortJobs.value = '*'
  }
  // 不切換頁數，保持目前展開/頁面狀態
  // searchCurrentPage.value = 1
}

// 監聽 filterJob 變動，當排序欄位為 job 且 searchSortJobs 未選擇時自動預設
watch(
  () => filterJob.value,
  (val) => {
    if (searchSortField.value === 'job') {
      if (!val || val === '*') {
        searchSortJobs.value = '*'
      } else {
        searchSortJobs.value = val
      }
    }
  }
)

// 職業過濾切換
const onSearchVersionChange = () => {
  filterMap.value = ''
  resetSearchPageSilent()
}

const toggleJobFilter = () => {
  if (filterJob.value) {
    filterJob.value = ''
    showJobFilter.value = false
    if (searchSortField.value === 'job') {
      searchSortJobs.value = '*'
    }
  } else {
    filterJob.value = '*'
    showJobFilter.value = true
    searchSortField.value = 'job'
    if (filterJob.value && filterJob.value !== '*') {
      searchSortJobs.value = filterJob.value
    } else {
      searchSortJobs.value = '*'
    }
  }
  resetSearchPageSilent()
}

const onKbVersionChange = () => {
  kbFilterMap.value = ''
}

const toggleKbJobFilter = () => {
  if (kbFilterJob.value) {
    kbFilterJob.value = ''
    showKbJobFilter.value = false
  } else {
    kbFilterJob.value = '*'
    showKbJobFilter.value = true
  }
}

// 追蹤看板操作
const addNewGroup = async () => {
  const id = `g_${Date.now()}`
  const db = getFirestore()
  await setDoc(
    doc(
      db,
      'artifacts',
      userStore.appId,
      'users',
      userStore.virtualId,
      'groups',
      id
    ),
    { name: '新分組', order: customGroups.value.length, canDelete: true }
  )
}

const updateGroupName = async (groupId, name) => {
  const db = getFirestore()
  await updateDoc(
    doc(
      db,
      'artifacts',
      userStore.appId,
      'users',
      userStore.virtualId,
      'groups',
      groupId
    ),
    { name }
  )
}

const deleteGroup = async groupId => {
  if (!confirm('刪除分組？')) return
  const db = getFirestore()
  await deleteDoc(
    doc(
      db,
      'artifacts',
      userStore.appId,
      'users',
      userStore.virtualId,
      'groups',
      groupId
    )
  )
}

const handleGroupDrop = async (e, groupId) => {
  const monsterId = e.dataTransfer.getData('monsterId')
  if (monsterId) {
    await pinsStore.movePin(monsterId, groupId, userStore.virtualId)
  }
}

// 怪物排序相關
const draggedMonsterId = ref(null)
const dragOverMonsterId = ref(null)

const handleMonsterDragStart = (e, monsterId) => {
  draggedMonsterId.value = monsterId
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('monsterId', monsterId)
}

const handleMonsterDragOver = (e, monsterId) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dragOverMonsterId.value = monsterId
}

const handleMonsterDragLeave = () => {
  dragOverMonsterId.value = null
}

const handleMonsterDrop = async (e, targetMonsterId, groupId) => {
  e.preventDefault()
  const sourceMonsterId = e.dataTransfer.getData('monsterId') || draggedMonsterId.value
  
  if (sourceMonsterId && sourceMonsterId !== targetMonsterId) {
    // 同分組內排序 - 互換位置
    draggedMonsterId.value = null
    dragOverMonsterId.value = null
    
    // 這裡可以實現排序邏輯，暫時只支持分組間拖曳
    // 後續可添加排序 order 字段的更新邏輯
  }
}

watch(
  () => userStore.virtualId,
  async (newUserId, oldUserId) => {
    if (!newUserId || !newUserId.trim()) {
      pinsStore.stopWatching()
      pinsStore.pins = {}
      return
    }

    if (newUserId !== oldUserId) {
      await pinsStore.initialize(newUserId)
      pinsStore.stopWatching()
      await pinsStore.watchPins(newUserId)
    }
  }
)

const logout = async () => {
  await userStore.logout()
  await router.push('/login')
}

// 初始化
onMounted(async () => {
  console.log('🔍 SearchPage mounted')
  console.log('AppID:', userStore.appId)
  console.log('VirtualID:', userStore.virtualId)
  
  // 目前只載入頁面分頁怪物資料，避免全量讀取和實時監聽
  console.log('📡 單次載入分頁怪物資料，不啟用整批讀取或實時監聽')

  // 初始化用戶追蹤清單 + 實時監聽
  if (!userStore.virtualId || !userStore.virtualId.trim()) {
    console.warn('⚠ 無效用戶 ID，無法初始化追蹤板。')
  } else {
    await pinsStore.initialize(userStore.virtualId)
    await pinsStore.watchPins(userStore.virtualId)
  }

  // 預先一次性載入所有怪物資料，後續搜尋、篩選改用本地快取，減少重複查詢
  if (!monstersStore.monsters.length) {
    await monstersStore.initializeMonsters()
  }
  await loadMonsterPage()

  // 監聽分組
  const { db } = getFirebaseInstance()
  onSnapshot(
    collection(db, 'artifacts', userStore.appId, 'users', userStore.virtualId, 'groups'),
    snapshot => {
      const groups = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      if (groups.length === 0) {
        setDoc(
          doc(
            db,
            'artifacts',
            userStore.appId,
            'users',
            userStore.virtualId,
            'groups',
            'default'
          ),
          { name: '常用區域', order: 0, canDelete: false }
        )
      } else {
        customGroups.value = groups.sort((a, b) => a.order - b.order)
      }
    }
  )

  // 動態調整：手機窄屏自動隱藏追蹤看板，桌面寬屏預設顯示
  window.addEventListener('resize', handleResize)
  handleResize()
  handleResize()

  // ESC 關閉地圖彈窗
  const escListener = (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (monsterDetailModal.value.open) {
        handleCloseMonsterDetailModal()
      }
    }
  }
  window.addEventListener('keydown', escListener)

  onUnmounted(() => {
    pinsStore.stopWatching()
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', escListener)
  })
})

</script>

<style scoped>
.animate-in {
  animation: fadeIn 0.2s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
