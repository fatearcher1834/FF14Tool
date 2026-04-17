/**
 * 數據庫操作服務層
 * 所有 Firestore 操作都在這裡進行
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp
} from "firebase/firestore";

const MAX_FIRESTORE_IMAGE_BYTES = 1048487;

async function compressImageDataURL(dataUrl, maxBytes = MAX_FIRESTORE_IMAGE_BYTES) {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  if (dataUrl.length <= maxBytes) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const squareSize = Math.min(img.width, img.height);
        const offsetX = (img.width - squareSize) / 2;
        const offsetY = (img.height - squareSize) / 2;

        const canvas = document.createElement('canvas');
        const MAX_SIDE = 512;
        let outputSize = Math.min(squareSize, MAX_SIDE);

        const doDraw = (size) => {
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('無法取得 canvas 上下文');
          ctx.drawImage(img, offsetX, offsetY, squareSize, squareSize, 0, 0, size, size);
        };

        doDraw(outputSize);

        let quality = 0.85;
        let compressed = canvas.toDataURL('image/jpeg', quality);

        while (compressed.length > maxBytes && quality > 0.08) {
          quality -= 0.05;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }

        if (compressed.length > maxBytes) {
          const scaleFactor = Math.sqrt(maxBytes / compressed.length);
          outputSize = Math.max(100, Math.floor(outputSize * scaleFactor));
          doDraw(outputSize);
          quality = 0.7;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }

        if (compressed.length > maxBytes) {
          // 若還超過，就回傳最低壓縮
          console.warn('[compressImageDataURL] 無法達到 maxBytes，返回最小尺寸結果');
        }

        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(new Error('圖片載入失敗 ' + err));
    img.src = dataUrl;
  });
}

async function ensureImageDataWithinLimit(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  if (dataUrl.length <= MAX_FIRESTORE_IMAGE_BYTES) return dataUrl;
  const compressed = await compressImageDataURL(dataUrl);
  if (compressed && compressed.length <= MAX_FIRESTORE_IMAGE_BYTES) return compressed;
  if (compressed && compressed.length > MAX_FIRESTORE_IMAGE_BYTES) {
    throw new Error(`圖片仍超過 ${MAX_FIRESTORE_IMAGE_BYTES} bytes，當前 ${compressed.length} bytes，請改用更小圖片`);
  }
  throw new Error('圖片壓縮失敗，無法生成有效 imageData');
}
import { getDb } from "./firebase";
import { DB_PATHS, APP_ID } from "../config/firebase.config";

/**
 * 從數據庫中讀取用戶數據
 */
