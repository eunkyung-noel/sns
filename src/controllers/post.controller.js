const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 게시글 생성
exports.createPost = async (req, res) => {
    try {
        const authorId = req.user.userId;
        const { content, visibility } = req.body;

        const post = await prisma.post.create({
            data: {
                content,
                visibility,
                authorId
            }
        });

        res.json({ message: '게시글 생성 완료', post });
    } catch (err) {
        res.status(500).json({ message: '게시글 생성 실패', error: err.message });
    }
};

// 게시글 조회
exports.getPosts = async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: '게시글 조회 실패', error: err.message });
    }
};

// ✅ 게시글 수정 (네가 보낸 코드)
exports.updatePost = async (req, res) => {
    try {
        const userId = req.user.userId;
        const postId = parseInt(req.params.id);
        const { content, visibility } = req.body;

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return res.status(404).json({ message: '게시글 없음' });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ message: '수정 권한 없음' });
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { content, visibility }
        });

        res.json({ message: '게시글 수정 완료', post: updatedPost });
    } catch (err) {
        res.status(500).json({ message: '게시글 수정 실패', error: err.message });
    }
};