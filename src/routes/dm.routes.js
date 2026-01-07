const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dm.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// [핵심 수정] POST /api/dm/:userId 형식을 지원하도록 설정
router.post('/:userId', dmController.sendMessage);
router.get('/search', dmController.searchUsers);
router.get('/rooms', dmController.getChatList);
router.get('/:userId', dmController.getMessagesWithUser);

module.exports = router;