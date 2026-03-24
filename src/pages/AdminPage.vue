<template>
  <div class="fixed inset-0 bg-white z-[60] flex flex-col p-6 animate-in overflow-hidden">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-slate-900 text-white rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h2 class="text-2xl font-black tracking-tighter text-slate-900 uppercase">管理控制台</h2>
      </div>

      <div class="flex gap-2">
        <button
          @click="showBulkMonsterModal = true"
          class="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all"
        >
          批量新增怪物
        </button>

        <button
          @click="newMonster"
          class="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all"
        >
          新增怪物
        </button>

        <button
          @click="$router.push('/search')"
          class="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl font-black text-xs hover:bg-slate-200 transition-all"
        >
          返回狩獵板
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-slate-50 p-4 rounded-2xl mb-4 flex gap-4 items-center border border-slate-200 flex-wrap">
      <select
        v-model="adminFilterVer"
        @change="refreshMonsters(1)"
        class="bg-white border p-2 rounded-lg text-xs font-bold outline-none"
      >
        <option value="">全版本</option>
        <option v-for="v in VERSIONS" :key="v" :value="v">{{ v }}</option>
      </select>

      <select
        v-model="adminFilterMap"
        @change="refreshMonsters(1)"
        class="bg-white border p-2 rounded-lg text-xs font-bold outline-none w-48"
      >
        <option value="">{{ adminFilterVer ? `${adminFilterVer} 地圖` : '所有地圖' }}</option>
        <option v-for="map in getMapsForVersion(adminFilterVer)" :key="map" :value="map">{{ map }}</option>
      </select>

      <select
        v-model="adminFilterRank"
        @change="refreshMonsters(1)"
        class="bg-white border p-2 rounded-lg text-xs font-bold outline-none"
      >
        <option value="">等級</option>
        <option v-for="r in RANKS" :key="r" :value="r">{{ r === 'None' ? '一般' : `${r}級` }}</option>
      </select>

      <button
        @click="adminFilterFate = !adminFilterFate; refreshMonsters(1);"
        :class="[
          'px-4 py-2 rounded-lg text-xs font-black border transition-all',
          adminFilterFate ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-slate-400 border-slate-200'
        ]"
      >
        FATE
      </button>

      <button @click="toggleJobsFilter" :class="['px-4 py-2 rounded-lg text-xs font-black border transition-all', adminFilterJobs ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-200']">
        討伐筆記
      </button>
      <select v-if="showAdminJobsFilter" v-model="adminFilterJobs" @change="refreshMonsters(1)" class="bg-white border p-2 rounded-lg text-xs font-black outline-none">
        <option value="*">全部</option>
        <option v-for="j in (JOB_BASE_NAMES || [])" :key="j" :value="j">{{ j }}</option>
      </select>

      <div class="relative flex-1 min-w-60">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input v-model="adminSearchTerm" @input="refreshMonsters(1)" class="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-xs font-bold outline-none focus:border-blue-500 transition-all" placeholder="搜尋名稱..." />
      </div>
    </div>

    <!-- Pagination Top -->
    <div class="flex items-center justify-between p-4 bg-slate-50 border rounded-t-2xl">
      <div class="flex items-center gap-3">
        <span class="text-[12px] font-bold text-slate-600">
          共 <span class="font-black text-slate-800">{{ adminTotalCount }}</span> 筆 | 第 <span class="font-black text-slate-800">{{ adminCurrentPage }}</span> 頁
        </span>
        <select v-model.number="adminPageSize" @change="refreshMonsters(1)" class="bg-white border p-1.5 rounded text-[11px] font-black outline-none">
          <option :value="20">20筆</option>
          <option :value="50">50筆</option>
          <option :value="100">100筆</option>
          <option :value="300">300筆</option>
          <option :value="500">500筆</option>
          <option :value="1000">1000筆</option>
        </select>
        <select v-model="adminSortField" @change="onAdminSortFieldChange" class="bg-white border p-1.5 rounded text-[11px] font-black outline-none">
          <option value="name">名字</option>
          <option value="job">討伐筆記</option>
          <option value="map">地圖</option>
          <option value="createdAt">新增時間</option>
          <option value="updatedAt">修改時間</option>
        </select>

        <select v-if="adminSortField === 'job'" v-model="adminSortJobs" @change="refreshMonsters(1)" class="bg-white border p-1.5 rounded text-[11px] font-black outline-none">
          <option value="*">全部職業</option>
          <option v-for="j in (JOB_BASE_NAMES || [])" :key="j" :value="j">{{ j }}</option>
        </select>
        <button @click="adminSortDir = adminSortDir === 'asc' ? 'desc' : 'asc'; refreshMonsters(adminCurrentPage)" class="px-3 py-1.5 bg-white border text-[11px] font-black rounded hover:bg-slate-50">
          {{ adminSortDir === 'asc' ? '↑' : '↓' }}
        </button>
      </div>
      <div class="flex gap-2">
        <button @click="refreshMonsters(adminCurrentPage - 1)" :disabled="adminCurrentPage === 1" class="px-3 py-1.5 bg-white border rounded-lg text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50">
          ← 上一頁
        </button>
        <button @click="refreshMonsters(adminCurrentPage + 1)" :disabled="adminCurrentPage * adminPageSize >= adminTotalCount" class="px-3 py-1.5 bg-white border rounded-lg text-xs font-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50">
          下一頁 →
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-y-auto border border-t-0 rounded-b-2xl bg-white shadow-inner flex flex-col">
      <table class="w-full text-left flex-shrink-0">
        <thead class="bg-slate-50 sticky top-0 z-10 border-b">
          <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th class="p-4 w-12 text-center"></th>
            <th class="p-4">名稱 / 標籤</th>
            <th class="p-4">區域</th>
            <th class="p-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="m in (adminMonstersList || [])" :key="m.id" class="hover:bg-slate-50 transition-colors">
            <td class="p-4 text-center" style="width: 48px"></td>
            <td class="p-4 flex items-center gap-3">
              <span class="font-bold text-sm text-slate-800 mr-1">{{ m.name }}</span>
              <div class="flex items-center gap-1.5">
                <VersionTag :version="m.version" />
                <RankTag :rank="m.rank" />
                <FateTag :is-fate="m.isFate" />
                <JobTag :jobs="m.jobs || []" />
              </div>
            </td>
            <td class="p-4">
              <div class="flex gap-1 flex-wrap">
                <span v-for="(l, idx) in m.locations" :key="idx" class="text-[9px] font-bold bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-md">{{ l.map }}</span>
              </div>
            </td>
            <td class="p-4 text-right flex gap-1 justify-end">
              <button @click="editMonster(m)" class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="編輯">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button @click="deleteMonster(m)" class="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="刪除">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 編輯模態框 -->
    <AdminEditModal 
      v-if="editingMonster" 
      :monster="editingMonster" 
      @close="editingMonster = null"
      @save="handleSaveMonster"
    />

    <!-- 批量新增怪物模態框 -->
    <AdminBatchAddModal 
      v-if="showBulkMonsterModal" 
      :monster-mode="true"
      @close="showBulkMonsterModal = false"
      @save="refreshMonsters(1)"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
