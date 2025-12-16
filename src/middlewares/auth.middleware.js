const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // 1. 토큰 존재 여부 확인
    if (!authHeader) {
        return res.status(401).json({ message: '액세스 토큰이 누락되었습니다.' });
    }

    // 2. Bearer 형식 확인
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '토큰 형식이 잘못되었습니다. Bearer 형식을 사용해야 합니다.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 3. 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. 요청 객체에 유저 정보 저장
        req.user = decoded;

        // 5. 다음으로 이동
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: '토큰이 만료되었습니다. 다시 로그인하세요.' });
        }

        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
};