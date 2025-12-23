const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const messageController = require('../controllers/message.controller');

// DM 목록 가져오기
router.get('/list', auth, messageController.getChatList);

// 특정 유저와의 대화 내역 및 읽음 처리
router.get('/:userId', auth, messageController.getMessagesWithUser);

// 특정 유저에게 메시지 보내기
router.post('/:userId', auth, messageController.sendMessage);

module.exports = router;