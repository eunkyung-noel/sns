const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * [Fact] 유저 검색
 */
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
                isAdult: true,
                profilePic: true,
                followers: { where: { followerId: myId } }
            }
        });

        res.json(users.map(user => ({
            id: user.id,
            nickname: user.nickname,
            email: user.email,
            profilePic: user.profilePic,
            isAdult: Boolean(user.isAdult),
            isFollowing: user.followers.length > 0
        })));
    } catch (err) {
        res.status(500).json({ message: "검색 실패" });
    }
};

/**
 * [Fact] 채팅방 목록 조회
 */
const getChatList = async (req, res) => {
    try {
        const userId = req.userId;
        const messages = await prisma.message.findMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, nickname: true, isAdult: true, profilePic: true } },
                receiver: { select: { id: true, nickname: true, isAdult: true, profilePic: true } }
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
                        isAdult: Boolean(opponent.isAdult)
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

/**
 * [Fact] 대화 내역 조회 (통계 데이터 포함)
 */
const getMessagesWithUser = async (req, res) => {
    try {
        const myId = req.userId;
        const opponentId = req.params.userId;

        const [me, partner] = await Promise.all([
            prisma.user.findUnique({ where: { id: myId }, select: { isAdult: true } }),
            prisma.user.findUnique({
                where: { id: opponentId },
                include: {
                    followers: { where: { followerId: myId } },
                    following: { where: { followingId: myId } },
                    _count: {
                        select: {
                            posts: true,
                            followers: true,
                            following: true
                        }
                    }
                }
            })
        ]);

        if (!partner) return res.status(404).json({ message: "상대를 찾을 수 없음" });

        await prisma.message.updateMany({
            where: { senderId: opponentId, receiverId: myId, isRead: false },
            data: { isRead: true }
        });

        const chatHistory = await prisma.message.findMany({
            where: {
                OR: [{ senderId: myId, receiverId: opponentId }, { senderId: opponentId, receiverId: myId }]
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json({
            me: { isAdult: Boolean(me?.isAdult) },
            partner: {
                id: partner.id,
                nickname: partner.nickname,
                isAdult: Boolean(partner.isAdult),
                profilePic: partner.profilePic,
                isFollowing: partner.followers.length > 0,
                isFollower: partner.following.length > 0,
                counts: {
                    posts: partner._count.posts,
                    followers: partner._count.followers,
                    following: partner._count.following
                }
            },
            messages: chatHistory
        });
    } catch (err) {
        res.status(500).json({ message: '조회 실패' });
    }
};

/**
 * [Fact] 메시지 좋아요 토글
 */
const toggleMessageLike = async (req, res) => {
    try {
        const { messageId } = req.params;
        const msg = await prisma.message.findUnique({ where: { id: messageId } });
        if (!msg) return res.status(404).json({ message: "메시지 없음" });

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { isLiked: !msg.isLiked }
        });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "좋아요 실패" });
    }
};

/**
 * [Fact] 메시지 전송
 */
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

        if (Boolean(sender.isAdult) !== Boolean(receiver.isAdult)) {
            const [f1, f2] = await Promise.all([
                prisma.follow.findUnique({ where: { followerId_followingId: { followerId: senderId, followingId: receiverId } } }),
                prisma.follow.findUnique({ where: { followerId_followingId: { followerId: receiverId, followingId: senderId } } })
            ]);
            if (!f1 || !f2) return res.status(403).json({ message: '성인-미성년자 DM은 맞팔로우 시에만 가능합니다.' });
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

/**
 * [Fact] 메시지 수정 / 삭제 / 읽음처리 등
 */
const updateMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const updated = await prisma.message.update({ where: { id: messageId }, data: { content } });
        res.json(updated);
    } catch (err) { res.status(500).json({ message: "수정 실패" }); }
};

const deleteMessage = async (req, res) => {
    try {
        await prisma.message.delete({ where: { id: req.params.messageId } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "삭제 실패" }); }
};

const markAsRead = async (req, res) => {
    try {
        await prisma.message.updateMany({
            where: { senderId: req.params.userId, receiverId: req.userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "읽음 처리 실패" }); }
};

module.exports = {
    searchUsers,
    getChatList,
    getMessagesWithUser,
    markAsRead,
    sendMessage,
    updateMessage,
    deleteMessage,
    toggleMessageLike
};