const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. DM 목록 조회 (나와 대화한 사람들의 최신 메시지 리스트)
const getChatList = async (req, res) => {
    try {
        const userId = Number(req.user.id);

        // 내가 발신자 혹은 수신자인 메시지들을 가져옴
        const messages = await prisma.message.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true } },
                receiver: { select: { id: true, name: true } }
            }
        });

        // 상대방별로 그룹화하여 마지막 메시지만 추출
        const chatMap = new Map();
        messages.forEach((msg) => {
            const opponentId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            if (!chatMap.has(opponentId)) {
                chatMap.set(opponentId, {
                    opponent: msg.senderId === userId ? msg.receiver : msg.sender,
                    lastMessage: msg.content,
                    isRead: msg.receiverId === userId ? msg.isRead : true, // 내가 보낸 건 읽음 처리로 간주
                    createdAt: msg.createdAt
                });
            }
        });

        res.json(Array.from(chatMap.values()));
    } catch (err) {
        res.status(500).json({ message: '목록 조회 실패', error: err.message });
    }
};

// 2. 특정 유저와의 대화 내역 조회 + 읽음 처리 (누구에게 보내는지 특정됨)
const getMessagesWithUser = async (req, res) => {
    try {
        const myId = Number(req.user.id);
        const opponentId = Number(req.params.userId);

        // 1) 대화방 입장 시 상대방이 나에게 보낸 메시지들을 '읽음'으로 업데이트
        await prisma.message.updateMany({
            where: {
                senderId: opponentId,
                receiverId: myId,
                isRead: false
            },
            data: { isRead: true }
        });

        // 2) 전체 대화 내역 조회
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
        res.status(500).json({ message: '대화 조회 실패' });
    }
};

// 3. 메시지 전송 (누구에게 보낼지 receiverId 파라미터로 받음)
const sendMessage = async (req, res) => {
    try {
        const senderId = Number(req.user.id);
        const receiverId = Number(req.params.userId);
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
        res.status(500).json({ message: '전송 실패' });
    }
};

module.exports = { getChatList, getMessagesWithUser, sendMessage };