export async function getUserFromDatabase(userId, appId = APP_ID) {
  try {
    const db = getDb();
    // 從 users 集合讀取用戶文檔
    const userDocRef = doc(db, 'artifacts', appId, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    
    if (userSnapshot.exists()) {
      return userSnapshot.data();
    }
    
    console.log(`⚠ 用戶 [${userId}] 的數據不存在`);
    return null;
  } catch (error) {
    console.error(`✗ 讀取用戶 [${userId}] 失敗:`, error);
    throw error;
  }
}

/**
 * 獲取註冊表登錄資料
 */
export async function getUserRegistry(account, appId = APP_ID) {
  try {
    const db = getDb();
    const regDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', account);
    const regSnapshot = await getDoc(regDocRef);

    if (regSnapshot.exists()) {
      return regSnapshot.data();
    }

    console.log(`⚠ 帳號 [${account}] 的註冊資料不存在`);
    return null;
  } catch (error) {
    console.error(`✗ 讀取帳號 [${account}] 註冊資料失敗:`, error);
    throw error;
  }
}

export async function linkAuthAccount(authUid, account, isAdmin, appId = APP_ID) {
  if (!authUid || !account) {
    throw new Error('authUid 與 account 都必須提供');
  }

  try {
    const db = getDb();
    const mappingRef = doc(db, 'artifacts', appId, 'public', 'data', 'automapping', authUid);
    await setDoc(mappingRef, {
      account,
      isAdmin: Boolean(isAdmin),
      linkedAt: new Date()
    });
    console.log(`✓ 已將 authUid=${authUid} 連結到 account=${account}`);
  } catch (error) {
    console.error(`✗ 連結 authUid=${authUid} 到 account=${account} 失敗:`, error);
    throw error;
  }
}

export async function getAuthMapping(authUid, appId = APP_ID) {
  if (!authUid) return null;
  try {
    const db = getDb();
    const mappingRef = doc(db, 'artifacts', appId, 'public', 'data', 'automapping', authUid);
    const mappingSnap = await getDoc(mappingRef);
    return mappingSnap.exists() ? mappingSnap.data() : null;
  } catch (error) {
    console.error(`✗ 讀取 authUid=${authUid} 對應資料失敗:`, error);
    throw error;
  }
}

/**
 * 獲取所有怪物數據
 */
function buildMonstersQuery(filters = {}, appId = APP_ID) {
  const db = getDb();
  const monstersRef = collection(db, 'artifacts', appId, 'public', 'data', 'monsters');
  const clauses = [];

  if (filters.searchTerm) {
    const trimmed = filters.searchTerm.trim();
    if (trimmed.length > 0) {
      clauses.push(where('name', '>=', trimmed));
      clauses.push(where('name', '<=', `${trimmed}\uf8ff`));
    }
  }

  if (filters.version) {
    clauses.push(where('version', '==', filters.version));
  }

  if (filters.map) {
    clauses.push(where('locationMaps', 'array-contains', filters.map));
  }

  if (filters.rank) {
    clauses.push(where('rank', '==', filters.rank));
  }

  // isFate / isWanted 這兩個布林過濾，會在 client 端做精準過濾，避免 Firestore 組合索引問題。
  // 這樣點 FATE / 通緝令 時仍然能正常顯示資料。

  clauses.push(orderBy('name', filters.sortDir === 'desc' ? 'desc' : 'asc'));
  return query(monstersRef, ...clauses);
}

function matchesMonsterFilters(monster, filters = {}) {
  if (filters.version && monster.version !== filters.version) {
    return false;
  }

  if (filters.map) {
    if (Array.isArray(monster.locationMaps) && monster.locationMaps.length > 0) {
      if (!monster.locationMaps.includes(filters.map)) {
        return false;
      }
    } else {
      const hasNoLocation = !monster.locations || monster.locations.length === 0;
      if (!hasNoLocation) {
        const matched = (monster.locations || []).some(loc => loc.map === filters.map);
        if (!matched) {
          return false;
        }
      }
    }
  }

  if (filters.rank && monster.rank !== filters.rank) {
    return false;
  }

  if (filters.isFate !== undefined && monster.isFate !== filters.isFate) {
    return false;
  }

  if (filters.isWanted !== undefined && monster.isWanted !== filters.isWanted) {
    return false;
  }

  if (filters.job) {
    const jobs = Array.isArray(monster.jobs)
      ? monster.jobs
      : monster.jobs
      ? [monster.jobs]
      : [];
    const hasJob = jobs.some(j => typeof j === 'string' && j.startsWith(filters.job));
    if (!hasJob) {
      return false;
    }
  }

  return true;
}

export async function getMonsterCount(filters = {}, appId = APP_ID) {
  try {
    const searchQuery = buildMonstersQuery(filters, appId);
    const snapshot = await getDocs(searchQuery);
    const monsters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return monsters.filter(monster => matchesMonsterFilters(monster, filters)).length;
  } catch (error) {
    console.error('✗ 讀取怪物總數失敗:', error);
    throw error;
  }
}

export async function getMonstersPage(pageSize = 100, filters = {}, cursor = null, appId = APP_ID) {
  try {
    const queryRef = buildMonstersQuery(filters, appId);
    let currentCursor = cursor;
    const pageMonsters = [];
    let lastProcessedDoc = null;
    let hasMore = false;
    const batchLimit = Math.max(pageSize * 5, 50);

    while (pageMonsters.length < pageSize) {
      let currentQuery = queryRef;
      if (currentCursor) {
        currentQuery = query(currentQuery, startAfter(currentCursor));
      }

      const snapshot = await getDocs(query(currentQuery, limit(batchLimit)));
      const docs = snapshot.docs;
      if (docs.length === 0) {
        break;
      }

      for (let i = 0; i < docs.length; i++) {
        const docData = docs[i];
        const monster = { id: docData.id, ...docData.data() };
        if (matchesMonsterFilters(monster, filters)) {
          pageMonsters.push(monster);
          if (pageMonsters.length === pageSize) {
            lastProcessedDoc = docs[i];
            hasMore = i < docs.length - 1 || docs.length === batchLimit;
            break;
          }
        }
      }

      if (pageMonsters.length === pageSize) {
        break;
      }
      lastProcessedDoc = docs[docs.length - 1];

      if (docs.length < batchLimit) {
        hasMore = false;
        break;
      }

      currentCursor = docs[docs.length - 1];
    }

    return {
      monsters: pageMonsters,
      lastDoc: lastProcessedDoc,
      hasMore
    };
  } catch (error) {
    console.error('✗ 讀取分頁怪物失敗:', error);
    throw error;
  }
}

export async function getAllMonsters(appId = APP_ID) {
  const buildMonsters = (snapshot) => {
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        rank: 'None',
        ...data,
        mapImageData: null,
        monsterImageData: null,
        hasMap: data.hasMap || false,
        hasMonsterImage: data.hasMonsterImage || false
      };
    });
  };

  try {
    const db = getDb();
    const monstersRef = collection(db, 'artifacts', appId, 'public', 'data', 'monsters');

    const snapshot = await getDocs(monstersRef);
    const monsters = buildMonsters(snapshot);
    console.log(`✓ 加載 ${monsters.length} 隻怪物（不含圖片欄位）`);
    return monsters;
  } catch (error) {
    console.error('✗ 加載怪物數據失敗:', error);
    throw error;
  }
}

