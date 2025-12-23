const express = require('express');
const router = express.Router();
const messageController = require('../controllers/dm.controller');
const auth = require('../middlewares/authMiddleware'); // 경로 통일

// 컨트롤러 함수가 없을 경우를 대비한 안전 장치
const sendMessage = messageController.sendMessage || ((req, res) => res.status(501).send("준비 중"));
const getChatHistory = messageController.getChatHistory || ((req, res) => res.status(501).send("준비 중"));
const getChatList = messageController.getChatList || ((req, res) => res.status(501).send("준비 중"));

router.post('/send', auth, sendMessage);
router.get('/chat/:targetUserId', auth, getChatHistory);
router.get('/list', auth, getChatList);

module.exports = router;