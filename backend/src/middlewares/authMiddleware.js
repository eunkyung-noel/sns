const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: '토큰이 없습니다.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // 컨트롤러에서 사용할 키 명칭: userId
        req.userId = decoded.userId;

        next();
    } catch (err) {
        console.error("인증 에러:", err.message);
        return res.status(401).json({ message: '인증 세션이 만료되었습니다.' });
    }
};

// 라우터에서 { verifyToken }으로 불러올 수 있도록 객체로 내보냄
module.exports = { verifyToken };