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
                author: { select: { id: true, nickname: true, profilePic: true } },
                likes: true,
                comments: {
                    include: {
                        author: { select: { id: true, nickname: true, profilePic: true } }
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
 * 2. 게시글 작성
 */
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const newPost = await prisma.post.create({
            data: {
                content,
                imageUrl,
                authorId: req.userId // authMiddleware에서 할당한 타입 유지
            },
            include: {
                author: { select: { nickname: true, profilePic: true } }
            }
        });
        res.status(201).json(newPost);
    } catch (err) {
        console.error("❌ 게시글 작성 에러:", err);
        res.status(500).json({ message: "게시글 작성 실패" });
    }
});

/**
 * 3. 게시글 좋아요/취소
 */
router.post('/:id/like', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id; // Prisma 모델이 String ID를 사용하면 그대로 유지
        const userId = req.userId;

        const existingLike = await prisma.like.findFirst({
            where: { postId, userId }
        });

        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } });
            return res.status(200).json({ message: "좋아요 취소" });
        } else {
            await prisma.like.create({ data: { postId, userId } });
            return res.status(201).json({ message: "좋아요 성공" });
        }
    } catch (err) {
        console.error("❌ 좋아요 에러:", err);
        res.status(500).json({ message: "좋아요 처리 중 에러" });
    }
});

/**
 * 4. 댓글 작성
 */
router.post('/:id/comments', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;

        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                authorId: req.userId
            },
            include: {
                author: { select: { nickname: true, profilePic: true } }
            }
        });
        res.status(201).json(comment);
    } catch (err) {
        console.error("❌ 댓글 작성 에러:", err);
        res.status(500).json({ message: "댓글 작성 실패" });
    }
});

module.exports = router;