// 高對比色盤：避開與地圖米黃／綠／橄欖色相近的顏色。
const EXPLORER_COLORS = [
  '#1d4ed8',
  '#dc2626',
  '#7c3aed',
  '#c026d3',
  '#0891b2',
  '#be123c',
  '#4f46e5',
  '#9333ea',
  '#0369a1',
  '#b91c1c',
  '#6d28d9',
  '#db2777',
  '#0e7490',
  '#9f1239',
  '#4338ca',
  '#a21caf',
  '#1e40af',
  '#e11d48',
  '#5b21b6',
  '#155e75',
  '#991b1b',
  '#701a75',
  '#312e81',
  '#831843'
]

// 同一隻怪物永遠取得同一個顏色，讓同地圖的不同怪物能靠顏色區分。
export const getMonsterExplorerColor = (monster) => {
  const key = String(monster?.id || monster?.name || '')
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return EXPLORER_COLORS[hash % EXPLORER_COLORS.length]
}
