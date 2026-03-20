/**
 * 應用 UI 狀態 Store
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { localStorageHelper } from "../services/utils";
import { APP_CONFIG } from "../config/app.config";

export const useAppStore = defineStore("app", () => {
  // UI 狀態
  const currentView = ref("search"); // search | admin | kanban
  const showKanban = ref(true);
  const showEditor = ref(false);
  const isLoading = ref(false);
  const copyFeedback = ref(null);

  // 展開/折疊狀態
  const expandedIds = ref({});
  const mainExpandedIds = ref({});
  const isMainGlobalExpanded = ref(false);
  const isKbGlobalExpanded = ref(false);

  // 搜索頁面篩選器
  const searchFilter = ref({
    term: "",
    version: "",
    map: "",
    rank: "",
    isFate: false,
    jobBase: "",
    sortField: "name",
    sortDir: "asc",
    pageSize: 100,
    currentPage: 1
  });

  // Kanban 篩選器
  const kanbanFilter = ref({
    term: "",
    version: "",
    map: "",
    jobBase: ""
  });

  // 管理員頁面篩選器
  const adminFilter = ref({
    term: "",
    version: "",
    map: "",
    rank: "",
    isFate: false,
    jobBase: "",
    sortField: "name",
    sortDir: "asc",
    pageSize: 100,
    currentPage: 1
  });

  // 批量新增狀態
  const bulkAddState = ref({
    show: false,
    input: "",
    parsedList: [],
    config: {
      version: "2.0",
      map: "",
      rank: "None",
      isFate: false,
      jobBase: "",
      jobSuffix: ""
    }
  });

  // 相似度閾值 (用於地圖名稱匹配)
  const similarityThreshold = ref(50);

  // 初始化應用狀態
  const initializeAppState = () => {
    try {
      const saved = localStorageHelper.get(APP_CONFIG.storage.uiState);
      if (saved) {
        if (saved.searchFilter) searchFilter.value = { ...searchFilter.value, ...saved.searchFilter };
        if (saved.kanbanFilter) kanbanFilter.value = { ...kanbanFilter.value, ...saved.kanbanFilter };
        if (saved.similarityThreshold) similarityThreshold.value = saved.similarityThreshold;
      }
      console.log("✓ 應用狀態已初始化");
    } catch (err) {
      console.warn("⚠ 初始化應用狀態失敗:", err);
    }
  };

  // 保存應用狀態
  const saveAppState = () => {
    try {
      const state = {
        searchFilter: searchFilter.value,
        kanbanFilter: kanbanFilter.value,
        similarityThreshold: similarityThreshold.value
      };
      localStorageHelper.set(APP_CONFIG.storage.uiState, state);
    } catch (err) {
      console.warn("⚠ 保存應用狀態失敗:", err);
    }
  };

  // 切換視圖
  const setView = (view) => {
    currentView.value = view;
    saveAppState();
  };

  // 搜索過濾器操作
  const updateSearchFilter = (updates) => {
    searchFilter.value = { ...searchFilter.value, ...updates };
    saveAppState();
  };

  const resetSearchFilter = () => {
    searchFilter.value = {
      term: "",
      version: "",
      map: "",
      rank: "",
      isFate: false,
      jobBase: "",
      sortField: "name",
      sortDir: "asc",
      pageSize: 100,
      currentPage: 1
    };
    saveAppState();
  };

  // Kanban 過濾器操作
  const updateKanbanFilter = (updates) => {
    kanbanFilter.value = { ...kanbanFilter.value, ...updates };
    saveAppState();
  };

  // 管理員過濾器操作
  const updateAdminFilter = (updates) => {
    adminFilter.value = { ...adminFilter.value, ...updates };
  };

  // 展開/折疊操作
  const toggleExpanded = (id) => {
    expandedIds.value[id] = !expandedIds.value[id];
  };

  const toggleMainExpanded = (id) => {
    mainExpandedIds.value[id] = !mainExpandedIds.value[id];
  };

  const toggleAllMainExpanded = () => {
    isMainGlobalExpanded.value = !isMainGlobalExpanded.value;
  };

  const toggleAllKbExpanded = () => {
    isKbGlobalExpanded.value = !isKbGlobalExpanded.value;
  };

  // 設置展開狀態
  const setExpandedState = (ids, state = true) => {
    mainExpandedIds.value = {};
    ids.forEach(id => {
      mainExpandedIds.value[id] = state;
    });
  };

  // 複製反饋
  const showCopyFeedback = (key) => {
    copyFeedback.value = key;
    setTimeout(() => {
      copyFeedback.value = null;
    }, 1000);
  };

  // 批量新增操作
  const updateBulkAddState = (updates) => {
    bulkAddState.value = { ...bulkAddState.value, ...updates };
    if (updates.config) {
      bulkAddState.value.config = { ...bulkAddState.value.config, ...updates.config };
    }
  };

  const resetBulkAddState = () => {
    bulkAddState.value = {
      show: false,
      input: "",
      parsedList: [],
      config: {
        version: "2.0",
        map: "",
        rank: "None",
        isFate: false,
        jobBase: "",
        jobSuffix: ""
      }
    };
  };

  return {
    currentView,
    showKanban,
    showEditor,
    isLoading,
    copyFeedback,
    expandedIds,
    mainExpandedIds,
    isMainGlobalExpanded,
    isKbGlobalExpanded,
    searchFilter,
    kanbanFilter,
    adminFilter,
    bulkAddState,
    similarityThreshold,
    initializeAppState,
    saveAppState,
    setView,
    updateSearchFilter,
    resetSearchFilter,
    updateKanbanFilter,
    updateAdminFilter,
    toggleExpanded,
    toggleMainExpanded,
    toggleAllMainExpanded,
    toggleAllKbExpanded,
    setExpandedState,
    showCopyFeedback,
    updateBulkAddState,
    resetBulkAddState
  };
});
