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
          FINAL FANTASY XIV<br />
          怪物座標查詢
        </h1>
      </div>

      <!-- 表單 -->
      <div class="space-y-4">
          <div v-if="savedAccount && !showAccountFields" class="rounded-[2rem] bg-slate-900/90 p-4 text-white shadow-lg">
          <div class="text-sm opacity-80">先前登入的帳號：</div>
          <div class="text-lg font-black tracking-tight">{{ savedAccount }}</div>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <button
              @click="useSavedAccount"
              class="flex-1 bg-white text-slate-950 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-slate-100 transition"
            >
              使用此帳號
            </button>
            <button
              @click="switchAccount"
              class="flex-1 bg-slate-700 text-white py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-slate-600 transition"
            >
              這不是我的帳號
            </button>
          </div>
        </div>

        <div v-if="!savedAccount || showAccountFields" class="space-y-4">
          <input
            v-model="form.account"
            type="text"
            class="w-full px-6 py-4 bg-slate-100 rounded-2xl font-bold outline-none"
            placeholder="輸入帳號"
            @keydown.enter="login"
          />
          <input
            v-if="showPasswordField"
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
          <div v-if="errorMessage" class="text-red-600 text-sm font-bold pt-2">
            {{ errorMessage }}
          </div>
        </div>
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
const showAccountFields = ref(false)

const userStore = useUserStore()
const router = useRouter()

const isLoading = computed(() => userStore.isLoading)
const error = computed(() => userStore.error)
const errorMessage = computed(() => error.value)
const savedAccount = computed(() => userStore.savedAccount)
const savedAccountIsAdmin = computed(() => userStore.savedAccountIsAdmin)
const showPasswordField = computed(() => {
  return showAccountFields.value || (savedAccountIsAdmin.value && form.value.account === savedAccount.value)
})

async function useSavedAccount() {
  form.value.account = savedAccount.value
  form.value.password = ''
  userStore.error = null
  if (!savedAccountIsAdmin.value) {
    await login()
  } else {
    showAccountFields.value = true
  }
}

function switchAccount() {
  form.value.account = ''
  form.value.password = ''
  userStore.error = null
  showAccountFields.value = true
}

async function login() {
  console.log('LoginPage: login()', form.value.account)
  if (!form.value.account.trim()) {
    userStore.error = '請輸入帳號'
    return
  }

  try {
    await userStore.login(form.value.account, form.value.password)
    console.log('LoginPage: login success, redirecting')
    await router.push('/search')
  } catch (err) {
    console.error('LoginPage: 登入失敗:', err)
    userStore.error = err.message || '登入失敗，請查看控制台'
  }
}
</script>

<style scoped>
.login-gradient {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}
</style>
