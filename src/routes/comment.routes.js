const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 미들웨어 로드 (verifyToken 객체 구조 반영)
const authModule = require('../middlewares/authMiddleware');
const auth = authModule.verifyToken || authModule;

/**
 * 1. 댓글 작성
 */
router.post('/:postId', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const { postId } = req.params;
        if (!content) return res.status(400).json({ message: "내용이 없습니다." });

        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                authorId: req.userId // 미들웨어 변수명에 맞춤
            },
            include: { author: { select: { nickname: true, profilePic: true } } }
        });
        res.status(201).json(comment);
    } catch (err) {
        console.error('댓글 작성 에러:', err);
        res.status(500).json({ message: "댓글 작성 실패" });
    }
});

/**
 * 2. 댓글 수정
 */
router.put('/:commentId', auth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.userId; // 미들웨어에서 넣어준 변수명 (req.userId)

        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });

        // 권한 확인 (Prisma UUID String 비교)
        if (comment.authorId !== userId) {
            return res.status(403).json({ message: "본인만 수정 가능합니다." });
        }

        const updated = await prisma.comment.update({
            where: { id: commentId },
            data: { content }
        });
        res.json(updated);
    } catch (err) {
        console.error('댓글 수정 에러:', err);
        res.status(500).json({ message: "수정 실패" });
    }
});

/**
 * 3. 댓글 삭제
 */
router.delete('/:commentId', auth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;

        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return res.status(404).json({ message: "댓글 없음" });
        if (comment.authorId !== userId) return res.status(403).json({ message: "권한 없음" });

        await prisma.comment.delete({ where: { id: commentId } });
        res.json({ message: "삭제 성공" });
    } catch (err) {
        console.error('댓글 삭제 에러:', err);
        res.status(500).json({ message: "삭제 실패" });
    }
});

/**
 * 4. 댓글 좋아요
 */
router.post('/:commentId/like', auth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;

        const existingLike = await prisma.commentLike.findUnique({
            where: { userId_commentId: { userId, commentId } }
        });

        if (existingLike) {
            await prisma.commentLike.delete({ where: { userId_commentId: { userId, commentId } } });
            return res.json({ isLiked: false });
        } else {
            await prisma.commentLike.create({ data: { userId, commentId } });
            return res.json({ isLiked: true });
        }
    } catch (err) {
        console.error('댓글 좋아요 에러:', err);
        res.status(500).json({ message: "좋아요 처리 실패" });
    }
});

module.exports = router;