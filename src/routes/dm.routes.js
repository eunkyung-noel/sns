const express = require('express');
const router = express.Router();

const dmController = require('../controllers/dm.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post(
    '/',
    authMiddleware.verifyToken,
    dmController.sendDM
);

module.exports = router;
