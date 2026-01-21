const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * [Fact] 회원가입: 나이에 따른 성인 여부 자동 설정
 */
const register = async (req, res) => {
    try {
        const { email, password, name, nickname, birthDate, age } = req.body;
        if (!email || !password || !name || !nickname) {
            return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
        }
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const userAge = age ? Number(age) : 0;

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                nickname,
                birthDate: birthDate ? new Date(birthDate) : null,
                age: userAge,
                isAdult: userAge >= 19
            }
        });
        res.status(201).json({ message: "회원가입 성공" });
    } catch (err) {
        res.status(500).json({ message: "회원가입 중 서버 오류 발생" });
    }
};

/**
 * [Fact] 로그인: 클라이언트에 성인 여부 및 기본 정보 반환
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: { id: user.id, nickname: user.nickname, isAdult: user.isAdult }
        });
    } catch (err) {
        res.status(500).json({ message: '로그인 실패' });
    }
};

/**
 * [Fact] 내 정보 조회
 */
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            include: {
                following: {
                    include: {
                        following: {
                            select: { id: true, nickname: true, profilePic: true, bio: true, isAdult: true }
                        }
                    }
                },
                followers: true,
                _count: { select: { posts: true, followers: true, following: true } }
            }
        });

        if (!user) return res.status(404).json({ message: "유저를 찾을 수 없습니다." });

        const { password, ...userWithoutPassword } = user;
        res.json({ ...userWithoutPassword, counts: user._count });
    } catch (err) {
        res.status(500).json({ message: "내 정보 로드 실패" });
    }
};

/**
 * [Fact] 프로필 수정
 */
const updateProfile = async (req, res) => {
    try {
        const { nickname, name, bio, age } = req.body;
        const updateData = { nickname, name, bio };

        if (age !== undefined) {
            const newAge = Number(age);
            updateData.age = newAge;
            updateData.isAdult = newAge >= 19;
        }

        if (req.file) {
            updateData.profilePic = `/uploads/${req.file.filename}`;
        }

        const updated = await prisma.user.update({
            where: { id: req.userId },
            data: updateData
        });

        res.json({ message: "수정됨", user: updated });
    } catch (err) {
        res.status(500).json({ message: "수정 중 오류 발생" });
    }
};

/**
 * [Fact] 유저 검색
 */
const searchUsers = async (req, res) => {
    try {
        const { term } = req.query;
        if (!term) return res.json([]);
        const users = await prisma.user.findMany({
            where: {
                OR: [{ name: { contains: term } }, { nickname: { contains: term } }],
                NOT: { id: req.userId }
            },
            select: { id: true, nickname: true, profilePic: true, isAdult: true }
        });
        res.json(users);
    } catch (err) { res.status(500).json({ message: "검색 오류" }); }
};

/**
 * [Fact] 팔로우 토글
 */
const toggleFollow = async (req, res) => {
    try {
        const { id: followingId } = req.params;
        const followerId = req.userId;
        if (followingId === followerId) return res.status(400).json({ message: "자신은 팔로우 불가" });

        const existingFollow = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId, followingId } }
        });

        if (existingFollow) {
            await prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } });
            return res.json({ followed: false });
        }

        await prisma.$transaction([
            prisma.follow.create({ data: { followerId, followingId } }),
            prisma.notification.create({ data: { type: 'FOLLOW', userId: followingId, creatorId: followerId } })
        ]);
        res.json({ followed: true });
    } catch (err) { res.status(500).json({ message: "팔로우 실패" }); }
};

/**
 * [Fact] 유저 프로필 조회
 */
const getUserProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                posts: { orderBy: { createdAt: 'desc' }, include: { _count: { select: { likes: true, comments: true } } } },
                _count: { select: { posts: true, followers: true, following: true } }
            }
        });
        if (!user) return res.status(404).json({ message: "프로필을 찾을 수 없습니다." });
        res.json({ ...user, counts: user._count });
    } catch (err) { res.status(500).json({ message: "프로필 조회 실패" }); }
};

/**
 * [Fact] 알림 목록 조회 - 게시글(post) 정보 포함하도록 수정됨
 */
const getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            include: {
                creator: { select: { id: true, nickname: true, profilePic: true } },
                // 좋아요, 댓글 알림을 위해 post 정보를 반드시 포함해야 함
                post: { select: { id: true, content: true, imageUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "알림 조회 실패" });
    }
};

/**
 * [Fact] 특정 알림 읽음 처리
 */
const markNotificationAsRead = async (req, res) => {
    try {
        await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "실패" }); }
};

/**
 * [Fact] 모든 알림 읽음 처리
 */
const markAllNotificationsAsRead = async (req, res) => {
    try {
        await prisma.notification.updateMany({ where: { userId: req.userId, isRead: false }, data: { isRead: true } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "전체 읽음 처리 실패" }); }
};

/**
 * [Fact] 비밀번호 변경
 */
const changePassword = async (req, res) => {
    try {
        const { password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({ where: { id: req.userId }, data: { password: hashedPassword } });
        res.json({ message: "변경됨" });
    } catch (err) { res.status(500).json({ message: "실패" }); }
};

module.exports = {
    register, login, getMe, searchUsers, toggleFollow,
    getUserProfile, getNotifications, markNotificationAsRead,
    markAllNotificationsAsRead, updateProfile, changePassword
};