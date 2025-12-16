const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// 보호된 API
router.get('/me', authMiddleware.verifyToken, authController.me);

module.exports = router;