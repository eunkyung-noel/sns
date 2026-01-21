const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * 1. 마이페이지 기본 조회
 * GET /users/me
 */
const getMyPage = async (req, res) => {
    try {
        const userId = req.userId || req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                bio: true,
                profilePic: true,
                birthDate: true,
                age: true,
                language: true,
                isPrivate: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: '사용자 없음' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '마이페이지 조회 실패' });
    }
};

/**
 * 2. 프로필 수정
 * PATCH /users/me
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId || req.user.id;
        const { nickname, bio, language, isPrivate } = req.body;

        let profilePic;
        if (req.file) {
            profilePic = `/uploads/${req.file.filename}`;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                nickname,
                bio,
                language: language ?? 'ko',
                isPrivate: isPrivate === 'true' || isPrivate === true,
                ...(profilePic && { profilePic })
            },
            select: {
                id: true,
                nickname: true,
                bio: true,
                profilePic: true,
                language: true,
                isPrivate: true
            }
        });

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '프로필 수정 실패' });
    }
};

/**
 * 3. 비밀번호 변경
 * PATCH /users/me/password
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.userId || req.user.id;
        const { currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: '사용자 없음' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ message: '비밀번호 변경 완료' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '비밀번호 변경 실패' });
    }
};

/**
 * 4. 내가 올린 게시글
 * GET /users/me/posts
 */
const getMyPosts = async (req, res) => {
    try {
        const userId = req.userId || req.user.id;

        const posts = await prisma.post.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '내 게시글 조회 실패' });
    }
};

/**
 * 5. 신고 내역
 * GET /users/me/reports
 */
const getMyReports = async (req, res) => {
    try {
        const userId = req.userId || req.user.id;

        const reports = await prisma.report.findMany({
            where: { userId },
            include: {
                post: {
                    select: {
                        id: true,
                        content: true,
                        imageUrl: true,
                        author: { select: { nickname: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '신고 내역 조회 실패' });
    }
};

/**
 * 6. 팔로우 토글
 * POST /users/:userId/follow
 */
const toggleFollow = async (req, res) => {
    try {
        const followingId = req.params.userId;
        const followerId = req.userId || req.user.id;

        if (followingId === followerId) {
            return res.status(400).json({ message: '자기 자신은 팔로우 불가' });
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
        } else {
            await prisma.follow.create({
                data: { followerId, followingId }
            });
        }

        const followerCount = await prisma.follow.count({
            where: { followingId }
        });

        res.json({
            isFollowing: !existing,
            followerCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '팔로우 처리 실패' });
    }
};

module.exports = {
    getMyPage,
    updateProfile,
    changePassword,
    getMyPosts,
    getMyReports,
    toggleFollow
};
