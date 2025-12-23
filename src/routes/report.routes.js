const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const postController = require('../controllers/post.controller');

// [GET] /api/posts - 목록 조회
router.get('/', auth, postController.getPosts);

// [POST] /api/posts - 등록
router.post('/', auth, upload.single('image'), postController.createPost);

// [POST] /api/posts/:id/like - 좋아요 (삭제보다 위에 있어야 함)
router.post('/:id/like', auth, postController.toggleLike);

// [DELETE] /api/posts/:id - 삭제
router.delete('/:id', auth, postController.deletePost);

module.exports = router;