/**
 * 應用配置文件
 */

export const APP_CONFIG = {
  // 應用信息
  app: {
    name: "FINAL FANTASY XIV 繁體中文怪物座標查詢工具",
    shortName: "Hunt Cloud",
    version: "1.0.0"
  },

  // UI 配置
  ui: {
    theme: "light",
    defaultLanguage: "zh-TW"
  },

  // 搜索和篩選配置
  search: {
    defaultPageSize: 100,
    maxPageSize: 1000,
    minSearchTermLength: 1,
    debounceTime: 300
  },

  // 編輯和新增配置
  editor: {
    defaultSimilarityThreshold: 50,
    maxSimilarityThreshold: 100,
    minSimilarityThreshold: 0
  },

  // 本地存儲 key
  storage: {
    userAccount: "ff14_virtual_account",
    userPreferences: "ff14_user_preferences",
    uiState: "ff14_ui_state"
  },

  // API 超時
  timeout: {
    default: 30000,
    database: 10000,
    auth: 5000
  },

  // 特性標誌 (Feature Flags)
  features: {
    enableBulkAdd: true,
    enableBatchEdit: true,
    enableExport: false,
    enableImport: false,
    enableSync: false
  }
};

export default APP_CONFIG;
