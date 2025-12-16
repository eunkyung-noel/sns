const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 게시글 작성
exports.createPost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { content, visibility } = req.body;

        if (!content || !visibility) {
            return res.status(400).json({ message: '내용과 공개범위 필요' });
        }

        const post = await prisma.post.create({
            data: {
                content,
                visibility,
                authorId: userId
            }
        });

        res.json({
            message: '게시글 작성 성공',
            post
        });
    } catch (err) {
        res.status(500).json({
            message: '게시글 작성 실패',
            error: err.message
        });
    }
};

// 게시글 피드
exports.getPosts = async (req, res) => {
    try {
        const userId = req.user.userId;

        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    { visibility: 'FRIENDS' },
                    { authorId: userId }
                ]
            },
            include: {
                author: {
                    select: { id: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(posts);
    } catch (err) {
        res.status(500).json({
            message: '게시글 조회 실패',
            error: err.message
        });
    }
};
