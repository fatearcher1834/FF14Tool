/**
 * 用戶收藏和分組 Store
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import * as db from "../services/database";
import { APP_ID } from "../config/firebase.config";
import { localStorageHelper } from "../services/utils";

export const useUserPinsStore = defineStore("userPins", () => {
  // 狀態
  const pins = ref({}); // { monsterId: groupId }
  const groups = ref([]); // 分組列表
  const isLoading = ref(false);
  const error = ref(null);

  // 計算屬性
  const pinnedCount = computed(() => Object.keys(pins.value).length);
  const defaultGroup = computed(() =>
    groups.value.find(g => g.id === "default") || null
  );

  const PINS_STORAGE_KEY = (userId) => `ff14-userpins-${userId}`;
  const hasRemotePins = ref(false);

  // 初始化用戶數據
  const initialize = async (userId) => {
    isLoading.value = true;
    try {
      // 加載分組
      const groupsList = await db.getUserGroups(userId, APP_ID);
      if (groupsList.length === 0) {
        // 建立默認分組
        await db.createDefaultGroup(userId, APP_ID);
        groups.value = await db.getUserGroups(userId, APP_ID);
      } else {
        groups.value = groupsList;
      }

      // 加載收藏
      const fetchedPins = await db.getUserPins(userId, APP_ID);
      const hasFetched = fetchedPins && Object.keys(fetchedPins).length > 0;

      if (hasFetched) {
        pins.value = fetchedPins;
        hasRemotePins.value = true;
      } else {
        // 如果目前已知沒有雲端資料，先不覆蓋現存（避免登出/重登時覆蓋本地快取）
        const localPins = localStorageHelper.get(PINS_STORAGE_KEY(userId));
        pins.value = localPins || pins.value || {};

        if (!hasRemotePins.value) {
          // 只有首次如果尚未確認雲端資料才應用本地快取
          hasRemotePins.value = false;
        }
      }

      // 同步到本地存儲，避免丟失
      localStorageHelper.set(PINS_STORAGE_KEY(userId), pins.value);

      error.value = null;
      console.log(`✓ 加載用戶數據: ${pinnedCount.value} 筆收藏, ${groups.value.length} 個分組`);
    } catch (err) {
      console.error("✗ 加載用戶數據失敗:", err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  const savePinsLocal = (userId) => {
    try {
      localStorageHelper.set(PINS_STORAGE_KEY(userId), pins.value);
    } catch (err) {
      console.warn("⚠ 保存收藏到本地失敗:", err);
    }
  };

  // 監聽收藏變化
  let pinsUnsubscribe = null;
  const watchPins = async (userId) => {
    try {
      pinsUnsubscribe = db.watchUserPins(userId, APP_ID, (data) => {
        // 如果雲端有資料就覆蓋，否則保留本地資料
        if (data && Object.keys(data).length > 0) {
          pins.value = data;
          hasRemotePins.value = true;
        } else if (!hasRemotePins.value) {
          // 如果遠端還沒確定任何資料（首次），盡量用本地快取
          const localPins = localStorageHelper.get(PINS_STORAGE_KEY(userId));
          if (localPins) {
            pins.value = localPins;
          }
        }
        savePinsLocal(userId);
      });
    } catch (err) {
      console.error("✗ 監聽收藏失敗:", err);
      error.value = err.message;
    }
  };

  // 監聽分組變化
  let groupsUnsubscribe = null;
  const watchGroups = async (userId) => {
    try {
      groupsUnsubscribe = db.watchUserGroups(userId, APP_ID, (data) => {
        groups.value = data;
      });
    } catch (err) {
      console.error("✗ 監聽分組失敗:", err);
      error.value = err.message;
    }
  };

  // 停止監聽
  const stopWatching = () => {
    if (pinsUnsubscribe) pinsUnsubscribe();
    if (groupsUnsubscribe) groupsUnsubscribe();
  };

  // 添加收藏
  const addPin = async (monsterId, userId, groupId = null) => {
    if (!userId || !userId.trim()) {
      throw new Error("無效用戶 ID，無法執行收藏操作");
    }
    try {
      const targetGroupId = groupId || defaultGroup.value?.id || "default";
      await db.addPin(monsterId, targetGroupId, userId, APP_ID);
      pins.value[monsterId] = targetGroupId;
      savePinsLocal(userId);
      console.log(`✓ 已收藏怪物: ${monsterId}`);
    } catch (err) {
      console.error("✗ 添加收藏失敗:", err);
      error.value = err.message;
      throw err;
    }
  };

  // 移除收藏
  const removePin = async (monsterId, userId) => {
    if (!userId || !userId.trim()) {
      throw new Error("無效用戶 ID，無法執行取消收藏操作");
    }
    try {
      await db.removePin(monsterId, userId, APP_ID);
      delete pins.value[monsterId];
      savePinsLocal(userId);
      console.log(`✓ 已取消收藏: ${monsterId}`);
    } catch (err) {
      console.error("✗ 移除收藏失敗:", err);
      error.value = err.message;
      throw err;
    }
  };

  // 切換收藏狀態
  const togglePin = async (monsterId, userId) => {
    if (pins.value[monsterId]) {
      await removePin(monsterId, userId);
    } else {
      await addPin(monsterId, userId);
    }
  };

  // 獲取分組中的收藏
  const getPinnedInGroup = (groupId) => {
    return Object.entries(pins.value)
      .filter(([_, gid]) => gid === groupId)
      .map(([mid, _]) => mid);
  };

  // 新增分組
  const addGroup = async (groupName, userId) => {
    try {
      const groupId = await db.addGroup(groupName, userId, APP_ID);
      console.log(`✓ 成功新增分組: ${groupName}`);
      return groupId;
    } catch (err) {
      console.error("✗ 新增分組失敗:", err);
      error.value = err.message;
      throw err;
    }
  };

  // 更新分組
  const updateGroup = async (groupId, updates, userId) => {
    try {
      await db.updateGroup(groupId, updates, userId, APP_ID);
      
      // 本地更新
      const index = groups.value.findIndex(g => g.id === groupId);
      if (index !== -1) {
        groups.value[index] = {
          ...groups.value[index],
          ...updates
        };
      }
      
      console.log(`✓ 成功更新分組: ${groupId}`);
    } catch (err) {
      console.error("✗ 更新分組失敗:", err);
      error.value = err.message;
      throw err;
    }
  };

  // 刪除分組
  const deleteGroup = async (groupId, userId) => {
    try {
      await db.deleteGroup(groupId, userId, APP_ID);
      
      // 本地刪除
      groups.value = groups.value.filter(g => g.id !== groupId);
      
      console.log(`✓ 成功刪除分組: ${groupId}`);
    } catch (err) {
      console.error("✗ 刪除分組失敗:", err);
      error.value = err.message;
      throw err;
    }
  };

  // 移動收藏到不同分組
  const movePin = async (monsterId, newGroupId, userId) => {
    if (!userId || !userId.trim()) {
      throw new Error("無效用戶 ID，無法執行移動收藏操作");
    }
    try {
      await db.addPin(monsterId, newGroupId, userId, APP_ID);
      pins.value[monsterId] = newGroupId;
      savePinsLocal(userId);
      console.log(`✓ 已移動收藏到分組: ${newGroupId}`);
    } catch (err) {
      console.error("✗ 移動收藏失敗:", err);
      error.value = err.message;
      throw err;
    }
  };

  return {
    pins,
    groups,
    isLoading,
    error,
    pinnedCount,
    defaultGroup,
    initialize,
    watchPins,
    watchGroups,
    stopWatching,
    addPin,
    removePin,
    togglePin,
    getPinnedInGroup,
    addGroup,
    updateGroup,
    deleteGroup,
    movePin
  };
});
