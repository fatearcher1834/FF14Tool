<template>
  <div id="app" class="w-full h-screen flex flex-col overflow-hidden">
    <!-- 路由視圖 -->
    <RouterView v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </div>
</template>

<script setup>
import { RouterView, useRouter } from 'vue-router'
import { useUserStore, useAppStore } from '@/stores'
import { initializeFirebase } from '@/services/firebase'
import { APP_CONFIG } from '@/config/app.config'
import { onMounted, watch } from 'vue'

const userStore = useUserStore()
const appStore = useAppStore()
const router = useRouter()

const updateBodyTheme = (mode) => {
  document.body.classList.toggle('theme-dark', mode === 'dark')
}

const getSavedThemeMode = () => {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = window.localStorage.getItem(APP_CONFIG.storage.uiState)
    if (!raw) return 'light'
    const parsed = JSON.parse(raw)
    return parsed?.themeMode === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

updateBodyTheme(getSavedThemeMode())

// 初始化應用
onMounted(async () => {
  try {
    // 初始化 Firebase
    initializeFirebase()

    // 初始化用戶狀態
    await userStore.initializeAuth()

    // 初始化應用狀態
    appStore.initializeAppState()
    updateBodyTheme(appStore.themeMode)

    console.log('✓ 應用初始化完成')
  } catch (error) {
    console.error('✗ 應用初始化失敗:', error)
  }
})

watch(() => appStore.themeMode, updateBodyTheme)
</script>

<style scoped>
#app {
  font-family: 'Noto Sans TC', sans-serif;
}
</style>
