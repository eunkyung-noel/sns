const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
// 미들웨어 불러오기 (객체 구조분해 할당으로 안전하게 가져오기)
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// auth가 함수인지 객체 내의 함수인지 확인하여 처리
const auth = typeof authMiddleware === 'function' ? authMiddleware : authMiddleware.authMiddleware;

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// 서버 실행 시 컨트롤러 함수 존재 여부 강제 확인 (에러 방지용)
const checkHandler = (handler, name) => {
    if (typeof handler !== 'function') {
        console.error(`❌ 에러: ${name} 핸들러가 함수가 아닙니다. 컨트롤러 파일을 확인하세요.`);
        return (req, res) => res.status(500).json({ error: `${name} is not defined` });
    }
    return handler;
};

// 라우터 설정
router.get('/',
    checkHandler(postController.getAllPosts, 'getAllPosts')
);

router.post('/',
    auth,
    upload.single('image'),
    checkHandler(postController.createPost, 'createPost')
);

router.delete('/:id',
    auth,
    checkHandler(postController.deletePost, 'deletePost')
);

router.post('/:id/like',
    auth,
    checkHandler(postController.toggleLike, 'toggleLike')
);

router.post('/:id/comment',
    auth,
    checkHandler(postController.addComment, 'addComment')
);

module.exports = router;