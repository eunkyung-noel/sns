const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. 유저 검색 (ID 또는 이메일) - 추가된 기능
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        // 입력값이 숫자인지 확인 (ID 검색용)
        const isNumber = !isNaN(query) && query.trim() !== "";

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    isNumber ? { id: Number(query) } : null, // ID 일치 확인
                    { email: { contains: query } },         // 이메일 포함 확인
                    { name: { contains: query } }           // 이름 포함 확인
                ].filter(Boolean), // null 조건 제거
                NOT: { id: Number(req.user.userId || req.user.id) } // 본인 제외
            },
            select: {
                id: true,
                name: true,
                email: true
            },
            take: 5 // 최대 5명만 반환
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. DM 보내기
const sendDM = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = Number(req.user.userId || req.user.id);
        const targetId = Number(receiverId);

        if (senderId === targetId) return res.status(400).json({ message: "자신에게 보낼 수 없습니다." });

        const [sender, receiver] = await Promise.all([
            prisma.user.findUnique({ where: { id: senderId } }),
            prisma.user.findUnique({ where: { id: targetId } })
        ]);

        if (!sender || !receiver) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

        const isSenderMinor = (sender.age || 0) < 19;
        const isReceiverMinor = (receiver.age || 0) < 19;

        if (isSenderMinor !== isReceiverMinor) {
            const isFriend = await prisma.follow.findFirst({
                where: {
                    OR: [
                        { followerId: senderId, followingId: targetId },
                        { followerId: targetId, followingId: senderId }
                    ]
                }
            });
            if (!isFriend) return res.status(403).json({ message: "미성년자와 성인 간 DM은 친구 사이만 가능합니다." });
        }

        const newMessage = await prisma.message.create({
            data: { senderId, receiverId: targetId, content, isRead: false }
        });
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json({ message: "전송 실패", error: err.message });
    }
};

// 3. 채팅 목록 조회
const getChatRooms = async (req, res) => {
    try {
        const userId = Number(req.user.userId || req.user.id);
        const messages = await prisma.message.findMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            orderBy: { createdAt: 'desc' },
            include: { sender: true, receiver: true }
        });

        const chatMap = new Map();
        messages.forEach(msg => {
            const partner = msg.senderId === userId ? msg.receiver : msg.sender;
            if (partner && !chatMap.has(partner.id)) {
                chatMap.set(partner.id, {
                    partnerId: partner.id,
                    partnerName: partner.name,
                    lastMessage: msg.content,
                    createdAt: msg.createdAt,
                    isRead: msg.receiverId === userId ? msg.isRead : true
                });
            }
        });
        res.json(Array.from(chatMap.values()));
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 4. 상세 조회
const getChatDetail = async (req, res) => {
    try {
        const myId = Number(req.user.userId || req.user.id);
        const partnerId = Number(req.params.partnerId);

        await prisma.message.updateMany({
            where: { senderId: partnerId, receiverId: myId, isRead: false },
            data: { isRead: true }
        });

        const messages = await prisma.message.findMany({
            where: { OR: [{ senderId: myId, receiverId: partnerId }, { senderId: partnerId, receiverId: myId }] },
            orderBy: { createdAt: 'asc' },
            include: { sender: true, receiver: true }
        });
        res.json(messages);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 5. 신고하기
const reportDM = async (req, res) => {
    try {
        await prisma.message.update({ where: { id: Number(req.params.id) }, data: { isReported: true } });
        res.json({ message: "신고 접수 완료" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 모든 함수 내보내기
module.exports = {
    searchUsers,
    sendDM,
    getChatRooms,
    getChatDetail,
    reportDM
};