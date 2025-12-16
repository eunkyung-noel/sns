const jwt = require('jsonwebtoken');

// 1. JWT 토큰 검증 미들웨어
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
        // 3. 토큰 검증 및 유저 정보 저장
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // 4. 다음 미들웨어로 이동
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: '토큰이 만료되었습니다. 다시 로그인하세요.' });
        }
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

// 2. 관리자 권한 확인 미들웨어
exports.checkAdmin = (req, res, next) => {
    // req.user는 verifyToken을 통과해야 생성됩니다.
    // 데이터베이스에서 is_admin 필드가 true인 사용자만 관리자로 간주합니다.
    if (req.user && req.user.is_admin) {
        next(); // 관리자면 통과
    } else {
        // 관리자가 아니거나 req.user가 없으면 403 Forbidden 응답
        res.status(403).json({ message: '접근 권한이 없습니다. 관리자만 접근 가능합니다.' });
    }
};