const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 1. 댓글 생성 (POST /comments/:postId)
router.post('/:postId', authMiddleware.verifyToken, commentController.createComment);

// 2. 게시글의 모든 댓글 조회 (GET /comments/:postId)
router.get('/:postId', commentController.getComments);

// 3. 댓글 수정 (PUT /comments/:commentId)
router.put('/:commentId', authMiddleware.verifyToken, commentController.updateComment);

// 4. 댓글 삭제 (DELETE /comments/:commentId)
router.delete('/:commentId', authMiddleware.verifyToken, commentController.deleteComment);

module.exports = router;