const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * [Fact] 회원가입 로직
 * - 필수 필드 누락 시 400 에러를 반환하도록 검증 로직 강화
 */
const register = async (req, res) => {
    console.log("📥 [Register] Body:", req.body); // 디버깅용 로그
    try {
        const { email, password, name, nickname, birthDate, age } = req.body;

        if (!email || !password || !name || !nickname) {
            return res.status(400).json({ message: "필수 정보(이메일, 비밀번호, 이름, 닉네임)가 누락되었습니다." });
        }

        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                nickname,
                birthDate: birthDate ? new Date(birthDate) : null,
                age: age ? Number(age) : 0
            }
        });

        console.log("✅ 회원가입 성공:", newUser.email);
        res.status(201).json({ message: "회원가입 성공" });
    } catch (err) {
        console.error("❌ 회원가입 상세 에러:", err);
        res.status(500).json({ message: "회원가입 중 서버 오류 발생" });
    }
};

/**
 * [Fact] 로그인 로직
 * - 400 에러 발생 시 원인을 터미널에 출력하여 즉시 파악 가능하도록 수정
 */
const login = async (req, res) => {
    console.log("📥 [Login] Attempt:", req.body.email); // 디버깅용 로그
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.log("⚠️ 로그인 시도 실패: 이메일 또는 비밀번호 누락");
            return res.status(400).json({ message: "이메일과 비밀번호를 모두 입력하세요." });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log("⚠️ 로그인 시도 실패: 존재하지 않는 이메일", email);
            return res.status(400).json({ message: '등록되지 않은 이메일입니다.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("⚠️ 로그인 시도 실패: 비밀번호 불일치", email);
            return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // JWT_SECRET 확인 로직 추가 (우분투 환경 .env 로드 확인용)
        if (!process.env.JWT_SECRET) {
            console.error("❌ 서버 설정 에러: JWT_SECRET이 정의되지 않았습니다.");
            return res.status(500).json({ message: "서버 인증 설정 오류" });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        console.log("✅ 로그인 성공:", user.nickname);
        res.json({
            token,
            user: { id: user.id, nickname: user.nickname, name: user.name }
        });
    } catch (err) {
        console.error("❌ 로그인 상세 에러:", err);
        res.status(500).json({ message: '서버 내부 오류로 로그인 실패' });
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
        if (!user) return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
        const { password, ...userWithoutPassword } = user;
        res.status(200).json({ ...userWithoutPassword, counts: user._count });
    } catch (err) {
        res.status(500).json({ message: "내 정보 로드 실패" });
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
        res.status(500).json({ message: "사용자 검색 오류" });
    }
};

const toggleFollow = async (req, res) => {
    try {
        const { id: followingId } = req.params;
        const followerId = req.userId;
        if (followingId === followerId) return res.status(400).json({ message: "자신은 팔로우할 수 없습니다." });

        const existingFollow = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId, followingId } }
        });

        if (existingFollow) {
            await prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } });
            return res.json({ isFollowing: false });
        }

        await prisma.follow.create({ data: { followerId, followingId } });
        await prisma.notification.create({
            data: { type: 'FOLLOW', userId: followingId, creatorId: followerId }
        });

        res.json({ isFollowing: true });
    } catch (err) {
        res.status(500).json({ message: "팔로우 처리 실패" });
    }
};

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
                            include: { author: { select: { nickname: true } }, likes: true },
                            orderBy: { createdAt: 'asc' }
                        },
                        _count: { select: { comments: true, likes: true } }
                    }
                },
                followers: { where: { followerId: currentUserId || "" } },
                _count: { select: { posts: true, followers: true, following: true } }
            }
        });

        if (!user) return res.status(404).json({ message: "해당 유저를 찾을 수 없습니다." });

        const formattedPosts = user.posts.map(post => ({
            ...post,
            likeCount: post._count.likes,
            commentCount: post._count.comments
        }));

        res.json({
            ...user,
            isMe: user.id === currentUserId,
            posts: formattedPosts,
            counts: user._count,
            isFollowing: user.followers.length > 0
        });
    } catch (err) {
        res.status(500).json({ message: "프로필 조회 실패" });
    }
};

const getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            include: { creator: { select: { nickname: true, profilePic: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: "알림 조회 실패" });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({ where: { id }, data: { isRead: true } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: "알림 업데이트 실패" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { nickname, name, age, bio, language } = req.body;
        const profilePic = req.file ? `/uploads/${req.file.filename}` : undefined;

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: {
                nickname,
                name,
                bio,
                language,
                age: age ? Number(age) : undefined,
                ...(profilePic && { profilePic })
            }
        });
        res.json({ message: "프로필이 수정되었습니다.", user: updatedUser });
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ message: "프로필 수정 실패" });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, password } = req.body;
        const targetPassword = newPassword || password;

        if (!targetPassword) {
            return res.status(400).json({ message: "새 비밀번호가 입력되지 않았습니다." });
        }

        if (currentPassword) {
            const user = await prisma.user.findUnique({ where: { id: req.userId } });
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ message: "현재 비밀번호가 일치하지 않습니다." });
        }

        const hashedPassword = await bcrypt.hash(targetPassword, 10);
        await prisma.user.update({
            where: { id: req.userId },
            data: { password: hashedPassword }
        });
        res.json({ message: "비밀번호가 변경되었습니다." });
    } catch (err) {
        console.error("Password Change Error:", err);
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