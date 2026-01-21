const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// [Fact] 좋아요 토글 및 알림 생성 로직
exports.toggleLike = async (req, res) => {
    try {
        // 기존 authController와 통일성을 위해 userId 타입을 확인하십시오.
        // UUID를 사용 중이라면 Number()를 제거해야 합니다.
        const userId = req.userId || req.user?.userId;
        const postId = req.params.postId;

        if (!userId || !postId) {
            return res.status(400).json({ message: "사용자 또는 게시글 정보가 부족합니다." });
        }

        // 1. 이미 좋아요를 눌렀는지 확인
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId: userId,
                    postId: postId
                }
            }
        });

        if (existingLike) {
            // 2. 이미 있다면 삭제 (좋아요 취소)
            await prisma.like.delete({
                where: { id: existingLike.id }
            });
            return res.json({ liked: false, message: "좋아요 취소" });
        } else {
            // 3. 없다면 생성 (좋아요 추가)
            await prisma.like.create({
                data: { userId, postId }
            });

            // 4. [추가] 게시글 작성자에게 알림 생성
            // 먼저 게시글 정보를 가져와 작성자(authorId)를 확인합니다.
            const post = await prisma.post.findUnique({
                where: { id: postId },
                select: { authorId: true }
            });

            // 본인 글에 좋아요를 누른 게 아닐 때만 알림 생성
            if (post && post.authorId !== userId) {
                await prisma.notification.create({
                    data: {
                        type: 'LIKE',
                        userId: post.authorId, // 알림 받을 사람
                        creatorId: userId,     // 좋아요 누른 사람
                        postId: postId,        // 해당 게시글 ID
                        isRead: false
                    }
                });
            }

            return res.json({ liked: true, message: "좋아요 성공" });
        }
    } catch (err) {
        console.error("좋아요 처리 에러:", err);
        res.status(500).json({ message: "좋아요 처리 실패", error: err.message });
    }
};