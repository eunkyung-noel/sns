const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 댓글 작성
 * POST /api/posts/:postId/comments
 */
exports.createComment = async (req, res) => {
    try {
        const userId = Number(req.user.userId || req.user.id);
        const postId = Number(req.params.postId);
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: '댓글 내용 없음' });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                userId
            },
            include: {
                user: {
                    select: { id: true, name: true }
                }
            }
        });

        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ message: '댓글 작성 실패' });
    }
};

/**
 * 댓글 삭제 (본인만)
 * DELETE /api/comments/:id
 */
exports.deleteComment = async (req, res) => {
    try {
        const userId = Number(req.user.userId || req.user.id);
        const commentId = Number(req.params.id);

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment || comment.userId !== userId) {
            return res.status(403).json({ message: '권한 없음' });
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        res.json({ message: '댓글 삭제 성공' });
    } catch (err) {
        res.status(500).json({ message: '댓글 삭제 실패' });
    }
};