// ...所有變數宣告之後...



// --- 變數宣告區塊結束後，這裡插入 watch 監聽 ---
import { useRouter } from 'vue-router';
import { useMonstersStore } from '../stores/monsters.store';
import { useUserStore } from '../stores/user.store';
import VersionTag from '../components/VersionTag.vue';
import RankTag from '../components/RankTag.vue';
import FateTag from '../components/FateTag.vue';
import JobTag from '../components/JobTag.vue';
import AdminBatchAddModal from '../components/AdminBatchAddModal.vue';
import AdminEditModal from '../components/AdminEditModal.vue';
import { VERSIONS, RANKS, JOB_BASE_NAMES, MAP_DATA } from '../config/constants';
import { applyFilter, sortMonsters, getMapsForVersion } from '../services/hunterUtils';
import { getDb } from '../services/firebase';
import { deleteDoc, doc } from 'firebase/firestore';

const $router = useRouter();
const monstersStore = useMonstersStore();
const userStore = useUserStore();

// Admin filters
const adminFilterVer = ref('');
const adminFilterMap = ref('');
const adminFilterRank = ref('');
const adminFilterFate = ref(false);
const adminFilterJobs = ref(''); // 篩選用
const showAdminJobsFilter = ref(false);
const adminSortJobs = ref('*'); // 排序用
const adminSearchTerm = ref('');


// Admin pagination
const adminCurrentPage = ref(1);
const adminPageSize = ref(300);
const adminSortField = ref('name');
const adminSortDir = ref('asc');
const adminTotalCount = ref(0);
const adminMonstersList = ref([]);

// 當排序欄位切換時，若不是 job，清空職業篩選
const onAdminSortFieldChange = () => {
  if (adminSortField.value !== 'job') {
    adminSortJobs.value = '*';
  } else if (!adminSortJobs.value) {
    adminSortJobs.value = '*';
  }
  refreshMonsters(1);
};

const showBulkMonsterModal = ref(false);
const editingMonster = ref(null);

// 監聽 adminFilterJobs 變動，當排序欄位為 job 且 adminSortJobs 未選擇時自動預設
watch(
  () => adminFilterJobs.value,
  (val) => {
    if (
      adminSortField.value === 'job' &&
      (!adminSortJobs.value || adminSortJobs.value === '*') &&
      val && val !== '*'
    ) {
      adminSortJobs.value = val;
    }
  }
);

