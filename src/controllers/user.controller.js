// src/controllers/user.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. 사용자 프로필 조회
exports.getUserProfile = async (req, res) => {
    // URL 파라미터에서 userId를 가져옵니다.
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
        return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                age: true,
                isMinor: true,
                bio: true,           // 자기소개
                profileImageUrl: true, // 프로필 사진
                // 팔로잉/팔로워 수 카운트
                _count: {
                    select: {
                        followers: true, // 나를 팔로우하는 사람 수
                        following: true, // 내가 팔로우하는 사람 수
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error('프로필 조회 오류:', error);
        res.status(500).json({ message: '프로필 조회 중 서버 오류가 발생했습니다.' });
    }
};

// 2. 특정 사용자의 팔로워 목록 조회 (나를 팔로우하는 사람)
exports.getFollowers = async (req, res) => {
    // URL 파라미터에서 userId를 가져옵니다.
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
        return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
    }

    try {
        const followers = await prisma.follow.findMany({
            where: { followingId: userId }, // 내가 followingId (대상)인 경우: 나를 팔로우하는 사람들(follower)
            select: {
                follower: {
                    select: { id: true, name: true, profileImageUrl: true }
                }
            },
        });

        // 필요한 정보만 추출하여 배열로 반환
        res.status(200).json(followers.map(f => f.follower));

    } catch (error) {
        console.error('팔로워 목록 조회 오류:', error);
        res.status(500).json({ message: '팔로워 목록 조회 중 서버 오류가 발생했습니다.' });
    }
};

// 3. 특정 사용자의 팔로잉 목록 조회 (내가 팔로우하는 사람)
exports.getFollowing = async (req, res) => {
    // URL 파라미터에서 userId를 가져옵니다.
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
        return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
    }

    try {
        const following = await prisma.follow.findMany({
            where: { followerId: userId }, // 내가 followerId (주체)인 경우: 내가 팔로우하는 사람들(following)
            select: {
                following: {
                    select: { id: true, name: true, profileImageUrl: true }
                }
            },
        });

        // 필요한 정보만 추출하여 배열로 반환
        res.status(200).json(following.map(f => f.following));

    } catch (error) {
        console.error('팔로잉 목록 조회 오류:', error);
        res.status(500).json({ message: '팔로잉 목록 조회 중 서버 오류가 발생했습니다.' });
    }
};