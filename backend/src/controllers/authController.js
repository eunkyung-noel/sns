const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 회원가입 로직
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. 필수 값 존재 여부 확인
        if (!name || !email || !password) {
            return res.status(400).json({ message: "이름, 이메일, 비밀번호를 모두 입력해주세요." });
        }

        // 2. 이메일 중복 체크
        const existingUser = await User.findOne({ email: email.trim() });
        if (existingUser) {
            return res.status(400).json({ message: "이미 가입된 이메일입니다." });
        }

        // 3. 비밀번호 암호화
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. DB 저장 (User.js 스키마 필드와 완벽 일치)
        const newUser = new User({
            name: name.trim(),
            email: email.trim(),
            password: hashedPassword,
            profileImage: '',
            bio: '',
            followers: [],
            following: []
        });

        await newUser.save();
        res.status(201).json({ message: "회원가입이 완료되었습니다!" });

    } catch (error) {
        console.error("❌ Register Controller Error:", error.message);
        res.status(500).json({ message: "서버 오류가 발생했습니다.", error: error.message });
    }
};

// 로그인 로직
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "이메일과 비밀번호를 입력해주세요." });
        }

        const user = await User.findOne({ email: email.trim() });
        if (!user) {
            return res.status(401).json({ message: "존재하지 않는 사용자입니다." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            userId: user._id,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("❌ Login Controller Error:", error.message);
        res.status(500).json({ message: "로그인 처리 중 서버 오류" });
    }
};