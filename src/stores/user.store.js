/**
 * 用戶狀態 Store
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  loginAnonymously,
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
        
        // 檢查是否為管理員帳號
        const adminAccounts = ['admin', 'adm', 'administrator'];
        if (adminAccounts.includes(savedAccount.toLowerCase())) {
          isAdmin.value = true;
          console.log(`✅ 帳號 [${savedAccount}] 已設置為管理員`);
        } else {
          // 從數據庫讀取管理員狀態
          try {
            console.log(`🔍 讀取用戶 [${savedAccount}] 的數據...`);
            const userDoc = await db.getUserFromDatabase(savedAccount);
            console.log(`📋 用戶文檔:`, userDoc);
            
            if (userDoc && userDoc.isAdmin) {
              isAdmin.value = userDoc.isAdmin;
              console.log(`✅ 用戶 [${savedAccount}] 是管理員`);
            } else {
              isAdmin.value = false;
              console.log(`ℹ️ 用戶 [${savedAccount}] 不是管理員或無 isAdmin 屬性`);
            }
          } catch (err) {
            console.warn("⚠ 初始化時讀取管理員狀態失敗:", err);
            isAdmin.value = false;
          }
        }
      }

      // 監聽 Firebase 身份驗證狀態
      onAuthStateChange((firebaseUser) => {
        user.value = firebaseUser;
        if (!isLoggedIn.value && firebaseUser) {
          // 如果用戶未登入但 Firebase 已認證，進行匿名登入
          if (!virtualId.value) {
            virtualId.value = firebaseUser.uid;
          }
        }
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
  const login = async (account) => {
    isLoading.value = true;
    try {
      // 先進行 Firebase 匿名登入
      const fbUser = await loginAnonymously();

      // 保存虛擬帳戶
      virtualId.value = account;
      isLoggedIn.value = true;

      // 檢查是否為管理員帳號
      const adminAccounts = ['admin', 'adm', 'administrator'];
      if (adminAccounts.includes(account.toLowerCase())) {
        isAdmin.value = true;
        console.log(`✅ 帳號 [${account}] 已設置為管理員`);
      } else {
        // 從數據庫讀取用戶的管理員狀態
        try {
          const userDoc = await db.getUserFromDatabase(account);
          if (userDoc && userDoc.isAdmin) {
            isAdmin.value = userDoc.isAdmin;
          } else {
            isAdmin.value = false;
          }
        } catch (err) {
          console.warn("⚠ 讀取用戶管理員狀態失敗:", err);
          isAdmin.value = false;
        }
      }

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
