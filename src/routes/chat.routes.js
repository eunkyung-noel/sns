const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

// [Fact] 컨트롤러에 실제 존재하는 함수만 연결해야 에러가 나지 않습니다.
// 1. 상세 내역 조회
router.get('/detail/:roomId', verifyToken, chatController.getChatDetail);

// 2. 메시지 전송
router.post('/send', verifyToken, chatController.sendDM);

module.exports = router;