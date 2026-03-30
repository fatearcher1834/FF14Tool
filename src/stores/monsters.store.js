/**
 * 怪物數據 Store
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import * as db from "../services/database";
import { APP_ID } from "../config/firebase.config";

const getMonsterMapCache = (monsterId) => {
  if (!monsterId) return null;
  try {
    const raw = window.sessionStorage.getItem(`monster-map-${monsterId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('⚠ 讀取 sessionStorage 地圖緩存失敗', error);
    return null;
  }
};

const normalizeDateTime = (val) => {
  if (!val) return null
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  if (val.toDate && typeof val.toDate === 'function') {
    return val.toDate()
  }
  if (val instanceof Date) {
    return val
  }
  return null
}


const setMonsterMapCache = (monsterId, mapData) => {
  if (!monsterId || !mapData) return;
  try {
    window.sessionStorage.setItem(`monster-map-${monsterId}`, JSON.stringify(mapData));
  } catch (error) {
    console.warn('⚠ 寫入 sessionStorage 地圖緩存失敗', error);
  }
};

const removeMonsterMapCache = (monsterId) => {
  if (!monsterId) return;
  try {
    window.sessionStorage.removeItem(`monster-map-${monsterId}`);
  } catch (error) {
    console.warn('⚠ 清除 sessionStorage 地圖緩存失敗', error);
  }
};

export const useMonstersStore = defineStore("monsters", () => {
  // 狀態
  const monsters = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // 計算屬性
  const monsterCount = computed(() => monsters.value.length);
  const monstersByVersion = computed(() => {
    const grouped = {};
    monsters.value.forEach(m => {
      if (!grouped[m.version]) {
        grouped[m.version] = [];
      }
      grouped[m.version].push(m);
    });
    return grouped;
  });

  // 初始化怪物數據
  const initializeMonsters = async () => {
    isLoading.value = true;
    try {
      const data = await db.getAllMonsters(APP_ID);
      // 加入 session 儲存緩存的 mapImageData
      monsters.value = data.map(m => {
        const cache = getMonsterMapCache(m.id);
        return cache
          ? { ...m, ...cache }
          : m;
      });
      error.value = null;
      console.log(`✓ 加載 ${data.length} 隻怪物`);
    } catch (err) {
      console.error("✗ 加載怪物失敗:", err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  // 監聽怪物數據變化
  let unsubscribe = null;
  const watchMonsters = () => {
    try {
      unsubscribe = db.watchMonsters(APP_ID, (data) => {
        // 合併已存在的地圖數據，避免每次更新時清除 mapImageData
        const existingMapDataById = monsters.value.reduce((acc, monster) => {
          if (monster.mapImageData) {
            acc[monster.id] = {
              mapImageData: monster.mapImageData,
              mapImageUpdatedAt: monster.mapImageUpdatedAt,
              hasMap: monster.hasMap
            };
          }
          return acc;
        }, {});

        monsters.value = data.map(item => {
          const existing = existingMapDataById[item.id];
          if (existing) {
            return {
              ...item,
              mapImageData: existing.mapImageData,
              mapImageUpdatedAt: existing.mapImageUpdatedAt,
              hasMap: existing.hasMap !== undefined ? existing.hasMap : item.hasMap
            };
          }
          return item;
        });

        console.log(`✓ 怪物數據已同步: ${data.length} 隻`);
      });
      console.log("✓ 已啟動怪物監聽");
    } catch (err) {
      console.error("✗ 監聽怪物失敗:", err);
      error.value = err.message;
    }
  };

  // 停止監聽
  const stopWatching = () => {
    if (unsubscribe) {
      unsubscribe();
      console.log("✓ 已停止監聽怪物數據");
    }
  };

  // 根據 ID 查找怪物
  const getMonsterById = (id) => {
    return monsters.value.find(m => m.id === id);
  };

  // 根據名稱搜尋怪物
  const getMonstersByName = (name) => {
    const lower = name.toLowerCase();
    return monsters.value.filter(m =>
      m.name.toLowerCase().includes(lower)
    );
  };

  // 新增怪物
  const addMonster = async (monsterData) => {
    try {
      const id = await db.addMonster(monsterData, APP_ID);
      console.log(`✓ 成功新增怪物: ${monsterData.name}`);
      return id;
    } catch (err) {
      console.error("✗ 新增怪物失敗:", err);
      error.value = err.message;
      throw err;
    }
  };

  // 更新怪物
  const updateMonster = async (monsterId, updates) => {
    try {
      await db.updateMonster(monsterId, updates, APP_ID);
      
      // 本地更新
      const index = monsters.value.findIndex(m => m.id === monsterId);
      if (index !== -1) {
        monsters.value[index] = {
          ...monsters.value[index],
          ...updates
        };
      }

      // 同步 map cache
      if (updates.mapImageData !== undefined) {
        if (updates.mapImageData) {
          setMonsterMapCache(monsterId, {
            mapImageData: updates.mapImageData,
            mapImageUpdatedAt: updates.mapImageUpdatedAt || new Date(),
            hasMap: true
          });
        } else {
          // 清空 map 時移除 cache
          removeMonsterMapCache(monsterId);
        }
      }
      
      console.log(`✓ 成功更新怪物: ${monsterId}`);
    } catch (err) {
      console.error("✗ 更新怪物失敗:", err);
      error.value = err.message;
      throw err;
    }
  };

  // 刪除怪物
  const deleteMonster = async (monsterId) => {
    try {
      await db.deleteMonster(monsterId, APP_ID);
      
      // 本地刪除
      monsters.value = monsters.value.filter(m => m.id !== monsterId);
      
      console.log(`✓ 成功刪除怪物: ${monsterId}`);
    } catch (err) {
      console.error("✗ 刪除怪物失敗:", err);
      error.value = err.message;
      throw err;
    }
  };

  const loadMonsterImageData = async (monsterId) => {
    const target = monsters.value.find(m => m.id === monsterId);
    if (!target) return null;

    // 優先從 localStorage session cache 讀取，避免每次編輯都重 DB
    const cache = getMonsterMapCache(monsterId);
    if (cache && cache.mapImageData) {
      target.mapImageData = cache.mapImageData;
      target.mapImageUpdatedAt = normalizeDateTime(cache.mapImageUpdatedAt);
      target.hasMap = cache.hasMap !== undefined ? cache.hasMap : true;
      return target;
    }

    try {
      const imageData = await db.getMonsterImageDataById(monsterId, APP_ID);
      if (imageData) {
        target.mapImageData = imageData.mapImageData || null;
        target.mapImageUpdatedAt = imageData.mapImageUpdatedAt || null;
        target.hasMap = !!imageData.mapImageData || Boolean(imageData.mapImageUpdatedAt);

        if (target.mapImageData) {
          setMonsterMapCache(monsterId, {
            mapImageData: target.mapImageData,
            mapImageUpdatedAt: target.mapImageUpdatedAt,
            hasMap: target.hasMap
          });
        } else {
          removeMonsterMapCache(monsterId);
        }
      }
      return target;
    } catch (err) {
      console.error(`✗ 加載怪物 ${monsterId} 圖片資杻失敗:`, err);
      return null;
    }
  };

  return {
    monsters,
    isLoading,
    error,
    monsterCount,
    monstersByVersion,
    initializeMonsters,
    watchMonsters,
    stopWatching,
    getMonsterById,
    getMonstersByName,
    addMonster,
    updateMonster,
    deleteMonster,
    loadMonsterImageData
  };
});
