const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. DM 목록 조회 (나와 대화한 사람들의 최신 메시지 리스트)
const getChatList = async (req, res) => {
    try {
        // [수정] ID는 String(UUID)이므로 Number()를 제거합니다.
        // authMiddleware에서 req.userId에 저장한다고 가정합니다.
        const userId = req.userId || req.user?.id;

        if (!userId) return res.status(401).json({ message: "인증되지 않은 사용자입니다." });

        const messages = await prisma.message.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true, nickname: true } },
                receiver: { select: { id: true, name: true, nickname: true } }
            }
        });

        const chatMap = new Map();
        messages.forEach((msg) => {
            const opponentId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (!chatMap.has(opponentId)) {
                chatMap.set(opponentId, {
                    opponent: msg.senderId === userId ? msg.receiver : msg.sender,
                    lastMessage: msg.content,
                    isRead: msg.receiverId === userId ? msg.isRead : true,
                    createdAt: msg.createdAt
                });
            }
        });

        res.json(Array.from(chatMap.values()));
    } catch (err) {
        console.error("DM 목록 조회 에러:", err);
        res.status(500).json({ message: '목록 조회 실패' });
    }
};

// 2. 특정 유저와의 대화 내역 조회 + 읽음 처리
const getMessagesWithUser = async (req, res) => {
    try {
        const myId = req.userId || req.user?.id;
        const opponentId = req.params.userId; // [수정] Number() 제거

        // 1) 읽음 업데이트
        await prisma.message.updateMany({
            where: {
                senderId: opponentId,
                receiverId: myId,
                isRead: false
            },
            data: { isRead: true }
        });

        // 2) 내역 조회
        const chatHistory = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: myId, receiverId: opponentId },
                    { senderId: opponentId, receiverId: myId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(chatHistory);
    } catch (err) {
        console.error("대화 조회 에러:", err);
        res.status(500).json({ message: '대화 조회 실패' });
    }
};

// 3. 메시지 전송
const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId || req.user?.id;
        const receiverId = req.params.userId; // [수정] Number() 제거
        const { content } = req.body;

        if (!content) return res.status(400).json({ message: '내용을 입력하세요.' });

        const newMessage = await prisma.message.create({
            data: {
                content,
                senderId,
                receiverId,
                isRead: false
            }
        });

        res.status(201).json(newMessage);
    } catch (err) {
        console.error("메시지 전송 에러:", err);
        res.status(500).json({ message: '전송 실패' });
    }
};

module.exports = { getChatList, getMessagesWithUser, sendMessage };