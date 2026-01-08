const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// [조건 1] 성인 여부 판별 (2026년 기준)
const checkIsAdult = (birthDate) => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age >= 19;
};

// 유저 검색
const searchUsers = async (req, res) => {
    try {
        const term = req.query.term || req.query.query;
        const myId = req.userId;
        if (!term) return res.json([]);
        const users = await prisma.user.findMany({
            where: {
                OR: [{ email: { contains: term } }, { nickname: { contains: term } }],
                NOT: { id: myId }
            },
            select: {
                id: true,
                nickname: true,
                email: true,
                birthDate: true,
                followers: { where: { followerId: myId } }
            }
        });
        res.json(users.map(user => ({
            id: user.id,
            nickname: user.nickname,
            email: user.email,
            isAdult: checkIsAdult(user.birthDate),
            isFollowing: user.followers.length > 0
        })));
    } catch (err) {
        res.status(500).json({ message: "검색 실패" });
    }
};

// 채팅방 목록 조회
const getChatList = async (req, res) => {
    try {
        const userId = req.userId;
        const messages = await prisma.message.findMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, nickname: true, birthDate: true, profilePic: true } },
                receiver: { select: { id: true, nickname: true, birthDate: true, profilePic: true } }
            }
        });
        const chatMap = new Map();
        messages.forEach((msg) => {
            const opponent = msg.senderId === userId ? msg.receiver : msg.sender;
            if (opponent && !chatMap.has(opponent.id)) {
                chatMap.set(opponent.id, {
                    opponent: {
                        id: opponent.id,
                        nickname: opponent.nickname,
                        profilePic: opponent.profilePic,
                        isAdult: checkIsAdult(opponent.birthDate)
                    },
                    lastMessage: msg.content,
                    isRead: msg.receiverId === userId ? msg.isRead : true,
                    createdAt: msg.createdAt
                });
            }
        });
        res.json(Array.from(chatMap.values()));
    } catch (err) {
        res.status(500).json({ message: '목록 조회 실패' });
    }
};

// 대화 내역 조회
const getMessagesWithUser = async (req, res) => {
    try {
        const myId = req.userId;
        const opponentId = req.params.userId;

        // 조회 시 즉시 읽음 처리
        await prisma.message.updateMany({
            where: { senderId: opponentId, receiverId: myId, isRead: false },
            data: { isRead: true }
        });

        const chatHistory = await prisma.message.findMany({
            where: { OR: [{ senderId: myId, receiverId: opponentId }, { senderId: opponentId, receiverId: myId }] },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, nickname: true, profilePic: true } } }
        });
        res.json(chatHistory);
    } catch (err) {
        res.status(500).json({ message: '조회 실패' });
    }
};

// 실시간 읽음 처리 (추가됨) 🌟
const markAsRead = async (req, res) => {
    try {
        const myId = req.userId;
        const opponentId = req.params.userId;

        await prisma.message.updateMany({
            where: {
                senderId: opponentId,
                receiverId: myId,
                isRead: false
            },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: "읽음 처리 실패" });
    }
};

// 메시지 전송
const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId;
        const receiverId = req.params.userId;
        const { content } = req.body;

        if (!content) return res.status(400).json({ message: "내용이 없습니다." });

        const [sender, receiver] = await Promise.all([
            prisma.user.findUnique({ where: { id: senderId } }),
            prisma.user.findUnique({ where: { id: receiverId } })
        ]);

        if (!sender || !receiver) return res.status(404).json({ message: "사용자 없음" });

        if (checkIsAdult(sender.birthDate) !== checkIsAdult(receiver.birthDate)) {
            const [f1, f2] = await Promise.all([
                prisma.follow.findUnique({ where: { followerId_followingId: { followerId: senderId, followingId: receiverId } } }),
                prisma.follow.findUnique({ where: { followerId_followingId: { followerId: receiverId, followingId: senderId } } })
            ]);
            if (!f1 || !f2) {
                return res.status(403).json({ message: '성인과 미성년자 간의 DM은 맞팔로우 시에만 가능합니다.' });
            }
        }

        const newMessage = await prisma.message.create({
            data: { content, senderId, receiverId, isRead: false },
            include: { sender: { select: { id: true, nickname: true, profilePic: true } } }
        });

        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json({ message: '전송 실패' });
    }
};

// 메시지 수정
const updateMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const myId = req.userId;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ message: "메시지 없음" });
        if (message.senderId !== myId) return res.status(403).json({ message: "권한 없음" });

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { content }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "수정 실패" });
    }
};

// 메시지 삭제
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const myId = req.userId;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ message: "메시지 없음" });
        if (message.senderId !== myId) return res.status(403).json({ message: "권한 없음" });

        await prisma.message.delete({ where: { id: messageId } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: "삭제 실패" });
    }
};

module.exports = {
    searchUsers,
    getChatList,
    getMessagesWithUser,
    markAsRead,
    sendMessage,
    updateMessage,
    deleteMessage
};