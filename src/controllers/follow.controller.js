const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * [Fact Check] 성인 판별 로직 (2026년 기준)
 */
const isAdultUser = (age, birthDate) => {
    if (age && Number(age) >= 19) return true;
    if (birthDate) {
        const today = new Date('2026-01-05');
        const birth = new Date(birthDate);
        let calculatedAge = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) calculatedAge--;
        return calculatedAge >= 19;
    }
    return false;
};

// 팔로우/언팔로우 토글 (경고 로직 포함)
const followUser = async (req, res) => {
    try {
        const followerId = Number(req.user.userId || req.user.id);
        const followingId = Number(req.params.userId);
        const { force } = req.body; // 프론트에서 보낸 강제 실행 여부

        if (followerId === followingId) {
            return res.status(400).json({ message: '자기 자신을 팔로우할 수 없습니다.' });
        }

        // 1. 본인과 상대방의 나이 정보 조회
        const [me, target] = await Promise.all([
            prisma.user.findUnique({ where: { id: followerId }, select: { age: true, birthDate: true } }),
            prisma.user.findUnique({ where: { id: followingId }, select: { age: true, birthDate: true } })
        ]);

        if (!target) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

        const myIsAdult = isAdultUser(me.age, me.birthDate);
        const targetIsAdult = isAdultUser(target.age, target.birthDate);

        // 2. [교정] 성인-미성년자 교차 체크 (언팔로우 시에는 체크 안 함)
        const existing = await prisma.follow.findFirst({
            where: { followerId, followingId }
        });

        if (!existing && myIsAdult !== targetIsAdult && !force) {
            return res.json({
                requireWarning: true,
                message: "성인과 미성년자 간의 팔로우입니다. 진행하시겠습니까?"
            });
        }

        // 3. 팔로우/언팔로우 처리
        if (existing) {
            await prisma.follow.delete({ where: { id: existing.id } });
            return res.json({ isFollowing: false });
        } else {
            await prisma.follow.create({
                data: { followerId, followingId }
            });
            return res.json({ isFollowing: true });
        }
    } catch (err) {
        console.error("❌ 팔로우 에러:", err);
        res.status(500).json({ error: err.message });
    }
};

// 내 팔로잉 목록 조회
const getFollowingList = async (req, res) => {
    try {
        const userId = Number(req.user.userId || req.user.id);

        const list = await prisma.follow.findMany({
            where: { followerId: userId },
            include: {
                user_follow_followingIdTouser: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        age: true,
                        birthDate: true
                    }
                }
            }
        });

        const formattedList = list.map(item => {
            const u = item.user_follow_followingIdTouser;
            return {
                id: u.id,
                name: u.name,
                nickname: u.nickname,
                isAdult: isAdultUser(u.age, u.birthDate) // 🐳/🐠 표시를 위해 추가
            };
        });
        res.json(formattedList);
    } catch (err) {
        console.error("❌ 목록 조회 에러:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { followUser, getFollowingList };