const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "토큰이 없습니다." });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey123');

        // 컨트롤러와 호환되도록 id 값 설정
        req.user = { id: decoded.userId || decoded.id };
        next();
    } catch (err) {
        res.status(401).json({ message: "인증 실패" });
    }
};