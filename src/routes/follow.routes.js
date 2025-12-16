// src/routes/follow.routes.js

const express = require('express');
const router = express.Router();
const followController = require('../controllers/follow.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/:userId', verifyToken, followController.toggleFollow);

module.exports = router;