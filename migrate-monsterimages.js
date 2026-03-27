/**
 * 迁移脚本：把 monsters 集合中的 mapImageData 迁移到独立的 monsterImages 子集合
 * 使用方法：
 * 1. 从 Firebase 控制台下载服务账号 JSON，放在项目根目录，命名为 serviceAccountKey.json
 * 2. 运行: node migrate-monsterimages.js
 */

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateMonsterImages() {
  console.log('🔄 开始迁移 mapImageData 到 monsterImages 子集合...');
  
  const APP_ID = 'ff14-hunt'; // 根据你的 APP_ID 修改
  
  try {
    const monstersRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('monsters');
    const snapshot = await monstersRef.get();
    
    if (snapshot.empty) {
      console.log('⚠️  没有找到 monsters 集合');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const mDoc of snapshot.docs) {
      const monsterData = mDoc.data();
      
      // 检查是否有 mapImageData 或 mapImageUrl
      if (monsterData.mapImageData || monsterData.mapImageUrl) {
        try {
          // 写入 monsterImages 子集合
          const monsterImagesRef = monstersRef.doc(mDoc.id).collection('images').doc('current');
          await monsterImagesRef.set({
            mapImageData: monsterData.mapImageData || null,
            mapImageUrl: monsterData.mapImageUrl || null,
            migratedAt: admin.firestore.Timestamp.now()
          });
          
          migratedCount++;
          
          if (migratedCount % 10 === 0) {
            console.log(`📝 已迁移 ${migratedCount} 个...`);
          }
        } catch (error) {
          console.error(`❌ 迁移 ${mDoc.id} 失败:`, error);
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\n✅ 迁移完成！`);
    console.log(`   - 迁移: ${migratedCount} 个`);
    console.log(`   - 跳过: ${skippedCount} 个（无地图数据）`);
    console.log(`\n下一步：运行 delete-old-mapimages.js 删除 monsters 中的旧 mapImageData 字段`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

migrateMonsterImages();
