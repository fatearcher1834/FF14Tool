/**
 * 狩獵工具函數
 */

import { VERSIONS, RANKS, MAP_DATA, JOB_BASE_NAMES } from '@/config/constants'

/**
 * 怪物篩選
 */
export const applyFilter = (list, search, ver, map, rank, fate, wanted, jobs) => {
  return list.filter(m => {
    const matchName = (m.name || '').toLowerCase().includes(search.toLowerCase())
    const matchVer = !ver || m.version === ver
    // 若使用者已選地圖，保留沒有座標的新怪物，避免新增後被濾掉
    const hasNoLocation = !m.locations || !(m.locations.length > 0)
    const matchMap = !map || hasNoLocation || (m.locations || []).some(l => l.map === map)
    const matchRank = !rank || m.rank === rank
    const matchFate = !fate || m.isFate === true
    const matchWanted = !wanted || m.isWanted === true
    let matchJobs
    // 保證 arr 一定是陣列且無空值
    const arr = Array.isArray(m.jobs) ? m.jobs.filter(Boolean) : (typeof m.jobs === 'string' && m.jobs ? [m.jobs] : [])
    if (!jobs) {
      matchJobs = true
    } else if (jobs === '*') {
      matchJobs = arr.length > 0
    } else {
      matchJobs = arr.some(j => typeof j === 'string' && j.startsWith(jobs))
    }
    return matchName && matchVer && matchMap && matchRank && matchFate && matchWanted && matchJobs
  })
}

/**
 * 排序怪物列表
 */
const parseJobEntry = jobEntry => {
  const raw = String(jobEntry || '').trim()
  const numMatch = raw.match(/(\d{1,2})$/)
  const number = numMatch ? Number(numMatch[1]) : 0
  const baseName = numMatch ? raw.slice(0, -numMatch[1].length) : raw
  const baseIndex = JOB_BASE_NAMES.findIndex(name => baseName.startsWith(name))
  return {
    raw,
    baseName,
    number,
    baseIndex: baseIndex >= 0 ? baseIndex : JOB_BASE_NAMES.length
  }
}

const getJobSortKey = (monster, jobsFilter) => {
  const allJobs = Array.isArray(monster.jobs) ? monster.jobs : monster.jobs ? [monster.jobs] : []
  const parsed = allJobs
    .map(parseJobEntry)
    .filter(item => item.raw)

  if (jobsFilter && jobsFilter !== '*') {
    const filtered = parsed.filter(item => item.baseName.startsWith(jobsFilter))
    if (filtered.length === 0) {
      return { hasMatch: false, number: Infinity, baseIndex: JOB_BASE_NAMES.length }
    }
    const minNumber = Math.min(...filtered.map(item => item.number))
    const minBaseIndex = Math.min(...filtered.filter(item => item.number === minNumber).map(item => item.baseIndex))
    return { hasMatch: true, number: minNumber, baseIndex: minBaseIndex }
  }

  if (parsed.length === 0) {
    return { hasMatch: false, number: Infinity, baseIndex: JOB_BASE_NAMES.length }
  }
  
  const minNumber = Math.min(...parsed.map(item => item.number))
  const candidates = parsed.filter(item => item.number === minNumber)
  const minBaseIndex = Math.min(...candidates.map(item => item.baseIndex))
  return { number: minNumber, baseIndex: minBaseIndex }
}

export const sortMonsters = (list, field, direction, jobsFilter) => {
  if (!field) return list
  const sorted = [...list].sort((a, b) => {
    let aVal, bVal

    if (field === 'name') {
      aVal = (a.name || '').toLowerCase()
      bVal = (b.name || '').toLowerCase()
    } else if (field === 'job') {
      const aJobKey = getJobSortKey(a, jobsFilter)
      const bJobKey = getJobSortKey(b, jobsFilter)

      // 特定排序職業時，該職業的怪物優先
      if (aJobKey.hasMatch !== bJobKey.hasMatch) {
        return aJobKey.hasMatch ? -1 : 1
      }

      if (aJobKey.number !== bJobKey.number) {
        return direction === 'asc'
          ? aJobKey.number - bJobKey.number
          : bJobKey.number - aJobKey.number
      }

      if (aJobKey.baseIndex !== bJobKey.baseIndex) {
        return direction === 'asc'
          ? aJobKey.baseIndex - bJobKey.baseIndex
          : bJobKey.baseIndex - aJobKey.baseIndex
      }

      aVal = (a.name || '').toLowerCase()
      bVal = (b.name || '').toLowerCase()
    } else if (field === 'map') {
      const aLocs = a.locations || []
      const bLocs = b.locations || []
      aVal = aLocs.length > 0 ? aLocs[0].map : ''
      bVal = bLocs.length > 0 ? bLocs[0].map : ''
    } else if (field === 'createdAt') {
      aVal = a.createdAt || 0
      bVal = b.createdAt || 0
    } else if (field === 'updatedAt') {
      aVal = a.updatedAt || 0
      bVal = b.updatedAt || 0
    }

    if (direction === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })
  return sorted
}

/**
 * Levenshtein 距離算法
 */
export const levenshteinDistance = (str1, str2) => {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0))
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let i = 0; i <= str2.length; i++) matrix[i][0] = i

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      matrix[i][j] =
        str1[j - 1] === str2[i - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j],
              matrix[i][j - 1],
              matrix[i - 1][j - 1]
            ) + 1
    }
  }
  return matrix[str2.length][str1.length]
}

