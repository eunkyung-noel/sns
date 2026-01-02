const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. DM 목록 조회
const getChatList = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: "인증 정보가 없습니다." });

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
        console.error(err);
        res.status(500).json({ message: '목록 조회 실패' });
    }
};

// 2. 대화 내역 조회 + 읽음 처리
const getMessagesWithUser = async (req, res) => {
    try {
        const myId = req.userId;
        const opponentId = req.params.userId;

        // 읽음 업데이트
        await prisma.message.updateMany({
            where: {
                senderId: opponentId,
                receiverId: myId,
                isRead: false
            },
            data: { isRead: true }
        });

        // 내역 조회
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
        console.error(err);
        res.status(500).json({ message: '대화 조회 실패' });
    }
};

// 3. 메시지 전송
const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId;
        const receiverId = req.params.userId;
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
        console.error(err);
        res.status(500).json({ message: '전송 실패' });
    }
};

module.exports = { getChatList, getMessagesWithUser, sendMessage };