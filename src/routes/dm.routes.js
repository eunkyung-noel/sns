const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dm.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/:userId', verifyToken, dmController.sendDM);
router.get('/:userId', verifyToken, dmController.getDMs);

module.exports = router;