const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// 마이페이지
router.get('/me', verifyToken, userController.getMyPage);

// 내 게시글
router.get('/me/posts', verifyToken, userController.getMyPosts);

// 프로필 수정
router.put(
    '/profile',
    verifyToken,
    upload.single('profilePic'),
    userController.updateProfile
);

// 비밀번호 변경
router.put(
    '/change-password',
    verifyToken,
    userController.changePassword
);

// 신고 내역
router.get(
    '/reports/my',
    verifyToken,
    userController.getMyReports
);

// 팔로우
router.post(
    '/:userId/follow',
    verifyToken,
    userController.toggleFollow
);

module.exports = router;
