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
  onSnapshot,
  Timestamp
} from "firebase/firestore";
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
 * 獲取所有怪物數據
 */
export async function getAllMonsters(appId = APP_ID) {
  const buildMonsters = (snapshot) => {
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        rank: 'None',
        ...data,
        mapImageData: null,
        hasMap: data.hasMap || false
      };
    });
  };

  try {
    const db = getDb();
    const monstersRef = collection(db, 'artifacts', appId, 'public', 'data', 'monsters');

    const snapshot = await getDocs(monstersRef);
    const monsters = buildMonsters(snapshot);
    console.log(`✓ 加載 ${monsters.length} 隻怪物（不含地圖圖片欄位）`);
    return monsters;
  } catch (error) {
    console.error('✗ 加載怪物數據失敗:', error);
    throw error;
  }
}


export async function getMonsterImageDataById(monsterId, appId = APP_ID) {
  try {
    const db = getDb();
    // 從獨立的 monsterImages 子集合查詢
    const imageDocRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'monsters',
      monsterId,
      'images',
      'current'
    );
    const imageSnap = await getDoc(imageDocRef);
    
    if (!imageSnap.exists()) {
      // 如果子集合沒有資料，就嘗試從主 monster 文檔讀取 (兼容舊版) 
      const monsterDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'monsters', monsterId);
      const monsterSnap = await getDoc(monsterDocRef);
      if (monsterSnap.exists()) {
        const monsterData = monsterSnap.data();
        if (monsterData.mapImageData || monsterData.monsterImageData) {
          return {
            mapImageData: monsterData.mapImageData || null,
            mapImageUpdatedAt: monsterData.mapImageUpdatedAt ? (monsterData.mapImageUpdatedAt.toDate ? monsterData.mapImageUpdatedAt.toDate() : new Date(monsterData.mapImageUpdatedAt)) : (monsterData.updatedAt ? (monsterData.updatedAt.toDate ? monsterData.updatedAt.toDate() : new Date(monsterData.updatedAt)) : null),
            monsterImageData: monsterData.monsterImageData || null,
            monsterImageUpdatedAt: monsterData.monsterImageUpdatedAt ? (monsterData.monsterImageUpdatedAt.toDate ? monsterData.monsterImageUpdatedAt.toDate() : new Date(monsterData.monsterImageUpdatedAt)) : null,
            hasMap: !!monsterData.mapImageData,
            hasMonsterImage: !!monsterData.monsterImageData
          };
        }
      }

      console.warn(`⚠ 怪物 ${monsterId} 無地圖資料`);
      return null;
    }

    const data = imageSnap.data();
    return {
      mapImageData: data.mapImageData || null,
      mapImageUpdatedAt: data.mapImageUpdatedAt ? (data.mapImageUpdatedAt.toDate ? data.mapImageUpdatedAt.toDate() : new Date(data.mapImageUpdatedAt)) : (data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)) : null),
      monsterImageData: data.monsterImageData || null,
      monsterImageUpdatedAt: data.monsterImageUpdatedAt ? (data.monsterImageUpdatedAt.toDate ? data.monsterImageUpdatedAt.toDate() : new Date(data.monsterImageUpdatedAt)) : null,
      hasMap: true,
      hasMonsterImage: !!data.monsterImageData
    };
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
          hasMap: data.hasMap || false
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
    const db = getDb();
    const id = `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = Timestamp.now();

    // 分離地圖數據
    const { mapImageData, ...restData } = monsterData;

    // 保存怪物基礎數據（不含地圖）
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'monsters', id), {
      id,
      ...restData,
      hasMap: !!mapImageData,
      mapImageUpdatedAt: monsterData.mapImageUpdatedAt || (mapImageData ? now.toDate() : null),
      createdAt: now,
      updatedAt: now
    });

    // 如果有地圖數據，單獨保存到子集合
    if (mapImageData) {
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'monsters', id, 'images', 'current'),
        {
          mapImageData: mapImageData || null,
          updatedAt: monsterData.mapImageUpdatedAt ? (monsterData.mapImageUpdatedAt.toDate ? monsterData.mapImageUpdatedAt.toDate() : new Date(monsterData.mapImageUpdatedAt)) : now,
          mapImageUpdatedAt: monsterData.mapImageUpdatedAt ? (monsterData.mapImageUpdatedAt.toDate ? monsterData.mapImageUpdatedAt.toDate() : new Date(monsterData.mapImageUpdatedAt)) : now
        }
      );
    }

    console.log(`✓ 成功新增怪物: ${monsterData.name}`);
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
    const db = getDb();

    // 分離地圖數據
    const { mapImageData, ...restUpdates } = updates;

    // 更新怪物基礎數據（不含地圖）
    const monsterDocUpdates = {
      ...restUpdates,
      updatedAt: Timestamp.now()
    };

    if (mapImageData !== undefined) {
      // 當 mapImageData 明確傳入時，用它決定 hasMap
      monsterDocUpdates.hasMap = !!mapImageData;
      monsterDocUpdates.mapImageData = deleteField();
      monsterDocUpdates.mapImageUpdatedAt = mapImageData ? (updates.mapImageUpdatedAt ? (updates.mapImageUpdatedAt.toDate ? updates.mapImageUpdatedAt.toDate() : new Date(updates.mapImageUpdatedAt)) : Timestamp.now().toDate()) : null;
    }

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'monsters', monsterId), monsterDocUpdates);

    // 處理地圖數據子集合
    const imagesDocRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'monsters',
      monsterId,
      'images',
      'current'
    );

    if (mapImageData === '' || mapImageData === null) {
      try {
        await deleteDoc(imagesDocRef);
        console.log(`✓ 已刪除怪物 ${monsterId} 的地圖數據`);
      } catch (error) {
        if (error.code !== 'not-found') {
          console.warn(`⚠ 刪除地圖數據時出錯:`, error);
        }
      }
    } else if (mapImageData) {
      await setDoc(imagesDocRef, {
        mapImageData,
        updatedAt: Timestamp.now(),
        mapImageUpdatedAt: updates.mapImageUpdatedAt ? (updates.mapImageUpdatedAt.toDate ? updates.mapImageUpdatedAt.toDate() : new Date(updates.mapImageUpdatedAt)) : Timestamp.now().toDate()
      });
    } else {
      // mapImageData === undefined: 不動 images 子集合，保留現有
    }
    // 如果都沒有傳遞（undefined），則不動舊數據

    console.log(`✓ 成功更新怪物: ${monsterId}`);
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
