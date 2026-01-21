const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. 게시글 작성
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const authorId = req.userId; // 미들웨어에서 넘어온 유저 ID

        const newPost = await prisma.post.create({
            data: {
                content,
                imageUrl,
                isSafe: true,
                authorId: authorId
            },
            include: { author: { select: { id: true, nickname: true, profilePic: true } } }
        });
        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ message: "게시글 작성 실패" });
    }
};

// 2. 전체 조회 (댓글, 좋아요, 작성자 정보 포함)
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: { select: { id: true, nickname: true, profilePic: true, isAdult: true } },
                likes: true,
                _count: { select: { comments: true, likes: true } },
                comments: {
                    include: { author: { select: { id: true, nickname: true, profilePic: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ message: "로드 실패" });
    }
};

// 3. 삭제 함수
exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ message: "글 없음" });

        if (post.authorId !== userId) {
            return res.status(403).json({ message: "권한 없음" });
        }

        await prisma.post.delete({ where: { id: postId } });
        res.status(200).json({ message: "삭제 성공" });
    } catch (err) {
        res.status(500).json({ message: "삭제 실패" });
    }
};

// 4. 댓글 작성 및 알림 생성
exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;
        const userId = req.userId;

        const post = await prisma.post.findUnique({ where: { id: postId } });

        // 댓글 생성과 알림 생성을 동시에 처리
        const [comment] = await prisma.$transaction([
            prisma.comment.create({
                data: { content, postId, authorId: userId },
                include: { author: { select: { id: true, nickname: true, profilePic: true } } }
            }),
            ...(post.authorId !== userId ? [
                prisma.notification.create({
                    data: {
                        type: 'COMMENT',
                        userId: post.authorId,
                        creatorId: userId,
                        postId: postId
                    }
                })
            ] : [])
        ]);

        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ message: "댓글 실패" });
    }
};

// 5. 좋아요 토글 및 알림 생성
exports.toggleLike = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        const post = await prisma.post.findUnique({ where: { id: postId } });
        const existingLike = await prisma.postLike.findUnique({
            where: { userId_postId: { userId, postId } }
        });

        if (existingLike) {
            await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
            return res.status(200).json({ liked: false });
        } else {
            await prisma.$transaction([
                prisma.postLike.create({ data: { userId, postId } }),
                ...(post.authorId !== userId ? [
                    prisma.notification.create({
                        data: {
                            type: 'LIKE',
                            userId: post.authorId,
                            creatorId: userId,
                            postId: postId
                        }
                    })
                ] : [])
            ]);
            res.status(200).json({ liked: true });
        }
    } catch (err) {
        res.status(500).json({ message: "좋아요 실패" });
    }
};

// [Fact] 6. 신고(Report) 함수 추가
exports.reportPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const { reason } = req.body;
        const reporterId = req.userId;

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ message: "신고할 게시글이 없습니다." });

        const report = await prisma.report.create({
            data: {
                type: 'POST',
                reason: reason || "부적절한 콘텐츠",
                postId: postId,
                targetId: post.authorId, // 게시글 작성자도 타겟으로 저장
                reporterId: reporterId
            }
        });

        res.status(201).json({ success: true, message: "신고 접수 완료" });
    } catch (err) {
        res.status(500).json({ message: "신고 실패" });
    }
};