/**
 * 計算相似度百分比 (0 - 100)
 */
export const calculateSimilarity = (str1, str2) => {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 100
  const distance = levenshteinDistance(str1, str2)
  return Math.round(((maxLen - distance) / maxLen) * 100)
}

/**
 * 找到最相似的地圖名稱
 */
export const findBestMapMatch = (inputMapName, version, threshold) => {
  const availableMaps = MAP_DATA[version]
  const similarities = availableMaps
    .map(map => ({
      map,
      similarity: calculateSimilarity(inputMapName, map)
    }))
    .sort((a, b) => b.similarity - a.similarity)

  if (similarities[0].similarity === 100) {
    return similarities[0].map
  }

  if (similarities[0].similarity >= threshold) {
    return similarities[0].map
  }
  return availableMaps[0]
}

/**
 * 簡體中文轉繁體
 */
export const simplifiedToTraditional = text => {
  if (!text) return text
  let result = text

  const phraseMap = {
    '翻云雾海': '德拉瓦尼亞雲海',
    '龙堡参天高地': '德拉瓦尼亞山麓地',
    '龙堡内陆低地': '德拉瓦尼亞河谷地',
    '翻雲霧海': '德拉瓦尼亞雲海',
    '龍堡參天高地': '德拉瓦尼亞山麓地',
    '龍堡內陸低地': '德拉瓦尼亞河谷地',
  }

  Object.entries(phraseMap).forEach(([key, val]) => {
    result = result.split(key).join(val)
  })

  const charMap = {
    诺: '諾',
    萨: '薩',
    纳: '納',
    库: '庫',
    尔: '爾',
    札: '札',
    摩: '摩',
    杜: '杜',
    德: '德',
    拉: '拉',
    瓦: '瓦',
    尼: '尼',
    亚: '亞',
    云: '雲',
    海: '海',
    魔: '魔',
    大: '大',
    陆: '陸',
    阿: '阿',
    滋: '滋',
    基: '基',
    巴: '巴',
    山: '山',
    区: '區',
    湖: '湖',
    红: '紅',
    玉: '玉',
    延: '延',
    夏: '夏',
    太: '太',
    阳: '陽',
    神: '神',
    草: '草',
    原: '原',
    雷: '雷',
    克: '克',
    兰: '蘭',
    珂: '珂',
    露: '露',
    西: '西',
    美: '美',
    格: '格',
    凯: '凱',
    撒: '撒',
    维: '維',
    风: '風',
    迷: '迷',
    津: '津',
    圖: '圖',
    爾: '爾',
    泰: '泰',
    村: '村',
    赫: '赫',
    利: '利',
    特: '特',
    洛: '洛',
    普: '普',
    沙: '沙',
    命: '命',
    之: '之',
    源: '源',
    东: '東',
    南: '南',
    北: '北',
    衣: '衣',
    森: '森',
    林: '林',
    雾: '霧',
    梦: '夢',
    岛: '島',
    安: '安',
    姆: '姆',
    伊: '伊',
    雅: '雅',
    高: '高',
    地: '地',
    中: '中',
    央: '央'
  }

  for (let i = 0; i < result.length; i++) {
    if (charMap[result[i]]) {
      result = result.substring(0, i) + charMap[result[i]] + result.substring(i + 1)
    }
  }

  return result
}

/**
 * 複製到剪貼板
 */
export const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  }
}

/**
 * 取得版本的地圖
 */
export const getMapsForVersion = ver => {
  if (ver && MAP_DATA[ver]) {
    return MAP_DATA[ver]
  }
  return Object.values(MAP_DATA).flat()
}
