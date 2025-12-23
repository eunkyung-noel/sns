const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');

// authMiddleware 설정 (미들웨어 구조에 따라 확인 필요)
const authMiddleware = auth.authMiddleware ? auth.authMiddleware : auth;

// 1. 유저 검색 (상단에 위치해야 :userId와 충돌하지 않음)
router.get('/search', userController.searchUsers);

// 2. 특정 사용자 프로필 조회
router.get('/:userId', userController.getUserProfile);

// 3. 팔로우 토글 (좋아요처럼 눌렀다 떼었다 하는 기능)
router.post('/:userId/follow', authMiddleware, userController.toggleFollow);

// 4. 팔로워/팔로잉 목록 조회
router.get('/:userId/followers', userController.getFollowers);
router.get('/:userId/following', userController.getFollowing);

module.exports = router;