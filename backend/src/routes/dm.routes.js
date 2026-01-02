const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dm.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/list', dmController.getChatList);
router.get('/:userId', dmController.getMessagesWithUser);
router.post('/:userId', dmController.sendMessage);

module.exports = router;