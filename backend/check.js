const { MongoClient } = require('mongodb');
const mongoUrl = 'mongodb+srv://admin:noel0214@cluster0.yvftcvs.mongodb.net/?retryWrites=true&w=majority';

async function main() {
    const client = await MongoClient.connect(mongoUrl);

    // 1. 전체 DB 목록 확인
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log('--- 사용 가능한 DB 목록 ---');
    dbs.databases.forEach(db => console.log(`DB 이름: ${db.name}`));

    // 2. 현재 safe-sns 내부의 컬렉션 확인
    const db = client.db('safe-sns');
    const collections = await db.listCollections().toArray();
    console.log('\n--- safe-sns 내부 컬렉션 및 데이터 수 ---');
    for (let col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`컬렉션: ${col.name} (데이터: ${count}개)`);
    }

    await client.close();
}
main();