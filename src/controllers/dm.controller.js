const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// DM 전송
exports.sendDM = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiverId, content } = req.body;

        const sender = await prisma.user.findUnique({
            where: { id: senderId }
        });

        const receiver = await prisma.user.findUnique({
            where: { id: receiverId }
        });

        if (!receiver) {
            return res.status(404).json({ message: '상대방 없음' });
        }

        // 미성년자 ↔ 성인 DM 차단
        const senderIsMinor = sender.age < 19;
        const receiverIsMinor = receiver.age < 19;

        if (senderIsMinor !== receiverIsMinor) {
            return res.status(403).json({
                message: '미성년자와 성인은 DM 불가'
            });
        }

        // 연령대 계산 (10 / 20 / 30 / 40)
        const senderAgeGroup = Math.floor(sender.age / 10) * 10;
        const receiverAgeGroup = Math.floor(receiver.age / 10) * 10;

        // 맞팔 확인
        const followAB = await prisma.follow.findFirst({
            where: {
                followerId: senderId,
                followingId: receiverId
            }
        });

        const followBA = await prisma.follow.findFirst({
            where: {
                followerId: receiverId,
                followingId: senderId
            }
        });

        const isMutualFollow = followAB && followBA;

        if (senderAgeGroup !== receiverAgeGroup && !isMutualFollow) {
            return res.status(403).json({
                message: '같은 연령대이거나 맞팔만 DM 가능'
            });
        }

        const dm = await prisma.dm.create({
            data: {
                senderId,
                receiverId,
                content
            }
        });

        res.json({ message: 'DM 전송 성공', dm });
    } catch (err) {
        res.status(500).json({
            message: 'DM 실패',
            error: err.message
        });
    }
};
