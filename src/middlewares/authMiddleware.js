const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        // 1. 토큰 존재 여부 확인
        if (!token) {
            console.error("❌ [401] 요청 헤더에 토큰이 누락되었습니다.");
            return res.status(401).json({ message: '인증 토큰이 없습니다.' });
        }

        // 2. JWT 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. ID 할당 (기존 컨트롤러와의 호환성을 위해 req.userId 사용)
        // Prisma 스키마가 UUID(String)이므로 여기서 별도의 변환을 하지 않습니다.
        req.userId = decoded.userId;

        next();
    } catch (err) {
        // 토큰 만료(TokenExpiredError) 또는 변조 에러 처리
        console.error("❌ [401] 인증 실패:", err.message);
        return res.status(401).json({
            message: '인증 세션이 만료되었거나 유효하지 않습니다.',
            error: err.message
        });
    }
};

// 라우터에서 { verifyToken }으로 불러오도록 객체로 내보냄
module.exports = { verifyToken };