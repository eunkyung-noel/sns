const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

// [수정] 파일명이 upload.middleware.js 이므로 경로를 정확히 일치시킵니다.
const upload = require('../middlewares/upload.middleware');

// --- 게시글 관련 라우물 ---
router.get('/', postController.getAllPosts);

// multer(upload) 미들웨어 적용
router.post('/', verifyToken, upload.single('image'), postController.createPost);

router.put('/:id', verifyToken, postController.updatePost);
router.delete('/:id', verifyToken, postController.deletePost);
router.post('/:id/like', verifyToken, postController.toggleLike);

// --- 댓글 관련 라우트 ---
router.post('/:id/comments', verifyToken, postController.addComment);
router.post('/comments/:commentId/like', verifyToken, postController.toggleCommentLike);
router.put('/comments/:commentId', verifyToken, postController.updateComment);
router.delete('/comments/:commentId', verifyToken, postController.deleteComment);

module.exports = router;