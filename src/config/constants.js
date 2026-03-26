/**
 * 遊戲數據常數
 * 這些數據應該從數據庫中動態加載
 * 但保留這裡作為備用/緩存
 */

// FF14 版本列表 (應存入數據庫)
export const GAME_VERSIONS = [
  { id: "2.0", name: "2.0", color: "bg-zinc-500" },
  { id: "3.0", name: "3.0", color: "bg-sky-700" },
  { id: "4.0", name: "4.0", color: "bg-red-700" },
  { id: "5.0", name: "5.0", color: "bg-indigo-800" },
  { id: "6.0", name: "6.0", color: "bg-emerald-700" },
  { id: "7.0", name: "7.0", color: "bg-amber-600" }
];

// 怪物等級 (應存入數據庫)
export const MONSTER_RANKS = [
  { id: "None", name: "一般", label: "None", color: "hidden" },
  { id: "B", name: "B級", label: "B", color: "bg-slate-400 text-white" },
  { id: "A", name: "A級", label: "A", color: "bg-red-500 text-white" },
  { id: "S", name: "S級", label: "S", color: "bg-amber-500 text-white shadow-sm" },
  { id: "SS", name: "SS級", label: "SS", color: "bg-purple-600 text-white shadow-md animate-pulse" }
];

// 職業基礎名稱 (應存入數據庫)
export const JOB_BASE_NAMES = [
  "劍術師",
  "格鬥家",
  "斧術師",
  "槍術師",
  "弓箭手",
  "幻術師",
  "咒術師",
  "秘術師",
  "雙劍師",
  "黑渦團",
  "雙蛇黨",
  "不滅隊"
];

// 職業顏色映射 (應存入數據庫)
export const JOB_COLORS = {
  // 防禦職業（鮮明藍）
  "劍術師": "bg-[#3d7bf0] text-white",
  "斧術師": "bg-[#3d7bf0] text-white",

  // 進攻職業（鮮明紅）
  "格鬥家": "bg-[#c73c45] text-white",
  "槍術師": "bg-[#c73c45] text-white",
  "弓箭手": "bg-[#c73c45] text-white",
  "咒術師": "bg-[#c73c45] text-white",
  "雙劍師": "bg-[#c73c45] text-white",
  "秘術師": "bg-[#c73c45] text-white",

  // 輔助職業（鮮明綠）
  "幻術師": "bg-[#3e9b49] text-white",

  // 特殊勢力（保留原色）
  "黑渦團": "bg-red-600 text-white",
  "雙蛇黨": "bg-emerald-600 text-white",
  "不滅隊": "bg-amber-500 text-white"
};

// 討伐筆記編號 (01~50)
export const JOB_SUFFIXES = Array.from(
  { length: 50 },
  (_, i) => String(i + 1).padStart(2, "0")
);

// 地圖數據 (應存入數據庫)
export const MAP_DATA = {
  "2.0": [
    "中拉諾西亞", "拉諾西亞低地", "東拉諾西亞", "西拉諾西亞", "拉諾西亞高地",
    "拉諾西亞外地", "黑衣森林中央林區", "黑衣森林東部林區", "黑衣森林南部林區",
    "黑衣森林北部林區", "西薩納蘭", "中薩納蘭", "東薩納蘭", "南薩納蘭",
    "北薩納蘭", "庫爾札斯中央高地", "摩杜納"
  ],
  "3.0": [
    "庫爾札斯西部高地", "德拉瓦尼亞山麓地", "德拉瓦尼亞河谷地", "德拉瓦尼亞雲海",
    "阿巴拉提亞雲海", "魔大陸阿濟茲拉"
  ],
  "4.0": [
    "基拉巴尼亞邊區", "基拉巴尼亞山區", "基拉巴尼亞湖區", "紅玉海", "延夏",
    "太陽神草原"
  ],
  "5.0": [
    "雷克蘭", "珂露西亞島", "安姆阿蘭", "伊爾美格", "拉凱提卡大森林", "黑風海"
  ],
  "6.0": [
    "迷津", "薩維奈島", "加雷馬", "嘆息海", "厄爾庇斯", "天外天垓"
  ],
  "7.0": [
    "奧科帕查", "高地圖拉爾", "亞克泰爾村", "赫利特洛普", "沙阿洛尼", "生命之源"
  ]
};

export const DUNGEON_MAPS = [
  '魔獸領域日影地修煉所',
  '古代遺跡喀恩埋沒聖堂',
  '神靈聖域放浪神古神殿',
  '流沙迷宮樵鳴洞',

];

export const DUNGEON_MAPS_TRAD = [...DUNGEON_MAPS];

// 所有地區列表 (用於搜尋)
export const ALL_REGIONS = Object.values(MAP_DATA).flat();

// 排序選項
export const SORT_OPTIONS = [
  { value: "name", label: "名稱" },
  { value: "job", label: "討伐筆記" },
  { value: "map", label: "地圖" },
  { value: "createdAt", label: "新增時間" },
  { value: "updatedAt", label: "修改時間" }
];

// 分頁選項
export const PAGINATION_OPTIONS = [
  { value: 20, label: "20筆" },
  { value: 50, label: "50筆" },
  { value: 100, label: "100筆" },
  { value: 300, label: "300筆" },
  { value: 500, label: "500筆" },
  { value: 1000, label: "1000筆" }
];

// 向後兼容別名
export const VERSIONS = GAME_VERSIONS.map(v => v.id);
export const RANKS = MONSTER_RANKS.map(r => r.id);
