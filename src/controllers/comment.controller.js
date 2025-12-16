const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { filterText } = require('../utils/aiFilter'); // AI 필터 유틸리티 사용

// 1. 댓글 생성 (POST /comments/:postId)
exports.createComment = async (req, res) => {
    const userId = req.user.userId;
    const postId = parseInt(req.params.postId);
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: '댓글 내용을 입력해야 합니다.' });
    }

    try {
        // AI 필터 적용
        const { isAdultContent, filteredContent } = filterText(content);

        const newComment = await prisma.comment.create({
            data: {
                content: filteredContent,
                authorId: userId,
                postId: postId,
                isAdultContent: isAdultContent,
            },
            include: { author: { select: { id: true, name: true } } },
        });

        res.status(201).json({ message: '댓글 생성 완료', comment: newComment });
    } catch (error) {
        console.error('댓글 생성 오류:', error);
        res.status(500).json({ message: '댓글 생성 중 서버 오류가 발생했습니다.' });
    }
};

// 2. 게시글의 모든 댓글 조회 (GET /comments/:postId)
exports.getComments = async (req, res) => {
    const postId = parseInt(req.params.postId);

    try {
        const comments = await prisma.comment.findMany({
            where: { postId: postId },
            orderBy: { createdAt: 'asc' },
            include: { author: { select: { id: true, name: true } } },
        });

        res.status(200).json(comments);
    } catch (error) {
        console.error('댓글 조회 오류:', error);
        res.status(500).json({ message: '댓글 조회 중 서버 오류가 발생했습니다.' });
    }
};

// 3. 댓글 수정 (PUT /comments/:commentId)
exports.updateComment = async (req, res) => {
    const userId = req.user.userId;
    const commentId = parseInt(req.params.commentId);
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: '수정할 내용을 입력해야 합니다.' });
    }

    try {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });

        if (!comment) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }
        if (comment.authorId !== userId) {
            return res.status(403).json({ message: '수정 권한이 없습니다.' });
        }

        // AI 필터 적용
        const { isAdultContent, filteredContent } = filterText(content);

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                content: filteredContent,
                isAdultContent: isAdultContent,
            }
        });

        res.status(200).json({ message: '댓글 수정 완료', comment: updatedComment });
    } catch (error) {
        console.error('댓글 수정 오류:', error);
        res.status(500).json({ message: '댓글 수정 중 서버 오류가 발생했습니다.' });
    }
};

// 4. 댓글 삭제 (DELETE /comments/:commentId)
exports.deleteComment = async (req, res) => {
    const userId = req.user.userId;
    const commentId = parseInt(req.params.commentId);

    try {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });

        if (!comment) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }
        if (comment.authorId !== userId) {
            return res.status(403).json({ message: '삭제 권한이 없습니다.' });
        }

        await prisma.comment.delete({ where: { id: commentId } });

        res.status(200).json({ message: '댓글 삭제 완료' });
    } catch (error) {
        console.error('댓글 삭제 오류:', error);
        res.status(500).json({ message: '댓글 삭제 중 서버 오류가 발생했습니다.' });
    }
};