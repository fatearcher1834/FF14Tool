# FF14 Hunt Cloud - Vue.js 版本

> FINAL FANTASY XIV 繁體中文狩獵工具 - 完整的 Vue 3 + Firestore 應用

## 🎯 概述

這是從原始 React 應用轉換而來的完整 Vue.js 應用，提供：

- ✅ **實時怪物數據庫** - 使用 Firebase Firestore
- ✅ **用戶收藏系統** - 個人化的分組和追蹤
- ✅ **管理員面板** - 批量新增和編輯怪物
- ✅ **收藏看板** - Kanban 風格的追蹤面板
- ✅ **智能搜索** - 模糊匹配和多條件篩選
- ✅ **地圖解析** - 自動識別地圖名稱和座標

## 📋 系統要求

- Node.js 16+ 
- npm 或 yarn
- 現代瀏覽器（支持 ES6+）
- Firebase 帳戶

## 🚀 快速開始

### 1. 克隆和安裝

```bash
# 克隆項目
git clone <repository-url>
cd ff14-hunt-finder

# 安裝依賴
npm install
```

### 2. 環境配置

```bash
# 複製環境變數範本
cp .env.example .env

# 編輯 .env 並填入 Firebase 配置
# 你可以從 Firebase Console 獲得這些信息
```

### 3. 開發模式

```bash
# 啟動開發伺服器
npm run dev

# 應用將在 http://localhost:5173 打開
```

### 4. 構建生產版本

```bash
# 構建優化的生產版本
npm run build

# 預覽構建結果
npm run preview
```

## 🏗️ 項目結構

```
src/
├── config/              # 配置和常數
│   ├── constants.js     # 遊戲數據常數
│   ├── firebase.config.js
│   └── app.config.js
├── services/            # 業務邏輯層
│   ├── firebase.js      # Firebase 初始化
│   ├── database.js      # 數據庫操作
│   └── utils.js         # 工具函數
├── stores/              # Pinia 狀態管理
│   ├── user.store.js
│   ├── monsters.store.js
│   ├── user-pins.store.js
│   └── app.store.js
├── router/              # Vue Router 配置
│   └── index.js
├── pages/               # 頁面組件（待實現）
├── components/          # UI 組件（待實現）
├── styles/              # 全局樣式
└── App.vue              # 主應用組件
```

## 🗄️ 數據庫設置

### Firestore 數據結構

本應用使用以下 Firestore 集合結構：

```
artifacts/{appId}/
├── public/
│   ├── data/
│   │   └── monsters/         # 怪物集合
│   └── metadata/
│       └── gamedata          # 遊戲元數據
└── users/{userId}/
    ├── pins/                 # 用戶收藏
    ├── groups/               # 用戶分組
    └── settings/             # 用戶設置
```

### 初始化數據

建議在 Firebase Console 中手動創建初始怪物數據，或使用提供的種子腳本：

```javascript
// 遊戲元數據示例
{
  "versions": ["2.0", "3.0", "4.0", "5.0", "6.0", "7.0"],
  "ranks": ["None", "B", "A", "S", "SS"],
  "jobs": ["劍術師", "格鬥家", ...],
  "maps": {...}
}

// 怪物數據示例
{
  "id": "m_1234567890_abc12",
  "name": "史萊姆",
  "version": "2.0",
  "rank": "B",
  "isFate": false,
  "jobs": ["劍術師01"],
  "locations": [
    {"map": "中拉諾西亞", "x": "100", "y": "200"}
  ],
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

## 🔑 核心功能

### 認證系統
- 匿名 Firebase 認證
- 虛擬帳戶 ID 系統
- 本地存儲持久化

### 怪物管理
- 實時怪物數據同步
- 按版本、地圖、等級篩選
- 智能搜索和尋找相似度匹配
- 職業標籤支持

### 用戶收藏
- 個人化分組系統
- 拖放支持
- 實時同步

### 管理員功能
- 批量新增怪物
- 編輯和刪除操作
- 大量數據管理

## 🛠️ 開發指南

### 添加新組件

1. 在 `src/components/features/` 中創建新 `.vue` 文件
2. 使用 Composition API
3. 通過 stores 訪問數據

例子：
```vue
<template>
  <div class="monster-card">
    {{ monster.name }}
  </div>
