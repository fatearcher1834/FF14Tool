<template>
  <div class="w-full h-screen flex items-center justify-center bg-slate-50 p-6">
    <div class="text-center space-y-6 max-w-md">
      <div class="text-8xl">🔍</div>
      <h1 class="text-5xl font-black text-slate-900">404</h1>
      <p class="text-xl text-slate-600">找不到該頁面</p>
      <p class="text-sm text-slate-500">
        抱歉，您訪問的頁面不存在或已被移除。
      </p>

      <div class="flex gap-4 justify-center pt-6">
        <button
          @click="router.push('/search')"
          class="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors"
        >
          ← 返回首頁
        </button>
        <button
          @click="router.back()"
          class="px-6 py-3 bg-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-300 transition-colors"
        >
          ← 返回上一頁
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
