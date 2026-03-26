/**
 * Vue Router 配置
 */

import { createRouter, createWebHashHistory } from "vue-router";
import { useUserStore } from "../stores/user.store";

// 頁面組件懶加載
const LoginPage = () => import("../pages/LoginPage.vue");
const SearchPage = () => import("../pages/SearchPage.vue");
const AdminPage = () => import("../pages/AdminPage.vue");
const NotFoundPage = () => import("../pages/NotFoundPage.vue");

const routes = [
  {
    path: "/",
    redirect: "/search"
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  {
    path: "/search",
    name: "Search",
    component: SearchPage,
    meta: { requiresAuth: true }
  },
  {
    path: "/admin",
    name: "Admin",
    component: AdminPage,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFoundPage
  }
];

const router = createRouter({
  // Hash 模式能避免 GitHub Pages 直接跳轉 /search /admin 時 404
  history: createWebHashHistory(process.env.BASE_URL),
  routes
});

// 導航守衛 - 身份驗證檢查
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  // 允許當前使用者訪問 login，除非已經登入可導到 search
  if (to.path === "/login") {
    if (userStore.isLoggedIn) {
      next("/search");
      return;
    }
    next();
    return;
  }

  // 未登入時，必須登入才能訪問需要驗證的頁面
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next("/login");
    return;
  }

  // 非管理員不能訪問管理頁面
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next("/search");
    return;
  }

  next();
});

export default router;
