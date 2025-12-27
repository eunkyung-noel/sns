const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 1. 회원가입 & 로그인 (공개 경로)
router.post('/register', authController.register);
router.post('/login', authController.login);

// 2. 내 정보 조회 (인증 필요)
router.get('/me', verifyToken, authController.getMe);

// 3. 유저 검색 (인증 필요)
router.get('/search', verifyToken, authController.searchUsers);

module.exports = router;