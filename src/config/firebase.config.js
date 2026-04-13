/**
 * Firebase 配置文件
 * 抽離敏感信息，使用環境變數
 */

const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY || "AIzaSyDqiVItIUKXSqyBtqLqZTXJIAWPME7-hq8",
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN || "ff14-hunt-finder-bd466.firebaseapp.com",
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID || "ff14-hunt-finder-bd466",
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET || "ff14-hunt-finder-bd466.firebasestorage.app",
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID || "1070892149299",
  appId: process.env.VUE_APP_FIREBASE_APP_ID || "1:1070892149299:web:966fc39ab19a8e4d30d146"
};

export const APP_ID = process.env.VUE_APP_ID || "ff14-hunt-finder-bd466";

// 數據庫路徑常數
export const DB_PATHS = {
  // 公開數據
  public: {
    root: (appId) => `artifacts/${appId}/public`,
    data: (appId) => `artifacts/${appId}/public/data`,
    monsters: (appId) => `artifacts/${appId}/public/data/monsters`,
    metadata: (appId) => `artifacts/${appId}/public/metadata`
  },
  // 用戶數據
  users: {
    root: (appId, userId) => `artifacts/${appId}/users/${userId}`,
    pins: (appId, userId) => `artifacts/${appId}/users/${userId}/pins`,
    groups: (appId, userId) => `artifacts/${appId}/users/${userId}/groups`,
    settings: (appId, userId) => `artifacts/${appId}/users/${userId}/settings`
  },
  authMapping: {
    root: (appId) => `artifacts/${appId}/public/data/automapping`,
    doc: (appId, authUid) => `artifacts/${appId}/public/data/automapping/${authUid}`
  }
};

export default firebaseConfig;
