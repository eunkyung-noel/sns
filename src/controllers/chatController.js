const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getChatDetail = async (req, res) => {
    try {
        // [Fact] UUID는 문자열이므로 Number() 변환을 제거합니다.
        const roomId = req.params.roomId;
        const userId = req.userId; // 미들웨어에서 넘어온 유저 ID (문자열)

        if (!roomId) {
            return res.status(400).json({ message: "유효하지 않은 요청입니다." });
        }

        // 1. 상대방 정보 조회
        const partner = await prisma.user.findUnique({
            where: { id: roomId },
            select: {
                id: true,
                nickname: true,
                profilePic: true,
                isAdult: true,
                _count: { select: { posts: true, followers: true, following: true } }
            }
        });

        if (!partner) {
            return res.status(404).json({ message: "상대방을 찾을 수 없습니다." });
        }

        // 2. 메시지 내역 조회
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: roomId },
                    { senderId: roomId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        // 3. 내 정보 조회
        const me = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isAdult: true }
        });

        return res.json({
            me: me || { isAdult: false },
            partner: {
                id: partner.id,
                nickname: partner.nickname || 'Unknown',
                profilePic: partner.profilePic,
                isAdult: !!partner.isAdult,
                counts: {
                    posts: partner._count?.posts || 0,
                    followers: partner._count?.followers || 0,
                    following: partner._count?.following || 0
                }
            },
            messages: messages || []
        });
    } catch (err) {
        console.error("Chat Detail Error:", err);
        return res.status(500).json({ message: "서버 오류" });
    }
};

exports.sendDM = async (req, res) => {
    try {
        // [Fact] 수신자 ID도 UUID 문자열일 경우 Number()를 제거합니다.
        const receiverId = req.body.receiverId;
        const senderId = req.userId;
        const { content } = req.body;

        if (!content || !content.trim()) return res.status(400).json({ message: "내용이 없습니다." });

        const newMessage = await prisma.message.create({
            data: {
                content: content.trim(),
                senderId,
                receiverId,
                isRead: false
            }
        });

        return res.status(201).json(newMessage);
    } catch (err) {
        console.error("Send DM Error:", err);
        return res.status(500).json({ message: "전송 실패" });
    }
};