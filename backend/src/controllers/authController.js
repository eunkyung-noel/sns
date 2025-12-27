const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. 회원가입
const register = async (req, res) => {
    try {
        const { email, password, username, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const finalUsername = username || name || email.split('@')[0];
        const finalName = name || username || '사용자';

        const newUser = new User({
            email,
            password: hashedPassword,
            username: finalUsername,
            name: finalName
        });

        await newUser.save();

        // ✅ [테스트 로그] 회원가입 성공 시 기록
        console.log(`[AUTH-LOG] 신규 회원가입: ${email} (${new Date().toLocaleString()})`);

        res.status(201).json({ message: '회원가입 성공' });
    } catch (err) {
        console.error("회원가입 에러 상세:", err);
        res.status(500).json({ message: '서버 에러', error: err.message });
    }
};

// 2. 로그인
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ [테스트 로그] 로그인 시도 시 기록
        console.log(`[AUTH-LOG] 로그인 시도: ${email}`);

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`[AUTH-LOG] 로그인 실패 (유저없음): ${email}`);
            return res.status(400).json({ message: '유저를 찾을 수 없습니다.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[AUTH-LOG] 로그인 실패 (비번틀림): ${email}`);
            return res.status(400).json({ message: '비밀번호가 틀립니다.' });
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // ✅ [테스트 로그] 로그인 최종 성공 기록
        console.log(`[AUTH-LOG] 로그인 성공: ${user.name} (@${user.username}) - ${new Date().toLocaleString()}`);

        res.json({
            token,
            user: {
                id: user._id.toString(),
                username: user.username,
                name: user.name
            }
        });
    } catch (err) {
        console.error("로그인 에러:", err);
        res.status(500).json({ message: '서버 에러' });
    }
};

// 3. 내 정보 가져오기
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
        res.status(200).json(user);
    } catch (error) {
        console.error("getMe 에러:", error);
        res.status(500).json({ message: "서버 오류" });
    }
};

// 4. 유저 검색
const searchUsers = async (req, res) => {
    try {
        const { term } = req.query;
        if (!term) return res.json([]);

        const users = await User.find({
            $or: [
                { name: { $regex: term, $options: 'i' } },
                { username: { $regex: term, $options: 'i' } }
            ],
            _id: { $ne: req.userId }
        }).select('_id name username profileImage');

        res.json(users);
    } catch (error) {
        console.error("searchUsers 에러:", error);
        res.status(500).json({ message: "검색 중 오류 발생" });
    }
};

module.exports = { register, login, getMe, searchUsers };