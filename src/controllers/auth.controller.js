const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 회원가입
exports.register = async (req, res) => {
    try {
        const { email, password, age } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                age
            }
        });

        res.json({ message: '회원가입 성공', userId: user.id });
    } catch (err) {
        res.status(500).json({ message: '회원가입 실패', error: err.message });
    }
};

// 로그인
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: '유저 없음' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: '비밀번호 틀림' });
        }

        const token = jwt.sign(
            { userId: user.id, age: user.age },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: '로그인 실패', error: err.message });
    }
};

// 내 정보 조회
exports.me = async (req, res) => {
    res.json({
        userId: req.user.userId,
        age: req.user.age
    });
};
