const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 신고 생성 (로그인 필수)
router.post('/', authMiddleware, reportController.createReport);

module.exports = router;
