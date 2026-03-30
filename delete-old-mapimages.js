/**
 * 刪除腳本：刪除 monsters 集合中的舊 mapImageData 欄位（遷移後執行）
 * 執行: node delete-old-mapimages.js
 */

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteOldMapImages() {
  console.log('🗑️  開始刪除 monsters 中的舊 mapImageData 欄位...');
  
  const APP_ID = 'ff14-hunt'; // 根據你的 APP_ID 修改
  
  try {
    const batch = db.batch();
    const monstersRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('monsters');
    
    const snapshot = await monstersRef.get();
    
    if (snapshot.empty) {
      console.log('⚠️  沒有找到 monsters 集合');
      return;
    }
    
    let deleteCount = 0;
    
    snapshot.forEach(doc => {
      if (doc.data().mapImageData || doc.data().mapImageUrl) {
        batch.update(monstersRef.doc(doc.id), {
          mapImageData: admin.firestore.FieldValue.delete(),
          mapImageUrl: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.Timestamp.now()
        });
        deleteCount++;
      }
    });
    
    console.log(`📝 準備刪除 ${deleteCount} 個文件中的 mapImageData/mapImageUrl 欄位...`);
    
    if (deleteCount > 0) {
      await batch.commit();
      console.log(`✅ 成功刪除！`);
      console.log(`\n✨ 遷移完成！現在：`);
      console.log(`   - monsters 集合輕量化，載入即時`);
      console.log(`   - 地圖資料存在 monsterImages 子集合`);
      console.log(`   - 點擊地圖才會下載圖片`);
    } else {
      console.log('ℹ️  沒有找到需要刪除的欄位');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 刪除失敗:', error);
    process.exit(1);
  }
}

deleteOldMapImages();
