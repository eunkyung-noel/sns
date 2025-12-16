const express = require('express');
const router = express.Router();

const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 게시글 생성
router.post(
    '/',
    authMiddleware.verifyToken,
    postController.createPost
);

// 게시글 조회
router.get(
    '/',
    postController.getPosts
);

// 게시글 수정
router.put(
    '/:id',
    authMiddleware.verifyToken,
    postController.updatePost
);

module.exports = router;