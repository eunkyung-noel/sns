const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. DM 목록 조회
const getChatList = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ message: "인증되지 않은 사용자입니다." });

        const messages = await prisma.message.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true, nickname: true, profilePic: true } },
                receiver: { select: { id: true, name: true, nickname: true, profilePic: true } }
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

/**
 * [Fact] 메시지 전송 + 알림 생성 로직 통합
 * - 메시지 생성과 알림 생성을 하나의 트랜잭션으로 처리
 */
const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId;
        const receiverId = req.params.userId;
        const { content } = req.body;

        if (!content) return res.status(400).json({ message: '내용을 입력하세요.' });
        if (senderId === receiverId) return res.status(400).json({ message: '자신에게 보낼 수 없습니다.' });

        // [교정] 메시지 생성과 알림 생성을 동시에 실행
        const [newMessage] = await prisma.$transaction([
            // 1) 메시지 저장
            prisma.message.create({
                data: {
                    content,
                    senderId,
                    receiverId,
                    isRead: false
                }
            }),
            // 2) 상대방을 위한 알림 생성
            prisma.notification.create({
                data: {
                    type: 'MESSAGE',
                    userId: receiverId, // 알림을 받을 사람
                    creatorId: senderId, // 메시지를 보낸 사람
                    isRead: false
                }
            })
        ]);

        res.status(201).json(newMessage);
    } catch (err) {
        console.error("메시지 전송 및 알림 생성 에러:", err);
        res.status(500).json({ message: '전송 실패' });
    }
};

module.exports = { getChatList, getMessagesWithUser, sendMessage };