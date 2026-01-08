const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dm.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// 1. 고정 경로
router.get('/search', dmController.searchUsers);
router.get('/rooms', dmController.getChatList);

// 2. 메시지 관련 (수정/삭제)
router.put('/message/:messageId', dmController.updateMessage);
router.delete('/message/:messageId', dmController.deleteMessage);

// 3. 읽음 처리 (추가됨)
// 프론트엔드에서 api.put(`/dm/${roomId}/read`)로 호출하는 경로와 일치해야 함
router.put('/:userId/read', dmController.markAsRead);

// 4. 파라미터 경로 (가장 하단)
router.post('/:userId', dmController.sendMessage);
router.get('/:userId', dmController.getMessagesWithUser);

module.exports = router;