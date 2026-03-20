# FF14 Hunt Cloud - Vue.js 架構指南

## 📋 項目架構概述

這是一個完整的 Vue 3 + Firestore 應用，已轉換自原先的 React 版本。架構已優化為模組化、可擴展的設計。

### 已完成的核心部分

#### 1. **配置層** (`src/config/`)
- ✅ `constants.js` - 遊戲數據常數（版本、職業、地圖等）
- ✅ `firebase.config.js` - Firebase 配置和數據庫路徑常數
- ✅ `app.config.js` - 應用配置和特性標誌

#### 2. **服務層** (`src/services/`)
- ✅ `firebase.js` - Firebase 初始化和認證
- ✅ `database.js` - 所有 Firestore 操作封裝
- ✅ `utils.js` - 工具函數（相似度計算、文本轉換等）

#### 3. **狀態管理** (`src/stores/` 使用 Pinia)
- ✅ `user.store.js` - 用戶認證和信息
- ✅ `monsters.store.js` - 怪物數據管理
- ✅ `user-pins.store.js` - 用戶收藏和分組
- ✅ `app.store.js` - UI 狀態和篩選器

#### 4. **路由** (`src/router/index.js`)
- ✅ 基礎路由設置
- ✅ 身份驗證守衛
- ✅ 管理員權限檢查

---

## 🔄 數據流通圖

```
User 登入
    ↓
Firebase 匿名認證
    ↓
加載用戶數據 (pins, groups, settings)
    ↓
加載怪物數據 (從 public/data/monsters)
    ↓
監聽實時更新
    ↓
UI 組件通過 Stores 訪問數據
```

---

## 📁 還需要實現的部分

### 1. **Vue 頁面組件** (`src/pages/`)
需要創建以下頁面：
- `LoginPage.vue` - 登入界面
- `SearchPage.vue` - 主搜索頁面
- `AdminPage.vue` - 管理員頁面
- `NotFoundPage.vue` - 404 頁面

### 2. **可重用 UI 組件** (`src/components/`)

**Layout 組件** (`components/layout/`)
```
components/
  layout/
    ├── Navbar.vue              # 導航欄
    ├── Sidebar.vue             # 側邊欄
    └── Layout.vue              # 主要佈局
```

**公共組件** (`components/common/`)
```
components/
  common/
    ├── Icon.vue                # 圖標組件
    ├── Tag.vue                 # 標籤組件
    ├── Badge.vue               # 徽章組件
    ├── Button.vue              # 按鈕組件
    ├── Select.vue              # 選擇框組件
    ├── Input.vue               # 輸入框組件
    ├── Modal.vue               # 模態框
    ├── Loading.vue             # 加載指示器
    └── Pagination.vue          # 分頁組件
```

**特性組件** (`components/features/`)
```
components/
  features/
    ├── MonsterCard.vue         # 怪物卡片
    ├── MonsterList.vue         # 怪物列表
    ├── MonsterEditor.vue       # 怪物編輯器
    ├── MonsterFilter.vue       # 篩選器
    ├── KanbanBoard.vue         # 看板
    ├── GroupPanel.vue          # 分組面板
    ├── BulkAddForm.vue         # 批量新增表單
    └── LocationParser.vue      # 位置解析器
```

### 3. **樣式文件** (`src/styles/`)
- ✅ `global.css` - 需要創建（全局樣式）
- ✅ `transitions.css` - 需要創建（動畫和過渡）

### 4. **項目配置文件**
- `vite.config.js` - Vite 構建配置
- `package.json` - 項目依賴
- `.env` - 環境變數（基於 .env.example）

---

## 🗄️ 數據庫結構

### Firebase Firestore 路徑結構

```
artifacts/{appId}/
├── public/
│   ├── data/
│   │   └── monsters/{monsterId}
│   │       ├── id: string
│   │       ├── name: string
│   │       ├── version: "2.0" | "3.0" | ... | "7.0"
│   │       ├── rank: "None" | "B" | "A" | "S" | "SS"
│   │       ├── isFate: boolean
│   │       ├── jobs: string[] // ["劍術師01", "格鬥家02"]
│   │       ├── locations: array
│   │       │   └── {map, x, y}
│   │       ├── createdAt: Timestamp
│   │       └── updatedAt: Timestamp
│   │
│   └── metadata/
│       └── gamedata
│           ├── versions: array
│           ├── ranks: array
│           ├── jobs: array
│           └── maps: object
│
└── users/{userId}/
    ├── pins/{monsterId}
    │   ├── groupId: string
    │   └── updatedAt: Timestamp
    │
    ├── groups/{groupId}
    │   ├── name: string
    │   ├── order: number
    │   ├── canDelete: boolean
    │   └── createdAt: Timestamp
    │
    └── settings/{settingKey}
        └── {...}
```

