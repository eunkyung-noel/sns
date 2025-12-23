const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// 1. auth 미들웨어 검증
const auth = typeof authMiddleware === 'function' ? authMiddleware : authMiddleware.authMiddleware;

// 2. 파일 업로드 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// 3. 핸들러 검증 함수
const v = (handler) => typeof handler === 'function' ? handler : (req, res) => res.status(500).json({ error: "Handler missing" });

// --- 라우트 설정 ---
router.get('/', v(postController.getAllPosts));
router.post('/', auth, upload.single('image'), v(postController.createPost));
router.post('/:id/like', auth, v(postController.toggleLike));
router.post('/:id/comment', auth, v(postController.addComment));
router.delete('/:id', auth, v(postController.deletePost));

module.exports = router;