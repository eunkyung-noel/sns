const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

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

        res.json({
            message: '회원가입 성공',
            user: {
                id: user.id,
                email: user.email,
                age: user.age
            }
        });
    } catch (err) {
        res.status(500).json({
            message: '회원가입 실패',
            error: err.message
        });
    }
};

// 로그인
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ message: '유저 없음' });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ message: '비밀번호 틀림' });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: '로그인 성공',
            token
        });
    } catch (err) {
        res.status(500).json({
            message: '로그인 실패',
            error: err.message
        });
    }
};

// 내 정보
exports.me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                age: true,
                createdAt: true
            }
        });

        res.json(user);
    } catch (err) {
        res.status(500).json({
            message: '유저 정보 조회 실패',
            error: err.message
        });
    }
};
