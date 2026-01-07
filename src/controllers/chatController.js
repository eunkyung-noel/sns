const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. 유저 검색 (검색창 로직)
exports.searchUsers = async (req, res) => {
    try {
        const { term } = req.query;
        if (!term) return res.json([]);

        const myId = Number(req.userId); // 숫자형 변환

        const users = await prisma.user.findMany({
            where: {
                id: { not: myId },
                OR: [
                    { name: { contains: term } },    // mode 제거
                    { nickname: { contains: term } } // mode 제거
                ]
            },
            select: { id: true, name: true, nickname: true }
        });
        res.json(users);
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ message: "검색 실패" });
    }
};

// 2. 과거 대화 내역 조회
exports.getChatDetail = async (req, res) => {
    try {
        const roomId = Number(req.params.roomId); // 숫자형 변환 필수
        const userId = Number(req.userId);       // 숫자형 변환 필수

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: roomId },
                    { senderId: roomId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        const partner = await prisma.user.findUnique({
            where: { id: roomId },
            select: { name: true, nickname: true }
        });

        res.json({
            partnerName: partner?.nickname || partner?.name || "알 수 없음",
            messages
        });
    } catch (err) {
        console.error("Chat Detail Error:", err);
        res.status(500).json({ message: "상세 내역 로드 실패" });
    }
};

// 3. 메시지 보내기 (DB 저장)
exports.sendDM = async (req, res) => {
    try {
        const receiverId = Number(req.body.receiverId); // 숫자형 변환 필수
        const senderId = Number(req.userId);           // 숫자형 변환 필수
        const { content } = req.body;

        if (!content) return res.status(400).json({ message: "내용이 없습니다." });

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
        console.error("Send DM Error:", err);
        res.status(500).json({ message: "메시지 전송 실패" });
    }
};