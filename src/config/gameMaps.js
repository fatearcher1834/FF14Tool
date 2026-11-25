export const MAP_IMAGE_SIZE = 2048

const MAP_ALIASES = {
  '雷克蘭德': '雷克蘭',
  '安穆・艾蘭': '安姆阿蘭',
  '安穆艾蘭': '安姆阿蘭',
  '奧闊帕恰山': '奧科帕查',
  '亞克特爾樹海': '亞克泰爾村',
  '夏勞尼荒野': '沙阿洛尼',
  '遺產之地': '赫利特洛普',
  '憶想之地': '生命之源',
  '克扎瑪烏卡濕地': '高地圖拉爾'
}

const MAPS = {
  '中拉諾西亞': { mapId: 's1f1/00', sizeFactor: 100 },
  '拉諾西亞低地': { mapId: 's1f2/00', sizeFactor: 100 },
  '東拉諾西亞': { mapId: 's1f3/01', sizeFactor: 100 },
  '西拉諾西亞': { mapId: 's1f4/00', sizeFactor: 100 },
  '拉諾西亞高地': { mapId: 's1f5/00', sizeFactor: 100 },
  '拉諾西亞外地': { mapId: 's1f6/00', sizeFactor: 100 },
  '黑衣森林中央林區': { mapId: 'f1f1/00', sizeFactor: 100 },
  '黑衣森林東部林區': { mapId: 'f1f2/00', sizeFactor: 100 },
  '黑衣森林南部林區': { mapId: 'f1f3/00', sizeFactor: 100 },
  '黑衣森林北部林區': { mapId: 'f1f4/00', sizeFactor: 100 },
  '西薩納蘭': { mapId: 'w1f1/00', sizeFactor: 100 },
  '中薩納蘭': { mapId: 'w1f2/00', sizeFactor: 100 },
  '東薩納蘭': { mapId: 'w1f3/00', sizeFactor: 100 },
  '南薩納蘭': { mapId: 'w1f4/01', sizeFactor: 100 },
  '北薩納蘭': { mapId: 'w1f5/00', sizeFactor: 100 },
  '庫爾札斯中央高地': { mapId: 'r1f1/00', sizeFactor: 100 },
  '摩杜納': { mapId: 'l1f1/01', sizeFactor: 100 },
  '庫爾札斯西部高地': { mapId: 'r2f1/00', sizeFactor: 95 },
  '德拉瓦尼亞山麓地': { mapId: 'd2f1/00', sizeFactor: 95 },
  '德拉瓦尼亞河谷地': { mapId: 'd2f2/00', sizeFactor: 95 },
  '德拉瓦尼亞雲海': { mapId: 'd2f3/00', sizeFactor: 95 },
  '阿巴拉提亞雲海': { mapId: 'a2f1/00', sizeFactor: 95 },
  '魔大陸阿濟茲拉': { mapId: 'a2f2/00', sizeFactor: 95 },
  '基拉巴尼亞邊區': { mapId: 'g3f1/00', sizeFactor: 100 },
  '基拉巴尼亞山區': { mapId: 'g3f2/00', sizeFactor: 100 },
  '基拉巴尼亞湖區': { mapId: 'g3f3/00', sizeFactor: 100 },
  '紅玉海': { mapId: 'e3f1/00', sizeFactor: 100 },
  '延夏': { mapId: 'e3f2/00', sizeFactor: 100 },
  '太陽神草原': { mapId: 'e3f3/00', sizeFactor: 100 },
  '雷克蘭': { mapId: 'n4f1/00', sizeFactor: 100 },
  '珂露西亞島': { mapId: 'n4f2/00', sizeFactor: 100 },
  '安姆阿蘭': { mapId: 'n4f3/00', sizeFactor: 100 },
  '伊爾美格': { mapId: 'n4f4/00', sizeFactor: 100 },
  '拉凱提卡大森林': { mapId: 'n4f5/00', sizeFactor: 100 },
  '黑風海': { mapId: 'n4f6/00', sizeFactor: 100 },
  '迷津': { mapId: 'k5f1/00', sizeFactor: 100 },
  '薩維奈島': { mapId: 'm5f1/00', sizeFactor: 100 },
  '加雷馬': { mapId: 'm5f2/00', sizeFactor: 100 },
  '嘆息海': { mapId: 'u5f1/00', sizeFactor: 100 },
  '厄爾庇斯': { mapId: 'n5f1/00', sizeFactor: 100 },
  '天外天垓': { mapId: 'u5f2/00', sizeFactor: 100 },
  '奧科帕查': { mapId: 'y6f1/00', sizeFactor: 100 },
  '高地圖拉爾': { mapId: 'y6f2/00', sizeFactor: 100 },
  '亞克泰爾村': { mapId: 'y6f3/00', sizeFactor: 100 },
  '沙阿洛尼': { mapId: 'x6f1/00', sizeFactor: 100 },
  '赫利特洛普': { mapId: 'x6f2/00', sizeFactor: 100 },
  '生命之源': { mapId: 'x6f3/00', sizeFactor: 100 }
}

export const GAME_MAPS = MAPS

export const getGameMap = (mapName) => {
  if (!mapName) return null
  if (MAPS[mapName]) return MAPS[mapName]
  const alias = MAP_ALIASES[mapName]
  return alias ? MAPS[alias] || null : null
}

export const getGameMapImageUrls = (mapInfo) => {
  if (!mapInfo || !mapInfo.mapId) return []
  return [
    `https://v2.xivapi.com/api/asset/map/${mapInfo.mapId}?format=jpg`,
    `https://xivapi-v2.xivcdn.com/api/asset/map/${mapInfo.mapId}?format=jpg`
  ]
}