export async function getMonstersMeta(appId = APP_ID) {
  try {
    const db = getDb();
    const metaRef = doc(db, 'artifacts', appId, 'public', 'data', 'monstersMeta', 'current');
    const metaSnap = await getDoc(metaRef);
    return metaSnap.exists() ? metaSnap.data() : null;
  } catch (error) {
    console.error('✗ 讀取怪物版本元數據失敗:', error);
    return null;
  }
}

export async function touchMonstersMeta(appId = APP_ID) {
  try {
    const db = getDb();
    const metaRef = doc(db, 'artifacts', appId, 'public', 'data', 'monstersMeta', 'current');
    const now = Timestamp.now();
    await setDoc(metaRef, {
      updatedAt: now,
      dataVersion: now.toMillis()
    }, { merge: true });
    console.log('✓ monstersMeta 版本已更新');
  } catch (error) {
    console.error('✗ 更新 monstersMeta 版本失敗:', error);
  }
}


export async function getMonsterImageDataById(monsterId, appId = APP_ID) {
  try {
    const db = getDb();
    
    // 從根文檔讀取 flags
    const monsterDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'monsters', monsterId);
    const monsterSnap = await getDoc(monsterDocRef);
    if (!monsterSnap.exists()) {
      console.warn(`⚠ 怪物 ${monsterId} 不存在`);
      return null;
    }
    const monsterData = monsterSnap.data();

    let mapImageData = null;
    let mapImageUpdatedAt = null;
    let monsterImageData = null;
    let monsterImageUpdatedAt = null;

    // 讀取地圖圖片（mapPhoto/current）
    try {
      const mapPhotoRef = doc(db, 'artifacts', appId, 'public', 'data', 'monsters', monsterId, 'mapPhoto', 'current');
      const mapPhotoSnap = await getDoc(mapPhotoRef);
      if (mapPhotoSnap.exists()) {
        const mapPhotoData = mapPhotoSnap.data();
        mapImageData = mapPhotoData.imageData || null;
        mapImageUpdatedAt = mapPhotoData.imageUpdatedAt ? (mapPhotoData.imageUpdatedAt.toDate ? mapPhotoData.imageUpdatedAt.toDate() : new Date(mapPhotoData.imageUpdatedAt)) : null;
      }
    } catch (err) {
      console.warn(`[讀取圖片] 無法讀取地圖圖片:`, err);
    }

    // 讀取怪物照片（monsterPhoto/current）
    try {
      const monsterPhotoRef = doc(db, 'artifacts', appId, 'public', 'data', 'monsters', monsterId, 'monsterPhoto', 'current');
      const monsterPhotoSnap = await getDoc(monsterPhotoRef);
      if (monsterPhotoSnap.exists()) {
        const monsterPhotoData = monsterPhotoSnap.data();
        monsterImageData = monsterPhotoData.imageData || null;
        monsterImageUpdatedAt = monsterPhotoData.imageUpdatedAt ? (monsterPhotoData.imageUpdatedAt.toDate ? monsterPhotoData.imageUpdatedAt.toDate() : new Date(monsterPhotoData.imageUpdatedAt)) : null;
      }
    } catch (err) {
      console.warn(`[讀取圖片] 無法讀取怪物照片:`, err);
    }

    // 如果有任何圖片數據，就返回
    if (mapImageData || monsterImageData) {
      return {
        mapImageData: mapImageData,
        mapImageUpdatedAt: mapImageUpdatedAt,
        monsterImageData: monsterImageData,
        monsterImageUpdatedAt: monsterImageUpdatedAt,
        hasMap: Boolean(monsterData.hasMap),
        hasMonsterImage: Boolean(monsterData.hasMonsterImage)
      };
    }

    return null;
  } catch (error) {
    console.error(`✗ 讀取怪物 ${monsterId} 圖片失敗:`, error);
    return null;
  }
}

