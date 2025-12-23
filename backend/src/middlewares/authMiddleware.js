const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "인증 토큰이 없습니다." });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey123');

        req.user = { id: decoded.userId || decoded.id };
        next();
    } catch (err) {
        console.error("[인증 실패]:", err.message);
        res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
};