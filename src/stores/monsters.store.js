/**
 * 怪物數據 Store
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import * as db from "../services/database";
import { APP_ID } from "../config/firebase.config";

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
      monsters.value = data;
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
        monsters.value = data;
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
    deleteMonster
  };
});
