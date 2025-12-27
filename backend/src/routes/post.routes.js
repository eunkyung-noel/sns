const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { verifyToken } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// 1. 게시글 관련
router.get('/', postController.getAllPosts); // [확인] 컨트롤러의 getAllPosts와 매칭
router.post('/', verifyToken, upload.single('image'), postController.createPost);
router.put('/:id', verifyToken, postController.updatePost);
router.delete('/:id', verifyToken, postController.deletePost);

// 2. 게시글 좋아요
router.post('/:id/like', verifyToken, postController.toggleLike);

// 3. 댓글 관련
router.post('/:id/comment', verifyToken, postController.addComment); // [주의] 컨트롤러 함수명이 addComment인지 확인

// 아래 updateComment와 deleteComment 함수가 컨트롤러에 정의되어 있는지 반드시 확인해야 합니다.
router.put('/:postId/comment/:commentId', verifyToken, postController.updateComment);
router.delete('/:postId/comment/:commentId', verifyToken, postController.deleteComment);

// 4. 댓글 좋아요
router.post('/:postId/comment/:commentId/like', verifyToken, postController.toggleCommentLike);

module.exports = router;