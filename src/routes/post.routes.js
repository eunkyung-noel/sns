const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, postController.createPost);
router.get('/', authMiddleware, postController.getPosts);

module.exports = router;
