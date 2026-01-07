const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);
router.get('/search', verifyToken, authController.searchUsers);
router.post('/follow/:id', verifyToken, authController.toggleFollow);
router.put('/profile', verifyToken, upload.single('profilePic'), authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);
router.get('/profile/:id', verifyToken, authController.getUserProfile);

module.exports = router;