/**
 * 實時監聽怪物數據變化
 */
export function watchMonsters(appId = APP_ID, callback) {
  try {
    const db = getDb();
    console.log('watchMonsters 被調用，appId:', appId);
    
    const monstersRef = collection(db, 'artifacts', appId, 'public', 'data', 'monsters');
    console.log('Collection reference created');

    const unsubscribe = onSnapshot(monstersRef, (snapshot) => {
      console.log('onSnapshot triggered, docs count:', snapshot.docs.length);
      const monsters = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          rank: "None",
          ...data,
          mapImageData: null,
          monsterImageData: null,
          hasMap: data.hasMap || false,
          hasMonsterImage: data.hasMonsterImage || false
        };
      });
      console.log('Monsters mapped:', monsters.length);
      callback(monsters);
    }, (error) => {
      console.error('onSnapshot error:', error);
    });

    console.log("✓ 開始監聽怪物數據");
    return unsubscribe;
  } catch (error) {
    console.error("✗ 監聽怪物數據失敗:", error);
    throw error;
  }
}

/**
 * 根據名稱搜尋怪物
 */
export async function searchMonsterByName(name, appId = APP_ID) {
  try {
    const db = getDb();
    
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'monsters'), where("name", "==", name));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`✗ 搜尋怪物 [${name}] 失敗:`, error);
    throw error;
  }
}

/**
 * 新增怪物
 */
