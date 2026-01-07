// controllers/notificationController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getNotifications = async (req, res) => {
    try {
        const userId = req.userId; // authMiddleware에서 주입된 사용자 ID
        const notifications = await prisma.notification.findMany({
            where: { userId: userId },
            include: {
                creator: {
                    select: { nickname: true, profilePic: true }
                },
                post: {
                    select: { content: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(notifications);
    } catch (err) {
        console.error("알림 조회 에러:", err);
        res.status(500).json({ message: "조회 실패" });
    }
};

module.exports = { getNotifications };