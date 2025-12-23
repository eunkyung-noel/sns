const express = require('express');
const router = express.Router();
const likeController = require('../controllers/like.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/:postId', verifyToken, likeController.toggleLike);

module.exports = router;
