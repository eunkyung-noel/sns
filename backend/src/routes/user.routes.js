const express = require('express');
const router = express.Router();

// [수정 완료] 실제 파일명인 user.controller 를 정확히 지정
const userController = require('../controllers/user.controller');

// [수정 완료] 실제 폴더/파일명인 middlewares/authMiddleware 를 정확히 지정
const { verifyToken } = require('../middlewares/authMiddleware');

// 1. 유저 검색
router.get('/search', verifyToken, userController.searchUsers);

// 2. 특정 사용자 프로필 조회
router.get('/:userId', userController.getUserProfile);

// 3. 팔로우 토글
router.post('/:userId/follow', verifyToken, userController.toggleFollow);

// 4. 팔로워/팔로잉 목록 조회
router.get('/:userId/followers', userController.getFollowers);
router.get('/:userId/following', userController.getFollowing);

module.exports = router;