const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 글 작성
exports.createPost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { content, visibility } = req.body;

        if (!content) {
            return res.status(400).json({ message: '내용이 비어있음' });
        }

        if (!['FRIENDS', 'PRIVATE'].includes(visibility)) {
            return res.status(400).json({ message: 'visibility 값 오류' });
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

// 피드 조회
exports.getPosts = async (req, res) => {
    try {
        const userId = req.user.userId;

        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    { visibility: 'FRIENDS' },
                    {
                        visibility: 'PRIVATE',
                        authorId: userId
                    }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        age: true
                    }
                }
            }
        });

        res.json(posts);
    } catch (err) {
        res.status(500).json({
            message: '피드 조회 실패',
            error: err.message
        });
    }
};
