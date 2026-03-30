/**
 * 遷移腳本：把 monsters 集合中的 mapImageData 遷移到獨立的 monsterImages 子集合
 * 使用方法：
 * 1. 從 Firebase 控制台下載服務帳號 JSON，放在專案根目錄，命名為 serviceAccountKey.json
 * 2. 執行: node migrate-monsterimages.js
 */

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateMonsterImages() {
  console.log('🔄 開始遷移 mapImageData 到 monsterImages 子集合...');
  
  const APP_ID = 'ff14-hunt'; // 根據你的 APP_ID 修改
  
  try {
    const monstersRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('monsters');
    const snapshot = await monstersRef.get();
    
    if (snapshot.empty) {
      console.log('⚠️  沒有找到 monsters 集合');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const mDoc of snapshot.docs) {
      const monsterData = mDoc.data();
      
      //檢查是否有 mapImageData 或 mapImageUrl
      if (monsterData.mapImageData || monsterData.mapImageUrl) {
        try {
          // 寫入 monsterImages 子集合
          const monsterImagesRef = monstersRef.doc(mDoc.id).collection('images').doc('current');
          await monsterImagesRef.set({
            mapImageData: monsterData.mapImageData || null,
            mapImageUrl: monsterData.mapImageUrl || null,
            migratedAt: admin.firestore.Timestamp.now()
          });
          
          migratedCount++;
          
          if (migratedCount % 10 === 0) {
            console.log(`📝 已遷移 ${migratedCount} 個...`);
          }
        } catch (error) {
          console.error(`❌ 遷移 ${mDoc.id} 失敗:`, error);
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\n✅ 遷移完成！`);
    console.log(`   - 遷移: ${migratedCount} 個`);
    console.log(`   - 跳過: ${skippedCount} 個（無地圖資料）`);
    console.log(`\n下一步：執行 delete-old-mapimages.js 刪除 monsters 中的舊 mapImageData 欄位`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 遷移失敗:', error);
    process.exit(1);
  }
}

migrateMonsterImages();