// Pagination and filtering logic
const refreshMonsters = (page = 1) => {
  adminCurrentPage.value = page;
  
  // Apply filters
  let filtered = applyFilter(
    monstersStore.monsters,
    adminSearchTerm.value,
    adminFilterVer.value,
    adminFilterMap.value,
    adminFilterRank.value,
    adminFilterFate.value ? 'yes' : '',
    adminFilterJobs.value // 只用於篩選
  );

  adminTotalCount.value = filtered.length;

  // Sort
  const sorted = sortMonsters(filtered, adminSortField.value, adminSortDir.value, adminSortJobs.value); // 排序用 adminSortJobs

  // Paginate
  const start = (page - 1) * adminPageSize.value;
  const end = start + adminPageSize.value;
  adminMonstersList.value = sorted.slice(start, end);
};

const toggleJobsFilter = () => {
  if (showAdminJobsFilter.value) {
    // 關閉時清除篩選
    showAdminJobsFilter.value = false;
    adminFilterJobs.value = '';
  } else {
    // 開啟時預設 *
    showAdminJobsFilter.value = true;
    if (!adminFilterJobs.value) {
      adminFilterJobs.value = '*';
    }
    // 若排序欄位不是 job，則自動切換排序欄位為 job
    if (adminSortField.value !== 'job') {
      adminSortField.value = 'job';
    }
    // 預設 adminSortJobs
    if (adminFilterJobs.value && adminFilterJobs.value !== '*') {
      adminSortJobs.value = adminFilterJobs.value;
    } else {
      adminSortJobs.value = '*';
    }
  }
  refreshMonsters(1);
};

const newMonster = () => {
  const v = adminFilterVer.value || '2.0';
  editingMonster.value = {
    version: v,
    locations: [],
    jobs: []
  };
};

const editMonster = (monster) => {
  editingMonster.value = { ...monster };
};

const deleteMonster = async (monster) => {
  if (!confirm(`確定要刪除 [${monster.name}]？`)) return;
  
  try {
    const db = getDb();
    await deleteDoc(
      doc(db, 'artifacts', userStore.appId, 'public', 'data', 'monsters', monster.id)
    );
    
    // Refresh list
    await refreshMonsters(1);
  } catch (error) {
    console.error('Delete failed:', error);
    alert('刪除失敗');
  }
};

const handleSaveMonster = async (monster) => {
  try {
    if (!monster.name || !monster.version) {
      alert('怪物名稱與版本為必填');
      return;
    }

    if (monster.id) {
      const updates = {
        name: monster.name,
        version: monster.version,
        rank: monster.rank || 'None',
        isFate: !!monster.isFate,
        jobs: monster.jobs && monster.jobs.length > 0 ? monster.jobs : null,
        locations: monster.locations && monster.locations.length > 0 ? monster.locations : []
      };
      await monstersStore.updateMonster(monster.id, updates);
    } else {
      const existingByName = monstersStore.monsters.find(m => m.name === monster.name);

      if (existingByName) {
        // 如果同名 monster 已存在，就更新其標籤和座標
        const existingJobs = Array.isArray(existingByName.jobs) ? [...existingByName.jobs] : [];
        const newJobs = Array.isArray(monster.jobs) ? monster.jobs : [];
        newJobs.forEach(job => {
          if (job && !existingJobs.includes(job)) {
            existingJobs.push(job);
          }
        });

        const existingLocations = Array.isArray(existingByName.locations) ? [...existingByName.locations] : [];
        const newLocations = Array.isArray(monster.locations) ? monster.locations : [];
        newLocations.forEach(loc => {
          if (!existingLocations.some(l => l.map === loc.map && Number(l.x) === Number(loc.x) && Number(l.y) === Number(loc.y))) {
            existingLocations.push(loc);
          }
        });

        await monstersStore.updateMonster(existingByName.id, {
          rank: monster.rank || existingByName.rank || 'None',
          isFate: monster.isFate || existingByName.isFate || false,
          jobs: existingJobs.length > 0 ? existingJobs : null,
          locations: existingLocations.length > 0 ? existingLocations : []
        });
      } else {
        const payload = {
          name: monster.name,
          version: monster.version,
          rank: monster.rank || 'None',
          isFate: !!monster.isFate,
          jobs: monster.jobs && monster.jobs.length > 0 ? monster.jobs : null,
          locations: monster.locations && monster.locations.length > 0 ? monster.locations : []
        };
        await monstersStore.addMonster(payload);
      }
    }

    await monstersStore.initializeMonsters();
    await refreshMonsters(adminCurrentPage.value);
    editingMonster.value = null;
  } catch (error) {
    console.error('Save monster failed:', error);
    alert('儲存怪物失敗');
  }
};

// Load initial data
onMounted(async () => {
  await monstersStore.initializeMonsters();
  monstersStore.watchMonsters();
  refreshMonsters(1);
});

</script>

<style scoped>
.animate-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
