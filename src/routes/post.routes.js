const express = require('express');
const router = express.Router();

const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 게시글 생성
router.post('/', authMiddleware.verifyToken, postController.createPost);

// 게시글 조회 (전체 게시글 목록)
router.get('/', postController.getPosts);

// 게시글 수정
router.put('/:postId', authMiddleware.verifyToken, postController.updatePost);

// 게시글 삭제
router.delete('/:postId', authMiddleware.verifyToken, postController.deletePost);

// 좋아요 토글 (POST /posts/:postId/like) - 이 부분을 추가해 주세요!
router.post('/:postId/like', authMiddleware.verifyToken, postController.toggleLike);

module.exports = router;