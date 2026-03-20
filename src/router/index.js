/**
 * Vue Router 配置
 */

import { createRouter, createWebHistory } from "vue-router";
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
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// 導航守衛 - 身份驗證檢查
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next("/login");
    return;
  }

  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next("/search");
    return;
  }

  if (to.path === "/login" && userStore.isLoggedIn) {
    next("/search");
    return;
  }

  next();
});

export default router;
