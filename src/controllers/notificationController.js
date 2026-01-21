const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. 알림 목록 조회
const getNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const notifications = await prisma.notification.findMany({
            where: { userId: userId },
            include: {
                creator: {
                    select: { id: true, nickname: true, profilePic: true }
                },
                post: {
                    select: { id: true, content: true }
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

// 2. 알림 전체 읽음 처리 (NotificationPage에서 호출됨)
const markAllAsRead = async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.userId, isRead: false },
            data: { isRead: true }
        });
        res.status(200).json({ message: "모두 읽음 처리 완료" });
    } catch (err) {
        res.status(500).json({ message: "읽음 처리 실패" });
    }
};

// 3. 알림 개별 삭제
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.delete({
            where: { id: id }
        });
        res.status(200).json({ message: "삭제 완료" });
    } catch (err) {
        res.status(500).json({ message: "삭제 실패" });
    }
};

module.exports = {
    getNotifications,
    markAllAsRead,
    deleteNotification
};