const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 팔로우/언팔로우 토글
const followUser = async (req, res) => {
    try {
        const followerId = Number(req.user.userId || req.user.id);
        const followingId = Number(req.params.userId);

        if (followerId === followingId) {
            return res.status(400).json({ message: '자기 자신을 팔로우할 수 없습니다.' });
        }

        // 스키마에 정의된 필드명 followerId, followingId 사용
        const existing = await prisma.follow.findFirst({
            where: { followerId, followingId }
        });

        if (existing) {
            await prisma.follow.delete({ where: { id: existing.id } });
            return res.json({ message: '언팔로우 완료', isFollowing: false });
        } else {
            await prisma.follow.create({
                data: { followerId, followingId }
            });
            return res.json({ message: '팔로우 완료', isFollowing: true });
        }
    } catch (err) {
        console.error("팔로우 에러:", err);
        res.status(500).json({ error: err.message });
    }
};

// 내 팔로우 목록 조회
const getFollowingList = async (req, res) => {
    try {
        const userId = Number(req.user.userId || req.user.id);

        const list = await prisma.follow.findMany({
            where: { followerId: userId },
            include: {
                // 스키마 모델에 정의된 실제 관계 필드명을 사용해야 함
                user_follow_followingIdTouser: {
                    select: { id: true, name: true }
                }
            }
        });

        // 프론트엔드에서 쓰기 편하게 데이터 구조 가공
        const formattedList = list.map(item => item.user_follow_followingIdTouser);
        res.json(formattedList);
    } catch (err) {
        console.error("목록 조회 에러:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    followUser,
    getFollowingList
};