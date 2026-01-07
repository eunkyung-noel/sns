const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 미들웨어 경로 확인
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload.middleware');

/**
 * 1. [GET] 모든 게시글 조회
 */
router.get('/', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: { select: { id: true, nickname: true, profilePic: true } },
                likes: true, // Prisma Client는 자동으로 post_likes 테이블에서 가져옴
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
 * 2. [POST] 게시글 작성
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
                author: { select: { id: true, nickname: true, profilePic: true } }
            }
        });
        res.status(201).json(newPost);
    } catch (err) {
        console.error("❌ 게시글 작성 에러:", err);
        res.status(500).json({ message: "게시글 작성 실패" });
    }
});

/**
 * 3. [PUT] 게시글 수정
 */
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
    } catch (err) {
        res.status(500).json({ message: "수정 실패" });
    }
});

/**
 * 4. [DELETE] 게시글 삭제
 */
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        if (post.authorId !== req.userId) return res.status(403).json({ message: "삭제 권한이 없습니다." });

        // ✅ 모델명 명시적 수정 (postLike, comment)
        await prisma.postLike.deleteMany({ where: { postId: id } });
        await prisma.comment.deleteMany({ where: { postId: id } });

        await prisma.post.delete({ where: { id } });
        res.status(200).json({ message: "삭제 성공" });
    } catch (err) {
        console.error("❌ 삭제 에러:", err);
        res.status(500).json({ message: "삭제 실패" });
    }
});

/**
 * 5. [POST] 좋아요 토글 (최종 수정 완료)
 */
router.post('/:id/like', verifyToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        // ✅ Prisma 스키마의 PostLike 모델은 prisma.postLike로 접근
        // ✅ 복합 키 @id([userId, postId])는 userId_postId 객체로 조회
        const existingLike = await prisma.postLike.findUnique({
            where: {
                userId_postId: {
                    userId: userId,
                    postId: postId
                }
            }
        });

        if (existingLike) {
            // 이미 존재하면 삭제
            await prisma.postLike.delete({
                where: {
                    userId_postId: {
                        userId: userId,
                        postId: postId
                    }
                }
            });
            return res.status(200).json({ message: "좋아요 취소" });
        } else {
            // 없으면 생성
            await prisma.postLike.create({
                data: {
                    userId: userId,
                    postId: postId
                }
            });
            return res.status(201).json({ message: "좋아요 성공" });
        }
    } catch (err) {
        console.error("❌ 좋아요 에러:", err);
        res.status(500).json({ message: "좋아요 처리 실패", error: err.message });
    }
});

/**
 * 6. [POST] 댓글 작성
 */
router.post('/:id/comments', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: "내용이 없습니다." });

        const comment = await prisma.comment.create({
            data: {
                content,
                postId: req.params.id,
                authorId: req.userId
            },
            include: {
                author: { select: { id: true, nickname: true, profilePic: true } }
            }
        });
        res.status(201).json(comment);
    } catch (err) {
        console.error("❌ 댓글 에러:", err);
        res.status(500).json({ message: "댓글 작성 실패" });
    }
});

/**
 * 7. [POST] 게시글 신고
 */
router.post('/:id/report', verifyToken, async (req, res) => {
    try {
        // 신고 로직 구현부 (필요 시 Prisma Report 모델 사용)
        res.status(200).json({ message: "신고 접수 완료" });
    } catch (err) {
        res.status(500).json({ message: "신고 실패" });
    }
});

/**
 * 8. [GET] 게시글 상세 조회
 */
router.get('/:id', async (req, res) => {
    try {
        const post = await prisma.post.findUnique({
            where: { id: req.params.id },
            include: {
                author: { select: { id: true, nickname: true, profilePic: true } },
                likes: true,
                comments: {
                    include: { author: { select: { id: true, nickname: true, profilePic: true } } }
                }
            }
        });
        if (!post) return res.status(404).json({ message: "게시물을 찾을 수 없습니다." });
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ message: "조회 실패" });
    }
});

module.exports = router;