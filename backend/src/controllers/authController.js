const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. 회원가입
const register = async (req, res) => {
    try {
        const { email, password, username, name } = req.body;
        if (!email || !password) return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                nickname: username || name || email.split('@')[0],
                name: name || username || '사용자',
                birthDate: new Date(),
                age: 0
            }
        });
        res.status(201).json({ message: '회원가입 성공' });
    } catch (err) {
        console.error("회원가입 에러:", err);
        res.status(500).json({ message: '서버 에러' });
    }
};

// 2. 로그인
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH-LOG] 로그인 시도: ${email}`);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ message: '유저를 찾을 수 없습니다.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: '비밀번호가 틀립니다.' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: { id: user.id, nickname: user.nickname, name: user.name }
        });
    } catch (err) {
        console.error("로그인 에러:", err);
        res.status(500).json({ message: '서버 에러' });
    }
};

// 3. 내 정보 조회
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err) {
        console.error("getMe 에러:", err);
        res.status(500).json({ message: "서버 오류" });
    }
};

// 4. 유저 검색
const searchUsers = async (req, res) => {
    try {
        const { term } = req.query;
        if (!term) return res.json([]);
        const users = await prisma.user.findMany({
            where: {
                OR: [{ name: { contains: term } }, { nickname: { contains: term } }],
                NOT: { id: req.userId }
            },
            select: { id: true, name: true, nickname: true }
        });
        res.json(users);
    } catch (err) {
        console.error("searchUsers 에러:", err);
        res.status(500).json({ message: "검색 오류" });
    }
};

// 반드시 함수들을 객체로 묶어서 내보내야 함
module.exports = { register, login, getMe, searchUsers };