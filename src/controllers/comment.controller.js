const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createComment = async (req, res) => {
    try {
        const userId = req.userId || req.user?.userId || req.user?.id;
        const postId = req.params.postId;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: '댓글 내용이 없습니다.' });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                postId: postId,
                userId: userId
            },
            include: {
                user: {
                    select: { id: true, nickname: true, profilePic: true }
                }
            }
        });

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (post && post.authorId !== userId) {
            await prisma.notification.create({
                data: {
                    type: 'COMMENT',
                    userId: post.authorId,
                    creatorId: userId,
                    postId: postId,
                    isRead: false
                }
            });
        }

        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ message: '댓글 작성 실패' });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const userId = req.userId || req.user?.userId || req.user?.id;
        const commentId = req.params.id;

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ message: '삭제 권한이 없습니다.' });
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        res.json({ message: '댓글 삭제 성공' });
    } catch (err) {
        res.status(500).json({ message: '댓글 삭제 실패' });
    }
};