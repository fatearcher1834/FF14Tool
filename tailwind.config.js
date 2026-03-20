/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        // 遊戲版本顏色
        version: {
          '2.0': '#71717a',  // zinc-500
          '3.0': '#0c4a6e',  // sky-700
          '4.0': '#b91c1c',  // red-700
          '5.0': '#312e81',  // indigo-800
          '6.0': '#047857',  // emerald-700
          '7.0': '#92400e',  // amber-600
        }
      },
      fontFamily: {
        'sans': ['Noto Sans TC', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(-4px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
  safelist: [
    // 版本顏色類
    'bg-zinc-500', 'bg-sky-700', 'bg-red-700', 'bg-indigo-800', 'bg-emerald-700', 'bg-amber-600',
    // 等級顏色類
    'bg-slate-400', 'bg-red-500', 'bg-amber-500', 'bg-purple-600',
    // 職業顏色類
    'bg-blue-600', 'bg-red-600', 'bg-orange-600', 'bg-cyan-600', 'bg-green-600',
    'bg-purple-600', 'bg-indigo-600', 'bg-pink-600', 'bg-lime-600', 'bg-violet-600',
    'bg-fuchsia-600', 'bg-cyan-500',
    // 其他必要的類
    'text-white', 'text-slate-900',
  ]
}
