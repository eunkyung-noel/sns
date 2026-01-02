const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth'); // 인증 미들웨어 필수

router.get('/search', verifyToken, chatController.searchUsers);
router.get('/detail/:roomId', verifyToken, chatController.getChatDetail); // :roomId 확인

module.exports = router;