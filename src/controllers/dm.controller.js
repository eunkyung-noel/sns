const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.sendDM = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiverId, content } = req.body;

        const sender = await prisma.user.findUnique({ where: { id: senderId } });
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

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

        // 연령대 계산 (10/20/30/40대)
        const senderGroup = Math.floor(sender.age / 10) * 10;
        const receiverGroup = Math.floor(receiver.age / 10) * 10;

        //  Follow 모델 아직 없으므로 임시 처리
        if (senderGroup !== receiverGroup) {
            return res.status(403).json({
                message: '같은 연령대만 DM 가능 (맞팔 기능 미구현)'
            });
        }

        const dm = await prisma.dm.create({
            data: { senderId, receiverId, content }
        });

        res.json({ message: 'DM 전송 성공', dm });
    } catch (err) {
        res.status(500).json({ message: 'DM 실패', error: err.message });
    }
};
