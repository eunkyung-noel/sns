const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dm.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/search', verifyToken, dmController.searchUsers);
router.get('/rooms', verifyToken, dmController.getChatRooms);
router.get('/detail/:partnerId', verifyToken, dmController.getChatDetail);
router.post('/send', verifyToken, dmController.sendDM);

module.exports = router;