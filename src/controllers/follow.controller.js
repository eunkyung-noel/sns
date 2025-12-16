// src/controllers/follow.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.toggleFollow = async (req, res) => {
    const followerId = req.user.userId;
    const followingId = parseInt(req.params.userId);

    if (isNaN(followingId) || followerId === followingId) {
        return res.status(400).json({ message: '유효하지 않은 요청입니다.' });
    }

    try {
        const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
        if (!targetUser) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: followerId,
                    followingId: followingId,
                },
            },
        });

        let isFollowing;
        let message;

        if (existingFollow) {
            await prisma.follow.delete({ where: { id: existingFollow.id } });
            isFollowing = false;
            message = `${targetUser.name}님을 언팔로우했습니다.`;
        } else {
            await prisma.follow.create({
                data: { followerId, followingId },
            });
            isFollowing = true;
            message = `${targetUser.name}님을 팔로우했습니다.`;
        }

        res.status(200).json({ message, isFollowing });
    } catch (error) {
        res.status(500).json({ message: '팔로우 처리 중 서버 오류가 발생했습니다.' });
    }
};