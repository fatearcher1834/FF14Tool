<template>
  <div class="w-full h-screen flex items-center justify-center login-gradient p-6">
    <div class="w-full max-w-md bg-white rounded-[2.5rem] p-10 space-y-8">
      <!-- 標題 -->
      <div class="text-center space-y-2">
        <div class="inline-block p-4 bg-blue-600 rounded-3xl text-white shadow-xl mb-4">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
        </div>
        <h1 class="text-3xl font-black tracking-tighter text-slate-900 uppercase">
          Hunt Cloud
        </h1>
      </div>

      <!-- 表單 -->
      <div class="space-y-4">
        <input
          v-model="form.account"
          type="text"
          class="w-full px-6 py-4 bg-slate-100 rounded-2xl font-bold outline-none"
          placeholder="輸入帳號"
          @keydown.enter="login"
        />
        <input
          v-model="form.password"
          type="password"
          class="w-full px-6 py-4 bg-slate-100 rounded-2xl font-bold outline-none"
          placeholder="輸入密碼"
          @keydown.enter="login"
        />

        <button
          @click="login"
          :disabled="isLoading"
          class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          進入系統
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores'
import { useRouter } from 'vue-router'

const form = ref({
  account: '',
  password: ''
})

const userStore = useUserStore()
const router = useRouter()

const isLoading = computed(() => userStore.isLoading)
const error = computed(() => userStore.error)

async function login() {
  if (!form.value.account.trim()) {
    return
  }

  try {
    await userStore.login(form.value.account)
    // 登入成功後重定向到搜索頁面
    await router.push('/search')
  } catch (err) {
    console.error('登入失敗:', err)
  }
}
</script>

<style scoped>
.login-gradient {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}
</style>
