const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload.middleware');

// 1. 게시글 전체 조회
router.get('/', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: { select: { id: true, nickname: true, profilePic: true, isAdult: true } },
                likes: true,
                _count: { select: { comments: true } },
                comments: {
                    include: { author: { select: { id: true, nickname: true, profilePic: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ message: "게시글 로딩 실패" });
    }
});

// 2. 게시글 작성
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const newPost = await prisma.post.create({
            data: { content, imageUrl, authorId: req.userId },
            include: { author: { select: { nickname: true, profilePic: true } } }
        });
        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ message: "게시글 작성 실패" });
    }
});

// 3. 좋아요 토글 및 알림
router.post('/:id/like', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        const existingLike = await prisma.postLike.findUnique({
            where: { userId_postId: { userId, postId } }
        });

        if (existingLike) {
            await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
            return res.status(200).json({ message: "좋아요 취소", liked: false });
        } else {
            await prisma.postLike.create({ data: { userId, postId } });

            const post = await prisma.post.findUnique({ where: { id: postId } });
            if (post && post.authorId !== userId) {
                await prisma.notification.create({
                    data: {
                        type: 'LIKE',
                        userId: post.authorId,
                        creatorId: userId,
                        postId: postId
                    }
                });
            }
            return res.status(201).json({ message: "좋아요 성공", liked: true });
        }
    } catch (err) {
        res.status(500).json({ message: "좋아요 처리 중 에러" });
    }
});

// 4. 댓글 작성 및 알림
router.post('/:id/comments', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;
        const userId = req.userId;

        const comment = await prisma.comment.create({
            data: { content, postId, authorId: userId },
            include: { author: { select: { nickname: true, profilePic: true } } }
        });

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (post && post.authorId !== userId) {
            await prisma.notification.create({
                data: {
                    type: 'COMMENT',
                    userId: post.authorId,
                    creatorId: userId,
                    postId: postId,
                    commentId: comment.id
                }
            });
        }
        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ message: "댓글 작성 실패" });
    }
});

/**
 * [Fact] 5. 🚫 게시글 신고 라우트 추가
 * Prisma db push로 생성된 Report 모델을 사용합니다.
 */
router.post('/:id/report', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const { reason } = req.body;
        const reporterId = req.userId;

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ message: "대상을 찾을 수 없습니다." });

        const report = await prisma.report.create({
            data: {
                type: 'POST',
                reason: reason || "부적절한 콘텐츠",
                postId: postId,
                targetId: post.authorId,
                reporterId: reporterId
            }
        });

        res.status(201).json({ success: true, message: "신고가 정상 접수되었습니다.", reportId: report.id });
    } catch (err) {
        console.error("신고 에러:", err);
        res.status(500).json({ message: "신고 처리 중 오류 발생" });
    }
});

module.exports = router;