const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// DM 전송 (상호 팔로우 조건 검사)
exports.sendDM = async (req, res) => {
    const senderId = req.user.userId;
    const receiverId = parseInt(req.params.userId);
    const { content } = req.body;

    if (isNaN(receiverId) || !content) {
        return res.status(400).json({ message: '수신자 ID와 내용을 모두 입력해야 합니다.' });
    }

    try {
        const isFollowing = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: senderId, followingId: receiverId } },
        });
        const isFollowed = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: receiverId, followingId: senderId } },
        });

        if (!isFollowing || !isFollowed) {
            return res.status(403).json({ message: 'DM을 보내려면 상호 팔로우 상태여야 합니다.' });
        }

        const newMessage = await prisma.message.create({
            data: { senderId, receiverId, content },
        });

        res.status(201).json({ message: 'DM이 성공적으로 전송되었습니다.', dm: newMessage });
    } catch (error) {
        res.status(500).json({ message: 'DM 처리 중 서버 오류가 발생했습니다.' });
    }
};

// DM 대화 목록 조회
exports.getDMs = async (req, res) => {
    const userId = req.user.userId;
    const partnerId = parseInt(req.params.userId);

    if (isNaN(partnerId)) {
        return res.status(400).json({ message: '유효하지 않은 상대방 ID입니다.' });
    }

    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: partnerId },
                    { senderId: partnerId, receiverId: userId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });

        res.status(200).json({ messages });
    } catch (error) {
        res.status(500).json({ message: 'DM 조회 중 서버 오류가 발생했습니다.' });
    }
};