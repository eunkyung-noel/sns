const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller'); //컨트롤러는 이미 완성됨

// GET /users/:userId/profile : 특정 사용자 프로필 조회
router.get('/:userId/profile', userController.getUserProfile);

// GET /users/:userId/followers : 특정 사용자 팔로워 목록 조회
router.get('/:userId/followers', userController.getFollowers);

// GET /users/:userId/following : 특정 사용자 팔로잉 목록 조회
router.get('/:userId/following', userController.getFollowing);

module.exports = router;