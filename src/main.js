/**
 * Vue 應用入口
 */

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

// 初始化 Firebase
import { initializeFirebase } from "./services/firebase";
initializeFirebase();

// 導入全局樣式
import "./styles/global.css";
import "./styles/transitions.css";

const app = createApp(App);

// 使用 Pinia 狀態管理
app.use(createPinia());

// 使用路由
app.use(router);

// 掛載應用
app.mount("#app");

console.log("✓ Vue 應用已啟動");
