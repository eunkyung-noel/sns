const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload.middleware');

/**
 * 0. [GET] 내 신고 내역 조회
 */
router.get('/reports/my', verifyToken, async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            where: { reporterId: req.userId },
            include: {
                post: { select: { content: true, imageUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(reports);
    } catch (err) {
        console.error("❌ 신고 내역 로드 에러:", err);
        res.status(200).json([]);
    }
});

/**
 * 1. [GET] 모든 게시글 조회
 */
router.get('/', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: { select: { id: true, nickname: true, profilePic: true } },
                likes: true,
                comments: {
                    include: {
                        author: { select: { id: true, nickname: true, profilePic: true } },
                        likes: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(posts);
    } catch (err) {
        console.error("❌ 게시글 로드 에러:", err);
        res.status(500).json({ message: "게시글 로딩 실패" });
    }
});

/**
 * 2. [POST] 게시글 작성
 * [수정] 작성 즉시 프론트엔드에서 리스트에 끼워넣을 수 있도록 관련 정보를 모두 포함하여 응답합니다.
 */
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        if (!content && !imageUrl) {
            return res.status(400).json({ message: "내용이나 이미지를 입력해주세요." });
        }

        const newPost = await prisma.post.create({
            data: {
                content: content || "",
                imageUrl,
                authorId: req.userId
            },
            include: {
                author: { select: { id: true, nickname: true, profilePic: true } },
                likes: true,
                comments: true
            }
        });
        res.status(201).json(newPost);
    } catch (err) {
        console.error("❌ 게시글 작성 에러:", err);
        res.status(500).json({ message: "게시글 작성 실패" });
    }
});

/**
 * 5. [POST] 게시글 좋아요 토글
 * [수정] 단순 메시지가 아닌, 업데이트된 최신 likes 배열을 반환하여 즉시 렌더링을 지원합니다.
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
        }

        // 최신 좋아요 목록 재조회
        const updatedLikes = await prisma.postLike.findMany({
            where: { postId }
        });

        res.status(200).json(updatedLikes);
    } catch (err) {
        console.error("❌ 좋아요 에러:", err);
        res.status(500).json({ message: "좋아요 처리 실패" });
    }
});

/**
 * 7. [POST] 댓글 좋아요 토글
 * [수정] 업데이트된 최신 commentLikes 배열을 반환합니다.
 */
router.post('/comments/:commentId/like', verifyToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;

        const existingLike = await prisma.commentLike.findUnique({
            where: { userId_commentId: { userId, commentId } }
        });

        if (existingLike) {
            await prisma.commentLike.delete({ where: { userId_commentId: { userId, commentId } } });
        } else {
            await prisma.commentLike.create({ data: { userId, commentId } });
        }

        // 최신 댓글 좋아요 목록 재조회
        const updatedCommentLikes = await prisma.commentLike.findMany({
            where: { commentId }
        });

        res.status(200).json(updatedCommentLikes);
    } catch (err) {
        console.error("❌ 댓글 좋아요 에러:", err);
        res.status(500).json({ message: "댓글 좋아요 실패" });
    }
});

// 나머지 PUT, DELETE, GET(:id), REPORT 등은 기존 로직 유지
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        if (post.authorId !== req.userId) return res.status(403).json({ message: "수정 권한이 없습니다." });

        const updatedPost = await prisma.post.update({
            where: { id },
            data: { content }
        });
        res.status(200).json(updatedPost);
    } catch (err) { res.status(500).json({ message: "수정 실패" }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        if (post.authorId !== req.userId) return res.status(403).json({ message: "삭제 권한이 없습니다." });

        await prisma.postLike.deleteMany({ where: { postId: id } });
        await prisma.comment.deleteMany({ where: { postId: id } });
        await prisma.post.delete({ where: { id } });
        res.status(200).json({ message: "삭제 성공" });
    } catch (err) { res.status(500).json({ message: "삭제 실패" }); }
});

router.post('/:id/comments', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: "내용이 없습니다." });
        const comment = await prisma.comment.create({
            data: { content, postId: req.params.id, authorId: req.userId },
            include: { author: { select: { id: true, nickname: true, profilePic: true } }, likes: true }
        });
        res.status(201).json(comment);
    } catch (err) { res.status(500).json({ message: "댓글 작성 실패" }); }
});

router.post('/:id/report', verifyToken, async (req, res) => {
    try {
        await prisma.report.create({
            data: { reason: req.body.reason || "기타", postId: req.params.id, reporterId: req.userId }
        });
        res.status(200).json({ message: "신고 접수 완료" });
    } catch (err) { res.status(500).json({ message: "신고 실패" }); }
});

router.get('/:id', async (req, res) => {
    try {
        const post = await prisma.post.findUnique({
            where: { id: req.params.id },
            include: {
                author: { select: { id: true, nickname: true, profilePic: true } },
                likes: true,
                comments: { include: { author: { select: { id: true, nickname: true, profilePic: true } }, likes: true } }
            }
        });
        if (!post) return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
        res.status(200).json(post);
    } catch (err) { res.status(500).json({ message: "조회 실패" }); }
});

module.exports = router;