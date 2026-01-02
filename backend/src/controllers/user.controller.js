const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const searchUsers = async (req, res) => {
    try {
        const { term } = req.query;
        // req.userId가 미들웨어에서 숫자/문자열 중 어떤 것으로 오든 안전하게 처리
        const myId = req.userId ? Number(req.userId) : null;

        if (!term || term.trim() === "") return res.json([]);

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { name: { contains: term } },
                            { nickname: { contains: term } }
                        ],
                    },
                    // 본인은 검색 결과에서 제외
                    ...(myId ? [{ NOT: { id: myId } }] : [])
                ]
            },
            include: {
                // 팔로우 여부 확인
                followers: {
                    where: { followerId: myId || -1 }
                }
            },
            take: 20
        });

        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            nickname: user.nickname,
            isFollowing: user.followers.length > 0
        }));

        return res.json(formattedUsers);
    } catch (err) {
        // 실제 원인은 IntelliJ 터미널 로그에서 확인 가능
        console.error("❌ [Search Controller Error]:", err);
        return res.status(500).json({
            message: "검색 서버 오류",
            error: err.message
        });
    }
};

/**
 * 2. 프로필 상세 조회
 */
const getUserProfile = async (req, res) => {
    try {
        const targetUserId = Number(req.params.userId);
        const myId = req.userId ? Number(req.userId) : null;

        if (isNaN(targetUserId)) {
            return res.status(400).json({ message: "유효하지 않은 유저 ID입니다." });
        }

        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
                _count: {
                    select: { followers: true, following: true, posts: true }
                },
                followers: {
                    where: { followerId: myId || -1 }
                },
                posts: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        content: true,
                        imageUrl: true,
                        createdAt: true,
                        _count: { select: { likes: true, comments: true } }
                    }
                }
            }
        });

        if (!user) return res.status(404).json({ message: "유저를 찾을 수 없습니다." });

        const { password, ...otherData } = user;
        return res.json({
            ...otherData,
            isFollowing: user.followers.length > 0
        });
    } catch (err) {
        console.error("❌ [Profile Controller Error]:", err);
        return res.status(500).json({ message: "프로필 조회 오류" });
    }
};


const toggleFollow = async (req, res) => {
    try {
        const followerId = req.userId ? Number(req.userId) : null;
        const followingId = Number(req.params.userId);

        if (!followerId || isNaN(followingId)) {
            return res.status(401).json({ message: "인증이 필요하거나 잘못된 접근입니다." });
        }

        if (followerId === followingId) {
            return res.status(400).json({ message: "자신을 팔로우할 수 없습니다." });
        }

        const existing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId }
            }
        });

        if (existing) {
            await prisma.follow.delete({
                where: {
                    followerId_followingId: { followerId, followingId }
                }
            });
            return res.json({ isFollowing: false });
        } else {
            await prisma.follow.create({
                data: { followerId, followingId }
            });
            return res.json({ isFollowing: true });
        }
    } catch (err) {
        console.error("❌ [Follow Toggle Error]:", err);
        return res.status(500).json({ message: "팔로우 처리 중 서버 오류" });
    }
};

const getFollowers = async (req, res) => {
    try {
        const targetId = Number(req.params.userId);
        const followers = await prisma.follow.findMany({
            where: { followingId: targetId },
            include: { follower: { select: { id: true, name: true, nickname: true } } }
        });
        return res.json(followers.map(f => f.follower));
    } catch (err) {
        return res.status(500).json({ message: "팔로워 목록 조회 오류" });
    }
};

const getFollowing = async (req, res) => {
    try {
        const targetId = Number(req.params.userId);
        const following = await prisma.follow.findMany({
            where: { followerId: targetId },
            include: { following: { select: { id: true, name: true, nickname: true } } }
        });
        return res.json(following.map(f => f.following));
    } catch (err) {
        return res.status(500).json({ message: "팔로잉 목록 조회 오류" });
    }
};

module.exports = {
    searchUsers,
    getUserProfile,
    toggleFollow,
    getFollowers,
    getFollowing
};