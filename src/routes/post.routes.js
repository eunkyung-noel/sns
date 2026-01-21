const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload.middleware');

/**
 * 1. 모든 게시글 조회
 */
router.get('/', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: { select: { id: true, nickname: true, profilePic: true, isAdult: true } },
                likes: true,
                comments: {
                    include: {
                        author: { select: { id: true, nickname: true, profilePic: true, isAdult: true } },
                        likes: true
                    },
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

/**
 * 2. 내가 한 신고 목록 조회 (추가됨)
 * [Fact] /:id 보다 위에 위치해야 'reports'를 게시글 ID로 오해하지 않습니다.
 */
router.get('/reports/my', verifyToken, async (req, res) => {
    try {
        const myReports = await prisma.report.findMany({
            where: { reporterId: req.userId },
            include: {
                post: {
                    select: {
                        content: true,
                        imageUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(myReports);
    } catch (err) {
        console.error("신고 내역 조회 에러:", err);
        res.status(500).json({ message: "신고 내역 로딩 실패" });
    }
});

/**
 * 3. 게시글 작성
 */
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const newPost = await prisma.post.create({
            data: { content: content || "", imageUrl, authorId: req.userId },
            include: {
                author: { select: { id: true, nickname: true, profilePic: true } },
                likes: true,
                comments: true
            }
        });
        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ message: "작성 실패" });
    }
});

/**
 * 4. 게시글 신고
 */
router.post('/:id/report', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const { reason } = req.body;
        const reporterId = req.userId;

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ message: "존재하지 않는 게시물입니다." });

        const report = await prisma.report.create({
            data: {
                type: 'POST',
                reason: reason,
                postId: postId,
                targetId: post.authorId,
                reporterId: reporterId
            }
        });

        res.status(201).json({ message: "신고 접수 완료", report });
    } catch (err) {
        console.error("신고 생성 에러:", err);
        res.status(500).json({ message: "신고 처리 중 오류 발생" });
    }
});

/**
 * 5. 게시글 좋아요
 */
router.post('/:id/like', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        const existingLike = await prisma.postLike.findUnique({
            where: { userId_postId: { userId, postId } }
        });

        if (existingLike) {
            await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
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
        }

        const updatedLikes = await prisma.postLike.findMany({ where: { postId } });
        res.status(200).json(updatedLikes);
    } catch (err) {
        res.status(500).json({ message: "좋아요 처리 실패" });
    }
});

/**
 * 6. 댓글 작성
 */
router.post('/:id/comments', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;
        const userId = req.userId;

        if (!content) return res.status(400).json({ message: "내용이 없습니다." });

        const comment = await prisma.comment.create({
            data: { content, postId, authorId: userId },
            include: {
                author: { select: { id: true, nickname: true, profilePic: true } },
                likes: true
            }
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
 * 7. 게시글 삭제
 */
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ message: "게시글 없음" });
        if (post.authorId !== req.userId) return res.status(403).json({ message: "권한 없음" });

        await prisma.postLike.deleteMany({ where: { postId: id } });
        await prisma.comment.deleteMany({ where: { postId: id } });
        await prisma.notification.deleteMany({ where: { postId: id } });
        await prisma.report.deleteMany({ where: { postId: id } });
        await prisma.post.delete({ where: { id } });

        res.status(200).json({ message: "삭제 성공" });
    } catch (err) {
        res.status(500).json({ message: "삭제 실패" });
    }
});

module.exports = router;