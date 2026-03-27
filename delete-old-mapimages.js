/**
 * 删除脚本：删除 monsters 集合中的旧 mapImageData 字段（迁移后执行）
 * 运行: node delete-old-mapimages.js
 */

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteOldMapImages() {
  console.log('🗑️  开始删除 monsters 中的旧 mapImageData 字段...');
  
  const APP_ID = 'ff14-hunt'; // 根据你的 APP_ID 修改
  
  try {
    const batch = db.batch();
    const monstersRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('monsters');
    
    const snapshot = await monstersRef.get();
    
    if (snapshot.empty) {
      console.log('⚠️  没有找到 monsters 集合');
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
    
    console.log(`📝 准备删除 ${deleteCount} 个文档中的 mapImageData/mapImageUrl 字段...`);
    
    if (deleteCount > 0) {
      await batch.commit();
      console.log(`✅ 成功删除！`);
      console.log(`\n✨ 迁移完成！现在：`);
      console.log(`   - monsters 集合轻量化，加载秒速`);
      console.log(`   - 地图数据存在 monsterImages 子集合`);
      console.log(`   - 点地图才会下载图片`);
    } else {
      console.log('ℹ️  没有找到需要删除的字段');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 删除失败:', error);
    process.exit(1);
  }
}

deleteOldMapImages();
