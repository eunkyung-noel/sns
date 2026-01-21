const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dm.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

// 모든 경로는 인증 필요
router.use(verifyToken);

/**
 * [Fact] 고정 경로 라우터
 * :userId 처럼 변수가 있는 경로보다 반드시 위에 배치해야 합니다.
 */

// 1. 유저 검색 및 채팅방 목록
if (dmController.searchUsers) router.get('/search', dmController.searchUsers);
if (dmController.getChatList) router.get('/rooms', dmController.getChatList);

// 2. 좋아요 및 팔로우 토글 (버튼 작동 핵심)
if (dmController.toggleMessageLike) {
    router.put('/like/:messageId', dmController.toggleMessageLike);
}
if (dmController.toggleFollow) {
    router.post('/follow/:userId', dmController.toggleFollow);
}

// 3. 메시지 수정 및 삭제
if (dmController.updateMessage) router.put('/message/:messageId', dmController.updateMessage);
if (dmController.deleteMessage) router.delete('/message/:messageId', dmController.deleteMessage);

/**
 * [Fact] 동적 파라미터 경로
 * :userId가 포함된 경로는 항상 맨 아래에 위치해야 합니다.
 */

// 4. 읽음 처리
if (dmController.markAsRead) router.put('/:userId/read', dmController.markAsRead);

// 5. 특정 유저와의 대화 조회 및 메시지 전송
if (dmController.getMessagesWithUser) router.get('/:userId', dmController.getMessagesWithUser);
if (dmController.sendMessage) router.post('/:userId', dmController.sendMessage);

module.exports = router;