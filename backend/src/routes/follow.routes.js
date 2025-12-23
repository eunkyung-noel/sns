const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); // 경로 수정
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 팔로우/언팔로우 토글
router.post('/:targetUserId', auth, async (req, res) => {
    try {
        const followerId = req.user.id;
        const { targetUserId } = req.params;

        const existing = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId, followingId: targetUserId } }
        });

        if (existing) {
            await prisma.follow.delete({ where: { id: existing.id } });
            return res.json({ followed: false });
        }

        await prisma.follow.create({ data: { followerId, followingId: targetUserId } });
        res.json({ followed: true });
    } catch (err) {
        res.status(500).json({ message: "팔로우 처리 실패" });
    }
});

module.exports = router;