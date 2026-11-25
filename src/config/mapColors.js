// 同一隻怪物永遠取得同一個顏色，讓同地圖的不同怪物能靠顏色區分。
export const getMonsterExplorerColor = (monster) => {
  const key = String(monster?.id || monster?.name || '')
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  const hue = (hash * 137.508) % 360
  const saturation = 62 + (hash % 10)
  const lightness = 38 + (hash % 8)
  return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness}%)`
}