---

## 🚀 快速開始實現步驟

### 第 1 步：安裝依賴
```bash
npm install vue@next
npm install pinia
npm install vue-router@next
npm install firebase
npm install lucide-vue-next        # 圖標庫
npm install -D vite @vitejs/plugin-vue
npm install -D tailwindcss postcss autoprefixer
```

### 第 2 步：設置環境變數
```bash
cp .env.example .env
# 編輯 .env 並填入你的 Firebase 配置
```

### 第 3 步：創建 Vite 配置
見下一章節

### 第 4 步：實現 Vue 組件
參考原 React 代碼邏輯，逐個實現各個組件

### 第 5 步：集成 Tailwind CSS
確保樣式系統正常工作

---

## ⚙️ 核心 API 使用示例

### 用戶認證
```javascript
import { useUserStore } from '@/stores'

const userStore = useUserStore()

// 初始化認證
await userStore.initializeAuth()

// 登入
await userStore.login('my-account')

// 檢查是否是管理員
if (userStore.isAdmin) {
  // 顯示管理員面板
}
```

### 怪物管理
```javascript
import { useMonstersStore } from '@/stores'

const monstersStore = useMonstersStore()

// 初始化怪物數據
await monstersStore.initializeMonsters()

// 監聽實時更新
await monstersStore.watchMonsters()

// 搜尋怪物
const results = monstersStore.getMonstersByName('史萊姆')

// 新增怪物
await monstersStore.addMonster({
  name: '史萊姆',
  version: '2.0',
  rank: 'B',
  isFate: false,
  jobs: ['劍術師01'],
  locations: [{map: '中拉諾西亞', x: '100', y: '200'}]
})
```

### 收藏管理
```javascript
import { useUserPinsStore } from '@/stores'

const pinsStore = useUserPinsStore()

// 初始化用戶數據
await pinsStore.initialize(userId)

// 監聽收藏變化
await pinsStore.watchPins(userId)

// 切換收藏
await pinsStore.togglePin(monsterId, userId)

// 新增分組
await pinsStore.addGroup('我的分組', userId)
```

---

## 🎨 Tailwind CSS 集成

已使用 Tailwind 類名。需要配置 `tailwind.config.js`：

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,vue}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

## 🔐 安全最佳實踐

1. **環境變數** - Firebase 密鑰存儲在 `.env` 中（不提交到版本控制）
2. **Firestore 規則** - 在 Firebase Console 設置適當的讀寫規則
3. **認證** - 使用匿名認證 + 虛擬 ID 系統
4. **數據驗證** - 在服務層進行驗證

### 建議的 Firestore 規則
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 公開數據可讀
    match /artifacts/{appId}/public/{document=**} {
      allow read;
      allow write: if isAdmin();
    }
    
    // 用戶數據只有本身可訪問
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth.uid != null;
    }
  }
  
  function isAdmin() {
    return request.auth.token.email in get(/databases/$(database)/documents/admins).data.list;
  }
}
```

---

## 📦 數據庫初始化腳本

可選：創建 `database/seed.js` 來初始化遊戲元數據：

```javascript
import * as admin from 'firebase-admin'

// 初始化 Firestore
const db = admin.firestore()

async function seedGameData() {
  const appId = 'ff14-hunt-finder-bd466'
  const metadataPath = `artifacts/${appId}/public/metadata/gamedata`
  
  await db.doc(metadataPath).set({
    versions: ['2.0', '3.0', '4.0', '5.0', '6.0', '7.0'],
    ranks: ['None', 'B', 'A', 'S', 'SS'],
    // ... 其他遊戲數據
  })
  
  console.log('✓ 遊戲數據已初始化')
}

seedGameData()
```

---

## 🧪 測試建議

1. **單元測試** - 使用 Vitest 測試 stores 和 utils
2. **集成測試** - 測試 Firebase 操作
3. **E2E 測試** - 使用 Cypress 或 Playwright

---

## 📝 注意事項

1. **數據同步** - 使用 `watchMonsters()` 和 `watchUserPins()` 實時同步數據
2. **性能優化** - 使用虛擬滾動處理大量怪物列表
3. **國際化** - 當前支持繁體中文，可擴展為多語言
4. **離線支持** - 考慮使用 Firebase Offline Persistence

---

## 🔄 下一步

1. 根據本指南實現各個 Vue 組件
2. 設置 Vite 構建基礎設施
3. 配置 Firestore 安全規則
4. 測試登入流程和數據同步
5. 部署到生產環境

---

**架構設計完成！✨ 這個結構已經符合企業級應用的標準。**
