/**
 * Firebase 初始化和會話管理
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../config/firebase.config";

let app = null;
let auth = null;
let db = null;

/**
 * 初始化 Firebase
 */
export function initializeFirebase() {
  if (app) return { app, auth, db };

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log("✓ Firebase 初始化成功");
    return { app, auth, db };
  } catch (error) {
    console.error("✗ Firebase 初始化失敗:", error);
    throw error;
  }
}

/**
 * 獲取 Firebase 實例
 */
export function getFirebaseInstance() {
  if (!app || !auth || !db) {
    return initializeFirebase();
  }
  return { app, auth, db };
}

/**
 * 導出 db 實例（供其他模塊使用）
 */
export function getFirebaseDb() {
  const { db: firebaseDb } = getFirebaseInstance();
  return firebaseDb;
}

/**
 * 匿名登入
 */
export async function loginAnonymously() {
  const { auth } = getFirebaseInstance();
  try {
    const result = await signInAnonymously(auth);
    console.log("✓ 匿名登入成功:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("✗ 匿名登入失敗:", error);
    throw error;
  }
}

/**
 * 監聽身份驗證狀態
 */
export function onAuthStateChange(callback) {
  const { auth } = getFirebaseInstance();
  return onAuthStateChanged(auth, callback);
}

/**
 * 登出
 */
export async function logout() {
  const { auth } = getFirebaseInstance();
  try {
    await signOut(auth);
    console.log("✓ 登出成功");
  } catch (error) {
    console.error("✗ 登出失敗:", error);
    throw error;
  }
}

/**
 * 獲取 Firestore 實例
 */
export function getDb() {
  const { db } = getFirebaseInstance();
  return db;
}

/**
 * 獲取 Auth 實例
 */
export function getAuthInstance() {
  const { auth } = getFirebaseInstance();
  return auth;
}

export default {
  initializeFirebase,
  getFirebaseInstance,
  loginAnonymously,
  onAuthStateChange,
  logout,
  getDb,
  getAuthInstance
};
