const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 좋아요 토글 (누르면 좋아요, 다시 누르면 취소)
exports.toggleLike = async (req, res) => {
    try {
        const userId = Number(req.user.userId);
        const postId = Number(req.params.postId);

        // 1. 이미 좋아요를 눌렀는지 확인
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: { userId, postId }
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
            return res.json({ liked: true, message: "좋아요 성공" });
        }
    } catch (err) {
        res.status(500).json({ message: "좋아요 처리 실패", error: err.message });
    }
};