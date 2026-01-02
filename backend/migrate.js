const { MongoClient } = require('mongodb');
const { PrismaClient } = require('@prisma/client');

const mongoUrl = 'mongodb+srv://admin:noel0214@cluster0.yvftcvs.mongodb.net/safe-sns?retryWrites=true&w=majority';
const prisma = new PrismaClient();

async function main() {
    let client;
    try {
        client = await MongoClient.connect(mongoUrl);
        const db = client.db('safe-sns');
        console.log('🚀 데이터 이전을 시작합니다 (참조 무결성 검사 포함)...');

        // 1. User 이전
        const users = await db.collection('users').find().toArray();
        const userIds = new Set();
        for (const user of users) {
            const idStr = user._id.toString();
            await prisma.user.upsert({
                where: { email: user.email },
                update: {},
                create: {
                    id: idStr,
                    email: user.email,
                    password: user.password,
                    name: user.name || null,
                    nickname: user.nickname || null,
                    birthDate: user.birthDate ? new Date(user.birthDate) : new Date(),
                    age: user.age || 0,
                    createdAt: user.createdAt || new Date()
                }
            });
            userIds.add(idStr);
        }
        console.log(`✅ User ${users.length}명 이전 완료`);

        // 2. Post 이전
        const posts = await db.collection('posts').find().toArray();
        let postCount = 0;
        for (const post of posts) {
            const authorIdStr = post.authorId ? post.authorId.toString() : null;
            if (!authorIdStr || !userIds.has(authorIdStr)) {
                console.warn(`⚠️ 게시물 ${post._id}: 존재하지 않는 유저(${authorIdStr})를 참조하여 제외함.`);
                continue;
            }
            await prisma.post.create({
                data: {
                    id: post._id.toString(),
                    content: post.content || "",
                    imageUrl: post.imageUrl || null,
                    isSafe: post.isSafe ?? true,
                    isSafeContent: post.isSafeContent ?? true,
                    createdAt: post.createdAt || new Date(),
                    updatedAt: post.updatedAt || new Date(),
                    views: post.views || 0,
                    likes: post.likes || [],
                    authorId: authorIdStr
                }
            });
            postCount++;
        }
        console.log(`✅ Post ${postCount}개 이전 완료`);

        // 3. Message 이전
        const messages = await db.collection('messages').find().toArray();
        let msgCount = 0;
        for (const msg of messages) {
            const sId = msg.senderId ? msg.senderId.toString() : null;
            const rId = msg.receiverId ? msg.receiverId.toString() : null;

            if (!sId || !rId || !userIds.has(sId) || !userIds.has(rId)) {
                console.warn(`⚠️ 메시지 ${msg._id}: 존재하지 않는 발신/수신자 참조로 제외함.`);
                continue;
            }

            await prisma.message.create({
                data: {
                    id: msg._id.toString(),
                    content: msg.content || "",
                    createdAt: msg.createdAt || new Date(),
                    isRead: msg.isRead ?? false,
                    senderId: sId,
                    receiverId: rId
                }
            });
            msgCount++;
        }
        console.log(`✅ Message ${msgCount}개 이전 완료`);

        console.log('✨ 마이그레이션이 완료되었습니다. (유효하지 않은 참조 데이터는 제외됨)');
    } catch (e) {
        console.error('❌ 에러 발생:', e);
    } finally {
        if (client) await client.close();
        await prisma.$disconnect();
    }
}

main();