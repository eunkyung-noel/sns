const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middlewares/authMiddleware');


// 1. 알림 목록 조회
router.get('/', verifyToken, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            include: {
                creator: {
                    select: { nickname: true, profilePic: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(notifications);
    } catch (err) {
        console.error("❌ 알림 조회 에러:", err);
        res.status(500).json({ message: "알림 조회 중 오류 발생" });
    }
});

// 2. 읽지 않은 알림이 있는지 확인 (🔔 빨간 점 표시용)
router.get('/unread-check', verifyToken, async (req, res) => {
    try {
        const unreadCount = await prisma.notification.count({
            where: { userId: req.userId, isRead: false }
        });
        res.status(200).json({ hasUnread: unreadCount > 0 });
    } catch (err) {
        res.status(500).json({ message: "알림 체크 오류" });
    }
});

// 3. 알림 삭제 (개별 삭제)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await prisma.notification.delete({
            where: {
                id: req.params.id,
                userId: req.userId // 본인 알림만 삭제 가능하도록 보안 설정
            }
        });
        res.status(200).json({ message: "알림이 삭제되었습니다." });
    } catch (err) {
        res.status(500).json({ message: "알림 삭제 중 오류 발생" });
    }
});

// 4. 알림 전체 읽음 처리 (알림창 열 때 호출)
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.userId, isRead: false },
            data: { isRead: true }
        });
        res.status(200).json({ message: "모든 알림을 읽음 처리했습니다." });
    } catch (err) {
        res.status(500).json({ message: "알림 업데이트 오류" });
    }
});

module.exports = router;