</template>

<script setup>
import { useMonstersStore } from '@/stores'

const monstersStore = useMonstersStore()
</script>
```

### 訪問數據

所有數據通過 Pinia stores 訪問：

```javascript
import { 
  useUserStore,
  useMonstersStore,
  useUserPinsStore,
  useAppStore
} from '@/stores'

// 在組件中使用
const userStore = useUserStore()
const monstersStore = useMonstersStore()
```

### 數據庫操作

所有 Firestore 操作通過 `services/database.js`：

```javascript
import * as db from '@/services/database'

// 獲取怪物
const monsters = await db.getAllMonsters()

// 新增怪物
await db.addMonster(monsterData)

// 更新怪物
await db.updateMonster(monsterId, updates)
```

## 🔐 Firestore 安全規則

建議的 Firestore 安全規則（在 Firebase Console 設置）：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 公開數據只讀
    match /artifacts/{appId}/public/{document=**} {
      allow read;
      allow write: if isAdmin();
    }
    
    // 用戶數據只有本人可訪問
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
  
  function isAdmin() {
    return request.auth.token.email in 
      get(/databases/$(database)/documents/admins).data.emails;
  }
}
```

## 📦 依賴

- **Vue 3** - 前端框架
- **Pinia** - 狀態管理
- **Vue Router** - 路由
- **Firebase** - 後端和認證
- **Tailwind CSS** - 樣式框架
- **Lucide Vue** - 圖標
- **Vue CLI** - 構建工具（本專案實作）

## 🎨 樣式系統

項目使用 Tailwind CSS 進行樣式設計。定制的配置在 `tailwind.config.js` 中。

### 自定義顏色
- 版本顏色：`version-2.0`, `version-3.0`, 等
- 等級顏色：自動映射
- 職業顏色：自動映射

## 📱 響應式設計

應用完全響應式，支持：
- 桌面 (1920px+)
- 平板 (768px - 1919px)
- 手機 (< 768px)

## 🧪 測試

```bash
# 運行測試
npm run test

# 帶 UI 的測試
npm run test:ui
```

## 📝 可用腳本

| 命令 | 說明 |
|------|------|
| `npm run serve` | 啟動開發伺服器（Vue CLI）|
| `npm run build` | 構建生產版本 |
| `npm run preview` | 預覽生產構建 |
| `npm run lint` | 運行 ESLint |
| `npm run test` | 運行測試 |

## 🚢 部署

### Vercel（推薦）
```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Firebase Hosting
```bash
# 安裝 Firebase CLI
npm i -g firebase-tools

# 初始化
firebase init hosting

# 構建和部署
npm run build
firebase deploy
```

### 其他平台
1. 運行 `npm run build`
2. 將 `dist/` 文件夾上傳到主機
3. 配置服務器重定向 404 到 `index.html`（用於 SPA 路由）

## 🐛 故障排除

### 連接數據庫失敗
- 檢查 `.env` 中的 Firebase 配置
- 確保 Firestore 已在 Firebase Console 中啟用
- 檢查 Firestore 安全規則

### 數據未同步
- 確保在線連接
- 檢查瀏覽器控制台的錯誤信息
- 驗證用戶 ID 正確

### 構建失敗
- 清除 `node_modules` 和 `package-lock.json`
- 重新安裝依賴：`npm install`
- 清除構建緩存：`rm -rf dist/`

## 📚 附加資源

- [Vue 3 文檔](https://vuejs.org/)
- [Pinia 文檔](https://pinia.vuejs.org/)
- [Firebase 文檔](https://firebase.google.com/docs)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)

## 🤝 貢獻

該項目是私人項目。如有改進建議，請聯繫開發者。

## 📄 許可證

版權所有 (c) 2024。Copilot 生成。

## 📧 支持

如有問題或反饋，請提交 Issue 或聯繫開發人員。

---

**祝你使用愉快！✨**
