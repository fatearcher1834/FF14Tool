/**
 * 工具函數集合
 */

/**
 * Levenshtein 距離算法 - 計算字符串相似度
 */
export function calculateLevenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let i = 0; i <= str2.length; i++) matrix[i][0] = i;

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      matrix[i][j] =
        str1[j - 1] === str2[i - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j],
              matrix[i][j - 1],
              matrix[i - 1][j - 1]
            ) + 1;
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * 計算相似度百分比 (0 - 100)
 */
export function calculateSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  
  const distance = calculateLevenshteinDistance(str1, str2);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

/**
 * 查找最相似的地圖名稱
 */
export function findBestMapMatch(inputMapName, availableMaps, threshold = 50) {
  const similarities = availableMaps
    .map(map => ({
      map,
      similarity: calculateSimilarity(inputMapName, map)
    }))
    .sort((a, b) => b.similarity - a.similarity);

  // 優先返回 100% 匹配
  if (similarities[0].similarity === 100) {
    return similarities[0].map;
  }

  // 如果最相似度超過閾值，返回最相似的；否則返回第一個地圖
  if (similarities[0].similarity >= threshold) {
    return similarities[0].map;
  }

  return availableMaps[0];
}

/**
 * 簡體中文轉繁體字符映射表
 */
const SIMPLIFIED_TO_TRADITIONAL = {
  诺: "諾",
  萨: "薩",
  纳: "納",
  库: "庫",
  尔: "爾",
  札: "札",
  摩: "摩",
  杜: "杜",
  德: "德",
  拉: "拉",
  瓦: "瓦",
  尼: "尼",
  亚: "亞",
  云: "雲",
  海: "海",
  魔: "魔",
  大: "大",
  陆: "陸",
  阿: "阿",
  滋: "滋",
  基: "基",
  巴: "巴",
  山: "山",
  区: "區",
  湖: "湖",
  红: "紅",
  玉: "玉",
  延: "延",
  夏: "夏",
  太: "太",
  阳: "陽",
  神: "神",
  草: "草",
  原: "原",
  雷: "雷",
  克: "克",
  兰: "蘭",
  珂: "珂",
  露: "露",
  西: "西",
  美: "美",
  格: "格",
  凯: "凱",
  撒: "撒",
  维: "維",
  风: "風",
  迷: "迷",
  津: "津",
  图: "圖",
  泰: "泰",
  村: "村",
  赫: "赫",
  利: "利",
  特: "特",
  洛: "洛",
  普: "普",
  沙: "沙",
  命: "命",
  之: "之",
  源: "源",
  东: "東",
  南: "南",
  北: "北",
  衣: "衣",
  森: "森",
  林: "林",
  雾: "霧",
  梦: "夢",
  岛: "島",
  安: "安",
  姆: "姆",
  伊: "伊",
  雅: "雅",
  高: "高",
  地: "地",
  中: "中",
  央: "央",
  斯: "斯"
};

/**
 * 簡體中文轉繁體
 */
export function convertSimplifiedToTraditional(text) {
  if (!text) return text;

  let result = text;

  // 字符級轉換
  for (let i = 0; i < result.length; i++) {
    if (SIMPLIFIED_TO_TRADITIONAL[result[i]]) {
      result =
        result.substring(0, i) +
        SIMPLIFIED_TO_TRADITIONAL[result[i]] +
        result.substring(i + 1);
    }
  }

  // 短語級轉換（處理特殊情況）
  const phraseReplacements = [
    ["黑衣森林", "黑衣森林"],
    ["迷津", "迷津"],
    ["厄爾庇斯", "厄爾庇斯"],
    ["天外天", "天外天"],
    ["赫利特洛普", "赫利特洛普"]
  ];

  phraseReplacements.forEach(([simp, trad]) => {
    result = result.replace(new RegExp(simp, "g"), trad);
  });

  return result;
}

/**
 * 解析批量輸入的地圖位置
 * 格式: 地圖名 X:123 Y:456 或 地圖名 (X:123, Y:456)
 */
export function parseBatchLocations(text) {
  if (!text.trim()) return [];

  const locationPattern =
    /([\u4E00-\u9FFF]+)\s*\(?\s*[Xx][:：]\s*([0-9.]+)\s*[,，]?\s*[Yy][:：]\s*([0-9.]+)\s*\)?/g;
  const matches = [...text.matchAll(locationPattern)];

  if (matches.length === 0) return [];

  return matches.map(m => ({
    mapName: m[1].trim(),
    x: m[2],
    y: m[3]
  }));
}

/**
 * 複製文本到剪貼板
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      console.log("✓ 已複製到剪貼板");
      return true;
    } else {
      // 兼容舊瀏覽器
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      console.log("✓ 已複製到剪貼板 (兼容模式)");
      return true;
    }
  } catch (error) {
    console.error("✗ 複製失敗:", error);
    return false;
  }
}

/**
 * 防抖函數
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 節流函數
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 格式化日期
 */
export function formatDate(timestamp) {
  if (!timestamp) return "-";
  
  let date;
  if (typeof timestamp === "number") {
    date = new Date(timestamp);
  } else if (timestamp.toDate) {
    // Firebase Timestamp
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 本地存儲相關函數
 */
export const localStorageHelper = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`✗ 讀取本地存儲失敗 [${key}]:`, error);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`✗ 保存到本地存儲失敗 [${key}]:`, error);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`✗ 移除本地存儲失敗 [${key}]:`, error);
    }
  },

  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("✗ 清空本地存儲失敗:", error);
    }
  }
};

export default {
  calculateLevenshteinDistance,
  calculateSimilarity,
  findBestMapMatch,
  convertSimplifiedToTraditional,
  parseBatchLocations,
  copyToClipboard,
  debounce,
  throttle,
  formatDate,
  localStorageHelper
};