export async function addMonster(monsterData, appId = APP_ID) {
  try {
    console.log(`[新增怪物] 開始新增 ${monsterData.name}`);
    const db = getDb();
    const id = `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = Timestamp.now();

    // 分離圖片數據
    const { mapImageData, monsterImageData, ...restData } = monsterData;

    // 保存怪物基礎數據（不含圖片）
    console.log(`[新增怪物] 保存根文檔, hasMap=${!!mapImageData}, hasMonsterImage=${!!monsterImageData}`);
    const locationMaps = Array.isArray(monsterData.locations)
      ? Array.from(new Set(monsterData.locations.map(loc => loc.map).filter(Boolean)))
      : [];

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'monsters', id), {
      id,
      ...restData,
      locationMaps,
      hasMap: !!mapImageData,
      hasMonsterImage: !!monsterImageData,
      mapImageUpdatedAt: monsterData.mapImageUpdatedAt || (mapImageData ? now.toDate() : null),
      monsterImageUpdatedAt: monsterData.monsterImageUpdatedAt || (monsterImageData ? now.toDate() : null),
      createdAt: now,
      updatedAt: now
    });
    console.log(`[新增怪物] ✓ 根文檔已保存, ID=${id}`);

    // 地圖圖片獨立存到 mapPhoto/current
    if (mapImageData) {
      const finalMapImageData = await ensureImageDataWithinLimit(mapImageData);
      console.log(`[新增怪物] 保存地圖圖片到 mapPhoto/current, 原始=${(mapImageData.length / 1024).toFixed(2)}KB, 最終=${(finalMapImageData.length / 1024).toFixed(2)}KB`);
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'monsters', id, 'mapPhoto', 'current'),
        {
          imageData: finalMapImageData,
          updatedAt: now,
          imageUpdatedAt: monsterData.mapImageUpdatedAt ? (monsterData.mapImageUpdatedAt.toDate ? monsterData.mapImageUpdatedAt.toDate() : new Date(monsterData.mapImageUpdatedAt)) : now.toDate()
        }
      );
      console.log(`[新增怪物] ✓ 地圖圖片已保存`);
    }

    // 怪物照片獨立存到 monsterPhoto/current
    if (monsterImageData) {
      const finalMonsterImageData = await ensureImageDataWithinLimit(monsterImageData);
      console.log(`[新增怪物] 保存怪物照片到 monsterPhoto/current, 原始=${(monsterImageData.length / 1024).toFixed(2)}KB, 最終=${(finalMonsterImageData.length / 1024).toFixed(2)}KB`);
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'monsters', id, 'monsterPhoto', 'current'),
        {
          imageData: finalMonsterImageData,
          updatedAt: now,
          imageUpdatedAt: monsterData.monsterImageUpdatedAt ? (monsterData.monsterImageUpdatedAt.toDate ? monsterData.monsterImageUpdatedAt.toDate() : new Date(monsterData.monsterImageUpdatedAt)) : now.toDate()
        }
      );
      console.log(`[新增怪物] ✓ 怪物照片已保存`);
    }

    console.log(`✓ 成功新增怪物: ${monsterData.name}`);
    await touchMonstersMeta(appId);
    return id;
  } catch (error) {
    console.error("✗ 新增怪物失敗:", error);
    throw error;
  }
}

/**
 * 更新怪物
 */
export async function updateMonster(monsterId, updates, appId = APP_ID) {
  try {
    console.log(`[更新怪物] 開始更新 ${monsterId}`)
    const db = getDb();

    // 分離圖片數據
    const { mapImageData, monsterImageData, ...restUpdates } = updates;
    const now = Timestamp.now();

    // 更新怪物基礎數據（不含圖片）
    const monsterDocUpdates = {
      ...restUpdates,
      updatedAt: now
    };

    if (updates.locations !== undefined) {
      const locationMaps = Array.isArray(updates.locations)
        ? Array.from(new Set(updates.locations.map(loc => loc.map).filter(Boolean)))
        : [];
      monsterDocUpdates.locationMaps = locationMaps;
    }

    if (mapImageData !== undefined) {
      monsterDocUpdates.hasMap = !!mapImageData;
      monsterDocUpdates.mapImageData = deleteField();
      monsterDocUpdates.mapImageUpdatedAt = mapImageData ? (updates.mapImageUpdatedAt ? (updates.mapImageUpdatedAt.toDate ? updates.mapImageUpdatedAt.toDate() : new Date(updates.mapImageUpdatedAt)) : now.toDate()) : null;
    }

    if (monsterImageData !== undefined) {
      console.log(`[更新怪物] 處理 monsterImageData: 有數據=${!!monsterImageData}`)
      monsterDocUpdates.hasMonsterImage = !!monsterImageData;
      monsterDocUpdates.monsterImageData = deleteField();
      monsterDocUpdates.monsterImageUpdatedAt = monsterImageData ? (updates.monsterImageUpdatedAt ? (updates.monsterImageUpdatedAt.toDate ? updates.monsterImageUpdatedAt.toDate() : new Date(updates.monsterImageUpdatedAt)) : now.toDate()) : null;
    }

    console.log(`[更新怪物] 更新根文檔`)
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'monsters', monsterId), monsterDocUpdates);
    console.log(`[更新怪物] ✓ 根文檔已更新`);

    // 分別處理地圖圖片（mapPhoto/current）
    if (mapImageData !== undefined) {
      const mapPhotoRef = doc(db, 'artifacts', appId, 'public', 'data', 'monsters', monsterId, 'mapPhoto', 'current');
      if (mapImageData === '' || mapImageData === null) {
        // 刪除地圖圖片
        try {
          console.log(`[更新怪物] 刪除地圖圖片`);
          await deleteDoc(mapPhotoRef);
          console.log(`[更新怪物] ✓ 地圖圖片已刪除`);
        } catch (err) {
          if (err.code !== 'not-found') {
            console.warn(`⚠ 刪除地圖圖片時出錯:`, err);
          }
        }
      } else {
        // 保存地圖圖片
        const finalMapImageData = await ensureImageDataWithinLimit(mapImageData);
        console.log(`[更新怪物] 保存地圖圖片到 mapPhoto/current, 原始=${(mapImageData.length / 1024).toFixed(2)}KB, 最終=${(finalMapImageData.length / 1024).toFixed(2)}KB`);
        await setDoc(mapPhotoRef, {
          imageData: finalMapImageData,
          updatedAt: now,
          imageUpdatedAt: updates.mapImageUpdatedAt ? (updates.mapImageUpdatedAt.toDate ? updates.mapImageUpdatedAt.toDate() : new Date(updates.mapImageUpdatedAt)) : now.toDate()
        });
        console.log(`[更新怪物] ✓ 地圖圖片已保存`);
      }
    }

    // 分別處理怪物照片（monsterPhoto/current）
    if (monsterImageData !== undefined) {
      const monsterPhotoRef = doc(db, 'artifacts', appId, 'public', 'data', 'monsters', monsterId, 'monsterPhoto', 'current');
      if (monsterImageData === '' || monsterImageData === null) {
        // 刪除怪物照片
        try {
          console.log(`[更新怪物] 刪除怪物照片`);
          await deleteDoc(monsterPhotoRef);
          console.log(`[更新怪物] ✓ 怪物照片已刪除`);
        } catch (err) {
          if (err.code !== 'not-found') {
            console.warn(`⚠ 刪除怪物照片時出錯:`, err);
          }
        }
      } else {
        // 保存怪物照片
        const finalMonsterImageData = await ensureImageDataWithinLimit(monsterImageData);
        console.log(`[更新怪物] 保存怪物照片到 monsterPhoto/current, 原始=${(monsterImageData.length / 1024).toFixed(2)}KB, 最終=${(finalMonsterImageData.length / 1024).toFixed(2)}KB`);
        await setDoc(monsterPhotoRef, {
          imageData: finalMonsterImageData,
          updatedAt: now,
          imageUpdatedAt: updates.monsterImageUpdatedAt ? (updates.monsterImageUpdatedAt.toDate ? updates.monsterImageUpdatedAt.toDate() : new Date(updates.monsterImageUpdatedAt)) : now.toDate()
        });
        console.log(`[更新怪物] ✓ 怪物照片已保存`);
      }
    }

    // 刪除舊格式的圖片資料（若存在）
    if (mapImageData !== undefined || monsterImageData !== undefined) {
      try {
        const oldImagesDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'monsters', monsterId, 'images', 'current');
        console.log(`[更新怪物] 嘗試刪除舊格式圖片資料 (images/current)`);
        await deleteDoc(oldImagesDocRef);
        console.log(`[更新怪物] ✓ 舊格式圖片資料已刪除`);
      } catch (err) {
        if (err.code !== 'not-found') {
          console.warn(`⚠ 刪除舊格式圖片資料時出錯:`, err);
        } else {
          console.log(`[更新怪物] 舊格式圖片資料不存在，無需刪除`);
        }
      }
    }

    console.log(`✓ 成功更新怪物: ${monsterId}`);
    await touchMonstersMeta(appId);
  } catch (error) {
    console.error("✗ 更新怪物失敗:", error);
    throw error;
  }
}

/**
 * 刪除怪物
 */
export async function deleteMonster(monsterId, appId = APP_ID) {
  try {
    const db = getDb();
    
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'monsters', monsterId));
    await touchMonstersMeta(appId);
    console.log(`✓ 成功刪除怪物: ${monsterId}`);
  } catch (error) {
    console.error("✗ 刪除怪物失敗:", error);
    throw error;
  }
}

/**
 * 獲取用戶的收藏
 */
export async function getUserPins(userId, appId = APP_ID) {
  try {
    const db = getDb();
    const snapshot = await getDocs(collection(db, 'artifacts', appId, 'users', userId, 'pins'));
    
    const pins = {};
    snapshot.docs.forEach(doc => {
      pins[doc.id] = doc.data().groupId;
    });

    return pins;
  } catch (error) {
    console.error("✗ 加載用戶收藏失敗:", error);
    throw error;
  }
}

/**
 * 實時監聽用戶收藏
 */
export function watchUserPins(userId, appId = APP_ID, callback) {
  try {
    const db = getDb();
    
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'users', userId, 'pins'), (snapshot) => {
      const pins = {};
      snapshot.docs.forEach(doc => {
        pins[doc.id] = doc.data().groupId;
      });
      callback(pins);
    });

    return unsubscribe;
  } catch (error) {
    console.error("✗ 監聽用戶收藏失敗:", error);
    throw error;
  }
}

/**
 * 添加收藏
 */
export async function addPin(monsterId, groupId, userId, appId = APP_ID) {
  try {
    const db = getDb();
    
    await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'pins', monsterId), {
      groupId,
      updatedAt: Timestamp.now()
    });

    console.log(`✓ 成功收藏怪物: ${monsterId}`);
  } catch (error) {
    console.error("✗ 添加收藏失敗:", error);
    throw error;
  }
}

/**
 * 移除收藏
 */
export async function removePin(monsterId, userId, appId = APP_ID) {
  try {
    const db = getDb();
    
    await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'pins', monsterId));
    console.log(`✓ 成功取消收藏: ${monsterId}`);
  } catch (error) {
    console.error("✗ 移除收藏失敗:", error);
    throw error;
  }
}

/**
 * 獲取用戶的分組
 */
export async function getUserGroups(userId, appId = APP_ID) {
  try {
    const db = getDb();
    const snapshot = await getDocs(collection(db, 'artifacts', appId, 'users', userId, 'groups'));
    
    const groups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 按 order 排序
    groups.sort((a, b) => (a.order || 0) - (b.order || 0));

    return groups;
  } catch (error) {
    console.error("✗ 加載用戶分組失敗:", error);
    throw error;
  }
}

/**
 * 實時監聽用戶分組
 */
export function watchUserGroups(userId, appId = APP_ID, callback) {
  try {
    const db = getDb();
    
    const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'users', userId, 'groups'), (snapshot) => {
      const groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      groups.sort((a, b) => (a.order || 0) - (b.order || 0));
      callback(groups);
    });

    return unsubscribe;
  } catch (error) {
    console.error("✗ 監聽用戶分組失敗:", error);
    throw error;
  }
}

/**
 * 建立默認分組
 */
export async function createDefaultGroup(userId, appId = APP_ID) {
  try {
    const db = getDb();
    const groupId = "default";
    
    await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'groups', groupId), {
      name: "常用區域",
      order: 0,
      canDelete: false,
      createdAt: Timestamp.now()
    });

    console.log("✓ 成功建立默認分組");
    return groupId;
  } catch (error) {
    console.error("✗ 建立默認分組失敗:", error);
    throw error;
  }
}

/**
 * 新增分組
 */
export async function addGroup(groupName, userId, appId = APP_ID) {
  try {
    const db = getDb();
    const groupId = `g_${Date.now()}`;
    
    // 先獲取現有分組數量
    const groups = await getUserGroups(userId, appId);
    
    await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'groups', groupId), {
      name: groupName,
      order: groups.length,
      canDelete: true,
      createdAt: Timestamp.now()
    });

    console.log(`✓ 成功新增分組: ${groupName}`);
    return groupId;
  } catch (error) {
    console.error("✗ 新增分組失敗:", error);
    throw error;
  }
}

/**
 * 更新分組
 */
export async function updateGroup(groupId, updates, userId, appId = APP_ID) {
  try {
    const db = getDb();
    
    await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'groups', groupId), updates);
    console.log(`✓ 成功更新分組: ${groupId}`);
  } catch (error) {
    console.error("✗ 更新分組失敗:", error);
    throw error;
  }
}

/**
 * 刪除分組
 */
export async function deleteGroup(groupId, userId, appId = APP_ID) {
  try {
    const db = getDb();
    
    await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'groups', groupId));
    console.log(`✓ 成功刪除分組: ${groupId}`);
  } catch (error) {
    console.error("✗ 刪除分組失敗:", error);
    throw error;
  }
}

/**
 * 從 Firestore 同步遊戲數據 (版本、地圖、職業等)
 * 這允許在後台更新遊戲數據而無需重新部署
 */
export async function syncGameMetadata(appId = APP_ID) {
  try {
    const db = getDb();
    const metadataDoc = await getDoc(doc(db, 'artifacts', appId, 'public', 'metadata', 'gamedata'));
    
    if (metadataDoc.exists()) {
      console.log("✓ 成功同步遊戲元數據");
      return metadataDoc.data();
    }
    
    console.log("⚠ 遊戲元數據不存在，使用本地數據");
    return null;
  } catch (error) {
    console.error("✗ 同步遊戲元數據失敗:", error);
    return null;
  }
}

export default {
  getAllMonsters,
  watchMonsters,
  searchMonsterByName,
  addMonster,
  updateMonster,
  deleteMonster,
  getUserPins,
  watchUserPins,
  addPin,
  removePin,
  getUserGroups,
  watchUserGroups,
  createDefaultGroup,
  addGroup,
  updateGroup,
  deleteGroup,
  syncGameMetadata
};
