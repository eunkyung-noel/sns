const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { email, password, name, nickname, birthDate, age } = req.body;
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                nickname,
                birthDate: birthDate ? new Date(birthDate) : null,
                age: age ? Number(age) : 0
            }
        });
        res.status(201).json({ message: "회원가입 성공" });
    } catch (err) {
        res.status(500).json({ message: "회원가입 실패" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "이메일과 비밀번호를 입력하세요." });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ message: '이메일을 확인해주세요.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: '비밀번호가 틀립니다.' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, nickname: user.nickname, name: user.name } });
    } catch (err) {
        res.status(500).json({ message: '로그인 실패' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            include: {
                followers: true,
                following: true,
                _count: { select: { posts: true, followers: true, following: true } }
            }
        });
        if (!user) return res.status(404).json({ message: "유저 없음" });
        const { password, ...userWithoutPassword } = user;
        res.status(200).json({ ...userWithoutPassword, counts: user._count });
    } catch (err) {
        res.status(500).json({ message: "정보 로드 실패" });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { term } = req.query;
        const currentUserId = req.userId;
        if (!term) return res.json([]);

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: term } },
                    { nickname: { contains: term } },
                    { email: { contains: term } }
                ],
                NOT: { id: currentUserId }
            },
            include: { followers: { where: { followerId: currentUserId } } }
        });
        res.json(users.map(user => ({
            id: user.id,
            name: user.name,
            nickname: user.nickname,
            profilePic: user.profilePic,
            isFollowing: user.followers.length > 0
        })));
    } catch (err) {
        res.status(500).json({ message: "검색 오류" });
    }
};

// [수정됨] 팔로우 시 알림 생성 로직 추가
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
            return res.json({ isFollowing: false });
        }

        await prisma.follow.create({ data: { followerId, followingId } });

        // [알림] 상대방에게 팔로우 알림 생성
        await prisma.notification.create({
            data: {
                type: 'FOLLOW',
                userId: followingId,
                creatorId: followerId
            }
        });

        res.json({ isFollowing: true });
    } catch (err) {
        res.status(500).json({ message: "팔로우 실패" });
    }
};

// [수정됨] 좋아요 유지 + 팔로우 버튼 + isMe(신고모음 버튼) 판별 추가
const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.userId;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                nickname: true,
                bio: true,
                age: true,
                profilePic: true,
                posts: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: { select: { id: true, nickname: true, profilePic: true } },
                        likes: true,
                        comments: {
                            include: {
                                author: { select: { nickname: true } },
                                likes: true
                            },
                            orderBy: { createdAt: 'asc' }
                        },
                        _count: { select: { comments: true, likes: true } }
                    }
                },
                followers: {
                    where: { followerId: currentUserId || "" }
                },
                _count: { select: { posts: true, followers: true, following: true } }
            }
        });

        if (!user) return res.status(404).json({ message: "유저 없음" });

        const formattedPosts = user.posts.map(post => ({
            ...post,
            likeCount: post._count.likes,
            commentCount: post._count.comments
        }));

        res.json({
            ...user,
            isMe: user.id === currentUserId, // [핵심] 이 값이 true여야 신고모음 버튼이 나타남
            posts: formattedPosts,
            counts: user._count,
            isFollowing: user.followers.length > 0
        });
    } catch (err) {
        res.status(500).json({ message: "조회 실패" });
    }
};

// [추가] 알림 목록 조회
const getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            include: {
                creator: { select: { nickname: true, profilePic: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: "알림 조회 실패" });
    }
};

// [추가] 알림 읽음 처리
const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: "업데이트 실패" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { nickname, name, age, bio } = req.body;
        const profilePic = req.file ? `/uploads/${req.file.filename}` : undefined;

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: {
                nickname,
                name,
                bio,
                age: age ? Number(age) : undefined,
                ...(profilePic && { profilePic })
            }
        });
        res.json({ message: "프로필이 수정되었습니다.", user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: "프로필 수정 실패" });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "현재 비밀번호가 일치하지 않습니다." });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.userId },
            data: { password: hashedPassword }
        });
        res.json({ message: "비밀번호가 변경되었습니다." });
    } catch (err) {
        res.status(500).json({ message: "비밀번호 변경 실패" });
    }
};

module.exports = {
    register,
    login,
    getMe,
    searchUsers,
    toggleFollow,
    getUserProfile,
    getNotifications,
    markNotificationAsRead,
    updateProfile,
    changePassword
};