/**
 * 用戶狀態 Store
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  onAuthStateChange,
  logout as firebaseLogout
} from "../services/firebase";
import * as db from "../services/database";
import { localStorageHelper } from "../services/utils";
import { APP_CONFIG } from "../config/app.config";
import { APP_ID } from "../config/firebase.config";

export const useUserStore = defineStore("user", () => {
  // 狀態
  const user = ref(null); // Firebase 用戶
  const virtualId = ref(""); // 虛擬帳戶ID
  const appId = ref(APP_ID); // 應用ID
  const isLoggedIn = ref(false);
  const isAdmin = ref(false); // 從數據庫中讀取
  const isLoading = ref(false);
  const error = ref(null);

  // 初始化認證
  const initializeAuth = async () => {
    isLoading.value = true;
    try {
      // 檢查本地保存的帳戶
      const savedAccount = localStorageHelper.get(APP_CONFIG.storage.userAccount);
      console.log(`📌 檢查本地帳戶: ${savedAccount || "無"}`);
      
      if (savedAccount) {
        virtualId.value = savedAccount;
        isLoggedIn.value = true;

        // 讀取帳號註冊資料，檢查管理員狀態
        try {
          console.log(`🔍 讀取註冊資料 [${savedAccount}] ...`);
          const registryDoc = await db.getUserRegistry(savedAccount);
          console.log(`📋 註冊資料:`, registryDoc);

          if (registryDoc && registryDoc.isAdmin) {
            isAdmin.value = true;
            console.log(`✅ 帳號 [${savedAccount}] 是管理員`);
          } else {
            isAdmin.value = false;
            console.log(`ℹ️ 帳號 [${savedAccount}] 不是管理員或無 isAdmin 屬性`);
          }
        } catch (err) {
          console.warn("⚠ 初始化時讀取註冊資料失敗:", err);
          isAdmin.value = false;
        }
      } else {
        // 沒有保存用戶，確保為未登入狀態
        virtualId.value = "";
        isLoggedIn.value = false;
        isAdmin.value = false;
        console.log("ℹ️ 本地無已登入帳號，已設定為未登入狀態");
      }

      // 監聽 Firebase 身份驗證狀態
      onAuthStateChange((firebaseUser) => {
        user.value = firebaseUser;
      });

      error.value = null;
    } catch (err) {
      console.error("✗ 初始化認證失敗:", err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  // 登入
  const login = async (account, password) => {
    isLoading.value = true;
    try {
      console.log('user.store.login()', account)
      if (!account || !account.trim()) {
        throw new Error('請輸入帳號');
      }

      // 讀取註冊資料，僅用於管理員驗證
      const registryDoc = await db.getUserRegistry(account);
      console.log('user.store.login() registryDoc', registryDoc)
      const isAdminAccount = Boolean(registryDoc && registryDoc.isAdmin);

      if (isAdminAccount) {
        console.log('user.store.login() admin account detected')
        if (!password || !password.trim()) {
          throw new Error('管理員帳號需要輸入密碼');
        }
        if (registryDoc.password !== password) {
          throw new Error('密碼錯誤');
        }
      }

      virtualId.value = account;
      isLoggedIn.value = true;
      isAdmin.value = isAdminAccount;

      // 保存到本地存儲
      localStorageHelper.set(APP_CONFIG.storage.userAccount, account);

      // 確保用戶有默認分組
      try {
        const groups = await db.getUserGroups(account);
        if (groups.length === 0) {
          await db.createDefaultGroup(account);
        }
      } catch (err) {
        console.warn("⚠ 建立默認分組失敗:", err);
      }

      error.value = null;
      console.log(`✓ 成功登入: ${account}`);
    } catch (err) {
      console.error("✗ 登入失敗:", err);
      error.value = err.message;
      isLoggedIn.value = false;
      isAdmin.value = false;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 登出
  const logout = async () => {
    isLoading.value = true;
    try {
      await firebaseLogout();
      
      virtualId.value = "";
      user.value = null;
      isLoggedIn.value = false;

      localStorageHelper.remove(APP_CONFIG.storage.userAccount);
      
      error.value = null;
      console.log("✓ 成功登出");
    } catch (err) {
      console.error("✗ 登出失敗:", err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    user,
    virtualId,
    appId,
    isLoggedIn,
    isAdmin,
    isLoading,
    error,
    initializeAuth,
    login,
    logout
  };
});
