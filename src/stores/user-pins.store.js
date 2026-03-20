/**
 * 用戶收藏和分組 Store
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import * as db from "../services/database";
import { APP_ID } from "../config/firebase.config";

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
      const userPins = await db.getUserPins(userId, APP_ID);
      pins.value = userPins;

      error.value = null;
      console.log(`✓ 加載用戶數據: ${pinnedCount.value} 筆收藏, ${groups.value.length} 個分組`);
    } catch (err) {
      console.error("✗ 加載用戶數據失敗:", err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  // 監聽收藏變化
  let pinsUnsubscribe = null;
  const watchPins = async (userId) => {
    try {
      pinsUnsubscribe = db.watchUserPins(userId, APP_ID, (data) => {
        pins.value = data;
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
    try {
      const targetGroupId = groupId || defaultGroup.value?.id || "default";
      await db.addPin(monsterId, targetGroupId, userId, APP_ID);
      pins.value[monsterId] = targetGroupId;
      console.log(`✓ 已收藏怪物: ${monsterId}`);
    } catch (err) {
      console.error("✗ 添加收藏失敗:", err);
      error.value = err.message;
      throw err;
    }
  };

  // 移除收藏
  const removePin = async (monsterId, userId) => {
    try {
      await db.removePin(monsterId, userId, APP_ID);
      delete pins.value[monsterId];
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
    try {
      await db.addPin(monsterId, newGroupId, userId, APP_ID);
      pins.value[monsterId] = newGroupId;
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
