const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. 유저 검색 (검색창 로직)
exports.searchUsers = async (req, res) => {
    try {
        const { term } = req.query; // 프론트의 ?term= 값을 읽음
        if (!term) return res.json([]);

        const users = await prisma.user.findMany({
            where: {
                id: { not: req.userId }, // 나 자신은 제외
                OR: [
                    { name: { contains: term, mode: 'insensitive' } },
                    { nickname: { contains: term, mode: 'insensitive' } }
                ]
            },
            select: { id: true, name: true, nickname: true }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "검색 실패" });
    }
};

// 2. 과거 대화 내역 조회 (roomId는 상대방의 유저 ID)
exports.getChatDetail = async (req, res) => {
    try {
        const { roomId } = req.params; // URL의 :roomId 값
        const userId = req.userId; // 내 ID (auth 미들웨어에서 넣어준 것)

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: roomId },
                    { senderId: roomId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        // 상대방 이름 가져오기
        const partner = await prisma.user.findUnique({
            where: { id: roomId },
            select: { name: true, nickname: true }
        });

        res.json({
            partnerName: partner?.nickname || partner?.name || "알 수 없음",
            messages
        });
    } catch (err) {
        res.status(500).json({ message: "상세 내역 로드 실패" });
    }
};

// 3. 메시지 보내기 (DB 저장)
exports.sendDM = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.userId;

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
        res.status(500).json({ message: "메시지 전송 실패" });
    }
};